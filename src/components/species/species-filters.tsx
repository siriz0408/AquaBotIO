"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SpeciesType = "all" | "freshwater" | "saltwater" | "invertebrate" | "plant" | "coral";
export type CareLevel = "all" | "beginner" | "intermediate" | "expert";
export type Temperament = "all" | "peaceful" | "semi_aggressive" | "aggressive";

interface SpeciesFiltersProps {
  typeFilter: SpeciesType;
  onTypeChange: (type: SpeciesType) => void;
  careLevelFilter: CareLevel;
  onCareLevelChange: (level: CareLevel) => void;
  temperamentFilter: Temperament;
  onTemperamentChange: (temperament: Temperament) => void;
  className?: string;
}

const TYPE_OPTIONS: { value: SpeciesType; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "🌊" },
  { value: "freshwater", label: "Freshwater", emoji: "🐟" },
  { value: "saltwater", label: "Saltwater", emoji: "🐠" },
  { value: "invertebrate", label: "Invertebrate", emoji: "🦐" },
  { value: "plant", label: "Plant", emoji: "🌿" },
  { value: "coral", label: "Coral", emoji: "🪸" },
];

const CARE_LEVEL_OPTIONS: { value: CareLevel; label: string; color: string }[] = [
  { value: "all", label: "All Levels", color: "" },
  { value: "beginner", label: "Beginner", color: "text-green-500" },
  { value: "intermediate", label: "Intermediate", color: "text-yellow-500" },
  { value: "expert", label: "Expert", color: "text-red-500" },
];

const TEMPERAMENT_OPTIONS: { value: Temperament; label: string }[] = [
  { value: "all", label: "All" },
  { value: "peaceful", label: "Peaceful" },
  { value: "semi_aggressive", label: "Semi-Aggressive" },
  { value: "aggressive", label: "Aggressive" },
];

export function SpeciesFilters({
  typeFilter,
  onTypeChange,
  careLevelFilter,
  onCareLevelChange,
  temperamentFilter,
  onTemperamentChange,
  className,
}: SpeciesFiltersProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Type filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Type
        </label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={typeFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onTypeChange(option.value)}
              className="gap-1"
            >
              <span>{option.emoji}</span>
              <span>{option.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Care Level filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Care Level
        </label>
        <div className="flex flex-wrap gap-2">
          {CARE_LEVEL_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={careLevelFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onCareLevelChange(option.value)}
              className={cn(
                careLevelFilter === option.value ? "" : option.color
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Temperament filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Temperament
        </label>
        <div className="flex flex-wrap gap-2">
          {TEMPERAMENT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={temperamentFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onTemperamentChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
