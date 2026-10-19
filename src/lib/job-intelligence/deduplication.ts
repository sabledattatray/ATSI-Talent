import { generateJobFingerprint } from "./normalizer";
import { normalizeCompanyName, normalizeJobTitleText, normalizeCityName } from "@/lib/canonical-jobs";
import type { ExtractedJobFacts } from "./types";
import type { ContentRecord } from "@/lib/admin/types";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType?: "exact_external_id" | "canonical_url" | "title_company_location" | "multi_recruiter_mandate" | "content_similarity";
  existingJob?: ContentRecord;
  similarityScore: number;
  compositeScore?: number;
  confidenceScore?: number;
  matchAction?: "block_same_employer" | "link_authorized_partner" | "hold_for_review" | "distinct_vacancy";
  action?: "block_same_employer" | "link_authorized_partner" | "hold_for_review" | "distinct_vacancy";
  tierScores?: {
    tier1Requisition: number;
    tier2EntitySemantic: number;
    tier3Requirements: number;
    tier4TextOverlap: number;
  };
  matchReason?: string;
  reason?: string;
  matchedFields?: string[];
}

/**
 * Calculates token-based Jaccard similarity between two text snippets.
 */
export function tokenJaccardSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const tokensA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  const tokensB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Calculates string similarity using Levenshtein / character token overlap.
 */
export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const cleanA = a.toLowerCase().trim();
  const cleanB = b.toLowerCase().trim();
  if (cleanA === cleanB) return 1.0;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return 0.85;
  return tokenJaccardSimilarity(cleanA, cleanB);
}

/**
 * Evaluates an incoming extracted job or manual posting against existing jobs
 * using the ATSAI 4-Tier Weighted Duplicate Detection Engine:
 * - Tier 1: Deterministic Requisition ID & Canonical Application URL Match (40%)
 * - Tier 2: Entity & Semantic Match: Hiring Company, Job Title, Work City (30%)
 * - Tier 3: Requirements Alignment: Experience Range, Skills, Work Mode (15%)
 * - Tier 4: Text Overlap: Jaccard Similarity on Responsibilities/Description (15%)
 */
