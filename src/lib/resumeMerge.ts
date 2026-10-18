import type { CandidateProfile } from "@/lib/recruitment";
import type { ParsedResume } from "@/lib/resumeParser";

// Import fills gaps by default. Candidates may explicitly choose replacement.
export function mergeResumeProfile(current: CandidateProfile & { name: string }, parsed: ParsedResume, replace = false) {
  const result = { ...current };
  const keys = ["name", "phone", "location", "headline", "bio", "certifications", "targetRole", "noticePeriod", "expectedSalary", "linkedinUrl", "githubUrl", "portfolioUrl", "resumeUrl"] as const;
  for (const key of keys) {
    if (parsed[key]?.trim() && (replace || !current[key]?.trim())) result[key] = parsed[key].trim();
  }
  const skillValues = (replace ? parsed.skills || current.skills : [current.skills, parsed.skills].filter(Boolean).join(", ")).split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean);
  result.skills = [...new Map(skillValues.map(s=>[s.toLowerCase(),s])).values()].join(", ").slice(0,2500);
  if (parsed.experience > 0 && (replace || !current.experience)) result.experience = parsed.experience;
  if (parsed.openToRelocation !== undefined && (replace || current.openToRelocation === undefined)) result.openToRelocation = parsed.openToRelocation;
  const normalized = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  for (const key of ["workHistory", "educationHistory"] as const) {
    if (!parsed[key].length) continue;
    if (key === "workHistory") {
      const rows = replace ? [] : [...(current.workHistory || [])];
      for (const row of parsed.workHistory) {
        if (!rows.some(r=>normalized(r.title+r.company+r.startDate)===normalized(row.title+row.company+row.startDate))) rows.push({ ...row, id: `resume_w_${rows.length+1}` });
      }
      result.workHistory=rows.slice(0,25);
    } else {
      const rows = replace ? [] : [...(current.educationHistory || [])];
      for (const row of parsed.educationHistory) {
        if (!rows.some(r=>normalized(r.degree+r.institution)===normalized(row.degree+row.institution))) rows.push({ ...row, id: `resume_e_${rows.length+1}` });
      }
      result.educationHistory=rows.slice(0,20);
    }
  }
  return result;
}
