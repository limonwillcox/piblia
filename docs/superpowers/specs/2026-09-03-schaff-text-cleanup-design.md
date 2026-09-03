# Schaff English text cleanup (parse-time)

**Date:** 2026-09-03  
**Status:** Approved for planning  
**Approach:** Enhance `parseEnglishWork` + move Notes rail to the left (Approach A)

## Goal

When reading English Schaff / ANF / NPNF extracts in Piblia, the main column should show **only the Church Father’s text**. Edition apparatus (Schaff and related editors) must leave the reading stream: decorative rules, introductory notices, prefaces, prolegomena, elucidations, and similar editorial blocks are dropped. Real edition footnotes (`[n]` markers + their note bodies) become structured `passage.footnotes` and appear in a **left** Notes rail beside the text they annotate.

Raw `.txt` dumps under `Fathers/English/*_English/` stay intact so CCEL re-downloads remain possible. Cleaning happens at parse time.

## Non-goals

- Rewriting the on-disk `.txt` corpus as the source of truth.
- Changing Confessions / Pusey parsing (`server/corpus.ts`) in this pass.
- Personal user notes / OAuth.
- Perfect recovery of every idiosyncratic Schaff heading title across all volumes (heuristics + tests on representative works; iterate if outliers appear).

## Current state

- `server/englishWorks.ts` → `parseEnglishWork` splits works into passages but always sets `footnotes: []`.
- Footnote bodies and markers remain mixed into paragraph text (e.g. Justin First Apology `[1768]`).
- `parasFromBlock` already drops pure `_____` / `----+` paragraphs.
- `ReadPage` renders a Notes aside **to the right** of the chapter; Notes toggle / `.hide-fn` already exist.
- Didache and many works open with long “Introductory Notice” prose by Schaff / volume editors.

## Design

### 1. Cleaner rules (parse-time)

Inside `parseEnglishWork` (shared helpers, applied per unit block and for blob mode):

**Drop from the reading stream**

- Decorative horizontal rules (`_____`, long underscore runs, similar hyphen rules) — including mid-block, not only whole paragraphs.
- Editorial sections whose heading matches (case-insensitive, close variants allowed):
  - Introductory Notice / Translator’s Introductory Notice / original Introductory Notice
  - Translator’s Preface / Prefatory Note
  - Prolegomena
  - Elucidation / Elucidations
  - General Note
- An editorial section runs from its heading until the next **structural unit heading** (Book / Chapter / Sermon / Letter / Homily) or end of block. Mid-work Elucidations after a treatise are dropped the same way.

**Extract into `passage.footnotes`**

- Inline markers like `[1768]` in father prose.
- Following footnote body paragraphs of the form `[1768] …note text…`.
- Each kept footnote: `{ n, text, para }` where `para` is the 0-based index of the paragraph that contained the matching marker **after** cleanup.
- Body text keeps a superscript affordance via existing `.fn` rendering (marker digits removed from the prose string; UI shows `(n)`).

**Keep**

- Structural headings (Book / Chapter / Sermon / Letter / Homily) and all father body paragraphs.
- File `# meta` headers continue to be stripped as today before parsing.

**Matching policy (strict)**

- Emit a footnote **only** when both a body and a matching inline marker exist in that passage unit.
- Orphan footnote bodies (no matching `[n]` in the unit): **discard**.
- Unmatched inline `[n]` with no body: **strip from body**, do not create a Notes entry.

### 2. Pipeline

1. Read file → `stripMetaHeaders` (unchanged).
2. Detect / apply chunk marks (unchanged).
3. Per unit (or whole blob): `stripEditorialSections` → paragraphize → `extractSchaffNotes` → produce `{ paras, footnotes }`.
4. Assign `versions.schaff` / existing translation id from cleaned paras; set `footnotes` on the `Passage`.
5. Existing discover / load / API / static HTML generation consume cleaned passages with no catalog shape change beyond populated footnotes.

Suggested helper surface (names flexible):

- `stripEditorialSections(block: string): string`
- `extractSchaffNotes(paras: string[]): { paras: string[]; footnotes: Footnote[] }`

### 3. UI

- Move `<Notes />` **before** the translation / original panes in `ChapterBody` layouts.
- CSS: `.chapter-row` grid becomes `notes | text`; with original split: `notes | text | original`.
- Restyle `.chapter-notes` for a left rail (border on the right edge of the notes column instead of left).
- `.hide-fn` continues to hide notes + superscripts; grid collapses to text-only (and text | original when split).
- **Mobile / narrow:** stack with **father text first**, Notes after (reading priority). Desktop: notes on the left.

### 4. Testing / success criteria

Unit tests (extend `tests/corpus.test.ts` or add `tests/englishWorks.cleanup.test.ts`):

- Justin First Apology sample: footnote `[1768]` linked to its body; body paragraphs do not include the note text; decorative rules absent.
- Didache: no “Introductory Notice” Schaff prose in chapter 1 / opening paras.
- Orphan note body alone → not present in `footnotes`.
- Unmatched `[9999]` in prose → stripped, no footnote entry.

Manual / reader checks:

- Notes rail populated for a Schaff work that has edition notes.
- Notes sit left of text on desktop; Notes toggle still works.
- Didache no longer opens on Schaff’s introduction.

## Out of scope follow-ups

- Hardening more editorial heading aliases if volume outliers remain.
- Optional later pass to clean Confessions apparatus the same way (different source format).
- Permanently rewriting `.txt` files once parse-time rules are stable (Approach B / C).

## PR plan (high level)

1. **Parser cleanup** — helpers + wire into `parseEnglishWork`; unit tests.
2. **Reader UI** — left Notes rail + CSS grid / mobile stacking.
3. **Verify** — sample works in app + existing corpus tests still green.
