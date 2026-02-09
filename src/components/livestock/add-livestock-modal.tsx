"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, Search, Plus, Minus, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Species } from "@/types/database";

interface AddLivestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  tankId: string;
  tankType: string;
  onAdd: (speciesId: string, quantity: number, nickname?: string) => Promise<{ success: boolean; warning?: string }>;
}

export function AddLivestockModal({
  isOpen,
  onClose,
  tankType,
  onAdd,
}: AddLivestockModalProps) {
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Species[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [nickname, setNickname] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [compatibilityWarning, setCompatibilityWarning] = useState<string | null>(null);

  // Search species
  const searchSpecies = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      let query = supabase
        .from("species")
        .select("*")
        .or(`common_name.ilike.%${searchQuery}%,scientific_name.ilike.%${searchQuery}%`)
        .limit(10);

      // Filter by tank type if freshwater or saltwater
      if (tankType === "freshwater") {
        query = query.in("type", ["freshwater", "plant"]);
      } else if (tankType === "saltwater") {
        query = query.in("type", ["saltwater", "invertebrate"]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search species");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, tankType, supabase]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(searchSpecies, 300);
    return () => clearTimeout(timer);
  }, [searchSpecies]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedSpecies(null);
      setQuantity(1);
      setNickname("");
      setCompatibilityWarning(null);
    }
  }, [isOpen]);

  const handleSelectSpecies = (species: Species) => {
    setSelectedSpecies(species);
    setSearchQuery("");
    setSearchResults([]);
    setCompatibilityWarning(null);
  };

  const handleAdd = async () => {
    if (!selectedSpecies) return;

    setIsAdding(true);
    try {
      const result = await onAdd(
        selectedSpecies.id,
        quantity,
        nickname.trim() || undefined
      );

      if (result.success) {
        if (result.warning) {
          setCompatibilityWarning(result.warning);
        } else {
          toast.success(`Added ${quantity} ${selectedSpecies.common_name} to your tank`);
          onClose();
        }
      }
    } catch (error) {
      console.error("Add error:", error);
      toast.error("Failed to add livestock");
    } finally {
      setIsAdding(false);
    }
  };

  const handleConfirmWithWarning = async () => {
    if (!selectedSpecies) return;

    // Force add despite warning
    toast.success(`Added ${quantity} ${selectedSpecies.common_name} to your tank`);
    onClose();
  };

  if (!isOpen) return null;

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
          <h2 className="text-lg font-semibold">Add Livestock</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Compatibility Warning */}
          {compatibilityWarning && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-500 mb-1">
                    Compatibility Warning
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {compatibilityWarning}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCompatibilityWarning(null)}
                    >
                      Go Back
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleConfirmWithWarning}
                    >
                      Add Anyway
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!compatibilityWarning && (
            <>
              {/* Selected Species */}
              {selectedSpecies ? (
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl relative overflow-hidden">
                      {selectedSpecies.photo_url ? (
                        <Image
                          src={selectedSpecies.photo_url}
                          alt={selectedSpecies.common_name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        "🐟"
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {selectedSpecies.common_name}
                      </h3>
                      <p className="text-sm text-muted-foreground italic">
                        {selectedSpecies.scientific_name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSpecies(null)}
                    >
                      Change
                    </Button>
                  </div>

                  {/* Quantity */}
                  <div className="mt-4">
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
                  <div className="mt-4">
                    <Label htmlFor="nickname" className="text-sm">
                      Nickname (optional)
                    </Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g., Bubbles, Nemo..."
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Search */}
                  <div>
                    <Label className="text-sm">Search Species</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name..."
                        className="pl-10"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Search Results */}
                  {isSearching && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {!isSearching && searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((species) => (
                        <button
                          key={species.id}
                          onClick={() => handleSelectSpecies(species)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl relative overflow-hidden">
                            {species.photo_url ? (
                              <Image
                                src={species.photo_url}
                                alt={species.common_name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              "🐟"
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">
                              {species.common_name}
                            </h4>
                            <p className="text-xs text-muted-foreground italic truncate">
                              {species.scientific_name}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}

                  {!isSearching &&
                    searchQuery.trim() &&
                    searchResults.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No species found matching &ldquo;{searchQuery}&rdquo;</p>
                        <p className="text-sm mt-1">Try a different search term</p>
                      </div>
                    )}

                  {!searchQuery.trim() && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Start typing to search for species</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {selectedSpecies && !compatibilityWarning && (
          <div className="p-4 border-t">
            <Button
              onClick={handleAdd}
              disabled={isAdding}
              className="w-full"
            >
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add {quantity} {selectedSpecies.common_name}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
