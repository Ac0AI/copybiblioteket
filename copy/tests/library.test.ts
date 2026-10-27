import test from "node:test";
import assert from "node:assert/strict";
import { loadCopyLibrary } from "../library.js";
import { tokenize, Bm25 } from "../../server/search.js";
import { frameworkSchema } from "../schema.js";

const library = await loadCopyLibrary(undefined, false);
const cases = [
  ["kunden tycker att priset är för högt", "hormozi-offer"],
  ["Hur bygger vi förtroende med kundomdömen?", "cialdini-persuasion"],
  ["Hur skiljer vi oss från konkurrenterna?", "dunford-positioning"],
  ["texten låter översatt från engelska", "swedish-original"],
  ["Vad får kunden att byta från sin gamla lösning?", "jobs-to-be-done"],
  ["Vad ska det stå på knappen?", "fogg-action"],
  ["Hur hittar vi kundens egna ord?", "wiebe-customer-language"],
  ["kunden känner inte till lösningen awareness", "schwartz-awareness"],
  ["A/B-test och mätning", "hopkins-testing"],
  ["rubrikens löfte", "ogilvy-headline"],
  ["strukturera argumentet med PAS", "copy-structure"],
  ["How can I improve my offer value?", "hormozi-offer"],
];
for (const [query, id] of cases) {
  test("retrieves a relevant framework: " + query, () => {
    assert.ok(library.search(query, 3).results.some((f) => f.id === id), "Expected " + id + " among top 3");
  });
}

test("unmatched topics and stopword-only queries do not pretend to have evidence", () => {
  for (const q of ["bota migrän", "kvantgravitation", "att och för"]) assert.equal(library.search(q).results.length, 0);
});

test("Swedish accents stay inside words and work in either Unicode representation", () => {
  const text = "prissättning väntetid ansträngning";
  assert.equal(tokenize(text).length, 3);
  assert.deepEqual(tokenize(text), tokenize(text.normalize("NFD")));
  assert.deepEqual(tokenize(text), tokenize("prissattning vantetid anstrangning"));
});

test("empty text with an indexed heading has a finite score", () => {
  const index = new Bm25([{ id: 0, fields: { text: "", boosted: "headline" } }]);
  assert.ok(Number.isFinite(index.search("headline")[0].score));
});

test("source discovery cites originals with our own Swedish descriptions", () => {
  const result = library.searchSources("väntetid ansträngning sannolikhet", 5, "alex-hormozi");
  assert.ok(result.results.length > 0);
  for (const hit of result.results) {
    assert.equal(hit.person, "Alex Hormozi");
    assert.match(hit.url, /^https:\/\//);
    assert.equal(hit.language, "sv");
    assert.equal(hit.kind, "original-application");
    assert.ok(hit.text);
  }
  assert.equal(new Set(result.results.map((r) => r.url)).size, result.results.length);
  assert.equal(library.searchSources("kvantgravitation").results.length, 0);
});

test("schemas reject missing citations and unsafe source URLs", () => {
  const framework = library.get("cialdini-persuasion")!;
  assert.equal(frameworkSchema.safeParse({ ...framework, sources: [] }).success, false);
  assert.equal(frameworkSchema.safeParse({
    ...framework, sources: [{ ...framework.sources[0], url: "javascript:alert(1)" }],
  }).success, false);
});
