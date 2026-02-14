/**
 * Logging Middleware for API Routes
 *
 * Provides utilities for wrapping API handlers with wide event logging.
 * Automatically captures timing, status codes, and errors.
 */

import { NextRequest, NextResponse } from "next/server";
import { logger, type WideEvent } from "./logger";
import { createWideEvent, WideEventBuilder } from "./context";

/**
 * Handler function type with wide event context
 */
type HandlerWithContext = (
  request: NextRequest,
  wideEvent: WideEventBuilder
) => Promise<NextResponse>;

/**
 * Wrap an API handler with wide event logging
 *
 * Usage:
 * ```typescript
 * export const POST = withLogging(async (request, wideEvent) => {
 *   // Add business context as you process the request
 *   await wideEvent.withUser(userId);
 *   wideEvent.withTank(tankId);
 *   wideEvent.withAction("ai", "coaching");
 *
 *   // Your handler logic...
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withLogging(handler: HandlerWithContext) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const wideEvent = createWideEvent(request);

    try {
      const response = await handler(request, wideEvent);

      // Extract status from response
      wideEvent.withStatus(response.status);

      // Emit the wide event
      const event = wideEvent.build();
      logger.info(event);

      // Add request ID to response headers for tracing
      const headers = new Headers(response.headers);
      headers.set("x-request-id", wideEvent.getRequestId());

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      // Capture error context
      wideEvent.withError(error);
      wideEvent.withStatus(500);

      // Emit error event
      const event = wideEvent.build();
      logger.error(event);

      // Re-throw to let Next.js handle the error response
      throw error;
    }
  };
}

/**
 * Simple request logger for routes that don't need full wide event building
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return logRequest(request, async (wideEvent) => {
 *     wideEvent.withAction("species", "list");
 *     // Your handler logic...
 *     return NextResponse.json(data);
 *   });
 * }
 * ```
 */
export async function logRequest(
  request: NextRequest,
  handler: (wideEvent: WideEventBuilder) => Promise<NextResponse>
): Promise<NextResponse> {
  const wideEvent = createWideEvent(request);

  try {
    const response = await handler(wideEvent);
    wideEvent.withStatus(response.status);

    const event = wideEvent.build();
    logger.info(event);

    const headers = new Headers(response.headers);
    headers.set("x-request-id", wideEvent.getRequestId());

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    wideEvent.withError(error);
    wideEvent.withStatus(500);

    const event = wideEvent.build();
    logger.error(event);

    throw error;
  }
}

/**
 * Log a standalone event (not tied to a request)
 *
 * Useful for background jobs, cron tasks, webhooks, etc.
 */
export function logEvent(
  feature: string,
  action: string,
  context: Partial<WideEvent> = {}
): void {
  const event: WideEvent = {
    feature,
    action,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (context.error_type || context.error_message) {
    logger.error(event);
  } else {
    logger.info(event);
  }
}

/**
 * Log an error event
 */
export function logError(
  feature: string,
  action: string,
  error: unknown,
  context: Partial<WideEvent> = {}
): void {
  const errorContext =
    error instanceof Error
      ? {
          error_type: error.name,
          error_message: error.message,
          error_stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        }
      : {
          error_type: "Unknown",
          error_message: String(error),
        };

  const event: WideEvent = {
    feature,
    action,
    timestamp: new Date().toISOString(),
    ...errorContext,
    ...context,
  };

  logger.error(event);
}
