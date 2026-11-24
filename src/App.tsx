import { useCallback, useEffect, useRef, useState } from "react";

import { Header } from "./components/Header";
import { MeshBackground } from "./components/MeshBackground";
import { WorkCard } from "./components/WorkCard";
import { WorkModal } from "./components/WorkModal";
import { PORTFOLIO_CONTENT, type WorkItem } from "./content/portfolio";
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
  const [copyState, setCopyState] = useState<"idle" | "copied" | "fallback">("idle");

  const modalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
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

  const handleCopyEmail = useCallback(async () => {
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }

    try {
      await navigator.clipboard.writeText(PORTFOLIO_CONTENT.email);
      setCopyState("copied");
    } catch {
      setCopyState("fallback");
    }

    copyTimerRef.current = window.setTimeout(() => {
      setCopyState("idle");
    }, 2200);
  }, []);

  return (
    <div id="top" className="page-shell">
      <a className="skip-link" href="#main">
        メインコンテンツへスキップ
      </a>

      <MeshBackground theme={theme} reducedMotion={effectiveReducedMotion} />

      <Header
        monogram={PORTFOLIO_CONTENT.monogram}
        theme={theme}
        motionPaused={effectiveReducedMotion}
        onToggleTheme={handleToggleTheme}
        onToggleMotion={handleToggleMotion}
      />

      <main id="main" className="page-main">
        <section className="hero-section" aria-labelledby="hero-heading">
          <div className="hero-eyebrow">
            <span className="status-dot" aria-hidden="true" />
            <span>{PORTFOLIO_CONTENT.availability}</span>
            <span className="eyebrow-sep" aria-hidden="true">
              /
            </span>
            <span>{PORTFOLIO_CONTENT.location}</span>
          </div>

          <h1 id="hero-heading" className="hero-title">
            {PORTFOLIO_CONTENT.heroLead}
          </h1>

          <p className="hero-sub">{PORTFOLIO_CONTENT.heroSub}</p>

          <div className="hero-meta-row">
            <div>
              <p className="meta-label">Name</p>
              <p className="meta-value">{PORTFOLIO_CONTENT.name}</p>
            </div>
            <div>
              <p className="meta-label">Focus</p>
              <p className="meta-value">{PORTFOLIO_CONTENT.role}</p>
            </div>
          </div>
        </section>

        <section id="works" className="content-section" aria-labelledby="works-heading">
          <div className="section-header">
            <p className="section-kicker">01 / Selected Works</p>
            <h2 id="works-heading" className="section-title">
              Works
            </h2>
          </div>

          {PORTFOLIO_CONTENT.works.length > 0 ? (
            <div className="works-grid">
              {PORTFOLIO_CONTENT.works.map((work) => (
                <WorkCard key={work.id} work={work} onSelect={handleSelectWork} />
              ))}
            </div>
          ) : (
            <div className="empty-surface">
              <p className="empty-title">Selected works are being curated.</p>
              <p className="empty-copy">
                <code>src/content/portfolio.ts</code> に作品を追加すると、ここに自動で並びます。
              </p>
            </div>
          )}
        </section>

        <section id="about" className="content-section" aria-labelledby="about-heading">
          <div className="section-header">
            <p className="section-kicker">02 / Profile</p>
            <h2 id="about-heading" className="section-title">
              {PORTFOLIO_CONTENT.aboutTitle}
            </h2>
          </div>

          <div className="about-grid">
            <div className="about-copy glass-panel">
              {PORTFOLIO_CONTENT.aboutParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="about-focus glass-panel">
              <p className="meta-label">Focus Areas</p>
              <ul className="focus-list">
                {PORTFOLIO_CONTENT.focusAreas.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="contact" className="content-section" aria-labelledby="contact-heading">
          <div className="section-header">
            <p className="section-kicker">03 / Connect</p>
            <h2 id="contact-heading" className="section-title">
              Contact &amp; Links
            </h2>
          </div>

          <div className="contact-panel glass-panel">
            <div className="contact-primary">
              <p className="meta-label">Direct</p>
              <div className="email-row">
                <a className="email-link" href={`mailto:${PORTFOLIO_CONTENT.email}`}>
                  {PORTFOLIO_CONTENT.email}
                </a>
                <button
                  type="button"
                  className="copy-button"
                  onClick={() => void handleCopyEmail()}
                >
                  {copyState === "copied"
                    ? "Copied ✓"
                    : copyState === "fallback"
                      ? "Use mailto"
                      : "Copy"}
                </button>
              </div>
            </div>

            <ul className="links-list">
              {PORTFOLIO_CONTENT.links.map((link) => (
                <li key={link.label}>
                  <a
                    className="external-link"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="external-label">{link.label}</span>
                    <span className="external-handle">{link.handle} ↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>
          © {new Date().getFullYear()} {PORTFOLIO_CONTENT.name}
        </span>
        <span>Built with Vite+ &amp; Cloudflare Workers</span>
      </footer>

      <WorkModal work={selectedWork} onClose={handleCloseModal} />
    </div>
  );
}
