import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { Author, Passage, Work } from "./types";

export type ChunkMode = "book" | "chapter" | "sermon" | "letter" | "homily";

export type EnglishWorkSpec = {
  id: string;
  author: string;
  title: string;
  short: string;
  series: string;
  path: string;
  chunk: ChunkMode | "auto";
  expectUnits?: number;
};

/** Hand overrides for works that need a fixed chunk mode / unit count. */
const SPEC_OVERRIDES: Record<string, Partial<EnglishWorkSpec>> = {
  "city-of-god": { chunk: "book", expectUnits: 22 },
  "concerning-virgins": { chunk: "chapter" }
};

/** Skip these under *_English (already shipped elsewhere, or non-Schaff). */
const SKIP_FILES = new Set([
  "The Confessions of St. Augustine. Augustine.txt", // Pusey → confessions work
  "The Confessions (NPNF Pilkington).txt" // duplicate of Confessions for MVP
]);

type AuthorMeta = { name: string; dates: string; era: string; region: string };

const AUTHOR_META: Record<string, AuthorMeta> = {
  ambrose: { name: "Ambrose of Milan", dates: "c. 340–397", era: "post-nicene", region: "Italy" },
  arnobius: { name: "Arnobius of Sicca", dates: "fl. c. 300", era: "ante-nicene", region: "North Africa" },
  augustine: { name: "Augustine of Hippo", dates: "354–430", era: "post-nicene", region: "North Africa" },
  commodianus: { name: "Commodianus", dates: "fl. 3rd–5th c.", era: "ante-nicene", region: "West" },
  gregory: { name: "Gregory the Great", dates: "c. 540–604", era: "post-nicene", region: "Italy" },
  gregory_thaumaturgus: { name: "Gregory Thaumaturgus", dates: "c. 213–c. 270", era: "ante-nicene", region: "Pontus" },
  methodius: { name: "Methodius of Olympus", dates: "d. c. 311", era: "ante-nicene", region: "Olympus" },
  jerome: { name: "Jerome", dates: "c. 347–420", era: "post-nicene", region: "Rome / Palestine" },
  lactantius: { name: "Lactantius", dates: "c. 250–325", era: "ante-nicene", region: "North Africa / Gaul" },
  leo: { name: "Leo the Great", dates: "c. 400–461", era: "post-nicene", region: "Italy" },
  minucius_felix: { name: "Minucius Felix", dates: "fl. 2nd–3rd c.", era: "ante-nicene", region: "Rome" },
  novatian: { name: "Novatian", dates: "fl. mid-3rd c.", era: "ante-nicene", region: "Rome" },
  sulpicius_severus: { name: "Sulpicius Severus", dates: "c. 363–c. 425", era: "post-nicene", region: "Gaul" },
  tertullian: { name: "Tertullian", dates: "c. 155–c. 240", era: "ante-nicene", region: "North Africa" },
  vincent: { name: "Vincent of Lérins", dates: "d. c. 450", era: "post-nicene", region: "Gaul" },
  // Placeholders for upcoming Greek / remaining splits
  justin: { name: "Justin Martyr", dates: "c. 100–165", era: "ante-nicene", region: "Rome" },
  irenaeus: { name: "Irenaeus of Lyons", dates: "c. 130–c. 202", era: "ante-nicene", region: "Gaul" },
  clement_rome: { name: "Clement of Rome", dates: "fl. c. 96", era: "ante-nicene", region: "Rome" },
  ignatius: { name: "Ignatius of Antioch", dates: "d. c. 110", era: "ante-nicene", region: "Syria" },
  polycarp: { name: "Polycarp of Smyrna", dates: "c. 69–155", era: "ante-nicene", region: "Asia Minor" },
  hermas: { name: "Hermas", dates: "fl. 2nd c.", era: "ante-nicene", region: "Rome" },
  barnabas: { name: "Barnabas (Epistle)", dates: "fl. 1st–2nd c.", era: "ante-nicene", region: "Unknown" },
  didache: { name: "Didache", dates: "fl. 1st–2nd c.", era: "ante-nicene", region: "Syria?" },
  papias: { name: "Papias of Hierapolis", dates: "fl. early 2nd c.", era: "ante-nicene", region: "Asia Minor" },
  mathetes: { name: "Mathetes (to Diognetus)", dates: "fl. 2nd c.", era: "ante-nicene", region: "Unknown" },
  tatian: { name: "Tatian", dates: "fl. mid-2nd c.", era: "ante-nicene", region: "Syria" },
  theophilus: { name: "Theophilus of Antioch", dates: "fl. late 2nd c.", era: "ante-nicene", region: "Syria" },
  athenagoras: { name: "Athenagoras", dates: "fl. late 2nd c.", era: "ante-nicene", region: "Athens" },
  clement_alexandria: { name: "Clement of Alexandria", dates: "c. 150–c. 215", era: "ante-nicene", region: "Egypt" },
  origen: { name: "Origen", dates: "c. 185–c. 254", era: "ante-nicene", region: "Egypt / Palestine" },
  hippolytus: { name: "Hippolytus", dates: "c. 170–c. 235", era: "ante-nicene", region: "Rome" },
  cyprian: { name: "Cyprian of Carthage", dates: "d. 258", era: "ante-nicene", region: "North Africa" },
  dionysius: { name: "Dionysius", dates: "fl. 3rd c.", era: "ante-nicene", region: "Various" },
  eusebius: { name: "Eusebius of Caesarea", dates: "c. 260–c. 339", era: "post-nicene", region: "Palestine" },
  athanasius: { name: "Athanasius of Alexandria", dates: "c. 296–373", era: "post-nicene", region: "Egypt" },
  basil: { name: "Basil the Great", dates: "c. 330–379", era: "post-nicene", region: "Cappadocia" },
  gregory_nazianzen: { name: "Gregory Nazianzen", dates: "c. 329–390", era: "post-nicene", region: "Cappadocia" },
  gregory_nyssa: { name: "Gregory of Nyssa", dates: "c. 335–c. 395", era: "post-nicene", region: "Cappadocia" },
  chrysostom: { name: "John Chrysostom", dates: "c. 347–407", era: "post-nicene", region: "Antioch / Constantinople" },
  cyril_jerusalem: { name: "Cyril of Jerusalem", dates: "c. 313–386", era: "post-nicene", region: "Palestine" },
  hilary: { name: "Hilary of Poitiers", dates: "c. 310–c. 367", era: "post-nicene", region: "Gaul" },
  john_damascus: { name: "John of Damascus", dates: "c. 675–749", era: "post-nicene", region: "Syria" },
  socrates: { name: "Socrates Scholasticus", dates: "c. 380–c. 439", era: "post-nicene", region: "Constantinople" },
  sozomen: { name: "Sozomen", dates: "c. 400–c. 450", era: "post-nicene", region: "Constantinople" },
  theodoret: { name: "Theodoret of Cyrus", dates: "c. 393–c. 458", era: "post-nicene", region: "Syria" },
  rufinus: { name: "Rufinus of Aquileia", dates: "c. 345–411", era: "post-nicene", region: "Italy" },
  cassian: { name: "John Cassian", dates: "c. 360–c. 435", era: "post-nicene", region: "Gaul" },
  ephraim: { name: "Ephraim the Syrian", dates: "c. 306–373", era: "post-nicene", region: "Syria" },
  aphrahat: { name: "Aphrahat", dates: "fl. 4th c.", era: "post-nicene", region: "Persia" },
  councils: { name: "Ecumenical Councils", dates: "325–787", era: "post-nicene", region: "Various" },
  apostolic: { name: "Apostolic Fathers (misc.)", dates: "1st–2nd c.", era: "ante-nicene", region: "Various" },
  unknown: { name: "Unknown / Collected", dates: "", era: "ante-nicene", region: "Various" }
};

