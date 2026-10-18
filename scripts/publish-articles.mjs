import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";

// Connect to SQLite database
const dbPath = process.env.ATSAI_DATABASE_PATH || path.join(process.cwd(), "data", "atsai.sqlite");
const client = createClient({ url: pathToFileURL(path.resolve(dbPath)).href });

function parseInlineMarks(text) {
  if (!text) return [];
  const nodes = [];

  // Tokenize regex for links, bold, italic, code
  // Regex matches: [link](url) | **bold** | *italic* | `code`
  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // Link [text](url)
      const linkText = match[2];
      const linkHref = match[3];
      nodes.push({
        type: "text",
        text: linkText,
        marks: [{ type: "link", attrs: { href: linkHref } }]
      });
    } else if (match[4]) {
      // Bold **text**
      nodes.push({
        type: "text",
        text: match[5],
        marks: [{ type: "bold" }]
      });
    } else if (match[6]) {
      // Italic *text*
      nodes.push({
        type: "text",
        text: match[7],
        marks: [{ type: "italic" }]
      });
    } else if (match[8]) {
      // Inline code `text`
      nodes.push({
        type: "text",
        text: match[9],
        marks: [{ type: "code" }]
      });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  return nodes.length ? nodes : [{ type: "text", text }];
}

function markdownToRichDoc(md) {
  const lines = md.split(/\r?\n/);
  const docContent = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // Skip HTML anchor tags like <a id="..."></a>
    if (line.startsWith("<a id=") || line.startsWith("<a name=")) {
      i++;
      continue;
    }

    // Horizontal Rule
    if (line === "---" || line === "***" || line === "___") {
      docContent.push({ type: "horizontalRule" });
      i++;
      continue;
    }

    // Code Block
    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      docContent.push({
        type: "codeBlock",
        content: [{ type: "text", text: codeLines.join("\n") }]
      });
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      const headingText = line.replace(/^###\s+/, "");
      docContent.push({
        type: "heading",
        attrs: { level: 3 },
        content: parseInlineMarks(headingText)
      });
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      const headingText = line.replace(/^##\s+/, "");
      docContent.push({
        type: "heading",
        attrs: { level: 2 },
        content: parseInlineMarks(headingText)
      });
      i++;
      continue;
    }

    // Skip H1 since article page supplies H1
    if (line.startsWith("# ")) {
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }
      docContent.push({
        type: "blockquote",
        content: [{
          type: "paragraph",
          content: parseInlineMarks(quoteLines.join(" "))
        }]
      });
      continue;
    }

    // Table
    if (line.startsWith("|") && line.endsWith("|")) {
      const tableRows = [];
      let isFirst = true;

      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        const rowText = lines[i].trim();
        // Skip separator row like |---|---|
        if (/^\|(\s*[-:]+\s*\|)+$/.test(rowText)) {
          i++;
          continue;
        }

        const cells = rowText
          .slice(1, -1)
          .split("|")
          .map(c => c.trim());

        const cellNodes = cells.map(cellText => ({
          type: isFirst ? "tableHeader" : "tableCell",
          content: [{
            type: "paragraph",
            content: parseInlineMarks(cellText)
          }]
        }));

        tableRows.push({
          type: "tableRow",
          content: cellNodes
        });

        isFirst = false;
        i++;
      }

      if (tableRows.length) {
        docContent.push({
          type: "table",
          content: tableRows
        });
      }
      continue;
    }

    // Unordered List
    if (/^[-*]\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*]\s+/, "");
        listItems.push({
          type: "listItem",
          content: [{
            type: "paragraph",
            content: parseInlineMarks(itemText)
          }]
        });
        i++;
      }
      docContent.push({
        type: "bulletList",
        content: listItems
      });
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
        listItems.push({
          type: "listItem",
          content: [{
            type: "paragraph",
            content: parseInlineMarks(itemText)
          }]
        });
        i++;
      }
      docContent.push({
        type: "orderedList",
        content: listItems
      });
      continue;
    }

    // Regular Paragraph
    // Collect contiguous non-empty lines into a single paragraph
    const pLines = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("---") &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      pLines.push(lines[i].trim());
      i++;
    }

    docContent.push({
      type: "paragraph",
      content: parseInlineMarks(pLines.join(" "))
    });
  }

  return {
    type: "doc",
    content: docContent
  };
}

