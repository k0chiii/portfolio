import type { ThemeMode } from "./theme";

export type RgbTuple = readonly [number, number, number];

export interface MeshPalette {
  readonly label: string;
  readonly base: string;
  readonly colors: readonly [string, string, string, string, string];
  readonly grainStrength: number;
}

/**
 * Neon-orange driven palettes balanced with calm paper / obsidian grounds.
 * Color order: [ground, primary neon orange, hot ember/tangerine, warm wash, cool counterweight]
 */
export const MESH_PALETTES: Record<ThemeMode, MeshPalette> = {
  light: {
    label: "Vermilion & Paper",
    base: "#f7f4ee",
    colors: [
      "#f6f2ea", // Warm Paper Ground
      "#ff4f14", // Neon International Orange
      "#ff8238", // Bright Tangerine Glow
      "#f0c8ad", // Soft Apricot Wash
      "#cfd4d6", // Cool Architectural Slate
    ],
    grainStrength: 0.03,
  },
  dark: {
    label: "Ember & Obsidian",
    base: "#121110",
    colors: [
      "#121110", // Obsidian Ground
      "#ff4d00", // Neon Orange Core
      "#ff7b24", // Hot Amber Edge
      "#6e1d08", // Deep Vermilion Shadow
      "#1d2229", // Cool Charcoal Counterweight
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
