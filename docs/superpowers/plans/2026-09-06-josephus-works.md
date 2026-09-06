# Josephus Works Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put five Whiston Josephus works on Josephus’s own library shelf as single-blob texts, with a disputed-authorship warning on Hades.

**Architecture:** Copy Gutenberg bodies into `Fathers/English/Josephus_English/*.txt`, register author + blob overrides in `englishWorks.ts`, add `authorshipDisputed` on `Work`, render the red warning in `InspectOverlay`.

**Tech Stack:** Existing Vite/React app, `server/englishWorks.ts` discovery, vitest.

## Global Constraints

- No book/chapter splitting this pass — force `chunk: "blob"`.
- Exclude Index, Selections, Celsus anthology.
- Hades warning copy exactly: `BE AWARE: Authorship Disputed` (bold red, top of inspect blurb).

---

### Task 1: Drop Josephus texts into the English corpus folder

**Files:**
- Create: `Fathers/English/Josephus_English/Antiquities of the Jews.txt`
- Create: `Fathers/English/Josephus_English/The Wars of the Jews.txt`
- Create: `Fathers/English/Josephus_English/Against Apion.txt`
- Create: `Fathers/English/Josephus_English/The Life of Flavius Josephus.txt`
- Create: `Fathers/English/Josephus_English/Discourse to the Greeks Concerning Hades.txt`

**Interfaces:**
- Consumes: raw files under `Fathers/Flavius Josephus/`
- Produces: `.txt` extracts with `#` meta headers and Gutenberg header/footer stripped (body between `*** START` and `*** END`)

- [ ] **Step 1: Copy and strip the five works into `Josephus_English`**

Script behavior: for each source → dest pair, extract text between START/END markers (or full file if missing), prepend meta headers (`# father: josephus`, `# work: …`, `# series: Whiston`, `# source: Project Gutenberg`, `# note: Public-domain Whiston English.`).

- [ ] **Step 2: Confirm five `.txt` files exist and are non-empty**

---

### Task 2: Register Josephus in the English loader + Work flag

**Files:**
- Modify: `server/types.ts` — add optional `authorshipDisputed?: boolean` on `Work`
- Modify: `server/englishWorks.ts` — `AUTHOR_META.josephus`, `SPEC_OVERRIDES` for five ids with `chunk: "blob"`, Hades override sets disputed flag through to `workFromSpec`
- Test: `tests/corpus.test.ts` (or new `tests/josephus.test.ts`)

**Interfaces:**
- Consumes: `discoverEnglishWorkSpecs` / `loadEnglishAppWorks`
- Produces: catalog author `josephus`; works `antiquities-of-the-jews`, `wars-of-the-jews` (slug from title), `against-apion`, `life-of-flavius-josephus`, `discourse-to-the-greeks-concerning-hades` with `authorshipDisputed: true` only on Hades

- [ ] **Step 1: Write failing test** — author present; five works; each has ≥1 schaff passage; Hades has `authorshipDisputed === true`; others false/undefined
- [ ] **Step 2: Implement meta + overrides + workFromSpec plumbing**
- [ ] **Step 3: Tests pass**

---

### Task 3: Inspect overlay warning

**Files:**
- Modify: `src/pages/browse/Library.tsx` — `InspectOverlay` blurb
- Modify: `src/styles.css` — `.lib-inspect-disputed` bold red

- [ ] **Step 1: Render warning when `work.authorshipDisputed`**
- [ ] **Step 2: Style bold red at top of blurb**
- [ ] **Step 3: Verify in browser** — open Hades inspect; confirm warning; open another Josephus work; confirm no warning
