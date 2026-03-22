import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-extension-manifest",
      closeBundle() {
        mkdirSync(resolve(rootDir, "dist"), { recursive: true });
        copyFileSync(resolve(rootDir, "manifest.json"), resolve(rootDir, "dist/manifest.json"));
      }
    }
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(rootDir, "popup.html"),
        inspector: resolve(rootDir, "inspector.html"),
        background: resolve(rootDir, "src/background/index.ts")
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === "background"
            ? "background/service-worker.js"
            : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});