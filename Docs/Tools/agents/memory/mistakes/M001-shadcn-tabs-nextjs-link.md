# shadcn/ui Tabs Don't Work With Next.js Link
M001 | 2026-02-08 | Impact: LOW | Status: RESOLVED | Domain: ui

**Summary:** Attempted to use shadcn/ui TabsTrigger with `asChild` and Next.js Link, causing navigation issues.

**Details:** TabsTrigger's `asChild` pattern doesn't compose well with Next.js Link components. Tab selection and URL navigation get out of sync.

**Action:** Use custom button-based tabs with Link components for page-level navigation. Reserve shadcn/ui Tabs for in-page content switching only.

**Links:** Decision: `D001-tab-nav-custom-buttons.md`
