import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { getChapter, getCatalog, handleApiRequest, runSearch } from "../server/api";
import { getLibrary } from "../server/corpus";
import { parseQuery } from "../server/query";

describe("parseQuery (shipped)", () => {
  const catalog = getCatalog();

  it("parses Confessions 1 as a Confessions chapter ref", () => {
    expect(parseQuery("Confessions 1", catalog)).toEqual({
      type: "ref",
      work: "confessions",
      chapter: 1
    });
  });

  it("parses Book 8 as a Confessions chapter ref", () => {
    expect(parseQuery("Book 8", catalog)).toEqual({
      type: "ref",
      work: "confessions",
      chapter: 8
    });
  });

  it("treats restless as a keyword query", () => {
    expect(parseQuery("restless", catalog)).toEqual({ type: "keyword", q: "restless" });
  });
});

describe("keyword search (shipped runSearch)", () => {
  it("returns at least one hit whose snippet contains restless from the real Pusey text", () => {
    const { catalog, passages, sources } = getLibrary();
    const pusey = readFileSync(sources.english, "utf8");
    expect(pusey.toLowerCase()).toContain("restless");

    const result = runSearch("restless");
    expect(result.query).toEqual({ type: "keyword", q: "restless" });
    expect(result.hits.length).toBeGreaterThan(0);
    const hit = result.hits.find((h) => h.snippet.toLowerCase().includes("restless"));
    expect(hit).toBeTruthy();
    expect(hit?.work).toBe("confessions");

    const passage = passages.find((p) => p.work === hit!.work && p.chapter === hit!.chapter);
    expect(passage?.versions.pusey.some((para) => para.toLowerCase().includes("restless"))).toBe(true);

    const viaApi = handleApiRequest("/api/search?q=restless");
    expect(viaApi.status).toBe(200);
    const json = viaApi.json as { hits: { snippet: string }[] };
    expect(json.hits.some((h) => h.snippet.toLowerCase().includes("restless"))).toBe(true);
    expect(catalog.works[0]?.id).toBe("confessions");
  });
});
