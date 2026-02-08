"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FlaskConical, Fish, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon: typeof Home;
  href: string;
}

const tabs: Tab[] = [
  { id: "home", label: "Home", icon: Home, href: "/dashboard" },
  { id: "parameters", label: "Parameters", icon: FlaskConical, href: "/parameters" },
  { id: "species", label: "Species", icon: Fish, href: "/species" },
  { id: "maintenance", label: "Maintenance", icon: Calendar, href: "/maintenance" },
  { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
];

interface BottomTabBarProps {
  className?: string;
  hasUnreadChat?: boolean;
}

export function BottomTabBar({ className, hasUnreadChat = false }: BottomTabBarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 pb-safe md:hidden",
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative",
                active
                  ? "text-brand-teal"
                  : "text-gray-500 hover:text-gray-700 active:scale-95"
              )}
            >
              {tab.id === "chat" && hasUnreadChat && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-brand-alert rounded-full" />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-teal rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
