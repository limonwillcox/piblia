/**
 * Split remaining ANF/NPNF English volumes into Father_English/Work.txt
 * (MVP: best-effort markers; skip/miss and move on).
 *
 * Usage: node scripts/english-by-father/split-remaining.mjs
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const englishRoot = join(root, "Fathers", "English");

function findVolume(series, prefix) {
  const dir = join(englishRoot, series);
  const hit = readdirSync(dir).find((n) => n.startsWith(prefix));
  if (!hit) throw new Error(`Missing ${series}/${prefix}*`);
  return join(dir, hit);
}

function readLines(path) {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n").split("\n");
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
  console.log(`OK ${father} / ${file}  L${meta.startLine}-L${meta.endLine - 1}  (${body.length} chars)`);
  return 1;
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
  let n = 0;
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
    n += writeWork(s.father, s.file, s.work, s.latin || null, body, {
      source: relative(root, path).replace(/\\/g, "/"),
      series,
      volume: volumePrefix,
      startLine: s.start,
      endLine: end
    });
  }
  return n;
}

/** Whole-volume (or large-section) extract when fine splits are too costly. */
function dumpSection(series, volumePrefix, father, work, file, startRe, from = 1, endRe = null) {
  const path = findVolume(series, volumePrefix);
  const lines = readLines(path);
  const start = first(lines, startRe, from);
  if (start < 0) {
    console.warn(`MISSING dump ${father}/${work}`);
    return 0;
  }
  let end = lines.length + 1;
  if (endRe) {
    const e = first(lines, endRe, start + 1);
    if (e > 0) end = e;
  }
  const body = lines.slice(start - 1, end - 1).join("\n");
  if (body.length < 800) {
    console.warn(`SMALL dump ${father}/${work}`);
    return 0;
  }
  return writeWork(father, file, work, null, body, {
    source: relative(root, path).replace(/\\/g, "/"),
    series,
    volume: volumePrefix,
    startLine: start,
    endLine: end
  });
}

let n = 0;

