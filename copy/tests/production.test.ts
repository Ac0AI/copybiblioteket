import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";

test("the production entry cannot expose a configured local collection", async () => {
  const previous = process.env.COPY_BRAINS_SOURCE_DIR;
  process.env.COPY_BRAINS_SOURCE_DIR = "/this-local-collection-must-never-be-read";
  try {
    const { default: app } = await import("../../app.js");
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    try {
      const base = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
      const home = await fetch(base + "/");
      assert.equal(home.status, 200);
      assert.match(await home.text(), /<title>Copybiblioteket<\/title>/);
      const response = await fetch(base + "/api/health");
      assert.equal(response.headers.get("x-powered-by"), null);
      const health = await response.json();
      assert.equal(health.sourceMode, "links");
      const result = await fetch(base + "/api/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "förtroende", scope: "sources" }),
      });
      const data = await result.json();
      assert.ok(data.results.length);
      assert.ok(data.results.every((r: { kind: string }) => r.kind === "original-application"));
    } finally {
      await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    }
  } finally {
    if (previous === undefined) delete process.env.COPY_BRAINS_SOURCE_DIR;
    else process.env.COPY_BRAINS_SOURCE_DIR = previous;
  }
});
