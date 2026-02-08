"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LivestockItem {
  id: string;
  name: string;
  quantity: number;
  emoji: string;
}

interface LivestockSummaryProps {
  livestock?: LivestockItem[];
  tankId?: string;
  className?: string;
}

const defaultLivestock: LivestockItem[] = [
  { id: "1", name: "Clownfish", quantity: 2, emoji: "🐠" },
  { id: "2", name: "Blue Tang", quantity: 1, emoji: "🐟" },
  { id: "3", name: "Yellow Tang", quantity: 1, emoji: "🐠" },
  { id: "4", name: "Cleaner Shrimp", quantity: 3, emoji: "🦐" },
  { id: "5", name: "Hermit Crab", quantity: 5, emoji: "🦀" },
];

export function LivestockSummary({
  livestock = defaultLivestock,
  tankId,
  className,
}: LivestockSummaryProps) {
  return (
    <div className={cn("px-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-brand-navy">Livestock</h2>
        <Link
          href={tankId ? `/tanks/${tankId}/livestock` : "/livestock"}
          className="text-sm text-brand-teal font-medium hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {livestock.slice(0, 5).map((species) => (
          <div
            key={species.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-brand-teal/20 to-brand-navy/20 rounded-xl flex items-center justify-center mb-2 text-2xl">
              {species.emoji}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight mb-1 line-clamp-2">
              {species.name}
            </span>
            <span className="text-xs text-gray-500">×{species.quantity}</span>
          </div>
        ))}
        <Link
          href={tankId ? `/tanks/${tankId}/livestock` : "/dashboard"}
          className="bg-brand-teal/10 border-2 border-dashed border-brand-teal rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-brand-teal/20 transition-colors"
        >
          <Plus className="w-8 h-8 text-brand-teal mb-2" />
          <span className="text-xs font-medium text-brand-teal">Add More</span>
        </Link>
      </div>
    </div>
  );
}
