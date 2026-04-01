import { defineConfig } from "drizzle-kit";
import fs from "node:fs";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL ?? "file:./storage/database/codebox.db";
const dbPath = databaseUrl.replace(/^file:/, "");
const dbDir = path.dirname(dbPath);

if (dbDir && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseUrl,
  },
});

