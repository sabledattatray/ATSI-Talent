import { atsRequest } from "@/lib/ats";
type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: Request, context: Context) { return atsRequest(request, (await context.params).path.join("/")); }
export async function POST(request: Request, context: Context) { return atsRequest(request, (await context.params).path.join("/")); }
