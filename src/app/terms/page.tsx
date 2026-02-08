import { Metadata } from "next";
import Link from "next/link";
import { Fish } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "AquaBotAI Terms of Service - Read our terms and conditions for using the platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Fish className="h-8 w-8 text-brand-cyan" />
            <span className="text-xl font-bold">AquaBotAI</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl py-12">
        <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>

        <div className="prose prose-gray max-w-none dark:prose-invert">
          <p className="text-muted-foreground">Last updated: February 8, 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using AquaBotAI, you agree to be bound by these Terms of Service and
            our Privacy Policy.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            AquaBotAI is an AI-powered aquarium management platform that helps you track water
            parameters, manage livestock, schedule maintenance, and receive care recommendations.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials
            and for all activities that occur under your account.
          </p>

          <h2>4. Subscription and Billing</h2>
          <ul>
            <li>Free trials last 14 days with full access to features</li>
            <li>Paid subscriptions are billed monthly or annually</li>
            <li>Cancellations take effect at the end of the billing period</li>
            <li>No refunds for partial months</li>
          </ul>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any unlawful purpose</li>
            <li>Share your account with others</li>
            <li>Attempt to reverse engineer the service</li>
            <li>Abuse the AI chat system</li>
          </ul>

          <h2>6. Limitation of Liability</h2>
          <p>
            AquaBotAI provides information and recommendations as a tool to assist with aquarium
            care. We are not responsible for the health or survival of your aquatic life. Always
            use your own judgment and consult professionals when needed.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the service constitutes
            acceptance of the updated terms.
          </p>

          <h2>8. Contact</h2>
          <p>
            For questions about these terms, contact us at{" "}
            <a href="mailto:legal@aquabotai.com">legal@aquabotai.com</a>.
          </p>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/support" className="hover:underline">Support</Link>
        </div>
      </footer>
    </div>
  );
}
