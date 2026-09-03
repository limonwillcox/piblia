import { describe, expect, it } from "vitest";
import { shotIsActive, shotLocalProgress, visibleViewportRatio } from "../src/lib/scrollScene";

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

describe("shotIsActive", () => {
  it("activates the first shot at G=0", () => {
    expect(shotIsActive(0, 0, 9)).toBe(true);
    expect(shotIsActive(0, 1, 9)).toBe(false);
  });

  it("uses a half-open interval except the last shot", () => {
    expect(shotIsActive(1 / 9, 0, 9)).toBe(false);
    expect(shotIsActive(1 / 9, 1, 9)).toBe(true);
  });

  it("keeps the last shot active through G=1", () => {
    expect(shotIsActive(1, 8, 9)).toBe(true);
    expect(shotIsActive(1, 7, 9)).toBe(false);
  });

  it("guards empty counts", () => {
    expect(shotIsActive(0.5, 0, 0)).toBe(false);
  });
});

describe("visibleViewportRatio", () => {
  it("is 0 when the rect is fully off-screen", () => {
    expect(visibleViewportRatio({ top: 800, bottom: 2000 }, 700)).toBe(0);
    expect(visibleViewportRatio({ top: -2000, bottom: -10 }, 700)).toBe(0);
  });

  it("is viewport-relative, not target-relative, for a tall theatre", () => {
    const vh = 1000;
    const height = 9 * 1.7 * vh; // Task 3: ~9 * 170vh
    const filling = { top: 0, bottom: height };
    expect(vh / height).toBeLessThan(0.15);
    expect(visibleViewportRatio(filling, vh)).toBe(1);
  });

  it("crosses 0.15 when that much of the viewport is covered", () => {
    expect(visibleViewportRatio({ top: 850, bottom: 16350 }, 1000)).toBeCloseTo(0.15, 5);
    expect(visibleViewportRatio({ top: 849, bottom: 16350 }, 1000)).toBeGreaterThan(0.15);
  });

  it("guards empty viewports", () => {
    expect(visibleViewportRatio({ top: 0, bottom: 100 }, 0)).toBe(0);
  });
});
