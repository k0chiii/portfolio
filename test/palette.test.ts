import { describe, expect, it } from "vitest";

import { MESH_PALETTES, dampFactor, dampScalar, hexToRgbNormalized } from "../src/lib/palette";

describe("palette utilities", () => {
  it("converts 6-digit hex colors to normalized RGB tuples", () => {
    expect(hexToRgbNormalized("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgbNormalized("#ffffff")).toEqual([1, 1, 1]);

    const [r, g, b] = hexToRgbNormalized("#f7f4ee");
    expect(r).toBeCloseTo(247 / 255, 5);
    expect(g).toBeCloseTo(244 / 255, 5);
    expect(b).toBeCloseTo(238 / 255, 5);
  });

  it("throws on malformed hex input", () => {
    expect(() => hexToRgbNormalized("#fff")).toThrow("Invalid hex color");
    expect(() => hexToRgbNormalized("not-a-color")).toThrow("Invalid hex color");
  });

  it("defines valid 5-color palettes with labels for both light and dark modes", () => {
    for (const mode of ["light", "dark"] as const) {
      const palette = MESH_PALETTES[mode];
      expect(palette.label.length).toBeGreaterThan(0);
      expect(palette.colors).toHaveLength(5);
      for (const hex of palette.colors) {
        const rgb = hexToRgbNormalized(hex);
        expect(rgb).toHaveLength(3);
      }
      expect(palette.grainStrength).toBeGreaterThan(0);
      expect(palette.grainStrength).toBeLessThan(0.1);
    }
  });

  it("computes smooth exponential damping factors", () => {
    expect(dampFactor(4, 0)).toBe(0);
    expect(dampFactor(0, 0.016)).toBe(0);

    const mid = dampScalar(0, 1, 4, 0.25);
    expect(mid).toBeGreaterThan(0.5);
    expect(mid).toBeLessThan(0.7);
  });
});
