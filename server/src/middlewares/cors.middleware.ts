import { cors } from "hono/cors";

export const corsMiddleware = cors({
  // TODO: add production origins
  origin: "*",
  allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
  allowHeaders: ["Accept", "Content-Type", "authorization"],
  maxAge: 600,
});
