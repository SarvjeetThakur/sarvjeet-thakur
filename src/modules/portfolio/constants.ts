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

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const APPLE_ICON_SIZE = { width: 180, height: 180 };
export const ICON_SIZE = { width: 64, height: 64 };
