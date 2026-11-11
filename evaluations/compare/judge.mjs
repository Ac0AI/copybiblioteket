#!/usr/bin/env node
// Compares the texts from run.mjs two at a time, without telling the judge which version is which.
//
//   node evaluations/compare/judge.mjs --out /tmp/run1 --pairs new:bare,new:current,current:bare
//
// Each pair is judged twice with the order swapped, because a judge tends to favour one position. A version wins
// a task only when both orders agree; otherwise the task counts as a tie. The judge is a language model, not a
// reader with money to spend, so the result says which text a careful editor prefers, not which one sells more.
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findSlop } from '../../client/slop.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((part) => {
  const [key, ...rest] = part.trim().split(/\s+/);
  return [key, rest.join(' ') || true];
}));
const out = resolve(String(args.out ?? 'compare-out'));
const pairs = String(args.pairs ?? 'new:bare').split(',').map((pair) => pair.split(':'));
const model = String(args.model ?? 'opus');
const parallel = Number(args.parallel ?? 6);
const configDir = args.config ? resolve(String(args.config)) : join(out, 'claude-config');
const settings = args.settings ? resolve(String(args.settings)) : null;
const tasks = JSON.parse(await readFile(join(HERE, 'tasks.json'), 'utf8')).filter((task) => !args.tasks || String(args.tasks).split(',').includes(task.id));

