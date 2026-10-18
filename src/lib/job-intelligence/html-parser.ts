/**
 * Robust HTML sanitizer, text normalizer, and section extractor for job postings.
 * Accurately parses raw HTML descriptions into structured paragraphs, bullet points, and sections.
 */

// Decode common HTML entities
export function decodeHtmlEntities(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&bull;/gi, "•")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

/**
 * Strips HTML tags and returns clean plaintext with normalized spaces.
 */
export function htmlToCleanText(html: string): string {
  if (!html) return "";
  return decodeHtmlEntities(
    html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

export interface ExtractedSections {
  summary: string;
  responsibilities: string[];
  qualifications: string[];
  preferredQualifications: string[];
  benefits: string[];
  skills: string[];
  rawText: string;
}

const COMMON_SKILLS = [
  "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Angular", "Vue", "Java", "C++", "C#",
  ".NET", "Golang", "Go", "Rust", "Swift", "Kotlin", "Ruby", "PHP", "SQL", "PostgreSQL", "MySQL", "Oracle",
  "MongoDB", "Redis", "Elasticsearch", "Cassandra", "Snowflake", "Databricks", "Kafka", "RabbitMQ", "Spark",
  "Hadoop", "AWS", "Amazon Web Services", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "K8s",
  "Terraform", "Ansible", "CI/CD", "GitHub Actions", "Jenkins", "Linux", "Git", "REST API", "GraphQL", "gRPC",
  "Microservices", "System Design", "Distributed Systems", "PyTorch", "TensorFlow", "Keras", "Scikit-Learn",
  "Pandas", "NumPy", "NLP", "LLMs", "RAG", "Generative AI", "Computer Vision", "Machine Learning", "Deep Learning",
  "Data Modeling", "ETL", "Data Pipelines", "Power BI", "Tableau", "Excel", "DAX", "Agile", "Scrum", "Jira",
  "Cybersecurity", "Zero Trust", "IAM", "SOC 2", "Penetration Testing", "DevOps", "DevSecOps", "SRE"
];

/**
 * Extracts structured sections (Overview, Responsibilities, Qualifications, Preferred, Benefits)
 * from HTML content by detecting headings, paragraphs, and list items.
 */
export function extractHtmlSections(html: string): ExtractedSections {
  const cleanRaw = htmlToCleanText(html);
  if (!html || !html.trim()) {
    return {
      summary: "",
      responsibilities: [],
      qualifications: [],
      preferredQualifications: [],
      benefits: [],
      skills: [],
      rawText: cleanRaw
    };
  }

  // Pre-process: break into blocks based on headings or tags
  // Replace HTML tag markers with tokenized delimiters for splitting
  const tokenized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<(h[1-6]|strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "\n\n###SECTION_HEADING:$2###\n\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n* $1\n")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n\n");

  const plainWithTokens = decodeHtmlEntities(tokenized.replace(/<[^>]+>/g, " "));
  const lines = plainWithTokens.split("\n").map(l => l.trim()).filter(Boolean);

  let currentSection: "summary" | "responsibilities" | "qualifications" | "preferred" | "benefits" = "summary";
  const summaryParts: string[] = [];
  const responsibilities: string[] = [];
  const qualifications: string[] = [];
  const preferredQualifications: string[] = [];
  const benefits: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^###SECTION_HEADING:\s*(.*?)\s*###$/i);
    if (headingMatch) {
      const headingText = headingMatch[1].toLowerCase();

      if (/responsibilit|what you(?:'ll| will) do|duties|your role|about the role|the opportunity|key accountabilities|day to day|scope of work/i.test(headingText)) {
        currentSection = "responsibilities";
      } else if (/preferred|nice to have|bonus|desired|what gives you an edge/i.test(headingText)) {
        currentSection = "preferred";
      } else if (/qualificat|requirement|what you(?:'ll| will) (?:need|bring)|what you bring|your background|must have|what we(?:'re| are) looking for|skills & experience|profile|who you are|basic qualifications|eligibility/i.test(headingText)) {
        currentSection = "qualifications";
      } else if (/benefit|perk|what we offer|why join|reward|compensation & benefits|life at/i.test(headingText)) {
        currentSection = "benefits";
      } else if (/overview|summary|introduction|about us|who we are/i.test(headingText)) {
        currentSection = "summary";
      }
      continue;
    }

    // Clean line from bullet prefix if present
    const isBullet = /^[\*•\-–—\d+\.]\s+/.test(line);
    const cleanLine = line.replace(/^[\*•\-–—\d+\.]\s+/, "").trim();
    if (!cleanLine || cleanLine.length < 3) continue;

    if (currentSection === "responsibilities") {
      if (isBullet || cleanLine.length > 20) responsibilities.push(cleanLine);
    } else if (currentSection === "qualifications") {
      if (isBullet || cleanLine.length > 20) qualifications.push(cleanLine);
    } else if (currentSection === "preferred") {
      if (isBullet || cleanLine.length > 20) preferredQualifications.push(cleanLine);
    } else if (currentSection === "benefits") {
      if (isBullet || cleanLine.length > 15) benefits.push(cleanLine);
    } else {
      if (summaryParts.length < 5 && !isBullet) {
        summaryParts.push(cleanLine);
      }
    }
  }

  // If summary was empty or too brief, pull from initial text
  let finalSummary = summaryParts.join(" ").trim();
  if (finalSummary.length < 50) {
    const paragraphs = cleanRaw.split(/\n\s*\n/).filter(p => p.length > 40 && !p.startsWith("*"));
    if (paragraphs.length > 0) {
      finalSummary = paragraphs.slice(0, 2).join(" ").slice(0, 600);
    }
  }

  // Extract skills from raw text
  const extractedSkills = extractSkillsFromText(cleanRaw);

  return {
    summary: finalSummary,
    responsibilities: Array.from(new Set(responsibilities)).slice(0, 20),
    qualifications: Array.from(new Set(qualifications)).slice(0, 20),
    preferredQualifications: Array.from(new Set(preferredQualifications)).slice(0, 15),
    benefits: Array.from(new Set(benefits)).slice(0, 15),
    skills: extractedSkills,
    rawText: cleanRaw
  };
}

/**
 * Extracts mentions of technical skills from text based on curated taxonomy.
 */
export function extractSkillsFromText(text: string, existingSkills: string[] = []): string[] {
  const found = new Set<string>(existingSkills.map(s => s.trim()).filter(Boolean));
  const lower = ` ${text.toLowerCase()} `;

  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "i");
    if (pattern.test(lower)) {
      found.add(skill);
    }
  }

  return Array.from(found).slice(0, 15);
}

