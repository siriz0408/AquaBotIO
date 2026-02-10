import { createClient } from "@supabase/supabase-js";
import type { AdminActionType } from "@/lib/validation/admin";

/**
 * Audit Logger for Admin Actions
 *
 * Uses Supabase service role key to bypass RLS and write to admin_audit_log.
 * This ensures all admin actions are logged immutably.
 *
 * Spec: 13_Admin_Portal_Management_Spec.md
 */

// Initialize Supabase client with service role key (bypasses RLS)
// This is necessary because admin_audit_log has no INSERT policy for regular users
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Audit log entry to be recorded
 */
export interface AuditLogInput {
  adminUserId: string;
  action: AdminActionType;
  targetType: string;
  targetId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

/**
 * Log an admin action to the audit log
 *
 * IMPORTANT: This function should be called BEFORE executing the action,
 * per spec requirement "logs are written before execution".
 * However, for actions that may fail, you may want to log after verification
 * to avoid phantom log entries.
 *
 * @param input - Audit log entry data
 * @returns Promise<{success: boolean, error?: string}>
 */
export async function logAdminAction(
  input: AuditLogInput
): Promise<{ success: boolean; error?: string; logId?: string }> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("admin_audit_log")
      .insert({
        admin_user_id: input.adminUserId,
        action: input.action,
        target_type: input.targetType,
        target_id: input.targetId || null,
        old_value: input.oldValue ? JSON.parse(JSON.stringify(input.oldValue)) : null,
        new_value: input.newValue ? JSON.parse(JSON.stringify(input.newValue)) : null,
        reason: input.reason || null,
        ip_address: input.ipAddress || null,
        user_agent: input.userAgent || null,
        request_id: input.requestId || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to write audit log:", error);
      return { success: false, error: error.message };
    }

    return { success: true, logId: data?.id };
  } catch (error) {
    console.error("Audit log error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper class to build audit log entries with a fluent API
 */
export class AuditLogBuilder {
  private entry: Partial<AuditLogInput> = {};

  constructor(adminUserId: string) {
    this.entry.adminUserId = adminUserId;
  }

  action(action: AdminActionType): this {
    this.entry.action = action;
    return this;
  }

  target(type: string, id?: string | null): this {
    this.entry.targetType = type;
    this.entry.targetId = id;
    return this;
  }

  before(value: unknown): this {
    this.entry.oldValue = value;
    return this;
  }

  after(value: unknown): this {
    this.entry.newValue = value;
    return this;
  }

  reason(reason: string): this {
    this.entry.reason = reason;
    return this;
  }

  clientInfo(ipAddress: string | null, userAgent: string | null): this {
    this.entry.ipAddress = ipAddress;
    this.entry.userAgent = userAgent;
    return this;
  }

  requestId(id: string): this {
    this.entry.requestId = id;
    return this;
  }

  async log(): Promise<{ success: boolean; error?: string; logId?: string }> {
    if (!this.entry.adminUserId || !this.entry.action || !this.entry.targetType) {
      return {
        success: false,
        error: "Missing required fields: adminUserId, action, targetType",
      };
    }

    return logAdminAction(this.entry as AuditLogInput);
  }
}

/**
 * Create a new audit log builder
 */
export function auditLog(adminUserId: string): AuditLogBuilder {
  return new AuditLogBuilder(adminUserId);
}

/**
 * Shorthand functions for common audit log actions
 */

export async function logUserViewed(
  adminUserId: string,
  targetUserId: string,
  clientInfo?: { ipAddress: string | null; userAgent: string | null }
) {
  return logAdminAction({
    adminUserId,
    action: "user_viewed",
    targetType: "user",
    targetId: targetUserId,
    ipAddress: clientInfo?.ipAddress,
    userAgent: clientInfo?.userAgent,
  });
}

export async function logUserUpdated(
  adminUserId: string,
  targetUserId: string,
  oldValue: unknown,
  newValue: unknown,
  reason?: string,
  clientInfo?: { ipAddress: string | null; userAgent: string | null }
) {
  return logAdminAction({
    adminUserId,
    action: "user_updated",
    targetType: "user",
    targetId: targetUserId,
    oldValue,
    newValue,
    reason,
    ipAddress: clientInfo?.ipAddress,
    userAgent: clientInfo?.userAgent,
  });
}

export async function logSubscriptionTierChanged(
  adminUserId: string,
  targetUserId: string,
  oldTier: string,
  newTier: string,
  reason?: string,
  clientInfo?: { ipAddress: string | null; userAgent: string | null }
) {
  return logAdminAction({
    adminUserId,
    action: "subscription_tier_changed",
    targetType: "subscription",
    targetId: targetUserId,
    oldValue: { tier: oldTier },
    newValue: { tier: newTier },
    reason,
    ipAddress: clientInfo?.ipAddress,
    userAgent: clientInfo?.userAgent,
  });
}

export async function logTrialExtended(
  adminUserId: string,
  targetUserId: string,
  extensionDays: number,
  newTrialEnd: string,
  reason?: string,
  clientInfo?: { ipAddress: string | null; userAgent: string | null }
) {
  return logAdminAction({
    adminUserId,
    action: "subscription_trial_extended",
    targetType: "subscription",
    targetId: targetUserId,
    newValue: { extension_days: extensionDays, new_trial_end: newTrialEnd },
    reason,
    ipAddress: clientInfo?.ipAddress,
    userAgent: clientInfo?.userAgent,
  });
}

export async function logFeatureFlagCreated(
  adminUserId: string,
  flagName: string,
  flagData: unknown,
  clientInfo?: { ipAddress: string | null; userAgent: string | null }
) {
  return logAdminAction({
    adminUserId,
    action: "feature_flag_created",
    targetType: "feature_flag",
    targetId: flagName,
    newValue: flagData,
    ipAddress: clientInfo?.ipAddress,
    userAgent: clientInfo?.userAgent,
  });
}

export async function logFeatureFlagUpdated(
  adminUserId: string,
  flagName: string,
  oldValue: unknown,
  newValue: unknown,
  clientInfo?: { ipAddress: string | null; userAgent: string | null }
) {
  return logAdminAction({
    adminUserId,
    action: "feature_flag_updated",
    targetType: "feature_flag",
    targetId: flagName,
    oldValue,
    newValue,
    ipAddress: clientInfo?.ipAddress,
    userAgent: clientInfo?.userAgent,
  });
}

export async function logTierConfigUpdated(
  adminUserId: string,
  tier: string,
  oldValue: unknown,
  newValue: unknown,
  clientInfo?: { ipAddress: string | null; userAgent: string | null }
) {
  return logAdminAction({
    adminUserId,
    action: "tier_config_updated",
    targetType: "tier_config",
    targetId: tier,
    oldValue,
    newValue,
    ipAddress: clientInfo?.ipAddress,
    userAgent: clientInfo?.userAgent,
  });
}
