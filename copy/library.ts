import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { Bm25 } from "../server/search.js";
import { loadBrains, type Brain } from "../server/brains.js";
import { frameworkSchema, profileSchema, type Profile, type Framework, type Person } from "./schema.js";
import { expandQuery } from "./query.js";
import { z } from "zod";
import { notices, type Language } from "./locale.js";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const PROFILE_NOTICE = 'Egna svenska tillämpningar. Källhänvisningarna kommer från The Brains och har inte verifierats självständigt mot hela originalen. Profilerna är inte officiella eller godkända av personerna.';
export const NATIVE_NOTICE = "Egen svensk tillämpning med källhänvisningar. Exemplen är påhittade och visar skrivsätt, inte uppmätta resultat.";
export const SOURCE_NOTICE = "Ärvt material från The Brains. Längre källor är sammanfattade av projektet; innehållet är inte verifierat här mot hela originalet. Kontrollera viktiga påståenden i den länkade källan.";
export const LINK_NOTICE = "Här hittar du originalkällor till ramverken. Beskrivningarna är våra egna svenska tillämpningar; öppna länken för att läsa författarens material.";

export class CopyLibrary {
  private index: Bm25;
  private peopleIndex: Bm25;
  private translations = new Map<Language, CopyLibrary>();
  get notice() { return notices[this.language]; }
  forLanguage(language: Language) { return language === this.language ? this : this.translations.get(language) ?? this; }
  setTranslation(library: CopyLibrary) { this.translations.set(library.language, library); library.translations.set(this.language, this); }
  constructor(
    readonly frameworks: Framework[],
    readonly references: Map<string, Brain>,
    readonly writingGuide: string,
    readonly people: Profile[] = [],
    readonly language: Language = "sv",
  ) {
    if (new Set(frameworks.map((f) => f.id)).size !== frameworks.length) throw new Error("Duplicate framework id");
    this.index = new Bm25(frameworks.map((f, id) => ({
      id,
      fields: {
        text: [f.summary, f.useWhen, ...f.principles, ...f.questions].join(" "),
        boosted: [f.title, f.author, f.category, ...f.keywords].join(" "),
      },
    })));
    if (new Set(people.map(p=>p.id)).size !== people.length) throw new Error('Duplicate profile id');
    this.peopleIndex = new Bm25(people.map((p,id)=>({id,fields:{text:[p.summary,...p.principles,...p.questions].join(' '),boosted:[p.id,p.name,p.category,...p.topics].join(' ')}})));
  }

  getPerson(id: string) { return this.people.find(p=>p.id===id) ?? null; }
  searchPeople(query: string, limit=6) {
    const normalize=(s:string)=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().trim();
    const exact=this.people.filter(p=>normalize(p.name)===normalize(query)||p.id===query.trim().toLowerCase());
    const matches=this.peopleIndex.search(expandQuery(query).expanded).map(hit=>this.people[hit.doc]);
    return { query, notice: this.notice.profile, results: [...exact,...matches.filter(p=>!exact.includes(p))].slice(0,limit) };
  }

  list() {
    const priority = ["hormozi-offer", "cialdini-persuasion", "swedish-original"];
    const rank = (id: string) => priority.includes(id) ? priority.indexOf(id) : priority.length;
    return this.frameworks.map(({ id, title, author, category, summary }) => ({ id, title, author, category, summary }))
      .sort((a, b) => rank(a.id) - rank(b.id) || a.title.localeCompare(b.title, this.language));
  }

  get(id: string) {
    return this.frameworks.find((f) => f.id === id) ?? null;
  }

  get sourceMode() {
    return this.references.size ? "passages" : "links";
  }

