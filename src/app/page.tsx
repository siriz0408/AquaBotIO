import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Fish, Droplets, Bot, Bell, Sparkles, Shield, ArrowRight, Check } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-teal to-brand-navy rounded-xl flex items-center justify-center">
                <Fish className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold text-brand-navy">AquaBotAI</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-brand-navy hover:bg-brand-teal/10">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-brand-teal to-brand-navy text-white shadow-lg shadow-brand-teal/25 hover:shadow-xl hover:shadow-brand-teal/30 transition-all">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-brand-teal/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-brand-cyan/5 to-transparent rounded-full" />
          </div>

          <div className="container flex flex-col items-center justify-center gap-8 py-20 text-center md:py-28 lg:py-32">
            <div className="flex max-w-4xl flex-col items-center gap-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-lg shadow-brand-teal/10 border border-brand-teal/20">
                <Sparkles className="h-4 w-4 text-brand-teal" />
                <span className="text-brand-navy">AI-Powered Aquarium Intelligence</span>
              </div>

              {/* Headline */}
              <h1 className="fluid-h1 font-bold tracking-tight text-brand-navy max-w-3xl">
                Your Aquarium&apos;s
                <span className="relative mx-3">
                  <span className="relative z-10 bg-gradient-to-r from-brand-teal to-brand-cyan bg-clip-text text-transparent">
                    Personal AI
                  </span>
                  <svg className="absolute -bottom-1 left-0 w-full h-3 text-brand-cyan/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                    <path d="M0,8 Q50,0 100,8 T200,8" fill="none" stroke="currentColor" strokeWidth="4" />
                  </svg>
                </span>
                Assistant
              </h1>

              {/* Subheadline */}
              <p className="max-w-2xl fluid-body-lg text-gray-600">
                Track water parameters, manage livestock, get personalized care advice, and never miss a
                maintenance task. AquaBotAI makes keeping thriving aquariums effortless.
              </p>

              {/* CTAs */}
              <div className="flex flex-col gap-4 sm:flex-row mt-2">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-brand-teal to-brand-navy text-white shadow-xl shadow-brand-navy/20 hover:shadow-2xl hover:shadow-brand-navy/30 transition-all text-base px-8 h-14">
                    <Sparkles className="h-5 w-5" />
                    Start Free Trial
                    <ArrowRight className="h-5 w-5 ml-1" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="border-2 border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5 text-base px-8 h-14">
                    See How It Works
                  </Button>
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex items-center gap-6 text-sm text-gray-500 mt-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-teal" />
                  <span>7-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-teal" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-teal" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-16">
              <div className="text-center max-w-2xl">
                <h2 className="fluid-h2 font-bold tracking-tight text-brand-navy">
                  Everything You Need for Thriving Aquariums
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  From beginners to experts, AquaBotAI provides the tools and insights you need to maintain healthy aquatic ecosystems.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
                {/* Feature 1 */}
                <div className="group relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-teal/30 transition-all duration-300">
                  <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-brand-teal/10 to-brand-cyan/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bot className="h-6 w-6 text-brand-teal" />
                  </div>
                  <div className="pr-16">
                    <h3 className="text-lg font-bold text-brand-navy mb-2">AI Chat Assistant</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Get instant, personalized advice about your specific tank. Ask anything about fish care, water chemistry, or troubleshooting.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="group relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-teal/30 transition-all duration-300">
                  <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-brand-teal/10 to-brand-cyan/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Droplets className="h-6 w-6 text-brand-teal" />
                  </div>
                  <div className="pr-16">
                    <h3 className="text-lg font-bold text-brand-navy mb-2">Water Parameter Tracking</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Log pH, ammonia, nitrite, nitrate, and more. View trends with interactive charts and get alerts when parameters drift.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="group relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-teal/30 transition-all duration-300">
                  <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-brand-teal/10 to-brand-cyan/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Fish className="h-6 w-6 text-brand-teal" />
                  </div>
                  <div className="pr-16">
                    <h3 className="text-lg font-bold text-brand-navy mb-2">Livestock Management</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Track your fish, invertebrates, and plants. Get AI compatibility checks before adding new species to your tank.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="group relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-teal/30 transition-all duration-300">
                  <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-brand-teal/10 to-brand-cyan/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bell className="h-6 w-6 text-brand-teal" />
                  </div>
                  <div className="pr-16">
                    <h3 className="text-lg font-bold text-brand-navy mb-2">Smart Reminders</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Never forget a water change or filter cleaning. Set up recurring tasks with push notifications and email fallback.
                    </p>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="group relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-teal/30 transition-all duration-300">
                  <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-brand-teal/10 to-brand-cyan/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6 text-brand-teal" />
                  </div>
                  <div className="pr-16">
                    <h3 className="text-lg font-bold text-brand-navy mb-2">Species Database</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Access care guides for 500+ freshwater and saltwater species. Know exactly what each fish needs to thrive.
                    </p>
                  </div>
                </div>

                {/* Feature 6 */}
                <div className="group relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-teal/30 transition-all duration-300">
                  <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-brand-teal/10 to-brand-cyan/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="h-6 w-6 text-brand-teal" />
                  </div>
                  <div className="pr-16">
                    <h3 className="text-lg font-bold text-brand-navy mb-2">Tank Health Scores</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      See at a glance how your tank is doing. Health scores combine parameter stability, maintenance compliance, and more.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 md:py-28 bg-white">
          <div className="container">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-12">
              <div className="text-center max-w-2xl">
                <h2 className="fluid-h2 font-bold tracking-tight text-brand-navy">
                  Simple, Transparent Pricing
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Start free. Upgrade when you&apos;re ready.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 w-full">
                {/* Free */}
                <div className="bg-brand-bg rounded-3xl p-6 border border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-brand-navy">Free</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold text-brand-navy">$0</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Basic tools to get started</p>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>1 tank</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>Parameter logging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>Species database</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>3 maintenance tasks</span>
                    </li>
                  </ul>
                  <Link href="/signup" className="block mt-6">
                    <Button variant="outline" className="w-full border-brand-navy/20">
                      Get Started
                    </Button>
                  </Link>
                </div>

                {/* Starter */}
                <div className="bg-brand-bg rounded-3xl p-6 border border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-brand-navy">Starter</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-brand-navy">$4.99</span>
                      <span className="text-gray-500">/mo</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Taste of AI assistance</p>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>2 tanks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>10 AI messages/day</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>Full parameter tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>10 tasks per tank</span>
                    </li>
                  </ul>
                  <Link href="/signup?plan=starter" className="block mt-6">
                    <Button variant="outline" className="w-full border-brand-navy/20">
                      Start Trial
                    </Button>
                  </Link>
                </div>

                {/* Plus - Popular */}
                <div className="relative bg-gradient-to-br from-brand-navy to-brand-teal rounded-3xl p-6 text-white shadow-xl shadow-brand-navy/20">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-cyan text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      POPULAR
                    </span>
                  </div>
                  <div className="mb-4 pt-2">
                    <h3 className="text-lg font-bold">Plus</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">$9.99</span>
                      <span className="text-white/70">/mo</span>
                    </div>
                    <p className="text-sm text-white/70 mt-1">Full AI-powered management</p>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-cyan mt-0.5 shrink-0" />
                      <span>Up to 5 tanks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-cyan mt-0.5 shrink-0" />
                      <span>100 AI messages/day</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-cyan mt-0.5 shrink-0" />
                      <span>Photo diagnosis (10/day)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-cyan mt-0.5 shrink-0" />
                      <span>AI proactive alerts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-cyan mt-0.5 shrink-0" />
                      <span>AI-enhanced calculators</span>
                    </li>
                  </ul>
                  <Link href="/signup?plan=plus" className="block mt-6">
                    <Button className="w-full bg-white text-brand-navy hover:bg-white/90">
                      Start Trial
                    </Button>
                  </Link>
                </div>

                {/* Pro */}
                <div className="bg-brand-bg rounded-3xl p-6 border border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-brand-navy">Pro</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-brand-navy">$19.99</span>
                      <span className="text-gray-500">/mo</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">For serious aquarists</p>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>Unlimited tanks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>500 AI messages/day</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>Photo diagnosis (30/day)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>Equipment recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                      <span>Weekly email reports</span>
                    </li>
                  </ul>
                  <Link href="/signup?plan=pro" className="block mt-6">
                    <Button variant="outline" className="w-full border-brand-navy/20">
                      Start Trial
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative overflow-hidden py-20 md:py-28">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-brand-cyan/10 to-transparent rounded-full" />
          </div>

          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="fluid-h2 font-bold tracking-tight text-brand-navy mb-4">
                Ready to Transform Your Aquarium Care?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of aquarists who trust AquaBotAI to keep their tanks healthy and thriving.
              </p>
              <Link href="/signup">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-brand-teal to-brand-navy text-white shadow-xl shadow-brand-navy/20 hover:shadow-2xl hover:shadow-brand-navy/30 transition-all text-base px-10 h-14">
                  <Sparkles className="h-5 w-5" />
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-teal to-brand-navy rounded-lg flex items-center justify-center">
                <Fish className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-brand-navy">AquaBotAI</span>
            </div>
            <p className="text-sm text-gray-500">
              {new Date().getFullYear()} AquaBotAI. All rights reserved.
            </p>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <Link href="/about" className="hover:text-brand-teal transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-brand-teal transition-colors">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-brand-teal transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-brand-teal transition-colors">
                Terms
              </Link>
              <Link href="/support" className="hover:text-brand-teal transition-colors">
                Support
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
