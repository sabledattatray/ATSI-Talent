import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({ verified: false, error: "Recruiter verification is not connected to an approved registry.", code: "SERVICE_UNAVAILABLE" }, { status: 503 });
}
