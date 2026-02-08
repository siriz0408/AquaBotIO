"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fish, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TANK_TYPES, parseFormToTankData, validateTank } from "@/lib/validation/tank";
import { useTierLimits, TierCheckResult } from "@/lib/hooks/use-tier-limits";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";

const TANK_TYPE_OPTIONS = TANK_TYPES.map((type) => ({
  value: type,
  label: type.charAt(0).toUpperCase() + type.slice(1),
}));

export default function NewTankPage() {
  const router = useRouter();
  const supabase = createClient();
  const { canCreateTank } = useTierLimits();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingLimits, setIsCheckingLimits] = useState(true);
  const [tierCheck, setTierCheck] = useState<TierCheckResult | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [type, setType] = useState("freshwater");
  const [volume, setVolume] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [substrate, setSubstrate] = useState("");
  const [notes, setNotes] = useState("");

  // Check tier limits on page load
  useEffect(() => {
    async function checkLimits() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const result = await canCreateTank(user.id);
        setTierCheck(result);
      } catch (error) {
        console.error("Error checking tier limits:", error);
        toast.error("Failed to check account limits");
      } finally {
        setIsCheckingLimits(false);
      }
    }

    checkLimits();
  }, [supabase, canCreateTank, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse form data and validate with Zod
    const formData = parseFormToTankData({
      name,
      type,
      volume,
      length,
      width,
      height,
      substrate,
      notes,
    });

    const validation = validateTank(formData);
    if (!validation.success) {
      // Show first error
      const firstError = Object.values(validation.errors || {})[0];
      toast.error(firstError || "Please check your input");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Double-check tier limits before creating (defense in depth)
      const limitCheck = await canCreateTank(user.id);
      if (!limitCheck.allowed) {
        setTierCheck(limitCheck);
        toast.error(limitCheck.message || "Tank limit reached");
        setIsLoading(false);
        return;
      }

      const { data: tank, error } = await supabase
        .from("tanks")
        .insert({
          user_id: user.id,
          ...validation.data,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("You already have a tank with this name");
        } else {
          toast.error("Failed to create tank");
          console.error(error);
        }
        return;
      }

      toast.success("Tank created successfully!");
      router.push(`/tanks/${tank.id}`);
    } catch (error) {
      console.error("Error creating tank:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Fish className="h-6 w-6 text-brand-cyan" />
            <span className="font-bold">AquaBotAI</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mx-auto max-w-lg">
          {/* Loading state while checking limits */}
          {isCheckingLimits && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
            </div>
          )}

          {/* Upgrade prompt if limit reached */}
          {!isCheckingLimits && tierCheck && !tierCheck.allowed && (
            <div className="space-y-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold">Tank Limit Reached</h1>
                <p className="mt-2 text-muted-foreground">
                  You&apos;ve reached the maximum number of tanks for your plan.
                </p>
              </div>
              <UpgradePrompt
                currentTier={tierCheck.tier}
                feature="tanks"
                currentCount={tierCheck.currentCount}
              />
              <div className="text-center">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Tank creation form if allowed */}
          {!isCheckingLimits && tierCheck?.allowed && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Tank</CardTitle>
              <CardDescription>
                Set up a new tank profile to track water parameters and get
                AI-powered care recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tank Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Tank Name *</Label>
                  <Input
                    id="name"
                    placeholder="My Aquarium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Tank Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Tank Type *</Label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {TANK_TYPE_OPTIONS.map((tankType) => (
                      <option key={tankType.value} value={tankType.value}>
                        {tankType.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Volume */}
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume (gallons) *</Label>
                  <Input
                    id="volume"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="20"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    required
                  />
                </div>

                {/* Dimensions */}
                <div className="space-y-2">
                  <Label>Dimensions (inches)</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Length"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">Length</span>
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Width"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">Width</span>
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Height"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">Height</span>
                    </div>
                  </div>
                </div>

                {/* Substrate */}
                <div className="space-y-2">
                  <Label htmlFor="substrate">Substrate</Label>
                  <Input
                    id="substrate"
                    placeholder="e.g., Gravel, Sand, Aquasoil"
                    value={substrate}
                    onChange={(e) => setSubstrate(e.target.value)}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    placeholder="Any additional notes about your tank..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push("/dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Tank
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          )}
        </div>
      </main>
    </div>
  );
}