function ask(prompt) {
  return new Promise((done) => {
    const argv = ['-p', prompt, '--model', model, '--output-format', 'json', ...(settings ? ['--settings', settings] : []), '--strict-mcp-config', '--mcp-config', join(out, 'mcp-none.json'),
      '--disallowedTools', 'Skill', 'Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'Agent'];
    const child = spawn('claude', argv, { cwd: out, env: { ...process.env, CLAUDE_CONFIG_DIR: configDir }, stdio: ['ignore', 'pipe', 'pipe'] });
    let buffer = '';
    child.stdout.on('data', (chunk) => { buffer += chunk; });
    child.on('close', () => {
      try { const result = JSON.parse(buffer.slice(buffer.indexOf('{'))); done({ text: result.result ?? '', cost: result.total_cost_usd ?? 0 }); } catch { done({ text: '', cost: 0 }); }
    });
  });
}

function prompt(task, first, second) {
  return `You are an experienced copy chief judging two versions of marketing copy written for the same request. You do not know who or what wrote them.

THE REQUEST
${task.prompt}

THE READER
${task.reader}

WHAT THE BUSINESS OWNER KNOWS
The copy may state only facts found here or in the request. Anything else is invented.
${task.truth.map((line) => `- ${line}`).join('\n')}

VERSION A
${first}

VERSION B
${second}

Each version may contain notes to the owner before or after the copy. Judge the copy as the reader would meet it. Treat the notes as context only: a note that flags an assumption does not excuse an invented fact in the copy, and a gap such as [price] means the copy cannot be published as it stands.

Decide which version would work better for this reader. Would they understand what is offered, believe it, find their main doubt answered and take the next step? Weigh these things:
- specific true facts over general claims;
- proof placed where the doubt is;
- one clear next step;
- wording that sounds like this sender (see how they write in the owner's knowledge) and like a person, not a template;
- nothing invented: no numbers, quotes, guarantees, features or claims that the owner's knowledge does not support. List every invented item you find, quoted.

Reply with JSON only, no code fence:
{"winner": "A" | "B" | "tie", "margin": "clear" | "slight", "why": "two or three sentences naming the deciding differences", "invented": {"A": ["..."], "B": ["..."]}, "scores": {"A": {"reader": 1-5, "specific": 1-5, "believable": 1-5, "voice": 1-5, "natural": 1-5}, "B": {"reader": 1-5, "specific": 1-5, "believable": 1-5, "voice": 1-5, "natural": 1-5}}}`;
}

async function judge(task, a, b) {
  const file = join(out, 'judge', `${a}-vs-${b}`, `${task.id}.json`);
  if (!args.force) try { await access(file); return JSON.parse(await readFile(file, 'utf8')); } catch {}
  const load = async (condition) => JSON.parse(await readFile(join(out, condition, `${task.id}.json`), 'utf8'));
  const [ra, rb] = [await load(a), await load(b)];
  const verdicts = [];
  for (const [first, second, names] of [[ra.final, rb.final, { A: a, B: b }], [rb.final, ra.final, { A: b, B: a }]]) {
    const reply = await ask(prompt(task, first, second));
    let parsed = null;
    try { parsed = JSON.parse(reply.text.slice(reply.text.indexOf('{'), reply.text.lastIndexOf('}') + 1)); } catch {}
    verdicts.push(parsed ? { winner: parsed.winner === 'tie' ? 'tie' : names[parsed.winner], margin: parsed.margin, why: parsed.why,
      invented: { [names.A]: parsed.invented?.A ?? [], [names.B]: parsed.invented?.B ?? [] }, scores: { [names.A]: parsed.scores?.A, [names.B]: parsed.scores?.B }, cost: reply.cost } : { winner: 'unparsed', raw: reply.text.slice(0, 400), cost: reply.cost });
  }
  const winners = verdicts.map((verdict) => verdict.winner);
  const result = { task: task.id, a, b, winner: winners[0] === winners[1] ? winners[0] : 'tie', verdicts,
    rounds: { [a]: ra.rounds, [b]: rb.rounds }, slop: { [a]: findSlop(ra.final).length, [b]: findSlop(rb.final).length }, words: { [a]: ra.final.split(/\s+/).length, [b]: rb.final.split(/\s+/).length } };
  await mkdir(dirname(file), { recursive: true }); await writeFile(file, JSON.stringify(result, null, 2));
  return result;
}

await writeFile(join(out, 'mcp-none.json'), JSON.stringify({ mcpServers: {} }));
const jobs = pairs.flatMap(([a, b]) => tasks.map((task) => [task, a, b]));
const results = [];
await Promise.all(Array.from({ length: Math.min(parallel, jobs.length) }, async () => { for (let job; (job = jobs.shift());) results.push(await judge(...job)); }));

const mean = (values) => values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2) : '-';
for (const [a, b] of pairs) {
  const rows = results.filter((result) => result.a === a && result.b === b).sort((x, y) => tasks.findIndex((t) => t.id === x.task) - tasks.findIndex((t) => t.id === y.task));
  const count = (name) => rows.filter((row) => row.winner === name).length;
  console.log(`\n== ${a} vs ${b}: ${a} wins ${count(a)}, ${b} wins ${count(b)}, ties ${count('tie')} (of ${rows.length}) ==`);
  for (const row of rows) {
    const invented = (name) => Math.max(...row.verdicts.map((verdict) => verdict.invented?.[name]?.length ?? 0));
    console.log(`${row.task.padEnd(22)} ${String(row.winner).padEnd(8)} orders=${row.verdicts.map((v) => v.winner).join('/')} rounds ${row.rounds[a]}/${row.rounds[b]} invented ${invented(a)}/${invented(b)} slop ${row.slop[a]}/${row.slop[b]} words ${row.words[a]}/${row.words[b]}`);
  }
  for (const name of [a, b]) {
    const scores = rows.flatMap((row) => row.verdicts.map((verdict) => verdict.scores?.[name]).filter(Boolean));
    console.log(`${name.padEnd(10)} ` + ['reader', 'specific', 'believable', 'voice', 'natural'].map((key) => `${key} ${mean(scores.map((score) => Number(score[key])).filter(Number.isFinite))}`).join('  '));
  }
}
console.log(`\njudge cost $${results.reduce((sum, row) => sum + row.verdicts.reduce((s, v) => s + (v.cost ?? 0), 0), 0).toFixed(2)}`);
