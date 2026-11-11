import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createApp } from "../http.js";
import { loadCopyLibrary } from "../library.js";
import { createLimiter, mountMcp } from "../mcp-http.js";

const library = await loadCopyLibrary(undefined, false);
async function serve(t: test.TestContext, app: express.Express) {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => { server.closeAllConnections(); server.close(); });
  return "http://127.0.0.1:" + (server.address() as AddressInfo).port;
}

test("anyone can connect to /mcp without an account and use every tool", async (t) => {
  const base = await serve(t, createApp(library));
  const client = new Client({ name: "sigge-public-test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(base + "/mcp")));
  t.after(() => client.close());
  const { tools } = await client.listTools();
  assert.equal(tools.length, 12);
  assert.ok(tools.every((tool) => tool.annotations?.readOnlyHint === true));
  const kit = (await client.callTool({ name: "get_writing_kit", arguments: { task: "Write a cold email about our log monitoring tool", channel: "email", language: "en" } })).structuredContent as { frameworks: unknown[]; writingGuide: string };
  assert.ok(kit.frameworks.length > 0);
  assert.match(kit.writingGuide, /Write directly in English/);
  const people = (await client.callTool({ name: "list_copy_people", arguments: {} })).structuredContent as { people: unknown[] };
  assert.equal(people.people.length, 59);
});

test("clients that signed in before the accounts were removed keep working", async (t) => {
  const base = await serve(t, createApp(library));
  // An old token is ignored, not rejected.
  const client = new Client({ name: "sigge-legacy-test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(base + "/mcp"), { requestInit: { headers: { Authorization: "Bearer a-token-from-october" } } }));
  t.after(() => client.close());
  assert.equal((await client.listTools()).tools.length, 12);
  // A client that renews its token on a timer gets an answer.
  const renewal = await fetch(base + "/api/auth/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=refresh_token&refresh_token=old" });
  assert.equal(renewal.status, 200);
  assert.equal((await renewal.json()).token_type, "Bearer");
  // A new client finds nothing that tells it to sign in.
  for (const path of ["/.well-known/oauth-protected-resource", "/.well-known/oauth-authorization-server", "/.well-known/oauth-authorization-server/api/auth"]) assert.equal((await fetch(base + path)).status, 404, path);
});

test("/mcp takes only small POST requests and slows down a client that floods it", async (t) => {
  const app = express();
  mountMcp(app, library, 3);
  const base = await serve(t, app);
  assert.equal((await fetch(base + "/mcp")).status, 405);
  const post = (body: string, address = "203.0.113.7") => fetch(base + "/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "x-vercel-forwarded-for": address }, body });
  assert.equal((await post("x".repeat(70000), "203.0.113.8")).status, 413);
  const ping = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" });
  for (let i = 0; i < 3; i++) assert.equal((await post(ping)).status, 200);
  const blocked = await post(ping);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("retry-after"), "60");
  // Another address is not affected.
  assert.equal((await post(ping, "203.0.113.9")).status, 200);
});

test("the limiter opens again when the window has passed", () => {
  let time = 0;
  const allowed = createLimiter(2, 1000, () => time);
  assert.deepEqual([allowed("a"), allowed("a"), allowed("a")], [true, true, false]);
  time = 1001;
  assert.equal(allowed("a"), true);
});
