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
    <div id="top" className="page">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <section className="hero-field" aria-labelledby="hero-heading">
        <MeshBackground theme={theme} reducedMotion={effectiveReducedMotion} />

        <header className="site-header">
          <div className="container header-inner">
            <a className="brand-mark" href="#top">
              <span>{PORTFOLIO_CONTENT.name}</span>
              <span className="brand-place">{PORTFOLIO_CONTENT.place}</span>
            </a>

            <nav className="site-nav" aria-label="Primary">
              {PORTFOLIO_CONTENT.entries.length > 0 && <a href="#index">Index</a>}
              <a href="#links">Links</a>
            </nav>
          </div>
        </header>

        <div className="container hero-body">
          <div className="hero-grid">
            <div className="hero-spacer" aria-hidden="true" />
            <h1 id="hero-heading" className="hero-title">
              {PORTFOLIO_CONTENT.name}
            </h1>
          </div>
        </div>

        <div className="field-bar">
          <div className="articulation-rule" aria-hidden="true" />
          <div className="container field-bar-inner">
            <span className="field-domain">{PORTFOLIO_CONTENT.domain}</span>

            <div className="field-controls">
              <button
                type="button"
                className="text-control"
                onClick={handleToggleMotion}
                aria-pressed={effectiveReducedMotion}
              >
                {effectiveReducedMotion ? "Play" : "Pause"}
              </button>

              <button
                type="button"
                className="text-control"
                onClick={handleToggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <main id="main" className="content-area">
        {PORTFOLIO_CONTENT.entries.length > 0 && (
          <section id="index" className="section-block" aria-labelledby="index-heading">
            <div className="container section-grid">
              <h2 id="index-heading" className="section-label">
                Index
              </h2>

              <ul className="row-list attention-group">
                {PORTFOLIO_CONTENT.entries.map((entry) => (
                  <li key={entry.href}>
                    <a
                      className="index-row attention-item"
                      href={entry.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="row-year">{entry.year}</span>
                      <span className="row-title">{entry.title}</span>
                      {entry.note && <span className="row-note">{entry.note}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section id="links" className="section-block" aria-labelledby="links-heading">
          <div className="container section-grid">
            <h2 id="links-heading" className="section-label">
              Links
            </h2>

            <ul className="row-list attention-group">
              {PORTFOLIO_CONTENT.links.map((link) => (
                <li key={link.label}>
                  <a
                    className="link-row attention-item"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="row-title">{link.label}</span>
                    <span className="row-value">{link.value}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>{PORTFOLIO_CONTENT.domain}</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
