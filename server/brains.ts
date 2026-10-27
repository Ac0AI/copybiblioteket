// Optional local reference loader, adapted from VicPitic/the-brains (MIT).
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Bm25 } from "./search.js";

export interface IndexSource {
  id: string;
  type: "youtube" | "essay" | "podcast" | "x_article" | "x_post" | "linkedin_post";
  title: string;
  url: string;
  publishedAt: string | null;
  outlet: string | null;
  topics: string[];
  quality?: number;
}

interface Chunk {
  sourceId: string;
  heading: string | null;
  text: string;
}

interface BrainIndex {
  slug: string;
  name: string;
  x: string | null;
  linkedin?: string;
  /** What the brain covers, when it isn't the default business focus (e.g. health protocols). */
  domain?: string;
  /** How to name the sources when "talks, interviews, essays and posts" doesn't fit (e.g. Plato's dialogues). */
  sourcesLabel?: string;
  builtAt: string;
  typeLabels: Record<string, string>;
  sources: IndexSource[];
  chunks: Chunk[];
}

export interface Brain extends BrainIndex {
  sourceById: Map<string, IndexSource>;
  bm25: Bm25;
}

export async function loadBrains(dataDir: string, slugs?: readonly string[]): Promise<Map<string, Brain>> {
  const brains = new Map<string, Brain>();
  for (const slug of slugs ?? await readdir(dataDir)) {
    const raw = await readFile(join(dataDir, slug, "index.json"), "utf8").catch(() => null);
    if (!raw) continue;
    const index = JSON.parse(raw) as BrainIndex;
    const sourceById = new Map(index.sources.map((s) => [s.id, s]));
    const bm25 = new Bm25(
      index.chunks.map((chunk, id) => ({
        id,
        fields: { text: chunk.text, boosted: `${chunk.heading ?? ""} ${sourceById.get(chunk.sourceId)?.title ?? ""}` },
      })),
    );
    brains.set(index.slug, { ...index, sourceById, bm25 });
  }
  return brains;
}
