import { useCallback, useEffect, useRef, useState } from "react";

import { Header } from "./components/Header";
import { ArrowUpRightIcon, MoonIcon, PauseIcon, PlayIcon, SunIcon } from "./components/Icons";
import { MeshBackground } from "./components/MeshBackground";
import { WorkModal } from "./components/WorkModal";
import { PORTFOLIO_CONTENT, type WorkItem } from "./content/portfolio";
import { MESH_PALETTES } from "./lib/palette";
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
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);

  const modalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const effectiveReducedMotion = systemReducedMotion || userMotionPaused;
  const paletteLabel = MESH_PALETTES[theme].label;
  const workCount = String(PORTFOLIO_CONTENT.works.length).padStart(2, "0");

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

  const handleSelectWork = useCallback((work: WorkItem, trigger: HTMLButtonElement) => {
    modalTriggerRef.current = trigger;
    setSelectedWork(work);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedWork(null);
    window.requestAnimationFrame(() => {
      modalTriggerRef.current?.focus();
    });
  }, []);

  return (
    <div id="top" className="page">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <section className="hero-field" aria-labelledby="hero-heading">
        <MeshBackground theme={theme} reducedMotion={effectiveReducedMotion} />

        <Header brand={PORTFOLIO_CONTENT.brand} />

        <div className="container hero-body">
          <div className="hero-copy">
            <h1 id="hero-heading" className="hero-title">
              {PORTFOLIO_CONTENT.headline}
            </h1>
            <p className="hero-sub">{PORTFOLIO_CONTENT.subhead}</p>

            <div className="hero-actions">
              <a className="button-primary" href="#work">
                View work
              </a>
              <a
                className="link-secondary"
                href={PORTFOLIO_CONTENT.links[0]?.href ?? "#links"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>GitHub</span>
                <ArrowUpRightIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="field-caption-bar">
          <div className="container field-caption-inner">
            <div className="field-plate">
              <span className="field-swatch" aria-hidden="true" />
              <span className="mono-figure">Field 01</span>
              <span className="meta-dot" aria-hidden="true">
                /
              </span>
              <span>{paletteLabel}</span>
            </div>

            <div className="field-controls">
              <button
                type="button"
                className="control-button"
                onClick={handleToggleMotion}
                aria-pressed={effectiveReducedMotion}
              >
                {effectiveReducedMotion ? <PlayIcon /> : <PauseIcon />}
                <span>{effectiveReducedMotion ? "Still" : "Motion"}</span>
              </button>

              <button
                type="button"
                className="control-button"
                onClick={handleToggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                <span>{theme === "dark" ? "Light" : "Dark"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <main id="main" className="content-area">
        <section id="work" className="catalogue-section" aria-labelledby="work-heading">
          <div className="container section-grid">
            <div className="section-rail">
              <h2 id="work-heading" className="section-label">
                Work
              </h2>
              <span className="section-count mono-figure">{workCount}</span>
            </div>

            <div className="section-body">
              {PORTFOLIO_CONTENT.works.length > 0 ? (
                <ul className="catalogue-list">
                  {PORTFOLIO_CONTENT.works.map((work) => (
                    <li key={work.id} className="catalogue-item">
                      <button
                        type="button"
                        className="catalogue-row"
                        onClick={(event) => handleSelectWork(work, event.currentTarget)}
                      >
                        <span className="row-year mono-figure">{work.year}</span>
                        <span className="row-main">
                          <span className="row-title">{work.title}</span>
                          <span className="row-summary">{work.summary}</span>
                        </span>
                        <span className="row-category">{work.category}</span>
                        <span className="row-icon">
                          <ArrowUpRightIcon />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-note">
                  Entries will be added in <code>src/content/portfolio.ts</code>.
                </p>
              )}

              <p className="section-footnote">
                More projects will be listed here as they are published.
              </p>
            </div>
          </div>
        </section>

        <section id="about" className="catalogue-section" aria-labelledby="about-heading">
          <div className="container section-grid">
            <div className="section-rail">
              <h2 id="about-heading" className="section-label">
                About
              </h2>
            </div>

            <div className="section-body">
              <div className="prose">
                {PORTFOLIO_CONTENT.aboutParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <ul className="discipline-list" aria-label="Focus areas">
                {PORTFOLIO_CONTENT.disciplines.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="links" className="catalogue-section" aria-labelledby="links-heading">
          <div className="container section-grid">
            <div className="section-rail">
              <h2 id="links-heading" className="section-label">
                Links
              </h2>
            </div>

            <div className="section-body">
              <ul className="links-table">
                {PORTFOLIO_CONTENT.links.map((link) => (
                  <li key={link.label}>
                    <a
                      className="link-row"
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="link-label">{link.label}</span>
                      <span className="link-value mono-figure">{link.value}</span>
                      <span className="row-icon">
                        <ArrowUpRightIcon />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>{PORTFOLIO_CONTENT.domain}</span>
          <span className="mono-figure">© {new Date().getFullYear()}</span>
        </div>
      </footer>

      <WorkModal work={selectedWork} onClose={handleCloseModal} />
    </div>
  );
}
