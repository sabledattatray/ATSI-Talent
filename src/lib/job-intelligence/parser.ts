import { normalizeJobTitle, normalizeEmploymentType, normalizeWorkMode, normalizeSalary } from "./normalizer";
import type { ExtractedJobFacts, FieldEvidenceItem } from "./types";

export interface ParseResult {
  facts: ExtractedJobFacts;
  evidence: Omit<FieldEvidenceItem, "id" | "itemId" | "createdAt">[];
}

/**
 * Parses raw HTML or JSON into structured job facts and field-level evidence.
 */
export function parseJobContent(
  rawContent: string,
  sourceUrl: string,
  sourceName: string
): ParseResult {
  const evidence: Omit<FieldEvidenceItem, "id" | "itemId" | "createdAt">[] = [];

  // 1. Try parsing JSON-LD Schema.org JobPosting
  const jsonLdMatch = rawContent.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const parsedJson = JSON.parse(jsonLdMatch[1]);
      const jobPosting = Array.isArray(parsedJson)
        ? parsedJson.find(i => i["@type"] === "JobPosting")
        : parsedJson["@type"] === "JobPosting"
        ? parsedJson
        : parsedJson["@graph"]?.find((i: { ["@type"]?: string }) => i["@type"] === "JobPosting");

      if (jobPosting) {
        return parseSchemaJobPosting(jobPosting, sourceUrl, sourceName);
      }
    } catch {
      // JSON-LD parse failed, fallback to HTML parsing
    }
  }

  // 2. Direct JSON payload (e.g. from an API connector or fixture)
  if (rawContent.trim().startsWith("{") && rawContent.trim().endsWith("}")) {
    try {
      const directObj = JSON.parse(rawContent);
      if (directObj.title || directObj.jobTitle) {
        return parseDirectJobObject(directObj, sourceUrl, sourceName);
      }
    } catch {
      // continue to HTML fallback
    }
  }

  // 3. Fallback: Parse HTML metadata and text markers
  return parseHtmlFallback(rawContent, sourceUrl, sourceName);
}

/**
 * Extracts facts from a standard Schema.org JobPosting object.
 */
