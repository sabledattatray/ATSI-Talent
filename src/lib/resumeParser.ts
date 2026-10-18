import { inflateSync, inflateRawSync } from "node:zlib";
import type { WorkExperience, Education } from "@/lib/recruitment";

export type ParsedResume = {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  bio: string;
  skills: string;
  experience: number;
  certifications: string;
  targetRole: string;
  noticePeriod: string;
  expectedSalary: string;
  openToRelocation: boolean;
  resumeUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  photoUrl?: string;
  workHistory: WorkExperience[];
  educationHistory: Education[];
};

/**
 * Extracts plain text from DOCX (zipped XML), PDF (FlateDecode streams & literal strings),
 * or standard text / markdown buffers.
 */
export function extractTextFromBuffer(buffer: Buffer, filenameOrMime = ""): string {
  const lower = filenameOrMime.toLowerCase();

  // 1. DOCX Detection (ZIP file containing word/document.xml)
  if (lower.endsWith(".docx") || lower.includes("officedocument.wordprocessingml") || isZipBuffer(buffer)) {
    try {
      const docxText = extractDocxText(buffer);
      if (docxText.trim()) return docxText;
    } catch {}
  }

  // 2. PDF Detection
  if (lower.endsWith(".pdf") || lower.includes("application/pdf") || isPdfBuffer(buffer)) {
    try {
      const pdfText = extractPdfText(buffer);
      if (pdfText.trim()) return pdfText;
    } catch {}
  }

  // 3. Fallback: UTF-8 plain text / RTF / Markdown
  return buffer.toString("utf8").replace(/\0/g, "").replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function isZipBuffer(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.readUInt32LE(0) === 0x04034b50;
}

function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.toString("ascii", 0, 4) === "%PDF";
}

function extractDocxText(buffer: Buffer): string {
  let offset = 0;
  let fullText = "";
  while (offset < buffer.length - 30) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset++;
      continue;
    }
    const method = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const filename = buffer.toString("utf8", offset + 30, offset + 30 + nameLen);
    const dataStart = offset + 30 + nameLen + extraLen;

    if (filename === "word/document.xml") {
      const compData = buffer.subarray(dataStart, dataStart + compSize);
      const xml = method === 8 ? inflateRawSync(compData).toString("utf8") : compData.toString("utf8");
      // Replace paragraphs with newlines and strip all XML tags
      fullText = xml.replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, " ");
      break;
    }
    offset = dataStart + compSize;
  }
  return fullText.replace(/[ \t]+/g, " ").trim();
}

