"use client";

import { useState, useMemo } from "react";
import { Fish } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TANK_PRESETS = [10, 20, 29, 55, 75, 125] as const;

type StockingStatus = "understocked" | "well-stocked" | "approaching" | "overstocked";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

const STATUS_CONFIG: Record<StockingStatus, StatusConfig> = {
  understocked: {
    label: "Understocked",
    color: "#16a34a",
    bgColor: "#16a34a15",
    description: "Plenty of room for more fish",
  },
  "well-stocked": {
    label: "Well Stocked",
    color: "#16a34a",
    bgColor: "#16a34a15",
    description: "Good balance of fish to water volume",
  },
  approaching: {
    label: "Approaching Limit",
    color: "#ca8a04",
    bgColor: "#ca8a0415",
    description: "Consider not adding more fish",
  },
  overstocked: {
    label: "Overstocked",
    color: "#dc2626",
    bgColor: "#dc262615",
    description: "May need more water changes or fewer fish",
  },
};

interface StockingCalculatorProps {
  className?: string;
}

export function StockingCalculator({ className }: StockingCalculatorProps) {
  const [tankVolume, setTankVolume] = useState<string>("20");
  const [fishInches, setFishInches] = useState<string>("10");

  const volumeNum = parseFloat(tankVolume) || 0;
  const inchesNum = parseFloat(fishInches) || 0;

  const results = useMemo(() => {
    if (volumeNum <= 0) {
      return null;
    }

    const percentageUsed = (inchesNum / volumeNum) * 100;
    let status: StockingStatus;

    if (percentageUsed < 50) {
      status = "understocked";
    } else if (percentageUsed <= 80) {
      status = "well-stocked";
    } else if (percentageUsed <= 100) {
      status = "approaching";
    } else {
      status = "overstocked";
    }

    return {
      percentageUsed: Math.min(percentageUsed, 150), // Cap display at 150%
      actualPercentage: percentageUsed,
      status,
      statusConfig: STATUS_CONFIG[status],
      remainingCapacity: Math.max(0, volumeNum - inchesNum),
    };
  }, [volumeNum, inchesNum]);

  const handleVolumePreset = (preset: number) => {
    setTankVolume(preset.toString());
  };

  const isValidInput = volumeNum > 0;

  return (
    <Card className={cn("shadow-sm border-gray-200", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#0A254015" }}
          >
            <Fish className="w-5 h-5" style={{ color: "#0A2540" }} />
          </div>
          Stocking Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tank Volume Input */}
        <div className="space-y-3">
          <Label htmlFor="stocking-tank-volume" className="text-sm font-medium">
            Tank Volume (gallons)
          </Label>
          <Input
            id="stocking-tank-volume"
            type="number"
            min="0"
            max="10000"
            step="1"
            value={tankVolume}
            onChange={(e) => setTankVolume(e.target.value)}
            placeholder="Enter tank volume"
            className="text-lg"
            aria-describedby="stocking-tank-presets"
          />
          <div id="stocking-tank-presets" className="flex flex-wrap gap-2">
            {TANK_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={volumeNum === preset ? "default" : "outline"}
                size="sm"
                onClick={() => handleVolumePreset(preset)}
                className="text-xs"
              >
                {preset} gal
              </Button>
            ))}
          </div>
        </div>

        {/* Fish Inches Input */}
        <div className="space-y-3">
          <Label htmlFor="fish-inches" className="text-sm font-medium">
            Total Fish Length (inches)
          </Label>
          <Input
            id="fish-inches"
            type="number"
            min="0"
            max="500"
            step="0.5"
            value={fishInches}
            onChange={(e) => setFishInches(e.target.value)}
            placeholder="Enter total inches of fish"
            className="text-lg"
            aria-describedby="fish-inches-help"
          />
          <p id="fish-inches-help" className="text-xs text-gray-500">
            Add up the adult size (in inches) of all your fish
          </p>
        </div>

        {/* Results */}
        <div
          className="rounded-xl p-4"
          role="region"
          aria-label="Stocking calculation results"
          style={{
            backgroundColor: results?.statusConfig.bgColor || "#f3f4f6",
          }}
        >
          {isValidInput && results ? (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: results.statusConfig.color + "20",
                    color: results.statusConfig.color,
                  }}
                >
                  {results.statusConfig.label}
                </span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: results.statusConfig.color }}
                >
                  {Math.round(results.actualPercentage)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(results.percentageUsed, 100)}%`,
                      backgroundColor: results.statusConfig.color,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50% (Under)</span>
                  <span>80% (Good)</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Summary */}
              <div className="text-center pt-2 border-t border-gray-200/50">
                <p className="text-sm text-gray-700">
                  <strong>{inchesNum}</strong> inches in{" "}
                  <strong>{volumeNum}</strong> gallon tank
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {results.statusConfig.description}
                </p>
                {results.remainingCapacity > 0 && results.status !== "overstocked" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Room for ~{results.remainingCapacity.toFixed(0)} more inches of fish
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm py-4">
              Enter tank volume to calculate stocking level
            </p>
          )}
        </div>

        {/* Tip */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <strong>Note:</strong> The &quot;1 inch per gallon&quot; rule is a general guideline.
          Actual capacity depends on filtration, species bioload, and tank shape.
          High-bioload fish (like goldfish) need more water per inch.
        </div>
      </CardContent>
    </Card>
  );
}
