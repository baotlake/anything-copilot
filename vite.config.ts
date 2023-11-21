import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import manifest from "./manifest";
import makeManifest from "./utils/manifest-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), makeManifest(manifest, { isDev: false })],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    emptyOutDir: false,
    assetsDir: "assets",
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: "popup.html",
        guide: "guide.html",
      },
      output: {
        assetFileNames: "[name].[ext]",
        chunkFileNames: "[name]-chunk.js",
        entryFileNames: "[name].js",
      },
    },
  },
});
