import type { MetadataRoute } from "next";
import { SITE_URL } from "@/modules/portfolio";

/**
 * Without this there is no sitemap declaration and no control over whether a
 * preview deployment is indexed alongside production.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
