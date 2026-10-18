import { recruitmentRequest } from "@/lib/recruitment";
export async function GET(request: Request) { return recruitmentRequest(request, "verify"); }
