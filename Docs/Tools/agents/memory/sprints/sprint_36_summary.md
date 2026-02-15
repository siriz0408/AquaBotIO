# Sprint 36 Summary — Equipment Tracking (Spec 10 - R-102)

> Date: 2026-02-14 | Status: COMPLETE

## Goals
1. Implement Equipment Tracking (Spec 10 R-102)
2. Database schema with lifespan tracking
3. Full CRUD API with tier gating
4. UI components for equipment management
5. Add Equipment tab to tank details

## Deliverables

### Database Migration (`20260214220927_equipment_tracking.sql`)
**Tables Created:**
- `equipment_lifespan_defaults` — Reference table with default lifespans per equipment type
- `equipment` — Main equipment tracking table with lifespan, status, soft-delete

**Seed Data:**
- 14 equipment types with lifespan ranges (filter, heater, light, skimmer, etc.)

**RPC Function:**
- `get_equipment_with_status(p_tank_id)` — Returns equipment with calculated age, status, months remaining

**Storage:**
- `equipment-photos` bucket with user-scoped RLS policies

### API Endpoints
**`/api/tanks/[tankId]/equipment` (GET, POST)**
- GET: List all equipment with calculated status and stats summary
- POST: Add new equipment with validation

**`/api/tanks/[tankId]/equipment/[equipmentId]` (GET, PATCH, DELETE)**
- GET: Single equipment with full details
- PATCH: Update equipment or mark as serviced (action: "mark_serviced")
- DELETE: Soft delete with reason (replaced, removed, failed, sold, other)

**`/api/equipment/lifespan-defaults` (GET)**
- List all lifespan defaults for display in UI

### UI Components
**`src/components/equipment/equipment-card.tsx`**
- Status badge (Good/Due Soon/Overdue) with color coding
- Equipment type icon + name display
- Age and time remaining display
- Action menu: Mark as Serviced, Edit, Remove
- Delete confirmation dialog with reason selection

**`src/components/equipment/equipment-list.tsx`**
- Stats summary (total, overdue, due soon, investment)
- Empty state with upgrade prompt for Free/Starter users
- Add equipment button and modal integration
- Grid layout for equipment cards

**`src/components/equipment/add-equipment-modal.tsx`**
- Form with all equipment fields
- Dynamic custom type field when "other" selected
- Validation for required fields and date constraints
- Edit mode support

**`src/lib/equipment/utils.ts`**
- Equipment type definitions with icons
- Status color configuration
- Age/time formatting utilities
- Deletion reason options

### Tank Detail Page Updates
- Added Equipment tab to navigation
- Created `/tanks/[id]/equipment` page
- Tab navigation updated across all tank pages

## Tier Gating
- Equipment Tracking: Plus+ only (Free/Starter see upgrade prompt)
- API endpoints return `TIER_REQUIRED` error for unauthorized tiers
- UI shows locked state with upgrade CTA for Free/Starter users

## Commits
- `5892a35` - Add Equipment Tracking feature (Spec 10 - R-102)

## Verification
- TypeScript: PASS
- Build: PASS
- New page renders at `/tanks/[id]/equipment`

## What This Unlocks
- **Proactive Maintenance**: Track equipment age and get alerted before failures
- **Investment Tracking**: See total equipment cost per tank
- **Organized Inventory**: Catalog all equipment with settings and location
- **Plus/Pro Value**: Equipment tracking is a key Plus tier feature

## Remaining for Spec 10
- R-103: AI Equipment Recommendations via Web Search (Pro-only, SerpAPI) — Future sprint
- Equipment maintenance reminders via cron job — Future sprint
- Equipment maintenance logs — P1
