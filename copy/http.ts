import express from "express";
import { join } from "node:path";
import { z } from "zod";
import { ROOT, PROFILE_NOTICE, type CopyLibrary } from "./library.js";
import { studioRouter } from "./studio-http.js";
import { personSchema, searchInput } from "./schema.js";

export function createApp(library: CopyLibrary) {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Content-Security-Policy", "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'");
    next();
  });
  app.use(express.json({ limit: "64kb" }));
  app.use("/api", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  app.use(studioRouter(library));
  app.get("/api/health", (_req, res) => res.json({ status: "ok", frameworks: library.frameworks.length, people:library.people.length, sourceMode: library.sourceMode }));
  app.get('/api/people', (_req,res)=>res.json({people:library.people,notice:PROFILE_NOTICE}));
  app.get('/api/people/:id', (req,res)=>{const person=library.getPerson(req.params.id);if(!person)return void res.status(404).json({error:'Profilen finns inte.'});res.json({person,notice:PROFILE_NOTICE});});
  app.get("/api/frameworks", (_req, res) => res.json({ frameworks: library.list(), sourceMode: library.sourceMode }));
  app.get("/api/frameworks/:id", (req, res) => {
    const framework = library.get(req.params.id);
    if (!framework) return void res.status(404).json({ error: "Ramverket finns inte." });
    res.json({ framework });
  });
  app.get("/api/guide", (_req, res) => res.json({ guide: library.writingGuide }));
  const requestSchema = searchInput.extend({
    scope: z.enum(["frameworks", "sources", "people"]).default("frameworks"),
    person: personSchema.optional(),
  }).strict();
  app.post("/api/search", (req, res) => {
    const input = requestSchema.safeParse(req.body);
    if (!input.success) return void res.status(400).json({ error: "Skriv en fråga på 2–500 tecken och välj en giltig sökning." });
    const { query, limit, scope, person } = input.data;
    if(person && !library.getPerson(person))return void res.status(400).json({error:'Välj en person som finns i biblioteket.'});
    res.json(scope === 'people' ? library.searchPeople(query,limit) : scope === "sources" ? library.searchSources(query, limit, person) : library.search(query, limit));
  });
  // Vercel's Express adapter does not serve directory indexes via express.static.
  app.get("/", (_req, res) => res.sendFile(join(ROOT, "public", "index.html")));
  app.get("/library", (_req, res) => res.sendFile(join(ROOT, "public", "library.html")));
  app.get('/people', (_req,res)=>res.sendFile(join(ROOT,'public','people.html')));
  app.use(express.static(join(ROOT, "public")));
  app.use("/api", (_req, res) => { res.status(404).json({ error: "Sidan finns inte." }); });
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = (err as { status?: number }).status;
    if (status === 413) return void res.status(413).json({ error: "Förfrågan är för stor." });
    if (status === 400) return void res.status(400).json({ error: "Förfrågan kunde inte läsas." });
    res.status(500).json({ error: "Biblioteket kunde inte läsas. Försök igen." });
  });
  return app;
}
