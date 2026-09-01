import { writeFileSync, mkdirSync, existsSync, statSync, readdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dir = join(root, "Fathers", "English", "NPNF2");
mkdirSync(dir, { recursive: true });

function safeTitle(title) {
  return String(title).replace(/[<>:"/\\|?*]/g, " -").replace(/\s+/g, " ").trim();
}
function volumeName(n, title) {
  return "Volume " + n + ".   " + safeTitle(title);
}
function looksOk(buf) {
  const h = buf.slice(0, 800).toString("utf8");
  return /Public Domain|NICENE AND|NPNF|Schaff/i.test(h) && !/<html/i.test(h);
}

// Remove empty stubs left by colon truncation
for (const name of readdirSync(dir)) {
  const p = join(dir, name);
  if (statSync(p).size === 0) {
    unlinkSync(p);
    console.log("removed empty", name);
  }
}

const missing = [
  { id: "npnf201", n: "I", title: "Eusebius: Church History from A.D. 1-324, Life of Constantine the Great, Oration in Praise of Constantine" },
  { id: "npnf202", n: "II", title: "Socrates: Church History from A.D. 305-438; Sozomenus: Church History from A.D. 323-425" },
  { id: "npnf204", n: "IV", title: "Athanasius: Select Writings and Letters" },
  { id: "npnf205", n: "V", title: "Gregory of Nyssa: Dogmatic Treatises; Select Writings and Letters" },
  { id: "npnf206", n: "VI", title: "Jerome: Letters and Select Works" },
  { id: "npnf208", n: "VIII", title: "Basil: Letters and Select Works" },
  { id: "npnf210", n: "X", title: "Ambrose: Select Works and Letters" }
];

for (const vol of missing) {
  const dest = join(dir, volumeName(vol.n, vol.title));
  if (existsSync(dest) && statSync(dest).size > 50000) {
    console.log("SKIP", vol.id);
    continue;
  }
  const url = "https://www.ccel.org/ccel/s/schaff/" + vol.id + "/cache/" + vol.id + ".txt";
  console.log("GET", vol.id, "->", volumeName(vol.n, vol.title));
  const res = await fetch(url, { headers: { "User-Agent": "FathersGateway/1.0" } });
  if (!res.ok) throw new Error(vol.id + " HTTP " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 50000 || !looksOk(buf)) throw new Error(vol.id + " bad payload " + buf.length);
  writeFileSync(dest, buf);
  console.log("OK", vol.id, buf.length);
}

console.log("NPNF2 count", readdirSync(dir).length);
