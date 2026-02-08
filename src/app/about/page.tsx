import { Metadata } from "next";
import Link from "next/link";
import { Fish, Heart, Code, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About AquaBotAI - Our Mission & Team",
  description: "Learn about AquaBotAI, the AI-powered aquarium management platform. Our mission is to make fishkeeping accessible to everyone.",
  alternates: {
    canonical: "https://aquabotai-mu.vercel.app/about",
  },
  openGraph: {
    title: "About AquaBotAI | Our Mission & Team",
    description: "Learn about AquaBotAI, the AI-powered aquarium management platform. Our mission is to make fishkeeping accessible.",
    images: ["/og-image.png"],
  },
};

export default function AboutPage() {
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
        <h1 className="mb-8 text-4xl font-bold">About AquaBotAI</h1>

        <div className="prose prose-gray max-w-none dark:prose-invert">
          <section className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <Heart className="h-8 w-8 text-brand-cyan" />
              <h2 className="m-0 text-2xl font-bold">Our Mission</h2>
            </div>
            <p>
              AquaBotAI was created with a simple mission: to make fishkeeping accessible,
              enjoyable, and successful for everyone. Whether you are setting up your first
              betta tank or managing a complex reef system, we believe technology can help
              you provide the best care for your aquatic pets.
            </p>
          </section>

          <section className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <Code className="h-8 w-8 text-brand-cyan" />
              <h2 className="m-0 text-2xl font-bold">Our Technology</h2>
            </div>
            <p>
              We combine the latest in AI technology with decades of aquarium keeping
              knowledge. Our AI assistant is powered by Claude, trained to understand
              the nuances of water chemistry, fish behavior, and ecosystem management.
            </p>
            <ul>
              <li>AI-powered care recommendations personalized to your tank</li>
              <li>Water parameter tracking with trend analysis</li>
              <li>Species database covering 500+ freshwater and saltwater species</li>
              <li>Smart maintenance scheduling with push notifications</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <Users className="h-8 w-8 text-brand-cyan" />
              <h2 className="m-0 text-2xl font-bold">Our Commitment</h2>
            </div>
            <p>
              We are committed to the welfare of aquatic life. Every feature we build
              is designed to help you create healthier, more stable environments for
              your fish, invertebrates, and plants. We continuously update our AI with
              the latest aquarium science and best practices.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              Have questions or feedback? We would love to hear from you.
            </p>
            <ul>
              <li>Email: <a href="mailto:hello@aquabotai.com">hello@aquabotai.com</a></li>
              <li>Support: <Link href="/support">Visit our Support Center</Link></li>
            </ul>
          </section>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/support" className="hover:underline">Support</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
