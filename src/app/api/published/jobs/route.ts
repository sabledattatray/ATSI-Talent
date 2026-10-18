import { publicJobs } from "@/lib/admin/public";
export async function GET(request: Request) { new URL(request.url); return Response.json({ jobs: (await publicJobs()) }, { headers: { "Cache-Control": "no-store" } }); }
