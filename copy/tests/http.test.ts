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
    assert.equal(health.frameworks, 14);
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

test("every person and framework has an indexable page in both languages", async () => {
  const library = await loadCopyLibrary(undefined, false);
  const server = createApp(library).listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  try {
    for (const [path, id] of [...library.people.map((p) => ["/people/", p.id]), ...library.frameworks.map((f) => ["/library/", f.id])]) {
      for (const prefix of ["", "/en"]) {
        const response = await fetch(base + prefix + path + id);
        assert.equal(response.status, 200, prefix + path + id);
        const html = await response.text();
        assert.match(html, new RegExp(`<link rel="canonical" href="https://sigge.si${prefix}${path}${id}">`));
        assert.match(html, new RegExp(`hreflang="en" href="https://sigge.si/en${path}${id}"`));
        assert.match(html, /<meta name="description" content="[^"]{60,170}">/);
        assert.match(html, /<h1 class="display">[^<]+<\/h1>/);
        const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]);
        assert.equal(ld["@graph"][1]["@type"], "BreadcrumbList");
      }
    }
    const paul = await (await fetch(base + "/people/paul-graham")).text();
    assert.match(paul, /<title>Paul Graham – [^<]+ \| Sigge<\/title>/);
    assert.match(paul, /href="\/library\/[a-z0-9-]+"/);
    assert.match(await (await fetch(base + "/en/library/clear-3-2-1")).text(), /<html lang="en">/);
    assert.equal((await fetch(base + "/people/not-a-person")).status, 404);
    assert.equal((await fetch(base + "/library/..%2Fpackage.json")).status, 404);
    const sitemapResponse = await fetch(base + "/sitemap.xml");
    assert.match(sitemapResponse.headers.get("content-type") ?? "", /xml/);
    const sitemap = await sitemapResponse.text();
    assert.equal(sitemap.match(/<loc>/g)?.length, 2 * (4 + library.people.length + library.frameworks.length));
  } finally {
    server.close();
  }
});
