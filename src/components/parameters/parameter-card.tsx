"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParameterChart } from "./parameter-chart";
import { TrendIndicator, calculateTrend } from "./trend-indicator";
import { cn } from "@/lib/utils";

interface DataPoint {
  date: string;
  value: number | null;
}

interface SafeZone {
  min: number;
  max: number;
}

interface ParameterCardProps {
  name: string;
  unit: string;
  data: DataPoint[];
  color: string;
  safeZone?: SafeZone;
  warningZone?: { min: number; max: number };
  // For some params (ammonia, nitrite), lower is better
  lowerIsBetter?: boolean;
  className?: string;
}

// Default safe zones for common parameters
export const PARAMETER_DEFAULTS: Record<
  string,
  { safeZone: SafeZone; warningZone: { min: number; max: number }; color: string; lowerIsBetter?: boolean }
> = {
  temperature: {
    safeZone: { min: 74, max: 80 },
    warningZone: { min: 70, max: 84 },
    color: "#ef4444", // red
  },
  ph: {
    safeZone: { min: 6.8, max: 7.6 },
    warningZone: { min: 6.4, max: 8.0 },
    color: "#8b5cf6", // purple
  },
  ammonia: {
    safeZone: { min: 0, max: 0.25 },
    warningZone: { min: 0, max: 0.5 },
    color: "#22c55e", // green
    lowerIsBetter: true,
  },
  nitrite: {
    safeZone: { min: 0, max: 0.25 },
    warningZone: { min: 0, max: 0.5 },
    color: "#3b82f6", // blue
    lowerIsBetter: true,
  },
  nitrate: {
    safeZone: { min: 0, max: 20 },
    warningZone: { min: 0, max: 40 },
    color: "#f97316", // orange
    lowerIsBetter: true,
  },
};

export function ParameterCard({
  name,
  unit,
  data,
  color,
  safeZone,
  warningZone,
  lowerIsBetter = false,
  className,
}: ParameterCardProps) {
  // Get latest value
  const validData = data.filter((d) => d.value !== null);
  const latestValue = validData.length > 0 ? validData[validData.length - 1].value : null;
  const values = validData.map((d) => d.value as number);

  // Calculate trend
  const trend = calculateTrend(values);
  // For some params (like ammonia/nitrite), trending down is good
  // For others (like pH in most cases), stable or slight up is preferred
  const isGoodDirection =
    trend === "stable" ||
    (lowerIsBetter && trend === "down") ||
    (!lowerIsBetter && trend === "up");

  // Determine status color based on safe zone
  const getStatusColor = () => {
    if (latestValue === null || !safeZone) return "text-muted-foreground";
    if (latestValue >= safeZone.min && latestValue <= safeZone.max) {
      return "text-green-500";
    }
    if (
      warningZone &&
      latestValue >= warningZone.min &&
      latestValue <= warningZone.max
    ) {
      return "text-yellow-500";
    }
    return "text-red-500";
  };

  const getStatusBadge = () => {
    if (latestValue === null || !safeZone) return null;
    if (latestValue >= safeZone.min && latestValue <= safeZone.max) {
      return (
        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
          Safe
        </span>
      );
    }
    if (
      warningZone &&
      latestValue >= warningZone.min &&
      latestValue <= warningZone.max
    ) {
      return (
        <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full">
          Warning
        </span>
      );
    }
    return (
      <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
        Danger
      </span>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{name}</CardTitle>
          {getStatusBadge()}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-2xl font-bold", getStatusColor())}>
            {latestValue !== null ? latestValue.toFixed(1) : "--"}
          </span>
          <span className="text-sm text-muted-foreground">{unit}</span>
          {validData.length >= 2 && (
            <TrendIndicator trend={trend} isGoodDirection={isGoodDirection} />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ParameterChart
          data={data}
          parameterName={name}
          unit={unit}
          color={color}
          safeZone={safeZone}
          warningZone={warningZone}
          height={120}
        />
      </CardContent>
    </Card>
  );
}
