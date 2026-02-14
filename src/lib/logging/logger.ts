/**
 * AquaBotAI Structured Logger
 *
 * Single logger instance for the entire application.
 * Uses JSON format for structured logging with wide events pattern.
 *
 * @see https://stripe.com/blog/canonical-log-lines
 */

export type LogLevel = "info" | "error";

export interface LogContext {
  // Request identification
  request_id?: string;
  method?: string;
  path?: string;
  status_code?: number;
  duration_ms?: number;

  // User context (high cardinality)
  user_id?: string;
  subscription_tier?: string;
  tanks_count?: number;

  // Business context
  tank_id?: string;
  feature?: string;
  action?: string;

  // AI-specific
  ai_model?: string;
  ai_tokens_input?: number;
  ai_tokens_output?: number;
  ai_tokens_total?: number;
  daily_limit_remaining?: number;

  // Error context
  error_type?: string;
  error_message?: string;
  error_stack?: string;

  // Environment (auto-populated)
  service?: string;
  version?: string;
  commit_hash?: string;
  environment?: string;
  region?: string;

  // Timestamps
  timestamp?: string;

  // Allow additional fields
  [key: string]: unknown;
}

interface LoggerConfig {
  service: string;
  version: string;
  commitHash: string;
  environment: string;
  region: string;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    // Initialize with environment variables
    this.config = {
      service: "aquabotai-api",
      version: process.env.npm_package_version || "0.1.0",
      commitHash: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || process.env.COMMIT_HASH || "dev",
      environment: process.env.NODE_ENV || "development",
      region: process.env.VERCEL_REGION || process.env.AWS_REGION || "local",
    };
  }

  /**
   * Emit an info-level wide event
   */
  info(context: LogContext): void {
    this.emit("info", context);
  }

  /**
   * Emit an error-level wide event
   */
  error(context: LogContext): void {
    this.emit("error", context);
  }

  /**
   * Core emit function - formats and outputs the log event
   */
  private emit(level: LogLevel, context: LogContext): void {
    const event = {
      level,
      timestamp: context.timestamp || new Date().toISOString(),
      service: this.config.service,
      version: this.config.version,
      commit_hash: this.config.commitHash,
      environment: this.config.environment,
      region: this.config.region,
      ...context,
    };

    // Remove undefined values for cleaner output
    const cleanEvent = Object.fromEntries(
      Object.entries(event).filter(([, v]) => v !== undefined)
    );

    // Output as JSON
    if (level === "error") {
      console.error(JSON.stringify(cleanEvent));
    } else {
      console.log(JSON.stringify(cleanEvent));
    }
  }

  /**
   * Get environment context for including in wide events
   */
  getEnvironmentContext(): Partial<LogContext> {
    return {
      service: this.config.service,
      version: this.config.version,
      commit_hash: this.config.commitHash,
      environment: this.config.environment,
      region: this.config.region,
    };
  }
}

// Export single logger instance
export const logger = new Logger();

// Export type for wide event builders
export type WideEvent = LogContext;
