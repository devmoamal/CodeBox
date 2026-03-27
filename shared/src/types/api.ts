import { API_ERROR_CODE } from "@/constants";

/**
 * Base API response
 */
export type ApiResponse = {
  ok: boolean;
  message?: string;
};

/**
 * Success response with data
 */
export type SuccessResponse<T> = ApiResponse & {
  data?: T;
  ok: true;
};

/**
 * Error response
 */
export type ErrorResponse = ApiResponse & {
  ok: false;
  error?: ErrorCode;
};

/**
 * API error codes
 */
export type ErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE];
