import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [vue(), vueJsx(), svgr()],
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
