import { NextResponse } from "next/server";

export function restricted() {
  return NextResponse.json(
    { error: "Authentication is not configured. Private records are unavailable.", code: "AUTH_REQUIRED" },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

export function unavailable() {
  return NextResponse.json(
    { error: "This prototype does not accept submissions. Nothing has been saved or sent.", code: "SERVICE_UNAVAILABLE" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