async function publishAll() {
  const articlesDir = path.resolve("docs/articles");
  const files = [
    { file: "01-what-is-an-applicant-tracking-system.md", cover: "/brand/blog-ats-guide-1200x630.svg", featured: true },
    { file: "02-how-to-create-an-ats-friendly-resume.md", cover: "/brand/blog-ats-resume-1200x630.svg", featured: false },
    { file: "03-recruitment-process-optimization.md", cover: "/brand/blog-recruitment-optimization-1200x630.svg", featured: false },
    { file: "04-ai-in-recruitment.md", cover: "/brand/blog-ai-recruitment-1200x630.svg", featured: false },
    { file: "05-recruitment-software-for-small-businesses.md", cover: "/brand/blog-sme-recruitment-software-1200x630.svg", featured: false }
  ];

  console.log("Publishing 5 High-Authority Articles into ATSAI database...");

  for (const { file, cover, featured } of files) {
    const rawContent = fs.readFileSync(path.join(articlesDir, file), "utf8");

    // Extract metadata from Part B
    const seoTitleMatch = rawContent.match(/- \*\*SEO Title:\*\*\s*(.+)/);
    const metaDescMatch = rawContent.match(/- \*\*Meta Description:\*\*\s*(.+)/);
    const slugMatch = rawContent.match(/- \*\*URL Slug:\*\*\s*`?([a-z0-9-]+)`?/);
    const categoryMatch = rawContent.match(/- \*\*Category:\*\*\s*(.+)/);

    // Extract Part C body
    const partCIndex = rawContent.indexOf("## PART C — COMPLETE ARTICLE");
    const partDIndex = rawContent.indexOf("## PART D — TECHNICAL SEO");

    if (partCIndex === -1 || partDIndex === -1) {
      throw new Error(`Failed to locate Part C or Part D in ${file}`);
    }

    const partCText = rawContent.slice(partCIndex + "## PART C — COMPLETE ARTICLE".length, partDIndex).trim();

    // First H1 in Part C is the article title
    const titleMatch = partCText.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : seoTitleMatch[1].trim();

    // Body text without the title
    const bodyText = partCText.replace(/^#\s+.+$/m, "").trim();
    const richDoc = markdownToRichDoc(bodyText);

    const slug = slugMatch[1].trim();
    const category = categoryMatch ? categoryMatch[1].trim() : "Career insights";
    const seoTitle = seoTitleMatch ? seoTitleMatch[1].trim() : title;
    const seoDescription = metaDescMatch ? metaDescMatch[1].trim() : "";
    const excerpt = seoDescription;
    const author = "ATS AI Editorial Team";
    const now = new Date().toISOString();

    // Stable ID based on slug
    const id = crypto.createHash("md5").update(`atsai-post-${slug}`).digest("hex");

    const record = {
      id,
      kind: "post",
      title,
      slug,
      status: "published",
      excerpt,
      category,
      cover,
      content: richDoc,
      seoTitle,
      seoDescription,
      author,
      featured,
      company: "",
      location: "",
      workMode: "Hybrid",
      employmentType: "Full-time",
      experienceMin: 0,
      experienceMax: 0,
      salaryMin: 0,
      salaryMax: 0,
      skills: "",
      expiresAt: "",
      applicationUrl: "",
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      version: 1
    };

    const docJson = JSON.stringify(record);

    // Upsert into content table
    await client.execute({
      sql: `INSERT INTO content (id, kind, slug, status, document, createdAt, updatedAt, version)
            VALUES (?, 'post', ?, 'published', ?, ?, ?, 1)
            ON CONFLICT(kind, slug) DO UPDATE SET
              status = 'published',
              document = excluded.document,
              updatedAt = excluded.updatedAt`,
      args: [id, slug, docJson, now, now]
    });

    console.log(`✓ Published: "${title}" -> /blog/${slug}`);
  }

  console.log("All 5 articles successfully published in database!");
}

publishAll().catch(e => {
  console.error("Publishing error:", e);
  process.exit(1);
});
