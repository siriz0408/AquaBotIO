"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fish,
  ChevronDown,
  Check,
  Plus,
  Settings,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTank } from "@/context/tank-context";
import { cn } from "@/lib/utils";

interface TankSwitcherProps {
  showManageLink?: boolean;
  className?: string;
}

export function TankSwitcher({
  showManageLink = true,
  className,
}: TankSwitcherProps) {
  const router = useRouter();
  const { tanks, activeTank, switchTank, isLoading } = useTank();
  const [open, setOpen] = useState(false);

  const handleTankSelect = (tankId: string) => {
    switchTank(tankId);
    setOpen(false);
    router.push(`/tanks/${tankId}`);
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (tanks.length === 0) {
    return (
      <Button variant="outline" size="sm" asChild className={className}>
        <Link href="/tanks/new">
          <Plus className="mr-2 h-4 w-4" />
          Add Tank
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("justify-between gap-2", className)}
        >
          <div className="flex items-center gap-2">
            {activeTank?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeTank.photo_url}
                alt={activeTank.name}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <Fish className="h-4 w-4 text-brand-cyan" />
            )}
            <span className="max-w-[120px] truncate">
              {activeTank?.name || "Select Tank"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Your Tanks</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {tanks.map((tank) => (
          <DropdownMenuItem
            key={tank.id}
            onClick={() => handleTankSelect(tank.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {tank.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tank.photo_url}
                  alt={tank.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-cyan/10">
                  <Fish className="h-3 w-3 text-brand-cyan" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium">{tank.name}</span>
                <span className="text-xs text-muted-foreground">
                  {tank.type} • {tank.volume_gallons}gal
                </span>
              </div>
            </div>
            {activeTank?.id === tank.id && (
              <Check className="h-4 w-4 text-brand-cyan" />
            )}
          </DropdownMenuItem>
        ))}

        {showManageLink && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/tanks/new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Tank
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/tanks" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manage Tanks
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
