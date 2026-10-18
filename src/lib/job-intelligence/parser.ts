import { normalizeJobTitle, normalizeEmploymentType, normalizeWorkMode, normalizeSalary } from "./normalizer";
import { extractHtmlSections, extractExperienceFromText, extractEducationFromText, decodeHtmlEntities } from "./html-parser";
import type { ExtractedJobFacts, FieldEvidenceItem, AuthBasis } from "./types";

export interface ParseResult {
  facts: ExtractedJobFacts;
  evidence: Omit<FieldEvidenceItem, "id" | "itemId" | "createdAt">[];
}

/**
 * Returns accurate legal attribution notice based on explicit recorded authorization basis.
 * PRD: Never claim "sourced with permission" unless documented written authorization exists.
 */
export function getLegalAttribution(company: string, authBasis?: AuthBasis): { attribution: string; isIndependentCurated: boolean } {
  const isAuthorized = authBasis === "direct_owner" || authBasis === "written_permission" || authBasis === "license";
  if (isAuthorized) {
    return {
      attribution: `Verified Career Listing: Sourced with permission from ${company}. Apply directly through the official employer portal.`,
      isIndependentCurated: false
    };
  }

  return {
    attribution: "This vacancy is independently summarized from the employer's public career listing. ATSAI is not affiliated with or recruiting on behalf of the employer. Apply directly through the official employer website.",
    isIndependentCurated: true
  };
}

/**
 * Parses raw HTML, JSON-LD, or structured ATS API responses into complete job facts and field-level evidence.
 */
export function parseJobContent(
  rawContent: string,
  sourceUrl: string,
  sourceName: string,
  authBasis?: AuthBasis
): ParseResult {
  const evidence: Omit<FieldEvidenceItem, "id" | "itemId" | "createdAt">[] = [];

  // 1. Check if direct JSON payload (e.g. from Greenhouse API, Lever API, or Direct Feed)
  const trimmed = rawContent.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const json = JSON.parse(trimmed);

      // Greenhouse API payload
      if (json.requisition_id !== undefined || (json.content && json.absolute_url?.includes("greenhouse.io"))) {
        return parseGreenhouseApiPayload(json, sourceUrl, sourceName, authBasis);
      }

      // Lever API payload
      if (json.hostedUrl?.includes("lever.co") || (json.categories && json.descriptionBody !== undefined)) {
        return parseLeverApiPayload(json, sourceUrl, sourceName, authBasis);
      }

      // Schema.org JobPosting or Direct Object
      if (json["@type"] === "JobPosting") {
        return parseSchemaJobPosting(json, sourceUrl, sourceName, authBasis);
      }
      if (json.title || json.jobTitle) {
        return parseDirectJobObject(json, sourceUrl, sourceName, authBasis);
      }
    } catch {
      // continue to HTML parsing
    }
  }

  // 2. Try parsing JSON-LD Schema.org JobPosting inside HTML
  const jsonLdMatches = rawContent.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const parsedJson = JSON.parse(match[1]);
      const jobPosting = Array.isArray(parsedJson)
        ? parsedJson.find(i => i["@type"] === "JobPosting")
        : parsedJson["@type"] === "JobPosting"
        ? parsedJson
        : parsedJson["@graph"]?.find((i: { ["@type"]?: string }) => i["@type"] === "JobPosting");

      if (jobPosting) {
        return parseSchemaJobPosting(jobPosting, sourceUrl, sourceName, authBasis, rawContent);
      }
    } catch {
      // try next block
    }
  }

  // 3. Fallback: Parse HTML body, headings, lists, and metadata
  return parseHtmlFallback(rawContent, sourceUrl, sourceName, authBasis);
}

/**
 * Extracts facts from an official Greenhouse Board API payload.
 */
