import { DatabaseSync, backup } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
const source = path.resolve(process.env.ATSAI_DATABASE_PATH || "data/atsai.sqlite");
if (!existsSync(source)) throw new Error("No admin database exists yet. Create your owner account first.");
const destination = path.resolve(process.argv[2] || path.join("data", "backups", `atsai-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`));
if (destination === source || existsSync(destination)) throw new Error("Choose a new backup file; existing files are not overwritten.");
mkdirSync(path.dirname(destination), { recursive: true });
const database = new DatabaseSync(source, { readOnly: true });
try { await backup(database, destination); console.log(`Admin database backed up to ${destination}`); } finally { database.close(); }
