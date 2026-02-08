import { Metadata } from "next";
import Link from "next/link";
import { Fish, Mail, MessageSquare, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch",
  description: "Contact the AquaBotAI team. Reach us via email for support, partnerships, or general inquiries about our aquarium management platform.",
  alternates: {
    canonical: "https://aquabotai-mu.vercel.app/contact",
  },
  openGraph: {
    title: "Contact Us | AquaBotAI",
    description: "Contact the AquaBotAI team. Reach us via email for support, partnerships, or general inquiries.",
    images: ["/og-image.png"],
  },
};

export default function ContactPage() {
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
        <h1 className="mb-4 text-4xl font-bold">Contact Us</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          We would love to hear from you. Choose the best way to reach us.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Mail className="h-10 w-10 text-brand-cyan" />
              <CardTitle className="mt-4">General Inquiries</CardTitle>
              <CardDescription>
                Questions about AquaBotAI? Interested in partnerships? Drop us a line.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <a href="mailto:hello@aquabotai.com">hello@aquabotai.com</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-brand-cyan" />
              <CardTitle className="mt-4">Customer Support</CardTitle>
              <CardDescription>
                Need help with your account or have a technical question?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <a href="mailto:support@aquabotai.com">support@aquabotai.com</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 rounded-lg border bg-muted/50 p-6">
          <div className="flex items-start gap-4">
            <MapPin className="mt-1 h-6 w-6 text-brand-cyan" />
            <div>
              <h2 className="text-lg font-semibold">Response Times</h2>
              <p className="mt-1 text-muted-foreground">
                We aim to respond to all inquiries within 24-48 hours during business days.
                For urgent support issues, please include &quot;URGENT&quot; in your subject line.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Looking for quick answers? Check our{" "}
            <Link href="/support" className="text-brand-cyan hover:underline">
              Support Center
            </Link>{" "}
            for FAQs and guides.
          </p>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/support" className="hover:underline">Support</Link>
        </div>
      </footer>
    </div>
  );
}
