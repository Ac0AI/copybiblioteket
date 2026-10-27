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
    const sources = await client.callTool({
      name: "search_copy_sources", arguments: { query: "väntetid ansträngning", person: "alex-hormozi", limit: 2 },
    });
    assert.ok((sources.structuredContent as { results: unknown[] }).results.length > 0);
    const invalid = await client.callTool({ name: "search_copy_knowledge", arguments: { query: "x" } });
    assert.equal(invalid.isError, true);
  } finally {
    await client.close();
  }
});
