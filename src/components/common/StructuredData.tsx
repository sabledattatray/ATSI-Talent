import { jsonLd } from "@/lib/structured-data";
export function StructuredData({ data }: { data: unknown }) { return data ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} /> : null; }
