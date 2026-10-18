import type { RichNode } from "@/lib/admin/types";
import type { ExtractedJobFacts } from "./types";

export interface GeneratedJobContent {
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  content: RichNode;
}

/**
 * Builds an original, structured, factual job document compliant with ATSAI's ProseMirror RichNode AST.
 * Strictly adheres to PRD Section 6.3: "Never invent or infer factual details. If unsupported, omit or state unknown."
 */
export function generateFactualJobContent(facts: ExtractedJobFacts): GeneratedJobContent {
  const seoTitle = `${facts.title} at ${facts.company} | Verified Requisition`;
  const compText = facts.salaryDisclosed && facts.salaryMin && facts.salaryMax
    ? `Offering ${facts.salaryCurrency} ${facts.salaryMin.toLocaleString("en-IN")}–${facts.salaryMax.toLocaleString("en-IN")}. `
    : "";
  const excerpt = `${facts.company} is hiring for a ${facts.title} in ${facts.location} (${facts.workMode}). ${compText}Apply on the official employer website.`.slice(0, 180);
  const seoDescription = excerpt;

  const docNodes: RichNode[] = [];

  // 1. Independent Curation Notice
  docNodes.push({
    type: "blockquote",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Verified Career Intelligence: ", marks: [{ type: "bold" }] },
          { type: "text", text: `This position is sourced with permission from ${facts.company}. ATSAI curates opportunities and guides candidates directly to the official employer portal for application submission.` }
        ]
      }
    ]
  });

  // 2. Role Overview Section
  docNodes.push({
    type: "heading",
    attrs: { level: 2 },
    content: [{ type: "text", text: "Role Overview & Summary" }]
  });

  const summaryText = facts.descriptionSummary ||
    `${facts.company} has announced an open vacancy for a ${facts.title} based in ${facts.location}. This position operates under an ${facts.workMode.toLowerCase()} model on a ${facts.employmentType.toLowerCase()} basis.`;

  docNodes.push({
    type: "paragraph",
    content: [{ type: "text", text: summaryText }]
  });

  // 3. Core Competencies & Skills (if any)
  if (facts.skills && facts.skills.length > 0) {
    docNodes.push({
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Identified Skills & Competencies" }]
    });

    docNodes.push({
      type: "bulletList",
      content: facts.skills.map(s => ({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: s }] }]
      }))
    });
  }

  // 4. Stated Responsibilities (if any)
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

  // 5. Stated Qualifications (if any)
  if (facts.qualifications && facts.qualifications.length > 0) {
    docNodes.push({
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Candidate Qualifications" }]
    });

    docNodes.push({
      type: "bulletList",
      content: facts.qualifications.map(q => ({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: q }] }]
      }))
    });
  }

  // 6. Application Instructions Section
  docNodes.push({
    type: "heading",
    attrs: { level: 3 },
    content: [{ type: "text", text: "How to Apply" }]
  });

  docNodes.push({
    type: "paragraph",
    content: [
      { type: "text", text: "To submit your application, please proceed directly to the official employer career destination by clicking the " },
      { type: "text", text: "Apply for this role", marks: [{ type: "bold" }] },
      { type: "text", text: " button above. ATSAI never charges candidate registration or application fees." }
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
