import { readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function findSources() {
  const english = [];
  const latin = [];
  function walk(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(p);
        continue;
      }
      if (!/\.txt$/i.test(ent.name)) continue;
      if (/latin/i.test(ent.name)) latin.push(p);
      else if (/confessions/i.test(ent.name)) english.push(p);
    }
  }
  walk(join(root, "Fathers"));
  if (!english.length) throw new Error("Could not find English Confessions .txt under Fathers/");
  if (!latin.length) throw new Error("Could not find Latin Confessions .txt under Fathers/");
  return { english: english[0], latin: latin[0] };
}

const sources = findSources();
const src = readFileSync(sources.english, "utf8");

const start = src.search(/^BOOK I\s*$/m);
const endMatch = src.search(/^ {0,}GRATIAS TIBI DOMINE\s*$/m);
if (start < 0 || endMatch < 0) {
  throw new Error("Could not find BOOK I or GRATIAS TIBI DOMINE");
}
const body = src.slice(start, endMatch) + "GRATIAS TIBI DOMINE\n";

const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];
const romanSet = roman.join("|");

function parseLatin() {
  const latinSrc = readFileSync(sources.latin, "utf8");
  const bookRe = new RegExp("^Liber (" + romanSet + ")\\s*$", "gm");
  const marks = [];
  let m;
  while ((m = bookRe.exec(latinSrc))) {
    marks.push({ roman: m[1], index: m.index, end: m.index + m[0].length });
  }
  if (marks.length !== 13) {
    throw new Error("Expected 13 Latin books, found " + marks.length);
  }
  return marks.map((mark, i) => {
    const from = mark.end;
    const to = i + 1 < marks.length ? marks[i + 1].index : latinSrc.length;
    const chunk = latinSrc.slice(from, to);
    const capRe = /^CAPUT\s+(\d+)\s*$/gm;
    const caps = [];
    let c;
    while ((c = capRe.exec(chunk))) {
      caps.push({ index: c.index, end: c.index + c[0].length });
    }
    const slices = caps.length ? caps : [{ index: 0, end: 0 }];
    return slices.map((cap, j) => {
      const start = cap.end;
      const end = j + 1 < slices.length ? slices[j + 1].index : chunk.length;
      return chunk
        .slice(start, end)
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !/^CAPUT\s+\d+$/.test(l) && !/^Liber\s+[IVX]+$/.test(l))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }).filter(Boolean);
  });
}
const bookRe = /^BOOK (I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII)\s*$/gm;
const marks = [];
let m;
while ((m = bookRe.exec(body))) {
  marks.push({ roman: m[1], index: m.index, end: m.index + m[0].length });
}
if (marks.length !== 13) {
  throw new Error("Expected 13 books, found " + marks.length);
}

function unwrapParagraphs(text) {
  const raw = text.replace(/\r\n/g, "\n").trim();
  const blocks = raw.split(/\n\s*\n+/);
  const paras = [];
  for (const block of blocks) {
    const joined = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!joined) continue;
    if (/^BOOK [IVX]+$/.test(joined)) continue;
    paras.push(joined);
  }
  return paras;
}

function notesFromPara(para, paraIndex) {
  const notes = [];
  const quoteRe = /["“]([^"”]{12,200})["”]/g;
  let q;
  while ((q = quoteRe.exec(para))) {
    const snippet = q[1].replace(/\s+/g, " ").trim();
    const around = para.slice(Math.max(0, q.index - 48), q.index).toLowerCase();
    const scriptural =
      /\b(saidst|saith|said|written|scripture|word|psalm|gospel|book|commandment|thy law|thou hast said)\b/.test(around) ||
      /\b(lord|god|thou|thee|heaven|israel|christ|father)\b/i.test(snippet);
    if (!scriptural) continue;
    notes.push({
      n: String(paraIndex + 1) + String.fromCharCode(97 + notes.length),
      para: paraIndex,
      text: snippet
    });
  }
  return notes;
}

const latinBooks = parseLatin();

const books = marks.map((mark, i) => {
  const from = mark.end;
  const to = i + 1 < marks.length ? marks[i + 1].index : body.length;
  const paras = unwrapParagraphs(body.slice(from, to));
  const notes = [];
  paras.forEach((p, pi) => {
    notes.push(...notesFromPara(p, pi));
  });
  return {
    n: i + 1,
    roman: roman[i],
    heading: "Book " + roman[i],
    paras,
    latin: latinBooks[i] || [],
    notes
  };
});

const out = {
  title: "The Confessions",
  author: "Augustine of Hippo",
  translator: "E. B. Pusey",
  year: 1838,
  source: "Project Gutenberg eBook #3296",
  englishSource: relative(root, sources.english).replace(/\\/g, "/"),
  latinSource: relative(root, sources.latin).replace(/\\/g, "/"),
  books
};

const js =
  "/* Generated from Fathers/The Confessions of St. Augustine. Augustine.txt and the Latin companion — do not edit by hand. */\n" +
  "window.FG_CONFESSIONS = " +
  JSON.stringify(out) +
  ";\n";

writeFileSync(join(root, "js", "confessions-data.js"), js);
const paraCount = books.reduce((n, b) => n + b.paras.length, 0);
const latinCount = books.reduce((n, b) => n + b.latin.length, 0);
const noteCount = books.reduce((n, b) => n + b.notes.length, 0);
console.log(
  books.map((b) => "Book " + b.roman + ": " + b.paras.length + " EN, " + b.latin.length + " LA, " + b.notes.length + " notes").join("\n")
);
console.log("English:", relative(root, sources.english));
console.log("Latin:", relative(root, sources.latin));
console.log("TOTAL", paraCount, "English paragraphs,", latinCount, "Latin chapters,", noteCount, "notes");
