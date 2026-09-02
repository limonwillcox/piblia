/// <reference types="vitest/config" />
import { copyFileSync, createReadStream, cpSync, existsSync, mkdirSync, statSync, writeFileSync } from "fs";
import { getCatalog, getWork } from "./server/api";
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

      // Companion static pages (phone gate, give, settings) + assets they need
      for (const name of ["get-app.html", "give.html", "settings.html"]) {
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
      // GitHub Pages SPA fallback
      copyFileSync(join(dist, "index.html"), join(dist, "404.html"));

      const apiDir = join(dist, "api");
      const worksDir = join(apiDir, "works");
      mkdirSync(worksDir, { recursive: true });
      const catalog = getCatalog();
      writeFileSync(join(apiDir, "catalog.json"), JSON.stringify(catalog));

      const redirectLines = [
        "/api/catalog  /api/catalog.json  200",
        "/get-app.html  /get-app.html  200",
        "/give.html  /give.html  200",
        "/settings.html  /settings.html  200"
      ];
      const sitemapUrls = ["https://piblia.com/", "https://piblia.com/browse", "https://piblia.com/about", "https://piblia.com/give"];

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
