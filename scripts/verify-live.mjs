async function verify() {
  const base = process.argv[2] || "http://127.0.0.1:3001";
  console.log(`Checking target: ${base}`);
  const slugs = [
    "what-is-an-applicant-tracking-system",
    "how-to-create-an-ats-friendly-resume",
    "recruitment-process-optimization",
    "ai-in-recruitment",
    "recruitment-software-for-small-businesses"
  ];

  console.log("=== Checking /blog Index ===");
  const blogRes = await fetch(`${base}/blog`);
  console.log("/blog HTTP Status:", blogRes.status);
  const blogHtml = await blogRes.text();
  for (const s of slugs) {
    console.log(`  - /blog contains link to '${s}':`, blogHtml.includes(s));
  }

  console.log("\n=== Checking Individual Article Routes ===");
  for (const s of slugs) {
    const res = await fetch(`${base}/blog/${s}`);
    console.log(`  - /blog/${s} -> Status:`, res.status);
  }

  console.log("\n=== Checking /sitemap.xml ===");
  const sitemapRes = await fetch(`${base}/sitemap.xml`);
  console.log("/sitemap.xml HTTP Status:", sitemapRes.status);
  const sitemapXml = await sitemapRes.text();
  for (const s of slugs) {
    console.log(`  - Sitemap has '/blog/${s}':`, sitemapXml.includes(`/blog/${s}`));
  }
}

verify().catch(console.error);
