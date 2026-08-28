import * as cheerio from "cheerio";

const NAV_LINE =
  /^(Christian Latin|The Latin Library|The Classics Page|Christina Latin)(\s+(Christian Latin|The Latin Library|The Classics Page|Christina Latin))*$/i;

const CREDIT_LINE =
  /^(Submitted by\b|This text is taken from\b|posted by\b|formatted by\b)/i;

export function extractCredits(html) {
  const $ = cheerio.load(html);
  const hits = [];
  $("p, div, font, td").each((_, el) => {
    const t = collapse($(el).text());
    if (CREDIT_LINE.test(t) || /Musurillo|Sources Chr[eé]tiennes|\bCSEL\b|\bMigne\b|\bedition of\b|\bed\. /i.test(t)) {
      if (t.length < 800) hits.push(t);
    }
  });
  return hits;
}

export function extractLatin(html) {
  const $ = cheerio.load(html, { decodeEntities: true });
  $("script, style, noscript, iframe, img, link, meta").remove();
  $("br").replaceWith("\n");

  $("table").each((_, el) => {
    const t = collapse($(el).text());
    if (/The Latin Library/i.test(t) && /Classics Page|Christian Latin/i.test(t)) {
      $(el).remove();
    }
  });

  $("a").each((_, el) => {
    const href = String($(el).attr("href") || "");
    const t = collapse($(el).text());
    if (
      /christian\.html|\/christian|index\.html|classics\.html|\/classics/i.test(href) &&
      /latin library|christian latin|classics page/i.test(t)
    ) {
      $(el).remove();
    }
  });

  $("p, div, center, font, td").each((_, el) => {
    const t = collapse($(el).text());
    if (!t) return;
    if (NAV_LINE.test(t) || CREDIT_LINE.test(t)) $(el).remove();
  });

  const parts = [];
  $("body")
    .find("h1, h2, h3, h4, h5, h6, p, li, pre, blockquote")
    .each((_, el) => {
      const $el = $(el);
      if ($el.is("p.border, p.internal")) {
        const inner = collapse($el.text());
        if (!inner) return;
      }
      let text = $el.text().replace(/\u00a0/g, " ");
      text = text.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");
      text = text.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
      if (!text) return;
      if (NAV_LINE.test(collapse(text))) return;
      if (CREDIT_LINE.test(collapse(text))) return;
      parts.push(text);
    });

  let out = parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  out = stripTrailingNav(out);

  if (out.length < 400) {
    let fallback = $("body").text().replace(/\u00a0/g, " ");
    fallback = fallback.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");
    fallback = fallback.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    fallback = stripTrailingNav(fallback);
    if (fallback.length > out.length) out = fallback;
  }
  return out;
}

export function looksLikeNavOnly(text) {
  const t = collapse(text);
  return !t || NAV_LINE.test(t) || t.length < 80;
}

function collapse(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function stripTrailingNav(text) {
  const lines = text.split("\n");
  while (lines.length) {
    const last = lines[lines.length - 1].trim();
    if (!last) {
      lines.pop();
      continue;
    }
    if (NAV_LINE.test(last) || CREDIT_LINE.test(last)) {
      lines.pop();
      continue;
    }
    break;
  }
  return lines.join("\n").trim();
}
