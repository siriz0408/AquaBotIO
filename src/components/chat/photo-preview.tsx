"use client";

import { X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PhotoPreviewProps {
  file: File;
  previewUrl: string;
  onRemove: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
}

export function PhotoPreview({
  file,
  previewUrl,
  onRemove,
  isUploading = false,
  uploadProgress = 0,
  className,
}: PhotoPreviewProps) {
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={cn(
        "relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm",
        "animate-in slide-in-from-bottom-2 fade-in duration-200",
        className
      )}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Image Thumbnail */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <Image
            src={previewUrl}
            alt="Photo preview"
            fill
            className="object-cover"
            sizes="64px"
          />
          {/* Upload Progress Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="relative w-8 h-8">
                <svg
                  className="w-8 h-8 transform -rotate-90"
                  viewBox="0 0 32 32"
                >
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="white"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${uploadProgress * 0.88} 88`}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="w-4 h-4 text-brand-teal flex-shrink-0" />
            <p className="text-sm font-medium text-gray-800 truncate">
              {isUploading ? "Uploading..." : "Ready to analyze"}
            </p>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {file.name} ({formatFileSize(file.size)})
          </p>
        </div>

        {/* Remove Button */}
        {!isUploading && (
          <button
            onClick={onRemove}
            className={cn(
              "p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
            )}
            aria-label="Remove photo"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-brand-teal to-brand-cyan transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
