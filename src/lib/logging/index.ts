/**
 * AquaBotAI Logging Module
 *
 * Structured logging with wide events pattern.
 *
 * @example
 * ```typescript
 * // In API routes - use withLogging wrapper
 * import { withLogging } from "@/lib/logging";
 *
 * export const POST = withLogging(async (request, wideEvent) => {
 *   await wideEvent.withUser(userId);
 *   wideEvent.withTank(tankId);
 *   wideEvent.withAction("ai", "chat");
 *   wideEvent.withAI({ model: "claude-haiku", inputTokens: 100, outputTokens: 50 });
 *
 *   return NextResponse.json({ success: true });
 * });
 *
 * // For standalone events (cron jobs, webhooks)
 * import { logEvent, logError } from "@/lib/logging";
 *
 * logEvent("cron", "daily-coaching", { users_processed: 150 });
 * logError("webhook", "stripe", error, { event_type: "invoice.paid" });
 * ```
 */

export { logger, type LogLevel, type LogContext, type WideEvent } from "./logger";
export {
  generateRequestId,
  getRequestContext,
  getUserContext,
  getAIContext,
  getErrorContext,
  createWideEvent,
  WideEventBuilder,
} from "./context";
export { withLogging, logRequest, logEvent, logError } from "./middleware";
