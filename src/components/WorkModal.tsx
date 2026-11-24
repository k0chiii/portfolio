import { useEffect, useRef } from "react";

import type { WorkItem } from "../content/portfolio";

interface WorkModalProps {
  work: WorkItem | null;
  onClose: () => void;
}

export function WorkModal({ work, onClose }: WorkModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!work) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [work, onClose]);

  if (!work) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-modal-title"
      >
        <div
          className="modal-visual"
          style={{
            background: `radial-gradient(circle at 20% 25%, ${work.accent[0]}, transparent 65%), radial-gradient(circle at 80% 75%, ${work.accent[1]}, transparent 70%)`,
          }}
        >
          <span className="work-index">{work.index}</span>
          <button
            ref={closeButtonRef}
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="モーダルを閉じる"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="modal-content">
          <div className="modal-kicker">
            <span>{work.category}</span>
            <span>·</span>
            <span>{work.year}</span>
            <span>·</span>
            <span>{work.role}</span>
          </div>

          <h2 id="work-modal-title" className="modal-title">
            {work.title}
          </h2>

          <p className="modal-detail">{work.detail}</p>

          <ul className="tag-list">
            {work.stack.map((tech) => (
              <li key={tech} className="tag-pill">
                {tech}
              </li>
            ))}
          </ul>

          {work.url && (
            <div className="modal-actions">
              <a className="primary-link" href={work.url} target="_blank" rel="noopener noreferrer">
                Visit project ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
