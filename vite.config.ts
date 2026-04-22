/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  // Restrict the dep-scan and dev server to our app — the reference `pita/`
  // folder contains its own index.html that Vite would otherwise try to crawl.
  optimizeDeps: {
    entries: ["index.html"],
  },
  server: {
    fs: {
      allow: [".", "node_modules"],
      deny: ["pita"],
    },
  },
  build: {
    target: "es2022",
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
