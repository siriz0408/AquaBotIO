"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/admin/data-table";
import { useAdminUsers } from "@/lib/hooks/use-admin";
import { cn } from "@/lib/utils";
import type { AdminUserView, UserTier, UserStatus, UserSearchParams } from "@/lib/types/admin";

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

export default function AdminUsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<UserSearchParams>({
    page: 1,
    limit: 25,
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Update filters and trigger search
  const updateFilters = useCallback((newFilters: Partial<UserSearchParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  // Build search params
  const searchParams: UserSearchParams = {
    ...filters,
    query: searchQuery || undefined,
  };

  const { users, isLoading } = useAdminUsers(searchParams);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ query: searchQuery });
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Table columns
  const columns: Column<AdminUserView>[] = [
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (user) => (
        <div>
          <span className="text-white font-medium">{user.email}</span>
          {user.display_name && (
            <span className="block text-xs text-slate-500">{user.display_name}</span>
          )}
        </div>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (user) => (
        <Badge
          className={cn(
            "border-0",
            tierColors[user.subscription?.tier || "free"]
          )}
        >
          {user.subscription?.tier || "free"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <Badge className={cn("border-0", statusColors[user.status])}>
          {user.status}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Signed Up",
      sortable: true,
      render: (user) => (
        <span className="text-slate-400">{formatDate(user.created_at)}</span>
      ),
    },
    {
      key: "last_login",
      header: "Last Active",
      sortable: true,
      render: (user) => (
        <span className="text-slate-400">{formatDate(user.last_login)}</span>
      ),
    },
  ];

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      page: 1,
      limit: 25,
      sort_by: "created_at",
      sort_order: "desc",
    });
  };

  const hasActiveFilters = filters.tier || filters.status || filters.start_date || filters.end_date;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-slate-400 mt-1">
          Search and manage user accounts
        </p>
      </div>

      {/* Search and filters */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email or name..."
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-brand-cyan"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "border-slate-700",
              showFilters || hasActiveFilters
                ? "bg-brand-cyan/10 border-brand-cyan text-brand-cyan"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 h-2 w-2 rounded-full bg-brand-cyan" />
            )}
          </Button>
          <Button
            type="submit"
            className="bg-brand-teal hover:bg-brand-teal/90 text-white"
          >
            Search
          </Button>
        </form>

        {/* Filter panel */}
        {showFilters && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-300">Filters</span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Tier filter */}
              <div>
                <label className="block text-xs text-slate-500 mb-2">Tier</label>
                <div className="flex flex-wrap gap-2">
                  {(["free", "starter", "plus", "pro"] as UserTier[]).map((tier) => (
                    <Button
                      key={tier}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateFilters({ tier: filters.tier === tier ? undefined : tier })
                      }
                      className={cn(
                        "border-slate-700 capitalize",
                        filters.tier === tier
                          ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      {tier}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-xs text-slate-500 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(["active", "suspended", "banned"] as UserStatus[]).map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateFilters({ status: filters.status === status ? undefined : status })
                      }
                      className={cn(
                        "border-slate-700 capitalize",
                        filters.status === status
                          ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div>
                <label className="block text-xs text-slate-500 mb-2">Signed up after</label>
                <Input
                  type="date"
                  value={filters.start_date || ""}
                  onChange={(e) => updateFilters({ start_date: e.target.value || undefined })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-2">Signed up before</label>
                <Input
                  type="date"
                  value={filters.end_date || ""}
                  onChange={(e) => updateFilters({ end_date: e.target.value || undefined })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      {users && (
        <div className="text-sm text-slate-500">
          Showing {users.data.length} of {users.total} users
        </div>
      )}

      {/* Users table */}
      <DataTable
        columns={columns}
        data={users?.data || []}
        keyExtractor={(user) => user.id}
        onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
        sortable
        isLoading={isLoading}
        emptyMessage="No users found"
        pagination={
          users
            ? {
                page: users.page,
                totalPages: users.total_pages,
                onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
              }
            : undefined
        }
      />
    </div>
  );
}
