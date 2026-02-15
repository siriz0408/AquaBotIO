"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
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
  FreeToolsPromo,
  MyTanks,
  ProFeaturesPromo,
} from "@/components/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIOnboardingWizard } from "@/components/onboarding";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";

interface Tank {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  photo_url: string | null;
  created_at: string;
}

interface TankHealthData {
  [tankId: string]: {
    overall: number;
    status: string;
  };
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
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [tankHealthData, setTankHealthData] = useState<TankHealthData>({});

  const {
    hasCompletedAIOnboarding,
    isLoading: isOnboardingStatusLoading,
    refresh: refreshOnboardingStatus,
  } = useOnboardingStatus();

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

          // Fetch health scores for all tanks
          try {
            const healthResponse = await fetch("/api/tanks/health");
            const healthResult = await healthResponse.json();
            if (healthResult.success && healthResult.data?.tanks) {
              const healthMap: TankHealthData = {};
              for (const tankHealth of healthResult.data.tanks) {
                healthMap[tankHealth.id] = {
                  overall: tankHealth.healthScore.overall,
                  status: tankHealth.healthScore.status,
                };
              }
              setTankHealthData(healthMap);
            }
          } catch (healthError) {
            console.error("Error fetching health scores:", healthError);
            // Non-fatal, continue with default scores
          }
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
          <h1 className="fluid-h2 font-bold text-brand-navy mb-2">
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
          healthScore={tankHealthData[selectedTank.id]?.overall ?? 75}
        />
      )}

      {/* AI Onboarding Wizard Modal */}
      <AIOnboardingWizard
        open={showOnboardingWizard}
        onOpenChange={setShowOnboardingWizard}
        onComplete={() => {
          refreshOnboardingStatus();
        }}
      />

      {/* Main Content */}
      <div className="flex-1 container max-w-6xl py-6 space-y-6">
        {/* Complete Your Profile Card - shows when AI onboarding not completed */}
        {!isOnboardingStatusLoading && !hasCompletedAIOnboarding && (
          <Card className="border-dashed border-2 border-brand-cyan/50 bg-gradient-to-br from-brand-cyan/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-cyan" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Help your AI coach understand you better
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Answer a few questions so I can give you personalized advice for your aquarium journey.
              </p>
              <Button
                onClick={() => setShowOnboardingWizard(true)}
                className="bg-brand-cyan hover:bg-brand-cyan/90"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Get Started (2-3 min)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* My Tanks Section */}
        <MyTanks
          tanks={tanks}
          selectedTankId={selectedTankId}
          onSelectTank={setSelectedTankId}
        />

        {/* Pro Features Promo (Compare tanks, etc.) */}
        <ProFeaturesPromo tankCount={tanks.length} />

        {/* Parameter Cards - Horizontal Scroll */}
        <ParameterCards />

        {/* Quick Actions */}
        <QuickActions tankId={selectedTank?.id} />

        {/* Free Tools Promo */}
        <FreeToolsPromo />

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
