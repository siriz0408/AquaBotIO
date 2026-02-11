# Sprint 28 Summary

**Date:** February 11, 2026
**Goal:** Species database images & external API integration
**Status:** Complete

## What Was Built

### Species Image System
- **External image support:** Added `unoptimized` prop to Next.js Image components for GBIF/iNaturalist URLs
- **Domain configuration:** Updated `next.config.mjs` with remote patterns for external image hosts
- **Image fetch scripts:** Created `scripts/fetch-species-images.ts` and `scripts/fetch-remaining-images.ts` for GBIF API integration

### Image Coverage
- **191/195 species** (97.9%) now have real photos from GBIF
- Images sourced from iNaturalist, Natural History Museum, Wikimedia
- Remaining 4 species without images are obscure varieties

### Components Updated
1. `src/components/species/species-card.tsx` - Added unoptimized prop
2. `src/components/species/species-detail-modal.tsx` - Added unoptimized prop
3. `src/components/chat/messages/species-card.tsx` - Added unoptimized prop

## Files Changed

### Modified
- `next.config.mjs` — Added image remote patterns for GBIF domains
- `src/components/species/species-card.tsx` — unoptimized prop for external images
- `src/components/species/species-detail-modal.tsx` — unoptimized prop for external images
- `src/components/chat/messages/species-card.tsx` — unoptimized prop for external images

### Created
- `scripts/fetch-species-images.ts` — GBIF image fetcher by scientific name
- `scripts/fetch-remaining-images.ts` — Secondary fetcher for missing images

## Metrics
- Files modified: 4
- Files created: 2
- Species with images: 191/195 (97.9%)
- Console errors: 0 (was 18 before fix)
- Build: Pass

## Technical Decisions

### D028-1: Use `unoptimized` for External Images
**Decision:** Use Next.js Image with `unoptimized={true}` for external GBIF URLs instead of configuring every possible domain.

**Rationale:** GBIF images come from dozens of sources (iNaturalist, museums, universities). Adding every domain is impractical. `unoptimized` bypasses Next.js image optimization but still provides the Image component benefits (lazy loading, sizing).

**Trade-off:** Slightly larger file sizes (no optimization) but full compatibility with any GBIF image source.

## What Sam Should Test
1. **Species page:** Visit /species and scroll through cards - should see real fish/plant/coral photos
2. **Species detail:** Click any card - modal should show large image without errors
3. **Console:** No "Invalid src prop" errors should appear
4. **Coral species:** Filter by coral type - should show coral images

## Cumulative Sprint 27+28 Results
- **Total species:** 94+ seeded with comprehensive data
- **Image coverage:** 97.9% with real GBIF photos
- **New types:** Coral support added throughout UI
- **Card info:** Temperature and pH ranges now displayed
- **AI integration:** Species tools added to AI chat (Sprint 27)

## Next Sprint Recommendations
Sprint 29 should focus on:
1. **AI Proactive Intelligence (Spec 17)** — Begin trend detection and alert system
2. **AI Chat Embedded Widgets (Spec 16)** — Water change calculator, parameter troubleshooter
3. **Mobile testing** — Verify species page performance on mobile devices
