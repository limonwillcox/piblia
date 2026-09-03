/**
 * Scroll-driven scenes for /church-history.
 *
 * Each scene is a tall track containing a sticky stage. This sets `--p` on the
 * track, running 0 → 1 across the span the stage stays pinned; every shot is
 * then authored purely in CSS as a paused @keyframes animation scrubbed by
 * `animation-delay: calc(... - var(--p) * 1s)`.
 *
 * The stylesheet defaults `--p: 1` — the finished frame — so a scene renders as
 * a static poster when this never runs. That single default covers both
 * `prefers-reduced-motion` and JavaScript being off or slow to boot; there is no
 * second code path to keep in sync.
 *
 * Mirrors applyFont() in ./prefs.ts, which drives --read-size the same way.
 */

const SCENE_SELECTOR = "[data-scene]";

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function shotLocalProgress(globalP: number, index: number, count: number): number {
  if (count <= 0) return 0;
  const span = 1 / count;
  const start = index * span;
  if (span <= 0) return 0;
  return clamp01((globalP - start) / span);
}

/**
 * Drive every `[data-scene]` under `root`. Returns a teardown that restores the
 * stylesheet default. Does nothing when reduced motion is requested.
 */
export function mountScrollScenes(root: ParentNode): () => void {
  if (typeof window === "undefined" || prefersReducedMotion()) return () => {};
  const scenes = Array.from(root.querySelectorAll<HTMLElement>(SCENE_SELECTOR));
  if (!scenes.length) return () => {};

  const onScreen = new Set<HTMLElement>();
  let frame = 0;

  function paint() {
    frame = 0;
    const vh = window.innerHeight;
    for (const el of onScreen) {
      const rect = el.getBoundingClientRect();
      // The stage is pinned for (track height - viewport height) of scrolling.
      const span = rect.height - vh;
      const p = span > 0 ? clamp01(-rect.top / span) : rect.top <= 0 ? 1 : 0;
      el.style.setProperty("--p", p.toFixed(4));
    }
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(paint);
  }

  // Only the scenes actually on screen cost anything per frame.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) onScreen.add(el);
        else {
          onScreen.delete(el);
          // Leave the track resting at whichever end it exited through.
          el.style.setProperty("--p", entry.boundingClientRect.top < 0 ? "1" : "0");
        }
      }
      schedule();
    },
    { threshold: 0 }
  );
  for (const el of scenes) io.observe(el);

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  schedule();

  return () => {
    io.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    if (frame) window.cancelAnimationFrame(frame);
    for (const el of scenes) el.style.removeProperty("--p");
  };
}

/**
 * Drive one Act theatre: global `--p` on `theatre`, local `--p` and
 * `data-active` on each `[data-shot]`. No-op when reduced motion.
 */
export function mountTheatreScroll(theatre: HTMLElement): () => void {
  if (typeof window === "undefined" || prefersReducedMotion()) return () => {};
  const shots = Array.from(theatre.querySelectorAll<HTMLElement>("[data-shot]"));

  const onScreen = new Set<HTMLElement>();
  let frame = 0;

  function apply(globalP: number) {
    theatre.style.setProperty("--p", globalP.toFixed(4));
    const n = shots.length;
    for (let i = 0; i < n; i++) {
      const shot = shots[i];
      shot.style.setProperty("--p", shotLocalProgress(globalP, i, n).toFixed(4));
      const start = i / n;
      const end = (i + 1) / n;
      // Last shot stays active through G=1; earlier shots use [start, end).
      const active = i === n - 1 ? globalP >= start && globalP <= 1 : globalP >= start && globalP < end;
      shot.dataset.active = active ? "1" : "0";
    }
  }

  function paint() {
    frame = 0;
    if (!onScreen.has(theatre)) return;
    const vh = window.innerHeight;
    const rect = theatre.getBoundingClientRect();
    const span = rect.height - vh;
    const globalP = span > 0 ? clamp01(-rect.top / span) : rect.top <= 0 ? 1 : 0;
    apply(globalP);
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(paint);
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) onScreen.add(el);
        else {
          onScreen.delete(el);
          apply(entry.boundingClientRect.top < 0 ? 1 : 0);
        }
      }
      schedule();
    },
    { threshold: 0 }
  );
  io.observe(theatre);

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  schedule();

  return () => {
    io.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    if (frame) window.cancelAnimationFrame(frame);
    theatre.style.removeProperty("--p");
    for (const shot of shots) {
      shot.style.removeProperty("--p");
      delete shot.dataset.active;
    }
  };
}

/**
 * Darken the site chrome while `el` holds the viewport, the way GivePage dims it
 * for the donation hero — but including `.rail`, which that selector omits.
 */
export function mountChromeBlackout(el: HTMLElement, className: string): () => void {
  if (typeof window === "undefined" || prefersReducedMotion()) return () => {};
  const io = new IntersectionObserver(
    ([entry]) => {
      document.body.classList.toggle(className, entry.isIntersecting && entry.intersectionRatio > 0.25);
    },
    { threshold: [0, 0.25, 0.6, 1] }
  );
  io.observe(el);
  return () => {
    io.disconnect();
    document.body.classList.remove(className);
  };
}

/**
 * Cover site chrome while `theatre` holds the viewport. Top/left hit zones
 * toggle `body.ch-dark-peek` so header and rail can be used. No-op when
 * reduced motion.
 */
export function mountChromeCover(theatre: HTMLElement, className = "ch-dark"): () => void {
  if (typeof window === "undefined" || prefersReducedMotion()) return () => {};

  const zones: HTMLElement[] = [];
  let hover = 0;

  function onEnter() {
    hover++;
    document.body.classList.add("ch-dark-peek");
  }

  function onLeave() {
    hover = Math.max(0, hover - 1);
    if (!hover) document.body.classList.remove("ch-dark-peek");
  }

  function makeHit(kind: "top" | "left"): HTMLDivElement {
    const el = document.createElement("div");
    el.className = "ch-chrome-hit";
    el.setAttribute("aria-hidden", "true");
    el.style.position = "fixed";
    el.style.zIndex = "60";
    el.style.background = "transparent";
    el.style.pointerEvents = "auto";
    if (kind === "top") {
      el.style.top = "0";
      el.style.left = "0";
      el.style.right = "0";
      el.style.height = "var(--header, 58px)";
    } else {
      el.style.top = "0";
      el.style.left = "0";
      el.style.bottom = "0";
      el.style.width = "var(--rail, 56px)";
    }
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return el;
  }

  function insertZones() {
    if (zones.length) return;
    hover = 0;
    zones.push(makeHit("top"), makeHit("left"));
    for (const z of zones) document.body.appendChild(z);
  }

  function removeZones() {
    for (const z of zones) {
      z.removeEventListener("pointerenter", onEnter);
      z.removeEventListener("pointerleave", onLeave);
      z.remove();
    }
    zones.length = 0;
    hover = 0;
    document.body.classList.remove("ch-dark-peek");
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      const dark = entry.isIntersecting && entry.intersectionRatio > 0.15;
      document.body.classList.toggle(className, dark);
      if (dark) insertZones();
      else removeZones();
    },
    { threshold: [0, 0.15, 0.5, 1] }
  );
  io.observe(theatre);

  return () => {
    io.disconnect();
    removeZones();
    document.body.classList.remove(className, "ch-dark-peek");
  };
}
