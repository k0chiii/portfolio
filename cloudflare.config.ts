import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "portfolio",
    compatibilityDate: "2026-11-24",
    domains: ["k0chi.dev", "www.k0chi.dev"],
    assets: {
      notFoundHandling: "single-page-application",
    },
    observability: {
      enabled: true,
      traces: {
        enabled: true,
      },
    },
  },
});
