"use client";

import Link from "next/link";
import { Calculator, ChevronRight, Droplets, Fish, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

interface FreeToolsPromoProps {
  className?: string;
}

export function FreeToolsPromo({ className }: FreeToolsPromoProps) {
  return (
    <div className={cn("px-4", className)}>
      <Link
        href="/tools"
        className="block bg-gradient-to-r from-brand-teal/10 to-brand-cyan/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:from-brand-teal/15 hover:to-brand-cyan/15 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm"
            >
              <Calculator className="w-6 h-6" style={{ color: "#1B998B" }} />
            </div>
            <div>
              <h3 className="font-semibold text-brand-navy text-sm">
                Free Aquarium Tools
              </h3>
              <p className="text-xs text-gray-600">
                Calculators & guides for all users
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>

        {/* Mini tool icons */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200/50">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Droplets className="w-3.5 h-3.5" style={{ color: "#1B998B" }} />
            <span>Water Change</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Fish className="w-3.5 h-3.5" style={{ color: "#0A2540" }} />
            <span>Stocking</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <FlaskConical className="w-3.5 h-3.5" style={{ color: "#1B998B" }} />
            <span>Parameters</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
