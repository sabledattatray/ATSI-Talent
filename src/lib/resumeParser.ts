import { COUNTRIES } from "@/lib/countries";
import type { WorkExperience, Education } from "@/lib/recruitment";

export type ParsedResume = {
  name: string; email: string; phone: string; location: string; headline: string;
  bio: string; skills: string; experience: number; certifications: string;
  targetRole: string; noticePeriod: string; expectedSalary: string;
  openToRelocation?: boolean; resumeUrl: string; linkedinUrl: string;
  githubUrl: string; portfolioUrl: string; photoUrl?: string;
  workHistory: WorkExperience[]; educationHistory: Education[]; warnings: string[];
};


async function wordLinks(buffer: Buffer): Promise<string[]> {
  const { fromBuffer } = await import("yauzl");
  return new Promise((resolve, reject) => {
    fromBuffer(buffer, { lazyEntries: true }, (error, zip) => {
      if (error || !zip) { reject(error || new Error("Invalid Word archive")); return; }
      let total = 0, entries = 0; const links: string[] = [];
      const abort = (error: Error) => { zip.close(); reject(error); };
      zip.on("error", abort);
      zip.on("end", () => resolve(links));
      zip.on("entry", entry => {
        total += entry.uncompressedSize;
        if (++entries > 2000 || total > 16 * 1024 * 1024) { abort(Object.assign(new Error("This Word file is too complex. Please save a simpler copy or paste its text."), { status: 422 })); return; }
        if (!/^word\/.*\.rels$/.test(entry.fileName)) { zip.readEntry(); return; }
        zip.openReadStream(entry, (error, stream) => {
          if (error || !stream) { abort(error || new Error("Invalid Word archive")); return; }
          const chunks: Buffer[] = [];
          stream.on("error", abort);
          stream.on("data", chunk => chunks.push(Buffer.from(chunk)));
          stream.on("end", () => {
            const xml = Buffer.concat(chunks).toString("utf8");
            for (const match of xml.matchAll(/Target=["'](https?:\/\/[^"'<>]+)["']/g)) links.push(match[1].replace(/&amp;/g, "&"));
            zip.readEntry();
          });
        });
      });
      zip.readEntry();
    });
  });
}

const fail = (message: string, status = 422): never => { throw Object.assign(new Error(message), { status }); };
const clean = (text: string) => text.normalize("NFKC").replace(/\r\n?/g, "\n").replace(/[\u200b\u00ad\ufeff]/g, "").replace(/\u00a0/g, " ").replace(/\t+/g, " | ").replace(/ +/g, " ").trim();

