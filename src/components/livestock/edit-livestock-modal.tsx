"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Plus, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Livestock, Species } from "@/types/database";

interface EditLivestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  livestock: (Livestock & { species?: Species }) | null;
  onSave: (
    id: string,
    updates: { quantity?: number; nickname?: string; notes?: string }
  ) => Promise<boolean>;
}

export function EditLivestockModal({
  isOpen,
  onClose,
  livestock,
  onSave,
}: EditLivestockModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [nickname, setNickname] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens with livestock data
  useEffect(() => {
    if (isOpen && livestock) {
      setQuantity(livestock.quantity);
      setNickname(livestock.nickname || "");
      setNotes(livestock.notes || "");
    }
  }, [isOpen, livestock]);

  const handleSave = async () => {
    if (!livestock) return;

    setIsSaving(true);
    try {
      const updates: { quantity?: number; nickname?: string; notes?: string } = {};

      // Only include changed values
      if (quantity !== livestock.quantity) {
        updates.quantity = quantity;
      }
      if (nickname !== (livestock.nickname || "")) {
        updates.nickname = nickname.trim() || undefined;
      }
      if (notes !== (livestock.notes || "")) {
        updates.notes = notes.trim() || undefined;
      }

      // Skip API call if nothing changed
      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      const success = await onSave(livestock.id, updates);
      if (success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !livestock) return null;

  const speciesName =
    livestock.species?.common_name ||
    livestock.custom_name ||
    "Unknown Species";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Edit Livestock</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Species Info (read-only) */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl relative overflow-hidden">
                {livestock.species?.photo_url ? (
                  <Image
                    src={livestock.species.photo_url}
                    alt={speciesName}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  "🐟"
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{speciesName}</h3>
                {livestock.species?.scientific_name && (
                  <p className="text-sm text-muted-foreground italic">
                    {livestock.species.scientific_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <Label className="text-sm">Quantity</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Nickname */}
          <div>
            <Label htmlFor="edit-nickname" className="text-sm">
              Nickname (optional)
            </Label>
            <Input
              id="edit-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Bubbles, Nemo..."
              className="mt-1"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Give your fish a personal name
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="edit-notes" className="text-sm">
              Notes (optional)
            </Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., has ich, very aggressive, bought from LFS..."
              className="mt-1 min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Add health notes, behavior observations, or purchase info
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
