import { isDevelopment } from "@/config/env.config";
import { cors } from "hono/cors";

export const corsMiddleware = cors({
  // TODO: add production origins
  origin: isDevelopment ? "*" : [],
  allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
  allowHeaders: ["Accept", "Content-Type"],
  maxAge: 600,
});
