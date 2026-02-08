"use client";

import { AlertTriangle, Lightbulb, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: "warning" | "tip";
  title: string;
  message: string;
}

interface AIInsightsProps {
  insights?: Insight[];
  className?: string;
}

const defaultInsights: Insight[] = [
  {
    id: "1",
    type: "warning",
    title: "Nitrate Levels Rising",
    message:
      "Nitrates have risen from 8→15 ppm over 10 days. Recommend a 20% water change this weekend.",
  },
  {
    id: "2",
    type: "tip",
    title: "Optimal Feeding Time",
    message:
      "Your fish are most active between 8-9 AM. Consider adjusting feeding schedule for better consumption.",
  },
];

export function AIInsights({ insights = defaultInsights, className }: AIInsightsProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const getInsightConfig = (type: "warning" | "tip") => {
    if (type === "warning") {
      return { icon: AlertTriangle, color: "#F59E0B" };
    }
    return { icon: Lightbulb, color: "#1B998B" };
  };

  const visibleInsights = insights.filter((i) => !dismissedIds.includes(i.id));

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  if (visibleInsights.length === 0) return null;

  return (
    <div className={cn("px-4", className)}>
      <h2 className="text-lg font-semibold text-brand-navy mb-3">AI Insights</h2>
      <div className="space-y-3">
        <AnimatePresence>
          {visibleInsights.map((insight, index) => {
            const config = getInsightConfig(insight.type);
            const Icon = config.icon;

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-4 shadow-sm border-l-4"
                style={{ borderColor: config.color }}
              >
                <div className="flex gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-brand-navy mb-1">{insight.title}</h3>
                      <button
                        onClick={() => handleDismiss(insight.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors -mr-1 -mt-1"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{insight.message}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
