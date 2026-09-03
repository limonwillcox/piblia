# Church History Cinematic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Act I of `/church-history/` as one continuous full-viewport black theatre with edge-hover chrome reveal, and update Nero / Decius / Milan / Nicaea shot art and copy per the approved spec.

**Architecture:** One sticky full-viewport stage owns the whole Act. Global scroll progress `G ∈ [0,1]` on the theatre maps to per-shot local `--p` so existing CSS scrub animations stay authored per shot. A single backdrop fades in at Act entry and out at Act exit. `body.ch-dark` fully covers header + rail; top/left hit zones toggle `body.ch-dark-peek` to restore chrome. Timeline eras stay crawlable; cinematic stays `aria-hidden`. Scene slot moves from `milvian` → `milan`.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, CSS custom properties + paused `@keyframes` scrubbed by `--p`, Playwright for visual smoke.

**Spec:** `docs/superpowers/specs/2026-09-02-church-history-cinematic-design.md`

## Global Constraints

- Scenes remain decorative (`aria-hidden`); timeline is the SEO source of truth.
- Exact Milan caption title: `Constantine legalizes Christianity` with date `AD 313` (Edict of Milan / free exercise — not state religion).
- Decius lower lettering uses `Under Decius` (not Dionysius).
- Decius father icons: Origen · Cyprian · Fabian.
- Nero crosses are occupied (stick figures on them).
- Nero and Constantine share one stick-Caesar vocabulary (horns vs halo).
- Fade in only at Act start; fade out only at Act end; no page-background flash between shots.
- Chrome peek: reveal only while pointer is in top/side hit zones.
- Mobile: top-edge hit zone only (`--rail: 0`).
- `prefers-reduced-motion`: static posters; no blackout / peek theatre.
- Do not rewrite post-Nicaea shots; do not rewrite Pentecost / Apostolic Fathers / Great Persecution artwork beyond Diocletian caption.
- Prefer extracting pure helpers for scroll math so Vitest can cover them without a browser.

---

## File map

| File | Responsibility |
| --- | --- |
| `server/churchHistory.ts` | Era `scene` fields; `ACT_ONE_SCENES`; prerender theatre placeholder |
| `src/lib/scrollScene.ts` | `shotLocalProgress`, theatre scroll driver, chrome cover + peek |
| `src/styles.css` | Full-bleed theatre, backdrop enter/exit, `ch-dark` / `ch-dark-peek`, hit zones, reduced motion |
| `src/components/history/scenes.tsx` | `Theatre` shell, shared `CaesarFigure`, all Act I shots |
| `src/pages/ChurchHistoryPage.tsx` | Mount theatre scroll + chrome cover |
| `tests/churchHistory.test.ts` | Era scene slot + prerender placeholder assertions |
| `tests/scrollScene.test.ts` | Pure progress / segment math |

---

### Task 1: Move cinematic slot to Milan + single prerender placeholder

**Files:**
- Modify: `server/churchHistory.ts` (milvian / milan era objects; `renderChurchHistoryHtml`)
- Modify: `tests/churchHistory.test.ts`

**Interfaces:**
- Consumes: existing `HistoryEra.scene?: string`, `ACT_ONE_SCENES`
- Produces: `milan` era has `scene: "milan"`; `milvian` has no `scene`; `ACT_ONE_SCENES` includes `"milan"` not `"milvian"`; prerender emits one `.ch-theatre` placeholder inside `.ch-cinematic`

- [ ] **Step 1: Write the failing tests**

Add to `tests/churchHistory.test.ts`:

