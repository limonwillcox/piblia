# Schaff Text Cleanup Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip non-father Schaff apparatus at parse time, populate `passage.footnotes` for matched edition notes, move the Notes rail left, and fix the broken `ReadPage.tsx` import.

**Architecture:** Add `stripEditorialSections` + `extractSchaffNotes` in `server/englishWorks.ts`, wire them into every `parseEnglishWork` path that builds paras. Update `ReadPage.tsx` / `src/styles.css` for left Notes. Keep raw `.txt` files unchanged.

**Tech Stack:** TypeScript, Vitest, React reader UI

## Global Constraints

- Clean at parse time only (do not rewrite `Fathers/English/*_English/*.txt`).
- Emit footnotes only when both inline `[n]` marker and note body exist; discard orphans; strip unmatched markers.
- Confessions / Pusey path (`server/corpus.ts`) unchanged.
- Desktop: notes left of text; mobile: text first, notes after.

---

### Task 1: Fix ReadPage.tsx parse error + left Notes + work-aware copy

**Files:**
- Modify: `src/pages/ReadPage.tsx`
- Modify: `src/styles.css` (chapter-row / chapter-notes)

- [ ] **Step 1:** Remove leading `/` on line 1 (`/import` → `import`).
- [ ] **Step 2:** Render `<Notes />` before text panes in all `ChapterBody` branches.
- [ ] **Step 3:** CSS grid `230px | 1fr` (and `210px | 1fr | 1fr` with original); notes border on right; mobile order text then notes.
- [ ] **Step 4:** Replace Confessions-hardcoded loading / empty / copyright strings with work-aware copy from `payload`.

### Task 2: Schaff cleanup helpers + wire into parseEnglishWork

**Files:**
- Modify: `server/englishWorks.ts`
- Test: `tests/englishWorks.cleanup.test.ts`

- [ ] **Step 1:** Write failing tests for extract/strip on fixtures (Justin-like footnotes, Didache intro, orphan/unmatched).
- [ ] **Step 2:** Implement `stripEditorialSections`, `extractSchaffNotes`, `parasAndNotesFromBlock`; use in all passage builders.
- [ ] **Step 3:** Run tests until green; run existing `corpus.test.ts`.

### Task 3: Verify in app

- [ ] **Step 1:** `pnpm dev` and open Didache + First Apology; confirm intro gone, notes left, app loads.
