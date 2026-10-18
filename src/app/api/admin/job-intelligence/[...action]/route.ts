import { NextResponse } from "next/server";
import { assertOrigin, requireUser } from "@/lib/admin/auth";
import {
  getOverview,
  getSources,
  getSource,
  saveSource,
  previewImport,
  createImportBatch,
  getImportBatch,
  getReviewQueue,
  getItemEvidence,
  approveAndPublishItem,
  rejectItem,
  mergeDuplicate,
  purgeDummyJobs
} from "@/lib/job-intelligence/service";

type Context = { params: Promise<{ action: string[] }> };
const response = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function json(request: Request) {
  try {
    return await request.json();
  } catch {
    throw Object.assign(new Error("Invalid JSON request payload."), { status: 400 });
  }
}

function fail(error: unknown) {
  const e = error as Error & { status?: number };
  console.error("Job Intelligence API Error:", e);
  return response({ error: e.message || "Operation failed." }, e.status || 500);
}

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const action = (await context.params).action || [];
    const url = new URL(request.url);

    if (action[0] === "overview") {
      return response(await getOverview());
    }

    if (action[0] === "sources") {
      if (action[1]) {
        const source = await getSource(action[1]);
        if (!source) return response({ error: "Source not found." }, 404);
        return response(source);
      }
      return response(await getSources());
    }

    if (action[0] === "imports" && action[1]) {
      const batch = await getImportBatch(action[1]);
      if (!batch) return response({ error: "Batch not found." }, 404);
      return response(batch);
    }

    if (action[0] === "review-queue") {
      const stage = url.searchParams.get("stage") || undefined;
      return response(await getReviewQueue(stage));
    }

    if (action[0] === "items" && action[1] && action[2] === "evidence") {
      const evidence = await getItemEvidence(action[1]);
      if (!evidence) return response({ error: "Item not found." }, 404);
      return response(evidence);
    }

    return response({ error: "Unknown endpoint." }, 404);
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    assertOrigin(request);
    const user = await requireUser();
    const action = (await context.params).action || [];
    const body = await json(request);

    if (action[0] === "sources") {
      if (user.role !== "owner") {
        return response({ error: "Only the platform owner can register or modify job sources." }, 403);
      }
      const saved = await saveSource(body);
      return response(saved, 201);
    }

    if (action[0] === "preview") {
      const { url, sourceId } = body;
      if (!url || !sourceId) {
        return response({ error: "Both 'url' and 'sourceId' are required." }, 400);
      }
      const preview = await previewImport(url, sourceId);
      return response(preview);
    }

    if (action[0] === "imports") {
      const { sourceId, urls } = body;
      if (!sourceId || !Array.isArray(urls) || urls.length === 0) {
        return response({ error: "Provide 'sourceId' and a non-empty array of 'urls'." }, 400);
      }
      const batch = await createImportBatch(user.name, sourceId, urls);
      return response(batch, 201);
    }

    if (action[0] === "items" && action[1] && action[2] === "approve") {
      const published = await approveAndPublishItem(action[1], user.name);
      return response({ ok: true, job: published });
    }

    if (action[0] === "items" && action[1] && action[2] === "reject") {
      const { reason = "Rejected during review" } = body;
      await rejectItem(action[1], user.name, reason);
      return response({ ok: true });
    }

    if (action[0] === "duplicates" && action[1] && action[2] === "merge") {
      await mergeDuplicate(action[1], user.name);
      return response({ ok: true });
    }

    if (action[0] === "purge-dummy-jobs") {
      if (user.role !== "owner") {
        return response({ error: "Only the platform owner can purge dummy jobs." }, 403);
      }
      const result = await purgeDummyJobs(user.name);
      return response({ ok: true, ...result });
    }

    return response({ error: "Unknown endpoint." }, 404);
  } catch (err) {
    return fail(err);
  }
}
