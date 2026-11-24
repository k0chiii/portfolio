import type { WorkItem } from "../content/portfolio";

interface WorkCardProps {
  work: WorkItem;
  onSelect: (work: WorkItem, trigger: HTMLButtonElement) => void;
}

export function WorkCard({ work, onSelect }: WorkCardProps) {
  return (
    <article className="work-card">
      <button
        type="button"
        className="work-card-trigger"
        onClick={(event) => onSelect(work, event.currentTarget)}
        aria-label={`${work.title} の詳細を見る`}
      >
        <div
          className="work-swatch"
          style={{
            background: `radial-gradient(circle at 22% 24%, ${work.accent[0]}, transparent 68%), radial-gradient(circle at 82% 76%, ${work.accent[1]}, transparent 70%)`,
          }}
        >
          <span className="work-index">{work.index}</span>
          <span className="work-year">{work.year}</span>
        </div>

        <div className="work-body">
          <div className="work-meta">
            <span className="work-category">{work.category}</span>
          </div>
          <h3 className="work-title">{work.title}</h3>
          <p className="work-summary">{work.summary}</p>
          <ul className="tag-list" aria-label="Technologies">
            {work.stack.map((tech) => (
              <li key={tech} className="tag-pill">
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </button>
    </article>
  );
}
