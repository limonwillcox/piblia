import { describe, expect, it } from "vitest";
import {
  extractSchaffNotes,
  parseEnglishWork,
  stripEditorialSections,
  type EnglishWorkSpec
} from "../server/englishWorks";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..");

describe("stripEditorialSections", () => {
  it("drops Introductory Notice until the next chapter heading", () => {
    const raw = [
      "THE TEACHING.",
      "",
      "  Introductory Notice",
      "",
      "   Schaff says many things about Bryennios.",
      "     __________________________________________________________________",
      "",
      "  Chapter I.--The Two Ways.",
      "",
      "   There are two ways, one of life and one of death."
    ].join("\n");
    const out = stripEditorialSections(raw);
    expect(out).not.toMatch(/Introductory Notice/i);
    expect(out).not.toMatch(/Bryennios/);
    expect(out).not.toMatch(/_{5,}/);
    expect(out).toMatch(/Chapter I/);
    expect(out).toMatch(/two ways/i);
  });

  it("drops Elucidations at the end of a block", () => {
    const raw = [
      "   Father text remains.",
      "",
      "  Elucidations.",
      "",
      "   [1] Editor talks about the treatise."
    ].join("\n");
    const out = stripEditorialSections(raw);
    expect(out).toMatch(/Father text remains/);
    expect(out).not.toMatch(/Elucidations/i);
    expect(out).not.toMatch(/Editor talks/);
  });
});

describe("extractSchaffNotes", () => {
  it("moves matched footnote bodies into footnotes and strips markers", () => {
    const paras = [
      'Reason directs those who are truly pious to honour only what is true, declining traditional opinions, [1768] if these be worthless.',
      '[1768] Literally, "the opinions of the ancients."',
      "Next father paragraph with no note."
    ];
    const { paras: cleaned, footnotes } = extractSchaffNotes(paras);
    expect(cleaned).toHaveLength(2);
    expect(cleaned[0]).not.toMatch(/\[1768\]/);
    expect(cleaned[0]).toMatch(/traditional opinions,/);
    expect(cleaned[1]).toBe("Next father paragraph with no note.");
    expect(footnotes).toEqual([
      { n: "1768", text: 'Literally, "the opinions of the ancients."', para: 0 }
    ]);
  });

  it("discards orphan footnote bodies and strips unmatched markers", () => {
    const paras = [
      "A line with a ghost marker [9999] in it.",
      "[8888] Orphan body with no marker in the unit."
    ];
    const { paras: cleaned, footnotes } = extractSchaffNotes(paras);
    expect(footnotes).toEqual([]);
    expect(cleaned).toEqual(["A line with a ghost marker in it."]);
  });

  it("does not treat chapter-title remnants as footnote bodies", () => {
    const paras = [
      "[2389] --The Second Commandment: Gross Sin Forbidden.",
      "Thou shalt not commit murder."
    ];
    const { paras: cleaned, footnotes } = extractSchaffNotes(paras);
    expect(footnotes).toEqual([]);
    expect(cleaned[0]).toMatch(/Second Commandment/);
  });
});

describe("parseEnglishWork cleanup integration", () => {
  it("extracts Justin First Apology footnotes and drops decorative rules", () => {
    const spec: EnglishWorkSpec = {
      id: "first-apology",
      author: "justin",
      title: "The First Apology",
      short: "1 Apol.",
      series: "ANF",
      path: "Fathers/English/Justin_English/The First Apology.txt",
      chunk: "chapter"
    };
    const { passages } = parseEnglishWork(spec, ROOT);
    expect(passages.length).toBeGreaterThan(5);
    const joined = passages.flatMap((p) => p.versions.schaff || []).join("\n");
    expect(joined).not.toMatch(/_{5,}/);
    expect(joined).not.toMatch(/^\s*\[\d+\]\s+Literally/m);

    const withNotes = passages.find((p) => (p.footnotes || []).some((f) => f.n === "1768"));
    expect(withNotes).toBeTruthy();
    const note = withNotes!.footnotes.find((f) => f.n === "1768")!;
    expect(note.text).toMatch(/opinions of the ancients/i);
    const para = (withNotes!.versions.schaff || [])[note.para] || "";
    expect(para).not.toMatch(/\[1768\]/);
    expect(para).toMatch(/traditional opinions/i);
  }, 60_000);

  it("does not open Didache on Schaff Introductory Notice", () => {
    const spec: EnglishWorkSpec = {
      id: "teaching-of-the-twelve-apostles",
      author: "didache",
      title: "Teaching of the Twelve Apostles",
      short: "Didache",
      series: "ANF",
      path: "Fathers/English/Didache_English/Teaching of the Twelve Apostles.txt",
      chunk: "chapter"
    };
    const { passages } = parseEnglishWork(spec, ROOT);
    expect(passages.length).toBeGreaterThan(3);
    const opening = passages
      .slice(0, 3)
      .flatMap((p) => p.versions.schaff || [])
      .join(" ");
    expect(opening).not.toMatch(/Bryennios/i);
    expect(opening).not.toMatch(/Introductory Notice/i);
    expect(opening).toMatch(/two ways|way of life|first commandment/i);
  }, 60_000);
});
