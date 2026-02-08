# D009: Wireframes as UI/UX Source of Truth

**Date:** 2026-02-08
**Domain:** ui/ux
**Status:** Active

## Context

After Sprint 7, a comprehensive documentation audit compared the Figma wireframe export (`Docs/Wireframes/`) against the actual Next.js implementation. The wireframes contain 43 files covering every screen, color, spacing, and interaction pattern.

## Decision

The `Docs/Wireframes/` directory is the **source of truth** for all UI/UX decisions. A new canonical spec (`15_UI_UX_Design_System.md`) was created to distill the wireframe patterns into actionable guidelines.

## Key Findings

### What Matches
- Bottom tab bar (5 tabs, mobile-only)
- Floating chat button (mobile-only, above tab bar)
- Mobile-first responsive design with `md:` breakpoint
- Safe area insets for iOS
- Dark mode support (class-based)
- Card patterns, badge styles, bottom sheet modals

### What Drifted
- Navy color: `#0A2540` (impl) vs `#0A2463` (wireframe)
- Primary accent: Cyan `#00B4D8` (impl) vs Teal `#1B998B` (wireframe)
- Background: `#F8FAFC` (impl) vs `#F0F4F8` (wireframe)

## Action Items
1. Align color palette to wireframe in Sprint 8
2. Consult `15_UI_UX_Design_System.md` for all future UI work
3. When wireframe and implementation disagree, wireframe wins (unless documented exception)

## Alternatives Considered
- Keep current colors: Rejected — wireframes represent intentional design
- Create a new design system from scratch: Rejected — wireframes are comprehensive
