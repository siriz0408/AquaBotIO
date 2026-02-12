"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Fish,
  Waves,
  Droplets,
  Plus,
  Compass,
  Leaf,
  Sparkles,
  Heart,
  AlertTriangle,
  FlaskConical,
  Clock,
  HelpCircle,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// Storage key for local persistence
const STORAGE_KEY = "aquabotai_onboarding_progress";

// Types
export type ExperienceLevel = "first_timer" | "returning" | "experienced";
export type CurrentSituation = "new_tank" | "existing_tank" | "exploring";
export type PrimaryGoal = "low_maintenance" | "planted_tank" | "specific_fish" | "reef_tank";
export type Challenge =
  | "keeping_alive"
  | "water_quality"
  | "compatibility"
  | "maintenance"
  | "chemistry"
  | "none";

export interface OnboardingState {
  step: "experience" | "situation" | "goal" | "challenges" | "confirm";
  data: {
    experience_level?: ExperienceLevel;
    current_situation?: CurrentSituation;
    primary_goal?: PrimaryGoal;
    current_challenges?: Challenge[];
  };
}

interface AIOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

// Step configuration
const STEPS = ["experience", "situation", "goal", "challenges", "confirm"] as const;

// Experience options
const EXPERIENCE_OPTIONS: Array<{
  value: ExperienceLevel;
  label: string;
  description: string;
  icon: typeof Fish;
}> = [
  {
    value: "first_timer",
    label: "First Timer",
    description: "This is my first aquarium",
    icon: Sparkles,
  },
  {
    value: "returning",
    label: "Had Tanks Before",
    description: "I've kept fish in the past",
    icon: Waves,
  },
  {
    value: "experienced",
    label: "Experienced Keeper",
    description: "I've maintained aquariums for years",
    icon: Fish,
  },
];

// Situation options
const SITUATION_OPTIONS: Array<{
  value: CurrentSituation;
  label: string;
  description: string;
  icon: typeof Fish;
}> = [
  {
    value: "new_tank",
    label: "Setting Up New Tank",
    description: "I'm starting from scratch",
    icon: Plus,
  },
  {
    value: "existing_tank",
    label: "Have Existing Tank",
    description: "I already have a running tank",
    icon: Droplets,
  },
  {
    value: "exploring",
    label: "Just Exploring",
    description: "Learning before I commit",
    icon: Compass,
  },
];

// Goal options
const GOAL_OPTIONS: Array<{
  value: PrimaryGoal;
  label: string;
  description: string;
  icon: typeof Fish;
}> = [
  {
    value: "low_maintenance",
    label: "Low-Maintenance Setup",
    description: "Easy to care for, minimal effort",
    icon: Clock,
  },
  {
    value: "planted_tank",
    label: "Planted Tank",
    description: "Beautiful aquascaping with live plants",
    icon: Leaf,
  },
  {
    value: "specific_fish",
    label: "Specific Fish",
    description: "I have certain species in mind",
    icon: Fish,
  },
  {
    value: "reef_tank",
    label: "Reef Tank",
    description: "Corals, invertebrates, marine life",
    icon: Waves,
  },
];

// Challenge options
const CHALLENGE_OPTIONS: Array<{
  value: Challenge;
  label: string;
  icon: typeof Fish;
}> = [
  {
    value: "keeping_alive",
    label: "Keeping fish alive",
    icon: Heart,
  },
  {
    value: "water_quality",
    label: "Water quality issues",
    icon: Droplets,
  },
  {
    value: "compatibility",
    label: "Finding compatible fish",
    icon: Fish,
  },
  {
    value: "maintenance",
    label: "Maintenance routine",
    icon: Clock,
  },
  {
    value: "chemistry",
    label: "Understanding water chemistry",
    icon: FlaskConical,
  },
  {
    value: "none",
    label: "No challenges yet",
    icon: Check,
  },
];

// Helper function to get readable labels
function getExperienceLabel(value?: ExperienceLevel): string {
  return EXPERIENCE_OPTIONS.find((o) => o.value === value)?.label || "Not selected";
}

