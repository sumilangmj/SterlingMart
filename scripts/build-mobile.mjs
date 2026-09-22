import { readFileSync } from "node:fs";
import { build } from "esbuild";

function loadEnvFile(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const separator = line.indexOf("=");
          if (separator < 0) return [line, ""];
          const key = line.slice(0, separator).trim();
          const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
          return [key, value];
        }),
    );
  } catch {
    return {};
  }
}

const env = { ...loadEnvFile(".env.local"), ...process.env };
const convexUrl = env.NEXT_PUBLIC_CONVEX_URL;
const clerkKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!convexUrl || !clerkKey) {
  throw new Error("Mobile build requires NEXT_PUBLIC_CONVEX_URL and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.");
}

await build({
  entryPoints: ["mobile/src/main.tsx"],
  outfile: "public/mobile-app.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  minify: true,
  sourcemap: "linked",
  define: {
    "process.env.NEXT_PUBLIC_CONVEX_URL": JSON.stringify(convexUrl),
    "process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": JSON.stringify(clerkKey),
  },
  loader: { ".css": "css" },
  logLevel: "info",
});
