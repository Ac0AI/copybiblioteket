import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ROOT } from "../library.js";

test("a real stdio MCP client can discover and use the Swedish copy tools", { timeout: 20000 }, async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(ROOT, "node_modules/tsx/dist/cli.mjs"), join(ROOT, "copy/mcp.ts")],
    cwd: tmpdir(),
    stderr: "pipe",
  });
  const client = new Client({ name: "copy-brains-test", version: "1.0" });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.ok(tools.some((t) => t.name === "search_copy_knowledge"));
    assert.ok(tools.every((t) => t.annotations?.readOnlyHint === true));
    const check = (await client.callTool({ name: "check_ai_patterns", arguments: { text: "I dagens snabbrörliga värld erbjuder vi en sömlös lösning. Studier visar det." } })).structuredContent as { count: number; findings: { pattern: string; quote: string }[] };
    assert.equal(check.count, 3);
    assert.deepEqual(check.findings.map((f) => f.pattern), ["Tomma ord", "Tomma ord", "Vag källa"]);
    const checkEn = (await client.callTool({ name: "check_ai_patterns", arguments: { text: "We leverage robust tools.", language: "en" } })).structuredContent as { findings: { pattern: string }[] };
    assert.equal(checkEn.findings[0].pattern, "Empty words");
    const result = await client.callTool({
      name: "search_copy_knowledge", arguments: { query: "naturlig svenska utan svengelska", limit: 2 },
    });
    assert.notEqual(result.isError, true);
    const data = result.structuredContent as { results: { id: string; sources: unknown[] }[] };
    assert.equal(data.results[0].id, "swedish-original");
    assert.ok(data.results[0].sources.length);
    const guide = await client.callTool({ name: "get_swedish_writing_guide", arguments: {} });
    assert.notEqual(guide.isError, true);
    assert.equal((guide.structuredContent as { language: string }).language, "sv");
    const unknown = await client.callTool({ name: "get_copy_framework", arguments: { id: "does-not-exist" } });
    assert.equal(unknown.isError, true);
    const people=await client.callTool({name:'list_copy_people',arguments:{}});
    assert.equal((people.structuredContent as {people:unknown[]}).people.length,59);
    const selected=await client.callTool({name:'get_copy_person',arguments:{id:'justin-welsh'}});
    assert.equal((selected.structuredContent as {person:{name:string}}).person.name,'Justin Welsh');
    const personSources=await client.callTool({name:'search_copy_sources',arguments:{query:'innehåll',person:'justin-welsh'}});
    assert.ok((personSources.structuredContent as {results:unknown[]}).results.length);
    const sources = await client.callTool({
      name: "search_copy_sources", arguments: { query: "väntetid ansträngning", person: "alex-hormozi", limit: 2 },
    });
    assert.ok((sources.structuredContent as { results: unknown[] }).results.length > 0);
    const english = await client.callTool({name:'search_copy_knowledge',arguments:{query:'trust and testimonials',language:'en',limit:1}});
    const englishData=english.structuredContent as {language:string;results:{id:string;title:string}[]};
    assert.equal(englishData.language,'en');assert.equal(englishData.results[0].id,'cialdini-persuasion');assert.equal(englishData.results[0].title,'Give the reader reasons to trust');
    const englishGuide=await client.callTool({name:'get_writing_guide',arguments:{language:'en'}});
    assert.match((englishGuide.structuredContent as {guide:string}).guide,/Write directly in English/);
    const englishPerson=await client.callTool({name:'get_copy_person',arguments:{id:'alex-hormozi',language:'en'}});
    const englishHormozi=(englishPerson.structuredContent as {person:{principles:string[]}}).person;
    assert.ok(englishHormozi.principles.some(p=>p.includes('publish content') && p.includes('advertise')));
    assert.ok(englishHormozi.principles.some(p=>p.includes('evidence') && p.includes('customer example')));
    assert.ok(englishHormozi.principles.some(p=>p.includes('After purchase')));
    const swedishPerson=await client.callTool({name:'get_copy_person',arguments:{id:'alex-hormozi'}});
    const swedishHormozi=(swedishPerson.structuredContent as {person:{principles:string[]}}).person;
    assert.ok(swedishHormozi.principles.some(p=>p.includes('innehåll') && p.includes('annonser')));
    assert.ok(swedishHormozi.principles.some(p=>p.includes('belägg') && p.includes('kundexempel')));
    assert.ok(swedishHormozi.principles.some(p=>p.includes('Efter köpet')));
    // Category ids stay stable; English clients also get an English label.
    const englishPeople=(await client.callTool({name:'list_copy_people',arguments:{language:'en'}})).structuredContent as {people:{id:string,category:string,categoryLabel:string}[]};
    const adam=englishPeople.people.find(p=>p.id==='adam-robinson')!;
    assert.deepEqual([adam.category,adam.categoryLabel],['Publik','Audience']);
    const englishList=(await client.callTool({name:'list_copy_frameworks',arguments:{language:'en'}})).structuredContent as {frameworks:{categoryLabel:string}[]};
    assert.ok(englishList.frameworks.every(f=>f.categoryLabel&&!/[åäö]/.test(f.categoryLabel)));
    assert.ok(tools.every((t) => t.title), "Every tool needs a title for client directories");
    assert.ok(!("keywords" in data.results[0]), "Search results leave out index keywords");
    const kit = (await client.callTool({ name: "get_writing_kit", arguments: { task: "Kunderna tycker att priset är för högt, skriv om prissidan", channel: "web" } })).structuredContent as { steps: string[]; frameworks: { id: string }[]; writingGuide: string; channel: string };
    assert.equal(kit.frameworks[0].id, "hormozi-offer");
    assert.match(kit.steps.join(" "), /check_ai_patterns/);
    assert.match(kit.writingGuide, /Självständig svensk copy/);
    assert.match(kit.channel, /^Webbsida/);
    const brand = (await client.callTool({ name: "get_brand_file", arguments: { language: "en" } })).structuredContent as { interview: string[]; format: string; steps: string[] };
    assert.equal(brand.interview.length, 7);
    assert.match(brand.format, /# Sigge brand file/);
    assert.match(brand.steps.join(" "), /Sigge stores nothing/);
    assert.match(kit.steps.join(" "), /get_brand_file/);
    const { prompts } = await client.listPrompts();
    assert.deepEqual(prompts.map((p) => p.name).sort(), ["check", "write"]);
    const prompt = await client.getPrompt({ name: "write", arguments: { task: "A landing page", language: "en" } });
    assert.match((prompt.messages[0].content as { text: string }).text, /get_writing_kit with language en for this task and follow its steps in order/);
    const invalid = await client.callTool({ name: "search_copy_knowledge", arguments: { query: "x" } });
    assert.equal(invalid.isError, true);
  } finally {
    await client.close();
  }
});
