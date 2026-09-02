/// <reference types="vitest/config" />
import { copyFileSync, createReadStream, cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { getCatalog, getWork } from "./server/api";
import {
  CHURCH_HISTORY_CANONICAL_PATH,
  CHURCH_HISTORY_DESCRIPTION,
  CHURCH_HISTORY_TITLE,
  churchHistoryJsonLd,
  renderChurchHistoryHtml
} from "./server/churchHistory";
import { dirname, extname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fathersApiPlugin } from "./server/plugin";

const root = dirname(fileURLToPath(import.meta.url));

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

const SITE_ORIGIN = "https://piblia.com";

/**
 * Emit dist/church-history/index.html — the built app shell with the timeline
 * baked into #root, plus the page's own title, description, canonical, Open Graph
 * tags and JSON-LD. React replaces the markup when it boots; the crawler and
 * anyone arriving from search already have it.
 *
 * Every substitution is checked, because a silently wrong <title> on the site's
 * main SEO landing page is exactly the regression that must not ship.
 */
function writeChurchHistoryPage(dist: string, catalog: ReturnType<typeof getCatalog>): void {
  const canonical = SITE_ORIGIN + CHURCH_HISTORY_CANONICAL_PATH;
  // "<" is escaped so the payload can never close the script element early.
  const jsonLd = JSON.stringify(churchHistoryJsonLd(SITE_ORIGIN)).replace(/</g, "\\u003c");
  const head = [
    '    <link rel="canonical" href="' + canonical + '" />',
    '    <meta property="og:type" content="article" />',
    '    <meta property="og:url" content="' + canonical + '" />',
    '    <meta property="og:title" content="' + escapeHtml(CHURCH_HISTORY_TITLE) + '" />',
    '    <meta property="og:description" content="' + escapeHtml(CHURCH_HISTORY_DESCRIPTION) + '" />',
    "    <script type=\"application/ld+json\">" + jsonLd + "</script>",
    "  </head>"
  ].join("\n");

  const steps: { name: string; apply: (s: string) => string }[] = [
    {
      name: "<title>",
      apply: (s) => s.replace(/<title>[\s\S]*?<\/title>/, "<title>" + escapeHtml(CHURCH_HISTORY_TITLE) + "</title>")
    },
    {
      name: 'meta name="description"',
      apply: (s) =>
        s.replace(
          /<meta\s+name="description"[\s\S]*?\/>/,
          '<meta name="description" content="' + escapeHtml(CHURCH_HISTORY_DESCRIPTION) + '" />'
        )
    },
    { name: "</head>", apply: (s) => s.replace("</head>", head) },
    {
      name: 'empty <div id="root">',
      apply: (s) =>
        s.replace(
          '<div id="root"></div>',
          '<div id="root"><main class="page" id="page">' + renderChurchHistoryHtml(catalog) + "</main></div>"
        )
    }
  ];

  let html = readFileSync(join(dist, "index.html"), "utf8");
  for (const step of steps) {
    const next = step.apply(html);
    if (next === html) {
      throw new Error("church-history prerender: could not find " + step.name + " in dist/index.html");
    }
    html = next;
  }

  const outDir = join(dist, "church-history");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
}

function extrasPlugin() {
  function serveAssets(middlewares: { use: (fn: (req: { url?: string }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (s?: string) => void }, next: () => void) => void) => void }) {
    middlewares.use((req, res, next) => {
      const url = req.url || "";
      if (!url.startsWith("/assets/")) return next();
      const rel = decodeURIComponent(url.replace(/^\/assets\//, "").split("?")[0]);
      if (!rel || rel.includes("..") || rel.includes("\\")) {
        res.statusCode = 400;
        res.end("bad path");
        return;
      }
      const file = join(root, "assets", rel);
      if (!existsSync(file) || !statSync(file).isFile()) return next();
      const type = MIME[extname(file).toLowerCase()] || "application/octet-stream";
      res.setHeader("Content-Type", type);
      createReadStream(file).pipe(res as unknown as NodeJS.WritableStream);
    });
  }

  return {
    name: "fathers-extras",
    configureServer(server: { middlewares: Parameters<typeof serveAssets>[0] }) {
      serveAssets(server.middlewares);
    },
    configurePreviewServer(server: { middlewares: Parameters<typeof serveAssets>[0] }) {
      serveAssets(server.middlewares);
    },
    closeBundle() {
      const dist = join(root, "dist");
      cpSync(join(root, "assets"), join(dist, "assets"), { recursive: true });
      const cname = join(root, "CNAME");
      if (existsSync(cname)) copyFileSync(cname, join(dist, "CNAME"));
      const nojekyll = join(root, ".nojekyll");
      if (existsSync(nojekyll)) copyFileSync(nojekyll, join(dist, ".nojekyll"));
      else writeFileSync(join(dist, ".nojekyll"), "");

      // Companion static pages (phone gate, settings) + assets they need.
      // Do not copy give.html: GitHub Pages serves it at /give and would hide the React Give route.
      for (const name of ["get-app.html", "settings.html"]) {
        const src = join(root, name);
        if (existsSync(src)) copyFileSync(src, join(dist, name));
      }
      mkdirSync(join(dist, "js"), { recursive: true });
      mkdirSync(join(dist, "css"), { recursive: true });
      if (existsSync(join(root, "js", "gate.js"))) {
        copyFileSync(join(root, "js", "gate.js"), join(dist, "js", "gate.js"));
      }
      if (existsSync(join(root, "src", "styles.css"))) {
        copyFileSync(join(root, "src", "styles.css"), join(dist, "css", "styles.css"));
      }
      // GitHub Pages SPA fallback. Also overwrite give.html so /give is the React app
      // (Pages maps /give → give.html if that file exists).
      copyFileSync(join(dist, "index.html"), join(dist, "404.html"));
      copyFileSync(join(dist, "index.html"), join(dist, "give.html"));

      const apiDir = join(dist, "api");
      const worksDir = join(apiDir, "works");
      mkdirSync(worksDir, { recursive: true });
      const catalog = getCatalog();
      writeFileSync(join(apiDir, "catalog.json"), JSON.stringify(catalog));

      const redirectLines = [
        "/api/catalog  /api/catalog.json  200",
        "/get-app.html  /get-app.html  200",
        "/give.html  /give.html  200",
        "/settings.html  /settings.html  200",
        // Serve the prerendered page rather than falling through to the SPA catch-all.
        "/church-history  /church-history/index.html  200",
        "/church-history/  /church-history/index.html  200"
      ];
      const sitemapUrls = [
        SITE_ORIGIN + "/",
        SITE_ORIGIN + "/browse",
        SITE_ORIGIN + CHURCH_HISTORY_CANONICAL_PATH,
        SITE_ORIGIN + "/about",
        SITE_ORIGIN + "/give"
      ];

      writeChurchHistoryPage(dist, catalog);

      for (const w of catalog.works) {
        const payload = getWork(w.id);
        if (!payload) continue;
        writeFileSync(join(worksDir, w.id + ".json"), JSON.stringify(payload));
        redirectLines.push("/api/works/" + w.id + "  /api/works/" + w.id + ".json  200");

        const author = catalog.authors.find((a) => a.id === w.author);
        const fatherDir = join(dist, "fathers", w.author);
        mkdirSync(fatherDir, { recursive: true });
        const pagePath = join(fatherDir, w.id + ".html");
        const translationId = Object.keys(payload.chapters[0]?.versions || {}).find((id) => id !== "lat" && id !== "grk") || "schaff";
        // MVP: keep crawler HTML lean — full text lives in /api/works JSON + SPA reader.
        const previewChapters = payload.chapters.slice(0, Math.min(3, payload.chapters.length));
        const sections = previewChapters
          .map((ch) => {
            const paras = (ch.versions[translationId] || []).slice(0, 8).map((p) => "<p>" + escapeHtml(p) + "</p>").join("\n");
            return "<section id=\"ch-" + ch.chapter + "\"><h2>" + escapeHtml(ch.heading) + "</h2>\n" + paras + "</section>";
          })
          .join("\n");
        const moreNote =
          payload.chapters.length > 3
            ? "<p><em>Preview only — open in the reader for the full " +
              payload.chapters.length +
              " sections.</em></p>"
            : "";
        const title = escapeHtml(w.title + " — " + (author?.name || w.author));
        const desc = escapeHtml(
          "Public-domain English text of " + w.title + " by " + (author?.name || w.author) + ". Read on Piblia."
        );
        writeFileSync(
          pagePath,
          [
            "<!DOCTYPE html>",
            '<html lang="en">',
            "<head>",
            '  <meta charset="utf-8" />',
            '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
            "  <title>" + title + "</title>",
            '  <meta name="description" content="' + desc + '" />',
            '  <link rel="canonical" href="https://piblia.com/fathers/' + w.author + "/" + w.id + '.html" />',
            "  <style>body{font-family:Georgia,serif;max-width:42rem;margin:1.5rem auto;padding:0 1rem;line-height:1.55;color:#1a1a1a}h1,h2{font-family:system-ui,sans-serif}a{color:#952004}</style>",
            "</head>",
            "<body>",
            "  <p><a href=\"/\">Piblia</a> · <a href=\"/browse\">Browse</a> · <a href=\"/read?work=" +
              encodeURIComponent(w.id) +
              '">Open in reader</a></p>',
            "  <h1>" + escapeHtml(w.title) + "</h1>",
            "  <p>" + escapeHtml(author?.name || "") + (author?.dates ? " (" + escapeHtml(author.dates) + ")" : "") + "</p>",
            sections,
            moreNote,
            "</body>",
            "</html>",
            ""
          ].join("\n")
        );
        sitemapUrls.push("https://piblia.com/fathers/" + w.author + "/" + w.id + ".html");
      }

      redirectLines.push("/*    /index.html   200", "");
      writeFileSync(join(dist, "_redirects"), redirectLines.join("\n"));
      writeFileSync(
        join(dist, "sitemap.xml"),
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...sitemapUrls.map(
            (u) => "  <url><loc>" + u + "</loc><changefreq>weekly</changefreq></url>"
          ),
          "</urlset>",
          ""
        ].join("\n")
      );
      writeFileSync(
        join(dist, "robots.txt"),
        ["User-agent: *", "Allow: /", "Sitemap: https://piblia.com/sitemap.xml", ""].join("\n")
      );
    }
  };
}

export default defineConfig({
  plugins: [react(), fathersApiPlugin(), extrasPlugin()],
  resolve: {
    alias: {
      "@": resolve(root, "src")
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
