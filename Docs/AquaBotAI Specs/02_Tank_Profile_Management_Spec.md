# Tank Profile Management — Feature Specification

**Aquatic AI | R-002 | P0 — Must-Have**

## Problem Statement

Every feature in Aquatic AI depends on knowing the user's tank — type, size, inhabitants, and setup. Without a structured tank profile, the AI cannot provide personalized advice, parameter analysis is meaningless, and livestock compatibility checks are impossible. Tank profiles are the foundational data layer that makes the entire product intelligent.

## Goals

- Enable users to create a complete tank profile in under 2 minutes
- Support multiple tank types: freshwater, saltwater, reef, brackish
- Multi-tank support gated by subscription tier (1 for Starter, 5 for Plus, unlimited for Pro)
- Allow one-click/tap switching between tanks throughout the app
- Provide the AI with structured tank context for all downstream features

## Non-Goals

- NG1: Tank sharing/collaboration between users — single-user only in v1
- NG2: Automatic tank setup detection from photos — manual entry only
- NG3: Tank templates or presets — users configure from scratch (templates are P2)
- NG4: Integration with aquarium retailers for pre-configured setups

## User Stories

- **US-1:** As a new user, I want to create my first tank profile during onboarding by entering its name, type, volume, and setup date, so that the AI has enough context to start helping me.

- **US-2:** As a user with multiple tanks, I want to add additional tank profiles and switch between them with one click, so that I can manage all my aquariums in one place.

- **US-3:** As a user, I want to edit my tank profile (rename, update volume, change photo), so that it stays accurate as my setup evolves.

- **US-4:** As a user, I want to delete a tank profile I no longer need, with a confirmation step, so that I can keep my account clean.

- **US-5:** As a user, I want to upload a photo of my tank, so that the profile feels personal and I can track visual changes over time.

- **US-6:** As a Starter-tier user trying to create a second tank, I want to see a clear upgrade prompt explaining which tier supports more tanks, so I understand the value of upgrading.

## Requirements

### Must-Have (P0)

#### R-002.1: Create Tank Profile

**Description:** Users can create a new tank profile with essential and optional information.

**Fields:**
- **name** (required) — Tank identifier, e.g., "Living Room 30g", max 100 characters
- **type** (required) — One of: freshwater, saltwater, reef, brackish
- **volume** (required) — Capacity in gallons or liters; user-selectable unit preference
- **dimensions** (optional) — Length x Width x Height (inches or cm)
- **substrate** (optional) — e.g., sand, gravel, bare bottom, soil
- **setup_date** (optional) — When the tank was established (date picker)
- **photo** (optional) — Tank image (see R-002.6)

**Acceptance Criteria:**
- Given a new user, they can create a tank profile with name, type, and volume in under 2 minutes
- Given required fields are empty, the form shows inline validation errors (red border + error message)
- Given valid input, the tank profile is saved to the database and user is redirected to tank dashboard
- Given a user submits with missing required fields, a summary error appears at the top of the form

**Design Notes:**
- Single-page form with field grouping for clarity
- Smart defaults: unit selection persists per user preference
- Suggested types are presented as radio buttons or select dropdown
- Volume field accepts numeric input with unit toggle (gal / L)

---

#### R-002.2: Edit Tank Profile

**Description:** Users can modify any field of an existing tank profile.

**Acceptance Criteria:**
- Given a user edits their tank name, the change is reflected immediately across the app (chat context, dashboard header, tank switcher)
- Given a user updates the type or volume, parameter interpretations update accordingly
- Given a user changes a photo, the old one is replaced and storage is cleaned up
- All edits are recorded with timestamps (for future audit/timeline feature)

**Design Notes:**
- Edit form is modal or inline editing; reuse same validation as R-002.1
- Auto-save or explicit save button — recommend explicit to avoid accidental changes
- Display confirmation toast on successful update

---

#### R-002.3: Delete Tank Profile

**Description:** Users can delete a tank profile with safeguards.

**Acceptance Criteria:**
- Given a user clicks delete, a confirmation dialog appears listing:
  - Tank name and type
  - Count of associated data that will be removed (e.g., "8 parameter readings, 12 chat messages, 3 livestock records")
  - Clear confirmation button with warning text in red
- Given a user confirms deletion, the tank and all associated data are soft-deleted (deleted_at timestamp set, not removed from DB)
- Given a user cancels, no changes are made
- Soft-deleted tanks are removed from UI but retained in DB for 90 days before hard-delete via background job

