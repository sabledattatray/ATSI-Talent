import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, unlinkSync, rmdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { createClient } from "@libsql/client";

test("editorial seed previews, inserts drafts and preserves edited content on repeated runs", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "atsai-seed-"));
  const filename = path.join(dir, "fixture.sqlite");
  const run = (...flags) => {
    const result = spawnSync(process.execPath, ["scripts/seed-content.mjs", "--database", filename, ...flags], { encoding:"utf8", timeout:30000 });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  const client = createClient({ url:pathToFileURL(filename).href });
  try {
    assert.match(run(), /Dry run only/);
    assert.equal((await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='content'")).rows.length, 0);
    assert.match(run("--apply"), /Seed complete/);
    const seeded = (await client.execute("SELECT * FROM content")).rows;
    assert.equal(seeded.length, 5);
    for (const row of seeded) {
      assert.equal(row.kind, "post");assert.equal(row.status, "draft");
      assert.equal(JSON.parse(row.document).publishedAt, "");
    }
    const edited = JSON.stringify({...JSON.parse(seeded[0].document), title:"Keep this editor change"});
    await client.execute({sql:"UPDATE content SET document=? WHERE id=?",args:[edited,seeded[0].id]});
    assert.match(run("--apply"), /Nothing to seed/);
    assert.equal((await client.execute("SELECT count(*) AS n FROM content")).rows[0].n, 5);
    assert.equal((await client.execute({sql:"SELECT document FROM content WHERE id=?",args:[seeded[0].id]})).rows[0].document, edited);
  } finally { client.close(); for (const suffix of ["", "-wal", "-shm", "-journal"]) { try { unlinkSync(filename + suffix); } catch (error) { if (!["ENOENT", "EBUSY"].includes(error.code)) throw error; } } try { rmdirSync(dir); } catch (error) { if (error.code !== "ENOTEMPTY") throw error; } }
});