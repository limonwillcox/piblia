const base = process.argv[2] || "http://127.0.0.1:4173";

async function get(path) {
  const res = await fetch(base + path);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, text, json, contentType: res.headers.get("content-type") || "" };
}

function fail(msg) {
  console.error("FAIL", msg);
  process.exitCode = 1;
}

const home = await get("/");
if (home.status !== 200) fail("home status " + home.status);
if (!home.text.includes("id=\"root\"") && !home.text.includes("id='root'")) fail("home missing React root");
if (!home.text.includes("/src/main.tsx") && !home.text.includes("/assets/index-")) fail("home is not the Vite/React entry");
if (home.text.includes("FG.boot") || home.text.includes("js/app.js")) fail("old FG.boot frontend still served");

const catalog = await get("/api/catalog");
if (catalog.status !== 200 || !catalog.json) fail("catalog missing");
else {
  if (catalog.json.votd?.work !== "confessions") fail("votd is not Confessions");
  const quote = String(catalog.json.votd?.quote || "");
  if (quote.length < 40) fail("votd quote too short");
  console.log("HOME_VOTD", quote.slice(0, 80));
}

const work = await get("/api/works/confessions");
if (work.status !== 200 || !work.json) fail("work missing");
else {
  const chapters = work.json.chapters || [];
  console.log("CHAPTERS", chapters.length);
  if (chapters.length < 5) fail("expected multiple Confessions books, got " + chapters.length);
  const ch1 = chapters.find((c) => c.chapter === 1) || chapters[0];
  const pusey = (ch1.versions?.pusey || []).join(" ");
  const latin = (ch1.versions?.lat || []).join(" ");
  if (!/great art thou/i.test(pusey) && pusey.length < 40) fail("Pusey English missing from chapter 1");
  if (!/Magnus es/i.test(latin)) fail("Latin Magnus es missing from chapter 1");
  console.log("PUSEY_OPEN", pusey.slice(0, 70));
  console.log("LATIN_OPEN", latin.slice(0, 70));
}

const ch = await get("/api/works/confessions/chapters/1");
if (ch.status !== 200 || !ch.json) fail("chapter 1 missing");
else if (!/Magnus es/i.test((ch.json.versions?.lat || []).join(" "))) fail("chapter 1 Latin missing Magnus es");

const search = await get("/api/search?q=restless");
if (search.status !== 200 || !search.json) fail("search missing");
else {
  const hits = search.json.hits || [];
  console.log("SEARCH_HITS", hits.length);
  if (hits.length < 1) fail("keyword search returned no results");
  const hit = hits.find((h) => String(h.snippet || "").toLowerCase().includes("restless"));
  if (!hit) fail("no search snippet contained restless");
  else console.log("SEARCH_SNIP", hit.snippet.slice(0, 100));
}

if (process.exitCode) {
  console.error("launch-check failed against", base);
  process.exit(1);
}
console.log("OK", base);
