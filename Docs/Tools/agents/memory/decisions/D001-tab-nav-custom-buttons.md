# Tank Detail: Custom Button Tabs Over shadcn/ui Tabs
D001 | 2026-02-08 | Impact: LOW | Status: ACTIVE | Domain: ui

**Summary:** Used custom button-based tabs instead of shadcn/ui Tabs for tank detail sub-navigation.

**Details:** shadcn/ui TabsTrigger's `asChild` pattern doesn't work well with Next.js Link components, causing navigation issues. Custom buttons styled as tabs with pathname-based active state work better.

**Action:** Use `usePathname()` + `pathname?.includes("/parameters")` pattern for tab active state. Reuse this pattern for any page with sub-navigation.

**Links:** File: `src/app/(dashboard)/tanks/[id]/page.tsx`
