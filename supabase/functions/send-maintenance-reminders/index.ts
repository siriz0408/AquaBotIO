/**
 * Maintenance Reminder Edge Function
 *
 * Checks for maintenance tasks due within the next 24 hours and sends
 * push notifications to users who have enabled maintenance reminders.
 *
 * Designed to be called via cron job (e.g., every 15 minutes) or on-demand.
 *
 * Per Spec 05: Maintenance Scheduling
 * Per Spec 08: PWA Shell (Push Notifications)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

// ============================================================================
// Types
// ============================================================================

interface MaintenanceTask {
  id: string;
  tank_id: string;
  user_id: string;
  title: string;
  type: string;
  description: string | null;
  next_due_date: string;
  reminder_time: string;
  is_recurring: boolean;
  is_active: boolean;
}

interface Tank {
  id: string;
  user_id: string;
  name: string;
}

interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  maintenance_reminders: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

interface PushPayload {
  title: string;
  body: string;
  tag: string;
  icon: string;
  badge: string;
  actions: Array<{ action: string; title: string }>;
  data: Record<string, unknown>;
}

interface NotificationResult {
  task_id: string;
  task_title: string;
  tank_name: string;
  user_id: string;
  success: boolean;
  subscriptions_tried: number;
  subscriptions_succeeded: number;
  error?: string;
}

interface RequestBody {
  dry_run?: boolean; // If true, don't actually send notifications
}

// ============================================================================
// CORS Headers
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if current time is within user's quiet hours
 * Uses the user's timezone preference from the users table
 */
function isInQuietHours(
  prefs: NotificationPreferences,
  userTimezone: string | null
): boolean {
  if (!prefs.quiet_hours_enabled) return false;
  if (!prefs.quiet_hours_start || !prefs.quiet_hours_end) return false;

  try {
    // Get current time in user's timezone
    const tz = userTimezone || "America/New_York";
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    const currentHour = userTime.getHours();
    const currentMinute = userTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // Parse quiet hours
    const [startHour, startMinute] = prefs.quiet_hours_start.split(":").map(Number);
    const [endHour, endMinute] = prefs.quiet_hours_end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (startMinutes > endMinutes) {
      // Quiet hours span midnight
      return currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
    } else {
      // Quiet hours within same day
      return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
    }
  } catch (e) {
    console.error("Error checking quiet hours:", e);
    return false; // Default to not in quiet hours if we can't determine
  }
}

/**
 * Create the push notification payload for a maintenance reminder
 */
