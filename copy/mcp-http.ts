import express from "express";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { CopyLibrary } from "./library.js";
import { createCopyServer } from "./mcp-server.js";

// The public MCP endpoint. Anyone can use it without an account: the tools are
// read-only, call no model and save nothing, so there is nothing to protect per user.

const WINDOW_MS = 60_000;
const MAX_BODY = 65536;

/** A fixed-window counter per client address. It lives in memory, so it slows one instance down, not the whole deployment. */
export function createLimiter(limit: number, windowMs = WINDOW_MS, now = Date.now) {
  const hits = new Map<string, { count: number; reset: number }>();
  return (key: string) => {
    const time = now();
    if (hits.size > 5000) for (const [k, hit] of hits) if (hit.reset <= time) hits.delete(k);
    const hit = hits.get(key);
    if (!hit || hit.reset <= time) {
      hits.set(key, { count: 1, reset: time + windowMs });
      return true;
    }
    return ++hit.count <= limit;
  };
}

const clientAddress = (req: express.Request) =>
  String(req.headers["x-vercel-forwarded-for"] ?? req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "unknown").split(",")[0].trim();

export function mountMcp(app: express.Express, library: CopyLibrary, limit = 120) {
  const allowed = createLimiter(limit);
  app.all("/mcp", async (req, res, next) => {
    try {
      res.set("Cache-Control", "no-store");
      if (req.method !== "POST") return void res.status(405).set("Allow", "POST").end();
      if (Number(req.headers["content-length"] ?? 0) > MAX_BODY) return void res.status(413).json({ error: "Request too large." });
      if (!allowed(clientAddress(req))) return void res.status(429).set("Retry-After", "60").json({ error: "Too many requests. Try again in a minute." });
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_BODY) return void res.status(413).json({ error: "Request too large." });
        chunks.push(chunk);
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) if (typeof value === "string") headers.set(key, value);
      const request = new Request("http://sigge.local/mcp", { method: "POST", headers, body: Buffer.concat(chunks) });
      // One server per request: no sessions to keep, so any instance can answer any call.
      const server = createCopyServer(library);
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      try {
        await server.connect(transport);
        const response = await transport.handleRequest(request);
        res.status(response.status);
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.send(Buffer.from(await response.arrayBuffer()));
      } finally {
        await server.close();
      }
    } catch (error) {
      next(error);
    }
  });

  // Sigge required sign-in until November 2026. Clients connected back then still hold a
  // token and some renew it on a timer. This answers the renewal so those connections keep
  // working; the token opens nothing, because /mcp no longer asks for one.
  app.post("/api/auth/oauth2/token", (_req, res) => {
    res.set("Cache-Control", "no-store").json({ access_token: "public", token_type: "Bearer", expires_in: 31536000, refresh_token: "public", scope: "copy:read" });
  });
}
