"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, Thermometer, Droplets, Ruler, Fish, Plus, Minus, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Species } from "@/types/database";

interface Tank {
  id: string;
  name: string;
  type: string;
}

type AddFlowStep = "details" | "tank-picker" | "add-form";

interface SpeciesDetailModalProps {
  species: Species;
  isOpen: boolean;
  onClose: () => void;
  onAddToTank?: (species: Species) => void;
  showAddButton?: boolean;
}

const CARE_LEVEL_COLORS = {
  beginner: "bg-green-500/10 text-green-500",
  intermediate: "bg-yellow-500/10 text-yellow-500",
  expert: "bg-red-500/10 text-red-500",
};

const TEMPERAMENT_COLORS = {
  peaceful: "bg-blue-500/10 text-blue-500",
  "semi_aggressive": "bg-orange-500/10 text-orange-500",
  aggressive: "bg-red-500/10 text-red-500",
};

const TYPE_EMOJIS = {
  freshwater: "🐟",
  saltwater: "🐠",
  invertebrate: "🦐",
  plant: "🌿",
  coral: "🪸",
};

export function SpeciesDetailModal({
  species,
  isOpen,
  onClose,
  onAddToTank,
  showAddButton = false,
}: SpeciesDetailModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [isLoadingTanks, setIsLoadingTanks] = useState(false);
  const [addFlowStep, setAddFlowStep] = useState<AddFlowStep>("details");

  // Add form state
  const [selectedTank, setSelectedTank] = useState<Tank | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [compatibilityWarning, setCompatibilityWarning] = useState<string | null>(null);

  const loadTanks = useCallback(async () => {
    setIsLoadingTanks(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("tanks")
        .select("id, name, type")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTanks(data || []);
    } catch (error) {
      console.error("Error loading tanks:", error);
    } finally {
      setIsLoadingTanks(false);
    }
  }, [supabase]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (showAddButton) {
        loadTanks();
      }
      // Reset add form state
      setAddFlowStep("details");
      setSelectedTank(null);
      setQuantity(1);
      setNotes("");
      setCompatibilityWarning(null);
    }
  }, [isOpen, showAddButton, loadTanks]);

  const handleSelectTank = (tank: Tank) => {
    setSelectedTank(tank);
    setAddFlowStep("add-form");
    setCompatibilityWarning(null);
  };

  const handleAddToTankClick = () => {
    if (onAddToTank) {
      // Custom handler provided
      onAddToTank(species);
      return;
    }

    // Show tank picker if multiple tanks
    if (tanks.length === 0) {
      toast.error("You need to create a tank first");
      router.push("/dashboard");
      return;
    }

    // Filter compatible tanks
    const compatibleTanks = tanks.filter(
      (tank) =>
        tank.type === species.type ||
        (species.type === "plant" && tank.type === "freshwater") ||
        (species.type === "invertebrate" &&
          (tank.type === "freshwater" || tank.type === "saltwater" || tank.type === "reef")) ||
        (species.type === "coral" && (tank.type === "reef" || tank.type === "saltwater"))
    );

    if (compatibleTanks.length === 0) {
      toast.error(`No compatible tanks found. Create a ${species.type} tank first.`);
      return;
    }

    if (compatibleTanks.length === 1) {
      // Single compatible tank - go directly to add form
      handleSelectTank(compatibleTanks[0]);
      return;
    }

    // Multiple tanks - show picker
    setAddFlowStep("tank-picker");
  };

  const handleSubmitAdd = async () => {
    if (!selectedTank) return;

    setIsAdding(true);
    try {
      const response = await fetch(`/api/tanks/${selectedTank.id}/livestock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          species_id: species.id,
          quantity,
          notes: notes.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to add species to tank");
      }

      if (result.data?.warning) {
        // Show compatibility warning
        setCompatibilityWarning(result.data.warning);
      } else {
        toast.success(`Added ${quantity} ${species.common_name} to ${selectedTank.name}`);
        onClose();
      }
    } catch (error) {
      console.error("Add to tank error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add species to tank");
    } finally {
      setIsAdding(false);
    }
  };

  const handleConfirmWithWarning = () => {
    // User accepted the warning, species was already added
    toast.success(`Added ${quantity} ${species.common_name} to ${selectedTank?.name}`);
    onClose();
  };

  const handleBackToDetails = () => {
    setAddFlowStep("details");
    setSelectedTank(null);
    setQuantity(1);
    setNotes("");
    setCompatibilityWarning(null);
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
      <div className="relative bg-background rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Photo */}
        <div className="aspect-video bg-gradient-to-br from-brand-cyan/20 to-purple-500/20 flex items-center justify-center relative">
          {species.photo_url ? (
            <Image
              src={species.photo_url}
              alt={species.common_name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
              priority
              unoptimized // Required for external GBIF/iNaturalist images
            />
          ) : (
            <span className="text-6xl">
              {TYPE_EMOJIS[species.type as keyof typeof TYPE_EMOJIS] || "🐟"}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold">{species.common_name}</h2>
            <p className="text-muted-foreground italic">
              {species.scientific_name}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                CARE_LEVEL_COLORS[species.care_level]
              )}
            >
              {species.care_level.charAt(0).toUpperCase() +
                species.care_level.slice(1)}{" "}
              Care
            </span>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                TEMPERAMENT_COLORS[species.temperament]
              )}
            >
              {species.temperament.charAt(0).toUpperCase() +
                species.temperament.slice(1).replace("-", " ")}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-muted">
              {species.type.charAt(0).toUpperCase() + species.type.slice(1)}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Ruler className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Max Size</p>
                <p className="font-semibold">{species.max_size_inches}&quot;</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Fish className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Min Tank</p>
                <p className="font-semibold">
                  {species.min_tank_size_gallons} gal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Thermometer className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p className="font-semibold">
                  {species.temp_min_f}–{species.temp_max_f}°F
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Droplets className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">pH Range</p>
                <p className="font-semibold">
                  {species.ph_min}–{species.ph_max}
                </p>
              </div>
            </div>
          </div>

          {/* Diet */}
          {species.diet && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                Diet
              </h3>
              <p className="text-sm">{species.diet}</p>
            </div>
          )}

          {/* Description */}
          {species.description && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                About
              </h3>
              <p className="text-sm">{species.description}</p>
            </div>
          )}

          {/* Compatibility notes */}
          {species.compatibility_notes && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                Compatibility
              </h3>
              <p className="text-sm">{species.compatibility_notes}</p>
            </div>
          )}

          {/* Add to tank section */}
          {showAddButton && addFlowStep === "details" && (
            <Button
              onClick={handleAddToTankClick}
              className="w-full mt-4"
              disabled={isLoadingTanks}
            >
              {isLoadingTanks ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Tank
                </>
              )}
            </Button>
          )}

          {/* Tank picker step */}
          {showAddButton && addFlowStep === "tank-picker" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto"
                  onClick={handleBackToDetails}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <p className="text-sm font-medium">Select a tank:</p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tanks
                  .filter(
                    (tank) =>
                      tank.type === species.type ||
                      (species.type === "plant" && tank.type === "freshwater") ||
                      (species.type === "invertebrate" &&
                        (tank.type === "freshwater" || tank.type === "saltwater" || tank.type === "reef")) ||
                      (species.type === "coral" && (tank.type === "reef" || tank.type === "saltwater"))
                  )
                  .map((tank) => (
                    <Button
                      key={tank.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleSelectTank(tank)}
                    >
                      <Fish className="h-4 w-4 mr-2" />
                      {tank.name}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {tank.type}
                      </span>
                    </Button>
                  ))}
              </div>
            </div>
          )}

          {/* Add form step */}
          {showAddButton && addFlowStep === "add-form" && selectedTank && (
            <div className="mt-4 space-y-4">
              {/* Back button and header */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto"
                  onClick={handleBackToDetails}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Adding to {selectedTank.name}
                  </p>
                </div>
              </div>

              {/* Compatibility warning */}
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
                  {/* Species summary */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl relative overflow-hidden">
                      {species.photo_url ? (
                        <Image
                          src={species.photo_url}
                          alt={species.common_name}
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized
                        />
                      ) : (
                        <span>
                          {TYPE_EMOJIS[species.type as keyof typeof TYPE_EMOJIS] || "🐟"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{species.common_name}</p>
                      <p className="text-sm text-muted-foreground italic truncate">
                        {species.scientific_name}
                      </p>
                    </div>
                  </div>

                  {/* Quantity selector */}
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

                  {/* Notes textarea */}
                  <div>
                    <Label htmlFor="add-notes" className="text-sm">
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="add-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., has ich, very aggressive, rescue fish"
                      className="mt-1 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onClick={handleBackToDetails}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSubmitAdd}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Tank
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
