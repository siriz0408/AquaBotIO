/**
 * Request Context Helpers
 *
 * Utilities for building wide event context from requests and user data.
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { WideEvent } from "./logger";

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Extract request context from NextRequest
 */
export function getRequestContext(request: NextRequest, requestId: string): Partial<WideEvent> {
  const url = new URL(request.url);

  return {
    request_id: requestId,
    method: request.method,
    path: url.pathname,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch user context for wide events
 * Includes subscription tier and tank count for business context
 */
export async function getUserContext(userId: string): Promise<Partial<WideEvent>> {
  try {
    const supabase = await createClient();

    // Fetch user subscription in parallel with tank count
    const [subscriptionResult, tanksResult] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("tanks")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .is("deleted_at", null),
    ]);

    const tier = subscriptionResult.data?.tier || "free";
    const tanksCount = tanksResult.count || 0;

    return {
      user_id: userId,
      subscription_tier: tier,
      tanks_count: tanksCount,
    };
  } catch {
    // Return minimal context on error - don't fail the request
    return {
      user_id: userId,
    };
  }
}

/**
 * Extract AI usage context
 */
export function getAIContext(params: {
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  dailyLimitRemaining?: number;
}): Partial<WideEvent> {
  return {
    ai_model: params.model,
    ai_tokens_input: params.inputTokens,
    ai_tokens_output: params.outputTokens,
    ai_tokens_total:
      params.inputTokens && params.outputTokens
        ? params.inputTokens + params.outputTokens
        : undefined,
    daily_limit_remaining: params.dailyLimitRemaining,
  };
}

/**
 * Extract error context from an Error object
 */
export function getErrorContext(error: unknown): Partial<WideEvent> {
  if (error instanceof Error) {
    return {
      error_type: error.name,
      error_message: error.message,
      error_stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  return {
    error_type: "Unknown",
    error_message: String(error),
  };
}

/**
 * Create a wide event builder for accumulating context throughout a request
 */
export function createWideEvent(request: NextRequest): WideEventBuilder {
  return new WideEventBuilder(request);
}

/**
 * Wide Event Builder
 *
 * Accumulates context throughout request handling and emits a single
 * wide event at the end.
 */
export class WideEventBuilder {
  private event: WideEvent;
  private startTime: number;

  constructor(request: NextRequest) {
    this.startTime = Date.now();
    const requestId = generateRequestId();
    this.event = getRequestContext(request, requestId);
  }

  /**
   * Add user context
   */
  async withUser(userId: string): Promise<this> {
    const userContext = await getUserContext(userId);
    Object.assign(this.event, userContext);
    return this;
  }

  /**
   * Add user context synchronously (when you already have the data)
   */
  withUserSync(params: {
    userId: string;
    tier?: string;
    tanksCount?: number;
  }): this {
    this.event.user_id = params.userId;
    if (params.tier) this.event.subscription_tier = params.tier;
    if (params.tanksCount !== undefined) this.event.tanks_count = params.tanksCount;
    return this;
  }

  /**
   * Add tank context
   */
  withTank(tankId: string): this {
    this.event.tank_id = tankId;
    return this;
  }

  /**
   * Add feature/action context
   */
  withAction(feature: string, action?: string): this {
    this.event.feature = feature;
    if (action) this.event.action = action;
    return this;
  }

  /**
   * Add AI usage context
   */
  withAI(params: {
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    dailyLimitRemaining?: number;
  }): this {
    Object.assign(this.event, getAIContext(params));
    return this;
  }

  /**
   * Add arbitrary context
   */
  with(context: Partial<WideEvent>): this {
    Object.assign(this.event, context);
    return this;
  }

  /**
   * Set status code
   */
  withStatus(statusCode: number): this {
    this.event.status_code = statusCode;
    return this;
  }

  /**
   * Add error context
   */
  withError(error: unknown): this {
    Object.assign(this.event, getErrorContext(error));
    return this;
  }

  /**
   * Get the request ID for response headers
   */
  getRequestId(): string {
    return this.event.request_id || "unknown";
  }

  /**
   * Finalize and return the wide event (calculates duration)
   */
  build(): WideEvent {
    this.event.duration_ms = Date.now() - this.startTime;
    return this.event;
  }
}