function getSituationLabel(value?: CurrentSituation): string {
  return SITUATION_OPTIONS.find((o) => o.value === value)?.label || "Not selected";
}

function getGoalLabel(value?: PrimaryGoal): string {
  return GOAL_OPTIONS.find((o) => o.value === value)?.label || "Not selected";
}

function getChallengeLabels(values?: Challenge[]): string {
  if (!values || values.length === 0) return "None selected";
  if (values.includes("none")) return "No challenges";
  return values.map((v) => CHALLENGE_OPTIONS.find((o) => o.value === v)?.label).join(", ");
}

export function AIOnboardingWizard({ open, onOpenChange, onComplete }: AIOnboardingWizardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize state from local storage or defaults
  const [state, setState] = useState<OnboardingState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Invalid saved data, use defaults
        }
      }
    }
    return {
      step: "experience",
      data: {
        current_challenges: [],
      },
    };
  });

  // Persist state to local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Clear local storage on successful completion
  const clearStorage = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Step navigation
  const currentStepIndex = STEPS.indexOf(state.step);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const canGoNext = (): boolean => {
    switch (state.step) {
      case "experience":
        return !!state.data.experience_level;
      case "situation":
        return !!state.data.current_situation;
      case "goal":
        return !!state.data.primary_goal;
      case "challenges":
        return (state.data.current_challenges?.length || 0) > 0;
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setState((prev) => ({ ...prev, step: STEPS[nextIndex] }));
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setState((prev) => ({ ...prev, step: STEPS[prevIndex] }));
    }
  };

  const handleSkip = async () => {
    clearStorage();
    onOpenChange(false);
    onComplete?.();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to save preferences");
      }

      // Clear storage and close
      clearStorage();
      toast.success("Preferences saved! Your AI assistant is now personalized.");

      onOpenChange(false);
      onComplete?.();

      // Redirect based on situation
      if (state.data.current_situation === "new_tank") {
        router.push("/tanks/new");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSection = (step: OnboardingState["step"]) => {
    setState((prev) => ({ ...prev, step }));
  };

  // Update data helper
  const updateData = <K extends keyof OnboardingState["data"]>(
    key: K,
    value: OnboardingState["data"][K]
  ) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  // Toggle challenge helper
  const toggleChallenge = (challenge: Challenge) => {
    setState((prev) => {
      const current = prev.data.current_challenges || [];
      let updated: Challenge[];

      // If selecting "none", clear all others
      if (challenge === "none") {
        updated = current.includes("none") ? [] : ["none"];
      } else {
        // Remove "none" if selecting another option
        const withoutNone = current.filter((c) => c !== "none");
        if (current.includes(challenge)) {
          updated = withoutNone.filter((c) => c !== challenge);
        } else {
          updated = [...withoutNone, challenge];
        }
      }

      return {
        ...prev,
        data: { ...prev.data, current_challenges: updated },
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby="onboarding-description"
      >
        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              Step {currentStepIndex + 1} of {STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            >
              Skip for now
            </button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step: Experience */}
        {state.step === "experience" && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan/10">
                <HelpCircle className="h-8 w-8 text-brand-cyan" />
              </div>
              <DialogTitle>Is this your first aquarium?</DialogTitle>
              <DialogDescription id="onboarding-description">
                This helps me tailor my advice to your experience level.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 mt-4">
              {EXPERIENCE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={state.data.experience_level === option.value}
                  onClick={() => updateData("experience_level", option.value)}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                />
              ))}
            </div>
          </>
        )}

        {/* Step: Situation */}
        {state.step === "situation" && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan/10">
                <Compass className="h-8 w-8 text-brand-cyan" />
              </div>
              <DialogTitle>What&apos;s your current situation?</DialogTitle>
              <DialogDescription id="onboarding-description">
                Understanding where you are helps me give better recommendations.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 mt-4">
              {SITUATION_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={state.data.current_situation === option.value}
                  onClick={() => updateData("current_situation", option.value)}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                />
              ))}
            </div>
          </>
        )}

        {/* Step: Goal */}
        {state.step === "goal" && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan/10">
                <Sparkles className="h-8 w-8 text-brand-cyan" />
              </div>
              <DialogTitle>What&apos;s your main goal?</DialogTitle>
              <DialogDescription id="onboarding-description">
                This helps me focus on what matters most to you.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 mt-4">
              {GOAL_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={state.data.primary_goal === option.value}
                  onClick={() => updateData("primary_goal", option.value)}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                />
              ))}
            </div>
          </>
        )}

        {/* Step: Challenges */}
        {state.step === "challenges" && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan/10">
                <AlertTriangle className="h-8 w-8 text-brand-cyan" />
              </div>
              <DialogTitle>Any challenges I should know about?</DialogTitle>
              <DialogDescription id="onboarding-description">
                Select all that apply so I can proactively help.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 mt-4">
              {CHALLENGE_OPTIONS.map((option) => (
                <ChallengeCheckbox
                  key={option.value}
                  checked={(state.data.current_challenges || []).includes(option.value)}
                  onCheckedChange={() => toggleChallenge(option.value)}
                  icon={option.icon}
                  label={option.label}
                  disabled={
                    option.value !== "none" &&
                    (state.data.current_challenges || []).includes("none")
                  }
                />
              ))}
            </div>
          </>
        )}

        {/* Step: Confirmation */}
        {state.step === "confirm" && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <DialogTitle>Review your preferences</DialogTitle>
              <DialogDescription id="onboarding-description">
                Make sure everything looks correct before we personalize your AI assistant.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <ConfirmationRow
                label="Experience"
                value={getExperienceLabel(state.data.experience_level)}
                onEdit={() => handleEditSection("experience")}
              />
              <ConfirmationRow
                label="Situation"
                value={getSituationLabel(state.data.current_situation)}
                onEdit={() => handleEditSection("situation")}
              />
              <ConfirmationRow
                label="Goal"
                value={getGoalLabel(state.data.primary_goal)}
                onEdit={() => handleEditSection("goal")}
              />
              <ConfirmationRow
                label="Challenges"
                value={getChallengeLabels(state.data.current_challenges)}
                onEdit={() => handleEditSection("challenges")}
              />
            </div>
          </>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {currentStepIndex > 0 && (
            <Button variant="outline" onClick={goBack} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {state.step !== "confirm" ? (
            <Button onClick={goNext} disabled={!canGoNext()} className="flex-1">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Option Card component for single-select steps
interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: typeof Fish;
  label: string;
  description: string;
}

function OptionCard({ selected, onClick, icon: Icon, label, description }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-lg border p-4 text-left transition-colors w-full
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        ${
          selected
            ? "border-brand-cyan bg-brand-cyan/5 ring-2 ring-brand-cyan"
            : "hover:border-brand-cyan/50"
        }`}
      aria-pressed={selected}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          selected ? "bg-brand-cyan text-white" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {selected && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-cyan text-white">
          <Check className="h-4 w-4" />
        </div>
      )}
    </button>
  );
}

// Challenge Checkbox component for multi-select
interface ChallengeCheckboxProps {
  checked: boolean;
  onCheckedChange: () => void;
  icon: typeof Fish;
  label: string;
  disabled?: boolean;
}

function ChallengeCheckbox({
  checked,
  onCheckedChange,
  icon: Icon,
  label,
  disabled,
}: ChallengeCheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onCheckedChange()}
      disabled={disabled}
      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors w-full
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${checked ? "border-brand-cyan bg-brand-cyan/5" : "hover:border-brand-cyan/50"}`}
      aria-pressed={checked}
    >
      <Checkbox
        checked={checked}
        onChange={onCheckedChange}
        disabled={disabled}
        className="pointer-events-none"
      />
      <Icon className={`h-5 w-5 ${checked ? "text-brand-cyan" : "text-muted-foreground"}`} />
      <span className="flex-1">{label}</span>
    </button>
  );
}

// Confirmation Row component
interface ConfirmationRowProps {
  label: string;
  value: string;
  onEdit: () => void;
}

function ConfirmationRow({ label, value, onEdit }: ConfirmationRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="text-brand-cyan hover:text-brand-cyan/80"
      >
        Edit
      </Button>
    </div>
  );
}

export default AIOnboardingWizard;
