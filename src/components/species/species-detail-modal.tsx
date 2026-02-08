"use client";

import { useState, useEffect } from "react";
import { X, Thermometer, Droplets, Ruler, Fish, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [showTankPicker, setShowTankPicker] = useState(false);

  useEffect(() => {
    if (isOpen && showAddButton) {
      loadTanks();
    }
  }, [isOpen, showAddButton]);

  const loadTanks = async () => {
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
  };

  const handleAddToTank = (tankId: string) => {
    if (onAddToTank) {
      onAddToTank(species);
    } else {
      // Redirect to tank livestock page
      router.push(`/tanks/${tankId}/livestock`);
      toast.info(`Adding ${species.common_name} to tank`);
      onClose();
    }
  };

  const handleAddToTankClick = () => {
    if (onAddToTank) {
      // Custom handler provided
      onAddToTank(species);
      return;
    }

    // Show tank picker if multiple tanks, or redirect if single tank
    if (tanks.length === 0) {
      toast.error("You need to create a tank first");
      router.push("/dashboard");
      return;
    }

    if (tanks.length === 1) {
      handleAddToTank(tanks[0].id);
      return;
    }

    setShowTankPicker(true);
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
        <div className="aspect-video bg-gradient-to-br from-brand-cyan/20 to-purple-500/20 flex items-center justify-center">
          {species.photo_url ? (
            <img
              src={species.photo_url}
              alt={species.common_name}
              className="w-full h-full object-cover"
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

          {/* Add to tank button */}
          {showAddButton && (
            <>
              {!showTankPicker ? (
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
              ) : (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Select a tank:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tanks
                      .filter(
                        (tank) =>
                          tank.type === species.type ||
                          (species.type === "plant" && tank.type === "freshwater") ||
                          (species.type === "invertebrate" &&
                            (tank.type === "freshwater" || tank.type === "saltwater"))
                      )
                      .map((tank) => (
                        <Button
                          key={tank.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleAddToTank(tank.id)}
                        >
                          <Fish className="h-4 w-4 mr-2" />
                          {tank.name}
                          <span className="ml-auto text-xs text-muted-foreground">
                            {tank.type}
                          </span>
                        </Button>
                      ))}
                    {tanks.filter(
                      (tank) =>
                        tank.type === species.type ||
                        (species.type === "plant" && tank.type === "freshwater") ||
                        (species.type === "invertebrate" &&
                          (tank.type === "freshwater" || tank.type === "saltwater"))
                    ).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No compatible tanks found. Create a {species.type} tank first.
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowTankPicker(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
