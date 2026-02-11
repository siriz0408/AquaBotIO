"use client";

import { memo } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Species } from "@/types/database";

interface SpeciesCardProps {
  species: Species;
  onClick?: () => void;
  className?: string;
}

const CARE_LEVEL_COLORS = {
  beginner: "bg-green-500/10 text-green-500 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  expert: "bg-red-500/10 text-red-500 border-red-500/20",
};

const TEMPERAMENT_LABELS = {
  peaceful: "🕊️ Peaceful",
  "semi_aggressive": "⚡ Semi-Aggressive",
  aggressive: "🔥 Aggressive",
};

const TYPE_EMOJIS = {
  freshwater: "🐟",
  saltwater: "🐠",
  invertebrate: "🦐",
  plant: "🌿",
  coral: "🪸",
};

function SpeciesCardComponent({ species, onClick, className }: SpeciesCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-brand-cyan/50",
        className
      )}
      onClick={onClick}
    >
      {/* Photo placeholder */}
      <div className="aspect-video bg-gradient-to-br from-brand-cyan/20 to-purple-500/20 flex items-center justify-center relative">
        {species.photo_url ? (
          <Image
            src={species.photo_url}
            alt={species.common_name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        ) : (
          <span className="text-4xl">
            {TYPE_EMOJIS[species.type as keyof typeof TYPE_EMOJIS] || "🐟"}
          </span>
        )}
      </div>

      <CardContent className="p-4">
        {/* Name */}
        <h3 className="font-semibold truncate">{species.common_name}</h3>
        <p className="text-xs text-muted-foreground italic truncate mb-3">
          {species.scientific_name}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {/* Care level badge */}
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full border",
              CARE_LEVEL_COLORS[species.care_level]
            )}
          >
            {species.care_level.charAt(0).toUpperCase() +
              species.care_level.slice(1)}
          </span>

          {/* Temperament badge */}
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {TEMPERAMENT_LABELS[species.temperament]}
          </span>
        </div>

        {/* Quick stats */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <span className="block text-foreground font-medium">
              {species.max_size_inches}&quot;
            </span>
            <span>Max Size</span>
          </div>
          <div>
            <span className="block text-foreground font-medium">
              {species.min_tank_size_gallons} gal
            </span>
            <span>Min Tank</span>
          </div>
          <div>
            <span className="block text-foreground font-medium">
              {species.temp_min_f}–{species.temp_max_f}°F
            </span>
            <span>Temp Range</span>
          </div>
          <div>
            <span className="block text-foreground font-medium">
              {species.ph_min}–{species.ph_max}
            </span>
            <span>pH Range</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders in list
export const SpeciesCard = memo(SpeciesCardComponent);
