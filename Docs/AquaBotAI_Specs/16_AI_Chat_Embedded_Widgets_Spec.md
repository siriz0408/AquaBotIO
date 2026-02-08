# AI Chat Embedded Widgets — Feature Specification
**Aquatic AI | R-016 | P1 — Should Have (Phase 2 Priority)**

---

## Problem Statement

Aquarium hobbyists need interactive tools and checklists to solve common problems, but current apps force users to navigate away from conversations to access calculators or guides. Beginners especially struggle with:
- **Quarantine procedures** — 60% first-year mortality is largely preventable with proper quarantine, but beginners skip steps or forget critical procedures
- **Water change calculations** — "Change 25% of your 55-gallon tank" requires math that users often get wrong, leading to over-changing (stresses fish) or under-changing (doesn't help)
- **Parameter troubleshooting** — When parameters spike, beginners panic and don't know what caused it or how to fix it. Generic forum advice doesn't consider their specific tank setup

These problems are solved by embedding interactive widgets directly in AI chat responses. When the AI detects user intent (e.g., "can I add this fish?"), it embeds a Quarantine Checklist widget. When nitrates are high, it embeds a Water Change Calculator with personalized recommendations. When parameters are out of range, it embeds a Parameter Troubleshooting widget with step-by-step fixes.

---

## Goals

- **G1**: Embed interactive widgets in AI chat responses that solve common ICP problems without requiring navigation away from the conversation
- **G2**: Make widgets AI-powered and personalized — calculators use YOUR tank data, checklists adapt to YOUR tank type and species
- **G3**: Enable widgets to trigger actions — "Schedule Water Change" button creates a maintenance task, "Add to Tank" links to livestock addition
- **G4**: Prevent beginner disasters — Quarantine Checklist reduces first-year mortality by ensuring proper procedures are followed
- **G5**: Reduce cognitive load — Water Change Calculator removes math confusion, Parameter Troubleshooting provides clear action steps

---

## Non-Goals

- **NG1**: Standalone calculator pages — widgets are chat-embedded only, no dedicated calculator routes
- **NG2**: Widget editing/configuration UI — widgets are read-only displays, users interact via buttons/checkboxes only
- **NG3**: Widget persistence across sessions — widgets appear in chat messages, not as persistent dashboard widgets
- **NG4**: Multi-user widget collaboration — widgets are single-user, per-tank context only
- **NG5**: Widget analytics/tracking — no separate analytics for widget interactions beyond standard chat message tracking
- **NG6**: Additional widgets (Dosing Calculator, Stocking Calculator, etc.) — Phase 3 consideration, not included in Phase 2

---

## User Stories

### Beginner Hobbyist

- **US-W1**: As a beginner, I want to ask "can I add neon tetras?" and see an interactive quarantine checklist embedded in the AI's response, so I know exactly what steps to follow without leaving the chat.

- **US-W2**: As a beginner, I want the AI to calculate exactly how much water to change (in gallons/liters) when it recommends a water change, so I don't have to do math or guess.

- **US-W3**: As a beginner, when I see a parameter alert (e.g., "ammonia 0.5 ppm"), I want an embedded troubleshooting widget that explains what it means, what caused it, and how to fix it step-by-step, so I can take action without panicking.

### Intermediate Hobbyist

- **US-W4**: As an intermediate keeper, I want the Water Change Calculator to suggest the optimal percentage based on my tank's current nitrate levels and history, so I'm doing the right amount at the right time.

- **US-W5**: As an intermediate keeper, I want the Parameter Troubleshooting widget to correlate parameter spikes with recent events (e.g., "This spike happened 2 days after you added 3 new fish"), so I understand cause and effect.

### Advanced Keeper

- **US-W6**: As an advanced keeper, I want widgets to respect my tank's specific setup (reef vs freshwater, equipment, livestock), so recommendations are accurate for my ecosystem.

### All Users

- **US-W7**: As a user, I want to click action buttons in widgets (e.g., "Schedule Water Change", "Add to Tank") and have them link directly to the relevant app pages, so I can take action without typing commands.

- **US-W8**: As a user, I want widgets to appear contextually when the AI detects relevant intent, so I don't have to ask for them explicitly.

---

## Requirements

### Must-Have (P0)

#### R-016.1: Quarantine Checklist Widget

**Description**: Interactive checklist widget embedded in AI chat when user asks about adding new fish or discusses quarantine procedures. Widget shows personalized steps based on tank type (freshwater vs saltwater), tracks completion progress, and schedules reminders.

**Widget Structure:**
- Header: "🐠 Quarantine Checklist" with AquaBot branding
- Checklist items (7 steps):
  1. Set up 10-20 gal quarantine tank
  2. Cycle tank (ammonia/nitrite = 0)
  3. Drip acclimate new fish
  4. 2-week observation period
  5. Daily parameter checks
  6. Feed quality foods
  7. Transfer to main tank
- Progress indicator: "Progress: X/7 steps complete"
- Action buttons: "Schedule Reminders", "View Guide"
- Timestamp below widget

**Personalization:**
- Freshwater: Standard 7-step checklist
- Saltwater: Adds copper treatment step (optional, species-dependent)
- Tank size recommendation: Based on species being added (small fish = 10 gal, large = 20+ gal)
- Duration: 2-4 weeks based on species sensitivity

**Data Model:**
- New table: `quarantine_tracking`
  - `id` (UUID, PK)
  - `tank_id` (UUID, FK → tanks)
  - `user_id` (UUID, FK → users)
  - `species_name` (VARCHAR, optional — what fish is being quarantined)
  - `start_date` (DATE)
  - `steps_completed` (JSONB array of step IDs: ["step_1", "step_2"])
  - `status` (enum: 'in_progress', 'completed', 'abandoned')
  - `created_at`, `updated_at`

**AI Integration:**
- System prompt detects intent: "adding new fish", "quarantine", "introducing fish"
- AI embeds structured block: `\`\`\`quarantine-checklist\n{...JSON...}\n\`\`\``
- JSON includes: `tankType`, `recommendedTankSize`, `steps` (array), `speciesName` (optional)

**Acceptance Criteria:**
- Given a user asks "can I add neon tetras?", When the AI responds, Then a Quarantine Checklist widget is embedded with steps personalized for freshwater tanks
- Given a user checks off "Cycle tank" in the widget, When they return to chat later, Then the widget shows "Progress: 2/7 steps complete"
- Given a user clicks "Schedule Reminders", Then maintenance tasks are created for observation period check-ins
- Given a user completes all 7 steps, Then the widget shows "✅ Quarantine Complete" and status updates to 'completed'

---

#### R-016.2: Water Change Calculator Widget

**Description**: Interactive calculator widget that shows exact gallons/liters to change based on tank volume and AI-recommended percentage. AI suggests percentage based on current nitrate levels, tank type, bioload, and parameter history.

**Widget Structure:**
- Header: "💧 Water Change Calculator"
- Tank info: Tank name, volume (e.g., "Sprint 8 Test Tank (55 gal)")
- Current parameter display: "Current Nitrate: 30 ppm" (if available)
- Recommended percentage: "Recommended: 30% (16.5 gallons)" — calculated dynamically
- Manual override: Slider or input to adjust percentage (10% - 50%)
- Result display: "You need to change: 16.5 gallons (62.4 liters)"
- Action buttons: "Schedule Water Change", "Log Parameters"
- Tip/context: "💡 Tip: Change water when nitrate exceeds 20 ppm for best health"

**Calculation Logic:**
- Base recommendation:
  - Nitrate < 10 ppm: 10-15% (maintenance)
  - Nitrate 10-20 ppm: 20-25% (standard)
  - Nitrate 20-40 ppm: 30-35% (recommended)
  - Nitrate > 40 ppm: 40-50% (urgent)
- Adjustments:
  - Small tanks (< 20 gal): +5% (more frequent, smaller changes)
  - Large tanks (> 75 gal): -5% (less frequent, larger changes)
  - Heavy bioload: +5%
  - Planted tanks: -5% (plants consume nitrates)
- Unit conversion: Supports gallons ↔ liters based on user preference

**AI Integration:**
- System prompt detects intent: "water change", "change water", "how much water", or when nitrate levels are high
- AI embeds structured block: `\`\`\`water-change-calculator\n{...JSON...}\n\`\`\``
- JSON includes: `tankId`, `tankVolume`, `currentNitrate` (optional), `recommendedPercent`, `recommendedGallons`, `recommendedLiters`

**Acceptance Criteria:**
- Given a user asks "how much water should I change?", When the AI responds, Then a Water Change Calculator widget is embedded showing exact gallons/liters based on their tank volume
- Given current nitrate is 30 ppm, When the widget renders, Then it recommends 30% and shows "16.5 gallons (62.4 liters)"
- Given a user adjusts the slider to 25%, Then the result updates to "13.75 gallons (52.1 liters)"
- Given a user clicks "Schedule Water Change", Then they're navigated to `/tanks/{id}/maintenance` with a pre-filled water change task for the calculated amount

---

#### R-016.3: Parameter Troubleshooting Widget

**Description**: Enhanced ParameterAlertCard component with personalized troubleshooting steps. Widget appears when AI detects a problem parameter (out of range, trending dangerously). Shows what the parameter means, what likely caused it, and step-by-step fixes personalized to the user's tank.

**Widget Structure:**
- Header: "⚠️ Parameter Alert: {Parameter Name}" with status badge (good/warning/alert)
- Current value display: Large number with unit (e.g., "0.5 ppm" for ammonia)
- Status badge: Color-coded (green/yellow/red) with icon
- Mini trend chart: 5-7 recent values showing trend direction
- "What This Means" section: Simple explanation (e.g., "Ammonia is toxic to fish. Your filter is processing waste.")
- "Likely Cause" section: AI-generated list correlating with events:
  - "New fish added 2 days ago"
  - "Overfeeding detected"
  - "Dead plant matter"
- "How to Fix" section: Step-by-step actions:
  1. "25% water change (16.5 gal) — do today"
  2. "Test again tomorrow"
  3. "Reduce feeding temporarily"
- Action buttons: "Schedule Water Change", "Log Parameters", "Learn More"

**Troubleshooting Logic:**
- Correlate parameter spikes with recent events:
  - Check `livestock` table for additions in last 7 days
  - Check `maintenance_logs` for recent water changes (might have disrupted cycle)
  - Check `water_parameters` history for trends
- Generate personalized fixes:
  - Tank size → calculate exact water change amount
  - Tank type → adjust recommendations (reef vs freshwater)
  - Current parameters → suggest complementary actions (e.g., if pH also low, suggest buffering)

**AI Integration:**
- System prompt detects problem parameters: When any parameter is out of safe range OR trending dangerously
- AI embeds structured block: `\`\`\`parameter-troubleshooting\n{...JSON...}\n\`\`\``
- JSON includes: `parameter`, `currentValue`, `unit`, `status`, `trend` (array), `likelyCauses` (array), `fixSteps` (array), `correlatedEvents` (array)

**Acceptance Criteria:**
- Given ammonia spikes to 0.5 ppm, When the AI responds, Then a Parameter Troubleshooting widget is embedded with personalized fix steps
- Given the spike happened 2 days after adding fish, When the widget renders, Then "Likely Cause" includes "New fish added 2 days ago"
- Given a user clicks "Schedule Water Change", Then they're navigated to maintenance scheduling with pre-filled task
- Given a user clicks "Learn More", Then they're shown expanded troubleshooting guide (modal or new page)

---

#### R-016.4: Widget Rendering Infrastructure

**Description**: Extend existing RichMessage parser to support new widget types. Widgets follow the same pattern as existing SpeciesCard and ParameterAlertCard components.

**Component Architecture:**
- `RichMessage` parser (`src/components/chat/rich-message.tsx`) already supports:
  - `species-card` → `SpeciesCard` component
  - `parameter-alert` → `ParameterAlertCard` component
  - `action-buttons` → `ActionButtons` component
- Add support for:
  - `quarantine-checklist` → `QuarantineChecklistWidget` component
  - `water-change-calculator` → `WaterChangeCalculatorWidget` component
  - `parameter-troubleshooting` → Enhanced `ParameterAlertCard` with troubleshooting data

**Widget Component Pattern:**
- All widgets follow same structure:
  - AquaBot branding header (sparkle icon + "AquaBot" label)
  - Widget content (checklist, calculator, troubleshooting)
  - Action buttons (if applicable)
  - Timestamp
- Styling: White card with border, rounded corners, shadow
- Mobile-first: Full-width on mobile, max-width on desktop

**Acceptance Criteria:**
- Given an AI response contains `\`\`\`quarantine-checklist\n{...}\n\`\`\``, When RichMessage parses it, Then QuarantineChecklistWidget renders correctly
- Given an AI response contains `\`\`\`water-change-calculator\n{...}\n\`\`\``, When RichMessage parses it, Then WaterChangeCalculatorWidget renders correctly
- Given an AI response contains `\`\`\`parameter-troubleshooting\n{...}\n\`\`\``, When RichMessage parses it, Then enhanced ParameterAlertCard renders with troubleshooting sections
- Given JSON parsing fails, When RichMessage encounters invalid JSON, Then it falls back to rendering as plain text markdown

---

### Nice-to-Have (P1)

- **R-016.5: Widget State Persistence** — Save widget state (checklist progress, calculator values) so users can return to incomplete widgets
- **R-016.6: Widget History** — Show widget history in chat (e.g., "You completed quarantine checklist for Neon Tetras on Feb 5")
- **R-016.7: Widget Sharing** — Allow users to share widget results (e.g., "I calculated a 30% water change for my 55-gallon tank")

---

### Future Considerations (P2)

- **R-016.8: Additional Widgets** — Dosing Calculator, Stocking Density Calculator, Tank Setup Checklist, Feeding Schedule Calculator, Emergency Response Checklist (see Phase 3 roadmap)
- **R-016.9: Widget Analytics** — Track which widgets are most used, which actions users take from widgets
- **R-016.10: Widget Customization** — Allow users to customize widget appearance or default values

---

## Success Metrics

### Leading Indicators
- **Widget Embed Rate**: 30%+ of AI responses include relevant widgets when intent is detected
- **Widget Interaction Rate**: 50%+ of users who see a widget interact with it (check off items, adjust calculator, click action buttons)
- **Action Completion Rate**: 25%+ of users who see action buttons (Schedule Water Change, Add to Tank) complete the action

### Lagging Indicators
- **Quarantine Compliance**: 70%+ of users who see Quarantine Checklist complete all 7 steps before adding fish to main tank
- **Water Change Accuracy**: 80%+ of users who use Water Change Calculator schedule the exact calculated amount
- **Parameter Resolution Time**: Average time from parameter alert to resolution decreases by 40%+ for users who see Parameter Troubleshooting widget

### Engagement Metrics
- **Chat Message Increase**: Average AI messages per user per day increases by 20%+ (widgets make chat more valuable)
- **Retention Impact**: Users who interact with widgets have 15%+ higher 30-day retention than users who don't

---

## Data Model Changes

### New Table: `quarantine_tracking`

**Purpose**: Track quarantine progress per species addition per tank.

**Schema:**
```sql
CREATE TABLE quarantine_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species_name VARCHAR(255), -- Optional: what fish is being quarantined
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps_completed JSONB DEFAULT '[]'::jsonb, -- Array of step IDs: ["step_1", "step_2"]
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  notes TEXT, -- Optional user notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ -- When status changed to 'completed'
);

CREATE INDEX idx_quarantine_tracking_tank ON quarantine_tracking(tank_id);
CREATE INDEX idx_quarantine_tracking_user ON quarantine_tracking(user_id);
CREATE INDEX idx_quarantine_tracking_status ON quarantine_tracking(status) WHERE status = 'in_progress';
```

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- INSERT/UPDATE/DELETE: `auth.uid() = user_id`

**Triggers:**
- `update_updated_at()` — Auto-update `updated_at` on row changes

---

## AI Integration Points

### System Prompt Enhancements

Add to `src/lib/ai/system-prompt.ts`:

**Widget Trigger Instructions:**
```
## Embedded Widgets

When appropriate, embed interactive widgets in your responses using structured code blocks:

### Quarantine Checklist (use when user asks about adding new fish)
\`\`\`quarantine-checklist
{
  "tankType": "freshwater" | "saltwater",
  "recommendedTankSize": "10 gal" | "20 gal",
  "speciesName": "Neon Tetra" (optional),
  "steps": [
    {"id": "step_1", "label": "Set up 10-20 gal quarantine tank", "completed": false},
    {"id": "step_2", "label": "Cycle tank (ammonia/nitrite = 0)", "completed": false},
    ...
  ]
}
\`\`\`

### Water Change Calculator (use when user asks about water changes OR nitrate > 20 ppm)
\`\`\`water-change-calculator
{
  "tankId": "uuid",
  "tankVolume": 55,
  "currentNitrate": 30 (optional),
  "recommendedPercent": 30,
  "recommendedGallons": 16.5,
  "recommendedLiters": 62.4
}
\`\`\`

### Parameter Troubleshooting (use when any parameter is out of safe range)
\`\`\`parameter-troubleshooting
{
  "parameter": "Ammonia",
  "currentValue": "0.5",
  "unit": "ppm",
  "status": "warning" | "alert",
  "trend": [0.1, 0.2, 0.3, 0.4, 0.5],
  "likelyCauses": ["New fish added 2 days ago", "Overfeeding"],
  "fixSteps": [
    "25% water change (16.5 gal) — do today",
    "Test again tomorrow",
    "Reduce feeding temporarily"
  ],
  "correlatedEvents": [
    {"type": "livestock_added", "date": "2026-02-06", "description": "Added 3 Neon Tetras"}
  ]
}
\`\`\`

Only include widgets when they add value. Don't force widgets into every response.
```

### Context Building Enhancements

Update `src/lib/ai/context-builder.ts` to include:
- Recent livestock additions (last 7 days) for correlation with parameter spikes
- Recent maintenance logs (last 14 days) for troubleshooting context
- Current parameter values for water change calculator recommendations

---

## Component Specifications

### QuarantineChecklistWidget Component

**File**: `src/components/chat/messages/quarantine-checklist-widget.tsx`

**Props:**
```typescript
interface QuarantineChecklistWidgetProps {
  data: {
    tankType: "freshwater" | "saltwater";
    recommendedTankSize: string;
    speciesName?: string;
    steps: Array<{
      id: string;
      label: string;
      completed: boolean;
    }>;
  };
  timestamp: Date;
  onStepComplete?: (stepId: string) => void;
  onScheduleReminders?: () => void;
  className?: string;
}
```

**Features:**
- Checkbox for each step (checked = completed)
- Progress bar showing X/7 complete
- "Schedule Reminders" button → navigates to maintenance scheduling
- "View Guide" button → opens expanded quarantine guide modal
- Auto-saves progress to `quarantine_tracking` table on step completion

---

### WaterChangeCalculatorWidget Component

**File**: `src/components/chat/messages/water-change-calculator-widget.tsx`

**Props:**
```typescript
interface WaterChangeCalculatorWidgetProps {
  data: {
    tankId: string;
    tankVolume: number;
    currentNitrate?: number;
    recommendedPercent: number;
    recommendedGallons: number;
    recommendedLiters: number;
  };
  timestamp: Date;
  onSchedule?: () => void;
  onLogParams?: () => void;
  className?: string;
}
```

**Features:**
- Displays tank name and volume from tank context
- Shows current nitrate if available (from latest parameter entry)
- Slider (10% - 50%) to adjust percentage
- Real-time calculation: gallons = (tankVolume × percent) / 100
- Unit conversion: liters = gallons × 3.78541
- "Schedule Water Change" button → navigates to `/tanks/{id}/maintenance` with pre-filled task
- "Log Parameters" button → navigates to `/tanks/{id}/log`

---

### Enhanced ParameterAlertCard Component

**File**: `src/components/chat/messages/parameter-alert-card.tsx` (enhance existing)

**New Props:**
```typescript
interface ParameterAlertCardProps {
  data: {
    parameter: string;
    currentValue: string;
    unit: string;
    status: "good" | "warning" | "alert";
    trend: number[];
    recommendation: string;
    // NEW FIELDS:
    likelyCauses?: string[];
    fixSteps?: string[];
    correlatedEvents?: Array<{
      type: string;
      date: string;
      description: string;
    }>;
  };
  timestamp: Date;
  className?: string;
}
```

**Enhancements:**
- Add "What This Means" section (simple explanation)
- Add "Likely Cause" section (bulleted list from `likelyCauses`)
- Add "How to Fix" section (numbered steps from `fixSteps`)
- Add "Schedule Water Change" action button if fix steps include water change
- Add "Log Parameters" action button

---

## Open Questions

1. **Quarantine Tracking Scope**: Should we track one quarantine per species addition, or one per tank (if multiple species quarantined together)? **Recommendation**: One per species addition for better tracking.

2. **Widget Persistence**: Should widget state (checklist progress, calculator values) persist across page refreshes, or reset each time? **Recommendation**: Persist to database for Quarantine Checklist (users return to it), reset for calculators (fresh calculation each time).

3. **Widget Tier Gating**: Should any widgets be Pro-only, or keep all free to drive engagement? **Recommendation**: Keep all free — widgets drive engagement and retention, not direct revenue.

4. **Action Button Behavior**: When user clicks "Schedule Water Change" from widget, should it:
   - Navigate to maintenance page with pre-filled form? **YES**
   - Create task automatically without confirmation? **NO** (user should review)
   - Show inline confirmation modal? **P1 consideration**

5. **Widget Error Handling**: If AI generates invalid JSON for widget, should we:
   - Fall back to plain text markdown? **YES**
   - Show error message? **NO** (too technical for users)
   - Retry AI generation? **NO** (too slow)

6. **Quarantine Reminder Frequency**: How often should reminders be sent during quarantine period? **Recommendation**: Daily parameter check reminder, weekly progress check-in.

---

## Implementation Notes

### Widget Trigger Detection

AI should detect widget triggers based on:
- **Quarantine Checklist**: Keywords: "add fish", "new fish", "quarantine", "introducing", "can I add"
- **Water Change Calculator**: Keywords: "water change", "change water", "how much water", OR when nitrate > 20 ppm in current parameters
- **Parameter Troubleshooting**: Automatic when any parameter is out of safe range OR trending dangerously (3+ consecutive readings moving toward danger zone)

### Widget JSON Schema Validation

Use Zod schemas to validate widget JSON before rendering:
```typescript
// src/lib/validation/widgets.ts
export const quarantineChecklistSchema = z.object({
  tankType: z.enum(["freshwater", "saltwater"]),
  recommendedTankSize: z.string(),
  speciesName: z.string().optional(),
  steps: z.array(z.object({
    id: z.string(),
    label: z.string(),
    completed: z.boolean(),
  })),
});

export const waterChangeCalculatorSchema = z.object({
  tankId: z.string().uuid(),
  tankVolume: z.number().positive(),
  currentNitrate: z.number().optional(),
  recommendedPercent: z.number().min(10).max(50),
  recommendedGallons: z.number().positive(),
  recommendedLiters: z.number().positive(),
});

export const parameterTroubleshootingSchema = z.object({
  parameter: z.string(),
  currentValue: z.string(),
  unit: z.string(),
  status: z.enum(["good", "warning", "alert"]),
  trend: z.array(z.number()),
  recommendation: z.string(),
  likelyCauses: z.array(z.string()).optional(),
  fixSteps: z.array(z.string()).optional(),
  correlatedEvents: z.array(z.object({
    type: z.string(),
    date: z.string(),
    description: z.string(),
  })).optional(),
});
```

### Database Migration

Create migration: `supabase/migrations/YYYYMMDDHHMMSS_sprint10_widgets.sql`

```sql
-- Quarantine tracking table
CREATE TABLE IF NOT EXISTS quarantine_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species_name VARCHAR(255),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps_completed JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_quarantine_tracking_tank ON quarantine_tracking(tank_id);
CREATE INDEX idx_quarantine_tracking_user ON quarantine_tracking(user_id);
CREATE INDEX idx_quarantine_tracking_status ON quarantine_tracking(status) WHERE status = 'in_progress';

-- RLS Policies
ALTER TABLE quarantine_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quarantine tracking"
  ON quarantine_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quarantine tracking"
  ON quarantine_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quarantine tracking"
  ON quarantine_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quarantine tracking"
  ON quarantine_tracking FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_quarantine_tracking_updated_at
  BEFORE UPDATE ON quarantine_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## Related Specifications

- **Spec 01 (AI Chat Engine)**: Widgets extend the chat interface with rich interactive components
- **Spec 03 (Water Parameters)**: Parameter Troubleshooting widget uses parameter data and thresholds
- **Spec 05 (Maintenance Scheduling)**: Widgets link to maintenance task creation
- **Spec 04 (Species & Livestock)**: Quarantine Checklist relates to livestock addition workflow

---

## Research Reference

Full research and opportunity scoring: `Docs/Tools/agents/memory/research/aquarium-tools-widgets-discovery.md`

**Key Findings:**
- Quarantine Checklist scores 22/25 (highest ROI)
- Water Change Calculator scores 18/25 (quick win)
- Parameter Troubleshooting scores 20/25 (retention driver)
- All widgets solve critical ICP problems (beginner mistakes, math confusion, panic prevention)

---

## Phase 3 Additional Widgets (Deferred)

The following widgets are planned for Phase 3 but not included in this spec:
- Dosing Calculator (400+ product database required)
- Stocking Density Calculator (waste coefficient data required)
- Tank Setup Checklist (onboarding enhancement)
- Feeding Schedule Calculator (pattern learning required)
- Emergency Response Checklist (rare use case)

See roadmap Phase 3 for details.
