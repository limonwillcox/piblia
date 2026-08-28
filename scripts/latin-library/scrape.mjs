import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import { extractLatin, extractCredits, looksLikeNavOnly } from "./extract.mjs";
import { pathDenied, creditDenied } from "./pd-gate.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const catalog = JSON.parse(readFileSync(join(here, "catalog.json"), "utf8"));
const cacheDir = join(here, "cache");
const outRoot = join(root, "Fathers", "Latin");
const BASE = catalog.base.replace(/\/$/, "");
const DELAY_MS = 900;
const UA = "FathersGateway/1.0 (Church Fathers public-domain corpus; educational scrape of thelatinlibrary.com)";
const MIN_CHARS = 200;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const authorFilter = flagValue("--author");
const force = args.includes("--force");

function flagValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : "";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function resolveUrl(href, fromUrl) {
  try {
    return new URL(href, fromUrl).href;
  } catch {
    return "";
  }
}

function pathnameOf(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function isNavUrl(url) {
  const path = pathnameOf(url).toLowerCase().replace(/\/+$/, "") || "/";
  return catalog.navPaths.some((p) => path === p || path === p.replace(/\.html$/, ""));
}

function cachePath(url) {
  const u = new URL(url);
  const key = (u.pathname.replace(/^\//, "") || "index.html").replace(/[\\/]/g, "__");
  return join(cacheDir, key + ".html");
}

function decodeHtml(buf) {
  if (buf.includes(0)) {
    let start = 0;
    const n = Math.min(buf.length - 1, 40);
    for (let i = 0; i < n; i++) {
      if (buf[i] === 0x3c && buf[i + 1] === 0x00) {
        start = i;
        break;
      }
    }
    return buf.subarray(start).toString("utf16le");
  }
  let text = buf.toString("utf8");
  if (!/<html|<body|<p |<p>/i.test(text) && text.includes("\uFFFD")) {
    text = buf.toString("latin1");
  }
  return text;
}

async function fetchHtml(url) {
  const cached = cachePath(url);
  if (!force && existsSync(cached)) {
    const html = decodeHtml(readFileSync(cached));
    if (/<html|<body|<p|<font|<table/i.test(html)) return html;
  }
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error("HTTP " + res.status + " " + url);
  const html = decodeHtml(Buffer.from(await res.arrayBuffer()));
  mkdirSync(dirname(cached), { recursive: true });
  writeFileSync(cached, html, "utf8");
  await sleep(DELAY_MS);
  return html;
}

function childWorkLinks(html, pageUrl, author) {
  const $ = cheerio.load(html);
  const seen = new Set();
  const pages = [];
  $("a[href]").each((_, el) => {
    const url = resolveUrl($(el).attr("href"), pageUrl);
    if (!url || seen.has(url) || url === pageUrl) return;
    if (!isCandidate(author, url)) return;
    if (pathDenied(url, author.exclude)) return;
    seen.add(url);
    const title = $(el).text().replace(/\s+/g, " ").trim() || basenameTitle(url);
    pages.push({ url, title });
  });
  return pages.sort(sortPages);
}

function isCandidate(author, url) {
  const path = pathnameOf(url).toLowerCase();
  if (!url.startsWith(BASE)) return false;
  if (isNavUrl(url)) return false;
  const prefixes = author.accept || [];
  if (!prefixes.length) return false;
  return prefixes.some((p) => path.includes(String(p).toLowerCase()));
}

function discoverLinks(html, indexUrl, author) {
  const $ = cheerio.load(html);
  const seen = new Set();
  const pages = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const title = $(el).text().replace(/\s+/g, " ").trim();
    const url = resolveUrl(href, indexUrl);
    if (!url || seen.has(url)) return;
    if (!isCandidate(author, url)) return;
    seen.add(url);
    pages.push({ url, title: title || basenameTitle(url) });
  });
  return pages;
}

function basenameTitle(url) {
  const base = pathnameOf(url).split("/").pop() || "work";
  return base.replace(/\.(html?|shtml)$/i, "").replace(/[_-]+/g, " ");
}

function groupPages(author, pages) {
  const groups = author.groups || [];
  const buckets = new Map();
  const used = new Set();

  for (const g of groups) {
    const re = new RegExp(g.match, "i");
    const matched = pages.filter((p) => re.test(pathnameOf(p.url))).sort(sortPages);
    if (!matched.length) continue;
    buckets.set(g.title, matched);
    matched.forEach((p) => used.add(p.url));
  }

  for (const p of pages) {
    if (used.has(p.url)) continue;
    const title = sanitizeTitle(p.title) || basenameTitle(p.url);
    buckets.set(uniqueKey(buckets, title), [p]);
  }
  return buckets;
}

function uniqueKey(map, title) {
  if (!map.has(title)) return title;
  let i = 2;
  while (map.has(title + " " + i)) i++;
  return title + " " + i;
}

function sortPages(a, b) {
  const na = Number((pathnameOf(a.url).match(/(\d+)(?:\.\w+)?$/) || [])[1] || 0);
  const nb = Number((pathnameOf(b.url).match(/(\d+)(?:\.\w+)?$/) || [])[1] || 0);
  if (na !== nb) return na - nb;
  return pathnameOf(a.url).localeCompare(pathnameOf(b.url));
}

function sanitizeTitle(s) {
  return String(s || "")
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function safeFilename(title) {
  const t = sanitizeTitle(title) || "work";
  return t + ".txt";
}

function header(author, workTitle, pages, credits, pdStatus) {
  const sources = pages.map((p) => p.url).join(" | ");
  return [
    "# source: " + sources,
    "# author: " + author.name,
    "# work: " + workTitle,
    "# tll_credits: " + (credits || author.credits || "The Latin Library; see cred.html"),
    "# pd_status: " + pdStatus,
    "# retrieved: " + new Date().toISOString().slice(0, 10),
    ""
  ].join("\n");
}

function qaText(text) {
  const problems = [];
  if (/The Latin Library/i.test(text) && /Classics Page/i.test(text)) {
    problems.push("nav_chrome");
  }
  if (text.length < MIN_CHARS) problems.push("too_short");
  if (/<\s*(html|body|p|table)\b/i.test(text)) problems.push("html_soup");
  return problems;
}

async function processAuthor(author, manifest) {
  const indexUrl = BASE + author.index;
  console.log("\n== " + author.name + " ==");
  let indexHtml;
  try {
    indexHtml = await fetchHtml(indexUrl);
  } catch (err) {
    console.log("  FAIL index " + err.message);
    manifest.works.push({
      author: author.id,
      title: author.workTitle || author.index,
      status: "failed",
      reason: String(err.message)
    });
    return;
  }

  let buckets;
  if (author.indexIsWork) {
    buckets = new Map([[author.workTitle || author.name, [{ url: indexUrl, title: author.workTitle || author.name }]]]);
  } else {
    const pages = discoverLinks(indexHtml, indexUrl, author);
    const blocked = pages.filter((p) => pathDenied(p.url, author.exclude));
    const open = pages.filter((p) => !pathDenied(p.url, author.exclude));
    for (const p of blocked) {
      console.log("  DENY  " + (p.title || p.url));
      manifest.works.push({
        author: author.id,
        title: p.title || p.url,
        status: "deny_copyright",
        pages: [p.url]
      });
    }
    if (!open.length && blocked.length) return;
    if (!open.length) {
      const body = extractLatin(indexHtml);
      if (!looksLikeNavOnly(body)) {
        buckets = new Map([[author.workTitle || author.name, [{ url: indexUrl, title: author.workTitle || author.name }]]]);
      } else {
        console.log("  no posted work links");
        manifest.works.push({
          author: author.id,
          title: "(none posted)",
          status: "not_posted"
        });
        return;
      }
    } else {
      buckets = groupPages(author, open);
    }
  }

  mkdirSync(join(outRoot, author.folder), { recursive: true });
  const protectedNames = new Set(author.protectExisting || []);

  for (const [title, pages] of buckets) {
    const denied = pages.filter((p) => pathDenied(p.url, author.exclude));
    const allowed = pages.filter((p) => !pathDenied(p.url, author.exclude));
    if (!allowed.length) {
      console.log("  DENY  " + title);
      manifest.works.push({
        author: author.id,
        title,
        status: "deny_copyright",
        pages: denied.map((p) => p.url)
      });
      continue;
    }

    const fileName = safeFilename(title);
    if (protectedNames.has(fileName)) {
      console.log("  SKIP existing " + fileName);
      manifest.works.push({ author: author.id, title, status: "skip_existing", file: fileName });
      continue;
    }

    if (dryRun) {
      console.log("  PLAN  " + title + "  (" + allowed.length + " page" + (allowed.length > 1 ? "s" : "") + ")");
      manifest.works.push({
        author: author.id,
        title,
        status: "planned",
        pages: allowed.map((p) => p.url)
      });
      continue;
    }

    const expanded = [];
    for (const p of allowed) {
      let html;
      try {
        html = await fetchHtml(p.url);
      } catch (err) {
        expanded.push({ ...p, fetchError: String(err.message) });
        continue;
      }
      const kids = childWorkLinks(html, p.url, author);
      const preview = extractLatin(html);
      if (kids.length >= 2 && preview.length < 1500) expanded.push(...kids);
      else expanded.push(p);
    }

    const chunks = [];
    const pageMeta = [];
    let credits = [];
    let denyReason = "";
    for (const p of expanded) {
      let html;
      try {
        html = await fetchHtml(p.url);
      } catch (err) {
        pageMeta.push({ url: p.url, status: "failed", error: String(err.message) });
        continue;
      }
      const pageCredits = extractCredits(html);
      credits = credits.concat(pageCredits);
      const why = pageCredits.map(creditDenied).find(Boolean);
      if (why && !author.allowModernCredits) {
        denyReason = why;
        pageMeta.push({ url: p.url, status: "deny_copyright", reason: why });
        continue;
      }
      const text = extractLatin(html);
      const problems = qaText(text);
      if (problems.includes("too_short") && looksLikeNavOnly(text)) {
        pageMeta.push({ url: p.url, status: "empty", chars: text.length });
        continue;
      }
      chunks.push({ url: p.url, title: p.title, text, problems });
      pageMeta.push({ url: p.url, status: "ok", chars: text.length, problems });
    }

    if (denyReason && !chunks.length) {
      console.log("  DENY  " + title + " (" + denyReason + ")");
      manifest.works.push({
        author: author.id,
        title,
        status: "deny_copyright",
        reason: denyReason,
        pages: pageMeta
      });
      continue;
    }
    if (!chunks.length) {
      console.log("  EMPTY " + title);
      manifest.works.push({ author: author.id, title, status: "empty", pages: pageMeta });
      continue;
    }

    const body = chunks
      .map((c, i) => {
        const label = chunks.length > 1 ? "===== " + (c.title || "Pars " + (i + 1)) + " =====\n# page: " + c.url + "\n\n" : "";
        return label + c.text;
      })
      .join("\n\n");
    const pdStatus = author.pdStatus || "tll_claimed";
    const out = header(author, title, chunks, [...new Set(credits)].join(" | "), pdStatus) + body + "\n";
    const dest = join(outRoot, author.folder, fileName);
    writeFileSync(dest, out, "utf8");
    console.log("  WRITE " + relative(root, dest) + "  (" + body.length + " chars, " + chunks.length + " page" + (chunks.length > 1 ? "s" : "") + ")");
    manifest.works.push({
      author: author.id,
      title,
      status: "written",
      file: relative(root, dest).replace(/\\/g, "/"),
      chars: body.length,
      pages: pageMeta
    });
  }
}

function writeReadme(manifest) {
  const written = manifest.works.filter((w) => w.status === "written");
  const denied = manifest.works.filter((w) => w.status === "deny_copyright");
  const lines = [
    "# Latin Fathers (The Latin Library)",
    "",
    "Plain-text Latin works scraped from [The Latin Library](https://www.thelatinlibrary.com/) for the Fathers Gateway corpus.",
    "",
    "These are **reading texts**, not critical editions. TLL warns that scanner artifacts and typos remain. Ancient Latin itself is public domain. Files here are limited to works whose TLL credits point to a pre-1931 edition, or that TLL presents as public-domain / out-of-copyright transcriptions.",
    "",
    "Modern copyrighted critical editions hosted on TLL with the holder’s permission (especially several Tertullian treatises, Isidore *Sententiae* III, Cassiodorus *De anima* / *De musica*, the Musurillo *Passio Perpetuae*, and TLL’s Augustine *Confessiones*) were **not** downloaded.",
    "",
    "Do not overwrite `Augustine_Latin/The Confessions of St. Augustine Latin.txt`; that file is a separate transcription already in the repo.",
    "",
    "## Provenance",
    "",
    "Each `.txt` file starts with a `# source:` header naming the TLL URL(s). Regenerated by:",
    "",
    "```",
    "node scripts/latin-library/scrape.mjs --all",
    "```",
    "",
    "Be polite: the scraper waits between requests and caches raw HTML under `scripts/latin-library/cache/` (gitignored).",
    "",
    "## This run",
    "",
    "- Written works: " + written.length,
    "- Copyright exclusions: " + denied.length,
    "- Retrieved: " + new Date().toISOString().slice(0, 10),
    "",
    "See `_manifest.json` for every URL considered and skip reasons.",
    ""
  ];
  writeFileSync(join(outRoot, "README.md"), lines.join("\n"), "utf8");
}

async function main() {
  mkdirSync(cacheDir, { recursive: true });
  mkdirSync(outRoot, { recursive: true });
  const authors = catalog.authors.filter((a) => !authorFilter || a.id === authorFilter);
  if (!authors.length) {
    console.error("No authors matched.");
    process.exit(1);
  }
  const manifest = {
    generated: new Date().toISOString(),
    dryRun,
    source: BASE,
    works: []
  };
  for (const author of authors) {
    await processAuthor(author, manifest);
  }
  if (!dryRun) writeReadme(manifest);
  writeFileSync(join(outRoot, "_manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  const written = manifest.works.filter((w) => w.status === "written" || w.status === "planned").length;
  const denied = manifest.works.filter((w) => w.status === "deny_copyright").length;
  console.log("\nDone. works=" + manifest.works.length + " written/planned=" + written + " denied=" + denied);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
