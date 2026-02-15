"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Fish, ArrowLeft, Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { EquipmentList } from "@/components/equipment";
import { resolveUserTier, type SubscriptionTier } from "@/lib/hooks/use-tier-limits";

interface Tank {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
}

export default function TankEquipmentPage() {
  const router = useRouter();
  const params = useParams();
  const tankId = params.id as string;
  const supabase = createClient();

  const [tank, setTank] = useState<Tank | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Get user tier
        const userTier = await resolveUserTier(supabase, user.id);
        setTier(userTier);

        // Get tank details
        const { data: tankData, error: tankError } = await supabase
          .from("tanks")
          .select("id, name, type, volume_gallons")
          .eq("id", tankId)
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .single();

        if (tankError || !tankData) {
          toast.error("Tank not found");
          router.push("/dashboard");
          return;
        }

        setTank(tankData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [supabase, tankId, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  if (!tank) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/tanks/${tankId}`}>
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
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href={`/tanks/${tankId}`} className="hover:text-brand-cyan">
              {tank.name}
            </Link>
            <span>/</span>
            <span>Equipment</span>
          </div>
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-brand-cyan" />
            <div>
              <h1 className="text-3xl font-bold text-brand-navy">Equipment</h1>
              <p className="text-gray-600">
                Track and manage your tank equipment
              </p>
            </div>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-b-none border-b-2 border-transparent"
            >
              <Link href={`/tanks/${tankId}`}>Overview</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-b-none border-b-2 border-transparent"
            >
              <Link href={`/tanks/${tankId}/parameters`}>Parameters</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-b-none border-b-2 border-transparent"
            >
              <Link href={`/tanks/${tankId}/livestock`}>Livestock</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-b-none border-b-2 border-transparent"
            >
              <Link href={`/tanks/${tankId}/maintenance`}>Maintenance</Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="rounded-b-none border-b-2 border-brand-cyan bg-brand-cyan/10 text-brand-navy"
            >
              <Link href={`/tanks/${tankId}/equipment`}>Equipment</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-b-none border-b-2 border-transparent"
            >
              <Link href={`/tanks/${tankId}/chat`}>Chat</Link>
            </Button>
          </nav>
        </div>

        {/* Equipment List */}
        <EquipmentList tankId={tankId} tier={tier} />
      </main>
    </div>
  );
}
