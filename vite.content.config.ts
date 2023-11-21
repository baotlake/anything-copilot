import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
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
        assetFileNames: "[name].[ext]",
        entryFileNames: "[name].js",
      },
    },
  },
});
