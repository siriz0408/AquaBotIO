/**
 * Transactional Email Functions
 *
 * These emails are triggered by Stripe webhook events:
 * - Welcome email after subscription checkout
 * - Payment failed notification
 * - Subscription cancellation confirmation
 */

import { resend, FROM_ADDRESS, isEmailEnabled } from "./client";

// App URL for email links
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aquabotai.com";

interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send welcome email after successful subscription
 */
export async function sendWelcomeEmail(
  email: string,
  name: string | null,
  tier: string
): Promise<EmailResult> {
  if (!isEmailEnabled()) {
    console.log("Email disabled, skipping welcome email");
    return { success: true };
  }

  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
  const greeting = name ? `Hi ${name}` : "Welcome";

  try {
    await resend!.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `Welcome to AquaBotAI ${tierName}!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0A2540; margin: 0;">🐠 AquaBotAI</h1>
  </div>

  <h2 style="color: #0A2540;">${greeting}!</h2>

  <p>Thank you for subscribing to <strong>AquaBotAI ${tierName}</strong>! Your AI-powered aquarium assistant is ready to help you keep your fish happy and healthy.</p>

  <h3 style="color: #1B998B;">What you can do now:</h3>
  <ul style="padding-left: 20px;">
    ${tier === "starter" ? `
    <li>Track up to 2 tanks with detailed profiles</li>
    <li>Get 10 AI chat messages per day for personalized advice</li>
    <li>Log water parameters and track trends</li>
    <li>Set up maintenance schedules with reminders</li>
    ` : ""}
    ${tier === "plus" ? `
    <li>Manage up to 5 tanks with full tracking</li>
    <li>Get 100 AI chat messages per day</li>
    <li>Use Photo Diagnosis to identify fish and diseases</li>
    <li>Receive proactive AI alerts for parameter trends</li>
    <li>Access AI-enhanced calculators and tools</li>
    ` : ""}
    ${tier === "pro" ? `
    <li>Unlimited tanks for your entire fishroom</li>
    <li>500 AI chat messages per day</li>
    <li>Photo Diagnosis with 30 scans per day</li>
    <li>Equipment recommendations</li>
    <li>Weekly email health reports</li>
    <li>Multi-tank comparison dashboard</li>
    ` : ""}
  </ul>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${APP_URL}/dashboard" style="background: linear-gradient(135deg, #00B4D8, #0A2540); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Go to Dashboard</a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Need help? Just ask your AI assistant or visit our <a href="${APP_URL}/support" style="color: #1B998B;">support page</a>.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    AquaBotAI - Your AI-Powered Aquarium Assistant<br>
    <a href="${APP_URL}/settings" style="color: #999;">Manage email preferences</a>
  </p>
</body>
</html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  email: string,
  name: string | null
): Promise<EmailResult> {
  if (!isEmailEnabled()) {
    console.log("Email disabled, skipping payment failed email");
    return { success: true };
  }

  const greeting = name ? `Hi ${name}` : "Hi there";

  try {
    await resend!.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Action Required: Payment Failed - AquaBotAI",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0A2540; margin: 0;">🐠 AquaBotAI</h1>
  </div>

  <h2 style="color: #0A2540;">${greeting},</h2>

  <p>We were unable to process your subscription payment. Don't worry - your account is still active, and you have a <strong>7-day grace period</strong> to update your payment method.</p>

  <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
    <strong>What happens next:</strong>
    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
      <li>Your subscription remains active for 7 more days</li>
      <li>We'll automatically retry the payment</li>
      <li>If payment continues to fail, your account will be downgraded to Free</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${APP_URL}/billing" style="background: linear-gradient(135deg, #00B4D8, #0A2540); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Update Payment Method</a>
  </div>

  <p style="color: #666; font-size: 14px;">
    If you believe this is an error or need assistance, please <a href="${APP_URL}/support" style="color: #1B998B;">contact our support team</a>.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    AquaBotAI - Your AI-Powered Aquarium Assistant<br>
    <a href="${APP_URL}/settings" style="color: #999;">Manage email preferences</a>
  </p>
</body>
</html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending payment failed email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send subscription cancellation confirmation
 */
export async function sendCancellationEmail(
  email: string,
  name: string | null
): Promise<EmailResult> {
  if (!isEmailEnabled()) {
    console.log("Email disabled, skipping cancellation email");
    return { success: true };
  }

  const greeting = name ? `Hi ${name}` : "Hi there";

  try {
    await resend!.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Your AquaBotAI Subscription Has Been Cancelled",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0A2540; margin: 0;">🐠 AquaBotAI</h1>
  </div>

  <h2 style="color: #0A2540;">${greeting},</h2>

  <p>We're sorry to see you go! Your AquaBotAI subscription has been cancelled and your account has been switched to the Free plan.</p>

  <h3 style="color: #1B998B;">What you still have access to:</h3>
  <ul style="padding-left: 20px;">
    <li>1 tank profile</li>
    <li>Basic parameter logging</li>
    <li>Species database access</li>
    <li>3 maintenance task reminders</li>
  </ul>

  <p><strong>Your data is safe.</strong> All your tank history, parameters, and records are preserved. If you decide to resubscribe, everything will be waiting for you.</p>

  <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
    <strong>Changed your mind?</strong><br>
    You can resubscribe anytime to unlock all premium features again.
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${APP_URL}/billing" style="background: linear-gradient(135deg, #00B4D8, #0A2540); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Resubscribe</a>
  </div>

  <p style="color: #666; font-size: 14px;">
    We'd love to hear your feedback! If there's anything we could improve, please <a href="${APP_URL}/support" style="color: #1B998B;">let us know</a>.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    AquaBotAI - Your AI-Powered Aquarium Assistant<br>
    Thank you for being part of our community.
  </p>
</body>
</html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
