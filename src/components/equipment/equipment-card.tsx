"use client";

import { useState } from "react";
import { MoreHorizontal, Wrench, Trash2, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getEquipmentTypeInfo,
  getStatusConfig,
  formatAge,
  formatTimeRemaining,
  DELETION_REASONS,
  type EquipmentStatus,
  type DeletionReason,
} from "@/lib/equipment/utils";

export interface Equipment {
  id: string;
  tank_id: string;
  type: string;
  custom_type?: string | null;
  brand?: string | null;
  model?: string | null;
  purchase_date: string;
  last_serviced_date?: string | null;
  settings?: string | null;
  notes?: string | null;
  purchase_price?: number | null;
  expected_lifespan_months?: number | null;
  photo_url?: string | null;
  location?: string | null;
  created_at: string;
  updated_at: string;
  // Calculated fields from RPC
  age_months?: number;
  lifespan_months?: number;
  months_remaining?: number;
  status?: EquipmentStatus;
}

interface EquipmentCardProps {
  equipment: Equipment;
  onMarkServiced: (id: string) => Promise<void>;
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string, reason: DeletionReason) => Promise<void>;
}

export function EquipmentCard({
  equipment,
  onMarkServiced,
  onEdit,
  onDelete,
}: EquipmentCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState<DeletionReason>("removed");

  const typeInfo = getEquipmentTypeInfo(equipment.type);
  const status = equipment.status || "good";
  const statusConfig = getStatusConfig(status);

  const displayName = equipment.type === "other" && equipment.custom_type
    ? equipment.custom_type
    : typeInfo.label;

  const handleMarkServiced = async () => {
    setIsLoading(true);
    try {
      await onMarkServiced(equipment.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(equipment.id, deleteReason);
      setShowDeleteDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className={`relative border ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Icon and main info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="text-2xl flex-shrink-0">{typeInfo.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-brand-navy truncate">
                    {equipment.brand && equipment.model
                      ? `${equipment.brand} ${equipment.model}`
                      : equipment.brand || equipment.model || displayName}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`${statusConfig.color} ${statusConfig.bgColor} ${statusConfig.borderColor}`}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {displayName}
                  {equipment.location && ` • ${equipment.location}`}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-muted-foreground">
                    Age: <span className="text-foreground">{formatAge(equipment.age_months || 0)}</span>
                  </span>
                  <span className={status === "overdue" ? "text-red-600 font-medium" : "text-muted-foreground"}>
                    {formatTimeRemaining(equipment.months_remaining || 0)}
                  </span>
                </div>
                {equipment.settings && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {equipment.settings}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleMarkServiced} disabled={isLoading}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Mark as Serviced
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(equipment)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Equipment</DialogTitle>
            <DialogDescription>
              Why are you removing this equipment? This helps track your equipment history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-reason">Reason</Label>
            <Select
              id="delete-reason"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value as DeletionReason)}
              className="mt-2"
            >
              {DELETION_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              variant="destructive"
            >
              Remove Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
