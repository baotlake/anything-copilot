import { defineConfig } from "vite"
import { fileURLToPath, URL } from "node:url"
import { dirname, resolve } from "node:path"
import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import vueI18n from "@intlify/unplugin-vue-i18n/vite"

export default defineConfig({
  server: {
    port: 3000,
  },
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
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "vue-i18n": "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
    },
  },
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    rollupOptions: {
      input: {
        content: "./src/content/index.ts",
      },
      output: {
        assetFileNames: "assets/[name].[ext]",
        chunkFileNames: "js/[name]-chunk.js",
        entryFileNames: "js/[name].js",
      },
    },
  },
})
