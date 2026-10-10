import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Testing on a real phone means loading the dev server by LAN IP, and
   * Next blocks its dev assets from any other origin by default: the page
   * renders but no JavaScript loads, so nothing hydrates. Private ranges
   * only, and `allowedDevOrigins` has no effect on a production build.
   *
   * A `*` matches exactly one dot-separated label, so `172.16.*.*` covered
   * only one sixteenth of its private range and left out Docker Desktop's
   * default bridge and WSL — the exact 403 this list exists to prevent.
   */
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  cacheComponents: true,
  /*
   * Not a behaviour switch: Next's own types say `false` or omitted "does
   * nothing". What it does do is opt out explicitly, which suppresses the
   * "adopting partial prefetching" notice on every build. This is a single
   * page whose only links are hash anchors, so there is no route navigation
   * whose shell could be prefetched.
   */
  partialPrefetching: false,
  experimental: {
    /*
     * Both are barrels with no `exports` map for subpaths worth relying on:
     * drei re-exports the whole library from one entry point, and the icon
     * pack is ~25MB for the three brand marks used here. Next's default list
     * already covers `lucide-react`, and user entries are merged ahead of it.
     */
    optimizePackageImports: ["@react-three/drei", "@icons-pack/react-simple-icons"],
  },
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
