import * as esbuild from "esbuild"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
// const isWatch = process.argv.includes("--watch")
// const isToPublic = process.argv.includes("--public")
const isWatch = process.env.NODE_ENV === "development"

const workingDir = resolve(dirname(fileURLToPath(import.meta.url)))

const ctx = await esbuild.context({
  absWorkingDir: resolve(dirname(fileURLToPath(import.meta.url))),
  entryPoints: {
    // bg: "./src/bg/index.ts",
    "js/content-main": "./src/content/main.ts",
    "js/content-frame": "./src/content/frame.ts",
    "js/pdf.worker": "./src/assets/pdf.worker.js",
  },
  bundle: true,
  format: "iife",
  outdir: "./public",
  alias: {
    "@": "./src/",
  },
})

if (isWatch) {
  await ctx.watch()
} else {
  await ctx.rebuild()
  ctx.dispose()
}
