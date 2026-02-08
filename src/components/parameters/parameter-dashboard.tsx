"use client";

import { useState, useEffect, useCallback } from "react";
import { subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ParameterCard, PARAMETER_DEFAULTS } from "./parameter-card";
import { ThresholdSettings } from "./threshold-settings";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { WaterParameter } from "@/types/database";

interface Threshold {
  safe_min: number;
  safe_max: number;
  warning_min: number;
  warning_max: number;
  is_custom: boolean;
}

interface Thresholds {
  [parameter_type: string]: Threshold;
}

type TimeRange = 7 | 30 | 90;

interface ParameterDashboardProps {
  tankId: string;
  tankType: string;
}

export function ParameterDashboard({
  tankId,
  tankType,
}: ParameterDashboardProps) {
  const [parameters, setParameters] = useState<WaterParameter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [error, setError] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState<Thresholds>({});

  const supabase = createClient();

  const loadParameters = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const startDate = subDays(new Date(), timeRange).toISOString();

      const { data, error: fetchError } = await supabase
        .from("water_parameters")
        .select("*")
        .eq("tank_id", tankId)
        .gte("measured_at", startDate)
        .order("measured_at", { ascending: true });

      if (fetchError) throw fetchError;
      setParameters(data || []);
    } catch (err) {
      console.error("Error loading parameters:", err);
      setError("Failed to load parameters");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tankId, timeRange, supabase]);

  // Load thresholds
  const loadThresholds = useCallback(async () => {
    try {
      const response = await fetch(`/api/tanks/${tankId}/thresholds`);
      const data = await response.json();

      if (data.success && data.data?.thresholds) {
        setThresholds(data.data.thresholds);
      }
    } catch (error) {
      console.error("Error loading thresholds:", error);
      // Continue with defaults if threshold fetch fails
    }
  }, [tankId]);

  useEffect(() => {
    loadParameters();
    loadThresholds();
  }, [loadParameters, loadThresholds]);

  // Transform data for charts
  const getChartData = (key: keyof WaterParameter) => {
    return parameters.map((p) => ({
      date: p.measured_at,
      value: p[key] as number | null,
    }));
  };

  // Determine which parameters to show based on tank type
  const isSaltwater = tankType === "saltwater";

  // Helper to get threshold zones for a parameter
  const getThresholdZones = (parameterKey: string) => {
    const customThreshold = thresholds[parameterKey];
    if (customThreshold) {
      return {
        safeZone: {
          min: customThreshold.safe_min,
          max: customThreshold.safe_max,
        },
        warningZone: {
          min: customThreshold.warning_min,
          max: customThreshold.warning_max,
        },
      };
    }
    // Fall back to defaults
    const defaults = PARAMETER_DEFAULTS[parameterKey];
    if (defaults) {
      return {
        safeZone: defaults.safeZone,
        warningZone: defaults.warningZone,
      };
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => loadParameters()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Water Parameters</h2>
          <p className="text-sm text-muted-foreground">
            {parameters.length} readings in the last {timeRange} days
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Threshold settings */}
          <ThresholdSettings
            tankId={tankId}
            tankType={tankType}
            onThresholdsChange={setThresholds}
          />

          {/* Time range selector */}
          <div className="flex bg-muted rounded-lg p-1">
            {([7, 30, 90] as TimeRange[]).map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === days
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadParameters(true)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>

          {/* Log new reading */}
          <Button asChild>
            <Link href={`/tanks/${tankId}/log`}>
              <Plus className="h-4 w-4 mr-2" />
              Log Reading
            </Link>
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {parameters.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl">🧪</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No readings yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Log your first water test to start tracking your tank&apos;s health.
              </p>
              <Button asChild>
                <Link href={`/tanks/${tankId}/log`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log First Reading
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parameter grid */}
      {parameters.length > 0 && (
        <>
          {/* Core parameters (always shown) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const tempZones = getThresholdZones("temperature");
              return (
                <ParameterCard
                  name="Temperature"
                  unit="°F"
                  data={getChartData("temperature_f")}
                  color={PARAMETER_DEFAULTS.temperature.color}
                  safeZone={tempZones?.safeZone}
                  warningZone={tempZones?.warningZone}
                />
              );
            })()}
            {(() => {
              const phZones = getThresholdZones("ph");
              return (
                <ParameterCard
                  name="pH"
                  unit=""
                  data={getChartData("ph")}
                  color={PARAMETER_DEFAULTS.ph.color}
                  safeZone={phZones?.safeZone}
                  warningZone={phZones?.warningZone}
                />
              );
            })()}
            {(() => {
              const ammoniaZones = getThresholdZones("ammonia");
              return (
                <ParameterCard
                  name="Ammonia"
                  unit="ppm"
                  data={getChartData("ammonia_ppm")}
                  color={PARAMETER_DEFAULTS.ammonia.color}
                  safeZone={ammoniaZones?.safeZone}
                  warningZone={ammoniaZones?.warningZone}
                  lowerIsBetter
                />
              );
            })()}
            {(() => {
              const nitriteZones = getThresholdZones("nitrite");
              return (
                <ParameterCard
                  name="Nitrite"
                  unit="ppm"
                  data={getChartData("nitrite_ppm")}
                  color={PARAMETER_DEFAULTS.nitrite.color}
                  safeZone={nitriteZones?.safeZone}
                  warningZone={nitriteZones?.warningZone}
                  lowerIsBetter
                />
              );
            })()}
            {(() => {
              const nitrateZones = getThresholdZones("nitrate");
              return (
                <ParameterCard
                  name="Nitrate"
                  unit="ppm"
                  data={getChartData("nitrate_ppm")}
                  color={PARAMETER_DEFAULTS.nitrate.color}
                  safeZone={nitrateZones?.safeZone}
                  warningZone={nitrateZones?.warningZone}
                  lowerIsBetter
                />
              );
            })()}
          </div>

          {/* Saltwater-specific parameters */}
          {isSaltwater && (
            <>
              <h3 className="text-lg font-semibold mt-8">Saltwater Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const salinityZones = getThresholdZones("salinity");
                  return (
                    <ParameterCard
                      name="Salinity"
                      unit="ppt"
                      data={getChartData("salinity")}
                      color="#06b6d4"
                      safeZone={salinityZones?.safeZone || { min: 1.023, max: 1.026 }}
                      warningZone={salinityZones?.warningZone || { min: 1.020, max: 1.028 }}
                    />
                  );
                })()}
                {(() => {
                  const calciumZones = getThresholdZones("calcium");
                  return (
                    <ParameterCard
                      name="Calcium"
                      unit="ppm"
                      data={getChartData("calcium_ppm")}
                      color="#a855f7"
                      safeZone={calciumZones?.safeZone || { min: 380, max: 450 }}
                      warningZone={calciumZones?.warningZone || { min: 350, max: 480 }}
                    />
                  );
                })()}
                {(() => {
                  const alkalinityZones = getThresholdZones("alkalinity");
                  return (
                    <ParameterCard
                      name="Alkalinity"
                      unit="dKH"
                      data={getChartData("alkalinity_dkh")}
                      color="#ec4899"
                      safeZone={alkalinityZones?.safeZone || { min: 7, max: 11 }}
                      warningZone={alkalinityZones?.warningZone || { min: 6, max: 13 }}
                    />
                  );
                })()}
                {(() => {
                  const magnesiumZones = getThresholdZones("magnesium");
                  return (
                    <ParameterCard
                      name="Magnesium"
                      unit="ppm"
                      data={getChartData("magnesium_ppm")}
                      color="#14b8a6"
                      safeZone={magnesiumZones?.safeZone || { min: 1250, max: 1400 }}
                      warningZone={magnesiumZones?.warningZone || { min: 1200, max: 1450 }}
                    />
                  );
                })()}
                {(() => {
                  const phosphateZones = getThresholdZones("phosphate");
                  return (
                    <ParameterCard
                      name="Phosphate"
                      unit="ppm"
                      data={getChartData("phosphate_ppm")}
                      color="#f59e0b"
                      safeZone={phosphateZones?.safeZone || { min: 0, max: 0.03 }}
                      warningZone={phosphateZones?.warningZone || { min: 0, max: 0.1 }}
                      lowerIsBetter
                    />
                  );
                })()}
              </div>
            </>
          )}

          {/* AI Analysis button */}
          <Card className="bg-gradient-to-r from-brand-cyan/10 to-purple-500/10 border-brand-cyan/20">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-cyan/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-brand-cyan" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Water Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Get personalized insights about your water quality trends
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link href={`/tanks/${tankId}/chat?analyze=params`}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Now
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
