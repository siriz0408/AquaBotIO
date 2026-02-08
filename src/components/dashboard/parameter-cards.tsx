"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Parameter {
  name: string;
  value: string;
  unit?: string;
  status: "good" | "caution" | "alert";
  trend: "up" | "down" | "stable";
}

interface ParameterCardsProps {
  parameters?: Parameter[];
  className?: string;
}

const defaultParameters: Parameter[] = [
  { name: "pH", value: "8.2", status: "good", trend: "stable" },
  { name: "Ammonia", value: "0", unit: "ppm", status: "good", trend: "stable" },
  { name: "Nitrate", value: "15", unit: "ppm", status: "caution", trend: "up" },
  { name: "Temperature", value: "78", unit: "°F", status: "good", trend: "stable" },
  { name: "Salinity", value: "1.025", status: "good", trend: "stable" },
];

export function ParameterCards({ parameters = defaultParameters, className }: ParameterCardsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "#1B998B";
      case "caution":
        return "#F59E0B";
      case "alert":
        return "#FF6B6B";
      default:
        return "#6B7280";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4" />;
      case "down":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn("px-4", className)}>
      <h2 className="text-lg font-semibold text-brand-navy mb-3">Water Parameters</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {parameters.map((param, index) => (
          <motion.div
            key={param.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm min-w-[140px] flex-shrink-0"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm text-gray-600">{param.name}</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getStatusColor(param.status) }}
              />
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-bold text-brand-navy">{param.value}</span>
              {param.unit && <span className="text-sm text-gray-500">{param.unit}</span>}
            </div>
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: getStatusColor(param.status) }}
            >
              {getTrendIcon(param.trend)}
              <span className="capitalize">{param.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
