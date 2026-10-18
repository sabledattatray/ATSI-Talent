import { generateJobFingerprint } from "./normalizer";
import type { ExtractedJobFacts, DuplicateCandidate } from "./types";
import type { ContentRecord } from "@/lib/admin/types";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType?: "exact_external_id" | "canonical_url" | "title_company_location";
  existingJob?: ContentRecord;
  similarityScore: number;
}

/**
 * Evaluates an incoming extracted job against existing published and draft jobs in the database.
 */
export function findDuplicateJob(
  facts: ExtractedJobFacts,
  existingJobs: ContentRecord[],
  sourceId: string
): DuplicateCheckResult {
  // 1. Check exact external_job_id (if present)
  if (facts.externalJobId) {
    const match = existingJobs.find(j => {
      const doc = j as ContentRecord & { externalJobId?: string; sourceId?: string };
      return doc.externalJobId === facts.externalJobId && doc.sourceId === sourceId;
    });
    if (match) {
      return {
        isDuplicate: true,
        matchType: "exact_external_id",
        existingJob: match,
        similarityScore: 1.0
      };
    }
  }

  // 2. Check exact official apply URL / canonical source URL
  if (facts.officialApplyUrl) {
    const cleanUrl = facts.officialApplyUrl.split("#")[0].replace(/\/+$/, "").toLowerCase();
    const match = existingJobs.find(j => {
      const appUrl = (j.applicationUrl || "").split("#")[0].replace(/\/+$/, "").toLowerCase();
      return appUrl && appUrl === cleanUrl;
    });
    if (match) {
      return {
        isDuplicate: true,
        matchType: "canonical_url",
        existingJob: match,
        similarityScore: 0.98
      };
    }
  }

  // 3. Check normalized fingerprint (same employer + normalized title + location)
  const incomingFingerprint = generateJobFingerprint(facts);
  const match = existingJobs.find(j => {
    const existingFingerprint = generateJobFingerprint({
      title: j.title,
      company: j.company,
      location: j.location
    });
    return existingFingerprint === incomingFingerprint;
  });

  if (match) {
    return {
      isDuplicate: true,
      matchType: "title_company_location",
      existingJob: match,
      similarityScore: 0.92
    };
  }

  return {
    isDuplicate: false,
    similarityScore: 0
  };
}
