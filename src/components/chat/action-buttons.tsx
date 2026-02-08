"use client";

import { useRouter } from "next/navigation";
import { useTank } from "@/context/tank-context";
import {
  FlaskConical,
  Fish,
  Calendar,
  BarChart3,
  ListChecks,
  Search,
} from "lucide-react";

interface ActionButton {
  label: string;
  action: string;
}

interface ActionButtonsProps {
  actions: ActionButton[];
  className?: string;
}

const ACTION_CONFIG: Record<
  string,
  { icon: React.ElementType; getUrl: (tankId: string) => string }
> = {
  log_parameters: {
    icon: FlaskConical,
    getUrl: (tankId) => `/tanks/${tankId}/log`,
  },
  browse_species: {
    icon: Search,
    getUrl: () => `/species`,
  },
  add_livestock: {
    icon: Fish,
    getUrl: (tankId) => `/tanks/${tankId}/livestock`,
  },
  schedule_maintenance: {
    icon: Calendar,
    getUrl: (tankId) => `/tanks/${tankId}/maintenance`,
  },
  view_parameters: {
    icon: BarChart3,
    getUrl: (tankId) => `/tanks/${tankId}/parameters`,
  },
  view_maintenance: {
    icon: ListChecks,
    getUrl: (tankId) => `/tanks/${tankId}/maintenance`,
  },
};

export function ActionButtons({ actions, className }: ActionButtonsProps) {
  const router = useRouter();
  const { activeTank } = useTank();
  const tankId = activeTank?.id || "";

  if (!actions.length) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mt-3">
        {actions.map((action, index) => {
          const config = ACTION_CONFIG[action.action];
          if (!config) return null;

          const Icon = config.icon;
          const url = config.getUrl(tankId);

          return (
            <button
              key={index}
              onClick={() => router.push(url)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal rounded-xl text-xs font-medium transition-all active:scale-95 border border-brand-teal/20"
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
