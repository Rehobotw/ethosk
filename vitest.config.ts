import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    include: [
      "shared/**/*.test.ts",
      "server/**/*.test.ts",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
    ],
    // Pure logic stays in Node; only the component tests pay for a DOM.
    environmentMatchGlobs: [["src/**", "jsdom"]],
    server: {
      deps: {
        inline: [/@exodus\/bytes/, /html-encoding-sniffer/, /jsdom/],
      },
    },
  },
});
