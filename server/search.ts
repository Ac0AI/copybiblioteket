// Small BM25 index over a brain's chunks. Brains are a few thousand chunks, so an in-memory
// lexical index is fast and free; embeddings can replace it later without changing the tools.

const STOPWORDS = new Set(
  ("a an and are as at be but by do does for from has have he her his how i if in into is it its me my " +
    "not of on or our she so than that the their them then there these they this to was we were what when " +
    "where which who why will with you your about can should would could " +
    "att av de den det detta dig din ditt du en ett fran for ha hur i inte jag kan " +
    "man med mig min mitt nar och om oss pa sa ska som till vad var vart vi vill " +
    "vara ar har fa far gor gora nagot behover skriv skriva text texten copy").split(" "),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9$%\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

// Light suffix stripping so "pricing"/"priced"/"prices" meet "price".
function stem(token: string): string {
  if (token.length <= 4) return token;
  for (const suffix of ["ings", "ing", "ers", "ies", "ed", "es", "er", "s"]) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 3) {
      return suffix === "ies" ? token.slice(0, -3) + "y" : token.slice(0, -suffix.length);
    }
  }
  return token;
}

export interface Doc {
  id: number;
  fields: { text: string; boosted: string };
}

interface Posting {
  doc: number;
  tf: number;
}

export class Bm25 {
  private postings = new Map<string, Posting[]>();
  private lengths: number[] = [];
  private avgLength = 0;
  private readonly k1 = 1.2;
  private readonly b = 0.75;

  constructor(docs: Doc[], private readonly boost = 2) {
    for (const doc of docs) {
      const counts = new Map<string, number>();
      const add = (tokens: string[], weight: number) => {
        for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + weight);
      };
      const body = tokenize(doc.fields.text);
      add(body, 1);
      add(tokenize(doc.fields.boosted), this.boost);
      this.lengths[doc.id] = body.length;
      for (const [term, tf] of counts) {
        let list = this.postings.get(term);
        if (!list) this.postings.set(term, (list = []));
        list.push({ doc: doc.id, tf });
      }
    }
    this.avgLength = Math.max(1, this.lengths.reduce((a, b) => a + b, 0) / Math.max(1, this.lengths.length));
  }

  search(query: string): { doc: number; score: number }[] {
    const scores = new Map<number, number>();
    const n = this.lengths.length;
    for (const term of new Set(tokenize(query))) {
      const list = this.postings.get(term);
      if (!list) continue;
      const idf = Math.log(1 + (n - list.length + 0.5) / (list.length + 0.5));
      for (const { doc, tf } of list) {
        const norm = tf + this.k1 * (1 - this.b + (this.b * this.lengths[doc]) / this.avgLength);
        scores.set(doc, (scores.get(doc) ?? 0) + idf * ((tf * (this.k1 + 1)) / norm));
      }
    }
    return [...scores.entries()].map(([doc, score]) => ({ doc, score })).sort((a, b) => b.score - a.score);
  }
}
