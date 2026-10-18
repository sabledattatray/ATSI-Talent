// Read-only production smoke check. Optional argument: http://127.0.0.1:3003
const origin = new URL(process.argv[2] || "https://www.atsai.pro").origin;
const headers = { "User-Agent": "Googlebot", "Cache-Control": "no-cache" };
const sitemap = await fetch(`${origin}/sitemap.xml`, { headers });
if (!sitemap.ok) throw new Error(`Sitemap HTTP ${sitemap.status}`);
const xml = await sitemap.text();
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
if (!urls.length) throw new Error("Empty sitemap");
const titles = new Set();
for (const canonical of urls.slice(0, 50)) {
  const path = new URL(canonical).pathname;
  const response = await fetch(`${origin}${path}`, { headers, redirect: "manual" });
  const html = await response.text();
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  const foundCanonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1];
  const problems = [];
  if (response.status !== 200) problems.push(`HTTP ${response.status}`);
  if (!title || titles.has(title)) problems.push("missing/duplicate title");
  if (!description) problems.push("missing description");
  if (!foundCanonical || new URL(foundCanonical).pathname !== path) problems.push("incorrect canonical");
  if (/noindex/i.test(response.headers.get("x-robots-tag") || "") || /noindex/i.test(robots || "")) problems.push("noindex");
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) problems.push("expected one H1");
  for (const schema of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) JSON.parse(schema[1]);
  if (problems.length) throw new Error(`${path}: ${problems.join(", ")}`);
  titles.add(title);
  console.log(`OK ${path}`);
}
const robots = await (await fetch(`${origin}/robots.txt`, { headers })).text();
if (!robots.includes("Sitemap: https://www.atsai.pro/sitemap.xml")) throw new Error("Missing sitemap declaration");
for (const path of ["/admin/login", "/candidate/signup"]) {
  const response = await fetch(`${origin}${path}`, { headers });
  if (!/noindex/i.test(response.headers.get("x-robots-tag") || "")) throw new Error(`${path}: missing noindex header`);
}
const missing = await fetch(`${origin}/jobs/atsai-seo-nonexistent-check`, { headers, redirect: "manual" });
const missingHtml = await missing.text();
if (missing.status !== 404 && !(missing.status === 200 && /<meta name="robots" content="noindex/.test(missingHtml))) throw new Error(`Missing job is indexable (HTTP ${missing.status})`);
console.log(`SEO checks passed for ${Math.min(urls.length, 50)} sitemap URLs, robots rules, private pages and missing-job exclusion.`);
