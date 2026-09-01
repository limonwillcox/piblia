import { parseQuery, searchKeyword } from "../../server/query";
import type { Catalog, Passage, SearchHit, Query, WorkPayload } from "../../server/types";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (res.ok) return res.json() as Promise<T>;
  if (!path.endsWith(".json") && !path.includes("?")) {
    const fallback = await fetch(path + ".json");
    if (fallback.ok) return fallback.json() as Promise<T>;
  }
  throw new Error(path + " failed: " + res.status);
}

export function fetchCatalog(): Promise<Catalog> {
  return getJson<Catalog>("/api/catalog");
}

export function fetchWork(id: string): Promise<WorkPayload> {
  return getJson<WorkPayload>("/api/works/" + encodeURIComponent(id));
}

export function fetchChapter(workId: string, chapter: number): Promise<Passage> {
  return getJson<Passage>("/api/works/" + encodeURIComponent(workId) + "/chapters/" + chapter);
}

export async function fetchSearch(q: string): Promise<{ query: Query; hits: SearchHit[] }> {
  const res = await fetch("/api/search?q=" + encodeURIComponent(q));
  if (res.ok) return res.json() as Promise<{ query: Query; hits: SearchHit[] }>;
  const catalog = await fetchCatalog();
  const query = parseQuery(q, catalog);
  if (query.type !== "keyword") return { query, hits: [] as SearchHit[] };
  const passages: Passage[] = [];
  for (const w of catalog.works) {
    try {
      const payload = await fetchWork(w.id);
      passages.push(...payload.chapters);
    } catch {
      /* skip missing work JSON */
    }
  }
  return { query, hits: searchKeyword(query.q, catalog, passages) };
}
