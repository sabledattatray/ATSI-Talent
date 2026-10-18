import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ status: "available", services: { authentication: "candidate-and-admin-sessions", database: process.env.TURSO_DATABASE_URL ? "turso" : "local-sqlite", recruitmentSubmissions: "database-inbox", email: "not-configured", resumeUploads: "https-links-only" } }, { headers: { "Cache-Control": "no-store" } }); }
