import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { Author, Passage, Work } from "./types";

export type EnglishWorkSpec = {
  id: string;
  author: string;
  title: string;
  short: string;
  series: string;
  path: string;
  chunk: "book" | "chapter";
  expectUnits?: number;
};

/** Allowlist for Pages. Flip/extend later to cover all *_English extracts. */
export const ENGLISH_APP_WORKS: EnglishWorkSpec[] = [
  {
    id: "concerning-virgins",
    author: "ambrose",
    title: "Concerning Virgins",
    short: "Virgins",
    series: "NPNF2",
    path: "Fathers/English/Ambrose_English/Concerning Virgins.txt",
    chunk: "chapter"
  },
  {
    id: "city-of-god",
    author: "augustine",
    title: "The City of God",
    short: "Civ. Dei",
    series: "NPNF1",
    path: "Fathers/English/Augustine_English/The City of God.txt",
    chunk: "book",
    expectUnits: 22
  }
];

export const ENGLISH_AUTHORS: Author[] = [
  {
    id: "ambrose",
    name: "Ambrose of Milan",
    dates: "c. 340–397",
    era: "post-nicene",
    region: "Italy"
  }
];

// Allow trailing note markers e.g. "Book IV. [160]"
const BOOK_RE = /^\s*Book\s+([IVXLCDM]+|\d+)\s*\.(?:\s*\[\d+\])?\s*$/im;
const CHAPTER_RE = /^\s*Chapter\s+([IVXLCDM]+|\d+)\s*[\.—\-.]/im;

function stripMetaHeaders(src: string): string {
  const lines = src.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && /^\s*#/.test(lines[i])) i++;
  return lines.slice(i).join("\n");
}

function parasFromBlock(block: string): string[] {
  return block
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t]+\n/g, "\n").replace(/\s+\n/g, "\n").replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0 && !/^_{5,}$/.test(p) && !/^-+$/.test(p));
}

function findMarks(src: string, re: RegExp): { label: string; index: number; end: number }[] {
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const global = new RegExp(re.source, flags);
  const marks: { label: string; index: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = global.exec(src))) {
    marks.push({ label: m[1], index: m.index, end: m.index + m[0].length });
  }
  return marks;
}

function romanOrNum(label: string): string {
  return label.toUpperCase();
}

/** Split English Schaff extract into Passage units (translation id: schaff). */
export function parseEnglishWork(spec: EnglishWorkSpec, root: string): { work: Work; passages: Passage[] } {
  const file = join(root, spec.path);
  if (!existsSync(file)) throw new Error("Missing English work file: " + spec.path);
  const raw = stripMetaHeaders(readFileSync(file, "utf8"));

  const unitRe = spec.chunk === "book" ? BOOK_RE : CHAPTER_RE;
  const marks = findMarks(raw, unitRe);
  if (!marks.length) {
    const paras = parasFromBlock(raw);
    return {
      work: {
        id: spec.id,
        author: spec.author,
        title: spec.title,
        short: spec.short,
        chapters: 1,
        series: spec.series
      },
      passages: [
        {
          work: spec.id,
          chapter: 1,
          heading: spec.title,
          versions: { schaff: paras.length ? paras : [raw.trim()] },
          footnotes: []
        }
      ]
    };
  }

  // For chapter mode, track nearest preceding Book for headings.
  const bookMarks = spec.chunk === "chapter" ? findMarks(raw, BOOK_RE) : [];

  const passages: Passage[] = [];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].end;
    const stop = i + 1 < marks.length ? marks[i + 1].index : raw.length;
    const block = raw.slice(start, stop);
    const paras = parasFromBlock(block);
    let heading: string;
    if (spec.chunk === "book") {
      heading = "Book " + romanOrNum(marks[i].label);
    } else {
      let bookLabel = "";
      for (let b = bookMarks.length - 1; b >= 0; b--) {
        if (bookMarks[b].index <= marks[i].index) {
          bookLabel = romanOrNum(bookMarks[b].label);
          break;
        }
      }
      const firstLine = block.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0) || "";
      const titleBit = firstLine.replace(/^[\.—\-\s]+/, "").slice(0, 120);
      heading = (bookLabel ? "Book " + bookLabel + " · " : "") + "Chapter " + romanOrNum(marks[i].label) + (titleBit ? " — " + titleBit : "");
    }
    passages.push({
      work: spec.id,
      chapter: i + 1,
      heading,
      versions: { schaff: paras.length ? paras : [block.replace(/\s+/g, " ").trim()] },
      footnotes: []
    });
  }

  if (spec.expectUnits != null && passages.length !== spec.expectUnits) {
    throw new Error(
      spec.id + ": expected " + spec.expectUnits + " " + spec.chunk + " units, found " + passages.length
    );
  }

  return {
    work: {
      id: spec.id,
      author: spec.author,
      title: spec.title,
      short: spec.short,
      chapters: passages.length,
      series: spec.series
    },
    passages
  };
}

export function loadEnglishAppWorks(root: string): { works: Work[]; passages: Passage[]; authors: Author[] } {
  const works: Work[] = [];
  const passages: Passage[] = [];
  for (const spec of ENGLISH_APP_WORKS) {
    const parsed = parseEnglishWork(spec, root);
    works.push(parsed.work);
    passages.push(...parsed.passages);
  }
  return { works, passages, authors: ENGLISH_AUTHORS };
}
