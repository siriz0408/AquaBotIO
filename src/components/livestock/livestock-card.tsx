"use client";

import { Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Livestock, Species } from "@/types/database";
import { format } from "date-fns";

interface LivestockCardProps {
  livestock: Livestock & { species?: Species };
  onRemove: (id: string) => void;
  className?: string;
}

const TYPE_EMOJIS = {
  freshwater: "🐟",
  saltwater: "🐠",
  invertebrate: "🦐",
  plant: "🌿",
};

export function LivestockCard({
  livestock,
  onRemove,
  className,
}: LivestockCardProps) {
  const speciesName =
    livestock.species?.common_name ||
    livestock.custom_name ||
    "Unknown Species";
  const speciesType = livestock.species?.type || "freshwater";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors hover:bg-muted/50",
        className
      )}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
        {livestock.species?.photo_url ? (
          <img
            src={livestock.species.photo_url}
            alt={speciesName}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          TYPE_EMOJIS[speciesType as keyof typeof TYPE_EMOJIS] || "🐟"
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{speciesName}</h4>
          {livestock.quantity > 1 && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
              ×{livestock.quantity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {livestock.nickname && (
            <span className="truncate">&ldquo;{livestock.nickname}&rdquo;</span>
          )}
          <span>Added {format(new Date(livestock.date_added), "MMM d, yyyy")}</span>
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => onRemove(livestock.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
