"use client";

import { useState } from "react";
import { SpeciesCard } from "./species-card";
import { SpeciesDetailModal } from "./species-detail-modal";
import type { Species } from "@/types/database";

interface SpeciesGridProps {
  species: Species[];
  isLoading?: boolean;
  emptyMessage?: string;
  onAddToTank?: (species: Species) => void;
  showAddButton?: boolean;
}

export function SpeciesGrid({
  species,
  isLoading = false,
  emptyMessage = "No species found",
  onAddToTank,
  showAddButton = false,
}: SpeciesGridProps) {
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-muted/30 animate-pulse"
          >
            <div className="aspect-video bg-muted" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-5 bg-muted rounded w-16" />
                <div className="h-5 bg-muted rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (species.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <span className="text-3xl">🔍</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No results</h3>
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {species.map((s) => (
          <SpeciesCard
            key={s.id}
            species={s}
            onClick={() => setSelectedSpecies(s)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      <SpeciesDetailModal
        species={selectedSpecies!}
        isOpen={!!selectedSpecies}
        onClose={() => setSelectedSpecies(null)}
        onAddToTank={onAddToTank}
        showAddButton={showAddButton}
      />
    </>
  );
}
