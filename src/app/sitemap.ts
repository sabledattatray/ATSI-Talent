import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { records } from "@/lib/admin/db";
import { PUBLIC_SITEMAP_PATHS, absoluteUrl } from "@/lib/seo";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const published = await records(undefined, true);
  return [
    ...PUBLIC_SITEMAP_PATHS.map(path => ({ url: absoluteUrl(path) })),
    ...published.map(record => ({ url: absoluteUrl(`/${record.kind === "job" ? "jobs" : "blog"}/${record.slug}`), lastModified: new Date(record.updatedAt) })),
  ];
}
