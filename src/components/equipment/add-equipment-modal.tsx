"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EQUIPMENT_TYPES, type EquipmentType } from "@/lib/equipment/utils";
import type { Equipment } from "./equipment-card";

interface AddEquipmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEquipment?: Equipment | null;
  onSubmit: (data: EquipmentFormData) => Promise<void>;
}

export interface EquipmentFormData {
  type: EquipmentType;
  custom_type?: string;
  brand?: string;
  model?: string;
  purchase_date: string;
  last_serviced_date?: string;
  settings?: string;
  notes?: string;
  purchase_price?: number;
  expected_lifespan_months?: number;
  location?: string;
}

const initialFormData: EquipmentFormData = {
  type: "filter",
  purchase_date: new Date().toISOString().split("T")[0],
};

export function AddEquipmentModal({
  open,
  onOpenChange,
  editingEquipment,
  onSubmit,
}: AddEquipmentModalProps) {
  const [formData, setFormData] = useState<EquipmentFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editingEquipment;

  // Reset form when modal opens/closes or editing equipment changes
  useEffect(() => {
    if (open && editingEquipment) {
      setFormData({
        type: editingEquipment.type as EquipmentType,
        custom_type: editingEquipment.custom_type || undefined,
        brand: editingEquipment.brand || undefined,
        model: editingEquipment.model || undefined,
        purchase_date: editingEquipment.purchase_date,
        last_serviced_date: editingEquipment.last_serviced_date || undefined,
        settings: editingEquipment.settings || undefined,
        notes: editingEquipment.notes || undefined,
        purchase_price: editingEquipment.purchase_price || undefined,
        expected_lifespan_months: editingEquipment.expected_lifespan_months || undefined,
        location: editingEquipment.location || undefined,
      });
    } else if (open) {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [open, editingEquipment]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = "Equipment type is required";
    }

    if (formData.type === "other" && !formData.custom_type?.trim()) {
      newErrors.custom_type = "Please specify the equipment type";
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = "Purchase date is required";
    } else {
      const purchaseDate = new Date(formData.purchase_date);
      if (purchaseDate > new Date()) {
        newErrors.purchase_date = "Purchase date cannot be in the future";
      }
    }

    if (formData.purchase_price !== undefined && formData.purchase_price < 0) {
      newErrors.purchase_price = "Price cannot be negative";
    }

    if (formData.expected_lifespan_months !== undefined) {
      if (formData.expected_lifespan_months < 1 || formData.expected_lifespan_months > 240) {
        newErrors.expected_lifespan_months = "Lifespan must be between 1 and 240 months";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof EquipmentFormData, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the equipment details below."
              : "Add a new piece of equipment to track its maintenance and lifespan."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Equipment Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Equipment Type *</Label>
            <Select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange("type", e.target.value as EquipmentType)}
              className={errors.type ? "border-red-500" : ""}
            >
              {EQUIPMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </Select>
            {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
          </div>

          {/* Custom Type (shown when type is "other") */}
          {formData.type === "other" && (
            <div className="space-y-2">
              <Label htmlFor="custom_type">Custom Type Name *</Label>
              <Input
                id="custom_type"
                value={formData.custom_type || ""}
                onChange={(e) => handleChange("custom_type", e.target.value)}
                placeholder="e.g., CO2 Reactor"
                className={errors.custom_type ? "border-red-500" : ""}
              />
              {errors.custom_type && <p className="text-sm text-red-500">{errors.custom_type}</p>}
            </div>
          )}

          {/* Brand and Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand || ""}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="e.g., Fluval"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model || ""}
                onChange={(e) => handleChange("model", e.target.value)}
                placeholder="e.g., 307"
              />
            </div>
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label htmlFor="purchase_date">Purchase Date *</Label>
            <Input
              id="purchase_date"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => handleChange("purchase_date", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={errors.purchase_date ? "border-red-500" : ""}
            />
            {errors.purchase_date && <p className="text-sm text-red-500">{errors.purchase_date}</p>}
          </div>

          {/* Last Serviced Date (only for editing) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="last_serviced_date">Last Serviced Date</Label>
              <Input
                id="last_serviced_date"
                type="date"
                value={formData.last_serviced_date || ""}
                onChange={(e) => handleChange("last_serviced_date", e.target.value || undefined)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          )}

          {/* Purchase Price and Custom Lifespan */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price ($)</Label>
              <Input
                id="purchase_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchase_price ?? ""}
                onChange={(e) => handleChange("purchase_price", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
                className={errors.purchase_price ? "border-red-500" : ""}
              />
              {errors.purchase_price && <p className="text-sm text-red-500">{errors.purchase_price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_lifespan_months">Custom Lifespan (months)</Label>
              <Input
                id="expected_lifespan_months"
                type="number"
                min="1"
                max="240"
                value={formData.expected_lifespan_months ?? ""}
                onChange={(e) => handleChange("expected_lifespan_months", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Use default"
                className={errors.expected_lifespan_months ? "border-red-500" : ""}
              />
              {errors.expected_lifespan_months && <p className="text-sm text-red-500">{errors.expected_lifespan_months}</p>}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ""}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="e.g., Filter chamber 1, Sump"
            />
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <Label htmlFor="settings">Settings / Specs</Label>
            <Input
              id="settings"
              value={formData.settings || ""}
              onChange={(e) => handleChange("settings", e.target.value)}
              placeholder="e.g., Flow rate: 1000 LPH, Temp: 78°F"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Equipment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
