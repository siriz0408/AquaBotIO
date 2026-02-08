"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Fish, ArrowLeft, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParameterDashboard } from "@/components/parameters";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Tank {
  id: string;
  name: string;
  type: string;
}

export default function ParametersPage() {
  const router = useRouter();
  const params = useParams();
  const tankId = params.id as string;
  const supabase = createClient();

  const [tank, setTank] = useState<Tank | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTank() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: tankData, error } = await supabase
          .from("tanks")
          .select("id, name, type")
          .eq("id", tankId)
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .single();

        if (error || !tankData) {
          toast.error("Tank not found");
          router.push("/dashboard");
          return;
        }

        setTank(tankData);
      } catch (error) {
        console.error("Error loading tank:", error);
        toast.error("Failed to load tank");
      } finally {
        setIsLoading(false);
      }
    }

    loadTank();
  }, [supabase, tankId, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  if (!tank) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/tanks/${tankId}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Fish className="h-6 w-6 text-brand-cyan" />
              <span className="font-bold">AquaBotAI</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {tank.name}
            </span>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/tanks/${tankId}/settings`}>
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <ParameterDashboard tankId={tankId} tankType={tank.type} />
      </main>
    </div>
  );
}
