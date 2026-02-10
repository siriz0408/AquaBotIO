"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, ImagePlus, Sparkles, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";
import { useUser } from "@/lib/hooks/use-user";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  TIER_LIMITS,
  getTierDisplayName,
  getTierPrice,
  getUpgradeTier,
  type SubscriptionTier,
} from "@/lib/hooks/use-tier-limits";

// Max file size: 10MB per spec R-101.1
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Accepted formats per spec
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

interface PhotoUploadButtonProps {
  onPhotoSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function PhotoUploadButton({
  onPhotoSelect,
  disabled = false,
  className,
}: PhotoUploadButtonProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { trigger: triggerHaptic } = useHapticFeedback();
  const { subscription } = useUser();

  // Get user's tier (default to free if no subscription)
  const userTier: SubscriptionTier = (subscription?.tier as SubscriptionTier) || "free";

  // Check if user has photo diagnosis access (Plus or Pro only per spec R-101.7)
  const hasPhotoDiagnosisAccess =
    TIER_LIMITS[userTier].photo_diagnosis_daily > 0;

  // Handle button click - check tier access first
  const handleButtonClick = useCallback(() => {
    triggerHaptic("tap");
    setError(null);

    if (!hasPhotoDiagnosisAccess) {
      // Show upgrade prompt instead of photo picker
      setShowUpgradePrompt(true);
    } else {
      // Show camera/gallery picker
      setIsSheetOpen(true);
    }
  }, [hasPhotoDiagnosisAccess, triggerHaptic]);

  // Validate file before accepting
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please select a JPEG or PNG image.";
    }

    // Check file size (10MB max per spec)
    if (file.size > MAX_FILE_SIZE) {
      return "Image must be under 10MB. Please select a smaller file or compress the image.";
    }

    return null;
  };

  // Handle file selection from either input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      triggerHaptic("error");
      // Reset input so same file can be selected again
      event.target.value = "";
      return;
    }

    // Success - close sheet and pass file up
    triggerHaptic("success");
    setIsSheetOpen(false);
    setError(null);
    onPhotoSelect(file);

    // Reset input
    event.target.value = "";
  };

  // Trigger camera capture
  const handleCameraClick = () => {
    triggerHaptic("selection");
    cameraInputRef.current?.click();
  };

  // Trigger gallery selection
  const handleGalleryClick = () => {
    triggerHaptic("selection");
    galleryInputRef.current?.click();
  };

  // Get upgrade tier info
  const upgradeTier = getUpgradeTier(userTier);
  const upgradeTierName = upgradeTier ? getTierDisplayName(upgradeTier) : "Plus";
  const upgradeTierPrice = upgradeTier ? getTierPrice(upgradeTier) : "$9.99/mo";

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Upload Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        aria-disabled={disabled}
        aria-label="Upload photo for diagnosis"
        className={cn(
          "p-3 min-h-[44px] min-w-[44px] flex items-center justify-center",
          "hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        <Camera className="w-5 h-5 text-gray-600" aria-hidden="true" />
      </button>

      {/* Camera/Gallery Picker Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-center text-brand-navy">
              Upload Photo for Analysis
            </SheetTitle>
            <SheetDescription className="text-center">
              Take a new photo or select from your gallery
            </SheetDescription>
          </SheetHeader>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
              <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            {/* Camera Option */}
            <button
              onClick={handleCameraClick}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100",
                "hover:border-brand-teal hover:bg-brand-teal/5 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-teal to-brand-cyan flex items-center justify-center flex-shrink-0">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-brand-navy">Take Photo</p>
                <p className="text-sm text-gray-500">
                  Use your camera to capture an image
                </p>
              </div>
            </button>

            {/* Gallery Option */}
            <button
              onClick={handleGalleryClick}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100",
                "hover:border-brand-teal hover:bg-brand-teal/5 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center flex-shrink-0">
                <ImagePlus className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-brand-navy">Choose from Gallery</p>
                <p className="text-sm text-gray-500">
                  Select an existing photo
                </p>
              </div>
            </button>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Supports JPEG and PNG up to 10MB
          </p>
        </SheetContent>
      </Sheet>

      {/* Upgrade Prompt Sheet (for Free/Starter users) */}
      <Sheet open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
          <SheetHeader className="mb-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-navy flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <SheetTitle className="text-center text-brand-navy text-xl">
              Unlock Photo Diagnosis
            </SheetTitle>
            <SheetDescription className="text-center">
              Get instant AI-powered species identification and disease diagnosis
              with personalized treatment plans
            </SheetDescription>
          </SheetHeader>

          {/* Features */}
          <div className="bg-[#F0F4F8] rounded-2xl p-4 mb-6">
            <p className="font-semibold text-brand-navy mb-3">
              {upgradeTierName} Plan includes:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                {TIER_LIMITS[upgradeTier || "plus"].photo_diagnosis_daily} photo
                diagnoses per day
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                Species identification from photos
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                Disease diagnosis with treatment plans
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                {TIER_LIMITS[upgradeTier || "plus"].ai_messages_daily} AI
                messages per day
              </li>
            </ul>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-2xl font-bold text-brand-navy">
                {upgradeTierPrice}
              </span>
            </div>
            <Button asChild className="bg-brand-teal hover:bg-brand-teal/90">
              <Link href="/settings/billing">
                Upgrade Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Cancel */}
          <button
            onClick={() => setShowUpgradePrompt(false)}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
          >
            Maybe later
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}
