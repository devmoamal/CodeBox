import { env } from "@/config/env.config";
import Redis from "ioredis";

export const redis = new Redis(env.REDIS_URL);
