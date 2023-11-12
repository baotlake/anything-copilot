import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import svgr from "vite-plugin-svgr";
import manifest from "./manifest";
import makeManifest from "./utils/manifest-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), svgr(), makeManifest(manifest, { isDev: false })],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: "popup.html",
        guide: "guide.html",
      },
    },
  },
});
