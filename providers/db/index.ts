import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

/**
 * The core database connection instance.
 * For local-first architecture, we use better-sqlite3 with a local sqlite file.
 * This runs locally on the machine without needing any external database servers or Docker containers.
 */
const dbPath = process.env.DATABASE_URL?.replace('sqlite://', '').replace('file:', '') || path.join(process.cwd(), "local.db");
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