function parseGreenhouseApiPayload(
  data: Record<string, any>,
  sourceUrl: string,
  sourceName: string,
  authBasis?: AuthBasis
): ParseResult {
  const evidence: Omit<FieldEvidenceItem, "id" | "itemId" | "createdAt">[] = [];

  const rawTitle = data.title || "";
  const title = normalizeJobTitle(rawTitle);
  evidence.push({
    field: "title",
    extractedValue: title,
    sourceSnippet: `Greenhouse API title: "${rawTitle}"`,
    extractionMethod: "json_ld",
    confidence: 0.99
  });

  const company = data.company_name || sourceName;
  evidence.push({
    field: "company",
    extractedValue: company,
    sourceSnippet: `Greenhouse company_name: "${company}"`,
    extractionMethod: "json_ld",
    confidence: 0.98
  });

  const location = data.location?.name || "Multiple Locations";
  evidence.push({
    field: "location",
    extractedValue: location,
    sourceSnippet: `Greenhouse location.name: "${location}"`,
    extractionMethod: "json_ld",
    confidence: 0.95
  });

  const workMode = normalizeWorkMode(location + " " + (data.content || ""));
  const employmentType = normalizeEmploymentType(data.content);

  // Parse rich HTML content from Greenhouse
  const sections = extractHtmlSections(data.content || "");
  const exp = extractExperienceFromText(sections.rawText);
  const education = extractEducationFromText(sections.rawText);

  const officialApplyUrl = data.absolute_url || sourceUrl;
  evidence.push({
    field: "officialApplyUrl",
    extractedValue: officialApplyUrl,
    sourceSnippet: `Greenhouse absolute_url: "${officialApplyUrl}"`,
    extractionMethod: "json_ld",
    confidence: 0.99
  });

  const { attribution, isIndependentCurated } = getLegalAttribution(company, authBasis);

  return {
    facts: {
      externalJobId: String(data.requisition_id || data.id || ""),
      title,
      company,
      category: data.departments?.[0]?.name || "Technology",
      department: data.departments?.[0]?.name,
      location,
      workMode,
      employmentType,
      salaryDisclosed: false,
      experienceMin: exp.min,
      experienceMax: exp.max,
      experienceStated: exp.stated,
      education,
      skills: sections.skills,
      descriptionSummary: sections.summary || title,
      fullDescriptionHtml: data.content,
      responsibilities: sections.responsibilities,
      qualifications: sections.qualifications,
      preferredQualifications: sections.preferredQualifications,
      benefits: sections.benefits,
      datePosted: data.first_published ? String(data.first_published).slice(0, 10) : undefined,
      updatedAt: data.updated_at ? String(data.updated_at).slice(0, 10) : undefined,
      validThrough: data.application_deadline ? String(data.application_deadline).slice(0, 10) : undefined,
      officialApplyUrl,
      sourceUrl,
      sourceAttribution: attribution,
      isIndependentCurated,
      atsProvider: "greenhouse",
      rawSourcePayload: JSON.stringify(data)
    },
    evidence
  };
}

/**
 * Extracts facts from an official Lever Posting API payload.
 */
function parseLeverApiPayload(
  data: Record<string, any>,
  sourceUrl: string,
  sourceName: string,
  authBasis?: AuthBasis
): ParseResult {
  const evidence: Omit<FieldEvidenceItem, "id" | "itemId" | "createdAt">[] = [];

  const rawTitle = data.text || "";
  const title = normalizeJobTitle(rawTitle);
  evidence.push({
    field: "title",
    extractedValue: title,
    sourceSnippet: `Lever API text: "${rawTitle}"`,
    extractionMethod: "json_ld",
    confidence: 0.99
  });

  const company = data.company || sourceName;
  const location = data.categories?.location || "India";
  evidence.push({
    field: "location",
    extractedValue: location,
    sourceSnippet: `Lever categories.location: "${location}"`,
    extractionMethod: "json_ld",
    confidence: 0.95
  });

  const workMode = normalizeWorkMode(data.workplaceType || location);
  const employmentType = normalizeEmploymentType(data.categories?.commitment);

  const salary = normalizeSalary(
    data.salaryRange?.min,
    data.salaryRange?.max,
    data.salaryRange?.currency,
    data.salaryRange?.interval
  );

  // Extract responsibilities and qualifications from Lever's structured lists
  const responsibilities: string[] = [];
  const qualifications: string[] = [];
  const preferredQualifications: string[] = [];

  if (Array.isArray(data.lists)) {
    for (const list of data.lists) {
      const heading = String(list.text || "").toLowerCase();
      const items = (list.content || "").split(/<\/li>/i)
        .map((item: string) => item.replace(/<[^>]+>/g, "").trim())
        .filter(Boolean);

      if (/responsibilit|do|duties|role/i.test(heading)) {
        responsibilities.push(...items);
      } else if (/preferred|nice|bonus/i.test(heading)) {
        preferredQualifications.push(...items);
      } else if (/qualificat|requirement|need|looking for/i.test(heading)) {
        qualifications.push(...items);
      } else {
        responsibilities.push(...items);
      }
    }
  }

  const rawBody = data.descriptionBodyPlain || data.descriptionPlain || "";
  const sections = extractHtmlSections(data.descriptionBody || data.description || "");
  const exp = extractExperienceFromText(rawBody + " " + qualifications.join(" "));
  const education = extractEducationFromText(rawBody + " " + qualifications.join(" "));

  const officialApplyUrl = data.applyUrl || data.hostedUrl || sourceUrl;
  const { attribution, isIndependentCurated } = getLegalAttribution(company, authBasis);

  return {
    facts: {
      externalJobId: data.id,
      title,
      company,
      category: data.categories?.team || "Technology",
      department: data.categories?.department,
      location,
      workMode,
      employmentType,
      salaryDisclosed: salary.salaryDisclosed,
      salaryMin: salary.salaryMin,
      salaryMax: salary.salaryMax,
      salaryCurrency: salary.salaryCurrency,
      salaryPeriod: salary.salaryPeriod,
      experienceMin: exp.min,
      experienceMax: exp.max,
      experienceStated: exp.stated,
      education,
      skills: sections.skills,
      descriptionSummary: sections.summary || rawBody.slice(0, 500) || title,
      fullDescriptionHtml: data.descriptionBody || data.description,
      responsibilities: responsibilities.length > 0 ? responsibilities : sections.responsibilities,
      qualifications: qualifications.length > 0 ? qualifications : sections.qualifications,
      preferredQualifications: preferredQualifications.length > 0 ? preferredQualifications : sections.preferredQualifications,
      benefits: sections.benefits,
      datePosted: data.createdAt ? new Date(data.createdAt).toISOString().slice(0, 10) : undefined,
      officialApplyUrl,
      sourceUrl,
      sourceAttribution: attribution,
      isIndependentCurated,
      atsProvider: "lever",
      rawSourcePayload: JSON.stringify(data)
    },
    evidence
  };
}

