import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({
    openapi: "3.1.0",
    info: { title: "ATSAI prototype API", version: "0.1.0", description: "Public job read API backed by admin publishing. Recruitment submissions return 503; private recruitment collections return 401. Admin authentication and durable publishing storage are configured separately; email and recruitment intake remain unavailable." },
    servers: [{ url: "/api/v1" }],
    paths: {
      "/jobs": { get: { responses: { "200": { description: "Published, unexpired jobs; development also includes clearly labelled sample fixtures" }, "400": { description: "Invalid filters" } } } },
      "/jobs/{id}": { get: { parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Published job, or development sample job" }, "404": { description: "Unavailable job" } } } },
      "/status": { get: { responses: { "200": { description: "Configuration availability; no fabricated telemetry" } } } },
      ...Object.fromEntries(["applications", "mandates", "employers/leads"].map(path => [`/${path}`, {
        get: { responses: { "401": { description: "Recruitment collection access is unavailable" } } },
        post: { responses: { "503": { description: "Submission service unavailable; nothing saved" } } },
      }])),
      ...Object.fromEntries(["privacy-request", "report-job"].map(path => [`/${path}`, { post: { responses: { "503": { description: "Submission service unavailable; nothing saved or sent" } } } }])),
      "/verify-recruiter": { get: { responses: { "503": { description: "Approved registry not connected" } } } },
    },
  });
}
