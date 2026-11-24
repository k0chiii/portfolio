export interface EntryItem {
  readonly year: string;
  readonly title: string;
  readonly href: string;
  readonly note?: string;
}

export interface LinkItem {
  readonly label: string;
  readonly href: string;
}

export interface PortfolioContent {
  readonly name: string;
  readonly domain: string;
  readonly place: string;
  readonly links: readonly LinkItem[];
  readonly entries: readonly EntryItem[];
}

/**
 * Append real works or writings to `entries` when ready.
 * When empty, the page stays as a single quiet plate without placeholder noise.
 */
export const PORTFOLIO_CONTENT: PortfolioContent = {
  name: "k0chi",
  domain: "k0chi.dev",
  place: "Tokyo",
  links: [
    {
      label: "GitHub",
      href: "https://github.com/k0chiii",
    },
  ],
  entries: [],
};
