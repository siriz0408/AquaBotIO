"use client";

import Image from "next/image";
import { HealthScoreGauge } from "./health-score-gauge";
import { cn } from "@/lib/utils";

interface TankHeaderProps {
  tankId: string;
  name: string;
  type: string;
  volumeGallons: number;
  photoUrl?: string | null;
  healthScore: number;
  className?: string;
}

export function TankHeader({
  name,
  type,
  volumeGallons,
  photoUrl,
  healthScore,
  className,
}: TankHeaderProps) {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-brand-navy to-brand-teal p-6 text-white relative overflow-hidden",
        className
      )}
    >
      {/* Optional background image */}
      {photoUrl && (
        <div className="absolute inset-0 opacity-20">
          <Image
            src={photoUrl}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2 text-white">{name}</h1>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
              {typeLabel}
            </span>
            <span className="text-white/90 text-sm">{volumeGallons} gallons</span>
          </div>
        </div>

        {/* Health Score Gauge */}
        <HealthScoreGauge score={healthScore} size="md" />
      </div>
    </div>
  );
}
