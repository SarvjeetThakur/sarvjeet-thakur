import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Testing on a real phone means loading the dev server by LAN IP, and
   * Next blocks its dev assets from any other origin by default: the page
   * renders but no JavaScript loads, so nothing hydrates. Private ranges
   * only, and `allowedDevOrigins` has no effect on a production build.
   */
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
  cacheComponents: true,
  /*
   * Off: this is a single page whose only links are hash anchors, so there is
   * no route navigation to prefetch a shell for. Left on, its dev-only
   * validator reports "Could not validate `instant`" on every load, which
   * buries real warnings behind a permanent error badge.
   */
  partialPrefetching: false,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        // `as: "*.css"` would turn CSS Modules into global CSS, dropping their class names
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
