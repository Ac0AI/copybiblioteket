import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { type AddressInfo } from "node:net";
import { loadCopyLibrary } from "../library.js";
import { createApp } from "../http.js";

test("web app serves the library and validates search requests", async () => {
  const library = await loadCopyLibrary(undefined, false);
  const server = createApp(library).listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  try {
    const home = await fetch(base);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /<html lang="sv">/);
    assert.match(home.headers.get("content-security-policy") ?? "", /script-src 'self'/);
    const health = await (await fetch(base + "/api/health")).json();
    assert.equal(health.status, "ok");
    assert.equal(health.sourceMode, "links");
    assert.equal(health.frameworks, 11);
    assert.equal((await fetch(base + "/api/no-such-route")).status, 404);
    assert.equal((await fetch(base + "/studio.css")).status, 200);
    assert.equal((await fetch(base + "/library.js")).status, 200);
    assert.equal((await fetch(base + "/package.json")).status, 404);
    const post = (body: unknown) => fetch(base + "/api/search", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const response = await post({ query: "förtroende och kundomdömen", limit: 2 });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.results[0].id, "cialdini-persuasion");
    assert.equal(data.results.length, 2);
    assert.equal((await post({ query: "x" })).status, 400);
    assert.equal((await post({ query: "värde", scope: "other" })).status, 400);
    assert.equal((await post({ query: "värde", limit: 100000 })).status, 400);
    assert.equal((await post({ query: "värde", person: "../../other" })).status, 400);
    assert.equal((await fetch(base + "/api/frameworks/missing")).status, 404);
    assert.equal((await fetch(base + "/api/guide")).status, 200);
    const sourceResult = await (await post({
      query: "väntetid ansträngning", scope: "sources", person: "alex-hormozi",
    })).json();
    assert.ok(sourceResult.results.length > 0);
    const malformed = await fetch(base + "/api/search", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{bad",
    });
    assert.equal((await post({ query: "a".repeat(70000) })).status, 413);
    assert.equal(malformed.status, 400);
    assert.ok((await malformed.json()).error);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