const BOOK_RE = /^\s*Book\s+([IVXLCDM]+|\d+)\s*\.(?:\s*\[\d+\])?\s*$/im;
const CHAPTER_RE = /^\s*Chapter\s+([IVXLCDM]+|\d+)\s*[\.—\-.]/im;
const SERMON_RE = /^\s*Sermon\s+([IVXLCDM]+|\d+)\s*\./im;
const LETTER_RE = /^\s*Letter\s+([IVXLCDM]+|\d+)\s*[\.\:\-]/im;
const HOMILY_RE = /^\s*Homily\s+([IVXLCDM]+|\d+)\s*[\.\:\-]/im;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^(the|a|an)-/, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function shortTitle(title: string): string {
  const t = title.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim();
  if (t.length <= 28) return t;
  return t.slice(0, 26).replace(/\s+\S*$/, "") + "…";
}

function fatherIdFromFolder(folder: string): string {
  return folder.replace(/_English$/i, "").toLowerCase();
}

function parseMetaHeaders(src: string): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const line of src.split(/\r?\n/)) {
    if (!/^\s*#/.test(line)) break;
    const m = line.match(/^\s*#\s*([a-z_]+)\s*:\s*(.*)$/i);
    if (m) meta[m[1].toLowerCase()] = m[2].trim();
  }
  return meta;
}

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

function unitRegex(mode: ChunkMode): RegExp {
  if (mode === "book") return BOOK_RE;
  if (mode === "sermon") return SERMON_RE;
  if (mode === "letter") return LETTER_RE;
  if (mode === "homily") return HOMILY_RE;
  return CHAPTER_RE;
}

function unitLabel(mode: ChunkMode, label: string): string {
  if (mode === "book") return "Book " + romanOrNum(label);
  if (mode === "sermon") return "Sermon " + romanOrNum(label);
  if (mode === "letter") return "Letter " + romanOrNum(label);
  if (mode === "homily") return "Homily " + romanOrNum(label);
  return "Chapter " + romanOrNum(label);
}

function detectChunk(raw: string): ChunkMode | "blob" {
  const books = findMarks(raw, BOOK_RE).length;
  const chapters = findMarks(raw, CHAPTER_RE).length;
  const sermons = findMarks(raw, SERMON_RE).length;
  const letters = findMarks(raw, LETTER_RE).length;
  const homilies = findMarks(raw, HOMILY_RE).length;

  // Prefer distinctive sermon/letter/homily collections when dense.
  if (sermons >= 5 && sermons >= chapters && sermons >= books) return "sermon";
  if (letters >= 5 && letters >= chapters && letters >= books) return "letter";
  if (homilies >= 5 && homilies >= chapters && homilies >= books) return "homily";

  // Many chapters per book → navigate by book (City of God, Trinity, etc.)
  if (books >= 2 && (chapters < 2 || chapters / books >= 10)) return "book";
  if (chapters >= 2) return "chapter";
  if (books >= 2) return "book";
  if (sermons >= 2) return "sermon";
  if (letters >= 2) return "letter";
  if (homilies >= 2) return "homily";
  return "blob";
}

/** Discover every Fathers/English/*_English/*.txt extract as an app work. */
export function discoverEnglishWorkSpecs(root: string): EnglishWorkSpec[] {
  const englishRoot = join(root, "Fathers", "English");
  if (!existsSync(englishRoot)) return [];
  const specs: EnglishWorkSpec[] = [];
  const usedIds = new Set<string>();

  for (const folder of readdirSync(englishRoot).sort()) {
    if (!folder.endsWith("_English")) continue;
    const fatherFolder = join(englishRoot, folder);
    const author = fatherIdFromFolder(folder);
    for (const file of readdirSync(fatherFolder).sort()) {
      if (!file.endsWith(".txt")) continue;
      if (SKIP_FILES.has(file)) continue;
      const abs = join(fatherFolder, file);
      const raw = readFileSync(abs, "utf8");
      const meta = parseMetaHeaders(raw);
      const title = (meta.work || file.replace(/\.txt$/i, "")).trim();
      let id = slugify(title);
      if (!id) id = slugify(file.replace(/\.txt$/i, "")) || "work";
      // Disambiguate collisions (e.g. Letters.txt under multiple fathers)
      if (usedIds.has(id)) id = slugify(author + "-" + title) || id + "-" + author;
      if (usedIds.has(id)) id = id + "-" + usedIds.size;
      usedIds.add(id);

      const series = meta.series || "Schaff";
      const path = ["Fathers", "English", folder, file].join("/");
      const base: EnglishWorkSpec = {
        id,
        author,
        title,
        short: shortTitle(title),
        series,
        path,
        chunk: "auto"
      };
      const over = SPEC_OVERRIDES[id];
      specs.push(over ? { ...base, ...over, id, path, author, title: over.title || title } : base);
    }
  }
  return specs;
}

/** @deprecated Prefer discoverEnglishWorkSpecs — kept for tests / explicit pin of Virgins + City. */
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

export function authorMeta(id: string): Author {
  const m = AUTHOR_META[id] || {
    name: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    dates: "",
    era: "post-nicene",
    region: ""
  };
  return { id, ...m };
}

export function authorsFromSpecs(specs: EnglishWorkSpec[]): Author[] {
  const seen = new Set<string>();
  const out: Author[] = [];
  for (const s of specs) {
    if (seen.has(s.author)) continue;
    seen.add(s.author);
    out.push(authorMeta(s.author));
  }
  return out;
}

/** Allow trailing note markers e.g. "Book IV. [160]" — see unit regexes above. */

/** Split English Schaff extract into Passage units (translation id: schaff). */
export function parseEnglishWork(spec: EnglishWorkSpec, root: string): { work: Work; passages: Passage[] } {
  const file = join(root, spec.path);
  if (!existsSync(file)) throw new Error("Missing English work file: " + spec.path);
  const raw = stripMetaHeaders(readFileSync(file, "utf8"));

  let mode: ChunkMode | "blob" = spec.chunk === "auto" ? detectChunk(raw) : spec.chunk;

  // Soft-cap ultra-dense chapter scans (e.g. verse/psalm dumps) for MVP memory.
  if (mode !== "blob" && mode !== "book") {
    const previewMarks = findMarks(raw, unitRegex(mode));
    if (previewMarks.length > 400) {
      const books = findMarks(raw, BOOK_RE).length;
      mode = books >= 2 ? "book" : "blob";
    }
  }

  if (mode === "blob") {
    const paras = parasFromBlock(raw);
    // Split giant blobs into navigable chunks (~40 paras) so the reader/API stay usable.
    if (paras.length > 80) {
      const chunkSize = 40;
      const passages: Passage[] = [];
      for (let i = 0; i < paras.length; i += chunkSize) {
        const slice = paras.slice(i, i + chunkSize);
        const n = passages.length + 1;
        passages.push({
          work: spec.id,
          chapter: n,
          heading: spec.title + " · Part " + n,
          versions: { schaff: slice },
          footnotes: []
        });
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
          versions: { schaff: paras.length ? paras : [raw.trim() || spec.title] },
          footnotes: []
        }
      ]
    };
  }

  const unitRe = unitRegex(mode);
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
          versions: { schaff: paras.length ? paras : [raw.trim() || spec.title] },
          footnotes: []
        }
      ]
    };
  }

  const bookMarks = mode === "chapter" ? findMarks(raw, BOOK_RE) : [];

  const passages: Passage[] = [];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].end;
    const stop = i + 1 < marks.length ? marks[i + 1].index : raw.length;
    const block = raw.slice(start, stop);
    const paras = parasFromBlock(block);
    let heading = unitLabel(mode, marks[i].label);
    if (mode === "chapter") {
      let bookLabel = "";
      for (let b = bookMarks.length - 1; b >= 0; b--) {
        if (bookMarks[b].index <= marks[i].index) {
          bookLabel = romanOrNum(bookMarks[b].label);
          break;
        }
      }
      const firstLine = block.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0) || "";
      const titleBit = firstLine.replace(/^[\.—\-\s]+/, "").slice(0, 120);
      heading = (bookLabel ? "Book " + bookLabel + " · " : "") + heading + (titleBit ? " — " + titleBit : "");
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
      spec.id + ": expected " + spec.expectUnits + " " + mode + " units, found " + passages.length
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
  const specs = discoverEnglishWorkSpecs(root);
  const works: Work[] = [];
  const passages: Passage[] = [];
  for (const spec of specs) {
    try {
      const parsed = parseEnglishWork(spec, root);
      works.push(parsed.work);
      passages.push(...parsed.passages);
    } catch (err) {
      // MVP: never block the whole library on one bad extract — ship as one blob.
      console.warn("[englishWorks] fallback blob for", spec.id, err);
      const file = join(root, spec.path);
      const raw = existsSync(file) ? stripMetaHeaders(readFileSync(file, "utf8")) : "";
      const paras = parasFromBlock(raw);
      works.push({
        id: spec.id,
        author: spec.author,
        title: spec.title,
        short: spec.short,
        chapters: 1,
        series: spec.series
      });
      passages.push({
        work: spec.id,
        chapter: 1,
        heading: spec.title,
        versions: { schaff: paras.length ? paras : [raw.trim() || spec.title] },
        footnotes: []
      });
    }
  }
  return { works, passages, authors: authorsFromSpecs(specs) };
}
