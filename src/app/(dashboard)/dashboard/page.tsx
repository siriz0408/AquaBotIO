"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { TopBar } from "@/components/navigation/top-bar";
import { FloatingChatButton } from "@/components/navigation/floating-chat-button";
import {
  TankHeader,
  ParameterCards,
  QuickActions,
  AIInsights,
  UpcomingMaintenance,
  LivestockSummary,
} from "@/components/dashboard";

interface Tank {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  photo_url: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  onboarding_completed: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [_user, setUser] = useState<UserProfile | null>(null);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [selectedTankId, setSelectedTankId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedTank = tanks.find((t) => t.id === selectedTankId) || tanks[0];

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push("/login");
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from("users")
          .select("id, email, full_name, onboarding_completed")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          if (!profile.onboarding_completed) {
            router.push("/onboarding");
            return;
          }
          setUser(profile);
        }

        // Get user's tanks
        const { data: userTanks } = await supabase
          .from("tanks")
          .select("id, name, type, volume_gallons, photo_url, created_at")
          .eq("user_id", authUser.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (userTanks && userTanks.length > 0) {
          setTanks(userTanks);
          setSelectedTankId(userTanks[0].id);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [supabase, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  // Empty state - no tanks
  if (tanks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar tankName="No Tanks" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-cyan to-brand-navy rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl">🐠</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-navy mb-2">
            Welcome to AquaBotAI
          </h1>
          <p className="text-gray-600 mb-6 max-w-sm">
            Create your first tank profile to start tracking water parameters and get AI-powered care recommendations.
          </p>
          <button
            onClick={() => router.push("/tanks/new")}
            className="bg-gradient-to-br from-brand-cyan to-brand-navy text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            Create Your First Tank
          </button>
        </div>
        <FloatingChatButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <TopBar
        tankName={selectedTank?.name || "Select Tank"}
        hasNotifications={true}
      />

      {/* Tank Header with Health Score */}
      {selectedTank && (
        <TankHeader
          tankId={selectedTank.id}
          name={selectedTank.name}
          type={selectedTank.type}
          volumeGallons={selectedTank.volume_gallons}
          photoUrl={selectedTank.photo_url}
          healthScore={85} // TODO: Calculate from actual parameters
        />
      )}

      {/* Main Content */}
      <div className="flex-1 py-6 space-y-6">
        {/* Parameter Cards - Horizontal Scroll */}
        <ParameterCards />

        {/* Quick Actions */}
        <QuickActions tankId={selectedTank?.id} />

        {/* AI Insights */}
        <AIInsights />

        {/* Upcoming Maintenance */}
        <UpcomingMaintenance tankId={selectedTank?.id} />

        {/* Livestock Summary */}
        <LivestockSummary tankId={selectedTank?.id} />
      </div>

      {/* Floating Chat Button */}
      <FloatingChatButton hasUnread={false} />
    </div>
  );
}
