import test from "node:test";
import assert from "node:assert/strict";
import { loadCopyLibrary } from "../library.js";
import { findSlop } from "../../client/slop.js";

const sv = await loadCopyLibrary(undefined, false);
const languages = ["sv", "en"] as const;

test("every framework has the same depth in both languages", () => {
  const english = sv.forLanguage("en");
  assert.equal(sv.frameworks.length, 13);
  for (const f of sv.frameworks) {
    const e = english.get(f.id)!;
    assert.equal(e.moves.length, f.moves.length, f.id);
    assert.equal(e.choose.length, f.choose.length, f.id);
    assert.equal(e.mistakes.length, f.mistakes.length, f.id);
    assert.equal(e.worked.notes.length, f.worked.notes.length, f.id);
    assert.equal("before" in e.worked, "before" in f.worked, f.id);
  }
});

test("the chooser points at moves that exist", () => {
  for (const language of languages) for (const f of sv.forLanguage(language).frameworks) {
    for (const row of f.choose) assert.ok(f.moves.some((move) => row.use.includes(move.name)), `${language} ${f.id}: "${row.use}" names no move`);
  }
});

test("worked examples are labelled fictional and belong to their own language", () => {
  for (const f of sv.frameworks) {
    assert.match(f.worked.context, /^Påhittat:/, f.id);
    assert.doesNotMatch(f.worked.text + f.worked.context, /[$€£]|\bSEK\b|\bEUR\b|\bUSD\b/, `sv ${f.id} leaves kronor`);
  }
  // The English examples are written for an American reader, not translated: dollars, US places, no Swedish setting.
  const swedishSetting = /\bkr\b|[£€]|\bSEK\b|Räkna|Bevaka|Brygga|Hylla|Tassen|Klart Glas|Gotlandscykel|Soltak|Ugnen|Malmö|Visby|Västerås|Göteborg|Gothenburg|BankID|\bRUT\b|\bVAT\b/;
  for (const f of sv.forLanguage("en").frameworks) {
    assert.match(f.worked.context, /^Fictional:/, f.id);
    // The card about writing Swedish quotes Swedish copy on purpose.
    if (f.id === "swedish-original") continue;
    const text = [f.worked.context, f.worked.before ?? "", f.worked.text, ...f.worked.notes, ...f.moves.map((move) => move.example), f.example.context, f.example.before, f.example.after].join("\n");
    assert.doesNotMatch(text, swedishSetting, `en ${f.id} still has a Swedish setting`);
    assert.doesNotMatch(text, /'/, `en ${f.id} uses a straight quote`);
  }
});

test("the English catalogue is spelled the American way", () => {
  const british = /\b((recognis|organis|realis|apologis|prioritis|optimis|summaris|emphasis|localis|capitalis)(e|es|ed|ing|ation|able|ably)\b|behaviour|colour|favour|humour|judgement|centre\b|programme|whilst|enquir|practis(e|es|ed|ing)\b|licence|removal firm|at the weekend)/i;
  for (const f of sv.forLanguage("en").frameworks) {
    const { keywords: _keywords, ...rest } = f;
    assert.doesNotMatch(JSON.stringify(rest), british, f.id);
  }
  for (const person of sv.forLanguage("en").people) assert.doesNotMatch(JSON.stringify([person.summary, person.principles, person.questions, person.topics]), british, person.id);
});

test("our own framework text passes the pattern check we ask others to pass", () => {
  for (const language of languages) for (const f of sv.forLanguage(language).frameworks) {
    // Two frameworks are about bad phrases and quote them throughout, so only their plain instructions are checked.
    const aboutBadPhrases = f.id === "ai-slop-edit" || f.id === "swedish-original";
    const texts = aboutBadPhrases ? [...f.choose.flatMap((row) => [row.when, row.use]), ...f.moves.map((move) => move.how)]
      : [f.summary, f.useWhen, f.avoidWhen, ...f.principles, ...f.questions, ...f.choose.flatMap((row) => [row.when, row.use]),
        ...f.moves.map((move) => move.how), ...f.worked.notes, f.worked.context, f.worked.text, ...f.mistakes, f.example.after, f.example.explanation];
    // Dunford's card names the empty words it warns against, and "facilitator" is Fogg's own term for a kind of prompt.
    const quoted = new Set(["innovativ", "innovative", "seamless", "facilitator"]);
    for (const text of texts) assert.deepEqual(findSlop(text).map((hit) => hit.quote).filter((quote) => !quoted.has(quote)), [], `${language} ${f.id}: ${text.slice(0, 60)}`);
  }
});

test("a worked example is a whole piece of copy, not one sentence", () => {
  for (const language of languages) for (const f of sv.forLanguage(language).frameworks) {
    assert.ok(f.worked.text.split(/\n{2,}/).length >= 3, `${language} ${f.id}`);
  }
});