```ts
it("assigns Act I cinematic slots through Milan, not Milvian", () => {
  const byId = new Map(ERAS.map((e) => [e.id, e]));
  expect(byId.get("milvian")?.scene).toBeUndefined();
  expect(byId.get("milan")?.scene).toBe("milan");
  expect(ACT_ONE_SCENES).toContain("milan");
  expect(ACT_ONE_SCENES).not.toContain("milvian");
  expect(ACT_ONE_SCENES).toEqual([
    "pentecost",
    "acts-book",
    "nero",
    "jerusalem",
    "apostolic-fathers",
    "persecution",
    "great-persecution",
    "milan",
    "nicaea"
  ]);
});

it("prerenders one theatre placeholder for Act I (CLS reserve)", () => {
  const html = renderChurchHistoryHtml(null);
  expect(html).toContain('class="ch-cinematic"');
  expect(html).toContain('class="ch-theatre"');
  expect(html).toContain('data-scene-placeholder="act-one"');
  expect(html.match(/data-scene-placeholder=/g)?.length).toBe(1);
});
```

Import `ACT_ONE_SCENES` from `../server/churchHistory`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run tests/churchHistory.test.ts -t "assigns Act I|prerenders one theatre"`

Expected: FAIL (milan has no scene; prerender still emits per-scene placeholders).

- [ ] **Step 3: Minimal data + prerender changes**

In `server/churchHistory.ts`:

1. Remove `scene: "milvian"` from the milvian era.
2. Add `scene: "milan"` to the milan era (keep existing title/body about the Edict).
3. Replace the prerender loop:

```ts
out.push("<div class=\"ch-cinematic\">");
out.push(
  "<div class=\"ch-theatre\" data-scene-placeholder=\"act-one\" aria-hidden=\"true\"></div>"
);
out.push("</div>");
```

Leave `ACT_ONE_SCENES` derived from eras with `scene` — it will pick up `milan` automatically.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run tests/churchHistory.test.ts`

Expected: PASS (including the new cases).

- [ ] **Step 5: Commit**

```bash
git add server/churchHistory.ts tests/churchHistory.test.ts
git commit -m "feat(history): move Act I cinematic slot to Edict of Milan"
```

---

### Task 2: Theatre progress helpers + chrome cover/peek mounts

**Files:**
- Create: `tests/scrollScene.test.ts`
- Modify: `src/lib/scrollScene.ts`

**Interfaces:**
- Consumes: existing `prefersReducedMotion()`, `mountScrollScenes` patterns
- Produces:
  - `shotLocalProgress(globalP: number, index: number, count: number): number` — returns 0..1 local progress for shot `index`
  - `mountTheatreScroll(theatre: HTMLElement): () => void` — sets `--p` on `theatre` (global) and on each `[data-shot]` (local); no-op when reduced motion
  - `mountChromeCover(theatre: HTMLElement, className?: string): () => void` — toggles `body.ch-dark` while theatre intersects viewport; installs top/left hit zones that toggle `body.ch-dark-peek`; teardown removes classes, zones, listeners; no-op when reduced motion

- [ ] **Step 1: Write the failing tests**

Create `tests/scrollScene.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { shotLocalProgress } from "../src/lib/scrollScene";

describe("shotLocalProgress", () => {
  it("is 0 before the shot's segment", () => {
    expect(shotLocalProgress(0.1, 2, 9)).toBe(0);
  });

  it("is 1 after the shot's segment", () => {
    expect(shotLocalProgress(0.9, 2, 9)).toBe(1);
  });

  it("ramps 0→1 inside the shot's equal segment", () => {
    // 9 shots → each span 1/9; shot 0 occupies [0, 1/9]
    expect(shotLocalProgress(0, 0, 9)).toBe(0);
    expect(shotLocalProgress(1 / 18, 0, 9)).toBeCloseTo(0.5, 5);
    expect(shotLocalProgress(1 / 9, 0, 9)).toBe(1);
  });

  it("guards empty counts", () => {
    expect(shotLocalProgress(0.5, 0, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/scrollScene.test.ts`

Expected: FAIL with `shotLocalProgress` not exported / not defined.

- [ ] **Step 3: Implement helpers + mounts**

In `src/lib/scrollScene.ts`, add:

```ts
export function shotLocalProgress(globalP: number, index: number, count: number): number {
  if (count <= 0) return 0;
  const span = 1 / count;
  const start = index * span;
  if (span <= 0) return 0;
  return clamp01((globalP - start) / span);
}
```

