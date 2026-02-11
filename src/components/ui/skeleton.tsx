"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      style={style}
    />
  );
}

// Pre-built skeleton patterns for common components

export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function ParameterCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm min-w-[140px] flex-shrink-0 space-y-2">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-2 w-2 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

export function ParameterCardsSkeleton() {
  return (
    <div className="px-4">
      <Skeleton className="h-6 w-36 mb-3" />
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {[...Array(5)].map((_, i) => (
          <ParameterCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function TankHeaderSkeleton() {
  return (
    <div className="bg-gradient-to-br from-brand-navy to-brand-teal p-6 text-white">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-48 bg-white/20" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-24 rounded-full bg-white/20" />
            <Skeleton className="h-5 w-20 bg-white/20" />
          </div>
        </div>
        <Skeleton className="h-16 w-16 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="bg-muted/30 rounded-lg flex items-end justify-center p-4 gap-1"
      style={{ height }}
    >
      {/* Simulated bar chart bars */}
      {[40, 65, 45, 80, 55, 70, 50, 60, 75, 45].map((h, i) => (
        <Skeleton
          key={i}
          className="w-4 rounded-t-sm"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3">
      <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function LivestockItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* TopBar skeleton */}
      <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Tank Header */}
      <TankHeaderSkeleton />

      {/* Content */}
      <div className="flex-1 container max-w-6xl py-6 space-y-6">
        <ParameterCardsSkeleton />

        {/* Quick Actions */}
        <div className="px-4">
          <Skeleton className="h-6 w-28 mb-3" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <CardSkeleton key={i} className="h-24" />
            ))}
          </div>
        </div>

        {/* Maintenance */}
        <div className="px-4 space-y-3">
          <Skeleton className="h-6 w-40" />
          {[...Array(3)].map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TankListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SpeciesGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
