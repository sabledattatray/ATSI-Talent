import { PRIVATE_SEARCH_PATHS, PUBLIC_INDEXING } from "./src/lib/seo";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.ATSAI_BUILD_DIR || ".next",
  poweredByHeader: false,
  serverExternalPackages: ["pdf-parse", "word-extractor", "yauzl"],
  // PDF.js loads its worker, fonts and native DOM polyfills dynamically. NFT
  // cannot discover these from pdf-parse's ESM imports on serverless builds.
  outputFileTracingIncludes: {
    "/api/recruitment/*": [
      "./node_modules/pdf-parse/node_modules/pdfjs-dist/{legacy/build,cmaps,standard_fonts,wasm}/**/*",
      "./node_modules/pdfjs-dist/{legacy/build,cmaps,standard_fonts,wasm}/**/*",
      "./node_modules/@napi-rs/canvas*/**/*",
      "./node_modules/pdf-parse/node_modules/@napi-rs/canvas*/**/*",
    ],
  },
  outputFileTracingExcludes: { "/*": ["./data/**/*", "./.env", "./.env.*"] },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
    ] }, ...(!PUBLIC_INDEXING ? [{
      source: "/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }] : PRIVATE_SEARCH_PATHS.map(path => ({
      source: `${path}/:path*`,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }))), ...(PUBLIC_INDEXING ? [{ source: "/api/media/:path*", headers: [{ key: "X-Robots-Tag", value: "index, follow" }] }] : [])];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
