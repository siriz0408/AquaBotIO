# Sprint 25 Plan — Performance + Landing Page + Tank UX

**Date:** February 11, 2026
**Status:** In Progress
**Goal:** Fix site performance, redesign landing page, improve tank edit experience

---

## Sprint Summary

Addressing Sam's top feedback items:
1. **FB-MLH54PQ4 (Bug):** Site loads slow — needs performance profiling and fixes
2. **FB-MLH50G4L (Other):** Landing page needs revamp — hero section, centering, value prop
3. **FB-MLH5FZFB (Feature):** Tank management UX — add photo upload to edit form

These are all user-facing improvements that build on the MVP completion.

---

## Task Breakdown

### Task 1: Performance Optimization (FB-MLH54PQ4)
**Agent:** Backend + Frontend (parallel)
**Priority:** P1
**Effort:** 0.5 sprint

**Problem:**
The site feels slow. Need to identify bottlenecks:
- Bundle size
- Supabase query waterfalls
- Unoptimized images
- Missing code splitting
- No caching

**Backend Scope:**
1. Profile API routes for slow queries
2. Add database query optimization (indexes, select only needed columns)
3. Review Supabase calls for N+1 queries
4. Add caching headers where appropriate

**Frontend Scope:**
1. Analyze bundle size with `next build --analyze`
2. Add dynamic imports for heavy components (charts, modals)
3. Implement image optimization with next/image
4. Add loading states/skeletons for perceived performance
5. Review component re-renders

**Success Criteria:**
- Bundle size reduced (measure before/after)
- No visible jank on page transitions
- Dashboard loads in < 2 seconds

---

### Task 2: Landing Page Redesign (FB-MLH50G4L)
**Agent:** Frontend Engineer
**Priority:** P1
**Effort:** 0.5 sprint

**Problem:**
Current landing page isn't centered, needs better hero section and value proposition.

**Fix:**
1. Create new hero section with:
   - Centered layout
   - Compelling headline ("Your AI Aquarium Assistant")
   - Subheadline with value prop
   - CTA buttons (Get Started, Learn More)
   - Tank/fish visual element
2. Add features section with 3-4 key benefits
3. Add social proof section (testimonials placeholder)
4. Add pricing preview section (link to full pricing)
5. Improve footer with links
6. Ensure mobile-responsive

**Design Reference:**
- Follow `15_UI_UX_Design_System.md` for colors and typography
- Use brand colors: Aqua Primary (#0891B2), Deep Blue (#1E3A5F)
- Modern, clean aesthetic

**Files:**
- `src/app/page.tsx` (main landing page)
- `src/components/landing/` (new components)

**Success Criteria:**
- Page is centered and responsive
- Hero section is compelling
- Clear value proposition visible above fold
- Smooth scrolling to sections

---

### Task 3: Tank Edit Form Improvements (FB-MLH5FZFB)
**Agent:** Frontend Engineer
**Priority:** P1
**Effort:** 0.5 sprint

**Problem:**
Tank edit form is missing key fields and there's no way to add/change tank photo.

**Fix:**
1. Add photo upload to tank edit form:
   - Use existing `tank-photos` Storage bucket
   - Image preview before save
   - Delete/replace existing photo
2. Add missing tank fields:
   - Setup date (when tank was established)
   - Substrate type (dropdown: sand, gravel, bare bottom, soil, etc.)
   - Notes field (free text for user notes)
3. Improve form UX:
   - Better field grouping
   - Validation feedback
   - Save confirmation

**Files:**
- `src/app/(dashboard)/tanks/[id]/edit/page.tsx` (or similar)
- `src/components/tanks/tank-form.tsx`
- May need migration for new columns

**Success Criteria:**
- Can upload/change tank photo from edit form
- New fields save correctly
- Form is intuitive and well-organized

---

## Agent Assignments

| Agent | Tasks | Key Files |
|-------|-------|-----------|
| Frontend | Performance (bundle), Landing Page, Tank Form | `app/page.tsx`, `components/landing/`, `components/tanks/` |
| Backend | Performance (queries, caching) | `app/api/`, `lib/`, query optimization |

---

## Dependencies

- All tasks can run in parallel
- Tank photo upload depends on `tank-photos` bucket (should exist from Sprint 23)

---

## Testing Instructions

### Performance:
1. Run Lighthouse audit before/after
2. Check Network tab for waterfall
3. Test on throttled connection (3G)

### Landing Page:
1. View on desktop and mobile
2. Check all links work
3. Verify CTAs navigate correctly

### Tank Edit:
1. Edit existing tank
2. Upload new photo
3. Add substrate and notes
4. Save and verify persistence

---

## Memory Report (To Be Filled)

### Bugs Found
- (To be filled by agents)

### Decisions Made
- (To be filled by agents)

### Patterns Discovered
- (To be filled by agents)

### Mistakes Made
- (To be filled by agents)

---

*Sprint plan created by PM Orchestrator based on Sam's feedback (6 pending items, 3 prioritized for Sprint 25).*
