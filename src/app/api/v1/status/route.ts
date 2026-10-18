import { DEMO_MODE } from "@/lib/runtime";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "prototype",
    environment: DEMO_MODE ? "development-demo" : "preview",
    services: {
      authentication: "admin-sessions-configured",
      database: "admin-publishing-sqlite",
      recruitmentSubmissions: "not-configured",
      email: "not-configured",
      resumeStorageAndScanning: "not-configured",
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
