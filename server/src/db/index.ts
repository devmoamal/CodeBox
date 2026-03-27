import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/config/env.config";
import postgres from "postgres";

const client = postgres(env.POSTGRESQL_URL);

export const db = drizzle({ client });
