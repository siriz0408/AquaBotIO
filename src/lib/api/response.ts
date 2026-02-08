import { NextResponse } from "next/server";

/**
 * Standard API response envelope per CLAUDE.md spec
 */

// Error codes as defined in CLAUDE.md
export type ErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_EXPIRED"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "TIER_REQUIRED"
  | "DAILY_LIMIT_REACHED"
  | "RATE_LIMIT_EXCEEDED"
  | "INVALID_INPUT"
  | "STRIPE_ERROR"
  | "AI_UNAVAILABLE"
  | "INTERNAL_SERVER_ERROR"
  | "CONFLICT";

// HTTP status codes for each error
const ERROR_STATUS: Record<ErrorCode, number> = {
  AUTH_REQUIRED: 401,
  AUTH_EXPIRED: 401,
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  TIER_REQUIRED: 403,
  DAILY_LIMIT_REACHED: 429,
  RATE_LIMIT_EXCEEDED: 429,
  INVALID_INPUT: 400,
  STRIPE_ERROR: 500,
  AI_UNAVAILABLE: 503,
  INTERNAL_SERVER_ERROR: 500,
  CONFLICT: 409,
};

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: ErrorCode; message: string } | null;
  meta: { timestamp: string; request_id: string };
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: generateRequestId(),
      },
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status?: number
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: { code, message },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: generateRequestId(),
      },
    },
    { status: status || ERROR_STATUS[code] }
  );
}

/**
 * Create a validation error response from Zod errors
 */
export function validationErrorResponse(
  errors: Record<string, string[]>
): NextResponse<ApiResponse<null>> {
  const message = Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
    .join("; ");

  return errorResponse("INVALID_INPUT", message);
}