Implement `mountTheatreScroll(theatre)`:

- Query `theatre.querySelectorAll<HTMLElement>("[data-shot]")`.
- On scroll/resize/rAF (same pattern as `mountScrollScenes`): compute `globalP` from theatre `getBoundingClientRect()` with `span = height - vh`.
- `theatre.style.setProperty("--p", globalP.toFixed(4))`.
- For each shot at index `i`, `shot.style.setProperty("--p", shotLocalProgress(globalP, i, shots.length).toFixed(4))`.
- IntersectionObserver optional optimization (only paint when intersecting) — mirror existing `onScreen` pattern using the theatre element.
- Teardown clears `--p` on theatre and shots.

Implement `mountChromeCover(theatre, className = "ch-dark")`:

- IntersectionObserver toggles `document.body.classList.toggle(className, intersecting && ratio > 0.15)` (threshold array `[0, 0.15, 0.5, 1]`).
- Create two fixed hit-zone elements (or one wrapper with two regions) appended to `document.body`:
  - Top: `position:fixed; top:0; left:0; right:0; height: var(--header, 58px); z-index: 60;`
  - Left: `position:fixed; top:0; left:0; bottom:0; width: var(--rail, 56px); z-index: 60;`
  - Class: `ch-chrome-hit` (pointer-events auto; background transparent).
- `pointerenter` / `pointerleave` on zones toggle `body.ch-dark-peek`.
- Only insert zones while `ch-dark` is active (or always insert but `pointer-events: none` when not dark — prefer insert while dark to avoid stealing events elsewhere).
- On teardown: disconnect IO, remove zones, remove `ch-dark` and `ch-dark-peek`.

