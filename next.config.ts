import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // Next 16 defaults this to [75] and silently coerces anything else to the
    // nearest entry, so `quality={100}` is ignored unless listed here.
    qualities: [75, 100],
  },
  // A no-op per Next's own types; set only to silence the adoption notice.
  partialPrefetching: false,
  experimental: {
    // Both are single-entry barrels; lucide is already on Next's default list.
    optimizePackageImports: ["@react-three/drei", "@icons-pack/react-simple-icons"],
  },
  // Drops the `X-Powered-By: Next.js` version fingerprint.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          /*
           * `'unsafe-inline'` is unavoidable: next-themes, Next's navigation
           * script and the flight payload all ship inline, and a nonce would
           * force dynamic rendering on a fully static page. The directives
           * it does not weaken — frame-ancestors, base-uri, object-src — are
           * the ones worth having, so the policy still earns its place.
           */
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // React needs eval() in development to rebuild server callstacks.
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' ws: wss:",
              "frame-ancestors 'none'",
              "base-uri 'none'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
      // The PDF duplicates `/resume`, and Google indexes PDFs as pages.
      {
        source: "/sarvjeet-thakur-resume.pdf",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        // Without the condition, CSS Modules become global and lose their class names.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
