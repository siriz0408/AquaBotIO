"use client";

import Image from "next/image";
import { Sparkles, Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeciesCardData {
  name: string;
  scientificName: string;
  imageUrl?: string;
  stats: {
    minTankSize: string;
    temperament: string;
    careLevel: string;
    temperature: string;
    pH: string;
    maxSize: string;
  };
  compatibility: "good" | "warning" | "alert";
  compatibilityMessage: string;
}

interface SpeciesCardProps {
  data: SpeciesCardData;
  timestamp: Date;
  onAddToTank?: () => void;
  className?: string;
}

export function SpeciesCard({ data, timestamp, onAddToTank, className }: SpeciesCardProps) {
  const compatibilityConfig = {
    good: { color: "#1B998B", icon: CheckCircle, label: "Compatible" },
    warning: { color: "#F59E0B", icon: AlertTriangle, label: "Caution" },
    alert: { color: "#FF6B6B", icon: AlertTriangle, label: "Not Recommended" },
  };

  const config = compatibilityConfig[data.compatibility];
  const CompatIcon = config.icon;

  return (
    <div className={cn("flex justify-start", className)}>
      <div className="max-w-[90%]">
        <div className="flex items-start gap-2 mb-1">
          <div className="w-6 h-6 bg-gradient-to-br from-brand-teal to-brand-navy rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold text-brand-teal">AquaBot</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-sm ml-8 overflow-hidden">
          {/* Image */}
          <div className="h-40 bg-gradient-to-br from-brand-teal/20 to-brand-navy/20 relative overflow-hidden">
            {data.imageUrl ? (
              <Image
                src={data.imageUrl}
                alt={data.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                🐠
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="mb-3">
              <h3 className="font-bold text-lg text-brand-navy">{data.name}</h3>
              <p className="text-sm text-gray-500 italic">{data.scientificName}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-500">Min Tank Size</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.minTankSize}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Temperament</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.temperament}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Temperature</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.temperature}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">pH Range</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.pH}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Max Size</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.maxSize}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Care Level</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.careLevel}</p>
              </div>
            </div>

            {/* Compatibility Badge */}
            <div
              className="rounded-xl p-3 mb-4 flex items-start gap-2"
              style={{ backgroundColor: `${config.color}15` }}
            >
              <CompatIcon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: config.color }} />
              <p className="text-sm font-medium" style={{ color: config.color }}>
                {data.compatibilityMessage}
              </p>
            </div>

            {/* Action Button */}
            {onAddToTank && data.compatibility !== "alert" && (
              <button
                onClick={onAddToTank}
                className="w-full bg-brand-teal text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-brand-teal/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add to Tank
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-1 ml-8">
          {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
