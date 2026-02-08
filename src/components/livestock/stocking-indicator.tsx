"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Livestock, Species } from "@/types/database";

interface StockingIndicatorProps {
  tankId: string;
  tankVolume: number; // gallons
  livestock: (Livestock & { species?: Species })[];
  compact?: boolean;
  className?: string;
}

export function StockingIndicator({
  tankVolume,
  livestock,
  compact = false,
  className,
}: StockingIndicatorProps) {
  const { totalInches, percentage, status } = useMemo(() => {
    // Calculate total inches using "1 inch per gallon" rule
    const total = livestock.reduce((sum, item) => {
      if (!item.species?.max_size_inches) return sum;
      return sum + item.species.max_size_inches * item.quantity;
    }, 0);

    const percentage = tankVolume > 0 ? (total / tankVolume) * 100 : 0;

    // Determine status
    let status: "understocked" | "well_stocked" | "fully_stocked" | "overstocked";
    if (percentage < 70) {
      status = "understocked";
    } else if (percentage < 90) {
      status = "well_stocked";
    } else if (percentage <= 100) {
      status = "fully_stocked";
    } else {
      status = "overstocked";
    }

    return {
      totalInches: total,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
      status,
    };
  }, [livestock, tankVolume]);

  const getStatusColor = () => {
    switch (status) {
      case "understocked":
        return "bg-green-500";
      case "well_stocked":
        return "bg-yellow-500";
      case "fully_stocked":
        return "bg-orange-500";
      case "overstocked":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "understocked":
        return "Understocked";
      case "well_stocked":
        return "Well Stocked";
      case "fully_stocked":
        return "Fully Stocked";
      case "overstocked":
        return "Overstocked";
      default:
        return "";
    }
  };

  if (compact) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Stocking Density</span>
          <span
            className={cn(
              "font-medium",
              status === "overstocked" && "text-red-500",
              status === "fully_stocked" && "text-orange-500",
              status === "well_stocked" && "text-yellow-500",
              status === "understocked" && "text-green-500"
            )}
          >
            {percentage}%
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full transition-all",
              getStatusColor()
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {totalInches.toFixed(1)} / {tankVolume} inches ({getStatusText()})
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-lg border p-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Stocking Density</h3>
          <p className="text-sm text-muted-foreground">
            Based on the &ldquo;1 inch per gallon&rdquo; rule
          </p>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "text-2xl font-bold",
              status === "overstocked" && "text-red-500",
              status === "fully_stocked" && "text-orange-500",
              status === "well_stocked" && "text-yellow-500",
              status === "understocked" && "text-green-500"
            )}
          >
            {percentage}%
          </div>
          <div className="text-xs text-muted-foreground">
            {getStatusText()}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
          {/* Zone indicators */}
          <div className="absolute inset-0 flex">
            <div className="h-full w-[70%] bg-green-500/20" />
            <div className="h-full w-[20%] bg-yellow-500/20" />
            <div className="h-full w-[10%] bg-orange-500/20" />
          </div>
          {/* Current progress */}
          <div
            className={cn(
              "relative h-full transition-all",
              getStatusColor()
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {totalInches.toFixed(1)} / {tankVolume} inches
          </span>
          <span>
            {status === "overstocked" && "⚠️ Consider reducing stock"}
            {status === "fully_stocked" && "✓ At capacity"}
            {status === "well_stocked" && "✓ Good balance"}
            {status === "understocked" && "✓ Room for more"}
          </span>
        </div>
      </div>
    </div>
  );
}
