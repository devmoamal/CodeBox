import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { env } from "@/config/env.config";
import fs from "node:fs";
import path from "node:path";

const dbPath = env.DATABASE_URL.replace(/^file:/, "");
const dbDir = path.dirname(dbPath);

if (dbDir && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);

export const db = drizzle({ client: sqlite });

