import express from "express";
import { sql } from "kysely";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { requireMcpAuth } from "@better-auth/mcp";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { AuthRuntime } from "./auth.js";
import type { CopyLibrary } from "./library.js";
import { createCopyServer } from "./mcp-server.js";

export function mountAccounts(
  app: express.Express,
  runtime: AuthRuntime | undefined,
  library: CopyLibrary,
) {
  app.use(
    [
      "/api/connection",
      "/api/auth",
      "/.well-known",
      "/api/account",
      "/mcp",
      "/connect",
      "/consent",
      "/en/connect",
      "/en/consent",
    ],
    (_req, res, next) => {
      res.set("Cache-Control", "no-store");
      res.set("Referrer-Policy", "no-referrer");
      next();
    },
  );
  app.get("/api/connection", (_req, res) =>
    res.json({ enabled: !!runtime, mcpURL: runtime?.resource ?? null }),
  );
  if (!runtime) {
    app.all("/mcp", (_req, res) =>
      res
        .status(503)
        .json({ error: "MCP account access is not configured yet." }),
    );
    return;
  }
  const { auth, origin, resource } = runtime;
  const authHandler = toNodeHandler(runtime.handleAuthRequest);
  app.all("/api/auth/*", authHandler);
  app.all("/.well-known/*", authHandler);
  const secured = requireMcpAuth(
    auth,
    async (request, claims) => {
      if (
        typeof claims.sub !== "string" ||
        typeof claims.client_id !== "string" ||
        typeof claims.sigge_consent !== "string" ||
        !(await runtime.hasConsent(
          claims.sub,
          claims.client_id,
          claims.sigge_consent,
        ))
      ) {
        return Response.json(
          {
            error: "This connection has been revoked. Connect to Sigge again.",
          },
          {
            status: 401,
            headers: {
              "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
            },
          },
        );
      }
      if (request.method !== "POST")
        return new Response(null, { status: 405, headers: { Allow: "POST" } });
      const server = createCopyServer(library);
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      try {
        await server.connect(transport);
        return await transport.handleRequest(request);
      } finally {
        await server.close();
      }
    },
    { resource, requiredScopes: ["copy:read"] },
  );
  app.all(
    "/mcp",
    toNodeHandler(async (request) => {
      const requestOrigin = request.headers.get("origin");
      if (requestOrigin && requestOrigin !== origin)
        return Response.json({ error: "Origin not allowed." }, { status: 403 });
      if (Number(request.headers.get("content-length") ?? 0) > 65536)
        return Response.json({ error: "Request too large." }, { status: 413 });
      return secured(request);
    }),
  );
  app.get("/api/account", async (req, res, next) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (!session) return void res.json({ user: null });
      const note = await runtime.db
        .selectFrom("fieldNotes")
        .select(["status"])
        .where("userId", "=", session.user.id)
        .executeTakeFirst();
      res.json({
        user: { email: session.user.email },
        fieldNotes: note?.status ?? "not-subscribed",
      });
    } catch (error) {
      next(error);
    }
  });
  app.post(
    "/api/account/connections/revoke",
    express.json({ limit: "1kb" }),
    async (req, res, next) => {
      try {
        if (req.headers.origin !== origin)
          return void res.status(403).json({ error: "Origin not allowed." });
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });
        if (!session)
          return void res.status(401).json({ error: "Sign in first." });
        if (typeof req.body?.id !== "string" || req.body.id.length > 200)
          return void res.status(400).json({ error: "Invalid connection." });
        await runtime.db.transaction().execute(async (db) => {
          const found = await sql<{
            clientId: string;
          }>`select "clientId" from "oauthConsent" where "id"=${req.body.id} and "userId"=${session.user.id}`.execute(
            db,
          );
          const client = found.rows[0]?.clientId;
          if (!client) return;
          await sql`delete from "oauthAccessToken" where "userId"=${session.user.id} and "clientId"=${client}`.execute(
            db,
          );
          await sql`delete from "oauthRefreshToken" where "userId"=${session.user.id} and "clientId"=${client}`.execute(
            db,
          );
          await sql`delete from "oauthConsent" where "id"=${req.body.id} and "userId"=${session.user.id}`.execute(
            db,
          );
        });
        res.json({ revoked: true });
      } catch (error) {
        next(error);
      }
    },
  );
  app.post(
    "/api/account/field-notes",
    express.json({ limit: "1kb" }),
    async (req, res, next) => {
      try {
        if (req.headers.origin !== origin)
          return void res.status(403).json({ error: "Origin not allowed." });
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });
        if (!session?.user.emailVerified)
          return void res
            .status(401)
            .json({ error: "Verify your email first." });
        if (req.body?.consent !== true)
          return void res
            .status(400)
            .json({ error: "Explicit consent is required." });
        try {
          await runtime.subscribe(session.user);
          res.json({ subscribed: true });
        } catch {
          res
            .status(502)
            .json({
              error:
                "Field Notes could not be activated. Your Sigge account is ready; please retry the subscription.",
            });
        }
      } catch (error) {
        next(error);
      }
    },
  );
}