// File readers run on the server; resume contents are never sent to another service.
export async function extractTextFromBuffer(buffer: Buffer, filenameOrMime = ""): Promise<string> {
  if (buffer.length > 8 * 1024 * 1024) fail("Please choose a resume smaller than 8 MB.", 413);
  const format = filenameOrMime.toLowerCase();
  let text = "";
  try {
    if (buffer.subarray(0, 4).toString() === "%PDF" || /\.pdf$|application\/pdf/.test(format)) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer), isEvalSupported: false });
      try {
        // Read text independently of optional metadata/annotations. Damaged
        // hyperlinks must not discard an otherwise readable candidate resume.
        const result = await parser.getText({ first: 31, parseHyperlinks: false, pageJoiner: "\n", cellSeparator: " | " });
        if (result.total > 30) fail("Please upload a resume with 30 pages or fewer.");
        text = result.text;
        try {
          const details = await parser.getInfo({ parsePageInfo: true });
          const links = (details.pages || []).flatMap(page => (page.links || []).map(link => link.url)).filter(url => /^https?:\/\//i.test(url));
          text += "\n" + [...new Set(links)].filter(url => !text.includes(url)).join("\n");
        } catch {
          // Text fields are still usable when a PDF has malformed annotations.
        }
      } finally { await parser.destroy().catch(() => {}); }
      if (text.replace(/[^\p{L}\p{N}]/gu, "").length < 30) fail("This PDF has no readable text. Upload a text-based PDF or Word file, or paste your resume text. Scanned images need OCR first.");
    } else if (/\.docx$|officedocument.wordprocessingml/.test(format) || (buffer.length >= 2 && buffer.readUInt16LE(0) === 0x4b50)) {
      const urls = await wordLinks(buffer);
      const { default: WordExtractor } = await import("word-extractor");
      const doc = await new WordExtractor().extract(buffer);
      text = doc.getHeaders() + "\n" + doc.getBody();
      text += "\n" + [...new Set(urls)].filter(url => !text.includes(url)).join("\n");
    } else if (/\.doc$|application\/msword/.test(format) || buffer.subarray(0, 8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]))) {
      const { default: WordExtractor } = await import("word-extractor");
      const doc = await new WordExtractor().extract(buffer);
      text = doc.getHeaders() + "\n" + doc.getBody();
    } else if (/\.(?:txt|md)$|^text\/plain/.test(format)) {
      text = buffer.subarray(0, 2).equals(Buffer.from([0xff, 0xfe])) ? buffer.subarray(2).toString("utf16le") : buffer.toString("utf8");
    } else {
      fail("Please upload PDF, Word (.docx or .doc), TXT or Markdown, or paste your resume text.", 400);
    }
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) throw error;
    const reason = error && typeof error === "object" ? error as { name?: string; message?: string } : {};
    if (reason.name === "PasswordException") fail("This PDF requires a password. Export an unlocked copy and upload it again, or paste your resume text.");
    if (/DOMMatrix|ImageData|Path2D|fake worker|Cannot find (?:module|package)|canvas|workerSrc/i.test(reason.message || "")) {
      console.error("Resume reader runtime dependency unavailable.");
      fail("The resume reader is temporarily unavailable. Please try again shortly, or paste your resume text.", 503);
    }
    fail("We couldn't read this file. Try exporting a fresh PDF or Word copy, or paste your resume text.");
  }
  text = clean(text);
  if (text.length > 150_000) fail("This file contains too much text. Please upload a shorter resume.");
  if (text.replace(/[^\p{L}\p{N}]/gu, "").length < 30) fail("Not enough readable resume text was found. Try another file or paste your resume text.");
  return text;
}

const sectionNames: Record<string, string> = {
  "summary": "summary", "professional summary": "summary", "career summary": "summary", "executive summary": "summary", "profile": "summary", "professional profile": "summary", "about me": "summary", "objective": "summary", "career objective": "summary",
  "skills": "skills", "technical skills": "skills", "key skills": "skills", "core skills": "skills", "skills and tools": "skills", "skills & tools": "skills", "core competencies": "skills", "competencies": "skills", "technologies": "skills", "technical expertise": "skills", "tools & technologies": "skills", "tools and technologies": "skills", "technical skills & tools": "skills", "technical skills and tools": "skills",
  "experience": "experience", "work experience": "experience", "professional experience": "experience", "employment history": "experience", "work history": "experience", "career history": "experience", "employment": "experience", "internships": "experience",
  "education": "education", "academic background": "education", "academic qualifications": "education", "educational qualifications": "education", "qualifications": "education", "academics": "education",
  "certifications": "certifications", "certifications and training": "certifications", "licenses": "certifications", "courses": "certifications", "credentials": "certifications",
  "projects": "other", "personal projects": "other", "academic projects": "other", "achievements": "other", "awards": "other", "languages": "other", "interests": "other", "hobbies": "other", "references": "other", "personal details": "other", "declaration": "other", "publications": "other", "additional information": "other",
};
// Resume templates often use decorative spacing, bullets or alternate headings.
const headingKey = (value: string) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
const headingAliases: Record<string, string> = {
  "key competencies": "skills", "skill set": "skills", "skill sets": "skills", "professional skills": "skills",
  "technical competencies": "skills", "technical proficiencies": "skills", "areas of expertise": "skills", "core expertise": "skills", "expertise": "skills", "tools": "skills", "tools and platforms": "skills",
  "career summary and objective": "summary", "professional overview": "summary",
  "professional background": "experience", "career experience": "experience", "employment details": "experience", "work experience and achievements": "experience",
  "educational background": "education", "education and qualifications": "education", "education details": "education", "educational details": "education", "academic details": "education", "academic credentials": "education", "academic profile": "education", "education and training": "education",
  "personal details": "contact", "contact details": "contact", "personal information": "contact", "contact information": "contact",
};
const headings = new Map(Object.entries({ ...sectionNames, ...headingAliases }).map(([label, key]) => [headingKey(label), key]));
function sectionHeading(line: string): { key: string; remainder: string } | undefined {
  const whole = headings.get(headingKey(line));
  if (whole) return { key: whole, remainder: "" };
  const split = line.match(/^(.{1,80}?)(?:\s*[:|]\s*|\s+[–—]\s+)(.+)$/);
  const key = split && headings.get(headingKey(split[1]));
  return key ? { key, remainder: split![2].trim() } : undefined;
}
const identityKey = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const institutionLike = (value: string) => /university|college|institute|school|academy/i.test(value);

