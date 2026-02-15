import { Resend } from "resend";

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn("RESEND_API_KEY is not set - email functionality will be disabled");
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender address
export const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || "AquaBotAI <noreply@aquabotai.com>";

// Check if email is enabled
export function isEmailEnabled(): boolean {
  return resend !== null;
}
