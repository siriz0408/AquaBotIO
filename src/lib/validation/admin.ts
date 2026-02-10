import { z } from "zod";

/**
 * Admin validation schemas
 * Spec: 13_Admin_Portal_Management_Spec.md
 */

// ============================================================================
// ENUMS
// ============================================================================

export const adminRoleEnum = z.enum(["super_admin", "content_admin", "support_admin"]);
export type AdminRoleType = z.infer<typeof adminRoleEnum>;

export const adminActionTypeEnum = z.enum([
  // User management
  "user_viewed",
  "user_updated",
  "user_suspended",
  "user_unsuspended",
  "user_deleted",
  // Subscription management
  "subscription_updated",
  "subscription_tier_changed",
  "subscription_trial_extended",
  "subscription_credits_issued",
  // Feature flags
  "feature_flag_created",
  "feature_flag_updated",
  "feature_flag_deleted",
  // Tier config
  "tier_config_updated",
  // Content management
  "species_created",
  "species_updated",
  "species_deleted",
  "equipment_created",
  "equipment_updated",
  "equipment_deleted",
  // Admin management
  "admin_created",
  "admin_updated",
  "admin_deleted",
  // System
  "system_config_updated",
]);
export type AdminActionType = z.infer<typeof adminActionTypeEnum>;

export const featureFlagScopeEnum = z.enum(["global", "tier_specific"]);
export type FeatureFlagScope = z.infer<typeof featureFlagScopeEnum>;

export const subscriptionTierEnum = z.enum(["free", "starter", "plus", "pro"]);
export type SubscriptionTier = z.infer<typeof subscriptionTierEnum>;

// ============================================================================
// USER MANAGEMENT SCHEMAS
// ============================================================================

// User list query params
export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  tier: subscriptionTierEnum.optional(),
  sort_by: z.enum(["created_at", "email", "last_login"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});
export type UserListQuery = z.infer<typeof userListQuerySchema>;

// User update request
export const userUpdateSchema = z.object({
  tier: subscriptionTierEnum.optional(),
  trial_extension_days: z.number().int().min(1).max(30).optional(),
  credits_amount_cents: z.number().int().min(0).max(10000).optional(), // Max $100
  reason: z.string().min(1).max(500).optional(),
});
export type UserUpdate = z.infer<typeof userUpdateSchema>;

// User detail response
export const userDetailSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  skill_level: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  // Subscription
  subscription: z.object({
    tier: subscriptionTierEnum,
    status: z.string(),
    trial_ends_at: z.string().nullable(),
    current_period_end: z.string().nullable(),
    stripe_customer_id: z.string().nullable(),
  }).nullable(),
  // Usage stats
  stats: z.object({
    total_tanks: z.number(),
    total_ai_messages_today: z.number(),
    total_ai_messages_all_time: z.number(),
    last_activity_at: z.string().nullable(),
  }),
});
export type UserDetail = z.infer<typeof userDetailSchema>;

// ============================================================================
// AUDIT LOG SCHEMAS
// ============================================================================

// Audit log query params
export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  admin_id: z.string().uuid().optional(),
  action: adminActionTypeEnum.optional(),
  target_type: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

// Audit log entry
export const auditLogEntrySchema = z.object({
  id: z.string().uuid(),
  admin_user_id: z.string().uuid(),
  admin_email: z.string().email().optional(),
  action: adminActionTypeEnum,
  target_type: z.string(),
  target_id: z.string().nullable(),
  old_value: z.unknown().nullable(),
  new_value: z.unknown().nullable(),
  reason: z.string().nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string(),
});
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

// ============================================================================
// FEATURE FLAG SCHEMAS
// ============================================================================

// Feature flag create/update
export const featureFlagSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z][a-z0-9_]*$/, "Name must be lowercase, start with letter, only contain letters, numbers, underscores"),
  description: z.string().max(500).optional(),
  is_enabled: z.boolean().default(false),
  scope: featureFlagScopeEnum.default("global"),
  enabled_tiers: z.array(subscriptionTierEnum).default([]),
  rollout_percent: z.number().int().min(0).max(100).default(100),
});
export type FeatureFlag = z.infer<typeof featureFlagSchema>;

// Feature flag update (partial)
export const featureFlagUpdateSchema = featureFlagSchema.partial().omit({ name: true });
export type FeatureFlagUpdate = z.infer<typeof featureFlagUpdateSchema>;