const stripBullet = (s: string) => s.replace(/^[•●▪◦*\-]\s*/, "").trim();
const roleLike = (s: string) => /\b(?:engineer|developer|analyst|manager|consultant|specialist|executive|officer|lead|intern|designer|architect|accountant|scientist|administrator|associate|director|recruiter|coordinator|head|president|founder)\b/i.test(s);
const degreeLike = (s: string) => /\b(?:bachelor|master|doctor|ph\.?d|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\.?|m\.?\s?e\.?|b\.?\s?sc|m\.?\s?sc|b\.?\s?com|m\.?\s?com|mba|bba|bca|mca|diploma|hsc|ssc|secondary|12th|10th)\b/i.test(s);
const dateToken = "(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?[ ,/-]+(?:19|20)\\d{2}|(?:0?[1-9]|1[0-2])[/.-](?:19|20)\\d{2}|(?:19|20)\\d{2}(?:[-/](?:0[1-9]|1[0-2]))?)";
const rangePattern = new RegExp(`(${dateToken})\\s*(?:[-–—]|\\bto\\b)\\s*(${dateToken}|present|current|till date|ongoing|now)`, "i");
const present = (s: string) => /^(?:present|current|till date|ongoing|now)$/i.test(s);
function monthNumber(value: string, end = false): number | null {
  const year = value.match(/\b(?:19|20)\d{2}\b/); if (!year) return null;
  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const word = value.match(/[a-z]{3}/i)?.[0].toLowerCase();
  const numeric = value.match(/^(\d{1,2})[/.-]\d{4}$/)?.[1] || value.match(/^\d{4}[-/](\d{2})$/)?.[1];
  const month = word ? months.indexOf(word) : numeric ? Number(numeric) - 1 : end ? 11 : 0;
  return Number(year[0]) * 12 + Math.max(0, month);
}