Keep `mountScrollScenes` and `mountChromeBlackout` exported for now (Give page / callers); `ChurchHistoryPage` will switch in Task 4. Do not delete old helpers until the page no longer imports them.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run tests/scrollScene.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scrollScene.ts tests/scrollScene.test.ts
git commit -m "feat(history): add theatre scroll progress and chrome peek mounts"
```

---

### Task 3: Full-bleed theatre CSS + chrome cover/peek

**Files:**
- Modify: `src/styles.css` (church history cinematic block ~1404–1678)

**Interfaces:**
- Consumes: `--header`, `--rail`, `body.ch-dark`, `body.ch-dark-peek`, `.ch-theatre`, `.ch-shot`, `.ch-chrome-hit`
- Produces: CSS that makes one theatre fill the viewport under chrome, covers chrome when dark, restores chrome on peek, and collapses under reduced motion

- [ ] **Step 1: Replace per-scene sticky layout with theatre layout**

Replace / extend the cinematic CSS so that:

```css
.ch-cinematic {
  margin: 28px 0 8px;
}
.ch-theatre {
  --p: 1;
  --shot-count: 9;
  position: relative;
  /* ~scroll budget: ~1.7 viewport per shot */
  height: calc(var(--shot-count) * 170vh);
}
.ch-theatre[data-scene-placeholder] {
  /* prerender CLS reserve before React hydrates */
  min-height: calc(9 * 170vh);
}
.ch-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  /* pull out of the padded page column to true viewport left */
  left: 0;
  z-index: 55; /* above .site-header (40) and .rail (50) while covering */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 5vh, 56px);
  padding: 24px;
  overflow: hidden;
  border-radius: 0;
  box-sizing: border-box;
}
.ch-backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 90% at 50% 62%, #241206 0%, #0a0a0d 62%, #050507 100%);
  /* enter in first ~6% of Act; exit in last ~6% — mid-Act stays fully black */
  opacity: clamp(0, min(var(--p) / 0.06, (1 - var(--p)) / 0.06), 1);
}
.ch-shot {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 5vh, 56px);
  padding: 24px;
  opacity: 0;
  pointer-events: none;
  /* visible while local --p is in (0,1); hold fully on at ends of active scrub via JS class or: */
}
.ch-shot[data-active="1"] {
  opacity: 1;
}
```

Also set `data-active` from `mountTheatreScroll`: `data-active="1"` when `localP > 0 && localP < 1`, and also when `localP === 0` for the first shot at G=0 after enter? Prefer: active when `localP > 0 && localP < 1`, OR (`localP === 0` && previous finished) — simplest rule:

- Shot `i` is active when `shotLocalProgress` is in `(0, 1)` exclusive, **or** `local === 0` and global is exactly at segment start and i===0, **or** `local === 1` and this is the last shot still pinned.
- Practical rule used in paint: active if `globalP` is inside `[i/n, (i+1)/n)` for i < n-1, and `[i/n, 1]` for last.

```ts
const start = i / n;
const end = (i + 1) / n;
const active = i === n - 1 ? globalP >= start && globalP <= 1 : globalP >= start && globalP < end;
shot.dataset.active = active ? "1" : "0";
```

First shot at G=0: `active` true. Update Task 2 paint loop with this if not already done — do it here as a follow-through edit to `mountTheatreScroll` in the same commit if needed.

Remove dependence on old `.ch-scene { height: 170vh }` for Act I (may leave class unused or delete). Per-shot backdrops that used `.ch-backdrop.ch-anim.ch-fade` must **not** fade per shot anymore — backdrop is singular on the stage.

Chrome cover (replace dim-only rules):

```css
body.ch-dark .site-header,
body.ch-dark .search-strip,
body.ch-dark .site-footer,
body.ch-dark .rail {
  opacity: 0;
  pointer-events: none;
  filter: none;
}
body.ch-dark.ch-dark-peek .site-header,
body.ch-dark.ch-dark-peek .search-strip,
body.ch-dark.ch-dark-peek .rail {
  opacity: 1;
  pointer-events: auto;
  z-index: 70;
}
.ch-chrome-hit {
  position: fixed;
  z-index: 60;
  background: transparent;
}
```

Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .ch-theatre { --p: 1; height: auto; }
  .ch-stage { position: static; height: auto; width: auto; margin-left: 0; z-index: auto; }
  .ch-shot { position: relative; opacity: 1; inset: auto; }
  .ch-anim { animation: none; }
  .ch-backdrop { opacity: 1; }
  .ch-wind-line, .ch-book-flip, .ch-chapter { opacity: 0; }
  .ch-chapter-last { opacity: 1; }
  body.ch-dark .site-header,
  body.ch-dark .search-strip,
  body.ch-dark .site-footer,
  body.ch-dark .rail { opacity: 1; pointer-events: auto; }
}
```

Under reduced motion, stack all shots as static posters (accept long page) OR show only finished frames in a compact stack — match prior intent: keep each shot as a short poster (`height` ~46vh per shot). Set `.ch-shot { height: 46vh; }` under reduced motion.

- [ ] **Step 2: Sanity-check selectors against Layout z-index**

