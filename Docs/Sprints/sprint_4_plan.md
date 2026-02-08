# Sprint 4 Plan: Water Parameters & Species Database (Week 9-11)

## Sprint Overview

**Duration:** 3 weeks (Week 9-11)
**Phase:** Phase 2 — MVP Completion
**Overall Progress:** 48% → Target 65%

### Why This Sprint

We've completed the foundation (Auth, Tanks, AI Chat, Billing). Now we move into Phase 2 — the features that make AquaBotAI actually useful for aquarium keepers:

1. **Water Parameters** — The #1 use case. Users need to log and visualize their water tests.
2. **Species Database** — Powers AI compatibility checking and livestock tracking.

These two features unlock the next sprint (Maintenance Scheduling) and are required for MVP launch.

---

## What We're Building

### Track A: Water Parameters & Analysis (2 weeks)

**Current State:** Basic logging form exists, param history list works
**Target State:** Full Recharts dashboards, trend analysis, safe/warning/danger zones

#### A1. Interactive Dashboards (Days 1-4)

**Create Components:**
```
src/components/parameters/
├── parameter-chart.tsx         # Recharts line chart
├── parameter-dashboard.tsx     # Dashboard container with time range selector
├── parameter-card.tsx          # Single parameter with trend indicator
├── safe-zone-overlay.tsx       # Color-coded zones on charts
└── trend-indicator.tsx         # Up/down/stable arrows
```

**Create/Update Pages:**
- `src/app/(dashboard)/tanks/[id]/parameters/page.tsx` — Full parameters dashboard
- Update `src/app/(dashboard)/tanks/[id]/log/page.tsx` — Enhanced logging form

**Features:**
- Recharts line charts for each parameter
- Time range selector: 7 / 30 / 90 days
- Color-coded safe (green), warning (yellow), danger (red) zones
- Trend indicators (improving, stable, declining)
- Parameter cards with latest value + mini sparkline

**Verification:**
```bash
# Visual: /tanks/[id]/parameters shows charts
# Performance: 90 days of data renders in < 2 seconds
npm run test:e2e -- --grep "Parameters Dashboard"
```

#### A2. AI Trend Analysis (Days 5-7)

**Create:**
- `src/lib/ai/parameter-analyzer.ts` — Analyze trends, detect problems
- `src/app/api/ai/analyze-params/route.ts` — AI analysis endpoint

**Features:**
- AI button on dashboard: "Analyze my water quality"
- Claude reviews last 30 days of data
- Generates plain-language insights:
  - "Your pH has been stable at 7.2 for 3 weeks — great job!"
  - "Nitrate levels are trending up. Consider a 25% water change."
- Stores analysis in AI conversation for context continuity

#### A3. Custom Alert Thresholds (Days 8-10)

**Database Migration:**
```sql
-- 20260215000000_parameter_thresholds.sql
CREATE TABLE parameter_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  parameter_type TEXT NOT NULL,
  min_safe DECIMAL,
  max_safe DECIMAL,
  min_warning DECIMAL,
  max_warning DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tank_id, parameter_type)
);
```

**Features:**
- Per-tank custom thresholds (override species defaults)
- Settings modal on dashboard
- Thresholds power the safe/warning/danger zones

---

### Track B: Species Database & Livestock (2 weeks, overlapping)

**Current State:** Species table exists with data, no UI
**Target State:** Searchable species library, livestock tracking per tank

#### B1. Species Search UI (Days 1-4)

**Create Components:**
```
src/components/species/
├── species-search.tsx          # Search input with debounce
├── species-grid.tsx            # Grid of species cards
├── species-card.tsx            # Card with photo, name, care level
├── species-detail-modal.tsx    # Full species details
└── species-filters.tsx         # Filter by type, care level, temperament
```

**Create Pages:**
- `src/app/(dashboard)/species/page.tsx` — Species library
- `src/app/(dashboard)/species/[id]/page.tsx` — Species detail

**Features:**
- Full-text search (GIN index already exists)
- Filter by: freshwater/saltwater/invertebrate, care level, temperament
- Species cards: photo, common name, scientific name, care level badge
- Detail modal: full care requirements, water parameters, compatibility notes

**Verification:**
```bash
# Search returns results in < 500ms
# Filters narrow results correctly
npm run test:e2e -- --grep "Species Search"
```

#### B2. Livestock Tracking (Days 5-8)

**Create Components:**
```
src/components/livestock/
├── livestock-list.tsx          # Tank's current livestock
├── add-livestock-modal.tsx     # Add from species search
├── livestock-card.tsx          # Fish with quantity, added date
└── compatibility-warning.tsx   # AI compatibility alert
```

**Create API Routes:**
- `src/app/api/tanks/[id]/livestock/route.ts` — CRUD for livestock
- `src/app/api/ai/compatibility/route.ts` — AI compatibility check

**Features:**
- Add livestock from species search
- Quantity, nickname, date added
- AI compatibility check on every addition:
  - "Adding 3 Tiger Barbs to a tank with Betta fish is not recommended. Tiger Barbs are known fin nippers."
- Soft-delete (retain for AI context)
- Stocking density indicator (based on tank volume + fish bioload)

#### B3. AI Integration (Days 9-10)

**Update:**
- `src/lib/ai/context-builder.ts` — Include livestock in tank context
- System prompt now mentions: "This tank contains: 6 Neon Tetras, 2 Corydoras..."

