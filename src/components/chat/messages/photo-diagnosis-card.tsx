"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Fish,
  Stethoscope,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types matching the Task Brief spec
export interface PhotoDiagnosisData {
  imageUrl: string;
  diagnosisType: "species_id" | "disease" | "both";
  speciesResult?: {
    name: string;
    scientificName?: string;
    speciesId?: string;
    confidence: "high" | "medium" | "low";
    careLevel?: string;
  };
  diseaseResult?: {
    diagnosis: string;
    confidence: "high" | "medium" | "low";
    severity: "minor" | "moderate" | "severe";
    symptoms: string[];
    treatmentSteps: string[];
  };
}

interface PhotoDiagnosisCardProps {
  data: PhotoDiagnosisData;
  timestamp: Date;
  className?: string;
}

// Severity configuration per spec
const SEVERITY_CONFIG = {
  minor: {
    color: "#1B998B", // brand-teal
    bgColor: "bg-[#1B998B]/10",
    label: "Low Risk",
    icon: CheckCircle,
  },
  moderate: {
    color: "#F59E0B", // amber-500
    bgColor: "bg-amber-50",
    label: "Monitor Closely",
    icon: AlertTriangle,
  },
  severe: {
    color: "#FF6B6B", // brand-alert
    bgColor: "bg-red-50",
    label: "Requires Attention",
    icon: AlertCircle,
  },
};

// Confidence badge colors
const CONFIDENCE_CONFIG = {
  high: {
    color: "#1B998B",
    bgColor: "bg-[#1B998B]",
    label: "High Confidence",
  },
  medium: {
    color: "#F59E0B",
    bgColor: "bg-amber-500",
    label: "Medium Confidence",
  },
  low: {
    color: "#FF6B6B",
    bgColor: "bg-[#FF6B6B]",
    label: "Low Confidence",
  },
};

export function PhotoDiagnosisCard({
  data,
  timestamp,
  className,
}: PhotoDiagnosisCardProps) {
  const [treatmentExpanded, setTreatmentExpanded] = useState(true);

  // Determine overall confidence for display
  const overallConfidence =
    data.diseaseResult?.confidence || data.speciesResult?.confidence || "medium";
  const confidenceConfig = CONFIDENCE_CONFIG[overallConfidence];

  // Get severity config if disease result exists
  const severityConfig = data.diseaseResult
    ? SEVERITY_CONFIG[data.diseaseResult.severity]
    : null;
  const SeverityIcon = severityConfig?.icon || Info;

  return (
    <div className={cn("flex justify-start", className)}>
      <div className="max-w-[90%] w-full">
        {/* AquaBot Header */}
        <div className="flex items-start gap-2 mb-1">
          <div className="w-6 h-6 bg-gradient-to-br from-brand-teal to-brand-navy rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold text-brand-teal">
            Aquatic AI
          </span>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-sm ml-8 overflow-hidden">
          {/* Image with Confidence Overlay */}
          <div className="relative h-48 bg-gray-100">
            <Image
              src={data.imageUrl}
              alt="Photo diagnosis image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Confidence Badge */}
            <div
              className={cn(
                "absolute top-3 right-3 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5",
                confidenceConfig.bgColor
              )}
            >
              <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
              <span className="text-xs text-white font-medium">
                {confidenceConfig.label}
              </span>
            </div>

            {/* Type Badge */}
            <div className="absolute bottom-3 left-3 flex gap-2">
              {data.speciesResult && (
                <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Fish className="w-3.5 h-3.5 text-brand-teal" />
                  <span className="text-xs font-medium text-gray-700">
                    Species ID
                  </span>
                </div>
              )}
              {data.diseaseResult && (
                <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-brand-navy" />
                  <span className="text-xs font-medium text-gray-700">
                    Health Analysis
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Diagnosis Content */}
          <div className="p-4 space-y-4">
            {/* Species Identification Result */}
            {data.speciesResult && (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center flex-shrink-0">
                    <Fish className="w-5 h-5 text-brand-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-brand-navy text-lg leading-tight">
                      {data.speciesResult.name}
                    </h3>
                    {data.speciesResult.scientificName && (
                      <p className="text-sm text-gray-500 italic">
                        {data.speciesResult.scientificName}
                      </p>
                    )}
                    {data.speciesResult.careLevel && (
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full">
                        <span className="text-xs text-gray-600">
                          Care Level:
                        </span>
                        <span className="text-xs font-semibold text-gray-800">
                          {data.speciesResult.careLevel}
                        </span>
                      </div>
                    )}
                  </div>
                  {data.speciesResult.speciesId && (
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      aria-label="View species details"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Divider if both results exist */}
            {data.speciesResult && data.diseaseResult && (
              <hr className="border-gray-100" />
            )}

            {/* Disease Diagnosis Result */}
            {data.diseaseResult && severityConfig && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${severityConfig.color}15` }}
                  >
                    <SeverityIcon
                      className="w-5 h-5"
                      style={{ color: severityConfig.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-brand-navy mb-1">
                      {data.diseaseResult.diagnosis}
                    </h3>
                    {/* Severity Badge */}
                    <div
                      className="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${severityConfig.color}15`,
                        color: severityConfig.color,
                      }}
                    >
                      {severityConfig.label}
                    </div>
                  </div>
                </div>

                {/* Symptoms List */}
                {data.diseaseResult.symptoms.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Observed Symptoms:
                    </p>
                    <ul className="space-y-1">
                      {data.diseaseResult.symptoms.map((symptom, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: severityConfig.color }}
                          />
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Treatment Steps - Collapsible */}
                {data.diseaseResult.treatmentSteps.length > 0 && (
                  <div className="bg-[#F0F4F8] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setTreatmentExpanded(!treatmentExpanded)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
                      aria-expanded={treatmentExpanded}
                      aria-controls="treatment-steps"
                    >
                      <span className="text-sm font-semibold text-brand-navy">
                        Treatment Steps ({data.diseaseResult.treatmentSteps.length})
                      </span>
                      {treatmentExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {treatmentExpanded && (
                      <div id="treatment-steps" className="px-4 pb-4">
                        <ol className="space-y-2">
                          {data.diseaseResult.treatmentSteps.map((step, index) => (
                            <li
                              key={index}
                              className="flex gap-3 text-sm text-gray-700"
                            >
                              <span className="font-bold text-brand-teal flex-shrink-0 w-5">
                                {index + 1}.
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Low Confidence Warning */}
            {overallConfidence === "low" && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>Low confidence result.</strong> Consider uploading a
                  clearer photo or consulting an experienced aquarist for a
                  second opinion.
                </p>
              </div>
            )}

            {/* Disclaimer - R-101.8 */}
            <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                AI analysis is for informational purposes. For serious concerns,
                consult a veterinary professional or experienced aquarist.
              </p>
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-gray-500 mt-1 ml-8">
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
