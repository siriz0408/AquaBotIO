/**
 * Daily AI Coaching Edge Function
 *
 * Generates personalized AI coaching messages for users based on their
 * preferences, tank state, and recent activity.
 *
 * Designed to be called daily via cron job (e.g., 8 AM local time) or on-demand.
 *
 * Per Spec 01: AI Chat Engine
 * Per Spec 17: AI Proactive Intelligence & Action Execution
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.39.0";

// ============================================================================
// Types
// ============================================================================

interface UserPreferences {
  id: string;
  user_id: string;
  experience_level: string | null;
  primary_goal: string | null;
  current_challenges: string[] | null;
  explanation_depth: string | null;
  wants_reminders: boolean;
  communication_style: string | null;
}

interface Tank {
  id: string;
  user_id: string;
  name: string;
  type: string;
  volume_gallons: number;
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

interface WaterParameter {
  ph: number | null;
  ammonia_ppm: number | null;
  nitrite_ppm: number | null;
  nitrate_ppm: number | null;
  temperature_f: number | null;
  measured_at: string;
}

interface User {
  id: string;
  email: string;
  display_name: string | null;
  timezone: string | null;
}

interface PushPayload {
  title: string;
  body: string;
  tag: string;
  icon: string;
  badge: string;
  data: Record<string, unknown>;
}

interface NotificationResult {
  user_id: string;
  success: boolean;
  coaching_message: string | null;
  subscriptions_tried: number;
  subscriptions_succeeded: number;
  error?: string;
}

interface RequestBody {
  dry_run?: boolean;
  user_id?: string; // Optional: target specific user for testing
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
 */
function isInQuietHours(
  prefs: NotificationPreferences,
  userTimezone: string | null
): boolean {
  if (!prefs.quiet_hours_enabled) return false;
  if (!prefs.quiet_hours_start || !prefs.quiet_hours_end) return false;

  try {
    const tz = userTimezone || "America/New_York";
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    const currentHour = userTime.getHours();
    const currentMinute = userTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = prefs.quiet_hours_start.split(":").map(Number);
    const [endHour, endMinute] = prefs.quiet_hours_end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (startMinutes > endMinutes) {
      return currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
    } else {
      return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
    }
  } catch (e) {
    console.error("Error checking quiet hours:", e);
    return false;
  }
}

/**
 * Create the push notification payload for a coaching message
 */
function createCoachingPayload(coachingMessage: string, tankName: string): PushPayload {
  return {
    title: "Daily Aquarium Tip",
    body: coachingMessage,
    tag: `coaching-${Date.now()}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: {
      type: "daily_coaching",
      tank_name: tankName,
      url: "/dashboard",
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Send push notification to a single subscription
 */
async function sendToSubscription(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; shouldRemove: boolean; error?: string }> {
  try {
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

/**
 * Generate a coaching message using Claude AI
 */
async function generateCoachingMessage(
  anthropic: Anthropic,
  user: User,
  prefs: UserPreferences,
  tank: Tank,
  recentParams: WaterParameter | null,
  pendingTaskCount: number
): Promise<string | null> {
  const systemPrompt = `You are a friendly, knowledgeable aquarium coaching assistant. Your job is to send a brief, helpful daily tip to aquarium keepers.

Guidelines:
- Keep your response to 1-2 SHORT sentences (max 100 tokens)
- Be encouraging and supportive
- Focus on actionable advice relevant to the user's situation
- Match the user's communication style preference
- Don't be preachy or overwhelming
- Avoid technical jargon unless the user is experienced
- Never use emojis unless the user prefers a casual style

Your message will be delivered as a push notification, so brevity is key.`;

  // Build context about the user
  const experienceLevel = prefs.experience_level || "unknown";
  const primaryGoal = prefs.primary_goal || "keeping healthy fish";
  const challenges = prefs.current_challenges?.join(", ") || "none specified";
  const communicationStyle = prefs.communication_style || "friendly";

  // Build tank context
  let paramContext = "No recent parameters recorded.";
  if (recentParams) {
    const parts: string[] = [];
    if (recentParams.ph !== null) parts.push(`pH ${recentParams.ph}`);
    if (recentParams.ammonia_ppm !== null) parts.push(`Ammonia ${recentParams.ammonia_ppm}ppm`);
    if (recentParams.nitrite_ppm !== null) parts.push(`Nitrite ${recentParams.nitrite_ppm}ppm`);
    if (recentParams.nitrate_ppm !== null) parts.push(`Nitrate ${recentParams.nitrate_ppm}ppm`);
    if (recentParams.temperature_f !== null) parts.push(`Temp ${recentParams.temperature_f}F`);
    if (parts.length > 0) {
      paramContext = `Recent parameters: ${parts.join(", ")}`;
    }
  }

  const userMessage = `Generate ONE short daily tip for this aquarium keeper:

User context:
- Experience: ${experienceLevel}
- Goal: ${primaryGoal}
- Challenges: ${challenges}
- Preferred communication style: ${communicationStyle}

Tank: ${tank.name} (${tank.type}, ${tank.volume_gallons} gallons)
${paramContext}
Pending maintenance tasks: ${pendingTaskCount}

Generate ONE short tip (max 2 sentences) that's relevant to their situation. Focus on actionable advice or encouragement. Do not include any preamble or explanation - just the tip itself.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001", // Use Haiku for fast, cheap tips
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      console.error("No text content in AI response");
      return null;
    }

    return textContent.text.trim();
  } catch (error) {
    console.error("Error calling Claude API:", error);
    return null;
  }
}

