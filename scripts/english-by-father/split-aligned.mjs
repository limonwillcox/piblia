/**
 * Split Latin/Western Schaff English into Father_English/Work.txt
 * using explicit start markers (no Greek volumes).
 *
 * Usage: node scripts/english-by-father/split-aligned.mjs
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const englishRoot = join(root, "Fathers", "English");
const latinRoot = join(root, "Fathers", "Latin");
const reportDir = join(englishRoot, "_alignment");

function findVolume(series, prefix) {
  const dir = join(englishRoot, series);
  const hit = readdirSync(dir).find((n) => n.startsWith(prefix));
  if (!hit) throw new Error(`Missing ${series}/${prefix}*`);
  return join(dir, hit);
}

function readLines(path) {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n").split("\n");
}

function findAll(lines, re) {
  const out = [];
  for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) out.push(i + 1);
  return out;
}

function first(lines, re, from = 1) {
  for (let i = from - 1; i < lines.length; i++) if (re.test(lines[i])) return i + 1;
  return -1;
}

function writeWork(father, file, work, latin, body, meta) {
  const folder = join(englishRoot, `${father}_English`);
  mkdirSync(folder, { recursive: true });
  const dest = join(folder, file);
  const header = [
    `# source: ${meta.source}`,
    `# series: ${meta.series}`,
    `# volume: ${meta.volume}`,
    `# father: ${father}`,
    `# work: ${work}`,
    `# latin_match_candidate: ${latin || "(none)"}`,
    `# extracted: ${new Date().toISOString().slice(0, 10)}`,
    `# note: Public-domain Schaff English extract. Volume archives retained under ANF/NPNF1/NPNF2.`,
    ""
  ].join("\n");
  const text = header + body.trim() + "\n";
  writeFileSync(dest, text);
  return {
    father,
    work,
    latin,
    file: relative(root, dest).replace(/\\/g, "/"),
    bytes: Buffer.byteLength(text),
    source: meta.source,
    series: meta.series,
    volume: meta.volume,
    startLine: meta.startLine,
    endLine: meta.endLine
  };
}

function splitVolume(series, volumePrefix, specs) {
  const path = findVolume(series, volumePrefix);
  const lines = readLines(path);
  const resolved = [];
  for (const s of specs) {
    const start = first(lines, s.start, s.from || 1);
    if (start < 0) {
      console.warn(`MISSING ${series}/${volumePrefix}: ${s.father} / ${s.work}`);
      continue;
    }
    resolved.push({ ...s, start });
  }
  resolved.sort((a, b) => a.start - b.start);
  const written = [];
  for (let i = 0; i < resolved.length; i++) {
    const s = resolved[i];
    let end = i + 1 < resolved.length ? resolved[i + 1].start : lines.length + 1;
    if (s.end) {
      const e = first(lines, s.end, s.start + 1);
      if (e > 0 && e < end) end = e;
    }
    const body = lines.slice(s.start - 1, end - 1).join("\n");
    if (body.length < 800) {
      console.warn(`SMALL ${s.father}/${s.work} (${body.length} chars)`);
      continue;
    }
    written.push(
      writeWork(s.father, s.file, s.work, s.latin || null, body, {
        source: relative(root, path).replace(/\\/g, "/"),
        series,
        volume: volumePrefix,
        startLine: s.start,
        endLine: end
      })
    );
    console.log(`OK ${s.father} / ${s.file}  L${s.start}-L${end - 1}  (${body.length} chars)`);
  }
  return written;
}

let written = [];

// ANF III — Tertullian (major treatises)
written = written.concat(
  splitVolume("ANF", "Volume III.", [
    { father: "Tertullian", work: "The Apology", file: "The Apology.txt", latin: "Apologeticum", start: /^\s*The Apology\.\s*\[/ },
    { father: "Tertullian", work: "On Idolatry", file: "On Idolatry.txt", latin: "de Idololatria", start: /^\s*On Idolatry\.\s*$/ },
    { father: "Tertullian", work: "The Shows", file: "The Shows (De Spectaculis).txt", latin: "de Spectaculis", start: /^\s*The Shows, or De Spectaculis\.\s*\[/ },
    { father: "Tertullian", work: "The Chaplet", file: "The Chaplet (De Corona).txt", latin: "de Corona Militis", start: /^\s*The Chaplet, or De Corona\.\s*\[/ },
    { father: "Tertullian", work: "To Scapula", file: "To Scapula.txt", latin: "ad Scapulam", start: /^\s*To Scapula\.\s*\[/ },
    { father: "Tertullian", work: "Ad Nationes", file: "Ad Nationes.txt", latin: "ad Nationes", start: /^\s*Ad Nationes\.\s*\[/ },
    { father: "Tertullian", work: "An Answer to the Jews", file: "An Answer to the Jews.txt", latin: "Adversus Iudaeos", start: /^\s*An Answer to the Jews\.\s*\[/ },
    { father: "Tertullian", work: "The Soul's Testimony", file: "The Soul's Testimony.txt", latin: "de Testimonio Animae", start: /^\s*The Soul's Testimony\.\s*\[/ },
    { father: "Tertullian", work: "A Treatise on the Soul", file: "A Treatise on the Soul.txt", latin: null, start: /^\s*A Treatise on the Soul\.\s*\[/ },
    { father: "Tertullian", work: "The Prescription Against Heretics", file: "The Prescription Against Heretics.txt", latin: null, start: /^\s*The Prescription Against Heretics\.\s*\[/ },
    { father: "Tertullian", work: "The Five Books Against Marcion", file: "The Five Books Against Marcion.txt", latin: "Adversus Marcionem", start: /^\s*The Five Books Against Marcion\.\s*$/ },
    { father: "Tertullian", work: "Against Hermogenes", file: "Against Hermogenes.txt", latin: null, start: /^\s*Against Hermogenes\.\s*$/ },
    { father: "Tertullian", work: "Against the Valentinians", file: "Against the Valentinians.txt", latin: null, start: /^\s*Against the Valentinians\.\s*$/ },
    { father: "Tertullian", work: "On the Flesh of Christ", file: "On the Flesh of Christ.txt", latin: "de Carne Christi", start: /^\s*On the Flesh of Christ\.\s*\[/ },
    { father: "Tertullian", work: "On the Resurrection of the Flesh", file: "On the Resurrection of the Flesh.txt", latin: null, start: /^\s*On the Resurrection of the Flesh\.\s*$/ },
    { father: "Tertullian", work: "Against Praxeas", file: "Against Praxeas.txt", latin: "Adversus Praxean", start: /^\s*Against Praxeas;\s*\[/ },
    { father: "Tertullian", work: "Scorpiace", file: "Scorpiace.txt", latin: "Liber Scorpiace", start: /^\s*Scorpiace\.\s*$/ },
    { father: "Tertullian", work: "Against All Heresies", file: "Against All Heresies.txt", latin: "Adversus Omnes Haereses", start: /^\s*Against all Heresies\.\s*\[/ },
    { father: "Tertullian", work: "On Repentance", file: "On Repentance.txt", latin: null, start: /^\s*On Repentance\.\s*\[/ },
    { father: "Tertullian", work: "On Baptism", file: "On Baptism.txt", latin: null, start: /^\s*On Baptism\.\s*$/ },
    { father: "Tertullian", work: "On Prayer", file: "On Prayer.txt", latin: "de Oratione", start: /^\s*On Prayer\.\s*$/ },
    { father: "Tertullian", work: "Ad Martyras", file: "Ad Martyras.txt", latin: "ad Martyres", start: /^\s*Ad Martyras\.\s*\[/ },
    { father: "Tertullian", work: "Of Patience", file: "Of Patience.txt", latin: null, start: /^\s*Of Patience\.\s*\[/ }
  ])
);

// ANF IV — remaining Tertullian + Minucius + Commodianus (stop before Origen)
written = written.concat(
  splitVolume("ANF", "Volume IV.", [
    { father: "Tertullian", work: "On the Pallium", file: "On the Pallium.txt", latin: "de Pallio", start: /^\s*On the Pallium\.\s*\[/ },
    { father: "Tertullian", work: "On the Apparel of Women", file: "On the Apparel of Women.txt", latin: null, start: /^\s*On the Apparel of Women\.\s*\[/ },
    { father: "Tertullian", work: "On the Veiling of Virgins", file: "On the Veiling of Virgins.txt", latin: "de Virginibus Velandis", start: /^\s*On the Veiling of Virgins\.\s*\[/ },
    { father: "Tertullian", work: "To His Wife", file: "To His Wife.txt", latin: "ad Uxorem", start: /^\s*To His Wife\.\s*\[/ },
    { father: "Tertullian", work: "On Exhortation to Chastity", file: "On Exhortation to Chastity.txt", latin: null, start: /^\s*On Exhortation to Chastity\.\s*\[/ },
    { father: "Tertullian", work: "On Monogamy", file: "On Monogamy.txt", latin: null, start: /^\s*On Monogamy\.\s*\[/ },
    { father: "Tertullian", work: "On Modesty", file: "On Modesty.txt", latin: "de Pudicitia", start: /^\s*On Modesty\.\s*\[/ },
    { father: "Tertullian", work: "On Fasting", file: "On Fasting.txt", latin: "de Ieiunio", start: /^\s*On Fasting\.\s*\[/ },
    { father: "Tertullian", work: "De Fuga in Persecutione", file: "De Fuga in Persecutione.txt", latin: null, start: /^\s*De Fuga in Persecutione\.\s*\[/ },
    { father: "Minucius_Felix", work: "The Octavius", file: "The Octavius.txt", latin: "Octavius", start: /^\s*The Octavius of Minucius Felix\.\s*$/ },
    { father: "Commodianus", work: "Instructions of Commodianus", file: "Instructions of Commodianus.txt", latin: "Instructiones", start: /^\s*Instructions of Commodianus\.\s*$/, end: /^\s*Origen Against Celsus\.\s*$/ }
  ])
);

// ANF V — Novatian
written = written.concat(
  splitVolume("ANF", "Volume V.", [
    { father: "Novatian", work: "A Treatise Concerning the Trinity", file: "A Treatise Concerning the Trinity.txt", latin: "De Trinitate", start: /^\s*A Treatise of Novatian Concerning the Trinity\.\s*$/ },
    { father: "Novatian", work: "On the Jewish Meats", file: "On the Jewish Meats.txt", latin: null, start: /^\s*On the Jewish Meats\.\s*\[/ }
  ])
);

// ANF VI — Arnobius
written = written.concat(
  splitVolume("ANF", "Volume VI.", [
    { father: "Arnobius", work: "Against the Heathen", file: "Against the Heathen.txt", latin: "Adversus nationes", start: /^\s*The Seven Books of Arnobius Against the Heathen\.\s*$/ }
  ])
);

// ANF VII — Lactantius
written = written.concat(
  splitVolume("ANF", "Volume VII.", [
    { father: "Lactantius", work: "The Divine Institutes", file: "The Divine Institutes.txt", latin: "Divinae institutiones", start: /^\s*The Divine Institutes\.\s*$/ },
    { father: "Lactantius", work: "On the Anger of God", file: "On the Anger of God.txt", latin: null, start: /^\s*A Treatise on the Anger of God\s*$/ },
    { father: "Lactantius", work: "On the Workmanship of God", file: "On the Workmanship of God.txt", latin: null, start: /^\s*On the Workmanship of God, or the Formation of Man\s*$/ },
    { father: "Lactantius", work: "Of the Manner in Which the Persecutors Died", file: "Of the Manner in Which the Persecutors Died.txt", latin: "DE MORTIBUS PERSECUTORUM", start: /^\s*Of the Manner in Which the Persecutors Died\.\s*\[/ },
    { father: "Lactantius", work: "Fragments of Lactantius", file: "Fragments of Lactantius.txt", latin: null, start: /^\s*Fragments of Lactantius\s*$/, end: /^\s*The Phoenix\s*$/ }
  ])
);

// NPNF1 Augustine
written = written.concat(
  splitVolume("NPNF1", "Volume I.   Prolegomena", [
    { father: "Augustine", work: "The Confessions", file: "The Confessions (NPNF Pilkington).txt", latin: "The Confessions of St. Augustine Latin", start: /^\s*The Confessions of St\. Augustin\s*$/, end: /^\s*Letters of St\. Augustin\s*$/ },
    { father: "Augustine", work: "Letters", file: "Letters.txt", latin: null, start: /^\s*Letters of St\. Augustin\s*$/ }
  ])
);

written = written.concat(
  splitVolume("NPNF1", "Volume II.", [
    { father: "Augustine", work: "The City of God", file: "The City of God.txt", latin: "De civitate Dei", start: /^\s*The City of God\s*$/, from: 250, end: /^\s*On Christian Doctrine\s*$/ },
    { father: "Augustine", work: "On Christian Doctrine", file: "On Christian Doctrine.txt", latin: null, start: /^\s*On Christian Doctrine\s*$/, from: 40000 }
  ])
);

written = written.concat(
  splitVolume("NPNF1", "Volume III.", [
    { father: "Augustine", work: "On the Holy Trinity", file: "On the Holy Trinity.txt", latin: "De Trinitate", start: /^\s*On the Holy Trinity\s*$/, from: 100, end: /^\s*On the Catechising of the Uninstructed\s*\[/ },
    { father: "Augustine", work: "On the Catechising of the Uninstructed", file: "On Catechising of the Uninstructed.txt", latin: "de Catechizandis Rudibus", start: /^\s*On the Catechising of the Uninstructed\s*\[/, end: /^\s*A Treatise on Faith and the Creed\.\s*$/ },
    { father: "Augustine", work: "On Faith and the Creed", file: "On Faith and the Creed.txt", latin: "de Fide et Symbolo", start: /^\s*A Treatise on Faith and the Creed\.\s*$/ }
  ])
);

// NPNF2 Ambrose
written = written.concat(
  splitVolume("NPNF2", "Volume X.", [
    { father: "Ambrose", work: "On the Duties of the Clergy", file: "On the Duties of the Clergy.txt", latin: null, start: /^\s*On the Duties of the Clergy\.\s*$/ },
    { father: "Ambrose", work: "On the Holy Spirit", file: "On the Holy Spirit.txt", latin: null, start: /^\s*Three Books of St\. Ambrose, Bishop of Milan, on the Holy Spirit\.\s*$/ },
    { father: "Ambrose", work: "Exposition of the Christian Faith", file: "Exposition of the Christian Faith.txt", latin: null, start: /^\s*Exposition of the Christian Faith\.\s*$/ },
    { father: "Ambrose", work: "On the Mysteries", file: "On the Mysteries.txt", latin: "de Mysteriis", start: /^\s*On the Mysteries\.\s*$/ },
    { father: "Ambrose", work: "Concerning Virgins", file: "Concerning Virgins.txt", latin: null, start: /^\s*Concerning Virgins\.\s*$/ },
    { father: "Ambrose", work: "Concerning Widows", file: "Concerning Widows.txt", latin: null, start: /^\s*Concerning Widows\.\s*$/ },
    { father: "Ambrose", work: "Letters", file: "Letters.txt", latin: "Epistulae Variae", start: /^\s*Selections from the Letters of St\. Ambrose\.\s*$/ }
  ])
);

// NPNF2 Jerome
written = written.concat(
  splitVolume("NPNF2", "Volume VI.", [
    { father: "Jerome", work: "Letters", file: "Letters.txt", latin: "Epistulae", start: /^\s*The Letters of St\. Jerome\.\s*$/, end: /^\s*The Life of Paulus the First Hermit\.\s*$/ },
    { father: "Jerome", work: "The Life of Paulus the First Hermit", file: "The Life of Paulus the First Hermit.txt", latin: "Vita Pauli", start: /^\s*The Life of Paulus the First Hermit\.\s*$/ },
    { father: "Jerome", work: "The Life of Malchus", file: "The Life of Malchus, the Captive Monk.txt", latin: "Vita Malchi", start: /^\s*The Life of Malchus, the Captive Monk\.\s*$/, end: /^\s*The Dialogue Against the Luciferians\.\s*$/ }
  ])
);

// NPNF2 XI Sulpitius / Vincent
written = written.concat(
  splitVolume("NPNF2", "Volume XI.", [
    { father: "Sulpicius_Severus", work: "On the Life of St. Martin", file: "On the Life of St. Martin.txt", latin: "Vita Sancti Martini", start: /^\s*On the Life of St\. Martin\.\s*$/, end: /^\s*The COMMONITORY\s*$/ },
    { father: "Vincent", work: "The Commonitory", file: "The Commonitory.txt", latin: "Commonitorium", start: /^\s*The COMMONITORY\s*$/, end: /^\s*The Works of John Cassian\.\s*$/ }
  ])
);

// NPNF2 XII Leo / Gregory
written = written.concat(
  splitVolume("NPNF2", "Volume XII.", [
    { father: "Leo", work: "Sermons", file: "Sermons.txt", latin: "Sermones de Quadragesima", start: /^\s*Sermons\.\s*$/, from: 1000 },
    { father: "Gregory", work: "The Book of Pastoral Rule", file: "The Book of Pastoral Rule.txt", latin: null, start: /^\s*The Book of Pastoral Rule\.\s*$/, from: 20000 }
  ])
);

written.sort((a, b) => a.father.localeCompare(b.father) || a.work.localeCompare(b.work));

// Latin inventory + overlap
const latinWorks = [];
for (const d of readdirSync(latinRoot, { withFileTypes: true })) {
  if (!d.isDirectory() || !d.name.endsWith("_Latin")) continue;
  const father = d.name.replace(/_Latin$/, "");
  for (const f of readdirSync(join(latinRoot, d.name))) {
    if (!f.endsWith(".txt")) continue;
    latinWorks.push({
      father,
      work: f.replace(/\.txt$/i, ""),
      file: relative(root, join(latinRoot, d.name, f)).replace(/\\/g, "/"),
      bytes: statSync(join(latinRoot, d.name, f)).size
    });
  }
}

function norm(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const proposed = [];
const used = new Set();
for (const lw of latinWorks) {
  const explicit = written.find((e) => e.father === lw.father && e.latin && norm(e.latin) === norm(lw.work));
  if (explicit) {
    used.add(explicit.file);
    proposed.push({
      status: "proposed-pair",
      confidence: "explicit",
      father: lw.father,
      latin: lw,
      english: explicit
    });
  } else {
    proposed.push({ status: "latin-only", father: lw.father, latin: lw, english: null });
  }
}
const englishOnly = written.filter((e) => !used.has(e.file));

mkdirSync(reportDir, { recursive: true });
const report = {
  generated: new Date().toISOString(),
  note: "Proposed pairs only — review before approving into the app DB. Greek not split.",
  counts: {
    englishWorksSplit: written.length,
    proposedPairs: proposed.filter((p) => p.status === "proposed-pair").length,
    latinOnly: proposed.filter((p) => p.status === "latin-only").length,
    englishOnlyWestern: englishOnly.length
  },
  englishWorks: written,
  proposedPairs: proposed.filter((p) => p.status === "proposed-pair"),
  latinOnly: proposed.filter((p) => p.status === "latin-only"),
  englishOnlyWestern: englishOnly
};
writeFileSync(join(reportDir, "overlap-report.json"), JSON.stringify(report, null, 2));

const md = [];
md.push("# Latin ↔ English alignment (review)\n");
md.push(`Generated ${report.generated}\n`);
md.push(`- English extracts: **${report.counts.englishWorksSplit}**`);
md.push(`- Proposed pairs: **${report.counts.proposedPairs}**`);
md.push(`- Latin-only: **${report.counts.latinOnly}**`);
md.push(`- English-only western: **${report.counts.englishOnlyWestern}**\n`);
md.push("## Proposed pairs (please review)\n");
md.push("| Father | Latin | English |");
md.push("| --- | --- | --- |");
for (const p of report.proposedPairs) {
  md.push(`| ${p.father} | \`${p.latin.work}\` | \`${p.english.work}\` |`);
}
md.push("\n## English-only western extracts\n");
for (const e of englishOnly) md.push(`- **${e.father}**: ${e.work}`);
md.push("\n## Latin-only\n");
const byF = {};
for (const p of report.latinOnly) (byF[p.father] ||= []).push(p.latin.work);
for (const [f, works] of Object.entries(byF)) md.push(`- **${f}**: ${works.join("; ")}`);
writeFileSync(join(reportDir, "OVERLAP.md"), md.join("\n"));

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Alignment preview</title>
<style>
body{font-family:Georgia,serif;max-width:1000px;margin:2rem auto;padding:0 1rem;line-height:1.4}
code{font-size:12px} table{border-collapse:collapse;width:100%}
td,th{border:1px solid #ddd;padding:.4rem;text-align:left;vertical-align:top}
.meta{color:#666}
</style></head><body>
<h1>Latin ↔ English alignment preview</h1>
<p class="meta">Open files under <code>Fathers/English/*_English/</code>. Nothing approved for the app until you say so.</p>
<p><b>${report.counts.proposedPairs}</b> proposed pairs · <b>${report.counts.englishWorksSplit}</b> English extracts</p>
<table><tr><th>Father</th><th>Latin</th><th>English</th></tr>
${report.proposedPairs
  .map(
    (p) =>
      `<tr><td>${p.father}</td><td>${p.latin.work}<br><code>${p.latin.file}</code></td><td>${p.english.work}<br><code>${p.english.file}</code></td></tr>`
  )
  .join("")}
</table>
</body></html>`;
writeFileSync(join(reportDir, "index.html"), html);

console.log("\nDone:", report.counts);
