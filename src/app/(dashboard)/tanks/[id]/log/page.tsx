"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Fish, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  parseFormToParameterData,
  validateWaterParameter,
} from "@/lib/validation/parameters";

interface Tank {
  id: string;
  name: string;
  type: string;
}

export default function LogParametersPage() {
  const router = useRouter();
  const params = useParams();
  const tankId = params.id as string;
  const supabase = createClient();

  const [tank, setTank] = useState<Tank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [temperature, setTemperature] = useState("");
  const [ph, setPh] = useState("");
  const [ammonia, setAmmonia] = useState("");
  const [nitrite, setNitrite] = useState("");
  const [nitrate, setNitrate] = useState("");
  const [gh, setGh] = useState("");
  const [kh, setKh] = useState("");
  // Saltwater parameters
  const [salinity, setSalinity] = useState("");
  const [calcium, setCalcium] = useState("");
  const [alkalinity, setAlkalinity] = useState("");
  const [magnesium, setMagnesium] = useState("");
  const [phosphate, setPhosphate] = useState("");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadTank() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: tankData, error } = await supabase
          .from("tanks")
          .select("id, name, type")
          .eq("id", tankId)
          .eq("user_id", user.id)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormErrors({});

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Parse and validate form data
      const formData = parseFormToParameterData({
        tank_id: tankId,
        temperature,
        ph,
        ammonia,
        nitrite,
        nitrate,
        gh,
        kh,
        salinity,
        calcium,
        alkalinity,
        magnesium,
        phosphate,
        notes,
      });

      const validation = validateWaterParameter(formData);

      if (!validation.success) {
        setFormErrors(validation.errors || {});
        toast.error("Please fix the errors in the form");
        return;
      }

      const parameterData = {
        tank_id: tankId,
        measured_at: new Date().toISOString(),
        temperature_f: validation.data?.temperature_f ?? null,
        ph: validation.data?.ph ?? null,
        ammonia_ppm: validation.data?.ammonia_ppm ?? null,
        nitrite_ppm: validation.data?.nitrite_ppm ?? null,
        nitrate_ppm: validation.data?.nitrate_ppm ?? null,
        gh_dgh: validation.data?.gh_dgh ?? null,
        kh_dgh: validation.data?.kh_dkh ?? null, // DB column is kh_dgh, schema uses kh_dkh
        salinity: validation.data?.salinity ?? null,
        calcium_ppm: validation.data?.calcium_ppm ?? null,
        alkalinity_dkh: validation.data?.alkalinity_dkh ?? null,
        magnesium_ppm: validation.data?.magnesium_ppm ?? null,
        phosphate_ppm: validation.data?.phosphate_ppm ?? null,
        notes: validation.data?.notes ?? null,
      };

      const { error } = await supabase
        .from("water_parameters")
        .insert(parameterData);

      if (error) {
        console.error("Error saving parameters:", error);
        toast.error("Failed to save parameters");
        return;
      }

      toast.success("Parameters logged successfully!");
      router.push(`/tanks/${tankId}`);
    } catch (error) {
      console.error("Error saving parameters:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

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
        <div className="container flex h-16 items-center gap-4">
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
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>Log Water Parameters</CardTitle>
              <CardDescription>
                Record today&apos;s water test results for {tank.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Core Parameters */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Core Parameters</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Temperature */}
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature (°F)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        placeholder="78"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        className={formErrors.temperature_f ? "border-destructive" : ""}
                      />
                      {formErrors.temperature_f && (
                        <p className="text-xs text-destructive">{formErrors.temperature_f}</p>
                      )}
                    </div>

                    {/* pH */}
                    <div className="space-y-2">
                      <Label htmlFor="ph">pH</Label>
                      <Input
                        id="ph"
                        type="number"
                        step="0.1"
                        min="0"
                        max="14"
                        placeholder="7.0"
                        value={ph}
                        onChange={(e) => setPh(e.target.value)}
                        className={formErrors.ph ? "border-destructive" : ""}
                      />
                      {formErrors.ph && (
                        <p className="text-xs text-destructive">{formErrors.ph}</p>
                      )}
                    </div>

                    {/* Ammonia */}
                    <div className="space-y-2">
                      <Label htmlFor="ammonia">Ammonia (ppm)</Label>
                      <Input
                        id="ammonia"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={ammonia}
                        onChange={(e) => setAmmonia(e.target.value)}
                        className={formErrors.ammonia_ppm ? "border-destructive" : ""}
                      />
                      {formErrors.ammonia_ppm && (
                        <p className="text-xs text-destructive">{formErrors.ammonia_ppm}</p>
                      )}
                    </div>

                    {/* Nitrite */}
                    <div className="space-y-2">
                      <Label htmlFor="nitrite">Nitrite (ppm)</Label>
                      <Input
                        id="nitrite"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={nitrite}
                        onChange={(e) => setNitrite(e.target.value)}
                        className={formErrors.nitrite_ppm ? "border-destructive" : ""}
                      />
                      {formErrors.nitrite_ppm && (
                        <p className="text-xs text-destructive">{formErrors.nitrite_ppm}</p>
                      )}
                    </div>

                    {/* Nitrate */}
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="nitrate">Nitrate (ppm)</Label>
                      <Input
                        id="nitrate"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="20"
                        value={nitrate}
                        onChange={(e) => setNitrate(e.target.value)}
                        className={formErrors.nitrate_ppm ? "border-destructive" : ""}
                      />
                      {formErrors.nitrate_ppm && (
                        <p className="text-xs text-destructive">{formErrors.nitrate_ppm}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Freshwater Optional Parameters */}
                {tank.type === "freshwater" && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Freshwater Parameters (Optional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gh">GH (dGH)</Label>
                        <Input
                          id="gh"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="8"
                          value={gh}
                          onChange={(e) => setGh(e.target.value)}
                          className={formErrors.gh_dgh ? "border-destructive" : ""}
                        />
                        {formErrors.gh_dgh && (
                          <p className="text-xs text-destructive">{formErrors.gh_dgh}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kh">KH (dKH)</Label>
                        <Input
                          id="kh"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="5"
                          value={kh}
                          onChange={(e) => setKh(e.target.value)}
                          className={formErrors.kh_dkh ? "border-destructive" : ""}
                        />
                        {formErrors.kh_dkh && (
                          <p className="text-xs text-destructive">{formErrors.kh_dkh}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Saltwater Parameters */}
                {tank.type === "saltwater" && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Saltwater Parameters</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salinity">Salinity (specific gravity)</Label>
                        <Input
                          id="salinity"
                          type="number"
                          step="0.001"
                          min="0"
                          max="2"
                          placeholder="1.025"
                          value={salinity}
                          onChange={(e) => setSalinity(e.target.value)}
                          className={formErrors.salinity ? "border-destructive" : ""}
                        />
                        {formErrors.salinity && (
                          <p className="text-xs text-destructive">{formErrors.salinity}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="calcium">Calcium (ppm)</Label>
                        <Input
                          id="calcium"
                          type="number"
                          step="1"
                          min="0"
                          placeholder="420"
                          value={calcium}
                          onChange={(e) => setCalcium(e.target.value)}
                          className={formErrors.calcium_ppm ? "border-destructive" : ""}
                        />
                        {formErrors.calcium_ppm && (
                          <p className="text-xs text-destructive">{formErrors.calcium_ppm}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alkalinity">Alkalinity (dKH)</Label>
                        <Input
                          id="alkalinity"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="9"
                          value={alkalinity}
                          onChange={(e) => setAlkalinity(e.target.value)}
                          className={formErrors.alkalinity_dkh ? "border-destructive" : ""}
                        />
                        {formErrors.alkalinity_dkh && (
                          <p className="text-xs text-destructive">{formErrors.alkalinity_dkh}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="magnesium">Magnesium (ppm)</Label>
                        <Input
                          id="magnesium"
                          type="number"
                          step="1"
                          min="0"
                          placeholder="1300"
                          value={magnesium}
                          onChange={(e) => setMagnesium(e.target.value)}
                          className={formErrors.magnesium_ppm ? "border-destructive" : ""}
                        />
                        {formErrors.magnesium_ppm && (
                          <p className="text-xs text-destructive">{formErrors.magnesium_ppm}</p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="phosphate">Phosphate (ppm)</Label>
                        <Input
                          id="phosphate"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.03"
                          value={phosphate}
                          onChange={(e) => setPhosphate(e.target.value)}
                          className={formErrors.phosphate_ppm ? "border-destructive" : ""}
                        />
                        {formErrors.phosphate_ppm && (
                          <p className="text-xs text-destructive">{formErrors.phosphate_ppm}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {formErrors._root && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{formErrors._root}</p>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <textarea
                    id="notes"
                    placeholder="Any observations about your tank today..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/tanks/${tankId}`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Reading
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
