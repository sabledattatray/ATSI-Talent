import { emailConfiguration } from "@/lib/notifications";
import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ status: "available", services: { authentication: "candidate-employer-and-admin-sessions", database: process.env.TURSO_DATABASE_URL ? "turso" : "local-sqlite", recruitmentSubmissions: "company-applicant-tracking", interviews: "database-with-candidate-timeline", email: emailConfiguration().configured ? "resend-configured" : "not-configured", resumeUploads: "private-authenticated-files" } }, { headers: { "Cache-Control": "no-store" } }); }
