import * as esbuild from "esbuild"
const isWatch = process.argv.includes("--watch")

const ctx = await esbuild.context({
  entryPoints: {
    bg: "./src/bg/index.ts",
    "js/content-main": "./src/content/main.ts",
    "js/pdf.worker": "./src/assets/pdf.worker.js",
  },
  bundle: true,
  format: "iife",
  outdir: "./dist",
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
