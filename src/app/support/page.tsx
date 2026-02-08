import { Metadata } from "next";
import Link from "next/link";
import { Fish, Mail, MessageSquare, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Support Center - Help & FAQ",
  description: "Get help with AquaBotAI - FAQ about tank management, water parameters, subscriptions, and billing. Contact support via email.",
  alternates: {
    canonical: "https://aquabotai-mu.vercel.app/support",
  },
  openGraph: {
    title: "Support Center | AquaBotAI",
    description: "Get help with AquaBotAI - FAQ, email support, and AI chat assistant for aquarium care questions.",
    images: ["/og-image.png"],
  },
};

export default function SupportPage() {
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

      <main className="container max-w-4xl py-12">
        <h1 className="mb-4 text-4xl font-bold">Support Center</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Need help? We are here to assist you with your aquarium journey.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Mail className="h-10 w-10 text-brand-cyan" />
              <CardTitle className="mt-4">Email Support</CardTitle>
              <CardDescription>
                Send us an email and we will get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <a href="mailto:support@aquabotai.com">support@aquabotai.com</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-brand-cyan" />
              <CardTitle className="mt-4">AI Chat</CardTitle>
              <CardDescription>
                Ask our AI assistant for help with your aquarium questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/login">Open Chat</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold">How do I add a new tank?</h3>
              <p className="mt-1 text-muted-foreground">
                After logging in, go to your Dashboard and click the Add Tank button. Fill in your
                tank details including name, size, and type (freshwater/saltwater).
              </p>
            </div>

            <div>
              <h3 className="font-semibold">How do I log water parameters?</h3>
              <p className="mt-1 text-muted-foreground">
                Navigate to your tank page and click Log Parameters. Enter your test results and
                the AI will analyze them for any concerns.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">How do I cancel my subscription?</h3>
              <p className="mt-1 text-muted-foreground">
                Go to Settings and then Billing. Click Manage Subscription to access the Stripe
                customer portal where you can cancel or modify your plan.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Is my data secure?</h3>
              <p className="mt-1 text-muted-foreground">
                Yes! We use industry-standard encryption and row-level security to ensure your
                data is protected. See our Privacy Policy for details.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-lg border bg-muted/50 p-6 text-center">
          <FileText className="mx-auto h-10 w-10 text-brand-cyan" />
          <h3 className="mt-4 font-semibold">Need more help?</h3>
          <p className="mt-1 text-muted-foreground">
            Check our documentation or reach out to our support team.
          </p>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
