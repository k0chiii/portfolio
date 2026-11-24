export interface WorkItem {
  readonly id: string;
  readonly year: string;
  readonly title: string;
  readonly category: string;
  readonly summary: string;
  readonly detail: string;
  readonly stack: readonly string[];
  readonly url?: string;
}

export interface LinkItem {
  readonly label: string;
  readonly href: string;
  readonly value: string;
}

export interface PortfolioContent {
  readonly brand: string;
  readonly domain: string;
  readonly headline: string;
  readonly subhead: string;
  readonly aboutParagraphs: readonly string[];
  readonly disciplines: readonly string[];
  readonly works: readonly WorkItem[];
  readonly links: readonly LinkItem[];
}

/**
 * Portfolio content source.
 * Edit this file to add works, biography, and links.
 */
export const PORTFOLIO_CONTENT: PortfolioContent = {
  brand: "k0chi",
  domain: "k0chi.dev",
  headline: "Notes, interfaces, and small software",
  subhead: "k0chi の個人サイト。つくったものや実験をここにまとめていきます。",
  aboutParagraphs: [
    "東京を拠点にソフトウェアとインターフェースをつくっています。",
    "プロフィールや制作実績は準備でき次第ここへ追加していきます。テキスト・作品・リンクはすべて src/content/portfolio.ts から更新できる構成です。",
  ],
  disciplines: ["Web interfaces", "Frontend engineering", "WebGL shaders", "Edge infrastructure"],
  works: [
    {
      id: "k0chi-dev",
      year: "2026",
      title: "k0chi.dev",
      category: "Personal site",
      summary: "Three.js のカスタムシェーダーと Vite+ / Cloudflare Workers で構成した個人サイト",
      detail:
        "ファーストビューのメッシュグラデーションのみを Three.js の遅延読み込みチャンクで描画し、スクロールで画面外に出ると描画ループを自動停止する構成。ライト／ダーク切替では5色の顔料パレットをシェーダー内で補間している。",
      stack: ["React", "Three.js", "Vite+", "Cloudflare Workers"],
      url: "https://github.com/k0chiii/portfolio",
    },
  ],
  links: [
    {
      label: "GitHub",
      href: "https://github.com/k0chiii",
      value: "github.com/k0chiii",
    },
    {
      label: "Site",
      href: "https://k0chi.dev",
      value: "k0chi.dev",
    },
  ],
};