function parseSchemaJobPosting(
  data: Record<string, any>,
  sourceUrl: string,
  sourceName: string
): ParseResult {
  const evidence: Omit<FieldEvidenceItem, "id" | "itemId" | "createdAt">[] = [];

  const rawTitle = data.title || data.jobTitle || "";
  const title = normalizeJobTitle(rawTitle);
  evidence.push({
    field: "title",
    extractedValue: title,
    sourceSnippet: `JobPosting.title: "${rawTitle}"`,
    extractionMethod: "json_ld",
    confidence: 0.98
  });

  const company = typeof data.hiringOrganization === "object"
    ? data.hiringOrganization.name || ""
    : String(data.hiringOrganization || "");
  evidence.push({
    field: "company",
    extractedValue: company,
    sourceSnippet: `JobPosting.hiringOrganization: "${company}"`,
    extractionMethod: "json_ld",
    confidence: 0.95
  });

  let location = "Multiple Locations";
  if (data.jobLocation) {
    const locObj = Array.isArray(data.jobLocation) ? data.jobLocation[0] : data.jobLocation;
    const addr = locObj?.address;
    if (typeof addr === "object") {
      const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
      location = parts.join(", ") || "Multiple Locations";
    } else if (typeof addr === "string") {
      location = addr;
    }
  }
  evidence.push({
    field: "location",
    extractedValue: location,
    sourceSnippet: `JobPosting.jobLocation: "${location}"`,
    extractionMethod: "json_ld",
    confidence: 0.9
  });

  const workMode = data.jobLocationType === "TELECOMMUTE"
    ? "Remote"
    : normalizeWorkMode(data.workLocationType || data.workMode);
  evidence.push({
    field: "workMode",
    extractedValue: workMode,
    sourceSnippet: `jobLocationType: "${data.jobLocationType}", workLocationType: "${data.workLocationType}"`,
    extractionMethod: "json_ld",
    confidence: 0.92
  });

  const employmentType = normalizeEmploymentType(data.employmentType);
  evidence.push({
    field: "employmentType",
    extractedValue: employmentType,
    sourceSnippet: `JobPosting.employmentType: "${data.employmentType}"`,
    extractionMethod: "json_ld",
    confidence: 0.9
  });

  const salary = normalizeSalary(
    data.baseSalary?.value?.minValue ?? data.baseSalary?.value?.value,
    data.baseSalary?.value?.maxValue ?? data.baseSalary?.value?.value,
    data.baseSalary?.currency,
    data.baseSalary?.value?.unitText
  );
  if (salary.salaryDisclosed) {
    evidence.push({
      field: "salary",
      extractedValue: `${salary.salaryCurrency} ${salary.salaryMin}-${salary.salaryMax} / ${salary.salaryPeriod}`,
      sourceSnippet: JSON.stringify(data.baseSalary),
      extractionMethod: "json_ld",
      confidence: 0.95
    });
  }

  const rawDesc = String(data.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const descriptionSummary = rawDesc.slice(0, 300);

  const skills: string[] = Array.isArray(data.skills)
    ? data.skills.map((s: any) => String(s).trim())
    : typeof data.skills === "string"
    ? data.skills.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : [];

  const officialApplyUrl = data.url || data.directApply || sourceUrl;
  evidence.push({
    field: "officialApplyUrl",
    extractedValue: officialApplyUrl,
    sourceSnippet: `JobPosting.url: "${officialApplyUrl}"`,
    extractionMethod: "json_ld",
    confidence: 0.99
  });

  return {
    facts: {
      externalJobId: data.identifier?.value ? String(data.identifier.value) : undefined,
      title,
      company,
      category: data.occupationalCategory || "Technology",
      location,
      workMode,
      employmentType,
      salaryDisclosed: salary.salaryDisclosed,
      salaryMin: salary.salaryMin,
      salaryMax: salary.salaryMax,
      salaryCurrency: salary.salaryCurrency,
      salaryPeriod: salary.salaryPeriod,
      skills,
      descriptionSummary,
      responsibilities: [],
      qualifications: [],
      datePosted: data.datePosted ? String(data.datePosted).slice(0, 10) : undefined,
      validThrough: data.validThrough ? String(data.validThrough).slice(0, 10) : undefined,
      officialApplyUrl,
      sourceUrl,
      sourceAttribution: `Sourced with permission from ${company || sourceName}. Apply on official employer portal.`
    },
    evidence
  };
}

/**
 * Extracts facts from a direct JSON job object (e.g. fixtures or official API).
 */
function parseDirectJobObject(data: Record<string, any>, sourceUrl: string, sourceName: string): ParseResult {
  const evidence: Omit<FieldEvidenceItem, "id" | "itemId" | "createdAt">[] = [];

  const title = normalizeJobTitle(data.title || data.jobTitle || "");
  const company = data.company || data.employerName || sourceName;
  const location = data.location || data.jobCity || "India";
  const workMode = normalizeWorkMode(data.workMode || data.workplaceType);
  const employmentType = normalizeEmploymentType(data.employmentType);
  const salary = normalizeSalary(data.salaryMin, data.salaryMax, data.salaryCurrency, data.salaryPeriod);

  evidence.push({
    field: "title",
    extractedValue: title,
    sourceSnippet: `title: "${title}"`,
    extractionMethod: "parser",
    confidence: 0.95
  });

  evidence.push({
    field: "company",
    extractedValue: company,
    sourceSnippet: `company: "${company}"`,
    extractionMethod: "parser",
    confidence: 0.95
  });

  const officialApplyUrl = data.officialApplyUrl || data.applicationUrl || data.applyUrl || data.url || sourceUrl;
  evidence.push({
    field: "officialApplyUrl",
    extractedValue: officialApplyUrl,
    sourceSnippet: `officialApplyUrl: "${officialApplyUrl}"`,
    extractionMethod: "parser",
    confidence: 0.98
  });

  return {
    facts: {
      externalJobId: data.externalJobId || data.id,
      title,
      company,
      category: data.category || "Technology",
      location,
      workMode,
      employmentType,
      salaryDisclosed: salary.salaryDisclosed,
      salaryMin: salary.salaryMin,
      salaryMax: salary.salaryMax,
      salaryCurrency: salary.salaryCurrency,
      salaryPeriod: salary.salaryPeriod,
      experienceMin: typeof data.experienceMin === "number" ? data.experienceMin : undefined,
      experienceMax: typeof data.experienceMax === "number" ? data.experienceMax : undefined,
      skills: Array.isArray(data.skills) ? data.skills : typeof data.skills === "string" ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      descriptionSummary: data.summary || data.description || "",
      responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
      qualifications: Array.isArray(data.qualifications) ? data.qualifications : [],
      datePosted: data.datePosted || data.createdAt?.slice(0, 10),
      validThrough: data.expiresAt ? data.expiresAt.slice(0, 10) : undefined,
      officialApplyUrl,
      sourceUrl,
      sourceAttribution: `Sourced with permission from ${company}. Apply on official employer portal.`
    },
    evidence
  };
}

/**
 * Fallback parser for standard HTML pages with OpenGraph or meta tags.
 */
function parseHtmlFallback(html: string, sourceUrl: string, sourceName: string): ParseResult {
  const evidence: Omit<FieldEvidenceItem, "id" | "itemId" | "createdAt">[] = [];

  const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                     html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].replace(/\s*[-|·].*$/, "") : "Open Position";
  const title = normalizeJobTitle(rawTitle);

  evidence.push({
    field: "title",
    extractedValue: title,
    sourceSnippet: `HTML title: "${titleMatch ? titleMatch[0] : ""}"`,
    extractionMethod: "meta",
    confidence: 0.8
  });

  const companyMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  const company = companyMatch ? companyMatch[1].trim() : sourceName;
  evidence.push({
    field: "company",
    extractedValue: company,
    sourceSnippet: `og:site_name: "${company}"`,
    extractionMethod: "meta",
    confidence: 0.85
  });

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const descriptionSummary = descMatch ? descMatch[1].trim() : "";

  return {
    facts: {
      title,
      company,
      category: "Technology",
      location: "India",
      workMode: normalizeWorkMode(html.slice(0, 3000)),
      employmentType: "Full-time",
      salaryDisclosed: false,
      skills: [],
      descriptionSummary,
      responsibilities: [],
      qualifications: [],
      officialApplyUrl: sourceUrl,
      sourceUrl,
      sourceAttribution: `Sourced with permission from ${company}. Apply on official employer portal.`
    },
    evidence
  };
}
