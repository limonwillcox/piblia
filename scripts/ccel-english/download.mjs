/**
 * Download NPNF Series I + II plain text from CCEL into Fathers/English/.
 * Also reorganize existing ANF volume files into Fathers/English/ANF/.
 *
 * Usage: node scripts/ccel-english/download.mjs
 */
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync, writeFileSync, readFileSync } from "fs";
import { dirname, join, basename } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const englishDir = join(root, "Fathers", "English");
const anfDir = join(englishDir, "ANF");
const npnf1Dir = join(englishDir, "NPNF1");
const npnf2Dir = join(englishDir, "NPNF2");

const NPNF1 = [
  { id: "npnf101", n: "I", title: "Prolegomena St. Augustine's Life and Work, Confessions, Letters", prepared: true },
  { id: "npnf102", n: "II", title: "The City of God, Christian Doctrine", prepared: true },
  { id: "npnf103", n: "III", title: "On the Holy Trinity, Doctrinal Treatises, Moral Treatises", prepared: true },
  { id: "npnf104", n: "IV", title: "The Anti-Manichaean Writings, The Anti-Donatist Writings", prepared: true },
  { id: "npnf105", n: "V", title: "Anti-Pelagian Writings", prepared: true },
  { id: "npnf106", n: "VI", title: "Sermon on the Mount, Harmony of the Gospels, Homilies on the Gospels", prepared: true },
  { id: "npnf107", n: "VII", title: "Homilies on the Gospel of John, Homilies on the First Epistle of John, Soliloquies", prepared: true },
  { id: "npnf108", n: "VIII", title: "Expositions on the Psalms", prepared: true },
  { id: "npnf109", n: "IX", title: "On the Priesthood, Ascetic Treatises, Select Homilies and Letters, Homilies on the Statutes" },
  { id: "npnf110", n: "X", title: "Homilies on the Gospel of St. Matthew" },
  { id: "npnf111", n: "XI", title: "Homilies on the Acts of the Apostles and the Epistle to the Romans" },
  { id: "npnf112", n: "XII", title: "Homilies on First and Second Corinthians" },
  { id: "npnf113", n: "XIII", title: "Homilies on the Epistles to the Galatians, Ephesians, Philippians, Colossians, Thessalonians, Timothy, Titus, and Philemon" },
  { id: "npnf114", n: "XIV", title: "Homilies on the Gospel of St. John and the Epistle to the Hebrews" }
];

const NPNF2 = [
  { id: "npnf201", n: "I", title: "Eusebius: Church History from A.D. 1-324, Life of Constantine the Great, Oration in Praise of Constantine" },
  { id: "npnf202", n: "II", title: "Socrates: Church History from A.D. 305-438; Sozomenus: Church History from A.D. 323-425" },
  { id: "npnf203", n: "III", title: "Theodoret, Jerome and Gennadius, Rufinus and Jerome" },
  { id: "npnf204", n: "IV", title: "Athanasius: Select Writings and Letters" },
  { id: "npnf205", n: "V", title: "Gregory of Nyssa: Dogmatic Treatises; Select Writings and Letters" },
  { id: "npnf206", n: "VI", title: "Jerome: Letters and Select Works" },
  { id: "npnf207", n: "VII", title: "Cyril of Jerusalem, Gregory Nazianzen" },
  { id: "npnf208", n: "VIII", title: "Basil: Letters and Select Works" },
  { id: "npnf209", n: "IX", title: "Hilary of Poitiers, John of Damascus" },
  { id: "npnf210", n: "X", title: "Ambrose: Select Works and Letters" },
  { id: "npnf211", n: "XI", title: "Sulpitius Severus, Vincent of Lerins, John Cassian" },
  { id: "npnf212", n: "XII", title: "Leo the Great, Gregory the Great" },
  { id: "npnf213", n: "XIII", title: "Gregory the Great II, Ephraim Syrus, Aphrahat" },
  { id: "npnf214", n: "XIV", title: "The Seven Ecumenical Councils" }
];

const ANF_MOVES = [
  "Volume I.   The Apostolic Fathers with Justin Martyr and Irenaeus",
  "Volume II.   Fathers of the Second Century",
  "Volume III.   Latin Christianity Its Founder, Tertullian",
  "Volume IV.   The Fathers of the Third Century",
  "Volume V.   The Fathers of the Third Century",
  "Volume VI.   The Fathers of the Third Century",
  "Volume VII.   The Fathers of the Third and Fourth Centuries",
  "Volume VIII",
  "Volume IX.   Recently Discovered Additions to Early Christian Literature; Commentaries of Origen",
  "Volume X.   Bibliographic Synopsis; General Index [not reproduced]"
];

