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

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-8 py-24 text-center md:py-32">
        <div className="flex max-w-3xl flex-col items-center gap-4">
          <div className="rounded-full bg-brand-cyan/10 px-4 py-1.5 text-sm font-medium text-brand-cyan dark:bg-brand-cyan/10 dark:text-brand-cyan-light">
            AI-Powered Aquarium Care
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your Aquarium&apos;s
            <span className="text-brand-cyan"> Intelligent </span>
            Companion
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
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
            14-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
                  <CardDescription>For trying things out</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>1 tank</li>
                    <li>10 AI messages/day</li>
                    <li>Basic parameter tracking</li>
                    <li>Species database access</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Starter */}
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <div className="text-3xl font-bold">
                    $3.99<span className="text-base font-normal">/mo</span>
                  </div>
                  <CardDescription>For hobbyists</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>1 tank</li>
                    <li>100 AI messages/day</li>
                    <li>Full parameter tracking</li>
                    <li>Maintenance scheduling</li>
                    <li>Push notifications</li>
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
                    $7.99<span className="text-base font-normal">/mo</span>
                  </div>
                  <CardDescription>For multiple tanks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>Up to 5 tanks</li>
                    <li>200 AI messages/day</li>
                    <li>Photo diagnosis</li>
                    <li>Equipment tracking</li>
                    <li>Everything in Starter</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Pro */}
              <Card>
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <div className="text-3xl font-bold">
                    $14.99<span className="text-base font-normal">/mo</span>
                  </div>
                  <CardDescription>For serious aquarists</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>Unlimited tanks</li>
                    <li>Unlimited AI messages</li>
                    <li>AI equipment recommendations</li>
                    <li>Email reports</li>
                    <li>Priority support</li>
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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
