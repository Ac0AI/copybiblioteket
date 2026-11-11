#!/usr/bin/env node
// Runs the same writing tasks with and without Sigge, so the texts can be compared.
//
// Each task is a short request, the way people actually type it, plus what the business owner knows but has not
// said. A simulated owner answers questions from that knowledge and nothing else. A version of Sigge that asks the
// right questions therefore gets facts that a version that just writes never sees, which is what happens in real use.
//
//   node evaluations/compare/run.mjs --out /tmp/run1 --conditions bare,current,new --current-root /path/to/main
//
// Conditions: bare (no Sigge), current (the plugin and server in --current-root), new (this checkout),
// new+brand (this checkout, after a brand file has been set up in the working folder).
// Needs the claude CLI. Then run judge.mjs on the same --out folder.
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const args = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((part) => {
  const [key, ...rest] = part.trim().split(/\s+/);
  return [key, rest.join(' ') || true];
}));
const out = resolve(String(args.out ?? 'compare-out'));
const conditions = String(args.conditions ?? 'bare,new').split(',');
const model = String(args.model ?? 'sonnet');
const parallel = Number(args.parallel ?? 6);
const maxRounds = Number(args.rounds ?? 2);
const configDir = args.config ? resolve(String(args.config)) : join(out, 'claude-config');
const settings = args.settings ? resolve(String(args.settings)) : null;
const tasks = JSON.parse(await readFile(join(HERE, 'tasks.json'), 'utf8')).filter((task) => !args.tasks || String(args.tasks).split(',').includes(task.id));

function claude(prompt, { cwd, extra = [], resume }) {
  return new Promise((done) => {
    const argv = ['-p', prompt, '--model', model, '--output-format', 'stream-json', '--verbose', ...(settings ? ['--settings', settings] : []), ...(resume ? ['--resume', resume] : []), ...extra];
    const child = spawn('claude', argv, { cwd, env: { ...process.env, CLAUDE_CONFIG_DIR: configDir }, stdio: ['ignore', 'pipe', 'pipe'] });
    let buffer = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), 420000);
    child.stdout.on('data', (chunk) => { buffer += chunk; });
    child.on('close', () => {
      clearTimeout(timer);
      const tools = []; let result = null;
      for (const line of buffer.split('\n')) {
        let event; try { event = JSON.parse(line); } catch { continue; }
        if (event.type === 'assistant') for (const part of event.message.content ?? []) if (part.type === 'tool_use') tools.push(part.name === 'Skill' ? `Skill:${part.input.skill}` : part.name);
        if (event.type === 'result') result = event;
      }
      done({ text: result?.result ?? '', session: result?.session_id, cost: result?.total_cost_usd ?? 0, seconds: Math.round((result?.duration_ms ?? 0) / 1000), tools, failed: !result || result.is_error });
    });
  });
}