Confirm `.site-header` is `z-index: 40` and `.rail` is `z-index: 50` in `src/styles.css`. Stage at 55 covers both; peek raises chrome to 70.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css src/lib/scrollScene.ts
git commit -m "style(history): full-bleed Act I theatre and chrome peek"
```

---

### Task 4: React Theatre shell + page wiring

**Files:**
- Modify: `src/components/history/scenes.tsx`
- Modify: `src/pages/ChurchHistoryPage.tsx`

**Interfaces:**
- Consumes: `ACT_ONE_SCENES`, `SCENES` registry, `mountTheatreScroll`, `mountChromeCover`
- Produces: `Theatre` component rendering one stage + backdrop + ordered `[data-shot]` children; page mounts new scroll/chrome helpers on `.ch-theatre`

- [ ] **Step 1: Refactor `Scene` → shot-inside-theatre**

In `scenes.tsx`:

1. Change the shared wrapper from a full sticky section to a shot layer:

```tsx
function Shot({ id, art, caption }: { id: string; art: ReactNode; caption: ReactNode }) {
  return (
    <div className="ch-shot" data-shot={id}>
      <svg className="ch-svg" viewBox="0 0 800 360" role="presentation" focusable="false">
        {art}
      </svg>
      <div className="ch-cap">{caption}</div>
    </div>
  );
}
```

2. Update every former `Scene` call site to `Shot`.

3. Remove per-shot backdrop nodes (`<div className="ch-backdrop ch-anim ch-fade" ... />`) — backdrop lives once on the theatre stage.

4. Add:

```tsx
export function Theatre({ shots }: { shots: string[] }) {
  return (
    <section className="ch-theatre" data-scene="act-one" aria-hidden="true" style={{ ["--shot-count" as string]: shots.length }}>
      <div className="ch-stage">
        <div className="ch-backdrop" />
        {shots.map((id) => {
          const Comp = SCENES[id];
          return Comp ? <Comp key={id} /> : null;
        })}
      </div>
    </section>
  );
}
```

5. Keep `SCENES` map; temporarily keep `milvian` key exporting the old component **or** rename to `milan` now with old Milvian art as a stub — prefer renaming the key to `milan` immediately and leaving art swap for Task 6 (caption can already say legalization in Task 5). For this task, rename `MilvianScene` → `MilanScene`, registry key `milan`, leave chi-rho art until Task 6 so Act renders without a missing shot.

- [ ] **Step 2: Wire `ChurchHistoryPage`**

```tsx
import { SCENES, SceneDefs, Theatre } from "../components/history/scenes";
import { mountChromeCover, mountTheatreScroll } from "../lib/scrollScene";

// in effect:
const el = cinematicRef.current;
if (!el) return;
const theatre = el.querySelector<HTMLElement>(".ch-theatre");
if (!theatre) return;
const stopScenes = mountTheatreScroll(theatre);
const stopCover = mountChromeCover(theatre);
return () => {
  stopScenes();
  stopCover();
};

// in JSX:
<div className="ch-cinematic" ref={cinematicRef}>
  <SceneDefs />
  <Theatre shots={ACT_ONE} />
</div>
```

Remove the old `ACT_ONE.map` of individual scenes.

- [ ] **Step 3: Typecheck / unit tests**

Run: `pnpm exec tsc --noEmit`  
Run: `pnpm exec vitest run tests/churchHistory.test.ts tests/scrollScene.test.ts`

Expected: PASS / clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/history/scenes.tsx src/pages/ChurchHistoryPage.tsx
git commit -m "refactor(history): render Act I as a single Theatre"
```

---

### Task 5: Timing + caption edits (Acts, Jerusalem, Decius, Diocletian, Nicaea)

**Files:**
- Modify: `src/components/history/scenes.tsx`

**Interfaces:**
- Consumes: existing `t()` timing helper, Apostolic Fathers scroll markup as template
- Produces: updated timings/copy/art for Acts linger, Jerusalem star hold, Decius fathers + copy, Great Persecution Diocletian line, Nicaea Arian subtext

- [ ] **Step 1: Acts book linger**

In `ActsBookScene` caption, keep chapter blips but allocate more of the local timeline to holds:

- Acts 2 (first chapter span): show from local `--p` ~0.06 and stay visible until ~0.22 before flipping onward (approx first ~16% of the shot ≈ “about a second” of scroll feel on a 170vh track).
- Compress middle chapter blips into ~0.22–0.72.
- Acts 28 (`ch-chapter-last`): start ~0.74, fade-up, remain through end (`dur` long enough that it does not blip out).

Concrete timing sketch (adjust if feel is short in browser Task 7):

