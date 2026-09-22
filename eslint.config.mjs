import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "convex/_generated/**",
    ".agents/**",
    "android/**",
    "ios/**",
    "public/mobile-app.js",
    "public/mobile-app.js.map",
  ]),
]);
