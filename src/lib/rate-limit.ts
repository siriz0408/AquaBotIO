/**
 * Rate Limiting Utility
 *
 * Per CLAUDE.md: "Rate limit auth endpoints: 5 attempts per 15 minutes per IP"
 *
 * Uses in-memory rate limiting for development and Upstash Redis for production.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for development (no Redis required)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

/**
 * In-memory rate limiter for development
 */
function inMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const record = inMemoryStore.get(key);

  if (!record || now > record.resetAt) {
    // First request or window expired
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      remaining: limit - 1,
      reset: now + windowMs,
      limit,
    };
  }

  if (record.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      reset: record.resetAt,
      limit,
    };
  }

  // Increment count
  record.count += 1;
  inMemoryStore.set(key, record);

  return {
    success: true,
    remaining: limit - record.count,
    reset: record.resetAt,
    limit,
  };
}

/**
 * Create Upstash rate limiter for production
 */
function createUpstashRateLimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
    analytics: true,
    prefix: "aquabot:ratelimit:auth",
  });
}

// Singleton instance
let upstashLimiter: Ratelimit | null = null;

/**
 * Rate limit check for authentication endpoints
 *
 * @param identifier - Usually the IP address or user email
 * @returns Rate limit result with success status and metadata
 */
export async function checkAuthRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  // Try Upstash in production
  if (process.env.NODE_ENV === "production") {
    if (!upstashLimiter) {
      upstashLimiter = createUpstashRateLimiter();
    }

    if (upstashLimiter) {
      try {
        const result = await upstashLimiter.limit(identifier);
        return {
          success: result.success,
          remaining: result.remaining,
          reset: result.reset,
          limit: result.limit,
        };
      } catch (error) {
        console.error("Upstash rate limit error, falling back to in-memory:", error);
        // Fall through to in-memory
      }
    }
  }

  // Use in-memory for development or as fallback
  return inMemoryRateLimit(identifier, 5, 15 * 60 * 1000); // 5 per 15 min
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback for local development
  return "127.0.0.1";
}

/**
 * Rate limit headers to include in response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}