function volumeName(n, title) {
  // Windows forbids : * ? " < > | in filenames; colons appear often in CCEL titles.
  const safe = String(title).replace(/[<>:"/\\|?*]/g, " -").replace(/\s+/g, " ").trim();
  return `Volume ${n}.   ${safe}`;
}

function txtUrl(id) {
  return `https://www.ccel.org/ccel/s/schaff/${id}/cache/${id}.txt`;
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function looksLikeCcelText(buf) {
  const head = buf.slice(0, 800).toString("utf8");
  return /Public Domain|NICENE AND|ANTE-NICENE|NPNF|Schaff/i.test(head) && !/<html/i.test(head);
}

async function downloadTo(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "FathersGateway/1.0 (personal library; public-domain texts)" }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 50_000) throw new Error(`Too small (${buf.length} bytes): ${url}`);
  if (!looksLikeCcelText(buf)) throw new Error(`Does not look like CCEL plain text: ${url}`);
  writeFileSync(dest, buf);
  return buf.length;
}

function reorganizeAnf() {
  ensureDir(anfDir);
  const moved = [];
  for (const name of ANF_MOVES) {
    const from = join(englishDir, name);
    if (!existsSync(from)) continue;
    const st = statSync(from);
    if (!st.isFile() || st.size === 0) continue;
    const toName = name === "Volume VIII"
      ? "Volume VIII.   The Twelve Patriarchs, Excerpts and Epistles, The Clementia, Apocrypha, Decretals, Memoirs of Edessa and Syriac Documents, Remains of the First Ages"
      : name;
    const to = join(anfDir, toName);
    if (existsSync(to) && statSync(to).size > 0) {
      moved.push({ name, status: "skip-exists", bytes: statSync(to).size });
      continue;
    }
    renameSync(from, to);
    moved.push({ name: toName, status: "moved", bytes: st.size });
  }
  return moved;
}

async function fetchSeries(series, dir, label) {
  ensureDir(dir);
  const results = [];
  for (const vol of series) {
    const name = volumeName(vol.n, vol.title);
    const dest = join(dir, name);
    const prepared = join(englishDir, name);
    if (existsSync(dest) && statSync(dest).size > 50_000) {
      results.push({ id: vol.id, name, status: "exists", bytes: statSync(dest).size });
      console.log(`SKIP  ${label} ${vol.id} (already present)`);
      continue;
    }
    // Prefer prepared empty placeholder path: fill then move into series folder.
    const target = existsSync(prepared) ? prepared : dest;
    console.log(`GET   ${label} ${vol.id} -> ${basename(target)}`);
    try {
      const bytes = await downloadTo(txtUrl(vol.id), target);
      if (target !== dest) {
        ensureDir(dir);
        if (existsSync(dest)) {
          // replace empty/small dest
        }
        renameSync(target, dest);
      }
      results.push({ id: vol.id, name, status: "downloaded", bytes, url: txtUrl(vol.id) });
      console.log(`OK    ${label} ${vol.id} (${bytes} bytes)`);
    } catch (err) {
      results.push({ id: vol.id, name, status: "error", error: String(err.message || err) });
      console.error(`FAIL  ${label} ${vol.id}: ${err.message || err}`);
    }
  }
  return results;
}

const anfMoved = reorganizeAnf();
console.log("ANF reorganize:", anfMoved.length, "items");

const npnf1 = await fetchSeries(NPNF1, npnf1Dir, "NPNF1");
const npnf2 = await fetchSeries(NPNF2, npnf2Dir, "NPNF2");

const manifest = {
  source: "https://www.ccel.org/",
  downloadedAt: new Date().toISOString(),
  note: "Public-domain Schaff NPNF plain-text dumps. Organized by series; work-level splitting comes later.",
  anfMoved,
  npnf1,
  npnf2
};

writeFileSync(join(englishDir, "_manifest.json"), JSON.stringify(manifest, null, 2));
const ok1 = npnf1.filter((x) => x.status === "downloaded" || x.status === "exists").length;
const ok2 = npnf2.filter((x) => x.status === "downloaded" || x.status === "exists").length;
const fail = [...npnf1, ...npnf2].filter((x) => x.status === "error");
console.log(`\nDone. NPNF1 ${ok1}/${NPNF1.length}, NPNF2 ${ok2}/${NPNF2.length}, failures ${fail.length}`);
if (fail.length) process.exitCode = 1;
