import test from "node:test";
import assert from "node:assert/strict";
import { loadCopyLibrary } from "../library.js";
import { buildCopyKit } from "../kit.js";

const library = await loadCopyLibrary(undefined, false);

test("a kit gives the working order, at most three fitting frameworks and the guide in one answer", () => {
  const kit = buildCopyKit(library, { task: "Kunderna tycker att priset är för högt, skriv om prissidan", language: "sv" });
  assert.equal(kit.frameworks[0].id, "hormozi-offer");
  assert.ok(kit.frameworks.length <= 3 && kit.perspectives.length <= 2);
  assert.equal(kit.steps.length, 5);
  assert.match(kit.writingGuide, /Självständig svensk copy/);
  assert.ok(!("frameworksNote" in kit));
  // Small enough that a client reads it whole.
  assert.ok(JSON.stringify(kit).length < 16000);
});

test("the kit follows the output language and never repeats the guide as a framework", () => {
  const english = buildCopyKit(library, { task: "Write a cold email about our log monitoring tool", channel: "email", language: "en" });
  assert.match(english.writingGuide, /Write directly in English/);
  assert.match(english.channel!, /^Email/);
  assert.match(english.steps[2], /English/);
  const swedish = buildCopyKit(library, { task: "texten låter översatt från engelska, skriv om den på naturlig svenska", language: "sv" });
  assert.ok(swedish.frameworks.every((f) => f.id !== "swedish-original"));
});

test("the kit asks for the audience only when it is missing", () => {
  const without = buildCopyKit(library, { task: "Skriv en annons för vår bokföringsbyrå", language: "sv" });
  const withAudience = buildCopyKit(library, { task: "Skriv en annons för vår bokföringsbyrå", audience: "Egenföretagare", language: "sv" });
  assert.equal(without.askIfMissing.length, withAudience.askIfMissing.length + 1);
});

test("an unmatched task gets general starting points, labelled as such", () => {
  const kit = buildCopyKit(library, { task: "kvantgravitation och migrän", language: "sv" });
  assert.equal(kit.frameworks.length, 3);
  assert.match(kit.frameworksNote!, /allmänna utgångspunkter/);
  assert.equal(kit.perspectives.length, 0);
});

test("an explicit person is the only perspective, and deep-dive profiles are never picked automatically", () => {
  const chosen = buildCopyKit(library, { task: "LinkedIn-inlägg om varför jag slutade som konsult", person: "justin-welsh", language: "sv" });
  assert.deepEqual(chosen.perspectives.map((p) => p.id), ["justin-welsh"]);
  const automatic = buildCopyKit(library, { task: "LinkedIn-inlägg om disciplin, träning och hälsa", language: "sv" });
  for (const p of automatic.perspectives) assert.notEqual(library.getPerson(p.id)!.category, "Fördjupning");
});
