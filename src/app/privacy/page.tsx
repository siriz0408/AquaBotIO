import { Metadata } from "next";
import Link from "next/link";
import { Fish } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - How We Protect Your Data",
  description: "AquaBotAI Privacy Policy - Learn how we collect, use, and protect your aquarium data with industry-standard security practices.",
  alternates: {
    canonical: "https://aquabotai-mu.vercel.app/privacy",
  },
  openGraph: {
    title: "Privacy Policy | AquaBotAI",
    description: "AquaBotAI Privacy Policy - Learn how we collect, use, and protect your aquarium data with industry-standard security.",
    images: ["/og-image.png"],
  },
};

export default function PrivacyPage() {
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
        <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none dark:prose-invert">
          <p className="text-muted-foreground">Last updated: February 8, 2026</p>

          <h2>1. Information We Collect</h2>
          <p>
            AquaBotAI collects information you provide directly, including your name, email address,
            and aquarium data such as tank parameters, livestock inventory, and maintenance logs.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and improve our aquarium management services</li>
            <li>Send you maintenance reminders and notifications</li>
            <li>Generate AI-powered care recommendations</li>
            <li>Process subscription payments</li>
          </ul>

          <h2>3. Data Storage and Security</h2>
          <p>
            Your data is stored securely using industry-standard encryption. We use Supabase for
            database hosting with row-level security policies to ensure you can only access your
            own data.
          </p>

          <h2>4. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li>Stripe for payment processing</li>
            <li>Anthropic Claude for AI-powered features</li>
            <li>Vercel for hosting</li>
            <li>Supabase for database and authentication</li>
          </ul>

          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Opt out of marketing communications</li>
          </ul>

          <h2>6. Contact Us</h2>
          <p>
            For privacy-related questions, contact us at{" "}
            <a href="mailto:privacy@aquabotai.com">privacy@aquabotai.com</a>.
          </p>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/support" className="hover:underline">Support</Link>
        </div>
      </footer>
    </div>
  );
}
