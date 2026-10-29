import test from "node:test";
import assert from "node:assert/strict";
import { findSlop } from "../../client/slop.js";

test("the AI-tell scan names patterns with quotes in both languages and leaves plain copy alone", () => {
  const sv = findSlop("I dagens snabbrörliga värld handlar det inte bara om bokföring – det handlar om frihet. Det bästa av allt: en sömlös lösning. Studier visar det.");
  assert.deepEqual([...new Set(sv.map((f) => f.id))].sort(), ["buzzwords", "colon", "contrast", "weasel"]);
  assert.ok(sv.every((f) => f.quote.length > 0 && f.end > f.start));
  const en = findSlop("Here's the thing: we leverage cutting-edge tools. In conclusion, experts agree.");
  assert.deepEqual([...new Set(en.map((f) => f.id))].sort(), ["buzzwords", "recap", "throat", "weasel"]);
  assert.deepEqual(findSlop("Räkna sköter din löpande bokföring, och du får en egen kontakt att mejla. Från 995 kr/mån exkl. moms."), []);
  assert.deepEqual(findSlop("Vi resonerar om resan till Göteborg och landskapet runt Vättern."), []);
});
