import { db } from "@/lib/admin/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = db().prepare("SELECT type,bytes FROM media WHERE id=?").get(id) as { type: string; bytes: Uint8Array } | undefined;
  if (!row) return new Response("Image not found", { status: 404 });
  return new Response(new Uint8Array(row.bytes), { headers: { "Content-Type": row.type, "X-Content-Type-Options": "nosniff", "Cache-Control": "public,max-age=86400", "Content-Security-Policy": "default-src 'none'; sandbox" } });
}
