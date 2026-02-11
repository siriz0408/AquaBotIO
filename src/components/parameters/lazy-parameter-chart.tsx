"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/skeleton";

// Lazy load the ParameterChart component which uses Recharts
// This prevents Recharts (~100KB) from being included in the initial bundle
const ParameterChart = dynamic(
  () => import("./parameter-chart").then((mod) => ({ default: mod.ParameterChart })),
  {
    loading: () => <ChartSkeleton height={200} />,
    ssr: false,
  }
);

// Re-export the lazy-loaded component
export { ParameterChart as LazyParameterChart };
