import { corsMiddleware } from "@/middlewares/cors.middleware";
import Router from "@/routes";
import { errorHandler } from "@/middlewares/errorHandler.middleware";
import { loggerMiddleware } from "@/middlewares/logger.middleware";
import { NotFoundError } from "@/lib/error";
import { Hono } from "hono";

// Hono app that start with Bun
export const app = new Hono();

// Middlewares

// CORS middleware
app.use("*", corsMiddleware);

// Logger middleware
app.use("*", loggerMiddleware);

// Error handler middleware
app.onError(errorHandler);

// Not found middleware
app.notFound((c) => {
  throw new NotFoundError(`${c.req.method} ${c.req.path} Route not found`);
});

// Health Check
app.get("/health", (c) => c.json({ status: "ok" }));

// Router
app.route("/", Router);
