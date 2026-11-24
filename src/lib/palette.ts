import type { ThemeMode } from "./theme";

export type RgbTuple = readonly [number, number, number];

export interface MeshPalette {
  readonly base: string;
  readonly colors: readonly [string, string, string, string, string];
  readonly grainStrength: number;
}

/**
 * Pure neon-orange & golden-yellow palettes framed by quiet paper / obsidian.
 * Simultaneous contrast shifts perception of the same hue family across themes.
 */
export const MESH_PALETTES: Record<ThemeMode, MeshPalette> = {
  light: {
    base: "#f5f2eb",
    colors: [
      "#f7efe2", // Warm Paper Highlight
      "#ff5208", // Neon Orange
      "#ffba1a", // Golden Amber Yellow
      "#ffe66b", // Sunlit Citrus Yellow
      "#de3700", // Deep Vermilion Accent
    ],
    grainStrength: 0.032,
  },
  dark: {
    base: "#100f0e",
    colors: [
      "#131110", // Obsidian Ground
      "#ff4d00", // Neon Orange Core
      "#ffb41a", // Molten Gold Yellow
      "#ffe066", // Incandescent Yellow Crest
      "#6b1c04", // Deep Ember Shadow
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
