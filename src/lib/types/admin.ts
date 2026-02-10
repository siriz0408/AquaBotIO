/**
 * Admin Portal Types
 * TypeScript types for admin entities
 */

// Admin roles enum
export type AdminRole = "super_admin" | "content_admin" | "support_admin";

// User tier enum
export type UserTier = "free" | "starter" | "plus" | "pro";

// User status enum
export type UserStatus = "active" | "suspended" | "banned" | "deleted";

// Feature flag scope enum
export type FeatureFlagScope = "global" | "tier_specific";

// Admin action types for audit log
export type AdminAction =
  | "user_created"
  | "user_updated"
  | "user_suspended"
  | "user_unsuspended"
  | "user_banned"
  | "user_deleted"
  | "subscription_updated"
  | "trial_extended"
  | "credit_issued"
  | "tier_changed"
  | "species_added"
  | "species_updated"
  | "species_deleted"
  | "equipment_added"
  | "equipment_updated"
  | "equipment_deleted"
  | "prompt_created"
  | "prompt_updated"
  | "prompt_activated"
  | "feature_flag_created"
  | "feature_flag_updated"
  | "feature_flag_deleted"
  | "tier_config_updated"
  | "admin_invited"
  | "admin_role_changed"
  | "admin_revoked"
  | "maintenance_mode_toggled"
  | "impersonation_started"
  | "impersonation_ended";

// Admin user interface
export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: AdminRole;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  two_fa_enabled: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

// User interface for admin view
export interface AdminUserView {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  last_login: string | null;
  auth_method: string;
  subscription: {
    tier: UserTier;
    status: string;
    trial_end_date: string | null;
    current_period_end: string | null;
    stripe_customer_id: string | null;
    auto_renew: boolean;
  } | null;
  usage: {
    total_tanks: number;
    total_ai_messages: number;
    ai_messages_last_30_days: number;
    total_tokens_consumed: number;
    estimated_cost: number;
    last_activity_date: string | null;
  };
  status: UserStatus;
}

// User detail interface for admin view
export interface AdminUserDetail extends AdminUserView {
  tanks: AdminTankSummary[];
  recent_conversations: AdminConversationSummary[];
  subscription_history: SubscriptionEvent[];
  admin_notes: AdminNote[];
}

// Tank summary for admin view
export interface AdminTankSummary {
  id: string;
  name: string;
  type: string;
  volume: number;
  volume_unit: string;
  created_at: string;
  last_parameter_log_date: string | null;
}

// Conversation summary for admin view
export interface AdminConversationSummary {
  id: string;
  topic: string | null;
  message_count: number;
  model_used: string;
  created_at: string;
  updated_at: string;
}

// Subscription event interface
export interface SubscriptionEvent {
  id: string;
  event_type: string;
  old_tier: UserTier | null;
  new_tier: UserTier | null;
  amount: number | null;
  currency: string | null;
  created_at: string;
}

// Admin note interface
export interface AdminNote {
  id: string;
  admin_user_id: string;
  admin_email: string;
  note: string;
  created_at: string;
  updated_at: string;
}

// Feature flag interface
export interface FeatureFlag {
  id: string;
  flag_name: string;
  description: string | null;
  enabled: boolean;
  scope: FeatureFlagScope;
  tier: UserTier | null;
  rollout_percent: number;
  created_at: string;
  updated_at: string;
}

// Feature flag create/update input
export interface FeatureFlagInput {
  flag_name: string;
  description?: string;
  enabled: boolean;
  scope: FeatureFlagScope;
  tier?: UserTier;
  rollout_percent?: number;
}

// Audit log entry interface
export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_email: string;
  admin_name: string | null;
  action: AdminAction;
  resource_type: string | null;
  resource_id: string | null;
  changes_before: Record<string, unknown> | null;
  changes_after: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Audit log filters
export interface AuditLogFilters {
  admin_user_id?: string;
  action?: AdminAction;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
}

// Admin dashboard stats
export interface AdminDashboardStats {
  total_users: number;
  active_today: number;
  new_signups_today: number;
  new_signups_week: number;
  new_signups_month: number;
  pro_subscribers: number;
  plus_subscribers: number;
  starter_subscribers: number;
  free_users: number;
  trial_users: number;
  trial_conversion_rate: number;
  churn_rate: number;
  mrr: number;
  arpu: number;
  ai_messages_today: number;
  ai_tokens_today: number;
  ai_cost_today: number;
}

// Tier config interface
export interface TierConfig {
  id: string;
  tier: UserTier;
  max_tanks: number;
  daily_messages_limit: number | null;
  max_photos_per_month: number | null;
  features_enabled: string[];
  created_at: string;
  updated_at: string;
}

// User search/filter params
export interface UserSearchParams {
  query?: string;
  tier?: UserTier;
  status?: UserStatus;
  start_date?: string;
  end_date?: string;
  sort_by?: "created_at" | "last_login" | "email";
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Admin action confirmation
export interface AdminActionConfirmation {
  action: AdminAction;
  user_id: string;
  reason?: string;
  password?: string;
  two_fa_code?: string;
}

// Subscription update input
export interface SubscriptionUpdateInput {
  user_id: string;
  action: "upgrade" | "downgrade" | "cancel" | "extend_trial" | "issue_credit";
  new_tier?: UserTier;
  trial_days?: number;
  credit_amount?: number;
  reason: string;
}