// Feature flag response
export const featureFlagResponseSchema = featureFlagSchema.extend({
  id: z.string().uuid(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type FeatureFlagResponse = z.infer<typeof featureFlagResponseSchema>;

// ============================================================================
// TIER CONFIG SCHEMAS
// ============================================================================

// Tier config update
export const tierConfigUpdateSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  price_monthly_cents: z.number().int().min(0).optional(),
  max_tanks: z.number().int().min(1).optional(),
  daily_ai_messages: z.number().int().min(0).optional(),
  daily_photo_diagnoses: z.number().int().min(0).optional(),
  daily_equipment_recs: z.number().int().min(0).optional(),
  features_enabled: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});
export type TierConfigUpdate = z.infer<typeof tierConfigUpdateSchema>;

// Tier config response
export const tierConfigResponseSchema = z.object({
  id: z.string().uuid(),
  tier: subscriptionTierEnum,
  display_name: z.string(),
  price_monthly_cents: z.number(),
  max_tanks: z.number(),
  daily_ai_messages: z.number(),
  daily_photo_diagnoses: z.number(),
  daily_equipment_recs: z.number(),
  features_enabled: z.array(z.string()),
  is_active: z.boolean(),
  sort_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type TierConfigResponse = z.infer<typeof tierConfigResponseSchema>;

// ============================================================================
// STATS SCHEMAS
// ============================================================================

export const dashboardStatsSchema = z.object({
  users: z.object({
    total: z.number(),
    active_today: z.number(),
    active_this_week: z.number(),
    active_this_month: z.number(),
    new_today: z.number(),
    new_this_week: z.number(),
    new_this_month: z.number(),
  }),
  subscriptions: z.object({
    total_free: z.number(),
    total_starter: z.number(),
    total_plus: z.number(),
    total_pro: z.number(),
    trialing: z.number(),
    past_due: z.number(),
  }),
  ai_usage: z.object({
    messages_today: z.number(),
    messages_this_week: z.number(),
    messages_this_month: z.number(),
  }),
  // Revenue metrics (placeholder - actual values from Stripe)
  revenue: z.object({
    mrr_cents: z.number(),
    estimated: z.boolean(), // True if calculated locally, false if from Stripe
  }),
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate user list query parameters
 */
export function validateUserListQuery(params: URLSearchParams): {
  success: boolean;
  data?: UserListQuery;
  errors?: Record<string, string[]>;
} {
  const rawParams = {
    page: params.get("page") || undefined,
    limit: params.get("limit") || undefined,
    search: params.get("search") || undefined,
    tier: params.get("tier") || undefined,
    sort_by: params.get("sort_by") || undefined,
    sort_order: params.get("sort_order") || undefined,
  };

  const result = userListQuerySchema.safeParse(rawParams);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "general";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Validate user update request body
 */
export function validateUserUpdate(data: unknown): {
  success: boolean;
  data?: UserUpdate;
  errors?: Record<string, string[]>;
} {
  const result = userUpdateSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "general";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Validate audit log query parameters
 */
export function validateAuditLogQuery(params: URLSearchParams): {
  success: boolean;
  data?: AuditLogQuery;
  errors?: Record<string, string[]>;
} {
  const rawParams = {
    page: params.get("page") || undefined,
    limit: params.get("limit") || undefined,
    admin_id: params.get("admin_id") || undefined,
    action: params.get("action") || undefined,
    target_type: params.get("target_type") || undefined,
    start_date: params.get("start_date") || undefined,
    end_date: params.get("end_date") || undefined,
  };

  const result = auditLogQuerySchema.safeParse(rawParams);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "general";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Validate feature flag create
 */
export function validateFeatureFlagCreate(data: unknown): {
  success: boolean;
  data?: FeatureFlag;
  errors?: Record<string, string[]>;
} {
  const result = featureFlagSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "general";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Validate feature flag update
 */
export function validateFeatureFlagUpdate(data: unknown): {
  success: boolean;
  data?: FeatureFlagUpdate;
  errors?: Record<string, string[]>;
} {
  const result = featureFlagUpdateSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "general";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Validate feature flag create/update (legacy - use validateFeatureFlagCreate or validateFeatureFlagUpdate)
 * @deprecated Use validateFeatureFlagCreate or validateFeatureFlagUpdate instead
 */
export function validateFeatureFlag(data: unknown, isUpdate = false): {
  success: boolean;
  data?: FeatureFlag | FeatureFlagUpdate;
  errors?: Record<string, string[]>;
} {
  const schema = isUpdate ? featureFlagUpdateSchema : featureFlagSchema;
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "general";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Validate tier config update
 */
export function validateTierConfigUpdate(data: unknown): {
  success: boolean;
  data?: TierConfigUpdate;
  errors?: Record<string, string[]>;
} {
  const result = tierConfigUpdateSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "general";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}
