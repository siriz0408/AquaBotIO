"use client";

import { useState } from "react";
import { Plus, Fish, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LivestockCard } from "./livestock-card";
import { AddLivestockModal } from "./add-livestock-modal";
import { EditLivestockModal } from "./edit-livestock-modal";
import type { Livestock, Species } from "@/types/database";

interface LivestockListProps {
  tankId: string;
  tankType: string;
  livestock: (Livestock & { species?: Species })[];
  isLoading?: boolean;
  onAdd: (speciesId: string, quantity: number, nickname?: string) => Promise<{ success: boolean; warning?: string }>;
  onRemove: (id: string) => void;
  onEdit?: (id: string, updates: { quantity?: number; nickname?: string; notes?: string }) => Promise<boolean>;
}

export function LivestockList({
  tankId,
  tankType,
  livestock,
  isLoading = false,
  onAdd,
  onRemove,
  onEdit,
}: LivestockListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLivestock, setEditingLivestock] = useState<(Livestock & { species?: Species }) | null>(null);

  const totalCount = livestock.reduce((sum, item) => sum + item.quantity, 0);

  const handleEditLivestock = (id: string) => {
    const item = livestock.find((l) => l.id === id);
    if (item) {
      setEditingLivestock(item);
    }
  };

  const handleSaveLivestock = async (
    id: string,
    updates: { quantity?: number; nickname?: string; notes?: string }
  ): Promise<boolean> => {
    if (onEdit) {
      return onEdit(id, updates);
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Fish className="h-4 w-4" />
            Livestock
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "inhabitant" : "inhabitants"}
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Livestock Grid */}
      {livestock.length === 0 ? (
        <div className="text-center py-8 border rounded-lg border-dashed">
          <Fish className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No livestock yet</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-2"
          >
            Add your first inhabitant
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {livestock.map((item) => (
            <LivestockCard
              key={item.id}
              livestock={item}
              onRemove={onRemove}
              onEdit={onEdit ? handleEditLivestock : undefined}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AddLivestockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tankId={tankId}
        tankType={tankType}
        onAdd={onAdd}
      />

      {/* Edit Modal */}
      <EditLivestockModal
        isOpen={editingLivestock !== null}
        onClose={() => setEditingLivestock(null)}
        livestock={editingLivestock}
        onSave={handleSaveLivestock}
      />
    </div>
  );
}
