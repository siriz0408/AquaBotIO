"use client";

import { useState } from "react";
import { SpeciesCard } from "./species-card";
import { SpeciesDetailModal } from "./species-detail-modal";
import { SpeciesGridSkeleton } from "@/components/ui/skeleton";
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
    return <SpeciesGridSkeleton />;
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
