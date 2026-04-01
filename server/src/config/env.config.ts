import { logger } from "@/lib/logger";
import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const envSchema = z.object({
  // Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Server
  PORT: z.string().transform(Number).default(3000),

  // Database
  DATABASE_URL: z.string().min(1).default("file:./storage/database/codebox.db"),

  // Storage
  STORAGE_PATH: z.string().min(1).default("./storage/projects"),
});

const parse = envSchema.safeParse(process.env);

if (!parse.success) {
  logger.error("Invalid environment variables:", parse.error);
  process.exit(1);
}

const env = parse.data;
const isDevelopment = env.NODE_ENV === "development";

export { env, isDevelopment, isProduction };
