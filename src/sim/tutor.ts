/**
 * Offline teaching assistant: BM25 retrieval over a fixed knowledge base.
 * No model, no network. Vietnamese is matched with or without diacritics.
 */

import { KB, type Entry } from "./tutor-kb.ts";

/** Lower-case, strip diacritics (đ → d), keep letters, digits and a few math signs. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/²/g, "2")
    // "R²", "R^2", "R bình phương" are one term, not the letter r plus "square".
    .replace(/\br\s*\^?\s*2\b|\br binh phuong\b|\br squared\b/g, " rsquared ")
    .replace(/[^a-z0-9.\-^ ]+/g, " ");
}

const STOP = new Set(
  (
    "la gi the nao nhu sao vi sao tai sao co khong duoc va hay cua cho trong voi mot nhung cac nay do thi ma de " +
    "minh toi ban em anh chi ai bao nhieu " +
    "what is are the a an of to in how why do does and or for with on it be can i my me this that which"
  ).split(/\s+/),
);

export function tokens(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/** Bigrams catch Vietnamese two-syllable words ("khoang cach", "hieu ung"). */
function grams(toks: string[]): string[] {
  const out = [...toks];
  for (let i = 0; i + 1 < toks.length; i++) out.push(`${toks[i]}_${toks[i + 1]}`);
  return out;
}

type Doc = { entry: Entry; tf: Map<string, number>; len: number };

const FIELD_WEIGHT = { q: 3, keys: 2, a: 1 } as const;

function build(entries: Entry[]): { docs: Doc[]; df: Map<string, number>; avg: number } {
  const docs: Doc[] = entries.map((entry) => {
    const tf = new Map<string, number>();
    const add = (text: string, w: number) => {
      for (const g of grams(tokens(text))) tf.set(g, (tf.get(g) ?? 0) + w);
    };
    add(`${entry.q.vi} ${entry.q.en}`, FIELD_WEIGHT.q);
    add(entry.keys, FIELD_WEIGHT.keys);
    add(`${entry.a.vi} ${entry.a.en}`, FIELD_WEIGHT.a);
    let len = 0;
    tf.forEach((v) => (len += v));
    return { entry, tf, len };
  });
  const df = new Map<string, number>();
  for (const d of docs) for (const g of d.tf.keys()) df.set(g, (df.get(g) ?? 0) + 1);
  const avg = docs.reduce((s, d) => s + d.len, 0) / Math.max(1, docs.length);
  return { docs, df, avg };
}

const INDEX = build(KB);

export type Hit = { entry: Entry; score: number };

/** BM25 scores for every entry, best first. */
export function search(query: string, k1 = 1.2, b = 0.75): Hit[] {
  const q = [...new Set(grams(tokens(query)))];
  if (!q.length) return [];
  const N = INDEX.docs.length;
  const hits = INDEX.docs.map((d) => {
    let score = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = INDEX.df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / INDEX.avg)));
    }
    return { entry: d.entry, score };
  });
  return hits.filter((h) => h.score > 0).sort((a, b2) => b2.score - a.score);
}

/** Share of the question's words that the entry contains. */
export function coverage(query: string, entry: Entry): number {
  const q = [...new Set(tokens(query))];
  if (!q.length) return 0;
  const doc = new Set(tokens(`${entry.q.vi} ${entry.q.en} ${entry.keys} ${entry.a.vi} ${entry.a.en}`));
  return q.filter((t) => doc.has(t)).length / q.length;
}

/**
 * Answer only when the best entry covers most of the question, or scores
 * clearly with at least a third of it; otherwise say there is no source.
 */
export function confident(query: string, hit: Hit | undefined): boolean {
  if (!hit) return false;
  const c = coverage(query, hit.entry);
  return (hit.score >= 2 && c >= 0.6) || (hit.score >= 6 && c >= 0.34);
}

export type Reply =
  | { kind: "answer"; entry: Entry; related: Entry[] }
  | { kind: "none"; related: Entry[] };

export function ask(query: string): Reply {
  const hits = search(query);
  const top = hits[0];
  if (!confident(query, top)) return { kind: "none", related: hits.slice(0, 3).map((h) => h.entry) };
  return { kind: "answer", entry: top!.entry, related: hits.slice(1, 3).map((h) => h.entry) };
}

export { KB };
