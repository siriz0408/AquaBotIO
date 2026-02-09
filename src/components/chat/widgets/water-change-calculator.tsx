"use client";

import { useState } from "react";
import { Droplets, Calculator, Calendar, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export interface WaterChangeCalculatorData {
  tankName: string;
  tankVolume: number;
  volumeUnit: "gal" | "L";
  currentNitrate?: number;
  recommendedPercent: number;
  calculatedAmount: number;
  tip?: string;
}

interface WaterChangeCalculatorProps {
  data: WaterChangeCalculatorData;
  onSchedule?: (percent: number, amount: number) => void;
  className?: string;
}

export function WaterChangeCalculatorWidget({
  data,
  onSchedule,
  className,
}: WaterChangeCalculatorProps) {
  const router = useRouter();
  const [customPercent, setCustomPercent] = useState(data.recommendedPercent);
  const [isScheduling, setIsScheduling] = useState(false);

  // Calculate amount based on percentage
  const calculateAmount = (percent: number) => {
    return Math.round((data.tankVolume * percent) / 100 * 10) / 10;
  };

  const currentAmount = calculateAmount(customPercent);

  // Handle schedule water change
  const handleSchedule = async () => {
    setIsScheduling(true);
    try {
      if (onSchedule) {
        await onSchedule(customPercent, currentAmount);
      } else {
        // Navigate to maintenance page with pre-filled data
        router.push(
          `/maintenance?action=new&type=water_change&notes=${encodeURIComponent(
            `${customPercent}% water change (${currentAmount} ${data.volumeUnit})`
          )}`
        );
      }
    } finally {
      setIsScheduling(false);
    }
  };

  // Preset percentages
  const presets = [10, 20, 25, 30, 50];

  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <Droplets className="w-5 h-5" />
          <h3 className="font-bold">Water Change Calculator</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Tank Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tank:</span>
          <span className="font-semibold text-brand-navy">{data.tankName}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Volume:</span>
          <span className="font-semibold text-brand-navy">
            {data.tankVolume} {data.volumeUnit}
          </span>
        </div>
        {data.currentNitrate !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Current Nitrate:</span>
            <span
              className={cn(
                "font-semibold",
                data.currentNitrate > 40
                  ? "text-red-500"
                  : data.currentNitrate > 20
                  ? "text-amber-500"
                  : "text-green-500"
              )}
            >
              {data.currentNitrate} ppm
            </span>
          </div>
        )}

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* Calculator */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Select percentage:
            </span>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {presets.map((percent) => (
              <button
                key={percent}
                onClick={() => setCustomPercent(percent)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  customPercent === percent
                    ? "bg-brand-teal text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {percent}%
              </button>
            ))}
          </div>

          {/* Result */}
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Amount to change:</p>
            <p className="text-3xl font-bold text-blue-600">
              {currentAmount} {data.volumeUnit}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ({customPercent}% of {data.tankVolume} {data.volumeUnit})
            </p>
          </div>
        </div>

        {/* Tip */}
        {data.tip && (
          <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{data.tip}</p>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleSchedule}
          disabled={isScheduling}
          className="w-full bg-brand-teal hover:bg-brand-teal/90"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {isScheduling ? "Scheduling..." : "Schedule Water Change"}
        </Button>
      </div>
    </div>
  );
}
