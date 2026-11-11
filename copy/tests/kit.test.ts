import test from "node:test";
import assert from "node:assert/strict";
import { loadCopyLibrary } from "../library.js";
import { buildCopyKit } from "../kit.js";

const library = await loadCopyLibrary(undefined, false);

test("a kit gives the working order, at most three fitting frameworks with their moves, and the guide in one answer", () => {
  const kit = buildCopyKit(library, { task: "Kunderna tycker att priset är för högt, skriv om prissidan", language: "sv" });
  assert.equal(kit.frameworks[0].id, "hormozi-offer");
  assert.ok(kit.frameworks.length <= 3);
  for (const framework of kit.frameworks) assert.ok(framework.moves.length >= 4 && framework.mistakes.length >= 2, framework.id);
  assert.equal(kit.steps.length, 6);
  assert.match(kit.steps[0], /Hitta inte på/);
  assert.match(kit.steps[1], /Bestäm dig innan du skriver/);
  assert.match(kit.steps[3], /Redigera som en redaktör/);
  assert.match(kit.writingGuide, /Självständig svensk copy/);
  assert.ok(!("frameworksNote" in kit));
  // Small enough that a client reads it whole.
  assert.ok(JSON.stringify(kit).length < 24000, String(JSON.stringify(kit).length));
});

test("only the best match brings its whole worked example, and the kit says the examples are not to be copied", () => {
  const kit = buildCopyKit(library, { task: "Kunderna tycker att priset är för högt, skriv om prissidan", language: "sv" });
  assert.match(kit.frameworks[0].worked!.text, /Hantverkarsajten/);
  assert.ok(kit.frameworks.slice(1).every((framework) => !("worked" in framework)));
  assert.match(kit.examplesNotice, /Kopiera inte/);
});

test("the kit follows the output language and never repeats the guide as a framework", () => {
  const english = buildCopyKit(library, { task: "Write a cold email about our log monitoring tool", channel: "email", language: "en" });
  assert.match(english.writingGuide, /Write directly in English/);
  assert.match(english.channel!, /^Email/);
  assert.match(english.steps[2], /directly in English/);
  const swedish = buildCopyKit(library, { task: "texten låter översatt från engelska, skriv om den på naturlig svenska", language: "sv" });
  assert.ok(swedish.frameworks.every((f) => f.id !== "swedish-original" && f.id !== "ai-slop-edit"));
});

test("the kit asks for the audience only when it is missing", () => {
  const without = buildCopyKit(library, { task: "Skriv en annons för vår bokföringsbyrå", language: "sv" });
  const withAudience = buildCopyKit(library, { task: "Skriv en annons för vår bokföringsbyrå", audience: "Egenföretagare", language: "sv" });
  assert.equal(without.ask.length, withAudience.ask.length + 1);
  assert.equal(withAudience.ask.length, 4);
  assert.match(withAudience.ask[2], /ordagrant/);
});

test("an unmatched task gets general starting points, labelled as such", () => {
  const kit = buildCopyKit(library, { task: "kvantgravitation och migrän", language: "sv" });
  assert.equal(kit.frameworks.length, 3);
  assert.match(kit.frameworksNote!, /allmänna utgångspunkter/);
});

test("a perspective comes along only when the user names the person", () => {
  const chosen = buildCopyKit(library, { task: "LinkedIn-inlägg om varför jag slutade som konsult", person: "justin-welsh", language: "sv" });
  assert.deepEqual(chosen.perspectives!.map((p) => p.id), ["justin-welsh"]);
  assert.ok(chosen.perspectives![0].principles.length >= 2);
  const automatic = buildCopyKit(library, { task: "LinkedIn-inlägg om varför jag slutade som konsult", language: "sv" });
  assert.ok(!("perspectives" in automatic));
});
