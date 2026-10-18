import type { ExtractedJobFacts, JobSource, VerificationCheck, VerificationResult } from "./types";

/**
 * Runs the deterministic 100-point verification engine and checks for any hard publication blocks.
 */
export function verifyJobFacts(
  facts: ExtractedJobFacts,
  source: JobSource
): VerificationResult {
  const checks: VerificationCheck[] = [];
  const hardBlocks: string[] = [];
  const warnings: string[] = [];

  // Check 1: Source Permission & Active Status (Weight: 20)
  const isSourceActive = source.status === "active";
  if (!isSourceActive) {
    hardBlocks.push(`Source '${source.name}' is currently ${source.status} and cannot publish vacancies.`);
  }
  checks.push({
    code: "SOURCE_PERMISSION",
    label: "Source Authorization & Active Status",
    passed: isSourceActive,
    score: isSourceActive ? 20 : 0,
    weight: 20,
    severity: "hard_block",
    message: isSourceActive
      ? `Source '${source.name}' has documented authorization (${source.authBasis}).`
      : `Source is ${source.status}.`
  });

  // Check 2: Employer Authenticity & Attribution (Weight: 20)
  const hasValidCompany = Boolean(facts.company && facts.company.trim().length >= 2);
  if (!hasValidCompany) {
    hardBlocks.push("Missing verified hiring organization / employer name.");
  }
  checks.push({
    code: "EMPLOYER_AUTHENTICITY",
    label: "Employer Authenticity",
    passed: hasValidCompany,
    score: hasValidCompany ? 20 : 0,
    weight: 20,
    severity: "hard_block",
    message: hasValidCompany
      ? `Verified employer name: "${facts.company}".`
      : "No valid employer name detected."
  });

  // Check 3: Active Vacancy Evidence & Validity (Weight: 20)
  let isNotExpired = true;
  if (facts.validThrough) {
    const expiryTimestamp = Date.parse(facts.validThrough + "T23:59:59Z");
    if (!Number.isNaN(expiryTimestamp) && expiryTimestamp < Date.now()) {
      isNotExpired = false;
      hardBlocks.push(`Vacancy deadline (${facts.validThrough}) has already passed.`);
    }
  }
  checks.push({
    code: "ACTIVE_EVIDENCE",
    label: "Active Vacancy Evidence",
    passed: isNotExpired,
    score: isNotExpired ? 20 : 0,
    weight: 20,
    severity: "hard_block",
    message: isNotExpired
      ? "Vacancy is current with no expired deadline."
      : `Application deadline expired on ${facts.validThrough}.`
  });

  // Check 4: Official Apply Destination (Weight: 15)
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
  checks.push({
    code: "OFFICIAL_APPLY_DESTINATION",
    label: "Official Apply Destination",
    passed: hasValidApplyUrl,
    score: hasValidApplyUrl ? 15 : 0,
    weight: 15,
    severity: "hard_block",
    message: hasValidApplyUrl
      ? `Verified destination: ${facts.officialApplyUrl}`
      : "Application URL is missing, invalid, or unsafe."
  });

  // Check 5: Required Field Completeness (Weight: 10)
  const hasTitle = Boolean(facts.title && facts.title.trim().length >= 3);
  const hasLocation = Boolean(facts.location && facts.location.trim().length > 0);
  const isComplete = hasTitle && hasLocation;
  if (!hasTitle) {
    hardBlocks.push("Missing or invalid job title (minimum 3 characters required).");
  }
  checks.push({
    code: "FIELD_COMPLETENESS",
    label: "Core Field Completeness",
    passed: isComplete,
    score: isComplete ? 10 : hasTitle ? 5 : 0,
    weight: 10,
    severity: hasTitle ? "info" : "hard_block",
    message: isComplete
      ? `Complete core fields (Title: "${facts.title}", Location: "${facts.location}").`
      : "Incomplete core fields."
  });

  // Check 6: Fact Consistency & Anti-Fabrication (Weight: 10)
  let consistencyPassed = true;
  if (facts.salaryDisclosed && facts.salaryMin && facts.salaryMax && facts.salaryMin > facts.salaryMax) {
    consistencyPassed = false;
    hardBlocks.push("Salary minimum cannot exceed salary maximum.");
  }
  checks.push({
    code: "FACT_CONSISTENCY",
    label: "Fact Consistency & Anti-Fabrication",
    passed: consistencyPassed,
    score: consistencyPassed ? 10 : 0,
    weight: 10,
    severity: "hard_block",
    message: consistencyPassed
      ? "Numerical and logical constraints passed."
      : "Logical conflict detected in extracted parameters."
  });

  // Check 7: Information Freshness (Weight: 5)
  let freshnessPassed = true;
  if (facts.datePosted) {
    const postedTime = Date.parse(facts.datePosted);
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    if (!Number.isNaN(postedTime) && postedTime < ninetyDaysAgo) {
      freshnessPassed = false;
      warnings.push(`Listing was posted over 90 days ago (${facts.datePosted}).`);
    }
  }
  checks.push({
    code: "FRESHNESS",
    label: "Information Freshness",
    passed: freshnessPassed,
    score: freshnessPassed ? 5 : 2,
    weight: 5,
    severity: "warning",
    message: freshnessPassed
      ? "Listing is fresh and timely."
      : "Listing is older than 90 days."
  });

  // Calculate aggregate score
  const totalScore = checks.reduce((acc, c) => acc + c.score, 0);

  // Informational warnings
  if (!facts.salaryDisclosed) {
    warnings.push("Salary is not disclosed by employer (will display as 'Not disclosed').");
  }
  if (facts.workMode === "Unknown") {
    warnings.push("Work arrangement (Remote/Hybrid/Onsite) is unspecified in source material.");
  }

  return {
    score: totalScore,
    isPublishable: hardBlocks.length === 0 && totalScore >= 70,
    checks,
    hardBlocks,
    warnings
  };
}
