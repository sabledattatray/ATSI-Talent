import type { ExtractedJobFacts } from "./types";

/**
 * Normalizes workplace type according to PRD Section 6.2:
 * "remote must not be inferred from keywords such as 'flexible' or 'digital'.
 * Ambiguous remote work stays unknown, not 'Remote'."
 */
export function normalizeWorkMode(raw: string | undefined): "On-site" | "Hybrid" | "Remote" | "Unknown" {
  if (!raw) return "Unknown";
  const val = raw.toLowerCase().trim();

  if (/hybrid|flexible\s+remote|partially\s+remote|\b\d+\s+days?\s+(in\s+office|remote|from\s+home)\b/.test(val)) {
    return "Hybrid";
  }
  if (/\b(remote|telecommute|work\s+from\s+home|wfh)\b/.test(val)) {
    return "Remote";
  }
  if (/onsite|on-site|office|in-office|in-person|at\s+location/.test(val)) {
    return "On-site";
  }

  return "Unknown";
}

/**
 * Normalizes employment type according to Schema.org and ATSAI standards.
 */
export function normalizeEmploymentType(raw: string | undefined): "Full-time" | "Part-time" | "Contract" | "Internship" | "Temporary" {
  if (!raw) return "Full-time";
  const val = raw.toLowerCase().trim();

  if (/part[- ]?time/.test(val)) return "Part-time";
  if (/contract|freelance|consultant|temp[- ]?to[- ]?hire/.test(val)) return "Contract";
  if (/intern|internship|trainee/.test(val)) return "Internship";
  if (/temporary|seasonal/.test(val)) return "Temporary";

  return "Full-time";
}

/**
 * Normalizes salary inputs. Missing or zero values are strictly marked as undisclosed.
 */
export function normalizeSalary(
  minRaw?: number | string,
  maxRaw?: number | string,
  currencyRaw?: string,
  periodRaw?: string
): {
  salaryDisclosed: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: "YEAR" | "MONTH" | "WEEK" | "DAY" | "HOUR";
} {
  const min = typeof minRaw === "number" ? minRaw : Number.parseInt(String(minRaw || "0").replace(/[^0-9]/g, ""), 10) || 0;
  const max = typeof maxRaw === "number" ? maxRaw : Number.parseInt(String(maxRaw || "0").replace(/[^0-9]/g, ""), 10) || 0;

  if (min <= 0 && max <= 0) {
    return {
      salaryDisclosed: false,
      salaryMin: undefined,
      salaryMax: undefined,
      salaryCurrency: undefined,
      salaryPeriod: undefined
    };
  }

  let period: "YEAR" | "MONTH" | "WEEK" | "DAY" | "HOUR" = "YEAR";
  if (periodRaw) {
    const p = periodRaw.toUpperCase();
    if (p.includes("HOUR")) period = "HOUR";
    else if (p.includes("DAY")) period = "DAY";
    else if (p.includes("WEEK")) period = "WEEK";
    else if (p.includes("MONTH")) period = "MONTH";
    else period = "YEAR";
  }

  const currency = (currencyRaw || "INR").toUpperCase().trim().slice(0, 3);

  return {
    salaryDisclosed: true,
    salaryMin: min > 0 ? min : max,
    salaryMax: max > 0 ? max : min,
    salaryCurrency: currency,
    salaryPeriod: period
  };
}

/**
 * Cleans and normalizes job title text.
 */
export function normalizeJobTitle(title: string): string {
  if (!title) return "";
  return title
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates a normalized fingerprint for near-duplicate identification.
 */
export function generateJobFingerprint(facts: Pick<ExtractedJobFacts, "title" | "company" | "location">): string {
  const cleanTitle = (facts.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanCompany = (facts.company || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanLocation = (facts.location || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleanCompany}:${cleanTitle}:${cleanLocation}`;
}