**Design Notes:**
- Use a warning/danger dialog pattern (red border, warning icon)
- Include undo option for 30 seconds after deletion (via toast notification)
- If this is the user's last tank, show message: "Your account will be tank-less. You can create a new one anytime."

---

#### R-002.4: Multi-Tank Support

**Description:** Users can manage multiple tanks, limited by subscription tier.

**Tank Limits by Tier:**
- Starter: 1 tank
- Plus: 5 tanks
- Pro: Unlimited tanks

**Acceptance Criteria:**
- Given a Starter user with 1 tank attempts to create a second, they see a modal upgrade prompt:
  - Headline: "Upgrade to manage multiple tanks"
  - Show comparison: Starter (1) vs Plus (5) vs Pro (unlimited)
  - Call-to-action: "View Plans" button
- Given a Plus user with 5 tanks tries to create a 6th, they see an upgrade prompt to Pro
- Given a Pro user, no limit is enforced; they can create as many tanks as needed
- The "Add Tank" button is disabled with a tooltip explaining the limit if tier is at capacity

**Design Notes:**
- Fetch user's subscription tier from auth/billing system
- Return clear 403 Forbidden error from backend if limit is exceeded
- Upgrade prompt is modal and modal links to billing/pricing page

---

#### R-002.5: Tank Switching

**Description:** Users can quickly switch between their tanks from any screen.

**Acceptance Criteria:**
- Given a user has multiple tanks, a tank selector is visible in the global navigation (top header or sidebar)
- Tank selector displays current tank name and type icon
- Given a user clicks/taps the selector, a dropdown menu or modal lists all tanks with:
  - Tank name
  - Tank type icon (freshwater droplet, saltwater wave, etc.)
  - Tank volume (e.g., "30g freshwater")
- Given a user selects a different tank:
  - Selected tank becomes active
  - All views (dashboard, chat context, parameters, livestock) update to show data for selected tank within 1 second
  - Tank selector updates to show newly selected tank
  - URL path updates (e.g., `/tank/:id/dashboard`)
- Switching tanks triggers an app state update (e.g., Redux action, React Context, Supabase subscription change)

**Design Notes:**
- Tank switcher should be sticky/always visible (header) for easy access
- Show a visual indicator (highlight, checkmark) on the currently selected tank
- Smooth transition when switching (loading state optional if fetching data)
- Mobile: switcher can be a dropdown in the header or collapsible menu

---

#### R-002.6: Tank Photo Upload

**Description:** Users can upload and store a photo of their tank.

**Technical Specs:**
- Accepted formats: JPEG, PNG
- Max file size: 5 MB
- Storage: Supabase Storage bucket (e.g., `tank-photos`)
- Naming: `{user_id}/{tank_id}/{timestamp}.{ext}`
- Returned: Public URL via Supabase Storage

**Acceptance Criteria:**
- Given a user selects a valid image (JPEG/PNG, <5MB), it uploads and displays as the tank profile photo
- Given an image exceeds 5MB, error message: "Image too large. Max 5MB."
- Given an invalid format is uploaded, error message: "Invalid format. Please upload JPG or PNG."
- Given a photo is successfully uploaded, a thumbnail appears in the tank profile and tank switcher
- Given a user uploads a new photo, the old one is deleted from storage and the new one replaces it
- Given a user deletes a tank (R-002.3), the associated photo is deleted from storage

**Design Notes:**
- Drag-and-drop upload area or file input button
- Show upload progress bar (Supabase client provides progress events)
- Image preview before final save
- Option to remove/clear photo without uploading a new one

---

### Nice-to-Have (P1)

#### R-002.7: Tank Setup Wizard

**Description:** Step-by-step guided creation flow for new users.

**Flow:**
1. **Step 1: Tank Basics** — Name and type (freshwater/saltwater/reef/brackish)
2. **Step 2: Size** — Volume in gallons or liters with a visual reference ("About the size of a bookshelf")
3. **Step 3: Setup Details** — Dimensions, substrate, setup date (optional)
4. **Step 4: Photo** — Upload a tank photo (optional, can skip)
5. **Step 5: Confirm** — Review and create

**Features:**
- Contextual help text for each step
- Progress indicator (e.g., "Step 2 of 5")
- Back/Next buttons with validation
- Skip option for optional steps

---

#### R-002.8: Tank Cloning

**Description:** Duplicate an existing tank profile as a template for a new setup.

**Features:**
- "Clone Tank" button on tank detail view
- Cloning copies all fields except name (appends " (Copy)" to name)
- User can edit cloned fields before saving
- Useful for users setting up similar tanks (e.g., multiple betta tanks)

