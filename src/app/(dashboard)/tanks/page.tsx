"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fish, Plus, Loader2, Pencil, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/use-user";
import { useTierLimits, TierCheckResult, getTierDisplayName } from "@/lib/hooks/use-tier-limits";

interface Tank {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  photo_url: string | null;
  created_at: string;
}

export default function TanksListPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading: userLoading } = useUser();
  const { canCreateTank } = useTierLimits();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tierCheck, setTierCheck] = useState<TierCheckResult | null>(null);

  useEffect(() => {
    async function loadTanks() {
      if (!user) return;

      try {
        const { data: userTanks, error } = await supabase
          .from("tanks")
          .select("id, name, type, volume_gallons, photo_url, created_at")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTanks(userTanks || []);

        // Check tier limits
        const limitCheck = await canCreateTank(user.id);
        setTierCheck(limitCheck);
      } catch (error) {
        console.error("Error loading tanks:", error);
        toast.error("Failed to load tanks");
      } finally {
        setIsLoading(false);
      }
    }

    if (!userLoading) {
      if (!user) {
        router.push("/login");
      } else {
        loadTanks();
      }
    }
  }, [user, userLoading, supabase, router, canCreateTank]);

  const handleRestoreTank = async (tankId: string, tankName: string) => {
    try {
      // Restore tank by clearing deleted_at
      const { data: restored, error } = await supabase
        .from("tanks")
        .update({ deleted_at: null })
        .eq("id", tankId)
        .select("id, name, type, volume_gallons, photo_url, created_at")
        .single();

      if (error) throw error;

      if (restored) {
        setTanks((prev) => [restored, ...prev]);
        toast.success(`"${tankName}" restored`);
      }
    } catch (error) {
      console.error("Error restoring tank:", error);
      toast.error("Failed to restore tank");
    }
  };

  const handleDeleteTank = async (tankId: string, tankName: string) => {
    // Remove from local state immediately for optimistic UI
    const deletedTank = tanks.find(t => t.id === tankId);
    setTanks(tanks.filter(t => t.id !== tankId));

    try {
      // Soft delete - set deleted_at timestamp
      const { error } = await supabase
        .from("tanks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", tankId);

      if (error) throw error;

      // Show toast with undo action (30 seconds)
      toast.success(`"${tankName}" deleted`, {
        action: {
          label: "Undo",
          onClick: () => handleRestoreTank(tankId, tankName),
        },
        duration: 30000, // 30 seconds
      });
    } catch (error) {
      console.error("Error deleting tank:", error);
      // Restore tank to state on error
      if (deletedTank) {
        setTanks((prev) => [...prev, deletedTank]);
      }
      toast.error("Failed to delete tank");
    }
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5 text-brand-navy" />
            </Link>
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Fish className="h-6 w-6 text-brand-cyan" />
            <span className="font-bold text-brand-navy">AquaBotAI</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">My Tanks</h1>
            <p className="text-gray-600">
              {tierCheck && (
                <>
                  {tierCheck.currentCount} of{" "}
                  {tierCheck.limit >= 999999 ? "unlimited" : tierCheck.limit} tank
                  {tierCheck.limit !== 1 ? "s" : ""}{" "}
                  <span className="text-xs">
                    ({getTierDisplayName(tierCheck.tier)} plan)
                  </span>
                </>
              )}
            </p>
          </div>
          {tierCheck?.allowed ? (
            <Button asChild className="bg-gradient-to-r from-brand-cyan to-brand-navy text-white hover:opacity-90">
              <Link href="/tanks/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Tank
              </Link>
            </Button>
          ) : tierCheck && (
            <Button asChild variant="outline" className="border-brand-warning text-brand-warning hover:bg-brand-warning/10">
              <Link href="/settings/billing">
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Link>
            </Button>
          )}
        </div>

        {tanks.length === 0 ? (
          /* Empty State */
          <Card className="border-dashed border-brand-cyan/30 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan/10">
                <Fish className="h-8 w-8 text-brand-cyan" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-brand-navy">No tanks yet</h2>
              <p className="mb-6 max-w-sm text-center text-gray-600">
                Create your first tank to start tracking water parameters and get
                AI-powered care recommendations.
              </p>
              <Button asChild className="bg-gradient-to-r from-brand-cyan to-brand-navy text-white hover:opacity-90">
                <Link href="/tanks/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Tank
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Tank Grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tanks.map((tank) => (
              <Card key={tank.id} className="group relative overflow-hidden shadow-sm transition-colors hover:border-brand-cyan/50">
                {/* Tank Photo or Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-brand-cyan/10 to-brand-navy/10">
                  {tank.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tank.photo_url}
                      alt={tank.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Fish className="h-16 w-16 text-brand-cyan/30" />
                    </div>
                  )}
                </div>

                {/* Action Buttons (visible on hover) */}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href={`/tanks/${tank.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteTank(tank.id, tank.name);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Link href={`/tanks/${tank.id}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      {tank.name}
                    </CardTitle>
                    <CardDescription>
                      {tank.type.charAt(0).toUpperCase() + tank.type.slice(1)} •{" "}
                      {tank.volume_gallons} gallons
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(tank.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}

            {/* Add Tank Card or Upgrade Prompt */}
            {tierCheck?.allowed ? (
              <Link href="/tanks/new">
                <Card className="flex h-full min-h-[280px] items-center justify-center border-dashed border-brand-cyan/30 transition-colors hover:border-brand-cyan/50 shadow-sm">
                  <CardContent className="flex flex-col items-center gap-2 text-gray-500">
                    <Plus className="h-8 w-8" />
                    <span>Add Tank</span>
                  </CardContent>
                </Card>
              </Link>
            ) : tierCheck && (
              <Card className="flex h-full min-h-[280px] items-center justify-center border-dashed border-brand-warning/50 shadow-sm">
                <CardContent className="flex flex-col items-center gap-2 text-center">
                  <Sparkles className="h-8 w-8 text-brand-warning" />
                  <span className="font-medium text-brand-navy">Tank Limit Reached</span>
                  <p className="text-sm text-gray-600">
                    Upgrade to add more tanks
                  </p>
                  <Button asChild size="sm" className="mt-2 bg-gradient-to-r from-brand-cyan to-brand-navy text-white hover:opacity-90">
                    <Link href="/settings/billing">Upgrade</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
