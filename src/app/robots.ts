import type { MetadataRoute } from "next";
import { PRIVATE_SEARCH_PATHS, PUBLIC_INDEXING, SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: PUBLIC_INDEXING
      ? { userAgent: "*", allow: "/", disallow: PRIVATE_SEARCH_PATHS.flatMap(path => [path + "$", path + "/"]) }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
