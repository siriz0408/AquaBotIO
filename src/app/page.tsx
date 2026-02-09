import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Droplets, Bot, Bell, Sparkles, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="h-8 w-8 text-brand-cyan" />
            <span className="text-xl font-bold">AquaBotAI</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-8 py-24 text-center md:py-32">
        <div className="flex max-w-3xl flex-col items-center gap-4">
          <div className="rounded-full bg-brand-cyan/10 px-4 py-1.5 text-sm font-medium text-brand-cyan dark:bg-brand-cyan/10 dark:text-brand-cyan-light">
            AI-Powered Aquarium Care
          </div>
          <h1 className="fluid-h1 font-bold tracking-tight">
            Your Aquarium&apos;s
            <span className="text-brand-cyan"> Intelligent </span>
            Companion
          </h1>
          <p className="max-w-2xl fluid-body-lg text-muted-foreground">
            Track water parameters, manage livestock, get personalized AI advice, and never miss a
            maintenance task. AquaBotAI makes aquarium care effortless.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            7-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-12">
          <div className="text-center">
            <h2 className="fluid-h2 font-bold tracking-tight">
              Everything You Need for Healthy Aquariums
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From beginners to experts, AquaBotAI helps you maintain thriving aquatic ecosystems.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Bot className="h-10 w-10 text-brand-cyan" />
                <CardTitle className="mt-4">AI Chat Assistant</CardTitle>
                <CardDescription>
                  Get instant, personalized advice about your specific tank setup. Ask anything
                  about fish care, water chemistry, or troubleshooting.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Droplets className="h-10 w-10 text-brand-cyan" />
                <CardTitle className="mt-4">Water Parameter Tracking</CardTitle>
                <CardDescription>
                  Log pH, ammonia, nitrite, nitrate, and more. View trends with interactive charts
                  and get alerts when parameters drift.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Fish className="h-10 w-10 text-brand-cyan" />
                <CardTitle className="mt-4">Livestock Management</CardTitle>
                <CardDescription>
                  Track your fish, invertebrates, and plants. Get AI compatibility checks before
                  adding new species to your tank.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="h-10 w-10 text-brand-cyan" />
                <CardTitle className="mt-4">Smart Reminders</CardTitle>
                <CardDescription>
                  Never forget a water change or filter cleaning. Set up recurring tasks with push
                  notifications and email fallback.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-10 w-10 text-brand-cyan" />
                <CardTitle className="mt-4">Species Database</CardTitle>
                <CardDescription>
                  Access care guides for 500+ freshwater and saltwater species. Know exactly what
                  each fish needs to thrive.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-brand-cyan" />
                <CardTitle className="mt-4">Tank Health Scores</CardTitle>
                <CardDescription>
                  See at a glance how your tank is doing. Health scores combine parameter stability,
                  maintenance compliance, and more.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-12">
            <div className="text-center">
              <h2 className="fluid-h2 font-bold tracking-tight">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Start free. Upgrade when you&apos;re ready.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Free */}
              <Card>
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <div className="text-3xl font-bold">$0</div>
                  <CardDescription>Basic tools to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>1 tank</li>
                    <li>Parameter logging</li>
                    <li>Species database</li>
                    <li>3 maintenance tasks</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Starter */}
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <div className="text-3xl font-bold">
                    $4.99<span className="text-base font-normal">/mo</span>
                  </div>
                  <CardDescription>Taste of AI assistance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>2 tanks</li>
                    <li>10 AI messages/day</li>
                    <li>Full parameter tracking</li>
                    <li>10 tasks per tank</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Plus */}
              <Card className="border-brand-cyan shadow-lg">
                <CardHeader>
                  <div className="mb-2 w-fit rounded-full bg-brand-cyan px-3 py-1 text-xs font-medium text-white">
                    Popular
                  </div>
                  <CardTitle>Plus</CardTitle>
                  <div className="text-3xl font-bold">
                    $9.99<span className="text-base font-normal">/mo</span>
                  </div>
                  <CardDescription>Full AI-powered management</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>Up to 5 tanks</li>
                    <li>100 AI messages/day</li>
                    <li>Photo diagnosis (10/day)</li>
                    <li>AI proactive alerts</li>
                    <li>AI-enhanced calculators</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Pro */}
              <Card>
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <div className="text-3xl font-bold">
                    $19.99<span className="text-base font-normal">/mo</span>
                  </div>
                  <CardDescription>Everything for serious aquarists</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>Unlimited tanks</li>
                    <li>500 AI messages/day</li>
                    <li>Photo diagnosis (30/day)</li>
                    <li>Equipment recommendations</li>
                    <li>Weekly email reports</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="fluid-h2 font-bold tracking-tight">
            Ready to Transform Your Aquarium Care?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of aquarists who trust AquaBotAI to keep their tanks healthy.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Start Your Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Fish className="h-6 w-6 text-brand-cyan" />
            <span className="font-semibold">AquaBotAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AquaBotAI. All rights reserved.
          </p>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/about" className="hover:underline">
              About
            </Link>
            <Link href="/contact" className="hover:underline">
              Contact
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/support" className="hover:underline">
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