function createMaintenancePayload(
  taskTitle: string,
  tankName: string,
  taskId: string,
  dueDate: string
): PushPayload {
  return {
    title: "Maintenance Reminder",
    body: `${taskTitle} is due for ${tankName}`,
    tag: `maintenance-${taskId}-${dueDate}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    actions: [
      { action: "complete", title: "Mark Complete" },
      { action: "snooze", title: "Snooze" },
    ],
    data: {
      type: "maintenance_reminder",
      task_id: taskId,
      task_title: taskTitle,
      tank_name: tankName,
      due_date: dueDate,
      url: "/maintenance",
    },
  };
}

/**
 * Send push notification to a single subscription
 * Returns true if successful, false otherwise
 */
async function sendToSubscription(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; shouldRemove: boolean; error?: string }> {
  try {
    // Configure web-push for this request
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        auth: subscription.auth_key,
        p256dh: subscription.p256dh_key,
      },
    };

    await webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 24, // 24 hours
      urgency: "normal",
    });

    return { success: true, shouldRemove: false };
  } catch (err) {
    const error = err as { statusCode?: number; message?: string };

    // 410 Gone or 404 means subscription is no longer valid
    if (error.statusCode === 410 || error.statusCode === 404) {
      return {
        success: false,
        shouldRemove: true,
        error: `Subscription expired (${error.statusCode})`,
      };
    }

    return {
      success: false,
      shouldRemove: false,
      error: error.message || "Unknown push error",
    };
  }
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  console.log(`[${requestId}] Starting maintenance reminder job`);

  try {
    // Parse request body (optional)
    let dryRun = false;
    try {
      const body: RequestBody = await req.json();
      dryRun = body.dry_run ?? false;
    } catch {
      // No body or invalid JSON - that's fine, use defaults
    }

    if (dryRun) {
      console.log(`[${requestId}] Running in DRY RUN mode - no notifications will be sent`);
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@aquabotai.com";

    // Validate required env vars
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Missing Supabase configuration`);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INTERNAL_SERVER_ERROR", message: "Missing Supabase configuration" },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error(`[${requestId}] Missing VAPID keys - push notifications disabled`);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "Push notifications disabled - missing VAPID keys",
            tasks_found: 0,
            notifications_sent: 0,
          },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the 24-hour window for due tasks
    // Tasks due from now until 24 hours from now
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    console.log(`[${requestId}] Checking for tasks due between ${todayStr} and ${tomorrowStr}`);

    // Query maintenance tasks that are:
    // 1. Due within the next 24 hours (next_due_date is today or tomorrow)
    // 2. Active (is_active = true)
    // 3. Not soft-deleted (deleted_at IS NULL - but maintenance_tasks doesn't have this column per schema)
    const { data: tasks, error: tasksError } = await supabase
      .from("maintenance_tasks")
      .select(`
        id,
        tank_id,
        user_id,
        title,
        type,
        description,
        next_due_date,
        reminder_time,
        is_recurring,
        is_active
      `)
      .eq("is_active", true)
      .gte("next_due_date", todayStr)
      .lte("next_due_date", tomorrowStr)
      .order("next_due_date", { ascending: true });

    if (tasksError) {
      console.error(`[${requestId}] Error fetching tasks:`, tasksError);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch maintenance tasks" },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!tasks || tasks.length === 0) {
      console.log(`[${requestId}] No due tasks found`);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "No maintenance tasks due in the next 24 hours",
            tasks_found: 0,
            notifications_sent: 0,
            duration_ms: Date.now() - startTime,
          },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log(`[${requestId}] Found ${tasks.length} due tasks`);

    // Get unique user IDs and tank IDs
    const userIds = [...new Set(tasks.map((t: MaintenanceTask) => t.user_id))];
    const tankIds = [...new Set(tasks.map((t: MaintenanceTask) => t.tank_id))];

    // Fetch tanks for names (with soft-delete filter)
    const { data: tanks, error: tanksError } = await supabase
      .from("tanks")
      .select("id, user_id, name")
      .in("id", tankIds)
      .is("deleted_at", null);

    if (tanksError) {
      console.error(`[${requestId}] Error fetching tanks:`, tanksError);
      // Continue anyway - we can use task.tank_id as fallback
    }

    const tankMap = new Map<string, Tank>();
    if (tanks) {
      for (const tank of tanks as Tank[]) {
        tankMap.set(tank.id, tank);
      }
    }

    // Fetch notification preferences for all relevant users
    const { data: preferences, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("id, user_id, push_enabled, email_enabled, maintenance_reminders, quiet_hours_enabled, quiet_hours_start, quiet_hours_end")
      .in("user_id", userIds);

    if (prefsError) {
      console.error(`[${requestId}] Error fetching notification preferences:`, prefsError);
      // Continue - we'll assume defaults (opt-out users won't get notifications)
    }

    const prefsMap = new Map<string, NotificationPreferences>();
    if (preferences) {
      for (const pref of preferences as NotificationPreferences[]) {
        prefsMap.set(pref.user_id, pref);
      }
    }

    // Fetch user timezones for quiet hours calculation
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, timezone")
      .in("id", userIds);

    if (usersError) {
      console.error(`[${requestId}] Error fetching user timezones:`, usersError);
    }

    const timezoneMap = new Map<string, string>();
    if (users) {
      for (const user of users as { id: string; timezone: string | null }[]) {
        if (user.timezone) {
          timezoneMap.set(user.id, user.timezone);
        }
      }
    }

    // Fetch push subscriptions for all relevant users
    const { data: subscriptions, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh_key, auth_key")
      .in("user_id", userIds);

    if (subsError) {
      console.error(`[${requestId}] Error fetching push subscriptions:`, subsError);
    }

    // Group subscriptions by user
    const subscriptionsByUser = new Map<string, PushSubscription[]>();
    if (subscriptions) {
      for (const sub of subscriptions as PushSubscription[]) {
        if (!subscriptionsByUser.has(sub.user_id)) {
          subscriptionsByUser.set(sub.user_id, []);
        }
        subscriptionsByUser.get(sub.user_id)!.push(sub);
      }
    }

    // Process each task
    const results: NotificationResult[] = [];
    const subscriptionsToRemove: string[] = [];
    let totalNotificationsSent = 0;

    for (const task of tasks as MaintenanceTask[]) {
      const tank = tankMap.get(task.tank_id);
      const tankName = tank?.name || `Tank ${task.tank_id.slice(0, 8)}`;
      const prefs = prefsMap.get(task.user_id);
      const userTimezone = timezoneMap.get(task.user_id) || null;
      const userSubs = subscriptionsByUser.get(task.user_id) || [];

      const result: NotificationResult = {
        task_id: task.id,
        task_title: task.title,
        tank_name: tankName,
        user_id: task.user_id,
        success: false,
        subscriptions_tried: 0,
        subscriptions_succeeded: 0,
      };

      // Check if user has opted out of maintenance reminders
      if (prefs && !prefs.maintenance_reminders) {
        console.log(`[${requestId}] User ${task.user_id} has maintenance_reminders disabled`);
        result.error = "User has maintenance reminders disabled";
        results.push(result);
        continue;
      }

      // Check if user has push notifications disabled
      if (prefs && !prefs.push_enabled) {
        console.log(`[${requestId}] User ${task.user_id} has push notifications disabled`);
        result.error = "User has push notifications disabled";
        results.push(result);
        continue;
      }

      // Check quiet hours
      if (prefs && isInQuietHours(prefs, userTimezone)) {
        console.log(`[${requestId}] User ${task.user_id} is in quiet hours`);
        result.error = "User is in quiet hours";
        results.push(result);
        continue;
      }

      // Check if user has any push subscriptions
      if (userSubs.length === 0) {
        console.log(`[${requestId}] User ${task.user_id} has no push subscriptions`);
        result.error = "No push subscriptions registered";
        results.push(result);
        continue;
      }

      // Create notification payload
      const payload = createMaintenancePayload(
        task.title,
        tankName,
        task.id,
        task.next_due_date
      );

      // Send to all user's subscriptions
      result.subscriptions_tried = userSubs.length;

      if (!dryRun) {
        for (const sub of userSubs) {
          const sendResult = await sendToSubscription(
            sub,
            payload,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          );

          if (sendResult.success) {
            result.subscriptions_succeeded++;
            totalNotificationsSent++;

            // Update last_used_at for successful sends
            await supabase
              .from("push_subscriptions")
              .update({ last_used_at: new Date().toISOString() })
              .eq("id", sub.id);
          } else {
            console.error(
              `[${requestId}] Failed to send to subscription ${sub.id}: ${sendResult.error}`
            );

            if (sendResult.shouldRemove) {
              subscriptionsToRemove.push(sub.id);
            }
          }
        }

        result.success = result.subscriptions_succeeded > 0;
      } else {
        // Dry run - simulate success
        result.subscriptions_succeeded = userSubs.length;
        result.success = true;
        totalNotificationsSent += userSubs.length;
        console.log(`[${requestId}] [DRY RUN] Would send notification for task ${task.id} to ${userSubs.length} subscriptions`);
      }

      results.push(result);
    }

    // Clean up expired subscriptions
    if (subscriptionsToRemove.length > 0 && !dryRun) {
      console.log(`[${requestId}] Removing ${subscriptionsToRemove.length} expired subscriptions`);
      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", subscriptionsToRemove);

      if (deleteError) {
        console.error(`[${requestId}] Error removing expired subscriptions:`, deleteError);
      }
    }

    const duration = Date.now() - startTime;
    const successfulTasks = results.filter((r) => r.success).length;

    console.log(
      `[${requestId}] Completed: ${successfulTasks}/${tasks.length} tasks notified, ${totalNotificationsSent} total notifications sent, ${subscriptionsToRemove.length} expired subscriptions removed. Duration: ${duration}ms`
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          tasks_found: tasks.length,
          tasks_notified: successfulTasks,
          notifications_sent: totalNotificationsSent,
          expired_subscriptions_removed: subscriptionsToRemove.length,
          dry_run: dryRun,
          duration_ms: duration,
          results,
        },
        meta: { timestamp: new Date().toISOString(), request_id: requestId },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        },
        meta: { timestamp: new Date().toISOString(), request_id: requestId },
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
