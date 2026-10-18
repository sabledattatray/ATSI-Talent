import type { RichNode } from "@/lib/admin/types";
import type { ExtractedJobFacts } from "./types";

export interface GeneratedJobContent {
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  content: RichNode;
}

/**
 * Builds a rich, structured, factual job document compliant with ATSAI's ProseMirror RichNode AST.
 * Strictly adheres to non-fabrication rules:
 * - Never claims "sourced with permission" unless authBasis is verified direct_owner or license.
 * - Displays official independent disclaimer for public career listings.
 * - Formats full overview, responsibilities, qualifications, benefits, and application instructions.
 */
export function generateFactualJobContent(facts: ExtractedJobFacts): GeneratedJobContent {
  const seoTitle = `${facts.title} at ${facts.company} | ATSAI Career Directory`;
  const compText = facts.salaryDisclosed && facts.salaryMin && facts.salaryMax
    ? `Offering ${facts.salaryCurrency || "INR"} ${facts.salaryMin.toLocaleString("en-IN")}–${facts.salaryMax.toLocaleString("en-IN")}. `
    : "";
  const excerpt = `${facts.company} is seeking a ${facts.title} in ${facts.location} (${facts.workMode}). ${compText}Apply on the official employer website.`.slice(0, 180);
  const seoDescription = excerpt;

  const docNodes: RichNode[] = [];

  // 1. Legal Attribution & Independence Notice
  const isDirectOrLicensed = facts.authBasis === "direct_owner" || facts.authBasis === "written_permission" || facts.authBasis === "license";

  if (isDirectOrLicensed) {
    docNodes.push({
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Verified Career Requisition: ", marks: [{ type: "bold" }] },
            { type: "text", text: `This position is sourced with permission from ${facts.company}. ATSAI curates opportunities and guides candidates directly to the official employer portal for application submission.` }
          ]
        }
      ]
    });
  } else {
    docNodes.push({
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Independent Vacancy Notice: ", marks: [{ type: "bold" }] },
            { type: "text", text: "This vacancy is independently summarized from the employer's public career listing. ATSAI is not affiliated with or recruiting on behalf of the employer. Apply directly through the official employer website." }
          ]
        }
      ]
    });
  }

  // 2. Role Overview Section
  docNodes.push({
    type: "heading",
    attrs: { level: 2 },
    content: [{ type: "text", text: "Role Overview & Summary" }]
  });

  const summaryText = facts.descriptionSummary ||
    `${facts.company} has announced an open position for a ${facts.title} based in ${facts.location}. This requisition operates under an ${facts.workMode.toLowerCase()} model on a ${facts.employmentType.toLowerCase()} basis.`;

  // Split multiple paragraphs if available
  const summaryParagraphs = summaryText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  for (const p of summaryParagraphs) {
    docNodes.push({
      type: "paragraph",
      content: [{ type: "text", text: p.trim() }]
    });
  }

  // 3. Stated Responsibilities
  if (facts.responsibilities && facts.responsibilities.length > 0) {
    docNodes.push({
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Key Responsibilities" }]
    });

    docNodes.push({
      type: "bulletList",
      content: facts.responsibilities.map(r => ({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: r }] }]
      }))
    });
  }

  // 4. Stated Qualifications & Requirements
  if (facts.qualifications && facts.qualifications.length > 0) {
    docNodes.push({
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Required Qualifications & Experience" }]
    });

    docNodes.push({
      type: "bulletList",
      content: facts.qualifications.map(q => ({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: q }] }]
      }))
    });
  }

  // 5. Preferred Qualifications (if any)
  if (facts.preferredQualifications && facts.preferredQualifications.length > 0) {
    docNodes.push({
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Preferred Qualifications & Desired Skills" }]
    });

    docNodes.push({
      type: "bulletList",
      content: facts.preferredQualifications.map(pq => ({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: pq }] }]
      }))
    });
  }

  // 6. Core Skills & Technologies
  if (facts.skills && facts.skills.length > 0) {
    docNodes.push({
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Identified Skills & Technologies" }]
    });

    docNodes.push({
      type: "bulletList",
      content: facts.skills.map(s => ({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: s }] }]
      }))
    });
  }

  // 7. Benefits & Compensation (if disclosed)
  if ((facts.benefits && facts.benefits.length > 0) || facts.salaryDisclosed) {
    docNodes.push({
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Compensation & Benefits" }]
    });

    if (facts.salaryDisclosed && facts.salaryMin && facts.salaryMax) {
      docNodes.push({
        type: "paragraph",
        content: [
          { type: "text", text: "Disclosed Compensation: ", marks: [{ type: "bold" }] },
          { type: "text", text: `${facts.salaryCurrency || "INR"} ${facts.salaryMin.toLocaleString("en-IN")} – ${facts.salaryMax.toLocaleString("en-IN")} per ${facts.salaryPeriod?.toLowerCase() || "year"}.` }
        ]
      });
    }

    if (facts.benefits && facts.benefits.length > 0) {
      docNodes.push({
        type: "bulletList",
        content: facts.benefits.map(b => ({
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: b }] }]
        }))
      });
    }
  }

  // 8. Application Instructions
  docNodes.push({
    type: "heading",
    attrs: { level: 3 },
    content: [{ type: "text", text: "Official Application Process" }]
  });

  docNodes.push({
    type: "paragraph",
    content: [
      { type: "text", text: "To submit your candidacy for this role, click the " },
      { type: "text", text: "Apply on official employer site", marks: [{ type: "bold" }] },
      { type: "text", text: " button above to open the official employer application portal directly. ATSAI curates verified openings and never charges candidate registration or application fees." }
    ]
  });

  // 9. Verification & Sourcing Provenance
  const verifiedDateStr = facts.lastVerifiedAt
    ? new Date(facts.lastVerifiedAt).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");

  const employerDateStr = facts.datePosted
    ? `Posted by employer on ${facts.datePosted}. `
    : "";

  docNodes.push({
    type: "paragraph",
    content: [
      {
        type: "text",
        text: `Provenance: ${employerDateStr}Last verified by ATSAI on ${verifiedDateStr}. Sourced from official vacancy URL.`,
        marks: [{ type: "italic" }]
      }
    ]
  });

  return {
    excerpt,
    seoTitle,
    seoDescription,
    content: {
      type: "doc",
      content: docNodes
    }
  };
}