**Features:**
- Chat knows about your fish
- Can answer: "Are my neon tetras compatible with an angelfish?"
- Suggests fish based on tank profile

---

## Files to Create

### New Files (Priority Order)

| File | Purpose | Track |
|------|---------|-------|
| `src/components/parameters/parameter-chart.tsx` | Recharts dashboard | A |
| `src/components/parameters/parameter-dashboard.tsx` | Dashboard container | A |
| `src/app/(dashboard)/tanks/[id]/parameters/page.tsx` | Parameters page | A |
| `src/components/species/species-search.tsx` | Species search | B |
| `src/components/species/species-grid.tsx` | Species grid | B |
| `src/app/(dashboard)/species/page.tsx` | Species library | B |
| `src/components/livestock/livestock-list.tsx` | Tank livestock | B |
| `src/app/api/tanks/[id]/livestock/route.ts` | Livestock API | B |
| `src/app/api/ai/analyze-params/route.ts` | AI param analysis | A |
| `src/app/api/ai/compatibility/route.ts` | AI compatibility | B |

### Files to Modify

| File | Changes |
|------|---------|
| `src/app/(dashboard)/tanks/[id]/page.tsx` | Add parameters + livestock sections |
| `src/lib/ai/context-builder.ts` | Include livestock in context |
| `src/lib/ai/system-prompt.ts` | Add livestock awareness |
| `src/app/(dashboard)/layout.tsx` | Add Species nav link |

---

## Dependencies to Install

```bash
npm install recharts          # Already in package.json but verify
npm install date-fns          # Date formatting for charts
```

---

## Database Changes

### Migration: Parameter Thresholds
```sql
-- supabase/migrations/20260215000000_parameter_thresholds.sql
CREATE TABLE parameter_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  parameter_type TEXT NOT NULL CHECK (parameter_type IN (
    'temperature', 'ph', 'ammonia', 'nitrite', 'nitrate',
    'gh', 'kh', 'salinity', 'calcium', 'alkalinity', 'magnesium', 'phosphate'
  )),
  min_safe DECIMAL,
  max_safe DECIMAL,
  min_warning DECIMAL,
  max_warning DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tank_id, parameter_type)
);

-- RLS: Users can only manage thresholds for their own tanks
ALTER TABLE parameter_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tank thresholds"
  ON parameter_thresholds FOR ALL
  USING (tank_id IN (SELECT id FROM tanks WHERE user_id = auth.uid()));
```

---

## E2E Tests to Add

```
tests/e2e/
├── parameters-dashboard.spec.ts   # 15 tests
│   ├── Displays charts for each parameter
│   ├── Time range selector works
│   ├── Safe/warning/danger zones display correctly
│   ├── AI analysis button triggers analysis
│   └── Custom thresholds can be set
│
├── species-search.spec.ts         # 15 tests
│   ├── Search returns matching species
│   ├── Filters work correctly
│   ├── Species detail modal opens
│   ├── Empty state shows for no results
│   └── Performance: search < 500ms
│
└── livestock.spec.ts              # 15 tests
    ├── Add livestock from species search
    ├── Compatibility warning displays
    ├── Remove livestock (soft delete)
    ├── Livestock shows in tank detail
    └── AI chat mentions livestock
```

**Target:** 63 → 108 E2E tests (+45)

---

## Sprint Exit Criteria

### Must Have (Ship Blockers)
- [ ] Parameter dashboard shows Recharts line graphs
- [ ] Time range selector (7/30/90 days) works
- [ ] Safe/warning/danger zones visible on charts
- [ ] Species search returns results with filters
- [ ] Livestock can be added/removed from tanks
- [ ] AI compatibility check runs on livestock add
- [ ] 45 new E2E tests passing

### Nice to Have
- [ ] AI trend analysis endpoint
- [ ] Custom threshold settings
- [ ] Stocking density indicator
- [ ] Species detail page (not just modal)

---

## Agent Assignments

| Agent | Track | Scope | Days |
|-------|-------|-------|------|
| Frontend Engineer | A + B | All UI components, pages, charts | 1-10 |
| Backend Engineer | A + B | API routes, migrations, AI integration | 1-10 |

### Parallel Work Strategy

**Days 1-4:** Both tracks can run in parallel
- Frontend: Parameter charts + Species search UI
- Backend: Thresholds migration + Livestock API

**Days 5-7:** Integration
- Frontend: Livestock UI + AI analysis UI
- Backend: AI compatibility endpoint + context updates

**Days 8-10:** Testing + Polish
- Both: E2E tests, bug fixes, edge cases

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Recharts learning curve | Use existing examples from docs, keep charts simple |
| Species search performance | GIN index exists, add pagination if needed |
| AI compatibility accuracy | Start conservative (flag obvious conflicts only) |
| Chart rendering with large datasets | Client-side data aggregation for 90-day view |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Progress | 48% → 65% |
| E2E Tests | 63 → 108 |
| Chart Render Time | < 2 seconds for 90 days |
| Search Latency | < 500ms |
| New Pages | +4 (params dashboard, species library, species detail, livestock on tank) |
| New Components | +15 |
| New API Routes | +4 |

---

## References

- `03_Water_Parameters_Analysis_Spec.md` — Parameter requirements
- `04_Species_Database_Livestock_Spec.md` — Species & livestock requirements
- `12_API_Integration_Spec.md` — API contracts
- `00_Data_Model_Schema.md` — Database schema

---

*Sprint 4 Plan — Created Feb 8, 2026 by PM Orchestrator*