```tsx
// chapters 2..27 blips: start 0.22s, dur 0.05s, stagger 0.018s (26 items ≈ 0.47s span → ends ~0.69)
// first chapter (Acts 2) override: longer visible hold before blip chain — render Acts 2 as its own fade-up hold:
<p className="ch-cap-ref ch-chapters">
  <span className="ch-anim ch-fade-up ch-chapter ch-chapter-first" style={t({ start: "0.06s", dur: "0.14s" })}>
    Acts 2
  </span>
  {CHAPTERS.filter((n) => n !== 2).map(... existing blips with start "0.22s" ...)}
  <span className="ch-anim ch-fade-up ch-chapter ch-chapter-last" style={t({ start: "0.74s", dur: "0.12s" })}>
    Acts 28
  </span>
</p>
```

Add CSS so `.ch-chapter-first` stays visible until blips start (e.g. pair with a delayed fade-out using `ch-blip` with long mid-hold, or leave first as fade-up and let absolute stacking hide it when later blips appear). Prefer giving Acts 2 a `ch-blip` with `dur: "0.18s"` and early start so it lingers, then the chain runs, then Acts 28 fade-up holds.

- [ ] **Step 2: Jerusalem star hold**

Stars currently pop ~0.18 and fall ~0.60. Delay falls:

- Keep pop around `0.14s–0.18s`.
- Move `ch-fall` starts to ~`0.72s` (was ~0.60s) so brightest frame holds ~12–15% of local timeline.
- Keep temple topple near caption (~0.78+).

- [ ] **Step 3: Decius shot — copy + father icons**

Replace whip/spear/cross/lion art with three scroll icons (copy Apostolic Fathers structure):

```ts
const DECIAN_FATHERS = [
  { x: 172, name: "Origen", note: "tortured, c. 250" },
  { x: 400, name: "Cyprian", note: "Carthage" },
  { x: 628, name: "Fabian", note: "martyred, 250" }
];
```

Caption:

```tsx
<p className="ch-cap-ref ...">Sacrifice to idols, or die</p>
<p className="ch-cap-date ...">AD 250</p>
<p className="ch-cap-count ...">
  <span>Under Decius</span>
  <span>the first empire-wide persecution</span>
</p>
```

- [ ] **Step 4: Great Persecution + Nicaea captions**

Great Persecution — add after date:

```tsx
<p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.86s", dur: "0.12s" })}>
  <span>Under Emperor Diocletian</span>
</p>
```

Nicaea — add subtext under date:

```tsx
<p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.9s", dur: "0.1s" })}>
  <span>The Arian Heresy is struck down at the Council of Nicaea.</span>
</p>
```

Keep existing “Of one substance” / AD 325 title lines.

- [ ] **Step 5: Commit**

```bash
git add src/components/history/scenes.tsx src/styles.css
git commit -m "feat(history): Acts holds, Decius fathers, Nicaea and Diocletian copy"
```

---

### Task 6: Nero + Milan Caesar stick figures (shared vocabulary)

**Files:**
- Modify: `src/components/history/scenes.tsx`
- Modify: `src/styles.css` (only if new stroke classes needed for horns/halo/crosses)

**Interfaces:**
- Consumes: `Shot` wrapper, shared line-art classes (`.ch-figure`, `.ch-mark`)
- Produces: `CaesarFigure({ mode: "nero" | "constantine" })` used by Nero and Milan shots; Nero caption/art per spec; Milan replaces chi-rho with halo Caesar + legalization caption

- [ ] **Step 1: Add shared `CaesarFigure`**

SVG group centered near `(400, 200)`, stick Caesar with olive/laurel wreath:

```tsx
function CaesarFigure({ mode }: { mode: "nero" | "constantine" }) {
  // body: circle head, line torso/arms/legs — match .ch-figure stroke language
  // olive branch in raised right hand
  // nero: horns grow via ch-rise / ch-fade-up after branch appears; left hand wave triggers crosses
  // constantine: halo ring grows via ch-pop / ch-fade after figure lands
  return (/* ... */);
}
```

Nero occupied crosses: 4–6 crosses across the lower field, each a vertical + horizontal mark with a small stick figure on it; `ch-rise` or `ch-fade-up` staggered after the hand wave (`start` ~0.45+).

Nero caption:

