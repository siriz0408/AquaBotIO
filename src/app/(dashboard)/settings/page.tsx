"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fish, ArrowLeft, Loader2, User, Bell, CreditCard, Shield, Check, AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/use-user";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, subscription, isLoading: userLoading, refreshProfile } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [unitVolume, setUnitVolume] = useState<"gallons" | "liters">("gallons");
  const [unitTemp, setUnitTemp] = useState<"fahrenheit" | "celsius">("fahrenheit");
  const [skillLevel, setSkillLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setUnitVolume(profile.unit_preference_volume);
      setUnitTemp(profile.unit_preference_temp);
      setSkillLevel(profile.skill_level);
    }
  }, [profile]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [userLoading, user, router]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: fullName.trim() || null,
          unit_preference_volume: unitVolume,
          unit_preference_temp: unitTemp,
          skill_level: skillLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    // For now, just show a message - actual deletion requires backend implementation
    toast.error("Account deletion requires contacting support");
    setShowDeleteConfirm(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const formatTrialEnd = () => {
    if (!subscription?.trial_ends_at) return null;
    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return "Trial expired";
    if (daysLeft === 1) return "1 day left";
    return `${daysLeft} days left`;
  };

  if (userLoading) {
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
            <Link href="/dashboard">
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
          <h1 className="text-3xl font-bold text-brand-navy">Settings</h1>
          <p className="text-gray-600">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Settings */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>Profile</CardTitle>
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      Save
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription>
                Manage your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                ) : (
                  <p className="text-sm">{profile?.full_name || "Not set"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm">{user?.email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skillLevel">Experience Level</Label>
                {isEditing ? (
                  <select
                    id="skillLevel"
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value as typeof skillLevel)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                ) : (
                  <p className="text-sm capitalize">{profile?.skill_level}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium capitalize">{subscription?.tier || "Free"} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.status === "trialing" && formatTrialEnd()}
                    {subscription?.status === "active" && "Active subscription"}
                    {subscription?.status === "canceled" && "Canceled"}
                  </p>
                </div>
                {subscription?.status === "trialing" && (
                  <span className="rounded-full bg-brand-cyan/10 px-3 py-1 text-xs font-medium text-brand-cyan">
                    Trial
                  </span>
                )}
              </div>

              <Button variant="outline" className="w-full" disabled>
                {subscription?.tier === "free" || subscription?.status === "trialing"
                  ? "Upgrade Plan (Coming Soon)"
                  : "Manage Subscription (Coming Soon)"}
              </Button>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>
                Configure your display preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Volume Units</Label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      variant={unitVolume === "gallons" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUnitVolume("gallons")}
                    >
                      {unitVolume === "gallons" && <Check className="mr-1 h-3 w-3" />}
                      Gallons
                    </Button>
                    <Button
                      variant={unitVolume === "liters" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUnitVolume("liters")}
                    >
                      {unitVolume === "liters" && <Check className="mr-1 h-3 w-3" />}
                      Liters
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm capitalize">{profile?.unit_preference_volume}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Temperature Units</Label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      variant={unitTemp === "fahrenheit" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUnitTemp("fahrenheit")}
                    >
                      {unitTemp === "fahrenheit" && <Check className="mr-1 h-3 w-3" />}
                      Fahrenheit
                    </Button>
                    <Button
                      variant={unitTemp === "celsius" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUnitTemp("celsius")}
                    >
                      {unitTemp === "celsius" && <Check className="mr-1 h-3 w-3" />}
                      Celsius
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm capitalize">{profile?.unit_preference_temp}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage push notifications and reminder settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/settings/notifications">
                  Manage Notification Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Security / Danger Zone */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Sign Out
              </Button>

              <Button variant="outline" className="w-full" disabled>
                Change Password (Coming Soon)
              </Button>

              <div className="border-t pt-4">
                <h4 className="mb-2 font-medium text-destructive">Danger Zone</h4>
                {!showDeleteConfirm ? (
                  <Button
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                ) : (
                  <div className="space-y-3 rounded-lg border border-destructive p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <p className="text-sm">
                        This action is permanent. All your tanks, data, and settings will be deleted.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Type DELETE to confirm</Label>
                      <Input
                        id="confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "DELETE"}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
