import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { sql } from "kysely";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createAuthRuntime } from "../auth.js";
import { createApp } from "../http.js";
import { loadCopyLibrary } from "../library.js";

const library = await loadCopyLibrary(undefined, false);
async function fixture(t: test.TestContext) {
  const dir = await mkdtemp(join(tmpdir(), "sigge-auth-")),
    server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  const codes = new Map<string, string>(),
    subscriptions: string[] = [];
  let failMail = false,
    failSubscription = false;
  const runtime = createAuthRuntime({
    baseURL: origin,
    databaseURL: "file:" + join(dir, "auth.db"),
    secret: randomBytes(32).toString("hex"),
    sendCode: async (email, code) => {
      if (failMail) throw new Error("Mail fixture failed");
      codes.set(email, code);
    },
    subscribe: async (email) => {
      if (failSubscription) throw new Error("Subscriber fixture failed");
      subscriptions.push(email);
      return "fixture-contact";
    },
  });
  await runtime.migrate();
  server.on("request", createApp(library, runtime));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
    await runtime.db.destroy();
    await rm(dir, { recursive: true, force: true });
  });
  let cookie = "";
  async function request(
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) {
    const response = await fetch(new URL(path, origin), {
      method: body === undefined ? "GET" : "POST",
      redirect: "manual",
      headers: {
        Origin: origin,
        Accept: "application/json",
        "x-vercel-forwarded-for": "203.0.113.10",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const set = response.headers.getSetCookie();
    if (set.length) cookie = set.map((c) => c.split(";")[0]).join("; ");
    return response;
  }
  async function login(email: string, oauthQuery?: string) {
    assert.equal(
      (
        await request("/api/auth/email-otp/send-verification-otp", {
          email,
          type: "sign-in",
        })
      ).status,
      200,
    );
    const response = await request("/api/auth/sign-in/email-otp", {
      email,
      otp: codes.get(email),
      ...(oauthQuery ? { oauth_query: oauthQuery } : {}),
    });
    assert.equal(response.status, 200, await response.clone().text());
    return response.json();
  }
  return {
    origin,
    runtime,
    codes,
    subscriptions,
    request,
    login,
    setMailFailure: (v: boolean) => (failMail = v),
    setSubscriptionFailure: (v: boolean) => (failSubscription = v),
  };
}

test("email signup verifies ownership, hashes codes, consumes them once and requires explicit newsletter consent", async (t) => {
  const f = await fixture(t),
    email = "member@example.test";
  for (const path of [
    "/connect",
    "/en/connect",
    "/consent",
    "/en/consent",
    "/api/connection",
  ]) {
    const response = await f.request(path);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  }
  assert.equal(
    (await f.request("/api/account/field-notes", { consent: true })).status,
    401,
  );
  await f.login(email);
  const account = await (await f.request("/api/account")).json();
  assert.equal(account.user.email, email);
  assert.equal(account.fieldNotes, "not-subscribed");
  assert.deepEqual(f.subscriptions, []);
  assert.notEqual(
    (
      await f.request("/api/auth/sign-in/email-otp", {
        email,
        otp: f.codes.get(email),
      })
    ).status,
    200,
  );
  assert.equal(
    (await f.request("/api/account/field-notes", { consent: false })).status,
    400,
  );
  assert.equal(
    (
      await f.request(
        "/api/account/field-notes",
        { consent: true },
        { Origin: "https://attacker.example" },
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.request("/api/account/field-notes", { consent: true })).status,
    200,
  );
  assert.equal(
    (await f.request("/api/account/field-notes", { consent: true })).status,
    200,
  );
  assert.deepEqual(f.subscriptions, [email]);
  assert.equal(
    (await (await f.request("/api/account")).json()).fieldNotes,
    "subscribed",
  );
  const other = "hash@example.test";
  await f.request("/api/auth/email-otp/send-verification-otp", {
    email: other,
    type: "sign-in",
  });
  const values = await sql`select value from verification`.execute(
    f.runtime.db,
  );
  assert.ok(!JSON.stringify(values.rows).includes(f.codes.get(other)!));
});

test("account deletion requires same-origin confirmation and erases the user's sessions and records", async (t) => {
  const f = await fixture(t),
    email = "leaving@example.test";
  assert.equal(
    (await f.request("/api/account/delete", { confirm: true })).status,
    401,
  );
  await f.login(email);
  assert.equal(
    (await f.request("/api/account/field-notes", { consent: true })).status,
    200,
  );
  assert.equal(
    (await f.request("/api/account/delete", { confirm: false })).status,
    400,
  );
  assert.equal(
    (
      await f.request(
        "/api/account/delete",
        { confirm: true },
        { Origin: "https://attacker.example" },
      )
    ).status,
    403,
  );
  const deleted = await f.request("/api/account/delete", { confirm: true });
  assert.equal(deleted.status, 200);
  assert.equal(deleted.headers.get("clear-site-data"), '"cookies"');
  assert.equal((await (await f.request("/api/account")).json()).user, null);
  for (const table of ["user", "session", "fieldNotes"]) {
    const rows = await sql`select count(*) as n from ${sql.table(table)}`.execute(
      f.runtime.db,
    );
    assert.equal(Number((rows.rows[0] as { n: number }).n), 0, table);
  }
  // Signing in again starts a fresh account without the previous opt-in.
  await f.login(email);
  assert.equal(
    (await (await f.request("/api/account")).json()).fieldNotes,
    "not-subscribed",
  );
});

test("mail errors, expired codes and repeated wrong codes never authenticate; subscription failures remain visible", async (t) => {
  const f = await fixture(t);
  f.setMailFailure(true);
  assert.notEqual(
    (
      await f.request("/api/auth/email-otp/send-verification-otp", {
        email: "mail@example.test",
        type: "sign-in",
      })
    ).status,
    200,
  );
  f.setMailFailure(false);
  const email = "expired@example.test";
  await f.request("/api/auth/email-otp/send-verification-otp", {
    email,
    type: "sign-in",
  });
  await sql`update verification set expiresAt=0`.execute(f.runtime.db);
  assert.notEqual(
    (
      await f.request("/api/auth/sign-in/email-otp", {
        email,
        otp: f.codes.get(email),
      })
    ).status,
    200,
  );
  const locked = "locked@example.test";
  await f.request("/api/auth/email-otp/send-verification-otp", {
    email: locked,
    type: "sign-in",
  });
  const wrong = f.codes.get(locked) === "000000" ? "111111" : "000000";
  for (let attempt = 0; attempt < 5; attempt++)
    assert.notEqual(
      (
        await f.request("/api/auth/sign-in/email-otp", {
          email: locked,
          otp: wrong,
        })
      ).status,
      200,
    );
  assert.notEqual(
    (
      await f.request("/api/auth/sign-in/email-otp", {
        email: locked,
        otp: f.codes.get(locked),
      })
    ).status,
    200,
  );
  await f.login("retry@example.test");
  f.setSubscriptionFailure(true);
  assert.equal(
    (await f.request("/api/account/field-notes", { consent: true })).status,
    502,
  );
  assert.equal(
    (await (await f.request("/api/account")).json()).fieldNotes,
    "pending",
  );
  f.setSubscriptionFailure(false);
  assert.equal(
    (await f.request("/api/account/field-notes", { consent: true })).status,
    200,
  );
});

test("OAuth discovery, PKCE, consent, real remote MCP in both languages and immediate revocation", async (t) => {
  const f = await fixture(t);
  const denied = await f.request("/mcp", {});
  assert.equal(denied.status, 401);
  assert.match(
    denied.headers.get("www-authenticate")!,
    /oauth-protected-resource/,
  );
  const metadata = await (
    await f.request("/.well-known/oauth-protected-resource")
  ).json();
  assert.equal(metadata.resource, f.origin + "/mcp");
  const discovery = await (
    await f.request("/.well-known/oauth-authorization-server/api/auth")
  ).json();
  assert.ok(discovery.registration_endpoint);
  assert.ok(discovery.code_challenge_methods_supported.includes("S256"));
  const registered = await f.request(discovery.registration_endpoint, {
    client_name: "Sigge test client",
    redirect_uris: [f.origin + "/callback"],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    scope: "copy:read offline_access",
  });
  assert.equal(registered.status, 201, await registered.clone().text());
  const client = await registered.json();
  const verifier = randomBytes(32).toString("base64url"),
    challenge = createHash("sha256").update(verifier).digest("base64url");
  const params = new URLSearchParams({
    client_id: client.client_id,
    redirect_uri: f.origin + "/callback",
    response_type: "code",
    scope: "copy:read offline_access",
    resource: f.origin + "/mcp",
    state: "fixture-state",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  const authStart = await f.request(
    discovery.authorization_endpoint + "?" + params.toString(),
    undefined,
    { Accept: "text/html", "Sec-Fetch-Mode": "navigate" },
  );
  assert.ok(
    [200, 302, 303].includes(authStart.status),
    await authStart.clone().text(),
  );
  const loginURL = new URL(
    authStart.headers.get("location") || (await authStart.json()).url,
    f.origin,
  );
  assert.equal(loginURL.pathname, "/connect");
  const signedIn = await f.login(
    "oauth@example.test",
    loginURL.search.slice(1),
  );
  assert.ok(signedIn.url, JSON.stringify(signedIn));
  const consentURL = new URL(signedIn.url, f.origin);
  assert.equal(consentURL.pathname, "/consent");
  const tampered = new URLSearchParams(consentURL.search);
  tampered.set("redirect_uri", "https://attacker.example/callback");
  assert.notEqual(
    (
      await f.request("/api/auth/oauth2/consent", {
        accept: true,
        oauth_query: tampered.toString(),
      })
    ).status,
    200,
  );
  const allowed = await f.request("/api/auth/oauth2/consent", {
    accept: true,
    oauth_query: consentURL.search.slice(1),
  });
  assert.equal(allowed.status, 200, await allowed.clone().text());
  let callback = new URL((await allowed.json()).url);
  assert.equal(callback.searchParams.get("state"), "fixture-state");
  const exchange = async (codeVerifier: string) =>
    fetch(discovery.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: client.client_id,
        redirect_uri: f.origin + "/callback",
        code: callback.searchParams.get("code")!,
        code_verifier: codeVerifier,
        resource: f.origin + "/mcp",
      }),
    });
  assert.notEqual((await exchange("wrong-verifier")).status, 200);
  const newAuthorization = await f.request(
    discovery.authorization_endpoint + "?" + params.toString(),
  );
  callback = new URL((await newAuthorization.json()).url);
  const tokenResponse = await exchange(verifier);
  assert.equal(tokenResponse.status, 200, await tokenResponse.clone().text());
  let token = await tokenResponse.json();
  assert.ok(token.access_token);
  assert.ok(token.refresh_token);
  const renewed = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: client.client_id,
      refresh_token: token.refresh_token,
      resource: f.origin + "/mcp",
    }),
  });
  assert.equal(renewed.status, 200, await renewed.clone().text());
  token = await renewed.json();
  assert.ok(token.access_token);
  assert.ok(token.refresh_token);
  assert.equal(
    (await f.request("/mcp", {}, { Authorization: "Bearer invalid" })).status,
    401,
  );
  const connection = new Client({
    name: "sigge-integration-test",
    version: "1.0.0",
  });
  await connection.connect(
    new StreamableHTTPClientTransport(new URL(f.origin + "/mcp"), {
      requestInit: {
        headers: { Authorization: "Bearer " + token.access_token },
      },
    }),
  );
  assert.equal((await connection.listTools()).tools.length, 9);
  for (const language of ["sv", "en"]) {
    const data = await connection.callTool({
      name: "get_writing_guide",
      arguments: { language },
    });
    assert.equal(
      (data.structuredContent as { language: string }).language,
      language,
    );
  }
  await connection.close();
  const consents = await (
    await f.request("/api/auth/oauth2/get-consents")
  ).json();
  assert.equal(consents.length, 1);
  assert.equal(
    (await f.request("/api/account/connections/revoke", { id: consents[0].id }))
      .status,
    200,
  );
  assert.equal(
    (
      await f.request(
        "/mcp",
        {},
        { Authorization: "Bearer " + token.access_token },
      )
    ).status,
    401,
  );
  const refresh = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: client.client_id,
      refresh_token: token.refresh_token,
      resource: f.origin + "/mcp",
    }),
  });
  assert.notEqual(refresh.status, 200);
  const reconnect = await (
    await f.request(discovery.authorization_endpoint + "?" + params.toString())
  ).json();
  const freshConsent = new URL(reconnect.url, f.origin);
  assert.equal(freshConsent.pathname, "/consent");
  const approveAgain = await f.request("/api/auth/oauth2/consent", {
    accept: true,
    oauth_query: freshConsent.search.slice(1),
  });
  assert.equal(approveAgain.status, 200);
  assert.equal(
    (
      await f.request(
        "/mcp",
        {},
        { Authorization: "Bearer " + token.access_token },
      )
    ).status,
    401,
  );
  // Authorization-code replay invalidates its token family; exercise it after
  // normal renewal and explicit connection revocation have been checked.
  assert.notEqual((await exchange(verifier)).status, 200);
});

