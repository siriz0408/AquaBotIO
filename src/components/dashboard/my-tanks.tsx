"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Fish, Droplets, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion, cardHover, cardTap, springBounce } from "@/lib/animations";

interface Tank {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  photo_url: string | null;
  created_at: string;
}

interface MyTanksProps {
  tanks: Tank[];
  selectedTankId: string | null;
  onSelectTank: (tankId: string) => void;
}

const typeIcons: Record<string, string> = {
  freshwater: "🐠",
  saltwater: "🐡",
  reef: "🪸",
  brackish: "🦐",
  planted: "🌿",
  pond: "🏞️",
};

function getTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
}

function TankCard({
  tank,
  isSelected,
  onSelect,
}: {
  tank: Tank;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        "group relative w-full text-left rounded-2xl border-2 bg-white shadow-sm transition-colors overflow-hidden",
        isSelected
          ? "border-brand-cyan shadow-brand-cyan/10"
          : "border-transparent hover:border-brand-cyan/30"
      )}
      whileHover={!prefersReducedMotion ? cardHover : undefined}
      whileTap={!prefersReducedMotion ? cardTap : undefined}
      transition={springBounce}
    >
      {/* Tank Image or Gradient */}
      <div className="relative h-28 w-full bg-gradient-to-br from-brand-navy/80 to-brand-teal/60 overflow-hidden">
        {tank.photo_url ? (
          <Image
            src={tank.photo_url}
            alt={tank.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-4xl opacity-60">
              {typeIcons[tank.type] || "🐠"}
            </span>
          </div>
        )}
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-brand-cyan text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Active
          </div>
        )}
      </div>

      {/* Tank Info */}
      <div className="p-3">
        <h3 className="font-semibold text-brand-navy text-sm truncate">
          {tank.name}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Fish className="h-3 w-3" />
            {getTypeLabel(tank.type)}
          </span>
          <span className="flex items-center gap-1">
            <Droplets className="h-3 w-3" />
            {tank.volume_gallons}gal
          </span>
        </div>
        {/* View Details */}
        <div
          role="link"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/tanks/${tank.id}`);
          }}
          className="flex items-center gap-1 mt-2 text-xs text-brand-cyan font-medium hover:text-brand-teal transition-colors cursor-pointer"
        >
          View Details
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </motion.button>
  );
}

export function MyTanks({ tanks, selectedTankId, onSelectTank }: MyTanksProps) {
  const router = useRouter();

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-brand-navy">My Tanks</h2>
        <button
          onClick={() => router.push("/tanks/new")}
          className="flex items-center gap-1 text-sm font-medium text-brand-cyan hover:text-brand-teal transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Tank
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {tanks.map((tank) => (
          <TankCard
            key={tank.id}
            tank={tank}
            isSelected={tank.id === selectedTankId}
            onSelect={() => onSelectTank(tank.id)}
          />
        ))}

        {/* Add Tank Card */}
        <button
          onClick={() => router.push("/tanks/new")}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:border-brand-cyan/40 hover:bg-brand-cyan/5 transition-all duration-200 min-h-[180px]"
        >
          <div className="w-10 h-10 rounded-full bg-brand-cyan/10 flex items-center justify-center mb-2">
            <Plus className="h-5 w-5 text-brand-cyan" />
          </div>
          <span className="text-sm font-medium text-gray-500">Add Tank</span>
        </button>
      </div>
    </section>
  );
}
