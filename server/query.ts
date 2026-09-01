import type { Author, Catalog, Passage, Query, SearchHit, Version, Work } from "./types";

export function escapeHtml(s: string | null | undefined): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function workById(catalog: Catalog, id: string): Work | undefined {
  return catalog.works.find((x) => x.id === id);
}

export function authorById(catalog: Catalog, id: string): Author | undefined {
  return catalog.authors.find((x) => x.id === id);
}

export function translationsOf(passage: Passage | null | undefined, versions: Version[]): Version[] {
  if (!passage) return [];
  return versions.filter((v) => v.group === "translation" && passage.versions[v.id] && passage.versions[v.id].length);
}

export function originalOf(passage: Passage | null | undefined): { id: string; paras: string[] } | null {
  if (!passage) return null;
  if (passage.versions.lat && passage.versions.lat.length) return { id: "lat", paras: passage.versions.lat };
  if (passage.versions.grk && passage.versions.grk.length) return { id: "grk", paras: passage.versions.grk };
  return null;
}

export function parseQuery(raw: string, catalog: Catalog): Query {
  const q = (raw || "").trim();
  if (!q) return { type: "empty" };
  const lower = q.toLowerCase();
  const romans: Record<string, number> = {
    i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12, xiii: 13
  };
  const bookHit = lower.match(/^(?:book|conf(?:essions|\.)?)\s+(i{1,3}|iv|vi{0,3}|ix|xi{0,2}|xiii|x|\d+)$/);
  if (bookHit) {
    const token = bookHit[1];
    const n = romans[token] || Number(token);
    if (n >= 1 && n <= 13) return { type: "ref", work: "confessions", chapter: n };
  }
  for (const w of catalog.works) {
    const names = [w.id, w.title, w.short].map((s) => s.toLowerCase());
    for (const n of names) {
      const re = new RegExp("^" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*(\\d+)?$", "i");
      const m = lower.match(re);
      if (m) return { type: "ref", work: w.id, chapter: m[1] ? Number(m[1]) : null };
    }
  }
  for (const a of catalog.authors) {
    if (a.name.toLowerCase() === lower || a.id === lower) {
      const w = catalog.works.find((x) => x.author === a.id);
      if (w) return { type: "ref", work: w.id, chapter: null };
    }
  }
  return { type: "keyword", q };
}

export function snippet(text: string, needle: string): { plain: string; html: string } {
  const i = text.toLowerCase().indexOf(needle.toLowerCase());
  const start = Math.max(0, i - 90);
  const end = Math.min(text.length, i + needle.length + 110);
  const plain = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  const re = new RegExp("(" + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
  return { plain, html: escapeHtml(plain).replace(re, "<mark>$1</mark>") };
}

export function searchKeyword(q: string, catalog: Catalog, passages: Passage[]): SearchHit[] {
  const needle = q.toLowerCase();
  const hits: SearchHit[] = [];
  passages.forEach((p) => {
    const blobs: string[] = [];
    translationsOf(p, catalog.versions).forEach((v) => blobs.push(p.versions[v.id].join(" ")));
    const orig = originalOf(p);
    if (orig) blobs.push(orig.paras.join(" "));
    blobs.push(p.heading);
    const hay = blobs.join(" ");
    if (hay.toLowerCase().includes(needle)) {
      const work = workById(catalog, p.work);
      const author = work ? authorById(catalog, work.author) : undefined;
      if (!work || !author) return;
      let snip = { plain: p.heading, html: escapeHtml(p.heading) };
      const fromTrans = translationsOf(p, catalog.versions).some((v) => {
        const para = (p.versions[v.id] || []).find((t) => t.toLowerCase().includes(needle));
        if (para) {
          snip = snippet(para, needle);
          return true;
        }
        return false;
      });
      if (!fromTrans && orig) {
        const para = orig.paras.find((t) => t.toLowerCase().includes(needle));
        if (para) snip = snippet(para, needle);
      }
      hits.push({
        work: p.work,
        chapter: p.chapter,
        heading: p.heading,
        author: author.name,
        title: work.title,
        snippet: snip.plain,
        snippetHtml: snip.html
      });
    }
  });
  catalog.authors.forEach((a) => {
    if (a.name.toLowerCase().includes(needle)) {
      const w = catalog.works.find((x) => x.author === a.id);
      if (w) {
        hits.unshift({
          work: w.id,
          chapter: 1,
          heading: a.name,
          author: a.name,
          title: w.title,
          snippet: a.name + " · " + a.dates + " · " + a.region,
          snippetHtml: escapeHtml(a.name + " · " + a.dates + " · " + a.region)
        });
      }
    }
  });
  const seen = new Set<string>();
  return hits.filter((h) => {
    const k = h.work + ":" + h.chapter;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