---

### Future Considerations (P2)

#### R-002.9: Tank Templates

**Description:** Pre-configured templates for common aquarium setups to speed up profile creation.

**Example Templates:**
- 10-gallon betta tank (freshwater)
- 55-gallon community tank (freshwater)
- 75-gallon reef tank (saltwater, reef)
- Nano 20L reef (saltwater, reef)

**Features:**
- Template selection during onboarding or "Create Tank" flow
- Auto-populate type, recommended volume, and substrate
- User can override any field

---

#### R-002.10: Tank Timeline

**Description:** Visual history of tank changes, additions, and significant events.

**Features:**
- Timeline view showing:
  - Tank creation date
  - Profile edits with before/after values
  - Livestock additions/removals
  - Parameter milestones (first reading, spike events)
  - AI-generated recommendations applied
- Searchable and filterable by event type
- Export timeline as PDF

---

## Success Metrics

### Leading Indicators (days to weeks)

- **Onboarding Completion Rate:** > 70% of new signups create at least one tank profile
- **Time to First Tank:** Median time from starting creation to saved profile < 2 minutes
- **Multi-Tank Adoption:** > 30% of Plus/Pro users create 2+ tanks within 30 days of tier upgrade
- **Form Abandonment Rate:** < 15% of users who start tank creation abandon before completion

### Lagging Indicators (weeks to months)

- **Profile Completeness:** > 60% of tanks have all optional fields (dimensions, substrate, setup_date, photo) filled within 60 days
- **Upgrade Conversion:** > 5% of Starter users who hit the 1-tank limit convert to Plus/Pro within 7 days
- **Active Multi-Tank Users:** > 20% of all active users (DAU) actively manage 2+ tanks weekly

### Engagement Metrics

- **Tank Switcher Usage:** Average daily tank switches per multi-tank user
- **Edit Frequency:** Percentage of tanks edited within first 30 days (indicates engagement/refinement)
- **Photo Upload Rate:** > 40% of tanks include a user-uploaded photo

---

## Decisions (Resolved)

- ✅ Tank templates: Include 5-7 preset templates (10-gallon freshwater community, 20-gallon planted, 55-gallon cichlid, 75-gallon reef, nano reef, betta tank, shrimp tank). Templates pre-fill tank type, volume, and suggest starter species. P1 feature.
- ✅ Unit system: Support both imperial (gallons, °F) and metric (liters, °C) with user preference stored in profile. Conversions happen at display layer; database stores raw values in imperial.
- ✅ Tank deletion: Soft delete with 30-day recovery period. User sees "Undo" option. After 30 days, data is permanently purged. AI conversations referencing deleted tanks are retained but tank context is removed.

---

## Timeline Considerations

### Phase 1: MVP (v1.0) — Weeks 1–3

**Scope:**
- R-002.1: Create tank profile (single form)
- R-002.2: Edit tank profile
- R-002.3: Delete tank profile (soft delete)
- R-002.4: Multi-tank support with tier gating
- R-002.5: Tank switching
- R-002.6: Tank photo upload

**Deliverable:** Fully functional tank profile management with tier-gated limits

**Dependencies:**
- Authentication (R-009) must be complete — users must be identified
- Subscription & Billing (R-010) must provide tier information
- Supabase Storage configured and initialized

### Phase 2: Enhancement (v1.1) — Weeks 4–5

**Scope:**
- R-002.7: Tank setup wizard
- R-002.8: Tank cloning
- Polish, testing, performance optimization

### Phase 3: Advanced (v2.0) — Post-Launch

**Scope:**
- R-002.9: Tank templates
- R-002.10: Tank timeline

### Critical Path Notes

- Tank Profile is a **foundational dependency** for nearly every downstream feature:
  - Dashboard (R-003) displays tank-specific metrics
  - Parameter Logging (R-004) requires a tank context
  - Livestock Management (R-005) is tank-scoped
  - Water Parameters AI (R-007) analyzes tank-specific readings
  - Tank Compatibility Checker (R-008) evaluates inhabitants for the specific tank

- Delay in Tank Profile release blocks all dependent features
- Recommend shipping Phase 1 before Phase 2 work begins on downstream features

---

## Technical Specification

### Data Model

