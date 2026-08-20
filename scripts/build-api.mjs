import { build } from "esbuild";

const requireBanner = "import { createRequire as __llinktrCreateRequire } from 'module'; const require = __llinktrCreateRequire(import.meta.url);";

await build({
  entryPoints: ["server/_core/app.ts"],
  outfile: "dist/api-app.js",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  sourcemap: false,
  packages: "bundle",
  logLevel: "info",
  banner: {
    js: requireBanner,
  },
});
