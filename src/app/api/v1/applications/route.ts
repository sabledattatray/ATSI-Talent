import { recruitmentRequest } from "@/lib/recruitment";
export async function GET(request: Request) { return recruitmentRequest(request, "admin"); }
export async function POST(request: Request) { return recruitmentRequest(request, "apply"); }
