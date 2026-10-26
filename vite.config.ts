import { rmSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    {
      // The mock service worker (public/mockServiceWorker.js) is for `npm run dev` only: it never ships.
      name: "drop-mock-worker",
      apply: "build",
      closeBundle() {
        rmSync(resolve(import.meta.dirname, "dist/mockServiceWorker.js"), { force: true });
      },
    },
  ],
  build: {
    sourcemap: true,
    // Libraries in their own chunks: they change far less often than the app, so browsers keep them
    // cached across deploys. Cloudscape is one large chunk on purpose (~200 kB gzip), hence the limit.
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "cloudscape", test: /node_modules[\\/]@cloudscape-design/ },
            { name: "vendor", test: /node_modules/ },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
