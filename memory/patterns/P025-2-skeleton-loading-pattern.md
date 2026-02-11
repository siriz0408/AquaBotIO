# P025-2: Skeleton Loading Pattern

**Sprint:** 25
**Discovered by:** Frontend Engineer

## What
Create pre-built skeleton components for each UI pattern (cards, charts, lists) and use them as loading states with dynamic imports.

## When to Use
- Any component that loads data asynchronously
- Heavy components that should be lazy loaded (charts, modals)
- Dashboard pages with multiple loading sections

## Example
```typescript
// 1. Create skeleton component
export function ChartSkeleton() {
  return (
    <div className="h-[200px] flex items-end gap-1">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 70}%` }} />
      ))}
    </div>
  );
}

// 2. Use with dynamic import
const ParameterChart = dynamic(
  () => import("./parameter-chart").then((mod) => ({ default: mod.ParameterChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
```

## Where Applied
- `src/components/ui/skeleton.tsx` — Base + 13 pre-built patterns
- `src/components/parameters/lazy-parameter-chart.tsx` — Chart lazy loading
