import { recruitmentRequest } from "@/lib/recruitment";
type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: Request, context: Context) { return recruitmentRequest(request, (await context.params).path.join("/")); }
export async function POST(request: Request, context: Context) { return recruitmentRequest(request, (await context.params).path.join("/")); }
