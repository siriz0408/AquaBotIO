"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Fish, ArrowLeft, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUpload } from "@/components/tanks/photo-upload";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TANK_TYPES, parseFormToTankData, validateTank } from "@/lib/validation/tank";
import { format } from "date-fns";

const TANK_TYPE_OPTIONS = TANK_TYPES.map((type) => ({
  value: type,
  label: type.charAt(0).toUpperCase() + type.slice(1),
}));

const SUBSTRATE_OPTIONS = [
  { value: "", label: "Select substrate..." },
  { value: "sand", label: "Sand" },
  { value: "gravel", label: "Gravel" },
  { value: "bare_bottom", label: "Bare Bottom" },
  { value: "planted_substrate", label: "Planted Substrate (Aquasoil)" },
  { value: "crushed_coral", label: "Crushed Coral" },
  { value: "mixed", label: "Mixed" },
  { value: "other", label: "Other" },
];

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
  user_id: string;
  photo_url: string | null;
  photo_path: string | null;
  setup_date: string | null;
}

export default function EditTankPage() {
  const router = useRouter();
  const params = useParams();
  const tankId = params.id as string;
  const supabase = createClient();

  const [tank, setTank] = useState<Tank | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [type, setType] = useState("freshwater");
  const [volume, setVolume] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [substrate, setSubstrate] = useState("");
  const [customSubstrate, setCustomSubstrate] = useState("");
  const [notes, setNotes] = useState("");
  const [setupDate, setSetupDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  useEffect(() => {
    async function loadTank() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);

        const { data: tankData, error } = await supabase
          .from("tanks")
          .select("*")
          .eq("id", tankId)
          .eq("user_id", user.id)
          .single();

        if (error || !tankData) {
          toast.error("Tank not found");
          router.push("/tanks");
          return;
        }

        setTank(tankData);
        setName(tankData.name);
        setType(tankData.type);
        setVolume(tankData.volume_gallons.toString());
        setLength(tankData.length_inches?.toString() || "");
        setWidth(tankData.width_inches?.toString() || "");
        setHeight(tankData.height_inches?.toString() || "");
        setPhotoUrl(tankData.photo_url);
        setPhotoPath(tankData.photo_path);

        // Handle substrate - check if it's a predefined option or custom
        const existingSubstrate = tankData.substrate || "";
        const isPredefined = SUBSTRATE_OPTIONS.some(opt => opt.value === existingSubstrate.toLowerCase().replace(/\s+/g, '_'));
        if (isPredefined) {
          setSubstrate(existingSubstrate.toLowerCase().replace(/\s+/g, '_'));
          setCustomSubstrate("");
        } else if (existingSubstrate) {
          setSubstrate("other");
          setCustomSubstrate(existingSubstrate);
        }

        setNotes(tankData.notes || "");

        // Handle setup date
        if (tankData.setup_date) {
          setSetupDate(format(new Date(tankData.setup_date), "yyyy-MM-dd"));
        }
      } catch (error) {
        console.error("Error loading tank:", error);
        toast.error("Failed to load tank");
        router.push("/tanks");
      } finally {
        setIsLoading(false);
      }
    }

    loadTank();
  }, [supabase, tankId, router]);

  const handlePhotoChange = (url: string | null, path: string | null) => {
    setPhotoUrl(url);
    setPhotoPath(path);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine final substrate value
    const finalSubstrate = substrate === "other"
      ? customSubstrate
      : SUBSTRATE_OPTIONS.find(opt => opt.value === substrate)?.label || substrate;

    // Parse form data and validate with Zod
    const formData = parseFormToTankData({
      name,
      type,
      volume,
      length,
      width,
      height,
      substrate: finalSubstrate,
      notes,
    });

    const validation = validateTank(formData);
    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0];
      toast.error(firstError || "Please check your input");
      return;
    }

    setIsSaving(true);

    try {
      const updateData: Record<string, unknown> = {
        ...validation.data,
        updated_at: new Date().toISOString(),
      };

      // Add setup date if provided
      if (setupDate) {
        updateData.setup_date = new Date(setupDate).toISOString();
      }

      const { error } = await supabase
        .from("tanks")
        .update(updateData)
        .eq("id", tankId);

      if (error) {
        if (error.code === "23505") {
          toast.error("You already have a tank with this name");
        } else {
          toast.error("Failed to update tank");
          console.error(error);
        }
        return;
      }

      toast.success("Tank updated successfully!");
      router.push(`/tanks/${tankId}`);
    } catch (error) {
      console.error("Error updating tank:", error);
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

  if (!tank || !userId) {
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
              <CardTitle>Edit Tank</CardTitle>
              <CardDescription>
                Update your tank profile settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tank Photo */}
                <div className="space-y-2">
                  <Label>Tank Photo</Label>
                  <PhotoUpload
                    tankId={tankId}
                    userId={userId}
                    currentPhotoUrl={photoUrl}
                    currentPhotoPath={photoPath}
                    onPhotoChange={handlePhotoChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a photo of your tank. Max 5MB, JPEG/PNG/WebP.
                  </p>
                </div>

                {/* Tank Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Tank Name *</Label>
                  <Input
                    id="name"
                    placeholder="My Aquarium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Tank Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Tank Type *</Label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {TANK_TYPE_OPTIONS.map((tankType) => (
                      <option key={tankType.value} value={tankType.value}>
                        {tankType.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Setup Date */}
                <div className="space-y-2">
                  <Label htmlFor="setupDate">Setup Date</Label>
                  <div className="relative">
                    <Input
                      id="setupDate"
                      type="date"
                      value={setupDate}
                      onChange={(e) => setSetupDate(e.target.value)}
                      max={format(new Date(), "yyyy-MM-dd")}
                      className="pl-10"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When was this tank set up? Helps track tank maturity.
                  </p>
                </div>

                {/* Volume */}
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume (gallons) *</Label>
                  <Input
                    id="volume"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="20"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    required
                  />
                </div>

                {/* Dimensions */}
                <div className="space-y-2">
                  <Label>Dimensions (inches)</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Length"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">Length</span>
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Width"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">Width</span>
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Height"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">Height</span>
                    </div>
                  </div>
                </div>

                {/* Substrate */}
                <div className="space-y-2">
                  <Label htmlFor="substrate">Substrate</Label>
                  <select
                    id="substrate"
                    value={substrate}
                    onChange={(e) => {
                      setSubstrate(e.target.value);
                      if (e.target.value !== "other") {
                        setCustomSubstrate("");
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {SUBSTRATE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {substrate === "other" && (
                    <Input
                      placeholder="Describe your substrate..."
                      value={customSubstrate}
                      onChange={(e) => setCustomSubstrate(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    placeholder="Any additional notes about your tank setup, equipment, or special considerations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-2">
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
                    Save Changes
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
