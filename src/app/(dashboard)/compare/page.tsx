"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Lightbulb, BarChart3, ChevronDown } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resolveUserTier } from "@/lib/hooks/use-tier-limits";
import { toast } from "sonner";

import { TopBar } from "@/components/navigation/top-bar";
import { FloatingChatButton } from "@/components/navigation/floating-chat-button";
import { TankHealthGrid, ComparisonChart } from "@/components/compare";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { HealthScoreResult } from "@/lib/health/calculate-health-score";

interface TankHealthData {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  photo_url: string | null;
  healthScore: HealthScoreResult;
  latestParams: {
    temperature_f?: number | null;
    ph?: number | null;
    ammonia_ppm?: number | null;
  } | null;
  overdueTasks: number;
}

interface HealthSummary {
  totalTanks: number;
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  critical: number;
  averageScore: number;
  tanksNeedingAttention: number;
}

interface ComparisonData {
  parameter: string;
  days: number;
  tanks: Array<{
    tank: {
      id: string;
      name: string;
      type: string;
      photoUrl: string | null;
    };
    dataPoints: Array<{ date: string; value: number | null }>;
    stats: {
      min: number;
      max: number;
      avg: number;
      latest: number;
      trend: "up" | "down" | "stable";
    } | null;
  }>;
  insight: string;
}

const PARAMETERS = [
  { value: "ph", label: "pH" },
  { value: "temperature_f", label: "Temperature" },
  { value: "ammonia_ppm", label: "Ammonia" },
  { value: "nitrite_ppm", label: "Nitrite" },
  { value: "nitrate_ppm", label: "Nitrate" },
  { value: "salinity_ppt", label: "Salinity" },
  { value: "calcium_ppm", label: "Calcium" },
  { value: "alkalinity_dkh", label: "Alkalinity" },
];

const TIME_RANGES = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

