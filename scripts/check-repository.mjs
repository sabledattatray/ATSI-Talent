import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
const result = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" });
if (result.status !== 0) throw new Error("Could not inspect the Git file list.");
const files = [...new Set(result.stdout.split("\0").filter(Boolean))];
const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ["GitHub access token", /gh[pousr]_[A-Za-z0-9]{30,255}|github_pat_[A-Za-z0-9_]{50,255}/],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["API secret key", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}/],
];
const errors = [];
for (const file of files) {
  if (/(?:^data(?:\/|$)|(^|\/)(?:node_modules|\.git|\.next[^/]*)(?:\/|$))/.test(file) || /(?:^|\/)\.env(?:\.|$)/.test(file) && file !== ".env.example" || /\.(?:sqlite(?:3)?(?:-wal|-shm)?|db(?:-wal|-shm)?|pem|key|p12|pfx)$/i.test(file)) errors.push(`${file}: private or generated file must not be published`);
  let stat; try { stat = statSync(file); } catch { continue; }
  if (!stat.isFile()) continue;
  if (stat.size > 50 * 1024 * 1024) errors.push(`${file}: exceeds the repository's 50 MB file budget`);
  if (/\.(?:png|jpg|jpeg|webp|ico|woff2?|ttf|otf|zip|pdf)$/i.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const [name, regex] of patterns) if (regex.test(text)) errors.push(`${file}: possible ${name}; inspect before publishing`);
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Repository checks passed: ${files.length} files; no excluded runtime data or recognized credential patterns.`);
