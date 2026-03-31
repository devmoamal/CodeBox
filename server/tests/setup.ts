import { join } from "node:path";
import { rm, mkdir } from "node:fs/promises";
import { beforeAll, afterAll } from "bun:test";

// 1. Setup environment variables for testing
// Important to do this BEFORE any other module imports @/config/env.config
process.env.NODE_ENV = "test";
process.env.STORAGE_PATH = "./storage/test";
process.env.DATABASE_URL = ":memory:";

// 2. Use dynamic imports to avoid hoisting and ensure process.env is set
const { db } = await import("@/db");
const { migrate } = await import("drizzle-orm/bun-sqlite/migrator");

beforeAll(async () => {
  // Ensure test storage directory exists
  await mkdir(join(process.cwd(), process.env.STORAGE_PATH!), { recursive: true });
  
  // Run migrations on the in-memory database
  try {
    await migrate(db as any, { migrationsFolder: "./drizzle" });
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
});

afterAll(async () => {
  // Cleanup test storage directory
  await rm(join(process.cwd(), process.env.STORAGE_PATH!), {
    recursive: true,
    force: true,
  });
});
