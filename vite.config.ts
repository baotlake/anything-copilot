import { fileURLToPath, URL, resolve as r } from "node:url"
import { dirname, resolve } from "node:path"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import vueI18n from "@intlify/unplugin-vue-i18n/vite"
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"
import { crx } from "@crxjs/vite-plugin"
import manifest from "./src/manifest"
import copy from "rollup-plugin-copy"
// import makeManifest from "./utils/manifest-plugin"

/// <reference types="vitest" />

const __DEV__ = process.env.NODE_ENV == "development"

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __INTLIFY_JIT_COMPILATION__: true,
    __INTLIFY_DROP_MESSAGE_COMPILER__: true,
    __DEV__: process.env.NODE_ENV === "development",
  },

  plugins: [
    copy({
      hook: "buildEnd",
      targets: __DEV__ ? [{ src: "public/*", dest: "dist" }] : [],
    }),
    vue({}),
    vueJsx(),
    vueI18n({
      runtimeOnly: true,
      include: resolve(
        dirname(fileURLToPath(import.meta.url)),
        "./src/locales/**"
      ),
    }),
    crx({ manifest, contentScripts: { injectCss: false } }),
    wasm(),
    topLevelAwait(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "vue-i18n": resolve(
        __dirname,
        "node_modules",
        "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js"
      ),
    },
  },
  build: {
    target: ["chrome111"],
    emptyOutDir: true,
    // cssCodeSplit: false,
    outDir: "dist",
    rollupOptions: {
      input: {
        offscreen: "offscreen.html",
      },
      output: {
        chunkFileNames: "js/chunk-[hash].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
})
