import type { MetadataRoute } from "next";
import { APPLE_ICON_SIZE, ICON_SIZE, site } from "@/modules/portfolio";
import { Theme, THEME_COLORS } from "@/modules/theme";

/**
 * A manifest, deliberately without a service worker.
 *
 * This names the site and points at the generated icons, so a saved
 * home-screen entry reads correctly instead of "localhost" with a scaled
 * favicon. Chrome needs a manifest *and* a service worker with a fetch
 * handler before it offers installation, so there is no install prompt and
 * no cached-build risk — which is the point. See the PWA note in README.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.role}`,
    short_name: site.name,
    description: site.meta.description,
    start_url: "/",
    display: "browser",
    background_color: THEME_COLORS[Theme.Dark],
    theme_color: THEME_COLORS[Theme.Dark],
    icons: [
      {
        src: "/icon",
        sizes: `${ICON_SIZE.width}x${ICON_SIZE.height}`,
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: `${APPLE_ICON_SIZE.width}x${APPLE_ICON_SIZE.height}`,
        type: "image/png",
      },
    ],
  };
}
