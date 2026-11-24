export interface WorkItem {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly category: string;
  readonly year: string;
  readonly summary: string;
  readonly detail: string;
  readonly role: string;
  readonly stack: readonly string[];
  readonly accent: readonly [string, string];
  readonly url?: string;
}

export interface LinkItem {
  readonly label: string;
  readonly href: string;
  readonly handle: string;
}

export interface PortfolioContent {
  readonly monogram: string;
  readonly name: string;
  readonly role: string;
  readonly location: string;
  readonly availability: string;
  readonly heroLead: string;
  readonly heroSub: string;
  readonly aboutTitle: string;
  readonly aboutParagraphs: readonly string[];
  readonly focusAreas: readonly string[];
  readonly email: string;
  readonly works: readonly WorkItem[];
  readonly links: readonly LinkItem[];
}

/**
 * Single source of truth for portfolio copy and works.
 * Replace these placeholders whenever your final content is ready.
 */
export const PORTFOLIO_CONTENT: PortfolioContent = {
  monogram: "K.",
  name: "Your Name",
  role: "Design Engineer / Creative Developer",
  location: "Tokyo, JP",
  availability: "Draft — Content in progress",
  heroLead: "Quiet interfaces shaped by light, motion, and crisp engineering.",
  heroSub:
    "内容はこれから決めていくポートフォリオの土台です。ニュートラルなメッシュグラデーションと軽快なパフォーマンスを軸に設計しています。",
  aboutTitle: "About",
  aboutParagraphs: [
    "ここに自己紹介や大切にしているスタンスが入ります。デザインとフロントエンド実装のあいだを行き来しながら、触っていて心地よいプロダクトやWeb体験をつくる、といった文章に差し替えられます。",
    "すべてのテキスト・作品・リンクは src/content/portfolio.ts に分離しているため、レイアウトやシェーダーを触らずにいつでも更新できます。",
  ],
  focusAreas: [
    "Interface Design",
    "Frontend Architecture",
    "WebGL / Creative Coding",
    "Edge Performance",
  ],
  email: "hello@example.com",
  works: [
    {
      id: "project-01",
      index: "01",
      title: "Project Placeholder I",
      category: "Web Application",
      year: "2026",
      summary: "代表作の1つ目を置くスロット。UI設計とフロントエンド実装のハイライト。",
      detail:
        "ここにプロジェクトの背景、課題、アプローチ、工夫した細部を記載します。画像やリンクを後から追加しやすい構成にしています。",
      role: "Design & Engineering",
      stack: ["TypeScript", "React", "Cloudflare Workers"],
      accent: ["#d7c6b6", "#b7c6c9"],
    },
    {
      id: "project-02",
      index: "02",
      title: "Project Placeholder II",
      category: "Visual Experiment",
      year: "2026",
      summary: "シェーダーやインタラクション表現など、視覚的な実験作品の枠。",
      detail:
        "動きの気持ちよさと描画負荷のバランスをどう設計したか、技術的なこだわりや設計メモをまとめるスペースです。",
      role: "Creative Development",
      stack: ["Three.js", "GLSL", "Vite+"],
      accent: ["#d0bab5", "#c3cbbd"],
    },
    {
      id: "project-03",
      index: "03",
      title: "Project Placeholder III",
      category: "Design System",
      year: "2025",
      summary: "デザインシステムやツール、OSSなど継続的に育てているものの枠。",
      detail:
        "コンポーネント設計の思想や、チーム開発での活用実績・改善効果などを簡潔に紹介できます。",
      role: "Architecture & UI",
      stack: ["Design Tokens", "CSS", "Accessibility"],
      accent: ["#b7c6c9", "#d7c6b6"],
    },
  ],
  links: [
    { label: "GitHub", href: "https://github.com", handle: "@your-handle" },
    { label: "X / Twitter", href: "https://x.com", handle: "@your-handle" },
    { label: "Note / Blog", href: "https://note.com", handle: "Writing" },
  ],
};
