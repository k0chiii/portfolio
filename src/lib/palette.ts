import type { ThemeMode } from "./theme";

export type RgbTuple = readonly [number, number, number];

export interface MeshPalette {
  readonly label: string;
  readonly base: string;
  readonly colors: readonly [string, string, string, string, string];
  readonly grainStrength: number;
}

/**
 * Neon-orange & sunlit-yellow palettes balanced with calm paper / obsidian grounds.
 * Color order: [ground, neon orange, golden yellow, warm solar highlight, cool counterweight]
 */
export const MESH_PALETTES: Record<ThemeMode, MeshPalette> = {
  light: {
    label: "Solar & Paper",
    base: "#f7f4ee",
    colors: [
      "#f6f2ea", // Warm Paper Ground
      "#ff5e0e", // Neon Orange
      "#ffb627", // Sunlit Amber Yellow
      "#ffe066", // Luminous Lemon Highlight
      "#d4d8d6", // Cool Architectural Slate
    ],
    grainStrength: 0.028,
  },
  dark: {
    label: "Ember & Gold",
    base: "#121110",
    colors: [
      "#121110", // Obsidian Ground
      "#ff5500", // Neon Orange Core
      "#ffb31f", // Molten Golden Yellow
      "#d96e08", // Warm Amber Glow
      "#1e2228", // Cool Charcoal Counterweight
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
