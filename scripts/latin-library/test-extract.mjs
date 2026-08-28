import { readFileSync } from "fs";
import { extractLatin, looksLikeNavOnly } from "./extract.mjs";

const html = readFileSync(process.argv[2], "utf8");
const text = extractLatin(html);
const checks = {
  chars: text.length,
  navChrome: /The Latin Library/i.test(text) && /Classics Page/i.test(text),
  htmlSoup: /<\s*(html|body|table)\b/i.test(text),
  navOnly: looksLikeNavOnly(text),
  hasCaput: /CAPUT/i.test(text),
  opening: text.slice(0, 180)
};
console.log(JSON.stringify(checks, null, 2));
if (checks.navChrome || checks.htmlSoup || checks.navOnly || checks.chars < 200) {
  process.exit(1);
}
