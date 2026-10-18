import type { MetadataRoute } from "next";
import { PUBLIC_SITEMAP_PATHS, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Keep discovery independent of the publishing database. Add individual job
  // and article URLs once durable production publishing storage is configured.
  return PUBLIC_SITEMAP_PATHS.map(path => ({ url: new URL(path, SITE_URL).href }));
}