  search(query: string, limit = 4) {
    const translation = expandQuery(query);
    // Original wording gets priority; concept matches help across Swedish/English.
    const raw = new Map(this.index.search(query).map((h) => [h.doc, h.score]));
    const merged = new Map(raw);
    for (const hit of this.index.search(translation.expanded)) {
      merged.set(hit.doc, (raw.get(hit.doc) ?? 0) + hit.score * 0.35);
    }
    const results = [...merged.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
      .map(([doc]) => this.frameworks[doc]);
    return {
      query, language: this.language, notice: this.notice.native,
      results,
      guidance: results.length ? this.notice.found : this.notice.empty,
    };
  }

  searchSources(query: string, limit = 4, person?: Person) {
    if (!this.references.size || (person && !this.references.has(person))) {
      const seen = new Set<string>();
      const native = this.search(query, this.frameworks.length).results
        .filter((f) => !person || f.author.includes(this.getPerson(person)?.name || person))
        .flatMap((f) => f.sources.map((source) => ({
          person: f.author, title: source.title, url: source.url, date: null,
          heading: source.title, text: f.summary, language: this.language,
          kind: "original-application", sourceLanguage: source.language,
        })));
      const profiles = (person ? [this.getPerson(person)].filter((p):p is Profile=>Boolean(p)) : this.searchPeople(query,limit).results)
        .flatMap(p=>p.sources.map(s=>({person:p.name,title:s.title,url:s.url,date:null,heading:s.title,text:p.summary,language:this.language,kind:'original-application',sourceLanguage:'en',sourceStatus:p.provenance.sourceStatus})));
      const results = [...native, ...profiles].filter((source) => {
          if (seen.has(source.url)) return false;
          seen.add(source.url);
          return true;
        }).slice(0, limit);
      return {
        query, notice: this.notice.link, results,
        guidance: this.notice.read,
      };
    }
    const expansion = expandQuery(query);
    const hits = [...this.references.values()].filter((brain) => !person || brain.slug === person)
      .flatMap((brain) => brain.bm25.search(expansion.expanded).map((hit) => ({ brain, ...hit })))
      .sort((a, b) => b.score - a.score);
    const counts = new Map<string, number>();
    const results = [];
    for (const hit of hits) {
      const chunk = hit.brain.chunks[hit.doc];
      const source = hit.brain.sourceById.get(chunk.sourceId)!;
      const key = hit.brain.slug + ":" + source.id;
      if ((counts.get(key) ?? 0) >= 2) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      results.push({
        person: hit.brain.name, title: source.title, url: source.url, date: source.publishedAt,
        heading: chunk.heading, text: chunk.text, language: "en",
        kind: source.type === "x_post" ? "upstream-post" : "upstream-summary",
      });
      if (results.length >= limit) break;
    }
    return {
      query, expandedQuery: expansion.expanded, notice: this.notice.source, results,
      guidance: this.notice.inherited,
    };
  }
}

export async function loadCopyLibrary(root = ROOT, sourceDir: string | false = process.env.COPY_BRAINS_SOURCE_DIR || false): Promise<CopyLibrary> {
  const dir = join(root, "data", "copy-frameworks");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  const frameworks = await Promise.all(files.map(async (file) =>
    frameworkSchema.parse(JSON.parse(await readFile(join(dir, file), "utf8")))));
  const peopleDir = join(root, 'data', 'people');
  const people = await Promise.all((await readdir(peopleDir)).filter(f=>f.endsWith('.json')).sort().map(async file=>profileSchema.parse(JSON.parse(await readFile(join(peopleDir,file),'utf8')))));
  const references = sourceDir ? await loadBrains(sourceDir, people.map(p=>p.id)) : new Map<string, Brain>();
  if (sourceDir && !references.size) throw new Error('No local reference libraries found');
  const guide = await readFile(join(root, "skills", "copy-operator", "references", "swedish.md"), "utf8");
  const library = new CopyLibrary(frameworks, references, guide, people);
  const translationsDir = join(root, 'data', 'translations', 'en');
  const frameworkTranslation = frameworkSchema.pick({title:true,author:true,summary:true,useWhen:true,avoidWhen:true,keywords:true,principles:true,questions:true,example:true});
  const personTranslation = profileSchema.pick({summary:true,topics:true,principles:true,questions:true});
  const translatedFrameworks = z.record(z.string(), frameworkTranslation).parse(JSON.parse(await readFile(join(translationsDir, 'frameworks.json'), 'utf8')));
  const translatedPeople = z.record(z.string(), personTranslation).parse(JSON.parse(await readFile(join(translationsDir, 'people.json'), 'utf8')));
  for (const [originals, translations] of [[frameworks, translatedFrameworks], [people, translatedPeople]] as const) {
    if (Object.keys(translations).length !== originals.length || originals.some(item => !(item.id in translations))) throw new Error('Incomplete English catalogue');
  }
  const english = new CopyLibrary(
    frameworks.map(f => frameworkSchema.parse({...f, ...translatedFrameworks[f.id], keywords:[...new Set([...f.keywords,...translatedFrameworks[f.id].keywords])], language:'en'})),
    references,
    await readFile(join(root, 'skills', 'copy-operator', 'references', 'english.md'), 'utf8'),
    people.map(p => profileSchema.parse({...p, ...translatedPeople[p.id]})),
    'en',
  );
  library.setTranslation(english);
  return library;
}