**Table: `tanks`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | Auto-generated |
| `user_id` | UUID | FK to `auth.users` | Via RLS policy |
| `name` | VARCHAR(100) | NOT NULL | Tank identifier |
| `type` | ENUM | NOT NULL | 'freshwater', 'saltwater', 'reef', 'brackish' |
| `volume_gallons` | DECIMAL(8,2) | NOT NULL | Primary volume storage |
| `volume_liters` | DECIMAL(8,2) | Computed | Auto-calculated: gallons * 3.78541 |
| `dimensions_length` | DECIMAL(8,2) | Optional | In user's preferred unit |
| `dimensions_width` | DECIMAL(8,2) | Optional | In user's preferred unit |
| `dimensions_height` | DECIMAL(8,2) | Optional | In user's preferred unit |
| `substrate` | VARCHAR(100) | Optional | e.g., 'sand', 'gravel', 'bare bottom' |
| `setup_date` | DATE | Optional | When tank was established |
| `photo_url` | TEXT | Optional | Public URL from Supabase Storage |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification timestamp |
| `deleted_at` | TIMESTAMP | Optional | Soft-delete flag; NULL if active |

**Indexes:**
- `(user_id, deleted_at)` — Fast lookup of user's active tanks
- `(user_id, created_at DESC)` — Recent tanks for quick access

---

### API Endpoints

#### Create Tank
```
POST /api/tanks
Authorization: Bearer {token}

Body:
{
  "name": "Living Room 30g",
  "type": "freshwater",
  "volume_gallons": 30,
  "dimensions_length": 36,
  "dimensions_width": 18,
  "dimensions_height": 18,
  "substrate": "gravel",
  "setup_date": "2024-01-15"
}

Response: 201 Created
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Living Room 30g",
  ...
}
```

#### List User's Tanks
```
GET /api/tanks
Authorization: Bearer {token}

Query Params:
  - include_deleted: boolean (default: false)

Response: 200 OK
[
  { id, name, type, volume_gallons, photo_url, ... },
  ...
]
```

#### Get Tank Detail
```
GET /api/tanks/{tank_id}
Authorization: Bearer {token}

Response: 200 OK
{ id, user_id, name, type, ... }
```

#### Update Tank
```
PATCH /api/tanks/{tank_id}
Authorization: Bearer {token}

Body: (partial update)
{ "name": "Updated Name", "volume_gallons": 40, ... }

Response: 200 OK
{ id, name, volume_gallons, ... }
```

#### Delete Tank (Soft)
```
DELETE /api/tanks/{tank_id}
Authorization: Bearer {token}

Response: 204 No Content
```

#### Upload Tank Photo
```
POST /api/tanks/{tank_id}/photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body: multipart with file field "photo"

Response: 200 OK
{ "photo_url": "https://storage.supabase.co/..." }
```

---

### Row-Level Security (RLS) Policies

**Tanks Table:**

```sql
-- Users can only SELECT their own tanks
CREATE POLICY "Users view own tanks"
ON tanks FOR SELECT
USING (auth.uid() = user_id);

-- Users can only INSERT their own tanks
CREATE POLICY "Users create own tanks"
ON tanks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own tanks
CREATE POLICY "Users update own tanks"
ON tanks FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only DELETE (soft) their own tanks
CREATE POLICY "Users delete own tanks"
ON tanks FOR DELETE
USING (auth.uid() = user_id);
```

---

### Storage Configuration

**Supabase Storage Bucket:** `tank-photos`

- **Public:** No (photos are private; use signed URLs or serve via authenticated endpoint)
- **File Naming:** `{user_id}/{tank_id}/{timestamp}.{ext}`
- **Max Size:** 5 MB per file
- **Retention:** Delete orphaned photos when tank is hard-deleted

**Storage Cleanup Job (pg_cron):**
```sql
-- Hard-delete tanks after 90 days of soft deletion
SELECT cron.schedule(
  'hard_delete_tanks',
  '0 2 * * *', -- 2 AM daily
  $$
    DELETE FROM tanks WHERE deleted_at < NOW() - INTERVAL '90 days';
  $$
);

-- Delete orphaned photos from storage (manual cleanup via Cloud Function)
```

---

### Frontend Architecture

#### State Management

**Tank Context (React Context or Zustand):**
```typescript
interface TankState {
  activeTankId: string | null;
  tanks: Tank[];
  isLoading: boolean;
  error: string | null;
  setActiveTank: (id: string) => void;
  createTank: (data: CreateTankInput) => Promise<Tank>;
  updateTank: (id: string, data: UpdateTankInput) => Promise<Tank>;
  deleteTank: (id: string) => Promise<void>;
  uploadPhoto: (id: string, file: File) => Promise<string>;
  fetchTanks: () => Promise<void>;
}
```

#### Components