export function findDuplicateJob(
  facts: ExtractedJobFacts | {
    title: string;
    company: string;
    location: string;
    requisitionId?: string;
    externalJobId?: string;
    officialApplyUrl?: string;
    skills?: string[] | string;
    experienceMin?: number;
    experienceMax?: number;
    workMode?: string;
    responsibilities?: string[];
    descriptionSummary?: string;
    organizationId?: string;
  } | ContentRecord,
  existingJobs: ContentRecord[],
  sourceIdOrOrgId?: string
): DuplicateCheckResult {
  const incomingReqId = ((facts as any).requisitionId || (facts as any).externalJobId || "").trim().toUpperCase();
  const incomingApplyUrl = ((facts as any).officialApplyUrl || (facts as any).applicationUrl || "").split("#")[0].replace(/\/+$/, "").toLowerCase();
  const incomingCompanyNorm = normalizeCompanyName(facts.company);
  const incomingTitleNorm = normalizeJobTitleText(facts.title);
  const incomingCityNorm = normalizeCityName(facts.location);

  let bestMatch: ContentRecord | undefined;
  let bestScore = 0;
  let bestTierScores = { tier1Requisition: 0, tier2EntitySemantic: 0, tier3Requirements: 0, tier4TextOverlap: 0 };
  let bestMatchType: DuplicateCheckResult["matchType"] = undefined;
  let bestMatchReason = "";
  const matchedFields: string[] = [];

  for (const existing of existingJobs) {
    const existingReqId = (existing.requisitionId || (existing as { externalJobId?: string }).externalJobId || "").trim().toUpperCase();
    const existingApplyUrl = (existing.applicationUrl || "").split("#")[0].replace(/\/+$/, "").toLowerCase();
    const existingCompanyNorm = normalizeCompanyName(existing.company);
    const existingTitleNorm = normalizeJobTitleText(existing.title);
    const existingCityNorm = normalizeCityName(existing.jobCity || existing.location);

    // --- Tier 1: Deterministic Matching (Weight: 40%) ---
    let tier1 = 0;
    const sameCompany = incomingCompanyNorm === existingCompanyNorm || stringSimilarity(incomingCompanyNorm, existingCompanyNorm) >= 0.85;

    if (incomingReqId && existingReqId && incomingReqId === existingReqId && sameCompany) {
      tier1 = 1.0;
      matchedFields.push("requisition_id");
    } else if (incomingApplyUrl && existingApplyUrl && incomingApplyUrl === existingApplyUrl) {
      tier1 = 0.95;
      matchedFields.push("official_apply_url");
    }

    // --- Tier 2: Entity & Semantic Matching (Weight: 30%) ---
    const companySim = stringSimilarity(incomingCompanyNorm, existingCompanyNorm);
    const titleSim = stringSimilarity(incomingTitleNorm, existingTitleNorm);
    const citySim = incomingCityNorm && existingCityNorm && (incomingCityNorm === existingCityNorm || incomingCityNorm.includes(existingCityNorm) || existingCityNorm.includes(incomingCityNorm)) ? 1.0 : 0.4;
    const tier2 = (companySim * 0.5) + (titleSim * 0.3) + (citySim * 0.2);

    if (companySim >= 0.9) matchedFields.push("hiring_company");
    if (titleSim >= 0.8) matchedFields.push("job_title");
    if (citySim >= 0.8) matchedFields.push("location_city");

    // --- Tier 3: Requirements Alignment (Weight: 15%) ---
    let expScore = 0.5;
    if (facts.experienceMin !== undefined && existing.experienceMin !== undefined) {
      const expDiff = Math.abs(facts.experienceMin - existing.experienceMin);
      expScore = expDiff === 0 ? 1.0 : expDiff <= 1 ? 0.8 : expDiff <= 2 ? 0.6 : 0.2;
    }
    const modeScore = facts.workMode && existing.workMode && facts.workMode === existing.workMode ? 1.0 : 0.5;
    const tier3 = (expScore * 0.6) + (modeScore * 0.4);

    // --- Tier 4: Text Overlap (Weight: 15%) ---
    const incomingText = ((facts as any).responsibilities?.join(" ") || (facts as any).descriptionSummary || facts.title);
    const existingDocText = typeof existing.content === "object" ? JSON.stringify(existing.content) : String(existing.content || "");
    const tier4 = tokenJaccardSimilarity(incomingText, existingDocText);

    // --- Composite Match Score ---
    const compositeScore = Number(((tier1 * 0.40) + (tier2 * 0.30) + (tier3 * 0.15) + (tier4 * 0.15)).toFixed(3));

    if (compositeScore > bestScore) {
      bestScore = compositeScore;
      bestMatch = existing;
      bestTierScores = {
        tier1Requisition: tier1,
        tier2EntitySemantic: tier2,
        tier3Requirements: tier3,
        tier4TextOverlap: tier4
      };

      if (tier1 >= 0.95 && incomingApplyUrl && incomingApplyUrl === existingApplyUrl) {
        bestMatchType = "canonical_url";
        bestMatchReason = `Exact application destination URL match (${existing.company} - ${existing.title})`;
      } else if (tier1 >= 0.95 && incomingReqId && incomingReqId === existingReqId) {
        bestMatchType = "exact_external_id";
        bestMatchReason = `Shared requisition reference: ${incomingReqId} at ${existing.company}`;
      } else if (tier2 >= 0.85) {
        bestMatchType = "title_company_location";
        bestMatchReason = `Identical hiring company (${existing.company}), title (${existing.title}), and location (${existing.location})`;
      } else {
        bestMatchType = "content_similarity";
        bestMatchReason = `High composite similarity (${Math.round(compositeScore * 100)}%) with ${existing.title} at ${existing.company}`;
      }
    }
  }

  // Check fingerprint legacy fallback for exact fingerprint match
  const incomingFingerprint = generateJobFingerprint({
    title: facts.title,
    company: facts.company,
    location: facts.location
  });

  const legacyMatch = existingJobs.find(j => {
    const existingFp = generateJobFingerprint({
      title: j.title,
      company: j.company,
      location: j.location
    });
    return existingFp === incomingFingerprint;
  });

  if (legacyMatch && bestScore < 0.92 && bestTierScores.tier1Requisition < 0.95) {
    bestScore = 0.92;
    bestMatch = legacyMatch;
    bestMatchType = "title_company_location";
    bestMatchReason = `Direct fingerprint match for ${legacyMatch.title} at ${legacyMatch.company}`;
  }

  const isDuplicate = bestScore >= 0.65;
  let matchAction: DuplicateCheckResult["matchAction"] = "distinct_vacancy";

  if (isDuplicate) {
    // Check if same organization
    const incomingOrgId = sourceIdOrOrgId || (facts as { organizationId?: string }).organizationId;
    const existingOrgId = (bestMatch as { organizationId?: string })?.organizationId;
    const isSameOrg = Boolean(incomingOrgId && existingOrgId && incomingOrgId === existingOrgId);

    const hasDeterministicKey = bestTierScores.tier1Requisition >= 0.95;
    if (isSameOrg) {
      matchAction = "block_same_employer";
    } else if (hasDeterministicKey || bestScore >= 0.85) {
      matchAction = "link_authorized_partner";
    } else {
      matchAction = "hold_for_review";
    }
  }

  return {
    isDuplicate,
    matchType: bestMatchType,
    existingJob: bestMatch,
    similarityScore: bestScore,
    compositeScore: bestScore,
    confidenceScore: bestScore,
    matchAction,
    action: matchAction,
    tierScores: bestTierScores,
    matchReason: bestMatchReason,
    reason: bestMatchReason,
    matchedFields: Array.from(new Set(matchedFields))
  };
}
