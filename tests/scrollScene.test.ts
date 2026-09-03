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
