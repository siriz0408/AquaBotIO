/**
 * Weekly Email Reports Edge Function
 *
 * Sends tank health digest emails to Pro users who have opted in.
 * Designed to be called via cron job (e.g., every Sunday at 8am UTC).
 *
 * Per Spec 11: Interactive Dashboards & Reports (R-104.2)
 * Per Spec 18: Email reports are Pro tier only (R-104.4)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Types
// ============================================================================

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface Tank {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
}

interface WaterParameter {
  temperature_f: number | null;
  ph: number | null;
  ammonia_ppm: number | null;
  nitrite_ppm: number | null;
  nitrate_ppm: number | null;
  salinity_ppt: number | null;
  calcium_ppm: number | null;
  alkalinity_dkh: number | null;
  measured_at: string;
}

interface MaintenanceTask {
  id: string;
  name: string;
  next_due_date: string;
  completed_at: string | null;
}

interface TankSummary {
  id: string;
  name: string;
  type: string;
  healthScore: number;
  healthStatus: string;
  parameterIssues: string[];
  maintenanceIssues: string[];
  upcomingTasks: Array<{ name: string; dueDate: string }>;
}

interface RequestBody {
  dry_run?: boolean;
  user_id?: string; // Optional: send to specific user only
}

// ============================================================================
// Health Score Calculation (matches src/lib/health/calculate-health-score.ts)
// ============================================================================

const SAFE_RANGES: Record<string, Record<string, { min: number; max: number }>> = {
  freshwater: {
    temperature_f: { min: 72, max: 82 },
    ph: { min: 6.5, max: 7.5 },
    ammonia_ppm: { min: 0, max: 0.25 },
    nitrite_ppm: { min: 0, max: 0.25 },
    nitrate_ppm: { min: 0, max: 40 },
  },
  saltwater: {
    temperature_f: { min: 75, max: 82 },
    ph: { min: 8.1, max: 8.4 },
    ammonia_ppm: { min: 0, max: 0.1 },
    nitrite_ppm: { min: 0, max: 0.1 },
    nitrate_ppm: { min: 0, max: 20 },
    salinity_ppt: { min: 32, max: 35 },
    calcium_ppm: { min: 380, max: 450 },
    alkalinity_dkh: { min: 8, max: 12 },
  },
};

function calculateHealthScore(
  tankType: string,
  params: WaterParameter | null,
  tasks: MaintenanceTask[]
): {
  overall: number;
  status: string;
  parameterIssues: string[];
  maintenanceIssues: string[];
} {
  const issues: string[] = [];
  const maintenanceIssues: string[] = [];
  let paramScore = 100;

  // Parameter scoring (50% weight)
  if (params) {
    const ranges = SAFE_RANGES[tankType] || SAFE_RANGES.freshwater;

    for (const [param, range] of Object.entries(ranges)) {
      const value = params[param as keyof WaterParameter] as number | null;
      if (value === null || value === undefined) continue;

      if (value < range.min || value > range.max) {
        paramScore -= 15;
        const displayName = param.replace(/_/g, " ").replace(/ ppm| f| ppt| dkh/g, "");
        issues.push(`${displayName}: ${value} (safe: ${range.min}-${range.max})`);
      }
    }
  } else {
    paramScore = 70; // No recent data
    issues.push("No recent parameter data");
  }

  // Maintenance scoring (30% weight)
  let maintenanceScore = 100;
  const now = new Date();
  const overdueTasks = tasks.filter((t) => {
    const dueDate = new Date(t.next_due_date);
    return dueDate < now && !t.completed_at;
  });

  if (overdueTasks.length > 0) {
    maintenanceScore -= overdueTasks.length * 20;
    overdueTasks.forEach((t) => {
      maintenanceIssues.push(`Overdue: ${t.name}`);
    });
  }

  // Recency scoring (20% weight)
  let recencyScore = 100;
  if (params?.measured_at) {
    const lastMeasured = new Date(params.measured_at);
    const daysSince = Math.floor((now.getTime() - lastMeasured.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 14) {
      recencyScore = 50;
      issues.push(`Last test: ${daysSince} days ago`);
    } else if (daysSince > 7) {
      recencyScore = 75;
    }
  } else {
    recencyScore = 50;
  }

  // Weighted overall score
  const overall = Math.max(
    0,
    Math.min(100, Math.round(paramScore * 0.5 + maintenanceScore * 0.3 + recencyScore * 0.2))
  );

  // Status based on score
  let status: string;
  if (overall >= 90) status = "excellent";
  else if (overall >= 75) status = "good";
  else if (overall >= 60) status = "fair";
  else if (overall >= 40) status = "poor";
  else status = "critical";

  return { overall, status, parameterIssues: issues, maintenanceIssues };
}

// ============================================================================
// Email HTML Generation
// ============================================================================

function getStatusColor(status: string): string {
  switch (status) {
    case "excellent":
      return "#22c55e";
    case "good":
      return "#84cc16";
    case "fair":
      return "#eab308";
    case "poor":
      return "#f97316";
    case "critical":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

function generateEmailHTML(
  userName: string,
  tanks: TankSummary[],
  overallSummary: string
): string {
  const tankRows = tanks
    .map(
      (tank) => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-weight: 600; color: #1f2937; font-size: 16px;">${tank.name}</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${tank.type}</div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; background-color: ${getStatusColor(tank.healthStatus)}20; color: ${getStatusColor(tank.healthStatus)};">
          ${tank.healthScore}% ${tank.healthStatus.charAt(0).toUpperCase() + tank.healthStatus.slice(1)}
        </span>
      </td>
    </tr>
    ${
      tank.parameterIssues.length > 0
        ? `
    <tr>
      <td colspan="2" style="padding: 0 16px 16px 16px;">
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 12px; margin-top: 8px;">
          <div style="font-weight: 600; color: #92400e; font-size: 12px; margin-bottom: 4px;">Parameter Alerts</div>
          ${tank.parameterIssues.map((issue) => `<div style="color: #b45309; font-size: 13px;">• ${issue}</div>`).join("")}
        </div>
      </td>
    </tr>`
        : ""
    }
    ${
      tank.maintenanceIssues.length > 0
        ? `
    <tr>
      <td colspan="2" style="padding: 0 16px 16px 16px;">
        <div style="background-color: #fee2e2; border-radius: 8px; padding: 12px; margin-top: 8px;">
          <div style="font-weight: 600; color: #991b1b; font-size: 12px; margin-bottom: 4px;">Maintenance Issues</div>
          ${tank.maintenanceIssues.map((issue) => `<div style="color: #dc2626; font-size: 13px;">• ${issue}</div>`).join("")}
        </div>
      </td>
    </tr>`
        : ""
    }
    ${
      tank.upcomingTasks.length > 0
        ? `
    <tr>
      <td colspan="2" style="padding: 0 16px 16px 16px;">
        <div style="background-color: #dbeafe; border-radius: 8px; padding: 12px; margin-top: 8px;">
          <div style="font-weight: 600; color: #1e40af; font-size: 12px; margin-bottom: 4px;">Upcoming Tasks (Next 7 Days)</div>
          ${tank.upcomingTasks.map((task) => `<div style="color: #2563eb; font-size: 13px;">• ${task.name} - ${task.dueDate}</div>`).join("")}
        </div>
      </td>
    </tr>`
        : ""
    }
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Tank Health Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border: 0; cellpadding: 0; cellspacing: 0;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 32px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">AquaBotAI</div>
              <div style="font-size: 16px; color: rgba(255, 255, 255, 0.9); margin-top: 8px;">Weekly Tank Health Report</div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 24px 24px 16px;">
              <div style="font-size: 18px; color: #1f2937;">Hi ${userName},</div>
              <div style="font-size: 15px; color: #6b7280; margin-top: 8px; line-height: 1.5;">${overallSummary}</div>
            </td>
          </tr>

          <!-- Tank Health Table -->
          <tr>
            <td style="padding: 0 24px;">
              <table role="presentation" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; font-size: 14px;">Tank</th>
                  <th style="padding: 12px 16px; text-align: center; font-weight: 600; color: #374151; font-size: 14px;">Health</th>
                </tr>
                ${tankRows}
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 32px 24px; text-align: center;">
              <a href="${Deno.env.get("APP_URL") || "https://aquabotai-mu.vercel.app"}/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">View Full Dashboard</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                You're receiving this because you have weekly email reports enabled.<br>
                <a href="${Deno.env.get("APP_URL") || "https://aquabotai-mu.vercel.app"}/settings/notifications" style="color: #0ea5e9;">Manage email preferences</a>
              </div>
              <div style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
                AquaBotAI - Your AI-Powered Aquarium Assistant
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function generateReportSummary(tanks: TankSummary[]): string {
  if (tanks.length === 0) return "No tanks to report on this week.";

  const avgScore = Math.round(tanks.reduce((sum, t) => sum + t.healthScore, 0) / tanks.length);
  const issueCount = tanks.reduce(
    (sum, t) => sum + t.parameterIssues.length + t.maintenanceIssues.length,
    0
  );
  const criticalTanks = tanks.filter((t) => t.healthStatus === "critical" || t.healthStatus === "poor");

  if (criticalTanks.length > 0) {
    return `Your tanks need attention! ${criticalTanks.length} tank(s) have health concerns. Average health score is ${avgScore}% with ${issueCount} issue(s) requiring your attention.`;
  }

  if (issueCount > 0) {
    return `Your aquariums are doing well overall with an average health score of ${avgScore}%. There are ${issueCount} minor issue(s) to review.`;
  }

  return `Great news! All your tanks are healthy with an average score of ${avgScore}%. Keep up the excellent care!`;
}

// ============================================================================
// Resend Email Sending
// ============================================================================

async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string,
  resendApiKey: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AquaBotAI <noreply@aquabotai.com>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: `Resend API error: ${response.status} - ${errorData}` };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email",
    };
  }
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

  console.log(`[${requestId}] Starting weekly reports job`);

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
      console.log(`[${requestId}] Running in DRY RUN mode - no emails will be sent`);
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

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

    if (!resendApiKey) {
      console.log(`[${requestId}] Missing Resend API key - email sending disabled`);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "Email sending disabled - missing RESEND_API_KEY",
            users_processed: 0,
            emails_sent: 0,
          },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query Pro users with email reports enabled
    // Join users -> subscriptions (tier = 'pro' AND status = 'active')
    // Join users -> notification_preferences (email_reports_enabled = true)
    let usersQuery = supabase
      .from("users")
      .select(`
        id,
        email,
        full_name
      `);

    if (targetUserId) {
      usersQuery = usersQuery.eq("id", targetUserId);
    }

    const { data: allUsers, error: usersError } = await usersQuery;

    if (usersError) {
      console.error(`[${requestId}] Error fetching users:`, usersError);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch users" },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!allUsers || allUsers.length === 0) {
      console.log(`[${requestId}] No users found`);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "No users found",
            users_processed: 0,
            emails_sent: 0,
            duration_ms: Date.now() - startTime,
          },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Filter to Pro users with email reports enabled
    const eligibleUsers: User[] = [];

    for (const user of allUsers as User[]) {
      // Check subscription tier
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("tier, status, tier_override, override_expires_at")
        .eq("user_id", user.id)
        .single();

      // Check if Pro tier (via subscription or override)
      let isPro = false;
      if (subscription) {
        if (subscription.tier_override === "pro") {
          const notExpired =
            !subscription.override_expires_at ||
            new Date(subscription.override_expires_at) > new Date();
          if (notExpired) isPro = true;
        } else if (subscription.status === "active" && subscription.tier === "pro") {
          isPro = true;
        }
      }

      // Also check admin_profiles
      if (!isPro) {
        const { data: adminProfile } = await supabase
          .from("admin_profiles")
          .select("is_active")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (adminProfile) isPro = true;
      }

      if (!isPro) continue;

      // Check notification preferences
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("email_reports_enabled")
        .eq("user_id", user.id)
        .single();

      // Default to enabled if no preference record exists
      const emailReportsEnabled = prefs?.email_reports_enabled !== false;

      if (emailReportsEnabled && user.email) {
        eligibleUsers.push(user);
      }
    }

    console.log(`[${requestId}] Found ${eligibleUsers.length} eligible Pro users`);

    if (eligibleUsers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "No eligible Pro users with email reports enabled",
            users_checked: allUsers.length,
            users_processed: 0,
            emails_sent: 0,
            duration_ms: Date.now() - startTime,
          },
          meta: { timestamp: new Date().toISOString(), request_id: requestId },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Process each eligible user
    const results: Array<{
      user_id: string;
      email: string;
      tanks_included: number;
      success: boolean;
      error?: string;
    }> = [];
    let emailsSent = 0;

    for (const user of eligibleUsers) {
      console.log(`[${requestId}] Processing user ${user.id}`);

      // Get user's tanks
      const { data: tanks, error: tanksError } = await supabase
        .from("tanks")
        .select("id, name, type, volume_gallons")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      if (tanksError || !tanks || tanks.length === 0) {
        results.push({
          user_id: user.id,
          email: user.email,
          tanks_included: 0,
          success: false,
          error: tanksError ? "Error fetching tanks" : "No tanks found",
        });
        continue;
      }

      // Build tank summaries
      const tankSummaries: TankSummary[] = [];

      for (const tank of tanks as Tank[]) {
        // Get latest parameters
        const { data: params } = await supabase
          .from("water_parameters")
          .select(
            "temperature_f, ph, ammonia_ppm, nitrite_ppm, nitrate_ppm, salinity_ppt, calcium_ppm, alkalinity_dkh, measured_at"
          )
          .eq("tank_id", tank.id)
          .order("measured_at", { ascending: false })
          .limit(1)
          .single();

        // Get maintenance tasks
        const { data: tasks } = await supabase
          .from("maintenance_tasks")
          .select("id, name, next_due_date, completed_at")
          .eq("tank_id", tank.id)
          .eq("is_active", true);

        // Calculate health score
        const health = calculateHealthScore(tank.type, params as WaterParameter | null, (tasks || []) as MaintenanceTask[]);

        // Get upcoming tasks (next 7 days)
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingTasks = ((tasks || []) as MaintenanceTask[])
          .filter((t) => {
            const dueDate = new Date(t.next_due_date);
            return dueDate >= now && dueDate <= nextWeek && !t.completed_at;
          })
          .map((t) => ({
            name: t.name,
            dueDate: new Date(t.next_due_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          }));

        tankSummaries.push({
          id: tank.id,
          name: tank.name,
          type: tank.type,
          healthScore: health.overall,
          healthStatus: health.status,
          parameterIssues: health.parameterIssues,
          maintenanceIssues: health.maintenanceIssues,
          upcomingTasks,
        });
      }

      // Generate email content
      const summary = generateReportSummary(tankSummaries);
      const html = generateEmailHTML(user.full_name || "Aquarist", tankSummaries, summary);

      // Send email (unless dry run)
      if (!dryRun) {
        const sendResult = await sendEmailViaResend(
          user.email,
          "Your Weekly Tank Health Report",
          html,
          resendApiKey
        );

        results.push({
          user_id: user.id,
          email: user.email,
          tanks_included: tankSummaries.length,
          success: sendResult.success,
          error: sendResult.error,
        });

        if (sendResult.success) {
          emailsSent++;
        }
      } else {
        console.log(`[${requestId}] [DRY RUN] Would send email to ${user.email} with ${tankSummaries.length} tanks`);
        results.push({
          user_id: user.id,
          email: user.email,
          tanks_included: tankSummaries.length,
          success: true,
        });
        emailsSent++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[${requestId}] Completed: ${emailsSent}/${eligibleUsers.length} emails sent. Duration: ${duration}ms`
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          users_checked: allUsers.length,
          users_processed: eligibleUsers.length,
          emails_sent: emailsSent,
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
