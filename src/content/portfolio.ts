export interface WorkItem {
  readonly id: string;
  readonly proposition: string;
  readonly year: string;
  readonly title: string;
  readonly category: string;
  readonly summary: string;
  readonly detail: string;
  readonly stack: readonly string[];
  readonly url?: string;
}

export interface LinkItem {
  readonly proposition: string;
  readonly label: string;
  readonly href: string;
  readonly value: string;
}

export interface PortfolioContent {
  readonly brand: string;
  readonly domain: string;
  readonly location: string;
  readonly note: string;
  readonly works: readonly WorkItem[];
  readonly links: readonly LinkItem[];
}

/**
 * Minimal content source.
 * Copy stays intentionally sparse; replace or append entries when ready.
 */
export const PORTFOLIO_CONTENT: PortfolioContent = {
  brand: "k0chi",
  domain: "k0chi.dev",
  location: "Tokyo",
  note: "Personal index. Content is still being composed.",
  works: [
    {
      id: "k0chi-dev",
      proposition: "1.1",
      year: "2026",
      title: "k0chi.dev",
      category: "Site / Field",
      summary: "Continuous scalar field with localized level sets, built on Vite+ and Cloudflare",
      detail:
        "A personal site structured around the boundary between a continuous WebGL scalar field and discrete typographic rows. Moving across the hero field articulates latent isocontours near the point of observation.",
      stack: ["React", "Three.js", "GLSL", "Vite+", "Cloudflare Workers"],
      url: "https://github.com/k0chiii/portfolio",
    },
  ],
  links: [
    {
      proposition: "2.1",
      label: "GitHub",
      href: "https://github.com/k0chiii",
      value: "github.com/k0chiii",
    },
    {
      proposition: "2.2",
      label: "Domain",
      href: "https://k0chi.dev",
      value: "k0chi.dev",
    },
  ],
};
