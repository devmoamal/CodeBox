import type { Context } from "hono";
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";
import { ErrorCode, ErrorResponse, SuccessResponse } from "@codebox/shared";

class Response {
  static success<T>(
    context: Context,
    data?: T,
    message?: string,
    status: ContentfulStatusCode = 200,
  ) {
    return context.json<SuccessResponse<T>>(
      {
        ok: true,
        data,
        message,
      },
      status,
    );
  }

  static error(
    context: Context,
    code: ErrorCode,
    message: string,
    status: ContentfulStatusCode,
  ) {
    return context.json<ErrorResponse>(
      {
        ok: false,
        message,
        error: code,
      },
      status,
    );
  }

  static empty(context: Context, status: StatusCode) {
    return context.newResponse(null, status);
  }
}

export default Response;