const noMcp = join(out, 'mcp-none.json');
async function mcpFile(root, name) {
  const file = join(out, `mcp-${name}.json`);
  await writeFile(file, JSON.stringify({ mcpServers: { sigge: { command: 'node', args: [join(root, 'node_modules/tsx/dist/cli.mjs'), join(root, 'copy/mcp.ts')] } } }));
  return file;
}
// The copy has to arrive in the conversation, the way it does in a chat, so that it can be compared. Without this a
// coding assistant writes a landing page as an HTML file and answers with a summary of it. Setting up a brand file
// is the one conversation that may save a file.
const baseTools = ['Read', 'Bash', 'Glob', 'Grep'];
async function writerFlags(condition, { files = false } = {}) {
  const kind = condition.replace('+brand', '');
  const allowed = files ? [...baseTools, 'Write', 'Edit'] : baseTools, denied = files ? [] : ['Write', 'Edit', 'NotebookEdit'];
  if (kind === 'bare') return ['--strict-mcp-config', '--mcp-config', noMcp, '--allowedTools', ...allowed, '--disallowedTools', 'Skill', ...denied];
  const root = kind === 'current' ? resolve(String(args['current-root'])) : REPO;
  return ['--plugin-dir', join(root, 'plugins/sigge'), '--strict-mcp-config', '--mcp-config', await mcpFile(root, kind), '--allowedTools', ...allowed, 'Skill', 'mcp__sigge', ...(denied.length ? ['--disallowedTools', ...denied] : [])];
}
const plain = ['--strict-mcp-config', '--mcp-config', noMcp, '--disallowedTools', 'Skill', 'Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'Agent'];

// The owner behaves like a busy person: answers what is asked, corrects what is wrong, and volunteers nothing.
// That is what makes asking worth something. A writer that invents gets corrected but is not handed the good
// material for free, and a writer that asks for a customer's words gets them.
async function owner(task, assistantText) {
  const swedish = task.language === 'sv';
  const prompt = [
    swedish
      ? 'Du spelar en företagare som har bett en AI-assistent om en text. Du har ont om tid. Nedan står allt du vet om din verksamhet, och sist står assistentens senaste svar.'
      : 'You are playing a business owner who asked an AI assistant for a piece of copy. You are short on time. Below is everything you know about your business, followed by the assistant’s latest reply.',
    swedish
      ? ['Regler, i den här ordningen:',
        '1. Ställer assistenten frågor: svara kort och vardagligt på just de frågorna, med sådant som står i det du vet. Ber den om ett röstprov, ett kundomdöme eller en befintlig text, klistra in det ordagrant. Vet du inte, säg det.',
        '2. Har assistenten lämnat luckor som [pris]: fyll i dem du kan, och inget annat.',
        '3. Påstår texten något som är fel eller som ni inte erbjuder: säg vad som är fel, en rad per sak, med rätt uppgift om det är en uppgift som är fel. Lägg inte till något annat.',
        '4. Annars: svara med exakt ordet KLAR och inget annat.',
        'Bjud aldrig på uppgifter, omdömen eller röstprov som ingen har frågat efter. Du svarar som en människa skulle göra i en chatt, inte med en lista över allt du vet.'].join('\n')
      : ['Rules, in this order:',
        '1. If the assistant asks questions: answer those questions briefly and plainly, with what is in your knowledge. If it asks for a voice sample, a customer review or an existing text, paste it word for word. If you do not know, say so.',
        '2. If the assistant left gaps such as [price]: fill the ones you can, and nothing else.',
        '3. If the copy states something that is wrong or that you do not offer: say what is wrong, one line each, with the right fact if a fact is wrong. Add nothing else.',
        '4. Otherwise: reply with exactly the word DONE and nothing else.',
        'Never volunteer facts, reviews or voice samples that nobody asked for. You answer the way a person would in a chat, not with a list of everything you know.'].join('\n'),
    (swedish ? 'DET DU VET:\n' : 'WHAT YOU KNOW:\n') + task.truth.map((line) => `- ${line}`).join('\n'),
    (swedish ? 'DIN URSPRUNGLIGA BESTÄLLNING:\n' : 'YOUR ORIGINAL REQUEST:\n') + task.prompt,
    (swedish ? 'ASSISTENTENS SENASTE SVAR:\n' : 'THE ASSISTANT’S LATEST REPLY:\n') + assistantText,
  ].join('\n\n');
  const reply = await claude(prompt, { cwd: out, extra: plain });
  const text = reply.text.trim();
  return { text, done: /^(KLAR|DONE)\b/i.test(text) || !text, cost: reply.cost };
}

async function converse(task, condition, cwd, firstPrompt, flags) {
  const turns = [{ role: 'owner', text: firstPrompt }], tools = []; let cost = 0, seconds = 0, session, rounds = 0, failed = false;
  let reply = await claude(firstPrompt, { cwd, extra: flags });
  for (;;) {
    session = reply.session ?? session; cost += reply.cost; seconds += reply.seconds; tools.push(...reply.tools); failed ||= reply.failed;
    turns.push({ role: 'assistant', text: reply.text });
    if (failed || rounds >= maxRounds) break;
    const answer = await owner(task, reply.text); cost += answer.cost;
    if (answer.done) break;
    rounds += 1; turns.push({ role: 'owner', text: answer.text });
    reply = await claude(answer.text, { cwd, extra: flags, resume: session });
  }
  return { turns, tools, cost, seconds, rounds, failed, final: turns.at(-1).text };
}

async function run(task, condition) {
  const file = join(out, condition, `${task.id}.json`);
  if (!args.force) try { await access(file); return JSON.parse(await readFile(file, 'utf8')); } catch {}
  const cwd = join(out, 'work', `${condition}-${task.id}`);
  await mkdir(cwd, { recursive: true }); await mkdir(dirname(file), { recursive: true });
  const flags = await writerFlags(condition);
  let setup = null;
  if (condition.endsWith('+brand')) {
    // The owner sets Sigge up once, in an earlier conversation. The task then starts in a folder that already has the brand file.
    setup = await converse(task, condition, cwd, task.language === 'sv' ? 'Sätt upp Sigge för mitt företag, så att den vet hur vi låter och vad vi säljer.' : 'Set Sigge up for my business, so it knows how we sound and what we sell.', await writerFlags(condition, { files: true }));
  }
  const result = { task: task.id, condition, model, ...(await converse(task, condition, cwd, task.prompt, flags)), ...(setup ? { setup } : {}) };
  await writeFile(file, JSON.stringify(result, null, 2));
  return result;
}

await mkdir(out, { recursive: true });
await writeFile(noMcp, JSON.stringify({ mcpServers: {} }));
const jobs = conditions.flatMap((condition) => tasks.map((task) => [task, condition]));
const results = [];
await Promise.all(Array.from({ length: Math.min(parallel, jobs.length) }, async () => {
  for (let job; (job = jobs.shift());) {
    const result = await run(...job);
    results.push(result);
    console.log(`${result.condition.padEnd(10)} ${result.task.padEnd(22)} rounds=${result.rounds} ${result.seconds}s $${result.cost.toFixed(2)} ${result.failed ? 'FAILED ' : ''}tools=${[...new Set(result.tools)].join(',')}`);
  }
}));
console.log(`total $${results.reduce((sum, r) => sum + r.cost + (r.setup?.cost ?? 0), 0).toFixed(2)}`);
