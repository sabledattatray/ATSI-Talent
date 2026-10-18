import type {
  ExtractedJobFacts,
  JobSource,
  VerificationCheck,
  VerificationResult,
  CompletenessCheck,
  CompletenessResult,
  AuthenticityStatus,
  PublicationRights
} from "./types";

/**
 * Evaluates the Content Completeness of a job listing (0–100%).
 * Strictly ensures thin pages cannot receive a 100% score.
 * Missing salary or deadline does NOT block completeness if not disclosed by the employer.
 */
export function evaluateJobCompleteness(facts: ExtractedJobFacts): CompletenessResult {
  const checks: CompletenessCheck[] = [];
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // 1. Job Title (10 max)
  const hasTitle = Boolean(facts.title && facts.title.trim().length >= 3);
  if (!hasTitle) missingFields.push("Job Title");
  checks.push({
    code: "TITLE",
    field: "title",
    label: "Job Title",
    present: hasTitle,
    score: hasTitle ? 10 : 0,
    maxScore: 10,
    detail: hasTitle ? `Title stated: "${facts.title}"` : "Missing or invalid job title"
  });

  // 2. Company / Employer (10 max)
  const hasCompany = Boolean(facts.company && facts.company.trim().length >= 2);
  if (!hasCompany) missingFields.push("Employer Name");
  checks.push({
    code: "COMPANY",
    field: "company",
    label: "Employer Name",
    present: hasCompany,
    score: hasCompany ? 10 : 0,
    maxScore: 10,
    detail: hasCompany ? `Employer: "${facts.company}"` : "Missing employer name"
  });

  // 3. Location & Workplace Type (10 max)
  const hasLocation = Boolean(facts.location && facts.location.trim().length > 0 && facts.location !== "Unknown");
  const hasWorkMode = facts.workMode !== "Unknown";
  const locScore = (hasLocation ? 5 : 0) + (hasWorkMode ? 5 : 0);
  if (!hasLocation) missingFields.push("Location");
  if (!hasWorkMode) warnings.push("Work arrangement (Remote/Hybrid/Onsite) not disclosed");
  checks.push({
    code: "LOCATION_WORKMODE",
    field: "location",
    label: "Location & Workplace Model",
    present: hasLocation && hasWorkMode,
    score: locScore,
    maxScore: 10,
    detail: `Location: ${facts.location || "Unspecified"}, Model: ${facts.workMode}`
  });

  // 4. Detailed Role Overview / Summary (15 max)
  const summaryLen = (facts.descriptionSummary || "").trim().length;
  let summaryScore = 0;
  if (summaryLen >= 150) summaryScore = 15;
  else if (summaryLen >= 50) summaryScore = 8;
  else missingFields.push("Role Overview / Summary");

  checks.push({
    code: "SUMMARY",
    field: "descriptionSummary",
    label: "Role Overview & Summary",
    present: summaryLen >= 50,
    score: summaryScore,
    maxScore: 15,
    detail: summaryLen >= 50 ? `${summaryLen} chars of role description` : "Role overview is too thin or missing"
  });

  // 5. Key Responsibilities (20 max)
  const respCount = (facts.responsibilities || []).length;
  let respScore = 0;
  if (respCount >= 3) respScore = 20;
  else if (respCount >= 1) respScore = 10;
  else missingFields.push("Key Responsibilities");

  checks.push({
    code: "RESPONSIBILITIES",
    field: "responsibilities",
    label: "Key Responsibilities",
    present: respCount >= 1,
    score: respScore,
    maxScore: 20,
    detail: respCount > 0 ? `${respCount} verified responsibility items` : "No specific responsibilities extracted"
  });

  // 6. Qualifications & Requirements (20 max)
  const qualCount = (facts.qualifications || []).length;
  let qualScore = 0;
  if (qualCount >= 3) qualScore = 20;
  else if (qualCount >= 1) qualScore = 10;
  else missingFields.push("Qualifications / Requirements");

  checks.push({
    code: "QUALIFICATIONS",
    field: "qualifications",
    label: "Candidate Qualifications",
    present: qualCount >= 1,
    score: qualScore,
    maxScore: 20,
    detail: qualCount > 0 ? `${qualCount} verified qualification items` : "No specific qualifications extracted"
  });

  // 7. Technical Skills & Tools (10 max)
  const skillsCount = (facts.skills || []).length;
  let skillsScore = 0;
  if (skillsCount >= 2) skillsScore = 10;
  else if (skillsCount === 1) skillsScore = 5;
  else warnings.push("No explicit technical skills extracted");

  checks.push({
    code: "SKILLS",
    field: "skills",
    label: "Identified Skills & Tools",
    present: skillsCount >= 1,
    score: skillsScore,
    maxScore: 10,
    detail: skillsCount > 0 ? `${skillsCount} skills identified` : "No skills extracted"
  });

  // 8. Official Application Destination (5 max)
  const hasApply = Boolean(facts.officialApplyUrl && facts.officialApplyUrl.startsWith("http"));
  if (!hasApply) missingFields.push("Official Apply URL");
  checks.push({
    code: "APPLY_URL",
    field: "officialApplyUrl",
    label: "Official Apply Destination",
    present: hasApply,
    score: hasApply ? 5 : 0,
    maxScore: 5,
    detail: hasApply ? facts.officialApplyUrl : "Missing or invalid application destination"
  });

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);

  // A listing is only complete if it has sufficient substance
  const hasSubstance = (summaryLen >= 100) || (respCount >= 1) || (qualCount >= 1);
  const isComplete = totalScore >= 65 && hasTitle && hasCompany && hasApply && hasSubstance;

  return {
    score: totalScore,
    isComplete,
    missingFields,
    warnings,
    checks
  };
}

