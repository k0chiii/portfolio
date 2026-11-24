import type { ThemeMode } from "./theme";

export type RgbTuple = readonly [number, number, number];

export interface MeshPalette {
  readonly label: string;
  readonly base: string;
  readonly colors: readonly [string, string, string, string, string];
  readonly grainStrength: number;
}

/**
 * Neutral mineral palettes paired with warm paper & ink surfaces.
 */
export const MESH_PALETTES: Record<ThemeMode, MeshPalette> = {
  light: {
    label: "Paper & Mist",
    base: "#f7f4ee",
    colors: [
      "#f5f1e9", // Warm Paper
      "#d5bfa9", // Raw Clay
      "#b2c3c6", // Slate Mist
      "#ccaead", // Faded Rose Ochre
      "#c0cab9", // Mineral Sage
    ],
    grainStrength: 0.026,
  },
  dark: {
    label: "Obsidian & Velvet",
    base: "#141312",
    colors: [
      "#151413", // Warm Obsidian
      "#273140", // Deep Slate
      "#39282b", // Smoked Plum
      "#1e302e", // Pine Shadow
      "#47372c", // Umber Bronze
    ],
    grainStrength: 0.036,
  },
};

export function hexToRgbNormalized(hex: string): RgbTuple {
  const cleaned = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const value = Number.parseInt(cleaned, 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export function dampFactor(lambda: number, deltaSeconds: number): number {
  if (deltaSeconds <= 0 || lambda <= 0) {
    return 0;
  }
  return 1 - Math.exp(-lambda * deltaSeconds);
}

export function dampScalar(
  current: number,
  target: number,
  lambda: number,
  deltaSeconds: number,
): number {
  const factor = dampFactor(lambda, deltaSeconds);
  return current + (target - current) * factor;
}
