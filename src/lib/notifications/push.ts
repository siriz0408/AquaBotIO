/**
 * Push Notification Utility
 *
 * Provides utilities for sending Web Push notifications.
 * Note: Actual sending requires VAPID keys which will be set up later (P2).
 * This module provides the types, interfaces, and stub implementation.
 *
 * Spec Reference: 08_PWA_Shell_Spec.md
 */

import { createClient } from "@supabase/supabase-js";
import type { PushSubscriptionRecord } from "@/lib/validation/notifications";

/**
 * Push notification payload structure
 */
export interface PushPayload {
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** URL to open when notification is clicked */
  url?: string;
  /** Icon URL for the notification */
  icon?: string;
  /** Badge URL (small icon) */
  badge?: string;
  /** Notification tag for grouping/replacing */
  tag?: string;
  /** Whether to require user interaction to dismiss */
  requireInteraction?: boolean;
  /** Action buttons */
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  /** Custom data to pass to service worker */
  data?: Record<string, unknown>;
}

/**
 * Notification types for categorization
 */
export type NotificationType =
  | "maintenance_reminder"
  | "parameter_alert"
  | "ai_insight"
  | "system";

/**
 * Result of sending a push notification
 */
export interface PushResult {
  success: boolean;
  subscriptionId: string;
  endpoint: string;
  error?: string;
}

/**
 * Get all push subscriptions for a user
 *
 * @param userId - The user's UUID
 * @returns Array of push subscription records
 */
export async function getUserPushSubscriptions(
  userId: string
): Promise<PushSubscriptionRecord[]> {
  // Use service role client for server-side operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase credentials for push notifications");
    return [];
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching push subscriptions:", error);
    return [];
  }

  return data || [];
}

/**
 * Update the last_used_at timestamp for a subscription
 *
 * @param subscriptionId - The subscription UUID
 */
export async function updateSubscriptionLastUsed(
  subscriptionId: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  await supabase
    .from("push_subscriptions")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", subscriptionId);
}

/**
 * Remove an invalid/expired subscription
 *
 * @param subscriptionId - The subscription UUID
 */
export async function removeInvalidSubscription(
  subscriptionId: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("id", subscriptionId);

  console.log(`Removed invalid push subscription: ${subscriptionId}`);
}

/**
 * Send a push notification to a specific user
 *
 * NOTE: This is currently a stub implementation.
 * Actual push notification sending requires:
 * 1. VAPID keys to be configured (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
 * 2. web-push npm package to be installed
 *
 * Once VAPID keys are configured, this function will:
 * 1. Get all push subscriptions for the user
 * 2. Send the notification to each subscription endpoint
 * 3. Handle expired/invalid subscriptions
 * 4. Update last_used_at timestamps
 *
 * @param userId - The user's UUID
 * @param payload - The notification payload
 * @param type - The type of notification (for filtering based on preferences)
 * @returns Array of results for each subscription
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload,
  type: NotificationType = "system"
): Promise<PushResult[]> {
  // Check if VAPID keys are configured
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log(
      "[Push] VAPID keys not configured - push notifications disabled",
      { userId, type, title: payload.title }
    );
    return [];
  }

  // Get user's push subscriptions
  const subscriptions = await getUserPushSubscriptions(userId);

  if (subscriptions.length === 0) {
    console.log("[Push] No push subscriptions found for user", { userId });
    return [];
  }

  console.log(
    `[Push] Would send notification to ${subscriptions.length} subscription(s)`,
    {
      userId,
      type,
      title: payload.title,
      body: payload.body,
    }
  );

  // TODO: Implement actual push sending with web-push package
  // For now, return success for all subscriptions (stub)
  const results: PushResult[] = subscriptions.map((sub) => ({
    success: true,
    subscriptionId: sub.id,
    endpoint: sub.endpoint,
  }));

  // Update last_used_at for successful sends
  for (const result of results) {
    if (result.success) {
      await updateSubscriptionLastUsed(result.subscriptionId);
    }
  }

  return results;
}

/**
 * Send a push notification to multiple users
 *
 * @param userIds - Array of user UUIDs
 * @param payload - The notification payload
 * @param type - The type of notification
 * @returns Map of userId to results
 */
export async function sendPushNotificationToMultipleUsers(
  userIds: string[],
  payload: PushPayload,
  type: NotificationType = "system"
): Promise<Map<string, PushResult[]>> {
  const results = new Map<string, PushResult[]>();

  // Send in parallel with concurrency limit
  const batchSize = 10;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (userId) => ({
        userId,
        results: await sendPushNotification(userId, payload, type),
      }))
    );

    for (const { userId, results: userResults } of batchResults) {
      results.set(userId, userResults);
    }
  }

  return results;
}

/**
 * Create a maintenance reminder notification payload
 */
export function createMaintenanceReminderPayload(
  taskTitle: string,
  tankName: string,
  dueDate: string
): PushPayload {
  return {
    title: "Maintenance Reminder",
    body: `${taskTitle} is due for ${tankName}`,
    tag: `maintenance-${dueDate}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    actions: [
      { action: "complete", title: "Mark Complete" },
      { action: "snooze", title: "Snooze 1 hour" },
    ],
    data: {
      type: "maintenance_reminder",
      taskTitle,
      tankName,
      dueDate,
    },
  };
}

/**
 * Create a parameter alert notification payload
 */
export function createParameterAlertPayload(
  parameter: string,
  value: number,
  tankName: string,
  severity: "warning" | "danger"
): PushPayload {
  const title =
    severity === "danger" ? "Critical Parameter Alert" : "Parameter Warning";
  const emoji = severity === "danger" ? "🚨" : "⚠️";

  return {
    title,
    body: `${emoji} ${parameter} is ${value} in ${tankName}`,
    tag: `parameter-${parameter}-${Date.now()}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    requireInteraction: severity === "danger",
    url: "/parameters",
    data: {
      type: "parameter_alert",
      parameter,
      value,
      tankName,
      severity,
    },
  };
}

/**
 * Create an AI insight notification payload
 */
export function createAIInsightPayload(
  insight: string,
  tankName: string
): PushPayload {
  return {
    title: "AI Insight",
    body: `${tankName}: ${insight}`,
    tag: `insight-${Date.now()}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    url: "/chat",
    data: {
      type: "ai_insight",
      insight,
      tankName,
    },
  };
}
