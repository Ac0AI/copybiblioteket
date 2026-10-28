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
    assert.equal((englishPerson.structuredContent as {person:{summary:string}}).person.summary,'An offer people can understand and assess');
    // Category ids stay stable; English clients also get an English label.
    const englishPeople=(await client.callTool({name:'list_copy_people',arguments:{language:'en'}})).structuredContent as {people:{id:string,category:string,categoryLabel:string}[]};
    const adam=englishPeople.people.find(p=>p.id==='adam-robinson')!;
    assert.deepEqual([adam.category,adam.categoryLabel],['Publik','Audience']);
    const englishList=(await client.callTool({name:'list_copy_frameworks',arguments:{language:'en'}})).structuredContent as {frameworks:{categoryLabel:string}[]};
    assert.ok(englishList.frameworks.every(f=>f.categoryLabel&&!/[åäö]/.test(f.categoryLabel)));
    const invalid = await client.callTool({ name: "search_copy_knowledge", arguments: { query: "x" } });
    assert.equal(invalid.isError, true);
  } finally {
    await client.close();
  }
});
