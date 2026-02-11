# Sprint 27 Summary

**Date:** February 11, 2026
**Goal:** Species cards revamp with coral support
**Status:** Complete

## What Was Built

### Species Cards Enhancement
- **Expanded card info:** Added temperature range and pH range to species cards (was only showing max size and min tank)
- **Coral support:** Added coral type with emoji throughout the UI

### Coral Type Support
- **Filter button:** Added coral filter option in species filters
- **Type handling:** Species detail modal now handles coral compatibility with reef/saltwater tanks
- **Database:** Migration to add 'coral' to species type constraint

### Coral Species Data
- **15 seeded corals:** Mix of beginner to expert corals
  - Soft corals: Green Star Polyps, Pulsing Xenia, Toadstool Leather, Kenya Tree, Mushroom
  - LPS: Hammer, Torch, Frogspawn, Duncan, Candy Cane, Chalice
  - SPS: Acropora, Montipora, Stylophora, Birds Nest

## Files Changed

### Modified
- `src/components/species/species-card.tsx` — Added coral emoji, temp/pH ranges to quick stats
- `src/components/species/species-detail-modal.tsx` — Coral emoji, tank compatibility for reef/saltwater
- `src/components/species/species-filters.tsx` — Coral filter option
- `src/types/database.ts` — Added "coral" to Species type union

### Created
- `supabase/migrations/20260211100000_add_coral_species_type.sql` — Database constraint update
- `supabase/migrations/20260211100001_seed_coral_species.sql` — 15 coral species data

## Metrics
- Files modified: 4
- Files created: 2
- Lint: Pass
- Typecheck: Pass
- Build: Pass

## Feedback Addressed
- FB-MLH5K7N7 (Feature: Species cards need images and coral support) → Addressed
  - Note: Actual species images require image sourcing/licensing decisions. Cards now show more data.

## What Sam Should Test
1. **Species page:** Visit /species and verify coral filter button appears
2. **Coral filter:** Click the coral filter (🪸) — should work but show empty until migrations run
3. **Species cards:** Cards should now show 4 stats (max size, min tank, temp range, pH range)
4. **Apply migrations:** Run `npx supabase db push` to add coral species
5. **Coral data:** After migration, coral filter should show 15 corals

## Next Sprint Recommendations
Sprint 28 should focus on:
1. **Species image sourcing** — Research free/licensed aquarium images (Unsplash, WikiCommons)
2. **AI Onboarding Wizard (FB-MLH5PN6K)** — Begin questionnaire design
3. **Daily AI coaching (FB-MLH5MQTR)** — Design notification triggers
