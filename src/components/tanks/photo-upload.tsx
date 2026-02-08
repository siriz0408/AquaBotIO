"use client";

import { useState, useRef } from "react";
import { Camera, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  uploadTankPhoto,
  deleteTankPhoto,
  updateTankPhoto,
  validateFile,
} from "@/lib/storage/tank-photos";

interface PhotoUploadProps {
  tankId: string;
  userId: string;
  currentPhotoUrl?: string | null;
  currentPhotoPath?: string | null;
  onPhotoChange?: (url: string | null, path: string | null) => void;
}

export function PhotoUpload({
  tankId,
  userId,
  currentPhotoUrl,
  currentPhotoPath,
  onPhotoChange,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [photoPath, setPhotoPath] = useState<string | null>(currentPhotoPath || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      // Delete old photo if exists
      if (photoPath) {
        await deleteTankPhoto(photoPath);
      }

      // Upload new photo
      const result = await uploadTankPhoto(userId, tankId, file);

      if (!result.success) {
        toast.error(result.error || "Failed to upload photo");
        setPreviewUrl(currentPhotoUrl || null);
        return;
      }

      // Update tank record with new photo
      const updated = await updateTankPhoto(tankId, result.url!, result.path!);

      if (!updated) {
        toast.error("Failed to save photo to tank");
        setPreviewUrl(currentPhotoUrl || null);
        return;
      }

      setPhotoPath(result.path!);
      toast.success("Photo uploaded successfully!");
      onPhotoChange?.(result.url!, result.path!);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
      setPreviewUrl(currentPhotoUrl || null);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!photoPath) return;

    setIsDeleting(true);
    try {
      // Delete from storage
      await deleteTankPhoto(photoPath);

      // Update tank record
      await updateTankPhoto(tankId, null, null);

      setPreviewUrl(null);
      setPhotoPath(null);
      toast.success("Photo deleted");
      onPhotoChange?.(null, null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete photo");
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {previewUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Tank photo"
            className="h-full w-full object-cover"
          />

          {/* Overlay controls */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              onClick={triggerUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              Change
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Remove
            </Button>
          </div>

          {/* Loading overlay */}
          {(isUploading || isDeleting) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerUpload}
          disabled={isUploading}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Add Tank Photo</p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, or WebP up to 5MB
                </p>
              </div>
            </>
          )}
        </button>
      )}
    </div>
  );
}
