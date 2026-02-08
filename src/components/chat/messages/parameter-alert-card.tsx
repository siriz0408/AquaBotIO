"use client";

import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParameterAlertData {
  parameter: string;
  currentValue: string;
  unit: string;
  status: "good" | "warning" | "alert";
  trend: number[];
  recommendation: string;
}

interface ParameterAlertCardProps {
  data: ParameterAlertData;
  timestamp: Date;
  className?: string;
}

export function ParameterAlertCard({ data, timestamp, className }: ParameterAlertCardProps) {
  const statusColors = {
    good: "#1B998B",
    warning: "#F59E0B",
    alert: "#FF6B6B",
  };

  const statusColor = statusColors[data.status];

  return (
    <div className={cn("flex justify-start", className)}>
      <div className="max-w-[85%]">
        <div className="flex items-start gap-2 mb-1">
          <div className="w-6 h-6 bg-gradient-to-br from-brand-teal to-brand-navy rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold text-brand-teal">AquaBot</span>
        </div>

        <div
          className="bg-white border-l-4 border-gray-200 rounded-2xl rounded-tl-md shadow-sm ml-8 p-4"
          style={{ borderLeftColor: statusColor }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-brand-navy mb-1">{data.parameter}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold" style={{ color: statusColor }}>
                  {data.currentValue}
                </span>
                <span className="text-sm text-gray-500">{data.unit}</span>
              </div>
            </div>

            {/* Mini Trend Chart */}
            <div className="flex items-end gap-1 h-12">
              {data.trend.map((value, index) => {
                const maxValue = Math.max(...data.trend);
                const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                return (
                  <div
                    key={index}
                    className="w-2 rounded-t"
                    style={{
                      height: `${Math.max(height, 10)}%`,
                      backgroundColor: statusColor,
                      opacity: 0.3 + (index / data.trend.length) * 0.7,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Status Badge */}
          <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
          >
            {data.status === "alert" && <AlertTriangle className="w-3 h-3" />}
            {data.status === "warning" && <TrendingUp className="w-3 h-3" />}
            <span className="capitalize">{data.status}</span>
          </div>

          {/* Recommendation */}
          <div className="bg-gray-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-700 mb-1">Recommended Action:</p>
            <p className="text-sm text-gray-600">{data.recommendation}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-1 ml-8">
          {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
