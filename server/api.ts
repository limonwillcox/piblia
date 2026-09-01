import { getLibrary } from "./corpus";
import { authorById, parseQuery, searchKeyword, workById } from "./query";
import type { ApiResult, Passage, WorkPayload } from "./types";

export function getCatalog() {
  return getLibrary().catalog;
}

export function getWork(workId: string): WorkPayload | null {
  const { catalog, passages } = getLibrary();
  const work = workById(catalog, workId);
  if (!work) return null;
  const author = authorById(catalog, work.author);
  if (!author) return null;
  const chapters = passages
    .filter((p) => p.work === work.id)
    .sort((a, b) => a.chapter - b.chapter);
  return { work, author, chapters };
}

export function getChapter(workId: string, chapter: number): Passage | null {
  const payload = getWork(workId);
  if (!payload) return null;
  return payload.chapters.find((p) => p.chapter === chapter) || null;
}

export function runSearch(q: string) {
  const { catalog, passages } = getLibrary();
  const query = parseQuery(q, catalog);
  if (query.type === "empty") return { query, hits: [] as ReturnType<typeof searchKeyword> };
  if (query.type === "ref") return { query, hits: [] as ReturnType<typeof searchKeyword> };
  return { query, hits: searchKeyword(query.q, catalog, passages) };
}

export function handleApiRequest(urlOrPath: string): ApiResult {
  const url = urlOrPath.startsWith("http") ? new URL(urlOrPath) : new URL(urlOrPath, "http://localhost");
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (path === "/api/catalog") {
    return { status: 200, json: getCatalog() };
  }

  const chapterMatch = path.match(/^\/api\/works\/([^/]+)\/chapters\/(\d+)$/);
  if (chapterMatch) {
    const workId = decodeURIComponent(chapterMatch[1]);
    const n = Number(chapterMatch[2]);
    const chapter = getChapter(workId, n);
    if (!chapter) return { status: 404, json: { error: "Chapter not found" } };
    return { status: 200, json: chapter };
  }

  const workMatch = path.match(/^\/api\/works\/([^/]+)$/);
  if (workMatch) {
    const workId = decodeURIComponent(workMatch[1]);
    const payload = getWork(workId);
    if (!payload) return { status: 404, json: { error: "Work not found" } };
    return { status: 200, json: payload };
  }

  if (path === "/api/search") {
    const q = url.searchParams.get("q") || "";
    return { status: 200, json: runSearch(q) };
  }

  return { status: 404, json: { error: "Not found" } };
}
