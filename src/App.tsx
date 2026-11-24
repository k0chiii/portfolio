import { useCallback, useEffect, useState } from "react";

import { MeshBackground } from "./components/MeshBackground";
import { PORTFOLIO_CONTENT } from "./content/portfolio";
import { applyThemeToDocument, getStoredTheme, type ThemeMode } from "./lib/theme";

function getSystemReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const [systemReducedMotion, setSystemReducedMotion] = useState<boolean>(() =>
    getSystemReducedMotion(),
  );
  const [userMotionPaused, setUserMotionPaused] = useState<boolean>(false);

  const effectiveReducedMotion = systemReducedMotion || userMotionPaused;

  useEffect(() => {
    applyThemeToDocument(theme, false);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemReducedMotion(event.matches);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      applyThemeToDocument(next, true);
      return next;
    });
  }, []);

  const handleToggleMotion = useCallback(() => {
    setUserMotionPaused((prev) => !prev);
  }, []);

  return (
    <div className="sheet">
      <header className="sheet-top">
        <h1 className="sheet-name">{PORTFOLIO_CONTENT.name}</h1>

        <nav className="sheet-actions" aria-label="Links and display">
          {PORTFOLIO_CONTENT.links.map((link) => (
            <a
              key={link.label}
              className="text-action"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}

          <button
            type="button"
            className="text-action"
            onClick={handleToggleMotion}
            aria-pressed={effectiveReducedMotion}
          >
            {effectiveReducedMotion ? "Play" : "Pause"}
          </button>

          <button type="button" className="text-action" onClick={handleToggleTheme}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </nav>
      </header>

      <main className="sheet-main">
        <figure className="plate" aria-label="Interactive neon orange and yellow mesh gradient">
          <MeshBackground theme={theme} reducedMotion={effectiveReducedMotion} />
        </figure>

        {PORTFOLIO_CONTENT.entries.length > 0 && (
          <section className="bibliography" aria-label="Index">
            <ul className="bibliography-list">
              {PORTFOLIO_CONTENT.entries.map((entry) => (
                <li key={entry.href}>
                  <a
                    className="bibliography-row"
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="bibliography-year">{entry.year}</span>
                    <span className="bibliography-title">{entry.title}</span>
                    {entry.note && <span className="bibliography-note">{entry.note}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="sheet-bottom">
        <span>{PORTFOLIO_CONTENT.domain}</span>
        <span>{PORTFOLIO_CONTENT.place}</span>
      </footer>
    </div>
  );
}
