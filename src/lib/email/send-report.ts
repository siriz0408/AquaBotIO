import { resend, FROM_ADDRESS, isEmailEnabled } from "./client";
import { TankReportEmail } from "./templates/tank-report";
import { render } from "@react-email/components";

interface TankHealthSummary {
  id: string;
  name: string;
  type: string;
  healthScore: number;
  healthStatus: "excellent" | "good" | "fair" | "poor" | "critical";
  parameterIssues: string[];
  maintenanceIssues: string[];
  upcomingTasks: { name: string; dueDate: string }[];
}

interface SendReportParams {
  to: string;
  userName: string;
  tanks: TankHealthSummary[];
  overallSummary: string;
}

export async function sendTankReport({
  to,
  userName,
  tanks,
  overallSummary,
}: SendReportParams): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!isEmailEnabled() || !resend) {
    return { success: false, error: "Email service not configured" };
  }

  const reportDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aquabotai.com";

  try {
    // Render the email to HTML
    const html = await render(
      TankReportEmail({
        userName,
        reportDate,
        tanks,
        overallSummary,
        appUrl,
      })
    );

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `🐠 Your Tank Health Report — ${reportDate}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Error sending tank report:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Generate AI summary for the report
export function generateReportSummary(tanks: TankHealthSummary[]): string {
  if (tanks.length === 0) {
    return "No tanks to report on.";
  }

  const avgScore = Math.round(tanks.reduce((sum, t) => sum + t.healthScore, 0) / tanks.length);
  const tanksNeedingAttention = tanks.filter(
    (t) => t.healthStatus === "fair" || t.healthStatus === "poor" || t.healthStatus === "critical"
  );
  const excellentTanks = tanks.filter((t) => t.healthStatus === "excellent" || t.healthStatus === "good");

  const parts: string[] = [];

  if (tanks.length === 1) {
    const tank = tanks[0];
    if (tank.healthStatus === "excellent" || tank.healthStatus === "good") {
      parts.push(`Great news! Your ${tank.name} is in ${tank.healthStatus} condition with a health score of ${tank.healthScore}.`);
    } else {
      parts.push(`Your ${tank.name} needs some attention with a health score of ${tank.healthScore}.`);
    }
  } else {
    parts.push(`Across your ${tanks.length} tanks, the average health score is ${avgScore}.`);

    if (excellentTanks.length === tanks.length) {
      parts.push("All tanks are in great shape!");
    } else if (tanksNeedingAttention.length > 0) {
      parts.push(
        `${tanksNeedingAttention.length} tank${tanksNeedingAttention.length > 1 ? "s" : ""} need${tanksNeedingAttention.length === 1 ? "s" : ""} attention: ${tanksNeedingAttention.map((t) => t.name).join(", ")}.`
      );
    }
  }

  const totalIssues = tanks.reduce((sum, t) => sum + t.parameterIssues.length + t.maintenanceIssues.length, 0);
  if (totalIssues > 0) {
    parts.push(`There are ${totalIssues} item${totalIssues > 1 ? "s" : ""} to address across all tanks.`);
  }

  return parts.join(" ");
}
