"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Fish, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { LivestockList, StockingIndicator } from "@/components/livestock";
import type { Livestock, Species } from "@/types/database";

interface Tank {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
}

export default function LivestockPage() {
  const router = useRouter();
  const params = useParams();
  const tankId = params.id as string;
  const supabase = createClient();

  const [tank, setTank] = useState<Tank | null>(null);
  const [livestock, setLivestock] = useState<(Livestock & { species?: Species })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLivestockLoading, setIsLivestockLoading] = useState(true);

  // Load livestock from API
  const loadLivestock = useCallback(async () => {
    setIsLivestockLoading(true);
    try {
      const response = await fetch(`/api/tanks/${tankId}/livestock`);
      const data = await response.json();
      if (data.success && data.data?.livestock) {
        setLivestock(data.data.livestock);
      }
    } catch (error) {
      console.error("Error loading livestock:", error);
    } finally {
      setIsLivestockLoading(false);
    }
  }, [tankId]);

  // Add livestock handler
  const handleAddLivestock = useCallback(
    async (
      speciesId: string,
      quantity: number,
      nickname?: string
    ): Promise<{ success: boolean; warning?: string }> => {
      try {
        const response = await fetch(`/api/tanks/${tankId}/livestock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            species_id: speciesId,
            quantity,
            nickname,
          }),
        });

        const data = await response.json();

        if (data.success) {
          if (data.data?.warning) {
            return { success: true, warning: data.data.warning };
          }
          await loadLivestock();
          return { success: true };
        } else {
          toast.error(data.error?.message || "Failed to add livestock");
          return { success: false };
        }
      } catch (error) {
        console.error("Error adding livestock:", error);
        toast.error("Failed to add livestock");
        return { success: false };
      }
    },
    [tankId, loadLivestock]
  );

  // Remove livestock handler
  const handleRemoveLivestock = useCallback(
    async (livestockId: string) => {
      try {
        const response = await fetch(
          `/api/tanks/${tankId}/livestock?livestock_id=${livestockId}`,
          { method: "DELETE" }
        );

        const data = await response.json();

        if (data.success) {
          toast.success("Livestock removed");
          await loadLivestock();
        } else {
          toast.error(data.error?.message || "Failed to remove livestock");
        }
      } catch (error) {
        console.error("Error removing livestock:", error);
        toast.error("Failed to remove livestock");
      }
    },
    [tankId, loadLivestock]
  );

  // Edit livestock handler
  const handleEditLivestock = useCallback(
    async (
      livestockId: string,
      updates: { quantity?: number; nickname?: string; notes?: string }
    ): Promise<boolean> => {
      try {
        const response = await fetch(`/api/tanks/${tankId}/livestock`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            livestock_id: livestockId,
            ...updates,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success("Livestock updated");
          await loadLivestock();
          return true;
        } else {
          toast.error(data.error?.message || "Failed to update livestock");
          return false;
        }
      } catch (error) {
        console.error("Error updating livestock:", error);
        toast.error("Failed to update livestock");
        return false;
      }
    },
    [tankId, loadLivestock]
  );

  useEffect(() => {
    async function loadTankData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Get tank details
        const { data: tankData, error: tankError } = await supabase
          .from("tanks")
          .select("id, name, type, volume_gallons")
          .eq("id", tankId)
          .eq("user_id", user.id)
          .single();

        if (tankError || !tankData) {
          toast.error("Tank not found");
          router.push("/dashboard");
          return;
        }

        setTank(tankData);
        loadLivestock();
      } catch (error) {
        console.error("Error loading tank data:", error);
        toast.error("Failed to load tank data");
      } finally {
        setIsLoading(false);
      }
    }

    loadTankData();
  }, [supabase, tankId, router, loadLivestock]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  if (!tank) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/tanks/${tankId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Fish className="h-6 w-6 text-brand-cyan" />
            <span className="font-bold">AquaBotAI</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{tank.name} - Livestock</h1>
          <p className="text-muted-foreground">
            Manage the fish, invertebrates, and plants in your tank
          </p>
        </div>

        {/* Stocking Density Indicator */}
        {tank.volume_gallons > 0 && livestock.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <StockingIndicator
                tankId={tankId}
                tankVolume={tank.volume_gallons}
                livestock={livestock}
              />
            </CardContent>
          </Card>
        )}

        {/* Livestock Section */}
        <Card>
          <CardContent className="pt-6">
            <LivestockList
              tankId={tankId}
              tankType={tank.type}
              livestock={livestock}
              isLoading={isLivestockLoading}
              onAdd={handleAddLivestock}
              onRemove={handleRemoveLivestock}
              onEdit={handleEditLivestock}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