```tsx
<p className="ch-cap-ref ...">Rome Under Nero</p>
<p className="ch-cap-date ...">AD 64</p>
<p className="ch-cap-count ..."><span>the church grows under persecution</span></p>
```

Remove city/fire/Peter-Paul marks from Nero.

- [ ] **Step 2: Milan scene**

Replace chi-rho / shields with:

```tsx
<CaesarFigure mode="constantine" />
```

Caption:

```tsx
<p className="ch-cap-ref ...">Constantine legalizes Christianity</p>
<p className="ch-cap-date ...">AD 313</p>
<p className="ch-cap-count ..."><span>Edict of Milan</span></p>
```

Ensure registry: `milan: MilanScene` (no `milvian` key).

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/history/scenes.tsx src/styles.css
git commit -m "feat(history): Nero and Constantine mirrored Caesar shots"
```

---

### Task 7: Browser verification

**Files:**
- None required unless bugs found (fix in place)

**Interfaces:**
- Consumes: running Vite preview or `pnpm dev`
- Produces: confirmed behavior against success criteria; fix commits if needed

- [ ] **Step 1: Start the app**

Run: `pnpm dev` (or `pnpm build && pnpm preview`)

Open `/church-history/`.

- [ ] **Step 2: Exercise the theatre end-to-end**

Desktop (~1280×900):

1. Scroll into Act I — black expands under header + rail; no content-column-only letterbox.
2. Confirm fade-in only at start (no black flash between shots).
3. Move pointer into top bar / left rail hit zones — chrome pops back; leave — covered again.
4. Acts: visible hold on Acts 2, then chapters, hold on Acts 28.
5. Nero: Caesar, horns, occupied crosses, caption copy.
6. Jerusalem: stars bright, brief hold, then fall; temple still falls.
7. Decius: three father scrolls + “Sacrifice to idols, or die” / Under Decius.
8. Great Persecution: Under Emperor Diocletian.
9. Milan: halo Caesar + Constantine legalizes Christianity / AD 313.
10. Nicaea: Arian subtext present.
11. Fade-out only at end; timeline below still readable; skip link still works.

Mobile viewport (~390×844):

1. Full-bleed black; top-edge peek reveals header; no left rail expectation.
2. Spot-check 2–3 shots for layout (caption not clipped).

- [ ] **Step 3: Regression pass**

Visit `/` and `/give` briefly — ensure `ch-dark` / hit zones are not leaking after leaving history.

- [ ] **Step 4: Run automated suite**

Run: `pnpm exec vitest run tests/churchHistory.test.ts tests/scrollScene.test.ts`  
Run: `pnpm exec tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit any verification fixes**

```bash
git add -A
git commit -m "fix(history): theatre peek, timing, and layout from browser pass"
```

(Only if fixes were needed; otherwise skip empty commit.)

---

## Self-review (plan vs spec)

| Spec requirement | Task |
| --- | --- |
| Single continuous black theatre | 3, 4 |
| Fade in first / fade out last only | 3 (backdrop opacity), 4 |
| Cover header + sidebar | 3, 2 |
| Edge hover peek only while hovering | 2, 3 |
| Mobile top-edge only | 2 (rail width 0), 3 |
| Reduced motion static, no blackout | 2 no-op, 3 media query |
| Acts 2 / 28 linger | 5 |
| Nero Caesar + horns + occupied crosses + copy | 6 |
| Jerusalem star hold | 5 |
| Decius copy + Origen/Cyprian/Fabian | 5 |
| Diocletian line | 5 |
| Milan legalization shot (not Milvian cinematic) | 1, 4, 6 |
| Nicaea Arian subtext | 5 |
| Timeline SEO unchanged / aria-hidden | 1, 4 |
| Skip link preserved | 4 (unchanged markup above theatre) |

No TBD/placeholder steps remain. Progress helper names are consistent (`shotLocalProgress`, `mountTheatreScroll`, `mountChromeCover`). Scene id `milan` is consistent across data, registry, and tests.
