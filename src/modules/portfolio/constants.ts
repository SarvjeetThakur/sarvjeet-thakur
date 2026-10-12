// Falls back to Vercel's own production-domain variable, so a deploy that
// forgets NEXT_PUBLIC_SITE_URL still gets a correct canonical.
const VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (VERCEL_URL ? `https://${VERCEL_URL}` : "http://localhost:3000");

// Trailing slashes are stripped because every other URL is built by
// concatenation: one typed into the deploy environment produced
// `.../#person` as `...//#person` in the JSON-LD and a 308 in the sitemap.
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "");

/**
 * A capture of the live home page under /public. Named in the metadata rather
 * than left to the `opengraph-image` file convention, because a route that
 * sets its own `openGraph` (the résumé) drops the inherited file-based image.
 */
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630 };
export const APPLE_ICON_SIZE = { width: 180, height: 180 };
/** Square pixel sizes: the favicon, then the two a manifest is expected to carry. */
export const ICON_SIZES = [64, 192, 512] as const;

/**
 * Captures of the live site under /public, listed in the manifest. Regenerate
 * them with the Open Graph image after a visual change; see AGENTS.md.
 */
export const SCREENSHOTS = [
  { src: "/screenshots/desktop.png", width: 1280, height: 720, formFactor: "wide" },
  { src: "/screenshots/mobile.png", width: 390, height: 844, formFactor: "narrow" },
] as const;
