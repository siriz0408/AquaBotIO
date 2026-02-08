# Column Name Mismatch Between water_parameters and parameter_thresholds
B004 | 2026-02-08 | Impact: MEDIUM | Status: OPEN | Domain: db

**Summary:** `water_parameters` uses `gh_dgh`/`kh_dgh`/`salinity` but `parameter_thresholds` uses `gh_ppm`/`kh_ppm`/`salinity_ppt`.

**Details:** The two tables use inconsistent naming for the same parameters. A runtime mapping (`thresholdTypeMap`) was added in the trend analysis endpoint to translate between them. Should be aligned in a future migration.

**Action:** Add migration to rename columns for consistency. For now, runtime mapping handles it.

**Links:**
- File: `src/app/api/ai/trend-analysis/route.ts`
- Related: B003 (similar naming issue)