// ——— ANF I ———
n += splitVolume("ANF", "Volume I.", [
  { father: "clement_rome", work: "The First Epistle of Clement", file: "The First Epistle of Clement.txt", start: /^\s*The First Epistle of Clement to the Corinthians\s*\[/ },
  { father: "mathetes", work: "Epistle to Diognetus", file: "Epistle to Diognetus.txt", start: /^\s*The Epistle of Mathetes to Diognetus\s*$/ },
  { father: "polycarp", work: "Epistle to the Philippians", file: "Epistle to the Philippians.txt", start: /^\s*The Epistle of Polycarp to the Philippians\s*\[/ },
  { father: "polycarp", work: "Martyrdom of Polycarp", file: "Martyrdom of Polycarp.txt", start: /^\s*The Encyclical Epistle of the Church at Smyrna Concerning the Martyrdom of the\s*$/ },
  { father: "ignatius", work: "Epistles of Ignatius", file: "Epistles of Ignatius.txt", start: /^\s*Introductory Note to the Epistles of Ignatius\s*$/, end: /^\s*Introductory Note to the Spurious Epistles of Ignatius\s*$/ },
  { father: "ignatius", work: "Spurious Epistles of Ignatius", file: "Spurious Epistles of Ignatius.txt", start: /^\s*Introductory Note to the Spurious Epistles of Ignatius\s*$/, end: /^\s*Introductory Note to the Martyrdom of Ignatius\s*$/ },
  { father: "ignatius", work: "Martyrdom of Ignatius", file: "Martyrdom of Ignatius.txt", start: /^\s*Introductory Note to the Martyrdom of Ignatius\s*$/, end: /^\s*Introductory Note to the Epistle of Barnabas\s*$/ },
  { father: "barnabas", work: "The Epistle of Barnabas", file: "The Epistle of Barnabas.txt", start: /^\s*The Epistle of Barnabas\s*\[/ },
  { father: "papias", work: "Fragments of Papias", file: "Fragments of Papias.txt", start: /^\s*Fragments of Papias\s*$/, end: /^\s*The First Apology of Justin\s*$/ },
  { father: "justin", work: "The First Apology", file: "The First Apology.txt", start: /^\s*The First Apology of Justin\s*$/ },
  { father: "justin", work: "The Second Apology", file: "The Second Apology.txt", start: /^\s*The Second Apology of Justin for the Christians Addressed to the Roman Senate\s*$/ },
  { father: "justin", work: "Dialogue with Trypho", file: "Dialogue with Trypho.txt", start: /^\s*Dialogue of Justin, Philosopher and Martyr, with Trypho, a Jew\s*$/ },
  { father: "justin", work: "Discourse to the Greeks", file: "Discourse to the Greeks.txt", start: /^\s*The Discourse to the Greeks\s*$/ },
  { father: "justin", work: "Hortatory Address to the Greeks", file: "Hortatory Address to the Greeks.txt", start: /^\s*Justin's Hortatory Address to the Greeks\s*$/ },
  { father: "justin", work: "On the Sole Government of God", file: "On the Sole Government of God.txt", start: /^\s*Justin on the Sole Government of God\s*\[/ },
  { father: "justin", work: "Fragments on the Resurrection", file: "Fragments on the Resurrection.txt", start: /^\s*Fragments of the Lost Work of Justin on the Resurrection\s*$/ },
  { father: "justin", work: "Martyrdom of Justin", file: "Martyrdom of Justin.txt", start: /^\s*The Martyrdom of the Holy Martyrs Justin/, end: /^\s*Against Heresies: Book I\s*$/ },
  { father: "irenaeus", work: "Against Heresies", file: "Against Heresies.txt", start: /^\s*Against Heresies: Book I\s*$/ }
]);

// ——— ANF II ———
n += splitVolume("ANF", "Volume II.", [
  { father: "hermas", work: "The Pastor of Hermas", file: "The Pastor of Hermas.txt", start: /^\s*The Pastor of Hermas\s*$/, from: 50, end: /^\s*Tatian's Address to the Greeks\s*$/ },
  { father: "tatian", work: "Address to the Greeks", file: "Address to the Greeks.txt", start: /^\s*Tatian's Address to the Greeks\s*$/ },
  { father: "theophilus", work: "To Autolycus", file: "To Autolycus.txt", start: /^\s*Theophilus to Autolycus\.\s*$/, from: 7600 },
  { father: "athenagoras", work: "Writings of Athenagoras", file: "Writings of Athenagoras.txt", start: /^\s*Writings of Athenagoras\s*$/, from: 11200 },
  { father: "clement_alexandria", work: "Exhortation to the Heathen", file: "Exhortation to the Heathen.txt", start: /^\s*Exhortation to the Heathen\s*$/, from: 15100 },
  { father: "clement_alexandria", work: "The Instructor", file: "The Instructor.txt", start: /^\s*The Instructor\s*$/, from: 21600 },
  { father: "clement_alexandria", work: "The Stromata", file: "The Stromata.txt", start: /^\s*The Stromata, or Miscellanies\s*$/ },
  { father: "clement_alexandria", work: "Who is the Rich Man that Shall Be Saved", file: "Who is the Rich Man that Shall Be Saved.txt", start: /^\s*Who is the Rich Man that Shall Be Saved\?\s*$/ },
  { father: "clement_alexandria", work: "Fragments", file: "Fragments.txt", start: /^\s*Fragments of Clemens Alexandrinus\.\s*$/, end: /^\s*Who is the Rich Man that Shall Be Saved\?\s*$/ }
]);

// ——— ANF IV (Origen; Tertullian already split) ———
n += splitVolume("ANF", "Volume IV.", [
  { father: "origen", work: "De Principiis", file: "De Principiis.txt", start: /^\s*Origen De Principiis\.\s*$/ },
  { father: "origen", work: "Letter to Africanus", file: "Letter to Africanus.txt", start: /^\s*A Letter from Origen to Africanus\.\s*$/ },
  { father: "origen", work: "Letter to Gregory", file: "Letter to Gregory.txt", start: /^\s*A Letter from Origen to Gregory\.\s*\[/ },
  { father: "origen", work: "Against Celsus", file: "Against Celsus.txt", start: /^\s*Origen Against Celsus\s*$/, from: 39500 }
]);

// ——— ANF V ———
n += splitVolume("ANF", "Volume V.", [
  { father: "hippolytus", work: "The Refutation of All Heresies", file: "The Refutation of All Heresies.txt", start: /^\s*The Refutation of All Heresies\.\s*$/, from: 500 },
  { father: "hippolytus", work: "Extant Works and Fragments", file: "Extant Works and Fragments.txt", start: /^\s*The Extant Works and Fragments of Hippolytus\s*$/ },
  { father: "cyprian", work: "The Epistles of Cyprian", file: "The Epistles of Cyprian.txt", start: /^\s*The Epistles of Cyprian\.\s*$/ },
  { father: "cyprian", work: "The Treatises of Cyprian", file: "The Treatises of Cyprian.txt", start: /^\s*The Treatises of Cyprian\s*$/, from: 41900 },
  { father: "cyprian", work: "Seventh Council of Carthage", file: "Seventh Council of Carthage.txt", start: /^\s*The Seventh Council of Carthage under Cyprian\.\s*\[/ },
  { father: "cyprian", work: "Treatises of Questionable Authority", file: "Treatises of Questionable Authority.txt", start: /^\s*Treatises Attributed to Cyprian on Questionable Authority\s*$/ },
  { father: "dionysius", work: "Fragments of Caius", file: "Fragments of Caius.txt", start: /^\s*Fragments of Caius\.\s*$/, end: /^\s*A Treatise of Novatian Concerning the Trinity\.\s*$/ }
]);

// ——— ANF VI (beyond Arnobius) ———
n += splitVolume("ANF", "Volume VI.", [
  { father: "gregory_thaumaturgus", work: "Declaration of Faith", file: "Declaration of Faith.txt", start: /^\s*A Declaration of Faith\.\s*\[/ },
  { father: "gregory_thaumaturgus", work: "Metaphrase of Ecclesiastes", file: "Metaphrase of Ecclesiastes.txt", start: /^\s*A Metaphrase of the Book of Ecclesiastes\.\s*\[/ },
  { father: "gregory_thaumaturgus", work: "Canonical Epistle", file: "Canonical Epistle.txt", start: /^\s*Canonical Epistle\.\s*\[/ },
  { father: "gregory_thaumaturgus", work: "Oration and Panegyric to Origen", file: "Oration and Panegyric to Origen.txt", start: /^\s*The Oration and Panegyric Addressed to Origen\.\s*\[/ },
  { father: "gregory_thaumaturgus", work: "Sectional Confession of Faith", file: "Sectional Confession of Faith.txt", start: /^\s*A Sectional Confession of Faith\.\s*\[/ },
  { father: "gregory_thaumaturgus", work: "On the Subject of the Soul", file: "On the Subject of the Soul.txt", start: /^\s*On the Subject of the Soul\.\s*\[/ },
  { father: "gregory_thaumaturgus", work: "Four Homilies", file: "Four Homilies.txt", start: /^\s*Four Homilies\.\s*\[/ },
  { father: "dionysius", work: "Extant Fragments of Dionysius", file: "Extant Fragments of Dionysius.txt", start: /^\s*Extant Fragments\.\s*$/, from: 7200 },
  { father: "methodius", work: "Banquet of the Ten Virgins", file: "Banquet of the Ten Virgins.txt", start: /^\s*The Banquet of the Ten Virgins;\s*\[/ },
  { father: "methodius", work: "Oration Concerning Simeon and Anna", file: "Oration Concerning Simeon and Anna.txt", start: /^\s*Oration Concerning Simeon and Anna\s*$/ },
  { father: "methodius", work: "Fragments on the Cross and Passion", file: "Fragments on the Cross and Passion.txt", start: /^\s*Three Fragments from the Homily on the Cross and Passion of Christ\.\s*$/ }
]);

// ——— ANF VII (beyond Lactantius) ———
n += splitVolume("ANF", "Volume VII.", [
  { father: "didache", work: "Teaching of the Twelve Apostles", file: "Teaching of the Twelve Apostles.txt", start: /^\s*THE TEACHING OF THE TWELVE APOSTLES\.\s*$/ },
  { father: "apostolic", work: "Constitutions of the Holy Apostles", file: "Constitutions of the Holy Apostles.txt", start: /^\s*constitutions of the holy apostles\s*$/i },
  { father: "apostolic", work: "The Homily", file: "The Homily.txt", start: /^\s*The Homily\.\s*\[/ },
  { father: "apostolic", work: "Early Liturgies", file: "Early Liturgies.txt", start: /^\s*Early Liturgies\.\s*$/ }
]);

// ——— ANF VIII ———
n += splitVolume("ANF", "Volume VIII.", [
  { father: "apostolic", work: "Testaments of the Twelve Patriarchs", file: "Testaments of the Twelve Patriarchs.txt", start: /^\s*The Testaments of the Twelve Patriarchs\s*$/, from: 180 },
  { father: "clement_alexandria", work: "Excerpts of Theodotus", file: "Excerpts of Theodotus.txt", start: /^\s*Excerpts of Theodotus\s*$/ },
  { father: "clement_rome", work: "Recognitions of Clement", file: "Recognitions of Clement.txt", start: /^\s*Recognitions of Clement\.\s*$/ },
  { father: "clement_rome", work: "The Clementine Homilies", file: "The Clementine Homilies.txt", start: /^\s*The Clementine Homilies\.\s*$/ },
  { father: "apostolic", work: "The Decretals", file: "The Decretals.txt", start: /^\s*The Decretals\s*$/, from: 54500 },
  { father: "apostolic", work: "Memoirs of Edessa", file: "Memoirs of Edessa.txt", start: /^\s*Memoirs of Edessa\s*$/, from: 58300 }
]);

// ——— ANF IX ———
n += splitVolume("ANF", "Volume IX.", [
  { father: "apostolic", work: "The Gospel of Peter", file: "The Gospel of Peter.txt", start: /^\s*The Gospel of Peter\.\s*$/, from: 100 },
  { father: "apostolic", work: "The Apocalypse of Peter", file: "The Apocalypse of Peter.txt", start: /^\s*The Apocalypse of Peter\s*$/, from: 16600 },
  { father: "apostolic", work: "The Vision of Paul", file: "The Vision of Paul.txt", start: /^\s*The Vision of Paul\.\s*$/ },
  { father: "apostolic", work: "The Apocalypse of the Virgin", file: "The Apocalypse of the Virgin.txt", start: /^\s*The Apocalypse of the Virgin\.\s*$/ },
  { father: "origen", work: "Commentary on John", file: "Commentary on John.txt", start: /^\s*Origen's Commentary on the Gospel of John\.\s*$/ }
]);

// ——— NPNF1 IV Augustine anti-Manichaean / anti-Donatist ———
n += splitVolume("NPNF1", "Volume IV.", [
  { father: "augustine", work: "Of the Morals of the Catholic Church", file: "Of the Morals of the Catholic Church.txt", start: /^\s*Of the Morals of the Catholic Church\.\s*\[/, from: 2400 },
  { father: "augustine", work: "On the Morals of the Manichaeans", file: "On the Morals of the Manichaeans.txt", start: /^\s*On the Morals of the Manich/, from: 4600 },
  { father: "augustine", work: "Concerning Two Souls", file: "Concerning Two Souls.txt", start: /^\s*Concerning Two Souls, Against the Manich/, from: 6400 },
  { father: "augustine", work: "Against Fortunatus", file: "Against Fortunatus.txt", start: /^\s*Against Fortunatus, the Manich/, from: 7600 },
  { father: "augustine", work: "Against the Epistle of Manichaeus Called Fundamental", file: "Against the Epistle of Manichaeus Called Fundamental.txt", start: /^\s*Against the Epistle of Manich.+Called Fundamental\.\s*\[/, from: 8600 },
  { father: "augustine", work: "Reply to Faustus the Manichaean", file: "Reply to Faustus the Manichaean.txt", start: /^\s*Reply to Faustus the Manich/, from: 10500 },
  { father: "augustine", work: "Concerning the Nature of Good", file: "Concerning the Nature of Good.txt", start: /^\s*Concerning the Nature of Good,/, from: 26700 },
  { father: "augustine", work: "On Baptism Against the Donatists", file: "On Baptism Against the Donatists.txt", start: /^\s*On Baptism, Against the Donatists\s*$/, from: 30700 },
  { father: "augustine", work: "Answer to Letters of Petilian", file: "Answer to Letters of Petilian.txt", start: /^\s*to the letters of petilian,/i, from: 40400 },
  { father: "augustine", work: "The Correction of the Donatists", file: "The Correction of the Donatists.txt", start: /^\s*the Correction of the Donatists;/i, from: 50400 }
]);

// ——— NPNF1 V Anti-Pelagian ———
n += splitVolume("NPNF1", "Volume V.", [
  { father: "augustine", work: "On the Merits and Forgiveness of Sins", file: "On the Merits and Forgiveness of Sins.txt", start: /^\s*A Treatise on the Merits and Forgiveness of Sins, and on the Baptism of\s*$/, from: 5600 },
  { father: "augustine", work: "On the Spirit and the Letter", file: "On the Spirit and the Letter.txt", start: /^\s*A Treatise on the spirit and the letter,/i, from: 12000 },
  { father: "augustine", work: "On Nature and Grace", file: "On Nature and Grace.txt", start: /^\s*A Treatise on nature and grace, against pelagius;/i, from: 15500 },
  { father: "augustine", work: "On the Grace of Christ and Original Sin", file: "On the Grace of Christ and Original Sin.txt", start: /^\s*A Treatise on the grace of christ, and on original sin,/i, from: 23900 },
  { father: "augustine", work: "On the Soul and its Origin", file: "On the Soul and its Origin.txt", start: /^\s*A Treatise on the soul and its origin,/i, from: 32400 },
  { father: "augustine", work: "Against Two Letters of the Pelagians", file: "Against Two Letters of the Pelagians.txt", start: /^\s*A Treatise against two letters of the pelagians,/i, from: 37600 },
  { father: "augustine", work: "On Grace and Free Will", file: "On Grace and Free Will.txt", start: /^\s*A Treatise on grace and free will,/i, from: 43700 },
  { father: "augustine", work: "On Rebuke and Grace", file: "On Rebuke and Grace.txt", start: /^\s*A Treatise on rebuke and grace,/i, from: 46200 },
  { father: "augustine", work: "On the Predestination of the Saints", file: "On the Predestination of the Saints.txt", start: /^\s*A Treatise on the predestination of the saints,/i, from: 48400 },
  { father: "augustine", work: "On the Gift of Perseverance", file: "On the Gift of Perseverance.txt", start: /^\s*A Treatise on the gift of perseverance,/i, from: 50500 }
]);

// ——— NPNF1 VI–VIII Augustine ———
n += splitVolume("NPNF1", "Volume VI.", [
  { father: "augustine", work: "Our Lord's Sermon on the Mount", file: "Our Lord's Sermon on the Mount.txt", start: /^\s*our lord's sermon on the mount,\s*$/i, from: 500 },
  { father: "augustine", work: "The Harmony of the Gospels", file: "The Harmony of the Gospels.txt", start: /^\s*the harmony of the gospels\s*$/i, from: 6900 },
  { father: "augustine", work: "Sermons on Selected Lessons of the New Testament", file: "Sermons on Selected Lessons of the New Testament.txt", start: /^\s*sermons on selected lessons of the new testament\.\s*$/i, from: 22900 }
]);

n += splitVolume("NPNF1", "Volume VII.", [
  { father: "augustine", work: "Homilies on the Gospel of John", file: "Homilies on the Gospel of John.txt", start: /^\s*Homilies on the Gospel of John\.\s*$/, from: 100 },
  { father: "augustine", work: "Homilies on the First Epistle of John", file: "Homilies on the First Epistle of John.txt", start: /^\s*HOMILIES ON THE FIRST EPISTLE OF JOHN\s*$/, from: 40 },
  { father: "augustine", work: "Soliloquies", file: "Soliloquies.txt", start: /^\s*SOLILOQUIES\s*$/, from: 40 }
]);

n += dumpSection("NPNF1", "Volume VIII.", "augustine", "Expositions on the Psalms", "Expositions on the Psalms.txt", /^\s*EXPOSITIONS ON THE BOOK OF PSALMS\s*$/, 50);

// ——— Chrysostom volumes as whole-work dumps (MVP) ———
n += dumpSection("NPNF1", "Volume IX.", "chrysostom", "On the Priesthood and Selected Treatises", "On the Priesthood and Selected Treatises.txt", /^\s*treatise concerning the christian priesthood\s*$/i, 1600);
n += dumpSection("NPNF1", "Volume X.", "chrysostom", "Homilies on Matthew", "Homilies on Matthew.txt", /^\s*HOMILIES ON THE GOSPEL OF SAINT MATTHEW\s*$/, 50);
n += dumpSection("NPNF1", "Volume XI.", "chrysostom", "Homilies on Acts and Romans", "Homilies on Acts and Romans.txt", /^\s*HOMILIES ON THE ACTS OF THE APOSTLES/i, 1);
n += dumpSection("NPNF1", "Volume XII.", "chrysostom", "Homilies on First and Second Corinthians", "Homilies on First and Second Corinthians.txt", /^\s*HOMILIES ON THE EPISTLES OF PAUL TO THE CORINTHIANS/i, 1);
n += dumpSection("NPNF1", "Volume XIII.", "chrysostom", "Homilies on Galatians to Philemon", "Homilies on Galatians to Philemon.txt", /^\s*HOMILIES ON THE EPISTLE/i, 1);
n += dumpSection("NPNF1", "Volume XIV.", "chrysostom", "Homilies on John and Hebrews", "Homilies on John and Hebrews.txt", /^\s*HOMILIES ON THE GOSPEL OF ST\. JOHN/i, 1);

// ——— NPNF2 major historians / Greeks ———
n += dumpSection("NPNF2", "Volume I.", "eusebius", "Church History", "Church History.txt", /^\s*The Church History of Eusebius\.\s*$/, 5300, /^\s*III\. The Oration of Eusebius\.\s*$/);
n += dumpSection("NPNF2", "Volume I.", "eusebius", "Oration of Eusebius", "Oration of Eusebius.txt", /^\s*III\. The Oration of Eusebius\.\s*$/, 56200);
n += dumpSection("NPNF2", "Volume II.", "socrates", "Ecclesiastical History", "Ecclesiastical History.txt", /^\s*Socrates' Ecclesiastical History\./, 600, /^\s*sozomen/i);
n += dumpSection("NPNF2", "Volume II.", "sozomen", "Ecclesiastical History", "Ecclesiastical History.txt", /^\s*The Ecclesiastical History of Sozomen/i, 1);
n += dumpSection("NPNF2", "Volume III.", "theodoret", "Ecclesiastical History and Dialogues", "Ecclesiastical History and Dialogues.txt", /^\s*THEODORET/i, 1);
n += dumpSection("NPNF2", "Volume IV.", "athanasius", "Select Writings and Letters", "Select Writings and Letters.txt", /^\s*Against the Heathen\.\s*$/, 9300);
n += dumpSection("NPNF2", "Volume V.", "gregory_nyssa", "Dogmatic Treatises and Select Writings", "Dogmatic Treatises and Select Writings.txt", /^\s*GREGORY OF NYSSA/i, 1);
n += dumpSection("NPNF2", "Volume VII.", "cyril_jerusalem", "Catechetical Lectures", "Catechetical Lectures.txt", /^\s*THE CATECHETICAL LECTURES/i, 1);
n += dumpSection("NPNF2", "Volume VII.", "gregory_nazianzen", "Select Orations and Letters", "Select Orations and Letters.txt", /^\s*GREGORY NAZIANZEN/i, 1);
n += dumpSection("NPNF2", "Volume VIII.", "basil", "Letters and Select Works", "Letters and Select Works.txt", /^\s*BASIL/i, 1);
n += dumpSection("NPNF2", "Volume IX.", "hilary", "Select Works", "Select Works.txt", /^\s*HILARY OF POITIERS/i, 1);
n += dumpSection("NPNF2", "Volume IX.", "john_damascus", "Exposition of the Orthodox Faith", "Exposition of the Orthodox Faith.txt", /^\s*JOHN OF DAMASCUS/i, 1);
n += dumpSection("NPNF2", "Volume XI.", "cassian", "Institutes and Conferences", "Institutes and Conferences.txt", /^\s*The Works of John Cassian\.\s*$/, 14000);
n += dumpSection("NPNF2", "Volume XIII.", "ephraim", "Nisibene Hymns and Select Works", "Nisibene Hymns and Select Works.txt", /^\s*EPHRAIM SYRUS/i, 1);
n += dumpSection("NPNF2", "Volume XIII.", "aphrahat", "Demonstrations", "Demonstrations.txt", /^\s*APHRAHAT/i, 1);
n += dumpSection("NPNF2", "Volume XIV.", "councils", "The Seven Ecumenical Councils", "The Seven Ecumenical Councils.txt", /^\s*THE SEVEN ECUMENICAL COUNCILS/i, 1);

// Extra Jerome select works leftover in NPNF2 VI beyond letters/lives already split
n += dumpSection(
  "NPNF2",
  "Volume VI.",
  "jerome",
  "Select Works (NPNF2 VI remainder)",
  "Select Works (NPNF2 VI remainder).txt",
  /^\s*The Dialogue Against the Luciferians\.\s*$/,
  1
);

console.log("\nDone. Works written this run:", n);
