import { unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";

const DB_PATH = join(process.cwd(), "storage/database/codebox.db");

console.log(`🗑️ Attempting to drop database at: ${DB_PATH}`);

try {
  if (existsSync(DB_PATH)) {
    unlinkSync(DB_PATH);
    console.log("✅ Database dropped successfully.");
  } else {
    console.log("ℹ️ Database file not found, skipping.");
  }
} catch (error) {
  console.error("❌ Failed to drop database:", error);
  process.exit(1);
}
