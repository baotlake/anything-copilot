import * as esbuild from "esbuild";
const isWatch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: {
    main: "./src/content/main.ts",
    bg: "./src/bg/index.ts",
  },
  bundle: true,
  format: "iife",
  outdir: "./dist",
  alias: {
    "@": "./src/",
  },
});

if (isWatch) {
  await ctx.watch();
} else {
  await ctx.rebuild();
  ctx.dispose();
}
