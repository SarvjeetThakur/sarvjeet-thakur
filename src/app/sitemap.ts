import type { MetadataRoute } from "next";
import { SITE_URL } from "@/modules/portfolio";

/**
 * One page, so this is small by nature — but it is the only place to declare
 * `lastModified`, and Search Console's sitemap report needs a sitemap to exist.
 */
/*
 * Build time, read at module scope. Calling `new Date()` inside the function
 * reads the clock per request, which under `cacheComponents` makes the route
 * dynamic — a server render on every hit for a date that changes per deploy.
 */
const LAST_MODIFIED = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/resume`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
