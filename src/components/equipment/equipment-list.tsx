"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, AlertCircle, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EquipmentCard, type Equipment } from "./equipment-card";
import { AddEquipmentModal, type EquipmentFormData } from "./add-equipment-modal";
import type { DeletionReason } from "@/lib/equipment/utils";
import { toast } from "sonner";
import Link from "next/link";

interface EquipmentStats {
  total: number;
  overdue: number;
  due_soon: number;
  good: number;
  total_investment: number;
}

interface EquipmentListProps {
  tankId: string;
  tier: "free" | "starter" | "plus" | "pro";
}

export function EquipmentList({ tankId, tier }: EquipmentListProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const canAccessEquipment = tier === "plus" || tier === "pro";

  // Load equipment
  const loadEquipment = useCallback(async () => {
    if (!canAccessEquipment) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/tanks/${tankId}/equipment`);
      const data = await response.json();

      if (data.success) {
        setEquipment(data.data.equipment || []);
        setStats(data.data.stats || null);
      } else {
        if (data.error?.code === "TIER_REQUIRED") {
          // Tier check failed, handled by UI
        } else {
          toast.error(data.error?.message || "Failed to load equipment");
        }
      }
    } catch (error) {
      console.error("Error loading equipment:", error);
      toast.error("Failed to load equipment");
    } finally {
      setIsLoading(false);
    }
  }, [tankId, canAccessEquipment]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  // Add equipment
  const handleAddEquipment = async (data: EquipmentFormData) => {
    const response = await fetch(`/api/tanks/${tankId}/equipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      toast.success("Equipment added");
      await loadEquipment();
    } else {
      toast.error(result.error?.message || "Failed to add equipment");
      throw new Error(result.error?.message);
    }
  };

  // Edit equipment
  const handleEditEquipment = async (data: EquipmentFormData) => {
    if (!editingEquipment) return;

    const response = await fetch(`/api/tanks/${tankId}/equipment/${editingEquipment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      toast.success("Equipment updated");
      setEditingEquipment(null);
      await loadEquipment();
    } else {
      toast.error(result.error?.message || "Failed to update equipment");
      throw new Error(result.error?.message);
    }
  };

  // Mark as serviced
  const handleMarkServiced = async (equipmentId: string) => {
    const response = await fetch(`/api/tanks/${tankId}/equipment/${equipmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_serviced" }),
    });

    const result = await response.json();

    if (result.success) {
      toast.success("Equipment marked as serviced");
      await loadEquipment();
    } else {
      toast.error(result.error?.message || "Failed to update equipment");
    }
  };

  // Delete equipment
  const handleDeleteEquipment = async (equipmentId: string, reason: DeletionReason) => {
    const response = await fetch(`/api/tanks/${tankId}/equipment/${equipmentId}?reason=${reason}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      toast.success("Equipment removed");
      await loadEquipment();
    } else {
      toast.error(result.error?.message || "Failed to remove equipment");
    }
  };

  // Tier gating UI
  if (!canAccessEquipment) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Equipment Tracking</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Track your aquarium equipment, get maintenance reminders, and never miss a filter change again.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Available on Plus and Pro plans.
            </p>
            <Button asChild>
              <Link href="/settings/billing">Upgrade to Plus</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-brand-navy">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
          {stats.overdue > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
                <p className="text-sm text-red-600">Overdue</p>
              </CardContent>
            </Card>
          )}
          {stats.due_soon > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-700">{stats.due_soon}</div>
                <p className="text-sm text-amber-600">Due Soon</p>
              </CardContent>
            </Card>
          )}
          {stats.total_investment > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-brand-navy">
                  ${stats.total_investment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-muted-foreground">Investment</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand-navy">Equipment</h2>
          <p className="text-sm text-muted-foreground">
            Track maintenance schedules and equipment lifespan
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      {/* Equipment List */}
      {equipment.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Equipment Yet</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Start tracking your filters, heaters, lights, and more to get maintenance reminders.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Equipment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {equipment.map((item) => (
            <EquipmentCard
              key={item.id}
              equipment={item}
              onMarkServiced={handleMarkServiced}
              onEdit={(eq) => {
                setEditingEquipment(eq);
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteEquipment}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddEquipmentModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingEquipment(null);
        }}
        editingEquipment={editingEquipment}
        onSubmit={editingEquipment ? handleEditEquipment : handleAddEquipment}
      />
    </div>
  );
}
