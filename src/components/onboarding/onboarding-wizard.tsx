"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fish, Waves, Droplets, MessageSquare, PartyPopper, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/use-user";

const TANK_TYPES = [
  { value: "freshwater", label: "Freshwater", icon: Droplets, description: "Community tanks, planted tanks, tropical fish" },
  { value: "saltwater", label: "Saltwater", icon: Waves, description: "Marine fish, FOWLR setups" },
  { value: "reef", label: "Reef", icon: Fish, description: "Coral tanks, mixed reef systems" },
  { value: "brackish", label: "Brackish", icon: Droplets, description: "Estuarine species, mangrove tanks" },
  { value: "planted", label: "Planted", icon: Droplets, description: "Aquascaping, high-tech planted" },
  { value: "pond", label: "Pond", icon: Waves, description: "Koi ponds, garden ponds" },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const router = useRouter();
  const { profile, refreshProfile } = useUser();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [tankType, setTankType] = useState("");
  const [tankName, setTankName] = useState("");
  const [tankVolume, setTankVolume] = useState("");

  const totalSteps = 5;

  const updateOnboardingStep = async (newStep: number) => {
    if (!profile) return;
    await supabase
      .from("users")
      .update({ onboarding_step: newStep })
      .eq("id", profile.id);
  };

  const handleNext = async () => {
    if (step === 1 && !fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (step === 2 && !tankType) {
      toast.error("Please select a tank type");
      return;
    }

    if (step === 3) {
      if (!tankName.trim()) {
        toast.error("Please enter a tank name");
        return;
      }
      if (!tankVolume || parseFloat(tankVolume) <= 0) {
        toast.error("Please enter a valid volume");
        return;
      }
    }

    // Save step 1 data (name)
    if (step === 1 && profile) {
      setIsLoading(true);
      await supabase
        .from("users")
        .update({ full_name: fullName.trim() })
        .eq("id", profile.id);
      setIsLoading(false);
    }

    // Save step 3 data (create tank)
    if (step === 3 && profile) {
      setIsLoading(true);
      const { error } = await supabase.from("tanks").insert({
        user_id: profile.id,
        name: tankName.trim(),
        type: tankType,
        volume_gallons: parseFloat(tankVolume),
      });

      if (error) {
        toast.error("Failed to create tank");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    await updateOnboardingStep(step + 1);
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!profile) return;

    setIsLoading(true);
    await supabase
      .from("users")
      .update({
        onboarding_completed: true,
        onboarding_step: 5,
      })
      .eq("id", profile.id);

    await refreshProfile();
    setIsLoading(false);
    onComplete();
    router.push("/dashboard");
  };

  const handleSkip = async () => {
    if (!profile) return;

    setIsLoading(true);
    await supabase
      .from("users")
      .update({
        onboarding_completed: true,
        onboarding_step: 0,
      })
      .eq("id", profile.id);

    await refreshProfile();
    setIsLoading(false);
    onComplete();
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="px-6 pt-6">
          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
            <span>Step {step} of {totalSteps}</span>
            <button onClick={handleSkip} className="hover:underline">
              Skip for now
            </button>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-brand-cyan transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Welcome + Name */}
        {step === 1 && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan/10">
                <Fish className="h-8 w-8 text-brand-cyan" />
              </div>
              <CardTitle>Welcome to AquaBotAI!</CardTitle>
              <CardDescription>
                Let&apos;s get you set up in just a few steps. First, what should we call you?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Tank Type Selection */}
        {step === 2 && (
          <>
            <CardHeader className="text-center">
              <CardTitle>What type of tank do you have?</CardTitle>
              <CardDescription>
                This helps us personalize your experience and AI recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {TANK_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setTankType(type.value)}
                    className={`flex items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                      tankType === type.value
                        ? "border-brand-cyan bg-brand-cyan/5"
                        : "hover:border-brand-cyan/50"
                    }`}
                  >
                    <type.icon className={`h-6 w-6 ${tankType === type.value ? "text-brand-cyan" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3: Tank Name + Volume */}
        {step === 3 && (
          <>
            <CardHeader className="text-center">
              <CardTitle>Name your tank</CardTitle>
              <CardDescription>
                Give your {tankType} tank a name and tell us its size.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tankName">Tank name</Label>
                <Input
                  id="tankName"
                  placeholder="My Aquarium"
                  value={tankName}
                  onChange={(e) => setTankName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volume">Volume (gallons)</Label>
                <Input
                  id="volume"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="20"
                  value={tankVolume}
                  onChange={(e) => setTankVolume(e.target.value)}
                />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 4: AI Introduction */}
        {step === 4 && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan/10">
                <MessageSquare className="h-8 w-8 text-brand-cyan" />
              </div>
              <CardTitle>Meet your AI Assistant</CardTitle>
              <CardDescription>
                Your personal aquarium expert is ready to help!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm">
                  <span className="font-medium">AquaBotAI</span> can help you with:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• Water parameter analysis and recommendations</li>
                  <li>• Species compatibility checks</li>
                  <li>• Troubleshooting tank problems</li>
                  <li>• Maintenance scheduling</li>
                  <li>• General aquarium care advice</li>
                </ul>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Just open the chat and ask anything about your aquarium!
              </p>
            </CardContent>
          </>
        )}

        {/* Step 5: Completion */}
        {step === 5 && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <PartyPopper className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle>You&apos;re all set!</CardTitle>
              <CardDescription>
                Your 14-day Pro trial has started. Explore all features!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium">What&apos;s included in Pro:</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• Unlimited AI conversations</li>
                  <li>• Unlimited tanks</li>
                  <li>• Photo diagnosis</li>
                  <li>• Advanced analytics</li>
                  <li>• Email reports</li>
                </ul>
              </div>
            </CardContent>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 p-6 pt-0">
          {step > 1 && step < 5 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {step < 5 ? (
            <Button onClick={handleNext} className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