function workEntries(source: string[], candidateName: string): WorkExperience[] {
  const isCandidateName = (value: string) => !!candidateName && identityKey(value) === identityKey(candidateName);
  // Repeated page headers are not employers or work descriptions.
  const lines = source.filter(line => !isCandidateName(line) && !/^page \d+(?: of \d+)?$/i.test(line));
  const entries: WorkExperience[] = []; let previousEnd = -1;
  const dateIndexes = lines.flatMap((s,i) => rangePattern.test(s) ? [i] : []);
  for (let n = 0; n < dateIndexes.length; n++) {
    const i = dateIndexes[n]; const match = lines[i].match(rangePattern)!;
    const inline = lines[i].replace(match[0], "").replace(/^[\s|,()–—-]+|[\s|,()–—-]+$/g, "");
    const preceding: string[] = [];
    for (let j = i - 1; j > previousEnd && preceding.length < 2; j--) {
      if (/^[•●▪◦*\-]/.test(lines[j]) || lines[j].length > 140 || (/[.!]$/.test(lines[j]) && !/\b(?:ltd|inc|co|corp|pvt)\.$/i.test(lines[j]))) break;
      preceding.unshift(lines[j]);
    }
    const headerLines = [...preceding, inline].filter(Boolean);
    const parts = headerLines.flatMap(s => s.split(/\s*\|\s*|\s+at\s+|\s+@\s+|\s+[–—-]\s+/i)).map(s => s.trim()).filter(s => !!s && !isCandidateName(s));
    const titleIndex = parts.findIndex(roleLike);
    if (titleIndex < 0 && parts.some(degreeLike)) continue;
    const title = titleIndex >= 0 ? parts[titleIndex] : parts.length > 1 ? parts[0] : "";
    const company = parts.find((_,index) => index !== (titleIndex >= 0 ? titleIndex : 0)) || (title ? "" : parts[0] || "");
    if (!title && !company) continue;
    const nextDate = dateIndexes[n+1] ?? lines.length;
    let descriptionEnd = nextDate;
    if (nextDate < lines.length) {
      descriptionEnd = nextDate;
      for (let j = nextDate-1; j > i && nextDate-j <= 2; j--) {
        if (/^[•●▪◦*\-]/.test(lines[j]) || lines[j].length > 140 || (/[.!]$/.test(lines[j]) && !/\b(?:ltd|inc|co|corp|pvt)\.$/i.test(lines[j]))) break;
        descriptionEnd = j;
      }
    }
    entries.push({ id: `w_${entries.length+1}`, title: title.slice(0,120), company: company.slice(0,120), location: (parts.length > 2 ? parts.filter(s => s !== title && s !== company).join(", ") : "").slice(0,120), startDate: match[1], endDate: present(match[2]) ? "" : match[2], current: present(match[2]), description: lines.slice(i+1,descriptionEnd).map(stripBullet).join("\n").slice(0,2500) });
    previousEnd = i;
  }
  return entries.slice(0,25);
}

function educationEntries(lines: string[]): Education[] {
  const entries: Education[] = [];
  const degreeIndexes = lines.flatMap((s,i) => degreeLike(s) ? [i] : []);
  for (let n=0; n<degreeIndexes.length; n++) {
    const index = degreeIndexes[n], next = degreeIndexes[n+1] ?? lines.length;
    const parts = lines[index].split(/\s*\|\s*|\t|\s+[–—-]\s+/).map(s=>s.trim());
    const degree = parts.find(degreeLike) || parts[0];
    const block = [lines[index], ...lines.slice(index+1,next)];
    const institution = parts.find(s => s !== degree && institutionLike(s)) || parts.find(s => s !== degree && /[a-z]/i.test(s) && !/^\d/.test(s)) || lines.slice(index+1,next).find(institutionLike) || (index>0 && !degreeLike(lines[index-1]) && institutionLike(lines[index-1]) ? lines[index-1] : "");
    const years = [...block.join(" ").matchAll(/\b(?:19|20)\d{2}\b/g)].map(m=>m[0]);
    entries.push({ id: `e_${entries.length+1}`, degree: degree.replace(/\b(?:19|20)\d{2}\b.*$/, "").trim().slice(0,120), field: (degree.match(/\bin\s+(.+)/i)?.[1] || "").slice(0,120), institution: institution.slice(0,160), graduationYear: /\b(?:present|pursuing|ongoing|current)\b/i.test(block.join(" ")) ? "" : years.at(-1) || "" });
  }
  return entries.slice(0,20);
}

