import type { ThemeMode } from "../lib/theme";

interface HeaderProps {
  monogram: string;
  theme: ThemeMode;
  motionPaused: boolean;
  onToggleTheme: () => void;
  onToggleMotion: () => void;
}

export function Header({
  monogram,
  theme,
  motionPaused,
  onToggleTheme,
  onToggleMotion,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand-mark" href="#top" aria-label="Back to top">
          {monogram}
        </a>

        <nav className="site-nav" aria-label="Primary">
          <a href="#works">Works</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="header-controls">
          <button
            type="button"
            className="icon-button"
            onClick={onToggleMotion}
            aria-pressed={motionPaused}
            aria-label={motionPaused ? "背景アニメーションを再開" : "背景アニメーションを一時停止"}
            title={motionPaused ? "Resume ambient motion" : "Pause ambient motion"}
          >
            {motionPaused ? (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M5 3.5L12.5 8L5 12.5V3.5Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="4" y="3.5" width="2.6" height="9" rx="1" fill="currentColor" />
                <rect x="9.4" y="3.5" width="2.6" height="9" rx="1" fill="currentColor" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
            title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
          >
            <span className={`theme-icon${theme === "dark" ? " is-dark" : ""}`}>
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.35" />
                  <path
                    d="M8 1.75V3.1M8 12.9V14.25M1.75 8H3.1M12.9 8H14.25M3.58 3.58L4.54 4.54M11.46 11.46L12.42 12.42M12.42 3.58L11.46 4.54M4.54 11.46L3.58 12.42"
                    stroke="currentColor"
                    strokeWidth="1.35"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M13.2 9.8A5.6 5.6 0 0 1 6.2 2.8a5.8 5.8 0 1 0 7 7Z"
                    stroke="currentColor"
                    strokeWidth="1.35"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
