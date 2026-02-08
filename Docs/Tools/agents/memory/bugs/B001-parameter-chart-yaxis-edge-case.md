# Parameter Chart Y-Axis Edge Case
B001 | 2026-02-08 | Impact: LOW | Status: RESOLVED | Domain: ui

**Summary:** Parameter chart Y-axis domain calculation failed with single data point or identical values.

**Details:** When all parameter values were identical or only one data point existed, the padding calculation produced NaN or zero range, breaking the chart render.

**Action:** Fixed padding calculation: `const padding = range > 0 ? range * 0.1 : Math.max(1, Math.abs(minValue) * 0.1 || 1);`

**Links:** File: `src/components/parameters/parameter-chart.tsx`
