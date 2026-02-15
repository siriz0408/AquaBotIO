import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

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

interface TankReportEmailProps {
  userName: string;
  reportDate: string;
  tanks: TankHealthSummary[];
  overallSummary: string;
  appUrl: string;
}

const statusColors: Record<string, string> = {
  excellent: "#16a34a",
  good: "#22c55e",
  fair: "#eab308",
  poor: "#f97316",
  critical: "#dc2626",
};

export function TankReportEmail({
  userName,
  reportDate,
  tanks,
  overallSummary,
  appUrl,
}: TankReportEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your AquaBotAI Tank Health Report for {reportDate}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>🐠 AquaBotAI</Text>
            <Text style={tagline}>Your AI-Powered Aquarium Assistant</Text>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Heading style={h1}>Tank Health Report</Heading>
            <Text style={text}>
              Hi {userName},
            </Text>
            <Text style={text}>
              Here&apos;s your tank health summary for {reportDate}.
            </Text>
          </Section>

          {/* Overall Summary */}
          <Section style={summarySection}>
            <Text style={summaryText}>{overallSummary}</Text>
          </Section>

          <Hr style={hr} />

          {/* Tank Details */}
          {tanks.map((tank) => (
            <Section key={tank.id} style={tankSection}>
              <Heading style={h2}>
                {tank.name}
                <span style={{ ...statusBadge, backgroundColor: statusColors[tank.healthStatus] }}>
                  {tank.healthScore}
                </span>
              </Heading>
              <Text style={tankType}>
                {tank.type.charAt(0).toUpperCase() + tank.type.slice(1)} Tank
              </Text>

              {/* Parameter Issues */}
              {tank.parameterIssues.length > 0 && (
                <Section style={issueSection}>
                  <Text style={issueTitle}>⚠️ Parameter Alerts</Text>
                  {tank.parameterIssues.map((issue, i) => (
                    <Text key={i} style={issueItem}>• {issue}</Text>
                  ))}
                </Section>
              )}

              {/* Maintenance Issues */}
              {tank.maintenanceIssues.length > 0 && (
                <Section style={issueSection}>
                  <Text style={issueTitle}>🔧 Maintenance</Text>
                  {tank.maintenanceIssues.map((issue, i) => (
                    <Text key={i} style={issueItem}>• {issue}</Text>
                  ))}
                </Section>
              )}

              {/* Upcoming Tasks */}
              {tank.upcomingTasks.length > 0 && (
                <Section style={issueSection}>
                  <Text style={issueTitle}>📅 Upcoming</Text>
                  {tank.upcomingTasks.slice(0, 3).map((task, i) => (
                    <Text key={i} style={issueItem}>• {task.name} — {task.dueDate}</Text>
                  ))}
                </Section>
              )}

              {tank.parameterIssues.length === 0 && tank.maintenanceIssues.length === 0 && (
                <Text style={successText}>✅ All parameters in range, no overdue tasks!</Text>
              )}

              <Hr style={hrLight} />
            </Section>
          ))}

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={appUrl} style={ctaButton}>
              View Full Dashboard
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you enabled email reports in your AquaBotAI settings.
            </Text>
            <Link href={`${appUrl}/settings/notifications`} style={footerLink}>
              Manage email preferences
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#0A2540",
  padding: "24px",
  textAlign: "center" as const,
};

const logo = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold" as const,
  margin: "0",
};

const tagline = {
  color: "#1B998B",
  fontSize: "14px",
  margin: "8px 0 0 0",
};

const section = {
  padding: "24px",
};

const h1 = {
  color: "#0A2540",
  fontSize: "24px",
  fontWeight: "bold" as const,
  margin: "0 0 16px 0",
};

const h2 = {
  color: "#0A2540",
  fontSize: "18px",
  fontWeight: "bold" as const,
  margin: "0 0 8px 0",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 12px 0",
};

const summarySection = {
  backgroundColor: "#f0fdf4",
  borderLeft: "4px solid #22c55e",
  margin: "0 24px",
  padding: "16px",
};

const summaryText = {
  color: "#166534",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px",
};

const hrLight = {
  borderColor: "#f0f0f0",
  margin: "16px 0",
};

const tankSection = {
  padding: "0 24px 16px 24px",
};

const tankType = {
  color: "#8898aa",
  fontSize: "14px",
  margin: "0 0 12px 0",
};

const statusBadge = {
  borderRadius: "12px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold" as const,
  marginLeft: "12px",
  padding: "4px 12px",
};

const issueSection = {
  backgroundColor: "#fafafa",
  borderRadius: "8px",
  margin: "12px 0",
  padding: "12px 16px",
};

const issueTitle = {
  color: "#0A2540",
  fontSize: "14px",
  fontWeight: "bold" as const,
  margin: "0 0 8px 0",
};

const issueItem = {
  color: "#525f7f",
  fontSize: "14px",
  margin: "4px 0",
};

const successText = {
  color: "#166534",
  fontSize: "14px",
  margin: "12px 0",
};

const ctaSection = {
  padding: "24px",
  textAlign: "center" as const,
};

const ctaButton = {
  backgroundColor: "#1B998B",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold" as const,
  padding: "12px 24px",
  textDecoration: "none",
};

const footer = {
  padding: "24px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  margin: "0 0 8px 0",
};

const footerLink = {
  color: "#1B998B",
  fontSize: "12px",
};

export default TankReportEmail;
