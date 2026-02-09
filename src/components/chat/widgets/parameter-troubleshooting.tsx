"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export interface ParameterTroubleshootingData {
  parameter: string;
  currentValue: number | string;
  unit: string;
  status: "good" | "warning" | "danger";
  safeRange: {
    min: number;
    max: number;
  };
  explanation: string;
  likelyCauses: string[];
  fixSteps: string[];
  severity: "low" | "medium" | "high" | "critical";
  tankId?: string;
  tankName?: string;
}

interface ParameterTroubleshootingProps {
  data: ParameterTroubleshootingData;
  onScheduleWaterChange?: () => void;
  onLogParameters?: () => void;
  className?: string;
}

export function ParameterTroubleshootingWidget({
  data,
  onScheduleWaterChange,
  onLogParameters,
  className,
}: ParameterTroubleshootingProps) {
  const router = useRouter();
  const [showCauses, setShowCauses] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Status colors
  const statusConfig = {
    good: {
      bg: "from-green-500 to-emerald-500",
      color: "#10B981",
      badge: { bg: "bg-green-100", text: "text-green-700" },
      label: "Normal",
    },
    warning: {
      bg: "from-amber-500 to-orange-500",
      color: "#F59E0B",
      badge: { bg: "bg-amber-100", text: "text-amber-700" },
      label: "Warning",
    },
    danger: {
      bg: "from-red-500 to-rose-500",
      color: "#EF4444",
      badge: { bg: "bg-red-100", text: "text-red-700" },
      label: "Critical",
    },
  };

  // Severity indicators
  const severityConfig = {
    low: { icon: "info", priority: "Low Priority" },
    medium: { icon: "warning", priority: "Medium Priority" },
    high: { icon: "alert", priority: "High Priority" },
    critical: { icon: "critical", priority: "Immediate Action Required" },
  };

  const config = statusConfig[data.status];
  const severityInfo = severityConfig[data.severity];

  // Toggle step completion
  const toggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedSteps(newCompleted);
  };

  // Calculate progress
  const progress =
    data.fixSteps.length > 0
      ? Math.round((completedSteps.size / data.fixSteps.length) * 100)
      : 0;

  // Handle schedule water change
  const handleScheduleWaterChange = () => {
    if (onScheduleWaterChange) {
      onScheduleWaterChange();
    } else {
      router.push(
        `/maintenance?action=new&type=water_change&notes=${encodeURIComponent(
          `Water change to address ${data.parameter} level (${data.currentValue} ${data.unit})`
        )}`
      );
    }
  };

  // Handle log parameters
  const handleLogParameters = () => {
    if (onLogParameters) {
      onLogParameters();
    } else {
      router.push("/parameters?action=log");
    }
  };

  // Check if value is in range
  const valueNumeric =
    typeof data.currentValue === "number"
      ? data.currentValue
      : parseFloat(data.currentValue);
  const isAboveRange = valueNumeric > data.safeRange.max;
  const isBelowRange = valueNumeric < data.safeRange.min;

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className={cn("bg-gradient-to-r px-4 py-3", config.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold">Parameter Troubleshooting</h3>
          </div>
          <div
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              config.badge.bg,
              config.badge.text
            )}
          >
            {severityInfo.priority}
          </div>
        </div>
      </div>

      {/* Parameter Value Display */}
      <div className="px-4 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{data.parameter}</p>
            <div className="flex items-baseline gap-2">
              <span
                className="text-3xl font-bold"
                style={{ color: config.color }}
              >
                {data.currentValue}
              </span>
              <span className="text-sm text-gray-500">{data.unit}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Safe Range</p>
            <p className="text-sm font-semibold text-brand-navy">
              {data.safeRange.min} - {data.safeRange.max} {data.unit}
            </p>
            <p
              className={cn(
                "text-xs mt-1",
                isAboveRange
                  ? "text-red-500"
                  : isBelowRange
                  ? "text-blue-500"
                  : "text-green-500"
              )}
            >
              {isAboveRange ? "Above range" : isBelowRange ? "Below range" : "In range"}
            </p>
          </div>
        </div>

        {/* Visual Range Indicator */}
        <div className="mt-3">
          <div className="relative h-2 bg-gray-200 rounded-full overflow-visible">
            {/* Safe zone indicator */}
            <div
              className="absolute h-full bg-green-200 rounded-full"
              style={{
                left: `${Math.max(0, (data.safeRange.min / (data.safeRange.max * 1.5)) * 100)}%`,
                width: `${((data.safeRange.max - data.safeRange.min) / (data.safeRange.max * 1.5)) * 100}%`,
              }}
            />
            {/* Current value marker */}
            <div
              className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md -top-0.5"
              style={{
                left: `${Math.min(100, Math.max(0, (valueNumeric / (data.safeRange.max * 1.5)) * 100))}%`,
                backgroundColor: config.color,
                transform: "translateX(-50%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">{data.explanation}</p>
        </div>
      </div>

      {/* Likely Causes Section */}
      {data.likelyCauses.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowCauses(!showCauses)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-700">
              Likely Causes ({data.likelyCauses.length})
            </span>
            {showCauses ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {showCauses && (
            <div className="px-4 pb-3 space-y-2">
              {data.likelyCauses.map((cause, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-red-50 rounded-lg"
                >
                  <span className="text-red-500 font-bold text-sm">
                    {index + 1}.
                  </span>
                  <p className="text-sm text-red-700">{cause}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fix Steps Section */}
      {data.fixSteps.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                How to Fix ({completedSteps.size}/{data.fixSteps.length})
              </span>
              {progress === 100 && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>
            {showSteps ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {showSteps && (
            <div className="px-4 pb-3">
              {/* Progress bar */}
              {data.fixSteps.length > 1 && (
                <div className="mb-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-teal transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-2">
                {data.fixSteps.map((step, index) => {
                  const isCompleted = completedSteps.has(index);
                  return (
                    <button
                      key={index}
                      onClick={() => toggleStep(index)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors",
                        isCompleted
                          ? "bg-green-50 border border-green-100"
                          : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
                      )}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                          isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm flex-1",
                          isCompleted
                            ? "text-green-700 line-through"
                            : "text-gray-700"
                        )}
                      >
                        {step}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 space-y-2">
        <Button
          onClick={handleScheduleWaterChange}
          className="w-full bg-brand-teal hover:bg-brand-teal/90"
        >
          <Droplets className="w-4 h-4 mr-2" />
          Schedule Water Change
        </Button>
        <Button
          onClick={handleLogParameters}
          variant="outline"
          className="w-full"
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          Log Parameters
        </Button>
      </div>
    </div>
  );
}