export default function ComparePage() {
  const router = useRouter();
  const supabase = createClient();

  const [tier, setTier] = useState<string | null>(null);
  const [tanks, setTanks] = useState<TankHealthData[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Comparison state
  const [selectedTanks, setSelectedTanks] = useState<string[]>([]);
  const [selectedParameter, setSelectedParameter] = useState("ph");
  const [selectedDays, setSelectedDays] = useState(30);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Check tier
        const userTier = await resolveUserTier(supabase, user.id);
        setTier(userTier);

        // Load health data (available for all users to see aggregate view)
        const response = await fetch("/api/tanks/health");
        const data = await response.json();

        if (data.success) {
          setTanks(data.data.tanks || []);
          setSummary(data.data.summary);

          // Pre-select first two tanks for comparison
          if (data.data.tanks.length >= 2 && userTier === "pro") {
            setSelectedTanks([data.data.tanks[0].id, data.data.tanks[1].id]);
          }
        }
      } catch (error) {
        console.error("Error loading compare data:", error);
        toast.error("Failed to load tank data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [supabase, router]);

  // Load comparison data
  const loadComparison = useCallback(async () => {
    if (selectedTanks.length < 2 || tier !== "pro") return;

    setIsComparing(true);
    try {
      const response = await fetch(
        `/api/tanks/compare?tankIds=${selectedTanks.join(",")}&parameter=${selectedParameter}&days=${selectedDays}`
      );
      const data = await response.json();

      if (data.success) {
        setComparisonData(data.data);
      } else {
        toast.error(data.error?.message || "Failed to load comparison");
      }
    } catch (error) {
      console.error("Error loading comparison:", error);
      toast.error("Failed to load comparison data");
    } finally {
      setIsComparing(false);
    }
  }, [selectedTanks, selectedParameter, selectedDays, tier]);

  // Load comparison when selections change
  useEffect(() => {
    if (selectedTanks.length >= 2 && tier === "pro") {
      loadComparison();
    }
  }, [selectedTanks, selectedParameter, selectedDays, tier, loadComparison]);

  // Toggle tank selection
  const toggleTankSelection = (tankId: string) => {
    setSelectedTanks((prev) => {
      if (prev.includes(tankId)) {
        return prev.filter((id) => id !== tankId);
      }
      if (prev.length >= 3) {
        // Replace the first selection
        return [...prev.slice(1), tankId];
      }
      return [...prev, tankId];
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  const isPro = tier === "pro";

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar tankName="Tank Comparison" />

      <div className="flex-1 container max-w-6xl py-6 space-y-6">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-3xl font-bold text-brand-navy">{summary.totalTanks}</div>
                <p className="text-sm text-muted-foreground">Total Tanks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-3xl font-bold text-brand-cyan">{summary.averageScore}</div>
                <p className="text-sm text-muted-foreground">Avg Health Score</p>
              </CardContent>
            </Card>
            <Card className={summary.tanksNeedingAttention > 0 ? "border-amber-200 bg-amber-50" : ""}>
              <CardContent className="p-4">
                <div className={`text-3xl font-bold ${summary.tanksNeedingAttention > 0 ? "text-amber-700" : "text-green-600"}`}>
                  {summary.tanksNeedingAttention}
                </div>
                <p className="text-sm text-muted-foreground">Need Attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-3xl font-bold text-green-600">{summary.excellent + summary.good}</div>
                <p className="text-sm text-muted-foreground">Healthy Tanks</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Aggregate Health View */}
        <div>
          <h2 className="text-xl font-semibold text-brand-navy mb-4">All Tanks at a Glance</h2>
          <TankHealthGrid tanks={tanks} />
        </div>

        {/* Pro-Only Comparison Section */}
        {!isPro ? (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Side-by-Side Comparison</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  Compare specific parameters across multiple tanks on the same chart. See trends, identify what&apos;s working, and get AI-powered insights.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Available on Pro plan only.
                </p>
                <Button asChild>
                  <Link href="/settings/billing">Upgrade to Pro</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : tanks.length < 2 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Add More Tanks to Compare</h3>
              <p className="text-muted-foreground mb-4">
                You need at least 2 tanks to use the comparison feature.
              </p>
              <Button asChild>
                <Link href="/tanks/new">Add Tank</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-cyan" />
                Parameter Comparison
              </CardTitle>
              <CardDescription>
                Select 2-3 tanks and a parameter to compare trends over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tank Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Tanks (2-3)</label>
                <div className="flex flex-wrap gap-2">
                  {tanks.map((tank) => (
                    <button
                      key={tank.id}
                      onClick={() => toggleTankSelection(tank.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedTanks.includes(tank.id)
                          ? "bg-brand-cyan text-white"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {tank.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameter and Time Range Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Parameter</label>
                  <div className="relative">
                    <select
                      value={selectedParameter}
                      onChange={(e) => setSelectedParameter(e.target.value)}
                      className="w-full h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer"
                    >
                      {PARAMETERS.map((param) => (
                        <option key={param.value} value={param.value}>
                          {param.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Time Range</label>
                  <div className="relative">
                    <select
                      value={selectedDays}
                      onChange={(e) => setSelectedDays(parseInt(e.target.value, 10))}
                      className="w-full h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer"
                    >
                      {TIME_RANGES.map((range) => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Comparison Chart */}
              {selectedTanks.length < 2 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select at least 2 tanks to see the comparison chart
                </div>
              ) : isComparing ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
                </div>
              ) : comparisonData ? (
                <ComparisonChart
                  tanks={comparisonData.tanks}
                  parameter={comparisonData.parameter}
                  height={350}
                />
              ) : null}

              {/* AI Insight */}
              {comparisonData?.insight && (
                <Card className="bg-brand-cyan/5 border-brand-cyan/20">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Lightbulb className="h-5 w-5 text-brand-cyan flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-brand-navy mb-1">AI Insight</p>
                        <p className="text-sm text-muted-foreground">{comparisonData.insight}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <FloatingChatButton />
    </div>
  );
}