/**
 * Track AI usage for the coaching message
 */
async function trackAIUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  // Upsert usage record for today
  const { error } = await supabase
    .from("ai_usage")
    .upsert(
      {
        user_id: userId,
        date: today,
        feature: "chat",
        message_count: 1,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        model: "claude-haiku-4-5-20251001",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,date,feature",
        ignoreDuplicates: false,
      }
    );

  if (error) {
    // If upsert fails, try to increment existing record
    const { error: updateError } = await supabase.rpc("increment_ai_usage", {
      p_user_id: userId,
      p_date: today,
      p_feature: "chat",
      p_message_count: 1,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
    });

    if (updateError) {
      console.error("Error tracking AI usage:", updateError);
    }
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

  console.log(`[${requestId}] Starting daily AI coaching job`);

  try {
    // Parse request body (optional)
    let dryRun = false;
    let targetUserId: string | null = null;
    try {
      const body: RequestBody = await req.json();
      dryRun = body.dry_run ?? false;
      targetUserId = body.user_id ?? null;
    } catch {
      // No body or invalid JSON - that's fine, use defaults
    }

    if (dryRun) {
      console.log(`[${requestId}] Running in DRY RUN mode - no notifications will be sent`);
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
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

    if (!anthropicApiKey) {
      console.error(`[${requestId}] Missing Anthropic API key`);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INTERNAL_SERVER_ERROR", message: "Missing Anthropic API key" },
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
            users_eligible: 0,
            users_notified: 0,
            notifications_sent: 0,
          },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Initialize clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Build query for eligible users
    // Users must:
    // 1. Have user_preferences.wants_reminders = true
    // 2. Have at least one active tank
    let usersQuery = supabase
      .from("user_preferences")
      .select(`
        id,
        user_id,
        experience_level,
        primary_goal,
        current_challenges,
        explanation_depth,
        wants_reminders,
        communication_style
      `)
      .eq("wants_reminders", true);

    // Optionally filter to a specific user for testing
    if (targetUserId) {
      usersQuery = usersQuery.eq("user_id", targetUserId);
    }

    const { data: userPrefs, error: prefsError } = await usersQuery;

    if (prefsError) {
      console.error(`[${requestId}] Error fetching user preferences:`, prefsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch user preferences" },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!userPrefs || userPrefs.length === 0) {
      console.log(`[${requestId}] No users with wants_reminders enabled`);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "No eligible users for coaching notifications",
            users_eligible: 0,
            users_notified: 0,
            notifications_sent: 0,
            dry_run: dryRun,
            duration_ms: Date.now() - startTime,
          },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log(`[${requestId}] Found ${userPrefs.length} users with wants_reminders enabled`);

    // Get user IDs for subsequent queries
    const userIds = userPrefs.map((p: UserPreferences) => p.user_id);

    // Fetch users' basic info and timezone
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, display_name, timezone")
      .in("id", userIds);

    if (usersError) {
      console.error(`[${requestId}] Error fetching users:`, usersError);
    }

    const userMap = new Map<string, User>();
    if (users) {
      for (const user of users as User[]) {
        userMap.set(user.id, user);
      }
    }

    // Fetch notification preferences
    const { data: notifPrefs, error: notifError } = await supabase
      .from("notification_preferences")
      .select("id, user_id, push_enabled, email_enabled, maintenance_reminders, quiet_hours_enabled, quiet_hours_start, quiet_hours_end")
      .in("user_id", userIds);

    if (notifError) {
      console.error(`[${requestId}] Error fetching notification preferences:`, notifError);
    }

    const notifPrefsMap = new Map<string, NotificationPreferences>();
    if (notifPrefs) {
      for (const pref of notifPrefs as NotificationPreferences[]) {
        notifPrefsMap.set(pref.user_id, pref);
      }
    }

    // Fetch tanks for each user (only those with active tanks)
    const { data: tanks, error: tanksError } = await supabase
      .from("tanks")
      .select("id, user_id, name, type, volume_gallons")
      .in("user_id", userIds)
      .is("deleted_at", null);

    if (tanksError) {
      console.error(`[${requestId}] Error fetching tanks:`, tanksError);
    }

    // Group tanks by user
    const tanksByUser = new Map<string, Tank[]>();
    if (tanks) {
      for (const tank of tanks as Tank[]) {
        if (!tanksByUser.has(tank.user_id)) {
          tanksByUser.set(tank.user_id, []);
        }
        tanksByUser.get(tank.user_id)!.push(tank);
      }
    }

    // Fetch push subscriptions for all users
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

    // Process each user
    const results: NotificationResult[] = [];
    const subscriptionsToRemove: string[] = [];
    let totalNotificationsSent = 0;
    let usersEligible = 0;

    for (const prefs of userPrefs as UserPreferences[]) {
      const userId = prefs.user_id;
      const user = userMap.get(userId);
      const notifPref = notifPrefsMap.get(userId);
      const userTanks = tanksByUser.get(userId) || [];
      const userSubs = subscriptionsByUser.get(userId) || [];

      const result: NotificationResult = {
        user_id: userId,
        success: false,
        coaching_message: null,
        subscriptions_tried: 0,
        subscriptions_succeeded: 0,
      };

      // Skip users with no tanks
      if (userTanks.length === 0) {
        console.log(`[${requestId}] User ${userId} has no active tanks`);
        result.error = "No active tanks";
        results.push(result);
        continue;
      }

      usersEligible++;

      // Check if user has push notifications disabled
      if (notifPref && !notifPref.push_enabled) {
        console.log(`[${requestId}] User ${userId} has push notifications disabled`);
        result.error = "Push notifications disabled";
        results.push(result);
        continue;
      }

      // Check quiet hours
      if (notifPref && isInQuietHours(notifPref, user?.timezone || null)) {
        console.log(`[${requestId}] User ${userId} is in quiet hours`);
        result.error = "User is in quiet hours";
        results.push(result);
        continue;
      }

      // Check if user has any push subscriptions
      if (userSubs.length === 0) {
        console.log(`[${requestId}] User ${userId} has no push subscriptions`);
        result.error = "No push subscriptions registered";
        results.push(result);
        continue;
      }

      // Pick the first tank (or primary tank if we had that concept)
      const tank = userTanks[0];

      // Fetch most recent water parameters for this tank
      const { data: recentParams } = await supabase
        .from("water_parameters")
        .select("ph, ammonia_ppm, nitrite_ppm, nitrate_ppm, temperature_f, measured_at")
        .eq("tank_id", tank.id)
        .order("measured_at", { ascending: false })
        .limit(1)
        .single();

      // Count pending maintenance tasks
      const { count: pendingTaskCount } = await supabase
        .from("maintenance_tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_active", true)
        .lte("next_due_date", new Date().toISOString().split("T")[0]);

      // Generate coaching message using AI
      const coachingMessage = await generateCoachingMessage(
        anthropic,
        user || { id: userId, email: "", display_name: null, timezone: null },
        prefs,
        tank,
        recentParams as WaterParameter | null,
        pendingTaskCount || 0
      );

      if (!coachingMessage) {
        console.error(`[${requestId}] Failed to generate coaching message for user ${userId}`);
        result.error = "Failed to generate coaching message";
        results.push(result);
        continue;
      }

      result.coaching_message = coachingMessage;
      console.log(`[${requestId}] Generated coaching message for user ${userId}: ${coachingMessage}`);

      // Track AI usage (estimate ~50 input tokens, ~30 output tokens for Haiku)
      if (!dryRun) {
        await trackAIUsage(supabase, userId, 50, 30);
      }

      // Create notification payload
      const payload = createCoachingPayload(coachingMessage, tank.name);

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
        console.log(`[${requestId}] [DRY RUN] Would send notification to user ${userId}`);
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
    const usersNotified = results.filter((r) => r.success).length;

    console.log(
      `[${requestId}] Completed: ${usersNotified}/${usersEligible} users notified, ${totalNotificationsSent} total notifications sent. Duration: ${duration}ms`
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          users_eligible: usersEligible,
          users_notified: usersNotified,
          notifications_sent: totalNotificationsSent,
          expired_subscriptions_removed: subscriptionsToRemove.length,
          dry_run: dryRun,
          duration_ms: duration,
          results: results.map((r) => ({
            user_id: r.user_id,
            success: r.success,
            message_preview: r.coaching_message?.substring(0, 50) + (r.coaching_message && r.coaching_message.length > 50 ? "..." : ""),
            error: r.error,
          })),
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