/**
 * Runs the deterministic verification engine producing three independent scores:
 * 1. Source authenticity (Verified / Unverified)
 * 2. Content completeness (0–100%)
 * 3. Publication rights (Authorized / Review / Blocked)
 */
export function verifyJobFacts(
  facts: ExtractedJobFacts,
  source: JobSource
): VerificationResult {
  const checks: VerificationCheck[] = [];
  const hardBlocks: string[] = [];
  const warnings: string[] = [];

  // 1. Evaluate Completeness
  const completeness = evaluateJobCompleteness(facts);

  // 2. Source Authenticity Score
  const isSourceActive = source.status === "active";
  const isDirectOrLicensed = source.authBasis === "direct_owner" || source.authBasis === "written_permission" || source.authBasis === "license";
  const authenticityStatus: AuthenticityStatus = (isSourceActive && isDirectOrLicensed) ? "Verified" : "Unverified";

  if (!isSourceActive) {
    hardBlocks.push(`Source '${source.name}' is currently ${source.status} and cannot publish vacancies.`);
  }

  // 3. Deadline Check
  let isNotExpired = true;
  if (facts.validThrough) {
    const expiryTimestamp = Date.parse(facts.validThrough + "T23:59:59Z");
    if (!Number.isNaN(expiryTimestamp) && expiryTimestamp < Date.now()) {
      isNotExpired = false;
      hardBlocks.push(`Vacancy deadline (${facts.validThrough}) has already passed.`);
    }
  }

  // 4. Official Apply URL Check
  let hasValidApplyUrl = false;
  try {
    const parsedApply = new URL(facts.officialApplyUrl);
    hasValidApplyUrl = parsedApply.protocol === "https:" || parsedApply.protocol === "http:";
  } catch {
    hasValidApplyUrl = false;
  }
  if (!hasValidApplyUrl) {
    hardBlocks.push("Missing or malformed official application URL.");
  }

  // 5. Title Minimum Check
  if (!facts.title || facts.title.trim().length < 3) {
    hardBlocks.push("Missing or invalid job title (minimum 3 characters required).");
  }
  if (!facts.company || facts.company.trim().length < 2) {
    hardBlocks.push("Missing or invalid employer company name.");
  }

  // 6. Consistency Check
  if (facts.salaryDisclosed && facts.salaryMin && facts.salaryMax && facts.salaryMin > facts.salaryMax) {
    hardBlocks.push("Salary minimum cannot exceed salary maximum.");
  }

  // 7. Determine Publication Rights
  let publicationRights: PublicationRights = "Review";
  if (hardBlocks.length > 0) {
    publicationRights = "Blocked";
  } else if (!completeness.isComplete) {
    publicationRights = "Review"; // Incomplete content must never auto-publish
  } else if (source.authBasis === "direct_owner" && source.autoPublish) {
    publicationRights = "Authorized";
  } else if (source.authBasis === "written_permission" && source.autoPublish) {
    publicationRights = "Authorized";
  } else {
    publicationRights = "Review"; // External manual reference or API terms require review
  }

  // Verification checks array for UI display
  checks.push({
    code: "SOURCE_AUTH",
    label: "Source Authorization & Authenticity",
    passed: isSourceActive,
    score: isSourceActive ? 25 : 0,
    weight: 25,
    severity: "hard_block",
    message: `Source: ${source.name} (${authenticityStatus}, Basis: ${source.authBasis})`
  });

  checks.push({
    code: "ACTIVE_DEADLINE",
    label: "Active Vacancy Evidence",
    passed: isNotExpired,
    score: isNotExpired ? 25 : 0,
    weight: 25,
    severity: "hard_block",
    message: isNotExpired ? "Active vacancy with unexpired deadline." : `Application deadline passed on ${facts.validThrough}.`
  });

  checks.push({
    code: "OFFICIAL_APPLY",
    label: "Official Apply Destination",
    passed: hasValidApplyUrl,
    score: hasValidApplyUrl ? 25 : 0,
    weight: 25,
    severity: "hard_block",
    message: hasValidApplyUrl ? `Valid destination: ${facts.officialApplyUrl}` : "Invalid or missing application link."
  });

  checks.push({
    code: "CONTENT_COMPLETENESS",
    label: "Content Completeness Score",
    passed: completeness.isComplete,
    score: Math.round((completeness.score / 100) * 25),
    weight: 25,
    severity: completeness.isComplete ? "info" : "warning",
    message: `Completeness: ${completeness.score}% (${completeness.isComplete ? "Complete" : "Incomplete — review required"}). Missing: ${completeness.missingFields.join(", ") || "None"}.`
  });

  // Aggregate verification score (blends checks and completeness)
  const aggregateScore = Math.round((checks.reduce((sum, c) => sum + c.score, 0) + completeness.score) / 2);

  return {
    score: aggregateScore,
    isPublishable: hardBlocks.length === 0 && completeness.isComplete && publicationRights !== "Blocked",
    authenticityStatus,
    completeness,
    publicationRights,
    checks,
    hardBlocks,
    warnings: [...warnings, ...completeness.warnings]
  };
}
