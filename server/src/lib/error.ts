import type { ErrorCode } from "@CodeBox/shared";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: ContentfulStatusCode = 500,
    public readonly code: ErrorCode = "UNKNOWN",
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message?: string) {
    super(message ? message : "Not found", 404, "NOT_FOUND");
  }
}

export class LimitExceededError extends AppError {
  constructor() {
    super("Limit exceeded", 429, "LIMIT_EXCEEDED");
  }
}

export class ValidationError extends AppError {
  constructor(message?: string) {
    super(message ? message : "Unprocessable Entity", 422, "VALIDATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message?: string) {
    super(message ? message : "Unauthorized", 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(message ? message : "Forbidden", 403, "FORBIDDEN");
  }
}

export class BadRequestError extends AppError {
  constructor(message?: string) {
    super(message ? message : "Bad Request", 400, "BAD_REQUEST");
  }
}

export class ConflictError extends AppError {
  constructor(message?: string) {
    super(message ? message : "Conflict", 409, "CONFLICT");
  }
}

export class ServiceError extends AppError {
  constructor(message?: string) {
    super(
      message ? message : "Error with some server services",
      500,
      "SERVER_ERROR",
    );
  }
}

export class UnknownError extends AppError {
  constructor(message?: string) {
    super(message ? message : "An unexpected error occurred", 500, "UNKNOWN");
  }
}

export class ServerError extends AppError {
  constructor(message?: string) {
    super(
      message ? message : "An unexpected error occurred",
      500,
      "SERVER_ERROR",
    );
  }
}
