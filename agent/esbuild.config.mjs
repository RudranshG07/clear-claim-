// Bundle the agent entrypoints. We bundle node_modules because several Ledger
// DMK packages ship an ESM build that uses bare directory imports
// (`export * from "./src"`) which Node's native ESM loader rejects; esbuild
// resolves them at build time.
import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts", "src/whoami.ts"],
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  sourcemap: true,
  logLevel: "info",
  // reflect-metadata + inversify (used by the eth signer) rely on decorator
  // metadata already emitted in the published JS, so no extra config needed.
  banner: {
    // Some bundled CJS deps reference require/__dirname; shim them for ESM.
    js: "import { createRequire as __cr } from 'module'; import { fileURLToPath as __ftu } from 'url'; import { dirname as __dn } from 'path'; const require = __cr(import.meta.url); const __filename = __ftu(import.meta.url); const __dirname = __dn(__filename);",
  },
});
