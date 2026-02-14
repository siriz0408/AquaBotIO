"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, FlaskConical, Fish, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTank } from "@/context/tank-context";
import { useReducedMotion, springBounce } from "@/lib/animations";

interface Tab {
  id: string;
  label: string;
  icon: typeof Home;
  href: string | ((tankId: string | null) => string);
}

const tabs: Tab[] = [
  { id: "home", label: "Home", icon: Home, href: "/dashboard" },
  {
    id: "parameters",
    label: "Parameters",
    icon: FlaskConical,
    href: (tankId) => tankId ? `/tanks/${tankId}/parameters` : "/dashboard"
  },
  { id: "species", label: "Species", icon: Fish, href: "/species" },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: Calendar,
    href: (tankId) => tankId ? `/tanks/${tankId}/maintenance` : "/dashboard"
  },
  { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
];

interface BottomTabBarProps {
  className?: string;
  hasUnreadChat?: boolean;
}

export function BottomTabBar({ className, hasUnreadChat = false }: BottomTabBarProps) {
  const pathname = usePathname();
  const { activeTank } = useTank();
  const prefersReducedMotion = useReducedMotion();

  const getHref = (tab: Tab): string => {
    if (typeof tab.href === "function") {
      return tab.href(activeTank?.id ?? null);
    }
    return tab.href;
  };

  const isActive = (tab: Tab) => {
    const href = getHref(tab);
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    // For tank-specific routes, also match if we're on any tank's version
    if (tab.id === "parameters") {
      return pathname.includes("/parameters");
    }
    if (tab.id === "maintenance") {
      return pathname.includes("/maintenance");
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 pb-safe md:hidden",
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-2" role="list">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const href = getHref(tab);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={href}
              role="listitem"
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative",
                "min-h-[44px] min-w-[44px]", // WCAG 2.5.5 touch target
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2",
                active
                  ? "text-brand-teal"
                  : "text-gray-500 hover:text-gray-700 active:scale-95"
              )}
            >
              {tab.id === "chat" && hasUnreadChat && (
                <span
                  className="absolute top-1 right-2 w-2 h-2 bg-brand-alert rounded-full"
                  aria-label="Unread messages"
                />
              )}
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs font-medium">{tab.label}</span>
              {active && (
                prefersReducedMotion ? (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-teal rounded-full"
                    aria-hidden="true"
                  />
                ) : (
                  <motion.div
                    layoutId="bottomTabIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-teal rounded-full"
                    aria-hidden="true"
                    transition={springBounce}
                  />
                )
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