- `TankSwitcher.tsx` — Global tank selector dropdown/modal
- `TankForm.tsx` — Reusable form for create/edit with validation
- `TankPhotoUpload.tsx` — Photo upload with drag-and-drop
- `DeleteTankDialog.tsx` — Confirmation modal with warnings
- `TankDashboard.tsx` — Tank profile view (public-facing)

#### Validation

- Client-side: Zod or Yup schema
- Server-side: Supabase RLS + API validation
- Fields:
  - `name`: required, max 100 chars, alphanumeric + spaces/hyphens
  - `type`: required, enum validation
  - `volume_gallons`: required, numeric, > 0, < 10000
  - `dimensions_*`: optional, numeric, > 0
  - `photo`: optional, max 5MB, JPEG/PNG only

---

### Performance Considerations

1. **Tank Switching:** Use Supabase Realtime subscriptions scoped to active tank to minimize data transfer
2. **Photo Optimization:** Client-side compression (WebP, <500KB) before upload
3. **Caching:** Local storage for tank list; invalidate on mutation
4. **Lazy Loading:** Defer photo loading until tank is selected
5. **Image CDN:** Serve photos through Vercel Image Optimization or similar CDN

---

### Testing Strategy

#### Unit Tests
- Tank form validation (required fields, types, ranges)
- Tier-gating logic (subscription tier vs. tank limit)
- Photo validation (file size, format)

#### Integration Tests
- Create/edit/delete tank end-to-end
- Tank switching updates global state
- Photo upload and storage
- RLS policies (users can't access other users' tanks)

#### E2E Tests (Cypress/Playwright)
- Complete user flow: create tank → edit → switch → delete
- Multi-tank workflow
- Tier-gated upgrade prompt
- Photo upload with preview

#### Load Testing
- 1000s of tanks per user (stress test pagination/filtering if implemented)
- Concurrent tank creation requests

---

## Acceptance Checklist

- [ ] All P0 requirements (R-002.1–R-002.6) are implemented and tested
- [ ] Tank profile creation flow is < 2 minutes for new users (measured via analytics)
- [ ] Multi-tank tier gating works correctly; users cannot exceed limits
- [ ] Tank switching updates all dependent views (dashboard, chat, parameters) within 1 second
- [ ] Photo uploads work (JPEG/PNG, <5MB); invalid files show clear error messages
- [ ] Soft-delete confirmation dialog appears and warns about data loss
- [ ] All fields validate on both client and server
- [ ] RLS policies prevent users from accessing other users' tanks
- [ ] Onboarding flow prompts users to create first tank
- [ ] Tank switcher is visible and accessible from all main screens (mobile and desktop)
- [ ] Error states are handled gracefully (network errors, storage failures, etc.)
- [ ] Unit, integration, and E2E tests have >80% coverage for this feature
- [ ] Analytics events are tracked:
  - Tank creation (with type)
  - Tank switching
  - Photo upload
  - Tank deletion
  - Upgrade prompt displays and conversions
- [ ] Documentation is complete:
  - API docs (OpenAPI/Swagger)
  - Frontend component library documentation
  - Data model diagrams
  - User help center article
- [ ] Performance benchmarks met:
  - Tank list load time <500ms
  - Tank switch <1 second
  - Photo upload <3 seconds (for 5MB file on 4G)
- [ ] Accessibility compliance:
  - Form labels properly associated
  - Error messages announced to screen readers
  - Keyboard navigation fully supported
  - Color contrast meets WCAG AA

---

## Glossary

- **Tier:** Subscription level (Starter, Plus, Pro)
- **Soft Delete:** Logical deletion via timestamp; data remains in DB
- **Hard Delete:** Physical removal from database
- **RLS:** Row-Level Security; Supabase policy enforcing user-scoped data access
- **Realtime:** Supabase feature for live subscription to database changes
- **Tank Type:** Freshwater, saltwater, reef, or brackish aquarium
- **Tank Profile:** Complete record of a user's tank including metadata, photo, and history

---

## References & Related Documents

- [Aquatic AI PRD](../00_PRD.md)
- [Authentication Specification](./09_Authentication_Spec.md) (R-009)
- [Subscription & Billing Specification](./10_Subscription_Billing_Spec.md) (R-010)
- [Dashboard Specification](./03_Dashboard_Spec.md) (R-003)
- [Parameter Logging Specification](./04_Parameter_Logging_Spec.md) (R-004)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Storage Documentation](https://vercel.com/docs/storage)

---

**Document Version:** 1.0
**Last Updated:** February 7, 2026
**Status:** Ready for Development
**Approvals:** [To be filled by Product/Engineering]
