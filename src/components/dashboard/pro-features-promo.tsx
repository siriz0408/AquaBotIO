"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Crown, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { resolveUserTier } from "@/lib/hooks/use-tier-limits";
import { useReducedMotion, cardTap, springTap } from "@/lib/animations";

interface ProFeaturesPromoProps {
  tankCount?: number;
}

export function ProFeaturesPromo({ tankCount = 1 }: ProFeaturesPromoProps) {
  const supabase = createClient();
  const prefersReducedMotion = useReducedMotion();
  const [tier, setTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTier() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userTier = await resolveUserTier(supabase, user.id);
          setTier(userTier);
        }
      } catch (error) {
        console.error("Error loading tier:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTier();
  }, [supabase]);

  if (isLoading) {
    return null; // Don't show loading state, just hide the component
  }

  const isPro = tier === "pro";

  // For Pro users with multiple tanks, show the Compare CTA
  if (isPro && tankCount >= 2) {
    return (
      <motion.div
        whileTap={!prefersReducedMotion ? cardTap : undefined}
        transition={springTap}
      >
        <Link href="/compare">
          <Card className="bg-gradient-to-br from-brand-cyan/10 to-brand-navy/10 border-brand-cyan/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-cyan/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-brand-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-brand-navy">Compare Your Tanks</h3>
                  <p className="text-sm text-muted-foreground">
                    View health scores and compare parameters across all {tankCount} tanks
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-brand-cyan flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  }

  // For non-Pro users (or Pro users with only 1 tank), show upgrade promo
  if (!isPro && tankCount >= 2) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-brand-navy">Compare Multiple Tanks</h3>
              <p className="text-sm text-muted-foreground">
                Pro users can compare parameters across tanks and see AI insights
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/billing">
                Upgrade
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Single tank users - don't show anything
  return null;
}