function extractPdfText(buffer: Buffer): string {
  const str = buffer.toString("binary");
  let extracted = "";
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(str)) !== null) {
    const raw = Buffer.from(match[1], "binary");
    let content = "";
    try {
      content = inflateSync(raw).toString("latin1");
    } catch {
      try {
        content = inflateRawSync(raw).toString("latin1");
      } catch {
        content = raw.toString("latin1");
      }
    }

    const textMatches = content.matchAll(/\(([^)]+)\)\s*(?:Tj|'|")/g);
    for (const tm of textMatches) {
      extracted += tm[1] + " ";
    }
    const arrayMatches = content.matchAll(/\[(.*?)\]\s*TJ/g);
    for (const am of arrayMatches) {
      const parts = [...am[1].matchAll(/\(([^)]+)\)/g)].map(p => p[1]).join("");
      if (parts) extracted += parts + " ";
    }
    extracted += "\n";
  }

  // Fallback for uncompressed text tokens in PDF
  if (!extracted.trim()) {
    const directMatches = str.matchAll(/\(([^)]{2,})\)\s*Tj/g);
    for (const dm of directMatches) {
      extracted += dm[1] + " ";
    }
  }

  return extracted
    .replace(/\\([()\\])/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

/**
 * Intelligent semantic resume parser that extracts structured profile details:
 * Contact, Headline, Summary, Skills, Experience, Education, Social links.
 */
export function parseResumeText(rawText: string): ParsedResume {
  const text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // 1. Contact Information
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : "";

  const phoneMatch = text.match(/(?:phone|tel|mobile|cell)?[:\s|]*(\+?[\d\s().-]{10,20}\d)/i) ||
                     text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
  const phone = phoneMatch ? (phoneMatch[1] ? phoneMatch[1].trim() : phoneMatch[0].trim()) : "";

  const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_%]+/i);
  const linkedinUrl = linkedinMatch ? linkedinMatch[0].replace("http://", "https://") : "";

  const githubMatch = text.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9-_%]+/i);
  const githubUrl = githubMatch ? githubMatch[0].replace("http://", "https://") : "";

  const portfolioMatch = text.match(/https?:\/\/(?!www\.linkedin|linkedin|www\.github|github)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s|)]*)?/i);
  const portfolioUrl = portfolioMatch ? portfolioMatch[0].replace("http://", "https://") : "";

  // Location detection
  let location = "";
  const locationLineMatch = text.match(/(?:location|address|city|residence)[:\s|]+([^\n|•,]+(?:,[^\n|•]+){0,2})/i);
  if (locationLineMatch) {
    location = locationLineMatch[1].trim();
  } else {
    const cityMatch = text.match(/\b(Pune|Bengaluru|Bangalore|Mumbai|Delhi|Hyderabad|Chennai|Gurgaon|Noida|Kolkata|Ahmedabad|San Francisco|New York|London|Remote|Singapore|Dubai|Berlin|Toronto|Seattle|Austin|Boston)(?:,\s*[A-Za-z\s]+)?/i);
    if (cityMatch) location = cityMatch[0].trim();
  }

  // 2. Name & Headline Identification
  let name = "";
  let headline = "";
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (line.includes("@") || line.includes("http") || line.toLowerCase().includes("resume") || line.toLowerCase().includes("curriculum vitae")) continue;
    if (!name && line.length < 50 && /^[A-Z][a-zA-Z\s.'-]+$/.test(line) && !line.includes("|") && !line.includes(":")) {
      name = line;
      continue;
    }
    if (name && !headline && line.length < 120 && !line.includes("@") && !line.includes("http") && !line.includes(":")) {
      headline = line.replace(/^[|•\-\s]+|[|•\-\s]+$/g, "").trim();
      break;
    }
  }

  // 3. Years of Experience Detection
  let experience = 0;
  const expMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i);
  if (expMatch) {
    experience = parseFloat(expMatch[1]);
  }

  // 4. Section Splitting
  const sectionHeaders = [
    { key: "summary", regex: /^(?:professional\s+summary|executive\s+summary|summary|profile|about\s+me|objective)\b/i },
    { key: "skills", regex: /^(?:technical\s+skills|core\s+skills|skills\s*(?:&|and)\s*tools|skills|competencies|technologies)\b/i },
    { key: "experience", regex: /^(?:work\s+experience|professional\s+experience|employment\s+history|experience|career\s+history)\b/i },
    { key: "education", regex: /^(?:education|academic\s+background|qualifications|academics)\b/i },
    { key: "certifications", regex: /^(?:certifications|licenses|courses|credentials)\b/i }
  ];

  const sections: Record<string, string> = {};
  let currentKey: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const matchedHeader = sectionHeaders.find(h => h.regex.test(line));
    if (matchedHeader) {
      if (currentKey) sections[currentKey] = currentLines.join("\n");
      currentKey = matchedHeader.key;
      currentLines = [];
    } else if (currentKey) {
      currentLines.push(line);
    }
  }
  if (currentKey) sections[currentKey] = currentLines.join("\n");

  const bio = sections.summary ? sections.summary.replace(/\n+/g, " ").trim() : "";
  const skills = sections.skills ? sections.skills.replace(/\n/g, ", ").replace(/•/g, "").replace(/\s+/g, " ").replace(/,\s*,/g, ",").trim() : "";
  const certifications = sections.certifications ? sections.certifications.replace(/•/g, "").trim() : "";

  // 5. Work Experience Parsing
  const workHistory: WorkExperience[] = [];
  if (sections.experience) {
    const expLines = sections.experience.split("\n").map(l => l.trim()).filter(Boolean);
    let currentJob: WorkExperience | null = null;

    const datePattern = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current)/i;

    for (let i = 0; i < expLines.length; i++) {
      const line = expLines[i];
      const nextLine = expLines[i + 1] || "";
      const isDateLine = datePattern.test(line);
      const nextIsDateLine = datePattern.test(nextLine);

      // Check if line looks like a title/company header
      if ((line.includes("|") || line.includes(" at ") || line.includes(" – ") || line.includes(" - ") || nextIsDateLine) && !line.startsWith("•") && !line.startsWith("-")) {
        if (currentJob) {
          workHistory.push(currentJob);
        }
        let title = line;
        let company = "";
        let loc = "";

        if (line.includes("|")) {
          const parts = line.split(/\s*\|\s*/);
          title = parts[0] || "";
          company = parts[1] || "";
          loc = parts[2] || "";
        } else if (line.includes(" at ")) {
          const parts = line.split(/\s+at\s+/i);
          title = parts[0] || "";
          company = parts[1] || "";
        }

        let startDate = "";
        let endDate = "";
        let isCurrent = false;

        if (nextIsDateLine) {
          const dm = nextLine.match(datePattern);
          if (dm) {
            startDate = dm[1];
            endDate = dm[2];
            isCurrent = /present|current/i.test(endDate);
            if (isCurrent) endDate = "";
            i++; // skip next line as it was the date
          }
        }

        currentJob = {
          id: `w_${workHistory.length + 1}`,
          title: title.trim(),
          company: company.trim(),
          location: loc.trim(),
          startDate: startDate.trim(),
          endDate: endDate.trim(),
          current: isCurrent,
          description: ""
        };
      } else if (currentJob) {
        if (isDateLine && !currentJob.startDate) {
          const dm = line.match(datePattern);
          if (dm) {
            currentJob.startDate = dm[1];
            currentJob.endDate = dm[2];
            currentJob.current = /present|current/i.test(currentJob.endDate);
            if (currentJob.current) currentJob.endDate = "";
          }
        } else {
          const cleanLine = line.replace(/^[•\-\*]\s*/, "");
          currentJob.description = currentJob.description ? `${currentJob.description}\n${cleanLine}` : cleanLine;
        }
      }
    }
    if (currentJob) workHistory.push(currentJob);
  }

  // Calculate experience years from history if not explicitly stated
  if (experience === 0 && workHistory.length > 0) {
    let earliest = 9999;
    const nowYear = new Date().getFullYear();
    for (const w of workHistory) {
      const ym = w.startDate.match(/\b(19\d{2}|20\d{2})\b/);
      if (ym) {
        const y = parseInt(ym[0], 10);
        if (y < earliest) earliest = y;
      }
    }
    if (earliest < 9999 && earliest <= nowYear) {
      experience = nowYear - earliest;
    }
  }

  // 6. Education Parsing
  const educationHistory: Education[] = [];
  if (sections.education) {
    const eduLines = sections.education.split("\n").map(l => l.trim()).filter(Boolean);
    let degree = "";
    let institution = "";
    let field = "";
    let gradYear = "";

    for (const line of eduLines) {
      const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b/);
      if (yearMatch) gradYear = yearMatch[0];

      if (/bachelor|master|b\.?tech|b\.?e\.?|m\.?s\.?|m\.?tech|mba|bsc|msc|diploma/i.test(line)) {
        degree = line.replace(/\|.*$/, "").trim();
        const fieldMatch = line.match(/in\s+([A-Za-z\s&]+)/i);
        if (fieldMatch) field = fieldMatch[1].trim();
      } else if (!institution && line.length < 100) {
        institution = line.replace(/\|.*$/, "").trim();
      }
    }

    if (degree || institution) {
      educationHistory.push({
        id: `e_1`,
        degree: degree || "Degree",
        field,
        institution: institution || "University / College",
        graduationYear: gradYear
      });
    }
  }

  // Target role defaults to headline or latest job title
  const targetRole = headline || (workHistory[0]?.title ?? "");

  return {
    name,
    email,
    phone,
    location,
    headline,
    bio,
    skills,
    experience,
    certifications,
    targetRole,
    noticePeriod: "30 Days",
    expectedSalary: "",
    openToRelocation: false,
    resumeUrl: "",
    linkedinUrl,
    githubUrl,
    portfolioUrl,
    workHistory,
    educationHistory,
  };
}
