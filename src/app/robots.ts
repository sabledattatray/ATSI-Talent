import type { MetadataRoute } from "next";
import { PUBLIC_INDEXING, SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: PUBLIC_INDEXING
      ? { userAgent: "*", allow: ["/", "/api/media/"], disallow: ["/admin", "/api", "/candidate", "/employer", "/recruiter"].flatMap(path => [path + "$", path + "/"]) }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