export function parseResumeText(rawText: string, now = new Date()): ParsedResume {
  const text = clean(rawText); const lines = text.split("\n").map(s=>s.trim()).filter(Boolean);
  const sections: Record<string,string[]> = {}; const contact: string[] = []; let section = "";
  for (const original of lines) {
    const line = original.replace(/^#{1,6}\s+/, "");
    const heading = sectionHeading(line);
    if (heading) { section = heading.key; sections[section] ||= []; if (heading.remainder) sections[section].push(heading.remainder); }
    else if (section) sections[section].push(original);
    else contact.push(original);
  }
  contact.push(...(sections.contact || []));
  const header = contact.slice(0,20).join("\n");
  const email = (text.match(/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] || "").toLowerCase();
  const phoneLines = [...lines.filter(s=>/\b(?:phone|mobile|tel|contact|cell)\b/i.test(s)), ...contact];
  let phone = "";
  for (const line of phoneLines) {
    const candidates = line.match(/\+?\d[\d ().-]{7,24}\d/g) || [];
    const valid = candidates.find(s=>{ const digits=s.replace(/\D/g,""); return digits.length>=10 && digits.length<=15 && !rangePattern.test(s) && !/^(?:19|20)\d{2}[-. ]+(?:19|20)\d{2}$/.test(s); });
    if (valid) { phone=valid.trim(); break; }
  }
  const links = [...text.matchAll(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/|github\.com\/)[\w%.-]+\/?|https?:\/\/[^\s<>|]+/gi)].map(m => m[0].replace(/[.,;)]+$/, "")).map(s=>s.replace(/^http:\/\//i,"https://")).map(s=>/^https:/i.test(s)?s:`https://${s}`);
  const linkedinUrl = links.find(s=>/^https:\/\/(?:www\.)?linkedin\.com\/in\//i.test(s)) || "";
  const githubUrl = links.find(s=>/^https:\/\/(?:www\.)?github\.com\//i.test(s)) || "";
  const portfolioUrl = links.find(s=>!/^https:\/\/(?:www\.)?(?:linkedin\.com|github\.com)(?:\/|$)/i.test(s)) || "";
  const explicitLocation = header.match(/(?:^|[\n|•])\s*(?:(?:current location|location|address|city)\s*[:–—|\-]\s*|(?:current location|location|address|city|based in)\s+)([^\n|•]+)/i)?.[1];
  const cityPattern = /\b(?:Pune|Thane|Bengaluru|Bangalore|Mumbai|Navi Mumbai|New Delhi|Delhi|Hyderabad|Chennai|Gurugram|Gurgaon|Noida|Kolkata|Ahmedabad|Nagpur|Nashik|Indore|Jaipur|Chandigarh|Kochi|Surat|Lucknow|San Francisco|New York|London|Singapore|Dubai|Berlin|Toronto|Seattle|Austin|Boston)\b(?:,\s*[\p{L} .-]+){0,2}/iu;
  const countryNames = new Set(COUNTRIES.map(country => country.name.toLowerCase()));
  const globalLocation = contact.flatMap(line => line.split(/\s*[|•]\s*/)).find(part => /^[\p{L} .'-]+(?:,\s*[\p{L} .'-]+){1,2}$/u.test(part) && countryNames.has(part.split(",").at(-1)!.trim().toLowerCase()));
  const location = (explicitLocation || globalLocation || contact.find(s=>cityPattern.test(s))?.match(cityPattern)?.[0] || "").trim().slice(0,160);
  const nameCandidates = contact.slice(0,8).flatMap(s=>s.split(/\s*[|•]\s*/));
  const name = (header.match(/(?:^|\n)\s*(?:full name|name)\s*:\s*([^\n|]+)/i)?.[1] || nameCandidates.find(s=>/^[\p{L}][\p{L}\p{M} .'-]{1,78}$/u.test(s) && s.split(/\s+/).length>=2 && s.split(/\s+/).length<=6 && !roleLike(s) && !degreeLike(s) && !cityPattern.test(s) && !/resume|curriculum|vitae|portfolio|personal details/i.test(s)) || "").trim().slice(0,80);
  const workHistory = workEntries(sections.experience || [], name);
  const educationIndexes = new Set<number>();
  if (!sections.education) lines.forEach((line, index) => {
    if (degreeLike(line) && line.length <= 160 && !/^[•●▪◦*]|\b(?:required|preferred|seeking)\b/i.test(line) && lines.slice(Math.max(0,index-1),index+3).some(institutionLike)) {
      for (let i=Math.max(0,index-1);i<Math.min(lines.length,index+3);i++) educationIndexes.add(i);
    }
  });
  const fallbackEducation = [...educationIndexes].sort((a,b)=>a-b).map(index=>lines[index]);
  const educationHistory = educationEntries(sections.education || fallbackEducation);
  const headline = (contact.find(s=>roleLike(s) && s.length<=160 && !/[@:]|https?:|\d{7}/.test(s) && !rangePattern.test(s)) || workHistory.find(w=>w.current)?.title || workHistory[0]?.title || "").slice(0,160);
  const explicitExperience = text.match(/\b(\d{1,2}(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+(?:of|overall|total|professional|relevant|work|industry|hands[- ]on))*\s+experience\b/i);
  let experience = explicitExperience ? Math.min(60,Number(explicitExperience[1])) : 0;
  if (!explicitExperience) {
    const currentMonth = now.getFullYear()*12+now.getMonth();
    const intervals = workHistory.flatMap(w=>{ const start=monthNumber(w.startDate), end=w.current?currentMonth:monthNumber(w.endDate || "",true); return start!==null && end!==null && start<=end && start<=currentMonth ? [[start,Math.min(end,currentMonth)]] : []; }).sort((a,b)=>a[0]-b[0]);
    const merged: number[][]=[];
    for(const interval of intervals){ const last=merged.at(-1); if(last && interval[0]<=last[1]+1)last[1]=Math.max(last[1],interval[1]);else merged.push([...interval]); }
    experience=Math.min(60,Math.round(merged.reduce((sum,[start,end])=>sum+end-start+1,0)/12*10)/10);
  }
  const skillItems = (sections.skills || []).flatMap(s=>stripBullet(s).replace(/^[\w &/+-]{2,35}:\s*/,"").split(/[,;|•●▪\n]+/)).map(s=>s.replace(/^[\w &/+-]{2,35}:\s*/, "").trim()).filter(Boolean);
  const skills = [...new Map(skillItems.map(s=>[s.toLowerCase(),s])).values()].join(", ").slice(0,2500);
  const bio = (sections.summary || []).join(" ").slice(0,4000);
  const certifications = (sections.certifications || []).map(stripBullet).join("\n").slice(0,2500);
  const noticeMatch = text.match(/\bnotice period\s*[:–-]?\s*(immediate(?:ly)?|serving notice|\d{1,3}\s*(?:days?|months?|weeks?))/i);
  const noticePeriod = noticeMatch ? (/^immediate/i.test(noticeMatch[1]) ? "Immediate" : noticeMatch[1].replace(/\bdays?\b/i,"Days")) : "";
  const expectedSalary = (text.match(/\b(?:expected salary|expected ctc)\s*[:–-]\s*([^\n|]+)/i)?.[1] || "").slice(0,80);
  const relocation = text.match(/\b(?:open|willing) to relocate\s*[:–-]?\s*(yes|no)?/i);
  const warnings: string[]=[];
  if (!phone) warnings.push("Phone number wasn't detected. Please add it if you'd like recruiters to call you.");
  if (!workHistory.length) warnings.push("No dated work history was detected. You can add roles below, or leave this empty if you're starting your career.");
  if (workHistory.some(role => !role.company)) warnings.push("An employer could not be identified for one or more roles. Please review work history before saving.");
  if (!location) warnings.push("Your current location wasn't detected. Please review it before saving.");
  if (!educationHistory.length) warnings.push("Education wasn't detected. Please review it before saving.");
  if (!skills) warnings.push("Skills weren't detected. Please review the skills section.");
  return { name,email,phone,location,headline,bio,skills,experience,certifications,targetRole:headline.slice(0,120),noticePeriod,expectedSalary,openToRelocation:relocation ? relocation[1]?.toLowerCase()!=="no" : undefined,resumeUrl:"",linkedinUrl,githubUrl,portfolioUrl,workHistory,educationHistory,warnings };
}
