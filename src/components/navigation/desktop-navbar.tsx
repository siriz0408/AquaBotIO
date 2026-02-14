"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fish, Home, FlaskConical, Calendar, MessageSquare, Settings, Bell, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTank } from "@/context/tank-context";

interface NavLink {
  id: string;
  label: string;
  icon: typeof Home;
  href: string | ((tankId: string | null) => string);
}

const navLinks: NavLink[] = [
  { id: "home", label: "Dashboard", icon: Home, href: "/dashboard" },
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
  { id: "chat", label: "AI Chat", icon: MessageSquare, href: "/chat" },
];

interface DesktopNavbarProps {
  className?: string;
  hasNotifications?: boolean;
}

export function DesktopNavbar({ className, hasNotifications = false }: DesktopNavbarProps) {
  const pathname = usePathname();
  const { activeTank } = useTank();

  const getHref = (link: NavLink): string => {
    if (typeof link.href === "function") {
      return link.href(activeTank?.id ?? null);
    }
    return link.href;
  };

  const isActive = (link: NavLink) => {
    const href = getHref(link);
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    // For tank-specific routes, also match if we're on any tank's version
    if (link.id === "parameters") {
      return pathname.includes("/parameters");
    }
    if (link.id === "maintenance") {
      return pathname.includes("/maintenance");
    }
    return pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        "hidden md:block sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Fish className="h-7 w-7 text-brand-cyan" />
          <span className="text-xl font-bold text-brand-navy">AquaBotAI</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link);
            const Icon = link.icon;
            const href = getHref(link);

            return (
              <Link
                key={link.id}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-cyan/10 text-brand-cyan"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions - min 44px touch targets */}
        <div className="flex items-center gap-1">
          <Link
            href="/coaching"
            className="p-3 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Coaching Tips"
          >
            <Lightbulb className="h-5 w-5 text-gray-600" />
          </Link>
          <Link
            href="/notifications"
            className="relative p-3 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {hasNotifications && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-alert rounded-full" />
            )}
          </Link>
          <Link
            href="/settings"
            className="p-3 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </Link>
        </div>
      </div>
    </header>
  );
}
