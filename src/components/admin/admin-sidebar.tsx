"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Flag,
  FileText,
  Menu,
  X,
  Fish,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/lib/types/admin";

interface AdminSidebarProps {
  adminRole: AdminRole;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: AdminRole[];
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["super_admin", "content_admin", "support_admin"],
  },
  {
    id: "users",
    label: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["super_admin", "support_admin"],
  },
  {
    id: "feature-flags",
    label: "Feature Flags",
    href: "/admin/feature-flags",
    icon: Flag,
    roles: ["super_admin"],
  },
  {
    id: "audit-log",
    label: "Audit Log",
    href: "/admin/audit-log",
    icon: FileText,
    roles: ["super_admin"],
  },
];

export function AdminSidebar({ adminRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter nav items based on role
  const visibleNavItems = navItems.filter((item) => item.roles.includes(adminRole));

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      {/* Logo section */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-slate-800">
        <Fish className={cn("text-brand-cyan", isCollapsed ? "h-8 w-8" : "h-7 w-7")} />
        {!isCollapsed && (
          <div>
            <span className="text-lg font-bold text-white">AquaBotAI</span>
            <span className="block text-xs text-slate-400">Admin Portal</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                "min-h-[44px]", // Touch target
                active
                  ? "bg-brand-cyan/10 text-brand-cyan"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button - desktop only */}
      <div className="hidden lg:block px-3 py-4 border-t border-slate-800">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium",
            "text-slate-400 hover:bg-slate-800 hover:text-white transition-colors",
            "min-h-[44px]",
            isCollapsed && "justify-center px-2"
          )}
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Back to app link */}
      <div className="px-3 py-4 border-t border-slate-800">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium",
            "text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors",
            "min-h-[44px]",
            isCollapsed && "justify-center px-2"
          )}
        >
          <ChevronLeft className="h-5 w-5" />
          {!isCollapsed && <span>Back to App</span>}
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-200",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col bg-slate-900 border-r border-slate-800 transition-all duration-200",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
