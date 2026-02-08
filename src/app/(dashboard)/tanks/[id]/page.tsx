"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Fish, ArrowLeft, Loader2, Droplets, Thermometer, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PhotoUpload } from "@/components/tanks/photo-upload";
import { LivestockList, StockingIndicator } from "@/components/livestock";
import { MaintenanceSummary } from "@/components/maintenance";
import type { Livestock, Species } from "@/types/database";

interface Tank {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  length_inches: number | null;
  width_inches: number | null;
  height_inches: number | null;
  substrate: string | null;
  notes: string | null;
  photo_url: string | null;
  photo_path: string | null;
  created_at: string;
}

interface WaterParameter {
  id: string;
  measured_at: string;
  temperature_f: number | null;
  ph: number | null;
  ammonia_ppm: number | null;
  nitrite_ppm: number | null;
  nitrate_ppm: number | null;
}

export default function TankDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const tankId = params.id as string;
  const supabase = createClient();

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname?.includes("/parameters")) return "parameters";
    if (pathname?.includes("/livestock")) return "livestock";
    if (pathname?.includes("/maintenance")) return "maintenance";
    if (pathname?.includes("/chat")) return "chat";
    return "overview";
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  const [tank, setTank] = useState<Tank | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [parameters, setParameters] = useState<WaterParameter[]>([]);
  const [livestock, setLivestock] = useState<(Livestock & { species?: Species })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLivestockLoading, setIsLivestockLoading] = useState(true);

  // Load livestock from API
  const loadLivestock = useCallback(async () => {
    setIsLivestockLoading(true);
    try {
      const response = await fetch(`/api/tanks/${tankId}/livestock`);
      const data = await response.json();
      if (data.success && data.data?.livestock) {
        setLivestock(data.data.livestock);
      }
    } catch (error) {
      console.error("Error loading livestock:", error);
    } finally {
      setIsLivestockLoading(false);
    }
  }, [tankId]);

  // Add livestock handler
  const handleAddLivestock = useCallback(async (
    speciesId: string,
    quantity: number,
    nickname?: string
  ): Promise<{ success: boolean; warning?: string }> => {
    try {
      const response = await fetch(`/api/tanks/${tankId}/livestock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          species_id: speciesId,
          quantity,
          nickname,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data?.warning) {
          return { success: true, warning: data.data.warning };
        }
        await loadLivestock();
        return { success: true };
      } else {
        toast.error(data.error?.message || "Failed to add livestock");
        return { success: false };
      }
    } catch (error) {
      console.error("Error adding livestock:", error);
      toast.error("Failed to add livestock");
      return { success: false };
    }
  }, [tankId, loadLivestock]);

  // Remove livestock handler
  const handleRemoveLivestock = useCallback(async (livestockId: string) => {
    try {
      const response = await fetch(
        `/api/tanks/${tankId}/livestock?livestock_id=${livestockId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Livestock removed");
        await loadLivestock();
      } else {
        toast.error(data.error?.message || "Failed to remove livestock");
      }
    } catch (error) {
      console.error("Error removing livestock:", error);
      toast.error("Failed to remove livestock");
    }
  }, [tankId, loadLivestock]);

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [pathname]);

  useEffect(() => {
    async function loadTankData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);

        // Get tank details
        const { data: tankData, error: tankError } = await supabase
          .from("tanks")
          .select("*")
          .eq("id", tankId)
          .eq("user_id", user.id)
          .single();

        if (tankError || !tankData) {
          toast.error("Tank not found");
          router.push("/dashboard");
          return;
        }

        setTank(tankData);

        // Get recent water parameters
        const { data: paramsData } = await supabase
          .from("water_parameters")
          .select("id, measured_at, temperature_f, ph, ammonia_ppm, nitrite_ppm, nitrate_ppm")
          .eq("tank_id", tankId)
          .order("measured_at", { ascending: false })
          .limit(10);

        if (paramsData) {
          setParameters(paramsData);
        }

        // Load livestock
        loadLivestock();
      } catch (error) {
        console.error("Error loading tank data:", error);
        toast.error("Failed to load tank data");
      } finally {
        setIsLoading(false);
      }
    }

    loadTankData();
  }, [supabase, tankId, router, loadLivestock]);

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

  const latestParams = parameters[0];

  return (
    <div className="min-h-screen bg-brand-bg">
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
        {/* Tank Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">{tank.name}</h1>
            <p className="text-gray-600">
              {tank.type.charAt(0).toUpperCase() + tank.type.slice(1)} •{" "}
              {tank.volume_gallons} gallons
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild className="border-brand-cyan text-brand-cyan hover:bg-brand-cyan/10">
              <Link href={`/tanks/${tank.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button size="sm" asChild className="bg-gradient-to-r from-brand-cyan to-brand-navy text-white hover:opacity-90">
              <Link href={`/tanks/${tank.id}/log`}>
                <Plus className="mr-2 h-4 w-4" />
                Log Parameters
              </Link>
            </Button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
            <Button
              variant={activeTab === "overview" ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={`rounded-b-none border-b-2 ${activeTab === "overview" ? "border-brand-cyan bg-brand-cyan/10 text-brand-navy" : "border-transparent"}`}
            >
              <Link href={`/tanks/${tankId}`}>Overview</Link>
            </Button>
            <Button
              variant={activeTab === "parameters" ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={`rounded-b-none border-b-2 ${activeTab === "parameters" ? "border-brand-cyan bg-brand-cyan/10 text-brand-navy" : "border-transparent"}`}
            >
              <Link href={`/tanks/${tankId}/parameters`}>Parameters</Link>
            </Button>
            <Button
              variant={activeTab === "livestock" ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={`rounded-b-none border-b-2 ${activeTab === "livestock" ? "border-brand-cyan bg-brand-cyan/10 text-brand-navy" : "border-transparent"}`}
            >
              <Link href={`/tanks/${tankId}/livestock`}>Livestock</Link>
            </Button>
            <Button
              variant={activeTab === "maintenance" ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={`rounded-b-none border-b-2 ${activeTab === "maintenance" ? "border-brand-cyan bg-brand-cyan/10 text-brand-navy" : "border-transparent"}`}
            >
              <Link href={`/tanks/${tankId}/maintenance`}>Maintenance</Link>
            </Button>
            <Button
              variant={activeTab === "chat" ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={`rounded-b-none border-b-2 ${activeTab === "chat" ? "border-brand-cyan bg-brand-cyan/10 text-brand-navy" : "border-transparent"}`}
            >
              <Link href={`/tanks/${tankId}/chat`}>Chat</Link>
            </Button>
          </nav>
        </div>

        {/* Tank Photo */}
        {userId && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Tank Photo</CardTitle>
                <CardDescription>
                  Add a photo to personalize your tank profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoUpload
                  tankId={tank.id}
                  userId={userId}
                  currentPhotoUrl={tank.photo_url}
                  currentPhotoPath={tank.photo_path}
                  onPhotoChange={(url, path) => {
                    setTank((prev) =>
                      prev ? { ...prev, photo_url: url, photo_path: path } : null
                    );
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Maintenance Summary */}
          <MaintenanceSummary tankId={tankId} />

          {/* Current Parameters */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-navy">
                <Droplets className="h-5 w-5 text-brand-cyan" />
                Current Parameters
              </CardTitle>
              <CardDescription>
                {latestParams
                  ? `Last tested ${new Date(latestParams.measured_at).toLocaleDateString()}`
                  : "No readings yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestParams ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Temperature</span>
                    <p className="text-2xl font-semibold">
                      {latestParams.temperature_f ? `${latestParams.temperature_f}°F` : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">pH</span>
                    <p className="text-2xl font-semibold">
                      {latestParams.ph ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Ammonia</span>
                    <p className="text-2xl font-semibold">
                      {latestParams.ammonia_ppm !== null ? `${latestParams.ammonia_ppm} ppm` : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Nitrite</span>
                    <p className="text-2xl font-semibold">
                      {latestParams.nitrite_ppm !== null ? `${latestParams.nitrite_ppm} ppm` : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Nitrate</span>
                    <p className="text-2xl font-semibold">
                      {latestParams.nitrate_ppm !== null ? `${latestParams.nitrate_ppm} ppm` : "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <Thermometer className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No water parameters logged yet
                  </p>
                  <Button asChild className="mt-4">
                    <Link href={`/tanks/${tank.id}/log`}>
                      Log Your First Reading
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parameter History */}
          <Card>
            <CardHeader>
              <CardTitle>Parameter History</CardTitle>
              <CardDescription>
                Recent water quality readings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {parameters.length > 0 ? (
                <div className="space-y-3">
                  {parameters.map((param) => (
                    <div
                      key={param.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="text-sm">
                        {new Date(param.measured_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {param.temperature_f && <span>{param.temperature_f}°F</span>}
                        {param.ph && <span>pH {param.ph}</span>}
                        {param.ammonia_ppm !== null && <span>NH₃ {param.ammonia_ppm}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No history available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Livestock Section */}
        <div className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {/* Stocking Density Indicator (compact) */}
              {tank.volume_gallons > 0 && livestock.length > 0 && (
                <div className="mb-6">
                  <StockingIndicator
                    tankId={tankId}
                    tankVolume={tank.volume_gallons}
                    livestock={livestock}
                    compact
                  />
                </div>
              )}
              <LivestockList
                tankId={tankId}
                tankType={tank.type}
                livestock={livestock}
                isLoading={isLivestockLoading}
                onAdd={handleAddLivestock}
                onRemove={handleRemoveLivestock}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