test("signup rejects cross-origin requests and limits sends per address across IP addresses", async (t) => {
  const f = await fixture(t),
    email = "limited@example.test";
  assert.equal(
    (
      await f.request(
        "/api/auth/email-otp/send-verification-otp",
        { email, type: "sign-in" },
        { Origin: "https://attacker.example" },
      )
    ).status,
    403,
  );
  assert.equal(f.codes.size, 0);
  for (let n = 0; n < 3; n++)
    assert.equal(
      (
        await f.request(
          "/api/auth/email-otp/send-verification-otp",
          { email, type: "sign-in" },
          { "x-vercel-forwarded-for": "203.0.113." + (n + 1) },
        )
      ).status,
      200,
    );
  assert.equal(
    (
      await f.request(
        "/api/auth/email-otp/send-verification-otp",
        { email, type: "sign-in" },
        { "x-vercel-forwarded-for": "203.0.113.99" },
      )
    ).status,
    429,
  );
  const discovery = await (
    await f.request("/.well-known/oauth-authorization-server/api/auth")
  ).json();
  for (const options of [
    { require_pkce: false },
    { redirect_uris: ["javascript:alert(1)"] },
  ]) {
    const response = await f.request(discovery.registration_endpoint, {
      client_name: "Invalid client",
      redirect_uris: [f.origin + "/callback"],
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      ...options,
    });
    if ("require_pkce" in options) {
      assert.equal(response.status, 201);
      const registered = await response.json();
      const params = new URLSearchParams({
        client_id: registered.client_id,
        redirect_uri: f.origin + "/callback",
        response_type: "code",
        scope: "copy:read",
        resource: f.origin + "/mcp",
      });
      const denied = await f.request(
        discovery.authorization_endpoint + "?" + params,
      );
      const result = await denied.json();
      assert.ok(
        denied.status === 400 ||
          (typeof result.url === "string" &&
            new URL(result.url, f.origin).searchParams.has("error")),
        JSON.stringify(result),
      );
    } else assert.equal(response.status, 400, JSON.stringify(options));
  }
});
