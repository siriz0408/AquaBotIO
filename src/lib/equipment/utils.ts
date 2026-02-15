// Equipment type utilities per Spec 10

export const EQUIPMENT_TYPES = [
  { value: "filter", label: "Filter", icon: "🔄" },
  { value: "filter_media", label: "Filter Media", icon: "🧽" },
  { value: "heater", label: "Heater", icon: "🌡️" },
  { value: "light_bulb", label: "Light (Bulb)", icon: "💡" },
  { value: "light_led", label: "Light (LED)", icon: "✨" },
  { value: "protein_skimmer", label: "Protein Skimmer", icon: "🫧" },
  { value: "powerhead", label: "Powerhead", icon: "💨" },
  { value: "dosing_pump", label: "Dosing Pump", icon: "💉" },
  { value: "controller", label: "Controller", icon: "🎛️" },
  { value: "test_kit", label: "Test Kit", icon: "🧪" },
  { value: "substrate", label: "Substrate", icon: "🪨" },
  { value: "media", label: "Bio Media", icon: "🔬" },
  { value: "carbon", label: "Activated Carbon", icon: "⬛" },
  { value: "other", label: "Other", icon: "📦" },
] as const;

export type EquipmentType = typeof EQUIPMENT_TYPES[number]["value"];

export function getEquipmentTypeInfo(type: string) {
  return EQUIPMENT_TYPES.find((t) => t.value === type) || EQUIPMENT_TYPES[EQUIPMENT_TYPES.length - 1];
}

export type EquipmentStatus = "good" | "due_soon" | "overdue";

export const STATUS_CONFIG: Record<EquipmentStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  good: {
    label: "Good",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  due_soon: {
    label: "Due Soon",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  overdue: {
    label: "Overdue",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

export function getStatusConfig(status: EquipmentStatus) {
  return STATUS_CONFIG[status];
}

export function formatAge(months: number): string {
  if (months < 1) return "< 1 month";
  if (months === 1) return "1 month";
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return years === 1 ? "1 year" : `${years} years`;
  }
  return `${years}y ${remainingMonths}m`;
}

export function formatTimeRemaining(months: number): string {
  if (months <= 0) return "Overdue";
  if (months < 1) return "< 1 month left";
  if (months === 1) return "1 month left";
  if (months < 12) return `${months} months left`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return years === 1 ? "1 year left" : `${years} years left`;
  }
  return `${years}y ${remainingMonths}m left`;
}

export const DELETION_REASONS = [
  { value: "replaced", label: "Replaced with new" },
  { value: "removed", label: "Removed from tank" },
  { value: "failed", label: "Equipment failed" },
  { value: "sold", label: "Sold" },
  { value: "other", label: "Other" },
] as const;

export type DeletionReason = typeof DELETION_REASONS[number]["value"];
