"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fish, ArrowLeft, Loader2, Bell, BellOff, CheckCircle2, AlertCircle, Mail, Crown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/use-user";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { resolveUserTier } from "@/lib/hooks/use-tier-limits";

interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  email_reports_enabled: boolean;
  reminder_timing: "day_before" | "morning_of" | "1_hour_before";
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  // Extended preferences for UI
  maintenance_reminders: boolean;
  parameter_alerts: boolean;
  ai_insights: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  push_enabled: false,
  email_enabled: true,
  email_reports_enabled: true,
  reminder_timing: "morning_of",
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00:00",
  quiet_hours_end: "08:00:00",
  maintenance_reminders: true,
  parameter_alerts: true,
  ai_insights: true,
};

export default function NotificationSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading: userLoading } = useUser();
  const {
    isSupported,
    isConfigured,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading: pushLoading,
    error: pushError,
  } = usePushNotifications();

  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [tier, setTier] = useState<string | null>(null);
  const [isSendingReport, setIsSendingReport] = useState(false);

  // Fetch user tier
  useEffect(() => {
    const fetchTier = async () => {
      if (!user) return;
      try {
        const userTier = await resolveUserTier(supabase, user.id);
        setTier(userTier);
      } catch (err) {
        console.error("Error fetching tier:", err);
      }
    };
    if (user) {
      fetchTier();
    }
  }, [user, supabase]);

  // Send test report
  const handleSendTestReport = async () => {
    setIsSendingReport(true);
    try {
      const response = await fetch("/api/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Report sent! Check your email.");
      } else {
        toast.error(data.error?.message || "Failed to send report");
      }
    } catch (err) {
      console.error("Error sending report:", err);
      toast.error("Failed to send report");
    } finally {
      setIsSendingReport(false);
    }
  };

  // Fetch notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows returned
          console.error("Error fetching preferences:", error);
          return;
        }

        if (data) {
          // Convert reminder_time + reminder_days_before to reminder_timing
          let reminder_timing: "day_before" | "morning_of" | "1_hour_before" = "morning_of";
          if (data.reminder_days_before === 1) {
            reminder_timing = "day_before";
          } else if (data.reminder_days_before === 0 && data.reminder_time === "08:00:00") {
            reminder_timing = "1_hour_before";
          } else {
            reminder_timing = "morning_of";
          }

          setPreferences({
            push_enabled: data.push_enabled ?? false,
            email_enabled: data.email_enabled ?? true,
            email_reports_enabled: data.email_reports_enabled ?? true,
            reminder_timing: reminder_timing,
            quiet_hours_enabled: data.quiet_hours_enabled ?? false,
            quiet_hours_start: data.quiet_hours_start ?? "22:00:00",
            quiet_hours_end: data.quiet_hours_end ?? "08:00:00",
            maintenance_reminders: data.maintenance_reminders ?? true,
            parameter_alerts: data.parameter_alerts ?? true,
            ai_insights: data.ai_insights ?? true,
          });
        }
      } catch (err) {
        console.error("Error fetching preferences:", err);
      } finally {
        setIsLoadingPrefs(false);
      }
    };

    if (user) {
      fetchPreferences();
    }
  }, [user, supabase]);

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [userLoading, user, router]);

  // Handle push notification toggle
  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  // Update local preferences (marks as changed)
  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save preferences to database
  const handleSavePreferences = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Convert reminder_timing to reminder_time and reminder_days_before
      let reminder_time = "09:00:00";
      let reminder_days_before = 1;
      
      if (preferences.reminder_timing === "day_before") {
        reminder_days_before = 1;
        reminder_time = "09:00:00";
      } else if (preferences.reminder_timing === "morning_of") {
        reminder_days_before = 0;
        reminder_time = "09:00:00";
      } else if (preferences.reminder_timing === "1_hour_before") {
        reminder_days_before = 0;
        reminder_time = "08:00:00"; // Approximate - actual time calculated by cron
      }

      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            push_enabled: isSubscribed,
            email_enabled: preferences.email_enabled,
            email_reports_enabled: preferences.email_reports_enabled,
            maintenance_reminders: preferences.maintenance_reminders,
            parameter_alerts: preferences.parameter_alerts,
            ai_insights: preferences.ai_insights,
            reminder_time: reminder_time,
            reminder_days_before: reminder_days_before,
            quiet_hours_enabled: preferences.quiet_hours_enabled,
            quiet_hours_start: preferences.quiet_hours_start,
            quiet_hours_end: preferences.quiet_hours_end,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) throw error;

      toast.success("Notification preferences saved");
      setHasChanges(false);
    } catch (err) {
      console.error("Error saving preferences:", err);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  // Convert time string to display format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (userLoading || isLoadingPrefs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-5 w-5 text-brand-navy" />
            </Link>
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Fish className="h-6 w-6 text-brand-cyan" />
            <span className="font-bold text-brand-navy">AquaBotAI</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy">Notification Settings</h1>
          <p className="text-gray-600">Manage how and when you receive notifications</p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Push Notifications Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-brand-cyan" />
                <CardTitle>Push Notifications</CardTitle>
              </div>
              <CardDescription>
                Receive instant notifications on this device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Push support status */}
              {!isSupported && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Push notifications are not supported in this browser</span>
                </div>
              )}

              {isSupported && !isConfigured && (
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Push notifications are not configured for this app</span>
                </div>
              )}

              {isSupported && isConfigured && permission === "denied" && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  <BellOff className="h-4 w-4 shrink-0" />
                  <span>
                    Notifications are blocked. Please enable them in your browser settings.
                  </span>
                </div>
              )}

              {isSupported && isConfigured && permission !== "denied" && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-enabled">Enable push notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders and alerts on this device
                      </p>
                    </div>
                    <Switch
                      id="push-enabled"
                      checked={isSubscribed}
                      onCheckedChange={handlePushToggle}
                      disabled={pushLoading}
                    />
                  </div>

                  {isSubscribed && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Push notifications are enabled on this device</span>
                    </div>
                  )}

                  {pushError && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{pushError}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Notification Types Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>Choose what you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-reminders">Maintenance reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Water changes, filter cleaning, and other tasks
                  </p>
                </div>
                <Switch
                  id="maintenance-reminders"
                  checked={preferences.maintenance_reminders}
                  onCheckedChange={(checked) =>
                    updatePreference("maintenance_reminders", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="parameter-alerts">Parameter alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    When water parameters are outside safe ranges
                  </p>
                </div>
                <Switch
                  id="parameter-alerts"
                  checked={preferences.parameter_alerts}
                  onCheckedChange={(checked) =>
                    updatePreference("parameter_alerts", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-insights">AI insights</Label>
                  <p className="text-sm text-muted-foreground">
                    Proactive recommendations from AquaBotAI
                  </p>
                </div>
                <Switch
                  id="ai-insights"
                  checked={preferences.ai_insights}
                  onCheckedChange={(checked) => updatePreference("ai_insights", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reminder Timing Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle>Reminder Timing</CardTitle>
              <CardDescription>When to receive maintenance reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { value: "day_before", label: "Day before", desc: "Get reminded a day ahead" },
                  { value: "morning_of", label: "Morning of", desc: "Get reminded the morning it's due" },
                  { value: "1_hour_before", label: "1 hour before", desc: "Get reminded 1 hour before it's due" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                      preferences.reminder_timing === option.value
                        ? "border-brand-cyan bg-brand-cyan/5"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.desc}</p>
                    </div>
                    <input
                      type="radio"
                      name="reminder_timing"
                      value={option.value}
                      checked={preferences.reminder_timing === option.value}
                      onChange={() =>
                        updatePreference(
                          "reminder_timing",
                          option.value as NotificationPreferences["reminder_timing"]
                        )
                      }
                      className="h-4 w-4 text-brand-cyan focus:ring-brand-cyan"
                    />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>Pause notifications during specific times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="quiet-hours">Enable quiet hours</Label>
                  <p className="text-sm text-muted-foreground">
                    No notifications during your set quiet hours
                  </p>
                </div>
                <Switch
                  id="quiet-hours"
                  checked={preferences.quiet_hours_enabled}
                  onCheckedChange={(checked) =>
                    updatePreference("quiet_hours_enabled", checked)
                  }
                />
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start">Start time</Label>
                    <input
                      id="quiet-start"
                      type="time"
                      value={preferences.quiet_hours_start.slice(0, 5)}
                      onChange={(e) =>
                        updatePreference("quiet_hours_start", e.target.value + ":00")
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatTime(preferences.quiet_hours_start)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end">End time</Label>
                    <input
                      id="quiet-end"
                      type="time"
                      value={preferences.quiet_hours_end.slice(0, 5)}
                      onChange={(e) =>
                        updatePreference("quiet_hours_end", e.target.value + ":00")
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatTime(preferences.quiet_hours_end)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Reports Card - Pro Only */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-brand-cyan" />
                <CardTitle>Email Reports</CardTitle>
                {tier !== "pro" && (
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <Crown className="h-3 w-3" />
                    Pro
                  </span>
                )}
              </div>
              <CardDescription>
                Receive weekly tank health digests via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tier === "pro" ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-reports">Weekly email digest</Label>
                      <p className="text-sm text-muted-foreground">
                        AI-generated health report for all your tanks
                      </p>
                    </div>
                    <Switch
                      id="email-reports"
                      checked={preferences.email_reports_enabled}
                      onCheckedChange={(checked) =>
                        updatePreference("email_reports_enabled", checked)
                      }
                    />
                  </div>

                  <div className="rounded-lg border border-dashed p-4">
                    <div className="flex items-start gap-3">
                      <Send className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Send a test report</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          See what the weekly digest looks like
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSendTestReport}
                          disabled={isSendingReport}
                        >
                          {isSendingReport ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Test Report
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="rounded-full bg-amber-100 p-3 mb-3">
                    <Crown className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upgrade to Pro to receive weekly AI-generated tank health reports via email
                  </p>
                  <Button asChild size="sm">
                    <Link href="/settings/billing">Upgrade to Pro</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/settings">Cancel</Link>
            </Button>
            <Button
              onClick={handleSavePreferences}
              disabled={!hasChanges || isSaving}
              className="bg-brand-cyan hover:bg-brand-cyan/90"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
