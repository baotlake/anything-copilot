import { fileURLToPath, URL, resolve as r } from "node:url";
import { dirname, resolve } from "node:path";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import vueI18n from "@intlify/unplugin-vue-i18n/vite";
import manifest from "./manifest";
import makeManifest from "./utils/manifest-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __INTLIFY_JIT_COMPILATION__: true,
    __INTLIFY_DROP_MESSAGE_COMPILER__: true,
  },
  plugins: [
    vue(),
    vueJsx(),
    vueI18n({
      runtimeOnly: true,
      include: resolve(
        dirname(fileURLToPath(import.meta.url)),
        "./src/locales/**"
      ),
    }),
    makeManifest(manifest, { isDev: false }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "vue-i18n": "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
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
