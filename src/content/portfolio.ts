export interface EntryItem {
  readonly year: string;
  readonly title: string;
  readonly href: string;
  readonly note?: string;
}

export interface LinkItem {
  readonly label: string;
  readonly href: string;
  readonly value: string;
}

export interface PortfolioContent {
  readonly name: string;
  readonly domain: string;
  readonly place: string;
  readonly entries: readonly EntryItem[];
  readonly links: readonly LinkItem[];
}

/**
 * Portfolio content source.
 * Append real works or notes to `entries` whenever ready.
 */
export const PORTFOLIO_CONTENT: PortfolioContent = {
  name: "k0chi",
  domain: "k0chi.dev",
  place: "Tokyo",
  entries: [],
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
