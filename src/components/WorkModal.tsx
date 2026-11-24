import { useEffect, useRef } from "react";

import type { WorkItem } from "../content/portfolio";
import { ArrowUpRightIcon, CloseIcon } from "./Icons";

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
        <div className="modal-header">
          <div className="modal-meta">
            <span className="mono-figure">{work.year}</span>
            <span className="meta-dot" aria-hidden="true">
              /
            </span>
            <span>{work.category}</span>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="icon-control"
            onClick={onClose}
            aria-label="Close details"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <h2 id="work-modal-title" className="modal-title">
            {work.title}
          </h2>
          <p className="modal-detail">{work.detail}</p>

          <dl className="modal-specs">
            <dt>Stack</dt>
            <dd>{work.stack.join(", ")}</dd>
          </dl>

          {work.url && (
            <div className="modal-actions">
              <a
                className="button-primary"
                href={work.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Open repository</span>
                <ArrowUpRightIcon />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
