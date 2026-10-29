import express from 'express';
import { mountAccounts } from './account-http.js';
import type { AuthRuntime } from './auth.js';
import { join } from 'node:path';
import { z } from 'zod';
import { ROOT, type CopyLibrary } from './library.js';
import { languageFrom } from './locale.js';
import { studioRouter } from './studio-http.js';
import { personSchema, searchInput } from './schema.js';

export function createApp(library: CopyLibrary, accounts?: AuthRuntime) {
  const app = express();
  const current = (req: express.Request) => library.forLanguage(languageFrom(req.query.lang));
  const message = (req: express.Request, sv: string, en: string) => req.query.lang === 'en' ? en : sv;
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'");
    next();
  });
  mountAccounts(app,accounts,library);
  app.use(express.json({ limit: '64kb' }));
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.query.lang !== undefined && req.query.lang !== 'sv' && req.query.lang !== 'en') {
      return void res.status(400).json({error:'Choose language sv or en.'});
    }
    next();
  });
  app.use(studioRouter(library,!!accounts));
  app.get('/api/health', (_req, res) => res.json({status:'ok',frameworks:library.frameworks.length,people:library.people.length,sourceMode:library.sourceMode}));
  app.get('/api/people', (req, res) => res.json({people:current(req).people,notice:current(req).notice.profile,language:current(req).language}));
  app.get('/api/people/:id', (req, res) => {
    const person = current(req).getPerson(req.params.id);
    if (!person) return void res.status(404).json({error:message(req,'Profilen finns inte.','Profile not found.')});
    res.json({person,notice:current(req).notice.profile});
  });
  app.get('/api/frameworks', (req, res) => res.json({frameworks:current(req).list(),sourceMode:library.sourceMode,language:current(req).language}));
  app.get('/api/frameworks/:id', (req, res) => {
    const framework = current(req).get(req.params.id);
    if (!framework) return void res.status(404).json({error:message(req,'Ramverket finns inte.','Framework not found.')});
    res.json({framework});
  });
  app.get('/api/guide', (req, res) => res.json({guide:current(req).writingGuide,language:current(req).language}));
  const requestSchema = searchInput.extend({scope:z.enum(['frameworks','sources','people']).default('frameworks'),person:personSchema.optional()}).strict();
  app.post('/api/search', (req, res) => {
    const input = requestSchema.safeParse(req.body);
    if (!input.success) return void res.status(400).json({error:message(req,'Skriv en fråga på 2–500 tecken och välj en giltig sökning.','Enter a query of 2–500 characters and choose a valid search type.')});
    const {query,limit,scope,person} = input.data;
    if (person && !library.getPerson(person)) return void res.status(400).json({error:message(req,'Välj en person som finns i biblioteket.','Choose a person from the library.')});
    const localized = current(req);
    res.json(scope === 'people' ? localized.searchPeople(query,limit) : scope === 'sources' ? localized.searchSources(query,limit,person) : localized.search(query,limit));
  });
  // Explicit files are needed by Vercel's Express adapter, including generated pages/bundles.
  for (const language of ['sv','en']) {
    const prefix = language === 'en' ? '/en' : '';
    const dir = language === 'en' ? 'en' : '';
    for (const [route,file] of [['/','index.html'],['/library','library.html'],['/people','people.html'],['/connect','connect.html'],['/consent','consent.html'],['/privacy','privacy.html']]) {
      app.get(prefix + route, (_req, res) => res.sendFile(join(ROOT,'public',dir,file)));
    }
    // Server-rendered entries: only known ids reach the file system.
    app.get(prefix + '/people/:id', (req, res, next) => library.getPerson(req.params.id) ? res.sendFile(join(ROOT,'public',dir,'profiles',req.params.id+'.html')) : next());
    app.get(prefix + '/library/:id', (req, res, next) => library.get(req.params.id) ? res.sendFile(join(ROOT,'public',dir,'frameworks',req.params.id+'.html')) : next());
  }
  for (const file of ['studio-app.js','library.js','people.js','connect.js','page.js']) app.get('/'+file, (_req,res) => res.sendFile(join(ROOT,'public',file)));
  app.use(express.static(join(ROOT,'public')));
  app.use('/api', (req, res) => {res.status(404).json({error:message(req,'Sidan finns inte.','Page not found.')});});
  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = (err as {status?:number}).status;
    if (status === 413) return void res.status(413).json({error:message(req,'Förfrågan är för stor.','The request is too large.')});
    if (status === 400) return void res.status(400).json({error:message(req,'Förfrågan kunde inte läsas.','The request could not be read.')});
    res.status(500).json({error:message(req,'Biblioteket kunde inte läsas. Försök igen.','The library could not be loaded. Please try again.')});
  });
  return app;
}
