/**
 * Push Notification Utility
 *
 * Provides utilities for sending Web Push notifications using the web-push library.
 * Requires VAPID keys to be configured in environment variables.
 *
 * Spec Reference: 08_PWA_Shell_Spec.md
 */

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import type { PushSubscriptionRecord } from "@/lib/validation/notifications";

// Configure web-push with VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@aquabotai.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

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
 * Sends a Web Push notification to all of the user's registered devices.
 * Automatically handles expired/invalid subscriptions by removing them.
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
    `[Push] Sending notification to ${subscriptions.length} subscription(s)`,
    {
      userId,
      type,
      title: payload.title,
      body: payload.body,
    }
  );

  const results: PushResult[] = [];

  for (const sub of subscriptions) {
    try {
      // Build the web-push subscription object
      const pushSubscription: webpush.PushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth_key,
          p256dh: sub.p256dh_key,
        },
      };

      // Send the notification
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload),
        {
          TTL: 60 * 60 * 24, // 24 hours
          urgency: type === "parameter_alert" ? "high" : "normal",
        }
      );

      results.push({
        success: true,
        subscriptionId: sub.id,
        endpoint: sub.endpoint,
      });

      // Update last_used_at timestamp
      await updateSubscriptionLastUsed(sub.id);

      console.log(`[Push] Successfully sent to ${sub.endpoint.slice(0, 50)}...`);
    } catch (err) {
      const error = err as { statusCode?: number; message?: string };

      // Handle specific error codes
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription is no longer valid - remove it
        console.log(`[Push] Subscription expired, removing: ${sub.id}`);
        await removeInvalidSubscription(sub.id);
      }

      results.push({
        success: false,
        subscriptionId: sub.id,
        endpoint: sub.endpoint,
        error: error.message || "Unknown error",
      });

      console.error(`[Push] Failed to send to ${sub.endpoint.slice(0, 50)}...`, error);
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(`[Push] Sent ${successCount}/${results.length} notifications`);

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
