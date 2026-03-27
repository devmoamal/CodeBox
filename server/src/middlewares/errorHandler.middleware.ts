import type { Context } from "hono";
import { AppError, BadRequestError, ValidationError } from "@/lib/error";
import { logger } from "@/lib/logger";
import Response from "@/lib/response";
import { ZodError } from "zod";

export const errorHandler = (error: any, c: Context) => {
  // Handle AppError
  if (error instanceof AppError) {
    logger.error(error.message);
    return Response.error(c, error.code, error.message, error.status);
  }

  // Handle unHandled zod errors
  if (error instanceof ZodError) {
    throw new ValidationError();
  }

  // Handle unHandled json errors
  if (error.message.includes("JSON")) {
    logger.error(error.message);
    throw new BadRequestError("Invalid JSON");
  }

  logger.error("[CRITICAL]", error.message);
  return Response.error(c, "SERVER_ERROR", "Internal Server Error", 500);
};