/**
 * Parses stated experience years from job text (e.g. "5+ years", "3 to 6 years").
 */
export function extractExperienceFromText(text: string): {
  min?: number;
  max?: number;
  stated?: string;
  statedExperience?: string;
  experienceMin?: number;
  experienceMax?: number;
} {
  if (!text) return {};

  const clean = text.replace(/<[^>]+>/g, " ");

  const rangeMatch = clean.match(/\b(\d{1,2})\s*(?:\+|plus)?\s*(?:to|-)\s*(\d{1,2})\s*(?:\+)?\s*years?(?:\s+of)?(?:\s+(?:experience|exp|relevant))?/i);
  if (rangeMatch) {
    const min = Math.min(Number.parseInt(rangeMatch[1], 10), Number.parseInt(rangeMatch[2], 10));
    const max = Math.max(Number.parseInt(rangeMatch[1], 10), Number.parseInt(rangeMatch[2], 10));
    const stated = `${min}–${max} years`;
    return {
      min,
      max,
      stated,
      statedExperience: stated,
      experienceMin: min,
      experienceMax: max
    };
  }

  const singleMatch = clean.match(/\b(\d{1,2})\s*(\+|plus)?\s*years?(?:\s+of)?(?:\s+(?:experience|exp|relevant))?/i) ||
                      clean.match(/(?:minimum|min\.?|at least)\s+(\d{1,2})\s*years?/i);

  if (singleMatch) {
    const min = Number.parseInt(singleMatch[1], 10);
    const hasPlus = Boolean(singleMatch[2]) || singleMatch[0].includes("+");
    const stated = hasPlus ? `${min}+ years` : `${min} years`;
    return {
      min,
      max: min + 3,
      stated,
      statedExperience: stated,
      experienceMin: min,
      experienceMax: min + 3
    };
  }

  return {};
}

/**
 * Extracts stated education requirements from text.
 */
export function extractEducationFromText(text: string): string | undefined {
  if (!text) return undefined;
  if (/\b(?:ph\.?d\.?|doctorate)\b/i.test(text)) return "Doctorate / Ph.D.";
  if (/\b(?:master(?:'s)?\s+degree|m\.?tech|mba|m\.?sc|m\.s\.)\b/i.test(text)) return "Master's Degree";
  if (/\b(?:bachelor(?:'s)?\s+degree|b\.?tech|b\.?e\.|bca|b\.?sc|b\.s\.)\b/i.test(text)) return "Bachelor's Degree";
  if (/\bdiploma\b/i.test(text)) return "Diploma";
  return undefined;
}
