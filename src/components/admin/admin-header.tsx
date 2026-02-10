"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { AdminRole } from "@/lib/types/admin";

interface AdminHeaderProps {
  adminUser: {
    id: string;
    email: string;
    display_name: string | null;
    role: AdminRole;
  };
}

// Map routes to breadcrumb labels
const routeLabels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Users",
  "/admin/feature-flags": "Feature Flags",
  "/admin/audit-log": "Audit Log",
};

// Role display names
const roleNames: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  content_admin: "Content Admin",
  support_admin: "Support Admin",
};

export function AdminHeader({ adminUser }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [];

    let currentPath = "";
    for (const segment of segments) {
      currentPath += `/${segment}`;

      // Check if this is a dynamic segment (e.g., user ID)
      if (segment.match(/^[0-9a-f-]{36}$/i)) {
        // UUID pattern - this is likely a user ID
        breadcrumbs.push({
          label: "User Details",
          href: currentPath,
        });
      } else {
        const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbs.push({
          label,
          href: currentPath,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-1 text-sm ml-12 lg:ml-0">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-slate-600" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-white font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Admin user dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 h-auto py-2 px-3 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-cyan/20 text-brand-cyan">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium">
                  {adminUser.display_name || adminUser.email.split("@")[0]}
                </div>
                <div className="text-xs text-slate-500">
                  {roleNames[adminUser.role]}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-slate-900 border-slate-700 text-slate-100"
          >
            <DropdownMenuLabel className="text-slate-400">
              <div className="font-normal">
                <div className="text-sm text-white">{adminUser.email}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {roleNames[adminUser.role]}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={handleLogout}
              className={cn(
                "cursor-pointer text-slate-300",
                "hover:bg-slate-800 hover:text-white",
                "focus:bg-slate-800 focus:text-white"
              )}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
