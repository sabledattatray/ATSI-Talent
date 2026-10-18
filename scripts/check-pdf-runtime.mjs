// Run after next build. Reproduces serverless packaging without access to the
// development node_modules tree, including native DOM polyfills and PDF worker.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { pdfFixture } from "../tests/fixtures/pdf.mjs";

const trace = path.resolve(process.env.ATSAI_BUILD_DIR || ".next", "server/app/api/recruitment/[...path]/route.js.nft.json");
const { files } = JSON.parse(await fs.readFile(trace, "utf8"));
const temporaryRoot = await fs.realpath(os.tmpdir());
const runtime = await fs.mkdtemp(path.join(temporaryRoot, "atsai-pdf-runtime-"));
try {
  for (const relative of files) {
    const source = path.resolve(path.dirname(trace), relative);
    const local = path.relative(process.cwd(), source);
    if (!local.startsWith(`node_modules${path.sep}`)) continue;
    const destination = path.join(runtime, local);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  }
  const pdf = path.join(runtime, "fixture.pdf");
  await fs.writeFile(pdf, pdfFixture(["Jane Doe", "Registered Nurse", "Location: London, United Kingdom", "SKILLS: Nursing, Patient care"]));
  const entry = pathToFileURL(path.join(runtime, "node_modules/pdf-parse/dist/pdf-parse/esm/index.js")).href;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import fs from "node:fs/promises";
    import assert from "node:assert/strict";
    const { PDFParse } = await import(${JSON.stringify(entry)});
    const parser = new PDFParse({ data: new Uint8Array(await fs.readFile(${JSON.stringify(pdf)})), isEvalSupported: false });
    try { const result = await parser.getText(); assert.match(result.text, /Jane Doe/); assert.match(result.text, /Patient care/); }
    finally { await parser.destroy(); }
  `], { cwd: runtime, encoding: "utf8", timeout: 30000, env: { ...process.env, NODE_PATH: "" } });
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
  console.log("PASS compressed PDF extraction using only production-traced dependencies.");
} finally {
  // Remove only the dedicated temporary directory created above. The child has
  // exited, so Windows has released the native canvas binary before cleanup.
  assert.equal(path.dirname(runtime), temporaryRoot);
  assert.ok(path.basename(runtime).startsWith("atsai-pdf-runtime-"));
  await fs.rm(runtime, { recursive: true, force: true });
}
