import { useCallback, useEffect, useRef, useState } from "react";

import { Header } from "./components/Header";
import { ArrowUpRightIcon, MoonIcon, PauseIcon, PlayIcon, SunIcon } from "./components/Icons";
import { MeshBackground } from "./components/MeshBackground";
import { WorkModal } from "./components/WorkModal";
import { PORTFOLIO_CONTENT, type WorkItem } from "./content/portfolio";
import { MESH_PALETTES } from "./lib/palette";
import { applyThemeToDocument, getStoredTheme, type ThemeMode } from "./lib/theme";
import type { FieldSample } from "./webgl/meshEngine";

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
  const sampleReadoutRef = useRef<HTMLSpanElement | null>(null);

  const effectiveReducedMotion = systemReducedMotion || userMotionPaused;
  const paletteLabel = MESH_PALETTES[theme].label;

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

  const handleSample = useCallback((sample: FieldSample) => {
    const el = sampleReadoutRef.current;
    if (!el) return;
    el.textContent = `x ${sample.x.toFixed(2)}  y ${sample.y.toFixed(2)}  φ ${sample.phi.toFixed(2)}`;
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
        <MeshBackground
          theme={theme}
          reducedMotion={effectiveReducedMotion}
          onSample={handleSample}
        />

        <Header brand={PORTFOLIO_CONTENT.brand} location={PORTFOLIO_CONTENT.location} />

        <div className="container hero-body">
          <div className="hero-grid">
            <span className="hero-proposition mono-figure" aria-hidden="true">
              0
            </span>

            <div className="hero-copy">
              <h1 id="hero-heading" className="hero-title">
                {PORTFOLIO_CONTENT.brand}
              </h1>
              <p className="hero-sub">{PORTFOLIO_CONTENT.note}</p>
            </div>
          </div>
        </div>

        <div className="field-caption-bar">
          <div className="articulation-rule" aria-hidden="true" />
          <div className="container field-caption-inner">
            <div className="field-plate">
              <span className="field-swatch" aria-hidden="true" />
              <span className="mono-figure">0.1</span>
              <span className="meta-dot" aria-hidden="true">
                /
              </span>
              <span>{paletteLabel}</span>
              <span className="meta-dot readout-sep" aria-hidden="true">
                —
              </span>
              <span ref={sampleReadoutRef} className="field-readout mono-figure">
                x 0.72 y 0.48 φ 0.64
              </span>
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
        <section id="index" className="catalogue-section" aria-labelledby="index-heading">
          <div className="container section-grid">
            <div className="section-rail">
              <span className="section-num mono-figure">1</span>
              <h2 id="index-heading" className="section-label">
                Index
              </h2>
            </div>

            <div className="section-body">
              {PORTFOLIO_CONTENT.works.length > 0 ? (
                <ul className="catalogue-list attention-group">
                  {PORTFOLIO_CONTENT.works.map((work) => (
                    <li key={work.id} className="catalogue-item">
                      <button
                        type="button"
                        className="catalogue-row attention-item"
                        onClick={(event) => handleSelectWork(work, event.currentTarget)}
                      >
                        <span className="row-prop mono-figure">{work.proposition}</span>
                        <span className="row-main">
                          <span className="row-title">{work.title}</span>
                          <span className="row-summary">{work.summary}</span>
                        </span>
                        <span className="row-meta">
                          <span className="row-category">{work.category}</span>
                          <span className="row-year mono-figure">{work.year}</span>
                        </span>
                        <span className="row-icon">
                          <ArrowUpRightIcon />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-note">
                  Entries live in <code>src/content/portfolio.ts</code>.
                </p>
              )}
            </div>
          </div>
        </section>

        <section id="links" className="catalogue-section" aria-labelledby="links-heading">
          <div className="container section-grid">
            <div className="section-rail">
              <span className="section-num mono-figure">2</span>
              <h2 id="links-heading" className="section-label">
                Elsewhere
              </h2>
            </div>

            <div className="section-body">
              <ul className="links-table attention-group">
                {PORTFOLIO_CONTENT.links.map((link) => (
                  <li key={link.label}>
                    <a
                      className="link-row attention-item"
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="row-prop mono-figure">{link.proposition}</span>
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
