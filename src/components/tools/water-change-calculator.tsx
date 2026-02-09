"use client";

import { useState, useMemo } from "react";
import { Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TANK_PRESETS = [10, 20, 29, 55, 75, 125] as const;
const PERCENTAGE_PRESETS = [10, 15, 20, 25, 30, 50] as const;

interface WaterChangeCalculatorProps {
  className?: string;
}

export function WaterChangeCalculator({ className }: WaterChangeCalculatorProps) {
  const [volume, setVolume] = useState<string>("20");
  const [percentage, setPercentage] = useState<string>("25");

  const volumeNum = parseFloat(volume) || 0;
  const percentageNum = parseFloat(percentage) || 0;

  const results = useMemo(() => {
    const gallonsToChange = (volumeNum * percentageNum) / 100;
    const litersToChange = gallonsToChange * 3.78541;

    return {
      gallons: gallonsToChange,
      liters: litersToChange,
    };
  }, [volumeNum, percentageNum]);

  const handleVolumePreset = (preset: number) => {
    setVolume(preset.toString());
  };

  const handlePercentagePreset = (preset: number) => {
    setPercentage(preset.toString());
  };

  const isValidInput = volumeNum > 0 && percentageNum > 0 && percentageNum <= 100;

  return (
    <Card className={cn("shadow-sm border-gray-200", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#1B998B15" }}
          >
            <Droplets className="w-5 h-5" style={{ color: "#1B998B" }} />
          </div>
          Water Change Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tank Volume Input */}
        <div className="space-y-3">
          <Label htmlFor="tank-volume" className="text-sm font-medium">
            Tank Volume (gallons)
          </Label>
          <Input
            id="tank-volume"
            type="number"
            min="0"
            max="10000"
            step="1"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            placeholder="Enter tank volume"
            className="text-lg"
            aria-describedby="tank-presets"
          />
          <div id="tank-presets" className="flex flex-wrap gap-2">
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

        {/* Change Percentage Input */}
        <div className="space-y-3">
          <Label htmlFor="change-percentage" className="text-sm font-medium">
            Change Percentage (%)
          </Label>
          <Input
            id="change-percentage"
            type="number"
            min="1"
            max="100"
            step="1"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder="Enter percentage"
            className="text-lg"
            aria-describedby="percentage-presets"
          />
          <div id="percentage-presets" className="flex flex-wrap gap-2">
            {PERCENTAGE_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={percentageNum === preset ? "default" : "outline"}
                size="sm"
                onClick={() => handlePercentagePreset(preset)}
                className="text-xs"
              >
                {preset}%
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "#1B998B10" }}
          role="region"
          aria-label="Calculation results"
        >
          {isValidInput ? (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Water to change</p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: "#1B998B" }}
                >
                  {results.gallons.toFixed(1)} gal
                </p>
                <p className="text-sm text-gray-500">
                  ({results.liters.toFixed(1)} liters)
                </p>
              </div>
              <div className="text-center pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {percentageNum}% of {volumeNum} gallons = {results.gallons.toFixed(1)} gallons
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm py-4">
              Enter valid tank volume and percentage to calculate
            </p>
          )}
        </div>

        {/* Tip */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <strong>Tip:</strong> Weekly water changes of 10-25% help maintain healthy water quality.
          Larger changes (up to 50%) may be needed for heavily stocked tanks or to address water quality issues.
        </div>
      </CardContent>
    </Card>
  );
}
