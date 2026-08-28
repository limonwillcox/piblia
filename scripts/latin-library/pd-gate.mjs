const COPYRIGHT_MARKERS = [
  /\bMusurillo\b/i,
  /\bSources Chr[eé]tiennes\b/i,
  /\bSC\s?\d{2,4}\b/,
  /\bcopyright holders\b/i,
  /\bwith permission of the copyright\b/i
];

/** US PD cutoff in 2026: publications through 1930. */
const PD_YEAR_MAX = 1930;

export function pathDenied(url, exclude) {
  const path = safePath(url);
  return (exclude || []).some((frag) => path.includes(String(frag).toLowerCase()));
}

export function creditDenied(creditText) {
  const t = String(creditText || "");
  if (COPYRIGHT_MARKERS.some((re) => re.test(t))) return "copyright_marker";
  const years = [...t.matchAll(/\b(19[3-9]\d|20\d\d)\b/g)].map((m) => Number(m[1]));
  const modern = years.filter((y) => y > PD_YEAR_MAX);
  if (modern.length && /\b(edition|ed\.|edited|CSEL|CCSL|Corpus Christianorum|Loeb)\b/i.test(t)) {
    return "modern_edition_" + Math.max(...modern);
  }
  return null;
}

function safePath(url) {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return String(url || "").toLowerCase();
  }
}
