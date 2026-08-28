import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const base = "http://127.0.0.1:8080";
const out = "scripts/shots";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const errors = [];

async function pageWithLog(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return { context, page };
}

const { context, page } = await pageWithLog({ width: 1280, height: 900 });

await page.goto(base + "/", { waitUntil: "networkidle" });
if (await page.locator(".promo-card").count()) errors.push("Homepage still has side promo cards");
if (await page.locator("text=Create your free account").count()) errors.push("Free account promo still visible");
if (await page.locator("text=Open source").count()) errors.push("Open source copy still visible on home");
if (!(await page.locator('[data-mode="translation"]').count())) errors.push("Missing Translation button");
if (!(await page.locator('[data-mode="original"]').count())) errors.push("Missing Original button");
if (await page.locator("#editionBar.show").count()) errors.push("Edition bar visible before a work is open");
if (await page.locator('a:has-text("Plans")').count()) errors.push("Plans still in nav");
if (await page.locator('a:has-text("Audio")').count()) errors.push("Audio still in nav");
if (await page.locator("#optsBtn").count()) errors.push("Gear icon still present");
if ((await page.locator("[data-readopt]").count()) < 5) errors.push("Reading option buttons missing from rail");
await page.screenshot({ path: out + "/home.png", fullPage: true });

await page.fill("#q", "Confessions");
await Promise.all([
  page.waitForURL(/read(\.html)?(\?|$)/, { timeout: 10000 }),
  page.locator("#q").press("Enter")
]);
const chapCount = await page.locator(".book-chapter").count();
if (chapCount < 5) errors.push("Full book did not render multiple chapters, got " + chapCount);
await page.screenshot({ path: out + "/read-book.png", fullPage: false });
await page.goto(base + "/read.html?work=confessions&chapter=1", { waitUntil: "networkidle" });
await page.waitForSelector("#editionBar.show", { timeout: 5000 });
const chips = await page.locator(".edition-chip").count();
if (chips < 1) errors.push("No translation chips after opening a work");
if (!(await page.locator(".orig-pane").count())) errors.push("Original column missing (parallel original should default on)");
if (!(await page.locator(".orig-pane").locator("text=Magnus es").count())) errors.push("Latin Confessiones missing from parallel column");
await page.screenshot({ path: out + "/read-parallel.png", fullPage: true });

await page.click('[data-mode="original"]');
await page.waitForURL(/mode=original/, { timeout: 10000 });
await page.waitForTimeout(350);
if (await page.locator("#editionBar.show").count()) errors.push("Edition bar still visible in Original mode");
if (await page.locator(".orig-pane").count()) errors.push("Split original pane should not show when already in Original mode");
if (!(await page.locator("text=Magnus es, domine").count())) errors.push("Latin Confessiones missing in Original mode");
await page.screenshot({ path: out + "/read-original.png", fullPage: true });

await page.click('[data-mode="translation"]');
await page.waitForURL(/mode=translation/, { timeout: 10000 });
await page.waitForSelector("#editionBar.show");
await page.click('.edition-chip:has-text("Pusey")');
await page.waitForURL(/version=pusey/, { timeout: 10000 });
await page.screenshot({ path: out + "/read-pusey.png", fullPage: true });

const word = page.locator(".w").nth(3);
await word.click();
await page.waitForSelector("#hlBar.open");
await page.click('[data-hl="hl-yellow"]');
if (!(await word.evaluate((el) => el.classList.contains("hl-yellow")))) errors.push("Word highlight did not apply");
await page.click("#themeBtn");
await page.waitForTimeout(200);
const color = await word.evaluate((el) => getComputedStyle(el).color);
const rgb = color.match(/\d+/g).map(Number);
if (rgb[0] + rgb[1] + rgb[2] > 400) errors.push("Dark-mode highlight text is still light: " + color);
await page.screenshot({ path: out + "/read-night-hl.png" });
await page.click("#themeBtn");

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.fill("#q", "restless");
await Promise.all([
  page.waitForURL(/search(\.html)?(\?|$)/, { timeout: 10000 }),
  page.locator("#q").press("Enter")
]);
if ((await page.locator(".result").count()) < 1) errors.push("Keyword search returned no results");
await page.screenshot({ path: out + "/search.png", fullPage: true });

await page.click("#loginBtn");
await page.waitForSelector("#loginModal.open");
if (!(await page.locator('[data-auth="create"]').count())) errors.push("Create account tab missing");
await page.click('[data-auth="create"]');
await page.fill("#loginName", "Paula");
await page.click("#loginSubmit");
await page.waitForLoadState("networkidle");
if (!/Paula/.test(await page.locator(".header-actions").innerText())) errors.push("Create account did not sign in");
await page.screenshot({ path: out + "/signed-in.png" });

await context.close();

const { context: mobileCtx, page: mobile } = await pageWithLog({ width: 390, height: 844 });
await mobile.goto(base + "/", { waitUntil: "networkidle" });
await mobile.screenshot({ path: out + "/home-mobile.png", fullPage: true });
await mobile.goto(base + "/read.html?work=confessions&chapter=1&mode=translation", { waitUntil: "networkidle" });
await mobile.screenshot({ path: out + "/read-mobile.png", fullPage: true });
await mobileCtx.close();

await browser.close();
if (errors.length) {
  console.error("FAILURES:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("OK: home, chips fade, parallel original, original mode hides chips, Pusey chip, search, create account, mobile");
