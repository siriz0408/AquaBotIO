/**
 * Database types for AquaBotAI
 *
 * These types will be auto-generated from Supabase once the schema is deployed.
 * For now, this file contains placeholder types that match the spec.
 *
 * Run `npx supabase gen types typescript` to regenerate after schema changes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enums
export type TankType = "freshwater" | "saltwater" | "brackish" | "pond";
export type SubscriptionTier = "free" | "starter" | "plus" | "pro";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type TaskType = "water_change" | "filter_cleaning" | "feeding" | "dosing" | "equipment_maintenance" | "water_testing" | "custom";
export type TaskFrequency = "once" | "daily" | "weekly" | "biweekly" | "monthly" | "custom";
export type Temperament = "peaceful" | "semi_aggressive" | "aggressive";
export type CareLevel = "beginner" | "intermediate" | "expert";

// Core tables
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  skill_level: SkillLevel;
  unit_preference_volume: "gallons" | "liters";
  unit_preference_temp: "fahrenheit" | "celsius";
  onboarding_completed: boolean;
  onboarding_step: number;
  role: "user" | "admin" | "super_admin";
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tank {
  id: string;
  user_id: string;
  name: string;
  type: TankType;
  volume_gallons: number;
  length_inches: number | null;
  width_inches: number | null;
  height_inches: number | null;
  substrate: string | null;
  photo_url: string | null;
  notes: string | null;
  setup_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WaterParameter {
  id: string;
  tank_id: string;
  measured_at: string;
  ph: number | null;
  ammonia_ppm: number | null;
  nitrite_ppm: number | null;
  nitrate_ppm: number | null;
  temperature_f: number | null;
  gh_dgh: number | null;
  kh_dkh: number | null;
  salinity: number | null;
  calcium_ppm: number | null;
  alkalinity_dkh: number | null;
  magnesium_ppm: number | null;
  phosphate_ppm: number | null;
  notes: string | null;
  created_at: string;
}

export interface Species {
  id: string;
  common_name: string;
  scientific_name: string;
  type: "freshwater" | "saltwater" | "invertebrate" | "plant";
  care_level: CareLevel;
  temperament: Temperament;
  min_tank_size_gallons: number;
  max_size_inches: number;
  temp_min_f: number;
  temp_max_f: number;
  ph_min: number;
  ph_max: number;
  diet: string | null;
  compatibility_notes: string | null;
  photo_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Livestock {
  id: string;
  tank_id: string;
  species_id: string | null;
  custom_name: string | null;
  nickname: string | null;
  quantity: number;
  date_added: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MaintenanceTask {
  id: string;
  tank_id: string;
  type: TaskType;
  title: string;
  description: string | null;
  frequency: TaskFrequency;
  custom_interval_days: number | null;
  next_due_date: string;
  reminder_before_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MaintenanceLog {
  id: string;
  task_id: string;
  completed_at: string;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface AIMessage {
  id: string;
  tank_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  action_type: string | null;
  action_data: Json | null;
  action_executed: boolean;
  input_tokens: number | null;
  output_tokens: number | null;
  model: string | null;
  error: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billing_interval: "month" | "year" | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  grace_period_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  processed_at: string;
  payload: Json;
  error: string | null;
  created_at: string;
}

export interface AIUsage {
  id: string;
  user_id: string;
  date: string;
  feature: "chat" | "diagnosis" | "report" | "search";
  message_count: number;
  input_tokens: number;
  output_tokens: number;
  created_at: string;
  updated_at: string;
}

export type ParameterType =
  | "temperature_f"
  | "ph"
  | "ammonia_ppm"
  | "nitrite_ppm"
  | "nitrate_ppm"
  | "gh_ppm"
  | "kh_ppm"
  | "salinity_ppt"
  | "phosphate_ppm"
  | "calcium_ppm"
  | "magnesium_ppm"
  | "alkalinity_dkh"
  | "dissolved_oxygen_ppm";

export interface ParameterThreshold {
  id: string;
  tank_id: string;
  parameter_type: ParameterType;
  safe_min: number | null;
  safe_max: number | null;
  warning_min: number | null;
  warning_max: number | null;
  created_at: string;
  updated_at: string;
}

export interface CompatibilityWarning {
  type: string;
  message: string;
  severity: "info" | "warning" | "danger";
}

export interface CompatibilityCheck {
  id: string;
  tank_id: string;
  species_a_id: string;
  species_b_id: string;
  compatibility_score: 1 | 2 | 3 | 4 | 5;
  warnings: CompatibilityWarning[];
  notes: string | null;
  ai_model: string | null;
  created_at: string;
  expires_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Proactive alerts types (Spec 17)
export type AlertSeverity = "info" | "warning" | "alert";
export type AlertStatus = "active" | "dismissed" | "resolved";
export type TrendDirection = "increasing" | "decreasing" | "stable" | "spiking";

export interface ProactiveAlert {
  id: string;
  tank_id: string;
  user_id: string;
  parameter: string;
  current_value: number | null;
  unit: string | null;
  trend_direction: TrendDirection;
  trend_rate: number | null;
  projection_text: string | null;
  likely_cause: string | null;
  suggested_action: string | null;
  severity: AlertSeverity;
  status: AlertStatus;
  created_at: string;
  dismissed_at: string | null;
  resolved_at: string | null;
  resolved_by_action_id: string | null;
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      tanks: {
        Row: Tank;
        Insert: Omit<Tank, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Tank, "id" | "created_at">>;
      };
      water_parameters: {
        Row: WaterParameter;
        Insert: Omit<WaterParameter, "id" | "created_at">;
        Update: Partial<Omit<WaterParameter, "id" | "created_at">>;
      };
      species: {
        Row: Species;
        Insert: Omit<Species, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Species, "id" | "created_at">>;
      };
      livestock: {
        Row: Livestock;
        Insert: Omit<Livestock, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Livestock, "id" | "created_at">>;
      };
      maintenance_tasks: {
        Row: MaintenanceTask;
        Insert: Omit<MaintenanceTask, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<MaintenanceTask, "id" | "created_at">>;
      };
      maintenance_logs: {
        Row: MaintenanceLog;
        Insert: Omit<MaintenanceLog, "id" | "created_at">;
        Update: Partial<Omit<MaintenanceLog, "id" | "created_at">>;
      };
      ai_messages: {
        Row: AIMessage;
        Insert: Omit<AIMessage, "id" | "created_at">;
        Update: Partial<Omit<AIMessage, "id" | "created_at">>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Subscription, "id" | "created_at">>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: never; // Audit logs are immutable
      };
      webhook_events: {
        Row: WebhookEvent;
        Insert: Omit<WebhookEvent, "id" | "created_at" | "processed_at">;
        Update: never; // Webhook events are immutable
      };
      ai_usage: {
        Row: AIUsage;
        Insert: Omit<AIUsage, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<AIUsage, "id" | "created_at">>;
      };
      proactive_alerts: {
        Row: ProactiveAlert;
        Insert: Omit<ProactiveAlert, "id" | "created_at">;
        Update: Partial<Omit<ProactiveAlert, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      tank_type: TankType;
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
      skill_level: SkillLevel;
      task_type: TaskType;
      task_frequency: TaskFrequency;
      temperament: Temperament;
      care_level: CareLevel;
    };
  };
}
