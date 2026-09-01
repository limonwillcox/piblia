import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { getChapter, getWork, handleApiRequest } from "../server/api";
import { getLibrary } from "../server/corpus";

describe("corpus from Fathers/ (shipped loadLibrary)", () => {
  it("parses 13 English books and 13 Latin books", () => {
    const lib = getLibrary();
    expect(lib.parsed.books).toHaveLength(13);
    expect(lib.parsed.books.every((b) => b.paras.length > 0)).toBe(true);
    expect(lib.parsed.books.every((b) => b.latin.length > 0)).toBe(true);
    expect(lib.passages.filter((p) => p.work === "confessions")).toHaveLength(13);
    expect(lib.catalog.works.find((w) => w.id === "confessions")?.chapters).toBe(13);
  });

  it("loads English allowlist works (Virgins chapters, City of God 22 books)", () => {
    const lib = getLibrary();
    expect(lib.catalog.authors.some((a) => a.id === "ambrose")).toBe(true);
    const virgins = lib.catalog.works.find((w) => w.id === "concerning-virgins");
    const city = lib.catalog.works.find((w) => w.id === "city-of-god");
    expect(virgins).toBeTruthy();
    expect(city).toBeTruthy();
    expect(city!.chapters).toBe(22);
    const vPassages = lib.passages.filter((p) => p.work === "concerning-virgins");
    const cPassages = lib.passages.filter((p) => p.work === "city-of-god");
    expect(vPassages.length).toBeGreaterThan(10);
    expect(vPassages.every((p) => (p.versions.schaff || []).length > 0)).toBe(true);
    expect(cPassages).toHaveLength(22);
    expect(cPassages[0]!.heading).toMatch(/Book I\b/i);
    expect(cPassages.every((p) => (p.versions.schaff || []).length > 0)).toBe(true);
    expect(getWork("city-of-god")?.chapters).toHaveLength(22);
    expect(getWork("concerning-virgins")?.work.title).toMatch(/Virgins/i);
  });

  it("reads Confessions chapter 1 translation from Pusey and Latin opening from the source files", () => {
    const lib = getLibrary();
    const englishSrc = readFileSync(lib.sources.english, "utf8");
    const latinSrc = readFileSync(lib.sources.latin, "utf8");
    const chapter = getChapter("confessions", 1);
    expect(chapter).toBeTruthy();

    const pusey = chapter!.versions.pusey.join(" ");
    expect(pusey.length).toBeGreaterThan(40);
    const enOpen = englishSrc.match(/Great art Thou, O Lord[\s\S]{0,80}/);
    expect(enOpen).toBeTruthy();
    const enNeedle = enOpen![0].replace(/\s+/g, " ").trim().slice(0, 48);
    expect(pusey.replace(/\s+/g, " ")).toContain(enNeedle);

    const latin = chapter!.versions.lat.join(" ");
    expect(latin.replace(/\s+/g, " ")).toMatch(/^\s*Magnus es/i);
    const laOpen = latinSrc.match(/Magnus es[^\n]{0,40}/);
    expect(laOpen).toBeTruthy();
    expect(latin.startsWith(laOpen![0].slice(0, 20))).toBe(true);

    const viaApi = handleApiRequest("/api/works/confessions/chapters/1");
    expect(viaApi.status).toBe(200);
    const json = viaApi.json as { versions: { pusey: string[]; lat: string[] } };
    expect(json.versions.pusey.join(" ")).toContain(enNeedle);
    expect(json.versions.lat.join(" ")).toMatch(/Magnus es/i);

    const work = getWork("confessions");
    expect(work?.chapters.length).toBe(13);
  });
});
