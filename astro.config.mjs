import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";

export default defineConfig({
  devToolbar: {
    enabled: false,
  },
  adapter: node({
    mode: "standalone",
  }),
  output: "server",
  integrations: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  vite: {
    // The transcription worker is the only importer of @huggingface/transformers.
    // Pre-bundle it at startup so the first worker load doesn't trigger Vite's
    // "new dependencies optimized, reloading" full-page reload mid-upload.
    optimizeDeps: {
      include: ["@huggingface/transformers"],
    },
  },
});
