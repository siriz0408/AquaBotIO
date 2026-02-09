"use client";

import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WaterChangeCalculator,
  StockingCalculator,
  ParameterReference,
} from "@/components/tools";

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-brand-bg pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="h-5 w-5 text-brand-navy" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#1B998B15" }}
            >
              <Calculator className="h-5 w-5" style={{ color: "#1B998B" }} />
            </div>
            <div>
              <h1 className="font-bold text-brand-navy">Aquarium Tools</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <div className="mb-6">
          <p className="text-gray-600">
            Free calculators and guides for all aquarists
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Water Change Calculator - Full width on mobile, half on desktop */}
          <WaterChangeCalculator />

          {/* Stocking Calculator */}
          <StockingCalculator />

          {/* Parameter Reference - Full width */}
          <div className="lg:col-span-2">
            <ParameterReference />
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            These tools are available to all users, including those on the Free tier.
          </p>
          <p className="mt-1">
            For personalized AI-powered recommendations, try{" "}
            <Link href="/chat" className="text-brand-teal hover:underline">
              chatting with AquaBot
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