/**
 * Extracts facts from a standard Schema.org JobPosting object.
 */
function parseSchemaJobPosting(
  data: Record<string, any>,
  sourceUrl: string,
  sourceName: string,
  authBasis?: AuthBasis,
  fullHtmlContext?: string
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
    ? data.hiringOrganization.name || sourceName
    : String(data.hiringOrganization || sourceName);
  evidence.push({
    field: "company",
    extractedValue: company,
    sourceSnippet: `JobPosting.hiringOrganization: "${company}"`,
    extractionMethod: "json_ld",
    confidence: 0.95
  });

  let location = "Multiple Locations";
  let city: string | undefined;
  let state: string | undefined;
  let country: string | undefined;

  if (data.jobLocation) {
    const locObj = Array.isArray(data.jobLocation) ? data.jobLocation[0] : data.jobLocation;
    const addr = locObj?.address;
    if (typeof addr === "object") {
      city = addr.addressLocality;
      state = addr.addressRegion;
      country = addr.addressCountry;
      const parts = [city, state, country].filter(Boolean);
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
    sourceSnippet: `jobLocationType: "${data.jobLocationType}"`,
    extractionMethod: "json_ld",
    confidence: 0.92
  });

  const employmentType = normalizeEmploymentType(data.employmentType);

  const salary = normalizeSalary(
    data.baseSalary?.value?.minValue ?? data.baseSalary?.value?.value,
    data.baseSalary?.value?.maxValue ?? data.baseSalary?.value?.value,
    data.baseSalary?.currency,
    data.baseSalary?.value?.unitText
  );

  // Parse complete description without artificial truncation
  const rawDescHtml = String(data.description || fullHtmlContext || "");
  const sections = extractHtmlSections(rawDescHtml);

  // Skills
  const directSkills: string[] = Array.isArray(data.skills)
    ? data.skills.map((s: any) => String(s).trim())
    : typeof data.skills === "string"
    ? data.skills.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : [];
  const mergedSkills = Array.from(new Set([...directSkills, ...sections.skills]));

  // Responsibilities & Qualifications from Schema or HTML
  const directResp = Array.isArray(data.responsibilities) ? data.responsibilities : [];
  const directQual = Array.isArray(data.qualifications) ? data.qualifications : [];

  const responsibilities = directResp.length > 0 ? directResp : sections.responsibilities;
  const qualifications = directQual.length > 0 ? directQual : sections.qualifications;

  // Experience and Education
  const exp = extractExperienceFromText(sections.rawText);
  const education = data.educationRequirements || extractEducationFromText(sections.rawText);

  const officialApplyUrl = data.url || data.directApply || sourceUrl;
  evidence.push({
    field: "officialApplyUrl",
    extractedValue: officialApplyUrl,
    sourceSnippet: `JobPosting.url: "${officialApplyUrl}"`,
    extractionMethod: "json_ld",
    confidence: 0.99
  });

  const { attribution, isIndependentCurated } = getLegalAttribution(company, authBasis);

  return {
    facts: {
      externalJobId: data.identifier?.value ? String(data.identifier.value) : undefined,
      title,
      company,
      companyCareersUrl: typeof data.hiringOrganization === "object" ? data.hiringOrganization.sameAs : undefined,
      category: data.occupationalCategory || "Technology",
      location,
      city,
      state,
      country,
      workMode,
      employmentType,
      salaryDisclosed: salary.salaryDisclosed,
      salaryMin: salary.salaryMin,
      salaryMax: salary.salaryMax,
      salaryCurrency: salary.salaryCurrency,
      salaryPeriod: salary.salaryPeriod,
      experienceMin: exp.min,
      experienceMax: exp.max,
      experienceStated: exp.stated,
      education,
      skills: mergedSkills,
      descriptionSummary: sections.summary || title,
      fullDescriptionHtml: rawDescHtml,
      responsibilities,
      qualifications,
      preferredQualifications: sections.preferredQualifications,
      benefits: sections.benefits,
      datePosted: data.datePosted ? String(data.datePosted).slice(0, 10) : undefined,
      validThrough: data.validThrough ? String(data.validThrough).slice(0, 10) : undefined,
      officialApplyUrl,
      sourceUrl,
      sourceAttribution: attribution,
      isIndependentCurated,
      atsProvider: "generic",
      rawSourcePayload: JSON.stringify(data)
    },
    evidence
  };
}

