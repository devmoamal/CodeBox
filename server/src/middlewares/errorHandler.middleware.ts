import type { Context } from "hono";
import {
  AppError,
  BadRequestError,
  StorageRequestError,
  ValidationError,
} from "@/lib/error";
import { logger } from "@/lib/logger";
import Response from "@/lib/response";
import { ZodError } from "zod";
import { StorageError } from "@/lib/storage";

export const errorHandler = (error: any, c: Context) => {
  // Handle AppError (Custom application errors)
  if (error instanceof AppError) {
    logger.error(`[AppError] ${error.message}`);
    return Response.error(c, error.code, error.message, error.status);
  }

  // Handle Zod Errors (Validation)
  if (error instanceof ZodError) {
    const err = new ValidationError();
    return Response.error(c, err.code, err.message, err.status);
  }

  // Handle Storage Utility Errors
  if (error instanceof StorageError) {
    const err = new StorageRequestError(error.message);
    return Response.error(c, err.code, err.message, err.status);
  }

  // Handle JSON Parsing Errors
  if (error.message?.includes("JSON")) {
    logger.error(`[JSON Error] ${error.message}`);
    const err = new BadRequestError("Invalid JSON");
    return Response.error(c, err.code, err.message, err.status);
  }

  // Handle all other unhandled errors
  logger.error(`[CRITICAL] ${error.stack || error.message}`);
  return Response.error(c, "SERVER_ERROR", "Internal Server Error", 500);
};
