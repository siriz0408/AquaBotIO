"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  trend: "up" | "down" | "stable";
  isGoodDirection?: boolean; // For some params, "down" is good (ammonia, nitrite)
  className?: string;
}

export function TrendIndicator({
  trend,
  isGoodDirection = true,
  className,
}: TrendIndicatorProps) {
  const getColor = () => {
    if (trend === "stable") return "text-muted-foreground";
    if (isGoodDirection) return "text-green-500";
    return "text-red-500";
  };

  const getIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4" />;
      case "down":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (trend) {
      case "up":
        return "Increasing";
      case "down":
        return "Decreasing";
      default:
        return "Stable";
    }
  };

  return (
    <div className={cn("flex items-center gap-1", getColor(), className)}>
      {getIcon()}
      <span className="text-xs">{getLabel()}</span>
    </div>
  );
}

// Utility to calculate trend from data points
export function calculateTrend(
  values: number[],
  threshold: number = 0.05
): "up" | "down" | "stable" {
  if (values.length < 2) return "stable";

  const recent = values.slice(-3);
  const older = values.slice(-6, -3);

  if (recent.length === 0 || older.length === 0) return "stable";

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const change = (recentAvg - olderAvg) / olderAvg;

  if (Math.abs(change) < threshold) return "stable";
  return change > 0 ? "up" : "down";
}
