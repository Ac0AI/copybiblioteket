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

test("worked examples are labelled fictional and keep to prices in kronor", () => {
  for (const language of languages) for (const f of sv.forLanguage(language).frameworks) {
    assert.match(f.worked.context, language === "sv" ? /^Påhittat:/ : /^Fictional:/, `${language} ${f.id}`);
    assert.doesNotMatch(f.worked.text + f.worked.context, /[$€£]|\bSEK\b|\bEUR\b|\bUSD\b/, `${language} ${f.id} changes the currency`);
  }
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
