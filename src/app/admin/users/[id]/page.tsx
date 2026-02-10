"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  Fish,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  User,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminUserDetail } from "@/lib/hooks/use-admin";
import { cn } from "@/lib/utils";
import type { UserTier, UserStatus } from "@/lib/types/admin";

const tierColors: Record<UserTier, string> = {
  free: "bg-slate-600 text-slate-200",
  starter: "bg-brand-cyan-light/20 text-brand-cyan-light",
  plus: "bg-brand-cyan/20 text-brand-cyan",
  pro: "bg-brand-teal/20 text-brand-teal",
};

const statusColors: Record<UserStatus, string> = {
  active: "bg-brand-teal/20 text-brand-teal",
  suspended: "bg-brand-warning/20 text-brand-warning",
  banned: "bg-brand-alert/20 text-brand-alert",
  deleted: "bg-slate-700 text-slate-400",
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { user, isLoading, error } = useAdminUserDetail(userId);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format short date
  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-700 rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-700/50 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse" />
            <div className="h-64 bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse" />
            <div className="h-48 bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-brand-alert mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">User Not Found</h2>
        <p className="text-slate-400 mb-4">{error || "The requested user could not be found."}</p>
        <Button onClick={() => router.push("/admin/users")}>
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/users")}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* Placeholder for impersonation - Phase 2 */}
          <Button
            variant="outline"
            className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
            disabled
            title="Coming in Phase 2"
          >
            <User className="h-4 w-4 mr-2" />
            View as User
          </Button>
        </div>
      </div>

      {/* User header */}
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-brand-cyan/20 text-brand-cyan">
          <User className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {user.display_name || user.email.split("@")[0]}
            </h1>
            <Badge className={cn("border-0", tierColors[user.subscription?.tier || "free"])}>
              {user.subscription?.tier || "free"}
            </Badge>
            <Badge className={cn("border-0", statusColors[user.status])}>
              {user.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {user.email}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {formatShortDate(user.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Last active {formatDate(user.last_login)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account info */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider">User ID</label>
                  <p className="text-sm text-slate-300 font-mono">{user.id}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Auth Method</label>
                  <p className="text-sm text-slate-300 capitalize">{user.auth_method}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Created At</label>
                  <p className="text-sm text-slate-300">{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Last Login</label>
                  <p className="text-sm text-slate-300">{formatDate(user.last_login)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tanks */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Fish className="h-5 w-5 text-brand-cyan" />
                Tanks ({user.tanks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.tanks.length === 0 ? (
                <p className="text-slate-500 text-sm">No tanks created</p>
              ) : (
                <div className="space-y-3">
                  {user.tanks.map((tank) => (
                    <div
                      key={tank.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{tank.name}</p>
                        <p className="text-xs text-slate-500">
                          {tank.type} - {tank.volume} {tank.volume_unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Last logged</p>
                        <p className="text-xs text-slate-400">
                          {formatShortDate(tank.last_parameter_log_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Conversations */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand-cyan" />
                Recent AI Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.recent_conversations.length === 0 ? (
                <p className="text-slate-500 text-sm">No conversations</p>
              ) : (
                <div className="space-y-3">
                  {user.recent_conversations.map((convo) => (
                    <div
                      key={convo.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {convo.topic || "Untitled conversation"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {convo.message_count} messages - {convo.model_used}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          {formatShortDate(convo.updated_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-cyan" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.subscription ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Plan</span>
                    <Badge className={cn("border-0", tierColors[user.subscription.tier])}>
                      {user.subscription.tier}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Status</span>
                    <span className="text-sm text-white capitalize">
                      {user.subscription.status}
                    </span>
                  </div>
                  {user.subscription.trial_end_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Trial Ends</span>
                      <span className="text-sm text-white">
                        {formatShortDate(user.subscription.trial_end_date)}
                      </span>
                    </div>
                  )}
                  {user.subscription.current_period_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Renews</span>
                      <span className="text-sm text-white">
                        {formatShortDate(user.subscription.current_period_end)}
                      </span>
                    </div>
                  )}
                  {user.subscription.stripe_customer_id && (
                    <div className="pt-3 border-t border-slate-700">
                      <a
                        href={`https://dashboard.stripe.com/customers/${user.subscription.stripe_customer_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-brand-cyan hover:text-brand-cyan/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View in Stripe
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500 text-sm">No subscription</p>
              )}
            </CardContent>
          </Card>

          {/* Usage stats */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Tanks</span>
                <span className="text-sm text-white">{user.usage.total_tanks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">AI Messages (30d)</span>
                <span className="text-sm text-white">{user.usage.ai_messages_last_30_days}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total AI Messages</span>
                <span className="text-sm text-white">{user.usage.total_ai_messages}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Tokens Consumed</span>
                <span className="text-sm text-white">
                  {user.usage.total_tokens_consumed.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Est. Cost</span>
                <span className="text-sm text-white">
                  ${user.usage.estimated_cost.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions - placeholder for Phase 2 */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                disabled
              >
                Change Tier (Phase 2)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                disabled
              >
                Extend Trial (Phase 2)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-slate-700 text-brand-warning hover:bg-brand-warning/10 hover:text-brand-warning"
                disabled
              >
                Suspend User (Phase 2)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
