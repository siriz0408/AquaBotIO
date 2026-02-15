/**
 * Daily Trend Analysis Cron Job
 *
 * Iterates through all Plus+ and Pro user tanks and triggers trend analysis.
 * Designed to be called via cron job (e.g., daily at 6am UTC).
 *
 * Per Spec 17: AI Proactive Intelligence (R-017.4)
 * Per Spec 18: Trend analysis is gated to Plus+ tiers only (R-018.6)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Types
// ============================================================================

interface RequestBody {
  dry_run?: boolean;
  user_id?: string; // Optional: analyze only specific user's tanks
}

interface TankAnalysisResult {
  tank_id: string;
  tank_name: string;
  user_id: string;
  alerts_generated: number;
  success: boolean;
  error?: string;
  skipped_reason?: string;
}

// ============================================================================
// Tier Resolution Helper
// ============================================================================

async function resolveUserTier(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string> {
  // Check admin profile first
  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (adminProfile) return "pro";

  // Check subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status, trial_ends_at, tier_override, override_expires_at")
    .eq("user_id", userId)
    .single();

  if (!subscription) return "free";

  // Check tier override
  if (subscription.tier_override) {
    const notExpired =
      !subscription.override_expires_at ||
      new Date(subscription.override_expires_at) > new Date();
    if (notExpired) return subscription.tier_override;
  }

  // Check trial
  const isTrialing =
    subscription.status === "trialing" &&
    subscription.trial_ends_at &&
    new Date(subscription.trial_ends_at) > new Date();
  if (isTrialing) return "pro";

  // Active subscription
  if (subscription.status === "active") {
    return subscription.tier || "free";
  }

  return "free";
}

// ============================================================================
// CORS Headers
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

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

  console.log(`[${requestId}] Starting daily trend analysis job`);

  try {
    // Parse request body
    let dryRun = false;
    let targetUserId: string | undefined;

    try {
      const body: RequestBody = await req.json();
      dryRun = body.dry_run ?? false;
      targetUserId = body.user_id;
    } catch {
      // No body or invalid JSON - use defaults
    }

    if (dryRun) {
      console.log(`[${requestId}] Running in DRY RUN mode - no alerts will be created`);
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all tanks (optionally filtered by user)
    let tanksQuery = supabase
      .from("tanks")
      .select("id, user_id, name, type")
      .is("deleted_at", null);

    if (targetUserId) {
      tanksQuery = tanksQuery.eq("user_id", targetUserId);
    }

    const { data: tanks, error: tanksError } = await tanksQuery;

    if (tanksError) {
      console.error(`[${requestId}] Error fetching tanks:`, tanksError);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch tanks" },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!tanks || tanks.length === 0) {
      console.log(`[${requestId}] No tanks found`);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "No tanks found",
            tanks_checked: 0,
            tanks_analyzed: 0,
            alerts_generated: 0,
            duration_ms: Date.now() - startTime,
          },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log(`[${requestId}] Found ${tanks.length} tanks to check`);

    // Group tanks by user for efficient tier checking
    const tanksByUser = new Map<string, typeof tanks>();
    for (const tank of tanks) {
      if (!tanksByUser.has(tank.user_id)) {
        tanksByUser.set(tank.user_id, []);
      }
      tanksByUser.get(tank.user_id)!.push(tank);
    }

    // Check each user's tier and filter to Plus+/Pro only
    const eligibleTanks: typeof tanks = [];
    const skippedByTier: string[] = [];

    for (const [userId, userTanks] of tanksByUser) {
      const tier = await resolveUserTier(supabase, userId);

      if (tier === "plus" || tier === "pro") {
        eligibleTanks.push(...userTanks);
      } else {
        skippedByTier.push(userId);
      }
    }

    console.log(
      `[${requestId}] ${eligibleTanks.length} tanks eligible (Plus+/Pro), ${skippedByTier.length} users skipped (Free/Starter)`
    );

    if (eligibleTanks.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "No eligible tanks (Plus+ tier required for trend analysis)",
            tanks_checked: tanks.length,
            users_skipped_tier: skippedByTier.length,
            tanks_analyzed: 0,
            alerts_generated: 0,
            duration_ms: Date.now() - startTime,
          },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Call analyze-parameter-trends for each eligible tank
    const results: TankAnalysisResult[] = [];
    let totalAlertsGenerated = 0;
    let successCount = 0;

    // Get the Edge Function URL for calling analyze-parameter-trends
    const trendAnalysisUrl = `${supabaseUrl}/functions/v1/analyze-parameter-trends`;

    for (const tank of eligibleTanks) {
      const result: TankAnalysisResult = {
        tank_id: tank.id,
        tank_name: tank.name,
        user_id: tank.user_id,
        alerts_generated: 0,
        success: false,
      };

      if (dryRun) {
        console.log(`[${requestId}] [DRY RUN] Would analyze tank ${tank.name} (${tank.id})`);
        result.success = true;
        result.skipped_reason = "dry_run";
        results.push(result);
        successCount++;
        continue;
      }

      try {
        // Call the trend analysis Edge Function
        const response = await fetch(trendAnalysisUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ tank_id: tank.id }),
        });

        const responseData = await response.json();

        if (response.ok && responseData.success) {
          result.success = true;
          result.alerts_generated = responseData.data?.alerts_generated || 0;
          totalAlertsGenerated += result.alerts_generated;
          successCount++;

          if (responseData.data?.skipped_reason) {
            result.skipped_reason = responseData.data.skipped_reason;
          }

          console.log(
            `[${requestId}] Tank ${tank.name}: ${result.alerts_generated} alerts generated`
          );
        } else {
          result.success = false;
          result.error = responseData.error?.message || "Unknown error";
          console.error(
            `[${requestId}] Failed to analyze tank ${tank.name}: ${result.error}`
          );
        }
      } catch (error) {
        result.success = false;
        result.error = error instanceof Error ? error.message : "Request failed";
        console.error(
          `[${requestId}] Error calling trend analysis for tank ${tank.name}:`,
          error
        );
      }

      results.push(result);

      // Small delay to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const duration = Date.now() - startTime;
    console.log(
      `[${requestId}] Completed: ${successCount}/${eligibleTanks.length} tanks analyzed, ${totalAlertsGenerated} total alerts. Duration: ${duration}ms`
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          tanks_checked: tanks.length,
          users_skipped_tier: skippedByTier.length,
          tanks_analyzed: successCount,
          alerts_generated: totalAlertsGenerated,
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
