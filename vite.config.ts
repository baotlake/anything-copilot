import { fileURLToPath, URL, resolve as r } from "node:url"
import { dirname, resolve } from "node:path"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import vueI18n from "@intlify/unplugin-vue-i18n/vite"
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"
import manifest from "./src/manifest"
import makeManifest from "./utils/manifest-plugin"

/// <reference types="vitest" />

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __INTLIFY_JIT_COMPILATION__: true,
    __INTLIFY_DROP_MESSAGE_COMPILER__: true,
    __DEV__: process.env.NODE_ENV === "development",
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
    wasm(),
    topLevelAwait(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "vue-i18n": "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
    },
  },
  build: {
    target: ["chrome111"],
    emptyOutDir: false,
    assetsDir: "assets",
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: "src/pages/popup.html",
        guide: "src/pages/guide.html",
        worker: "src/pages/offscreen.html",
        // dev: "src/pages/dev.html",
      },
      output: {
        assetFileNames: "assets/[name].[ext]",
        chunkFileNames: "js/[name]-chunk.js",
        entryFileNames: "js/[name].js",
      },
    },
  },
})
