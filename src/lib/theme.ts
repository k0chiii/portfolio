export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "portfolio-theme";

export const THEME_META_COLORS: Record<ThemeMode, string> = {
  light: "#f5f2eb",
  dark: "#100f0e",
};

export function resolveInitialTheme(
  saved: string | null | undefined,
  prefersDark: boolean,
): ThemeMode {
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  return prefersDark ? "dark" : "light";
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  let saved: string | null = null;
  try {
    saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    saved = null;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return resolveInitialTheme(saved, prefersDark);
}

export function applyThemeToDocument(theme: ThemeMode, persist = true): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", THEME_META_COLORS[theme]);
    }
  }

  if (persist && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors in restricted browsing contexts.
    }
  }
}
