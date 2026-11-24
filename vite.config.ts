import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [react(), cloudflare()],
  build: {
    target: "es2022",
    sourcemap: false,
  },
  fmt: {
    semi: true,
    singleQuote: false,
    trailingComma: "all",
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
