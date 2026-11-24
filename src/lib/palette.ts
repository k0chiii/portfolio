import type { ThemeMode } from "./theme";

export type RgbTuple = readonly [number, number, number];

export interface MeshPalette {
  readonly base: string;
  readonly colors: readonly [string, string, string, string, string];
  readonly grainStrength: number;
}

/**
 * Neutral, art-directed muted palettes inspired by mineral pigments & fine paper.
 * Light: "Paper & Mist" / Dark: "Obsidian & Velvet"
 */
export const MESH_PALETTES: Record<ThemeMode, MeshPalette> = {
  light: {
    base: "#f3f0ea",
    colors: [
      "#f4f0e8", // Warm Ivory Paper
      "#d7c6b6", // Muted Clay Sand
      "#b7c6c9", // Dusty Slate Mist
      "#d0bab5", // Faded Terracotta Rose
      "#c3cbbd", // Soft Sage Ash
    ],
    grainStrength: 0.028,
  },
  dark: {
    base: "#111214",
    colors: [
      "#121317", // Obsidian Ground
      "#232b38", // Deep Indigo Slate
      "#33272c", // Muted Plum Umber
      "#1d2e2d", // Deep Pine Fog
      "#3f332c", // Smoked Bronze
    ],
    grainStrength: 0.038,
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
