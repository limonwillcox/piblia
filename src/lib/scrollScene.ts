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
