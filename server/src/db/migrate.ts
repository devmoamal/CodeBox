import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./index";
import path from "node:path";

async function runMigrations() {
  console.log("🔄 Starting database migrations...");
  
  try {
    // This will run all migrations from the drizzle folder
    await migrate(db, { 
      migrationsFolder: path.join(process.cwd(), "drizzle") 
    });
    
    console.log("✅ Migrations completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
