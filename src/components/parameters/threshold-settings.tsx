"use client";

import { useState, useEffect } from "react";
import { Settings, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { PARAMETER_DEFAULTS } from "./parameter-card";

interface Threshold {
  safe_min: number;
  safe_max: number;
  warning_min: number;
  warning_max: number;
  is_custom: boolean;
}

interface Thresholds {
  [parameter_type: string]: Threshold;
}

interface ThresholdSettingsProps {
  tankId: string;
  tankType: string;
  onThresholdsChange?: (thresholds: Thresholds) => void;
}

// Parameter display names and their types
const PARAMETER_TYPES = [
  { key: "temperature", label: "Temperature", unit: "°F" },
  { key: "ph", label: "pH", unit: "" },
  { key: "ammonia", label: "Ammonia", unit: "ppm" },
  { key: "nitrite", label: "Nitrite", unit: "ppm" },
  { key: "nitrate", label: "Nitrate", unit: "ppm" },
];

const SALTWATER_PARAMETER_TYPES = [
  { key: "salinity", label: "Salinity", unit: "ppt" },
  { key: "calcium", label: "Calcium", unit: "ppm" },
  { key: "alkalinity", label: "Alkalinity", unit: "dKH" },
  { key: "magnesium", label: "Magnesium", unit: "ppm" },
  { key: "phosphate", label: "Phosphate", unit: "ppm" },
];

const SALTWATER_DEFAULTS: Record<string, Threshold> = {
  salinity: {
    safe_min: 1.023,
    safe_max: 1.026,
    warning_min: 1.020,
    warning_max: 1.028,
    is_custom: false,
  },
  calcium: {
    safe_min: 380,
    safe_max: 450,
    warning_min: 350,
    warning_max: 480,
    is_custom: false,
  },
  alkalinity: {
    safe_min: 7,
    safe_max: 11,
    warning_min: 6,
    warning_max: 13,
    is_custom: false,
  },
  magnesium: {
    safe_min: 1250,
    safe_max: 1400,
    warning_min: 1200,
    warning_max: 1450,
    is_custom: false,
  },
  phosphate: {
    safe_min: 0,
    safe_max: 0.03,
    warning_min: 0,
    warning_max: 0.1,
    is_custom: false,
  },
};

export function ThresholdSettings({
  tankId,
  tankType,
  onThresholdsChange,
}: ThresholdSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [thresholds, setThresholds] = useState<Thresholds>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingThresholds, setEditingThresholds] = useState<Thresholds>({});

  const isSaltwater = tankType === "saltwater";
  const allParameterTypes = isSaltwater
    ? [...PARAMETER_TYPES, ...SALTWATER_PARAMETER_TYPES]
    : PARAMETER_TYPES;

  // Load thresholds on mount
  useEffect(() => {
    if (isOpen) {
      loadThresholds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tankId]);

  const loadThresholds = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tanks/${tankId}/thresholds`);
      const data = await response.json();

      if (data.success && data.data?.thresholds) {
        const loadedThresholds = data.data.thresholds;
        setThresholds(loadedThresholds);
        setEditingThresholds(loadedThresholds);
      } else {
        // Initialize with defaults if no custom thresholds exist
        const defaultThresholds: Thresholds = {};
        PARAMETER_TYPES.forEach((param) => {
          const defaults = PARAMETER_DEFAULTS[param.key];
          if (defaults) {
            defaultThresholds[param.key] = {
              safe_min: defaults.safeZone.min,
              safe_max: defaults.safeZone.max,
              warning_min: defaults.warningZone.min,
              warning_max: defaults.warningZone.max,
              is_custom: false,
            };
          }
        });
        if (isSaltwater) {
          Object.assign(defaultThresholds, SALTWATER_DEFAULTS);
        }
        setThresholds(defaultThresholds);
        setEditingThresholds(defaultThresholds);
      }
    } catch (error) {
      console.error("Error loading thresholds:", error);
      toast.error("Failed to load threshold settings");
      // Fallback to defaults
      const defaultThresholds: Thresholds = {};
      PARAMETER_TYPES.forEach((param) => {
        const defaults = PARAMETER_DEFAULTS[param.key];
        if (defaults) {
          defaultThresholds[param.key] = {
            safe_min: defaults.safeZone.min,
            safe_max: defaults.safeZone.max,
            warning_min: defaults.warningZone.min,
            warning_max: defaults.warningZone.max,
            is_custom: false,
          };
        }
      });
      if (isSaltwater) {
        Object.assign(defaultThresholds, SALTWATER_DEFAULTS);
      }
      setThresholds(defaultThresholds);
      setEditingThresholds(defaultThresholds);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThresholdChange = (
    parameterType: string,
    field: keyof Threshold,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setEditingThresholds((prev) => ({
      ...prev,
      [parameterType]: {
        ...prev[parameterType],
        [field]: numValue,
      },
    }));
  };

  const validateThresholds = (paramThresholds: Threshold): boolean => {
    // Safe zone must be within warning zone
    return (
      paramThresholds.safe_min >= paramThresholds.warning_min &&
      paramThresholds.safe_max <= paramThresholds.warning_max &&
      paramThresholds.safe_min <= paramThresholds.safe_max &&
      paramThresholds.warning_min <= paramThresholds.warning_max
    );
  };

  const handleSave = async (parameterType: string) => {
    const paramThresholds = editingThresholds[parameterType];
    if (!paramThresholds) return;

    if (!validateThresholds(paramThresholds)) {
      toast.error(
        "Invalid thresholds: Safe zone must be within warning zone"
      );
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/tanks/${tankId}/thresholds`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameter_type: parameterType,
          safe_min: paramThresholds.safe_min,
          safe_max: paramThresholds.safe_max,
          warning_min: paramThresholds.warning_min,
          warning_max: paramThresholds.warning_max,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${parameterType} thresholds saved`);
        setThresholds((prev) => ({
          ...prev,
          [parameterType]: { ...paramThresholds, is_custom: true },
        }));
        if (onThresholdsChange) {
          onThresholdsChange({
            ...thresholds,
            [parameterType]: { ...paramThresholds, is_custom: true },
          });
        }
      } else {
        toast.error(data.error?.message || "Failed to save thresholds");
      }
    } catch (error) {
      console.error("Error saving thresholds:", error);
      toast.error("Failed to save thresholds");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async (parameterType: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/tanks/${tankId}/thresholds?parameter_type=${parameterType}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`${parameterType} reset to defaults`);
        // Reset to defaults
        let defaultThreshold: Threshold;
        if (PARAMETER_DEFAULTS[parameterType]) {
          const defaults = PARAMETER_DEFAULTS[parameterType];
          defaultThreshold = {
            safe_min: defaults.safeZone.min,
            safe_max: defaults.safeZone.max,
            warning_min: defaults.warningZone.min,
            warning_max: defaults.warningZone.max,
            is_custom: false,
          };
        } else if (SALTWATER_DEFAULTS[parameterType]) {
          defaultThreshold = SALTWATER_DEFAULTS[parameterType];
        } else {
          return;
        }

        setThresholds((prev) => ({
          ...prev,
          [parameterType]: defaultThreshold,
        }));
        setEditingThresholds((prev) => ({
          ...prev,
          [parameterType]: defaultThreshold,
        }));
        if (onThresholdsChange) {
          onThresholdsChange({
            ...thresholds,
            [parameterType]: defaultThreshold,
          });
        }
      } else {
        toast.error(data.error?.message || "Failed to reset thresholds");
      }
    } catch (error) {
      console.error("Error resetting thresholds:", error);
      toast.error("Failed to reset thresholds");
    } finally {
      setIsSaving(false);
    }
  };

  const getDefaultThreshold = (parameterType: string): Threshold => {
    if (PARAMETER_DEFAULTS[parameterType]) {
      const defaults = PARAMETER_DEFAULTS[parameterType];
      return {
        safe_min: defaults.safeZone.min,
        safe_max: defaults.safeZone.max,
        warning_min: defaults.warningZone.min,
        warning_max: defaults.warningZone.max,
        is_custom: false,
      };
    }
    if (SALTWATER_DEFAULTS[parameterType]) {
      return SALTWATER_DEFAULTS[parameterType];
    }
    return {
      safe_min: 0,
      safe_max: 100,
      warning_min: 0,
      warning_max: 100,
      is_custom: false,
    };
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Customize Thresholds
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Customize Parameter Thresholds</SheetTitle>
          <SheetDescription>
            Set custom safe and warning zones for each water parameter. Safe
            zones must be within warning zones.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {allParameterTypes.map((param) => {
              const currentThreshold =
                editingThresholds[param.key] ||
                getDefaultThreshold(param.key);
              const isCustom = thresholds[param.key]?.is_custom || false;

              return (
                <div
                  key={param.key}
                  className="space-y-4 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{param.label}</h3>
                      {isCustom && (
                        <span className="text-xs text-primary">
                          Custom thresholds
                        </span>
                      )}
                    </div>
                    {isCustom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReset(param.key)}
                        disabled={isSaving}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Safe Zone */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-green-600">
                        Safe Zone
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">
                            Min
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={currentThreshold.safe_min}
                            onChange={(e) =>
                              handleThresholdChange(
                                param.key,
                                "safe_min",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">
                            Max
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={currentThreshold.safe_max}
                            onChange={(e) =>
                              handleThresholdChange(
                                param.key,
                                "safe_max",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Warning Zone */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-yellow-600">
                        Warning Zone
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">
                            Min
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={currentThreshold.warning_min}
                            onChange={(e) =>
                              handleThresholdChange(
                                param.key,
                                "warning_min",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">
                            Max
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={currentThreshold.warning_max}
                            onChange={(e) =>
                              handleThresholdChange(
                                param.key,
                                "warning_max",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSave(param.key)}
                    disabled={isSaving}
                    className="w-full"
                    size="sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save {param.label}
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