/**
 * Extracts facts from a direct JSON job object (e.g. fixtures or partner feeds).
 */
function parseDirectJobObject(
  data: Record<string, any>,
  sourceUrl: string,
  sourceName: string,
  authBasis?: AuthBasis
): ParseResult {
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

  const { attribution, isIndependentCurated } = getLegalAttribution(company, authBasis);

  return {
    facts: {
      externalJobId: data.externalJobId || data.id,
      title,
      company,
      category: data.category || "Technology",
      department: data.department,
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
      education: data.education,
      skills: Array.isArray(data.skills) ? data.skills : typeof data.skills === "string" ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      descriptionSummary: data.summary || data.description || "",
      responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
      qualifications: Array.isArray(data.qualifications) ? data.qualifications : [],
      preferredQualifications: Array.isArray(data.preferredQualifications) ? data.preferredQualifications : [],
      benefits: Array.isArray(data.benefits) ? data.benefits : [],
      datePosted: data.datePosted || data.createdAt?.slice(0, 10),
      validThrough: data.expiresAt ? data.expiresAt.slice(0, 10) : undefined,
      officialApplyUrl,
      sourceUrl,
      sourceAttribution: attribution,
      isIndependentCurated,
      atsProvider: "generic",
      rawSourcePayload: JSON.stringify(data)
    },
    evidence
  };
}

/**
 * Fallback parser for standard HTML pages with structured DOM section analysis.
 */
function parseHtmlFallback(
  html: string,
  sourceUrl: string,
  sourceName: string,
  authBasis?: AuthBasis
): ParseResult {
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
  let company = companyMatch ? companyMatch[1].trim() : "";
  if (!company) {
    const fullTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (fullTitleMatch) {
      const atMatch = fullTitleMatch[1].match(/\bat\s+([A-Za-z0-9\s&.,-]+?)(?:\s+Careers|\s*[-|·]|$)/i);
      if (atMatch && atMatch[1].trim()) {
        company = atMatch[1].trim();
      }
    }
  }
  if (!company) company = sourceName;

  evidence.push({
    field: "company",
    extractedValue: company,
    sourceSnippet: `Extracted company: "${company}"`,
    extractionMethod: "meta",
    confidence: 0.88
  });

  // Extract sections from body
  const sections = extractHtmlSections(html);
  const exp = extractExperienceFromText(sections.rawText);
  const education = extractEducationFromText(sections.rawText);

  let location = "India";
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) {
    const locInDesc = descMatch[1].match(/\b(?:in|at)\s+([A-Za-z\s,]+)$/i);
    if (locInDesc) {
      location = locInDesc[1].trim();
    }
  }

  const { attribution, isIndependentCurated } = getLegalAttribution(company, authBasis);

  return {
    facts: {
      title,
      company,
      category: "Technology",
      location,
      workMode: normalizeWorkMode(html.slice(0, 4000)),
      employmentType: normalizeEmploymentType(html.slice(0, 4000)),
      salaryDisclosed: false,
      experienceMin: exp.min,
      experienceMax: exp.max,
      experienceStated: exp.stated,
      education,
      skills: sections.skills,
      descriptionSummary: sections.summary || (descMatch ? descMatch[1].trim() : title),
      fullDescriptionHtml: html,
      responsibilities: sections.responsibilities,
      qualifications: sections.qualifications,
      preferredQualifications: sections.preferredQualifications,
      benefits: sections.benefits,
      officialApplyUrl: sourceUrl,
      sourceUrl,
      sourceAttribution: attribution,
      isIndependentCurated,
      atsProvider: "generic",
      rawSourcePayload: html.slice(0, 10000)
    },
    evidence
  };
}
