export interface InterestItem {
  readonly index: string;
  readonly labelJa: string;
  readonly labelEn: string;
  readonly note: string;
}

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
  readonly interests: readonly InterestItem[];
  readonly aboutParagraphs: readonly string[];
  readonly works: readonly WorkItem[];
  readonly links: readonly LinkItem[];
}

/**
 * Portfolio content source.
 * Edit this file to update interests, works, biography, and links.
 */
export const PORTFOLIO_CONTENT: PortfolioContent = {
  brand: "k0chi",
  domain: "k0chi.dev",
  headline: "Structure, perception, and language",
  subhead:
    "計数工学・認知・認識・哲学・言語学に関心があります。考えたことや、つくったソフトウェアをここに置いていきます。",
  interests: [
    {
      index: "01",
      labelJa: "計数工学",
      labelEn: "Mathematical engineering",
      note: "数理モデル、確率・統計、システムとしての世界の記述と計算",
    },
    {
      index: "02",
      labelJa: "認知",
      labelEn: "Cognition",
      note: "情報処理、推論、記憶や注意が思考と行動を形づくる仕組み",
    },
    {
      index: "03",
      labelJa: "認識",
      labelEn: "Perception & epistemology",
      note: "感覚から知覚が立ち上がる過程と、知ることの条件・境界",
    },
    {
      index: "04",
      labelJa: "哲学",
      labelEn: "Philosophy",
      note: "概念の整理、存在や意味、心と世界をめぐる基礎的な問い",
    },
    {
      index: "05",
      labelJa: "言語学",
      labelEn: "Linguistics",
      note: "記号・構造・意味が思考や現実をどのように分節するか",
    },
  ],
  aboutParagraphs: [
    "計数工学を軸に、認知・認識・哲学・言語学の接点に関心を持ちながら、ソフトウェアやインターフェースをつくっています。",
    "数理的な構造と、人が世界を知覚し言葉にする手触りのあいだを行き来することがテーマです。制作物やメモは準備でき次第ここへ追加していきます。",
  ],
  works: [
    {
      id: "k0chi-dev",
      year: "2026",
      title: "k0chi.dev",
      category: "Personal site",
      summary: "Three.js の連続場シェーダーと Vite+ / Cloudflare Workers で構成した個人サイト",
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
