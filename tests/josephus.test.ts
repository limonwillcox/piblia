import { describe, expect, it } from "vitest";
import { getLibrary } from "../server/corpus";

const JOSEPHUS_WORKS = [
  "antiquities-of-the-jews",
  "wars-of-the-jews",
  "against-apion",
  "life-of-flavius-josephus",
  "discourse-to-the-greeks-concerning-hades"
] as const;

describe("Josephus Whiston corpus", () => {
  it("registers Flavius Josephus with five blob works and a disputed flag on Hades", () => {
    const lib = getLibrary();
    const author = lib.catalog.authors.find((a) => a.id === "josephus");
    expect(author).toBeTruthy();
    expect(author!.name).toMatch(/Josephus/i);

    const works = lib.catalog.works.filter((w) => w.author === "josephus");
    expect(works.map((w) => w.id).sort()).toEqual([...JOSEPHUS_WORKS].sort());
    expect(works.every((w) => w.series === "Whiston")).toBe(true);

    for (const id of JOSEPHUS_WORKS) {
      const ps = lib.passages.filter((p) => p.work === id);
      expect(ps.length).toBeGreaterThan(0);
      expect(ps.some((p) => (p.versions.schaff || []).length > 0)).toBe(true);
    }

    const hades = works.find((w) => w.id === "discourse-to-the-greeks-concerning-hades");
    expect(hades?.authorshipDisputed).toBe(true);
    expect(works.filter((w) => w.id !== hades!.id).every((w) => !w.authorshipDisputed)).toBe(true);
  }, 180_000);
});
