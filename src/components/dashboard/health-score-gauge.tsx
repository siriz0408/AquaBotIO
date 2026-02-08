"use client";

import { motion } from "framer-motion";

interface HealthScoreGaugeProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function HealthScoreGauge({ score, size = "md", className }: HealthScoreGaugeProps) {
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Good", color: "#1B998B" };
    if (score >= 60) return { label: "Caution", color: "#F59E0B" };
    return { label: "Alert", color: "#FF6B6B" };
  };

  const { label, color } = getHealthStatus(score);

  const sizes = {
    sm: { container: "w-16 h-16", radius: 24, strokeWidth: 4, textSize: "text-lg" },
    md: { container: "w-20 h-20", radius: 32, strokeWidth: 6, textSize: "text-xl" },
    lg: { container: "w-24 h-24", radius: 40, strokeWidth: 6, textSize: "text-2xl" },
  };

  const { container, radius, strokeWidth, textSize } = sizes[size];
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score / 100);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`relative ${container}`}>
        <svg className={`${container} transform -rotate-90`} viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`}>
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${textSize} font-bold text-white`}>{score}</span>
        </div>
      </div>
      <span className="text-xs mt-1 font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
