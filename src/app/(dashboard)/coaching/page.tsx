"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fish,
  ArrowLeft,
  Loader2,
  Lightbulb,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachingHistoryCard } from "@/components/coaching";
import { useCoachingHistory } from "@/hooks/use-coaching-history";
import { useUser } from "@/lib/hooks/use-user";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";

export default function CoachingHistoryPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { hasCompletedAIOnboarding, isLoading: onboardingLoading } =
    useOnboardingStatus();
  const { data: coachingHistory, isLoading, error, hasMore, loadMore, refresh } =
    useCoachingHistory(10);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [userLoading, user, router]);

  // Loading state
  if (userLoading || onboardingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5 text-brand-navy" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Fish className="h-6 w-6 text-brand-cyan" />
            <span className="font-bold text-brand-navy">AquaBotAI</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 max-w-2xl">
        {/* Page Title */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-brand-teal" />
                Your Coaching History
              </h1>
              <p className="text-gray-600 mt-1">
                Daily tips and insights from your AI aquarium coach
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              disabled={isLoading}
              className="text-gray-500 hover:text-brand-teal"
            >
              <RefreshCw
                className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 mb-6">
            <p className="text-sm text-red-700">
              Failed to load coaching history. Please try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && coachingHistory.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-gray-200"
              >
                <div className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State - No Onboarding */}
        {!isLoading &&
          coachingHistory.length === 0 &&
          !hasCompletedAIOnboarding && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-cyan/20 to-brand-navy/20 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-brand-cyan" />
              </div>
              <h2 className="text-xl font-semibold text-brand-navy mb-2">
                No coaching tips yet
              </h2>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Complete onboarding to start receiving personalized daily tips
                from your AI aquarium coach!
              </p>
              <Button asChild className="bg-brand-cyan hover:bg-brand-cyan/90">
                <Link href="/settings">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Complete AI Setup
                </Link>
              </Button>
            </div>
          )}

        {/* Empty State - Onboarding Complete but No Tips */}
        {!isLoading &&
          coachingHistory.length === 0 &&
          hasCompletedAIOnboarding && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-teal/20 to-brand-cyan/20 flex items-center justify-center">
                <Lightbulb className="h-10 w-10 text-brand-teal" />
              </div>
              <h2 className="text-xl font-semibold text-brand-navy mb-2">
                No coaching tips yet
              </h2>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Your AI coach will send you personalized tips soon. Check back
                tomorrow for your first daily insight!
              </p>
              <Button variant="outline" asChild>
                <Link href="/chat">Start a Conversation</Link>
              </Button>
            </div>
          )}

        {/* Coaching History List */}
        {coachingHistory.length > 0 && (
          <div className="space-y-4">
            {coachingHistory.map((item) => (
              <CoachingHistoryCard
                key={item.id}
                message={item.message}
                createdAt={item.created_at}
                tankName={item.tank_name}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="min-w-[140px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}

            {/* End of list indicator */}
            {!hasMore && coachingHistory.length > 5 && (
              <p className="text-center text-sm text-gray-500 pt-4">
                You&apos;ve reached the end of your coaching history
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
