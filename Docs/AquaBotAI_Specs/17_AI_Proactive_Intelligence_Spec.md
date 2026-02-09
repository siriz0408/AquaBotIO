# AI Proactive Intelligence & Action Execution — Feature Specification
**Aquatic AI | R-017 | P1 — Should Have (Phase 2 Priority)**

---

## Problem Statement

Aquarium hobbyists currently discover problems only when they manually check parameters or when issues become emergencies. The AI chat assistant is reactive — it answers questions but doesn't proactively detect issues or take actions. Two critical gaps exist:

1. **Proactive Detection Gap**: User story US-4 from Spec 01 explicitly calls for "AI proactively alerts when detecting concerning trends" but this is not implemented. Users only discover parameter problems when they manually check, by which time issues may have progressed.

2. **Action Execution Gap**: Spec 01 says "conversational actions" but implementation only has action buttons that link to pages — users still navigate away from chat. The AI can't actually execute actions (log parameters, add livestock, schedule tasks) directly from conversation.

These gaps prevent AquaBot from being a true "AI agent with hands" — an assistant that doesn't just answer questions but proactively detects problems and takes actions on behalf of users.

---

## Goals

- **G1**: Enable AI to proactively detect concerning parameter trends BEFORE thresholds are breached, alerting users early
- **G2**: Enable AI to execute actions directly from chat (log parameters, add livestock, schedule maintenance) without requiring navigation
- **G3**: Create daily engagement loop — users check app daily for proactive alerts, driving retention
- **G4**: Differentiate from competitors — no other aquarium app has proactive AI alerts or true conversational action execution
- **G5**: Reduce disaster rate — catch problems early through trend detection, not just threshold violations

---

## Non-Goals

- **NG1**: Autonomous actions without user confirmation — AI always asks for confirmation before executing actions
- **NG2**: Real-time IoT sensor integration — proactive alerts use manually logged parameters only
- **NG3**: Multi-user collaboration — alerts and actions are single-user, per-tank context only
- **NG4**: Predictive analytics (forecasting future states) — Phase 3 consideration, not included in Phase 2
- **NG5**: Cross-tank intelligence — alerts are per-tank only, no aggregated learning across tanks
- **NG6**: Email-only alerts — push notifications and in-app alerts are primary, email is P1 enhancement

---

## User Stories

### Intermediate Hobbyist (The Optimizer)

- **US-P1**: As an intermediate keeper, I want the AI to proactively alert me when it detects concerning trends in my tank data (e.g., rising nitrates, pH drift), so I can address issues before they become emergencies.

- **US-P2**: As an intermediate keeper, I want the AI to correlate parameter spikes with recent events (e.g., "This ammonia spike happened 2 days after you added 3 new fish"), so I understand cause and effect.

### Beginner Hobbyist

- **US-P3**: As a beginner, I want the AI to alert me BEFORE parameters reach danger zones, so I have time to fix problems without panicking.

- **US-P4**: As a beginner, I want to tell the AI "pH is 7.2, ammonia 0, nitrite 0, nitrate 20" and have it log these parameters directly, so I don't have to navigate to a form.

### Advanced Keeper

- **US-P5**: As an advanced keeper, I want the AI to detect gradual trends (not just threshold violations), so I can address slow-moving problems before they become critical.

- **US-P6**: As an advanced keeper, I want the AI to execute complex multi-step actions (e.g., "Add 3 neon tetras" → compatibility check → confirmation → add livestock → suggest quarantine), so I can manage my tank conversationally.

### All Users

- **US-P7**: As a user, I want to ask "any alerts?" and see all proactive findings for my tank, so I can review concerns in one place.

- **US-P8**: As a user, I want the AI to confirm actions before executing them, so I maintain control over my tank management.

- **US-P9**: As a user, I want action execution to work seamlessly in chat with clear success/error feedback, so I trust the AI to help manage my tank.

---

## Requirements

### Must-Have (P0)

#### R-017.1: Proactive Parameter Trend Detection

**Description**: AI analyzes parameter trends daily (or on parameter log) to detect concerning patterns BEFORE thresholds are breached. Alerts users proactively with trend analysis, correlation with events, and suggested actions.

**Detection Logic:**
- **Trend Analysis**: Analyzes last 7-14 days of parameter data to identify:
  - Gradual increases/decreases (e.g., pH dropping 0.1 per week)
  - Accelerating trends (e.g., nitrate rising faster than normal)
  - Pattern breaks (e.g., stable parameters suddenly spiking)
- **Threshold Proximity**: Flags parameters approaching danger zones (e.g., "pH will hit danger zone in 2 weeks at current rate")
- **Event Correlation**: Correlates parameter changes with recent events:
  - Livestock additions (last 7 days)
  - Maintenance actions (water changes, filter cleaning)
  - Equipment changes
- **Personalization**: Uses user's custom thresholds OR tank-specific safe ranges based on livestock

**Alert Content:**
- Parameter name and current value
- Trend description: "pH has been dropping 0.1 per week for 3 weeks"
- Projection: "At this rate, pH will hit danger zone in 2 weeks"
- Likely cause: "This trend started 2 days after you added 3 new fish"
- Suggested action: "I've drafted a water change reminder for tomorrow. Should I schedule it?"

**Delivery Methods:**
- **In-app alert badge**: Red dot on chat icon when alerts exist
- **Chat query**: User asks "any alerts?" → AI shows all proactive findings
- **Push notification**: (P1) Daily digest or real-time for critical alerts

**Acceptance Criteria:**
- Given a user's pH has been dropping 0.1 per week for 3 weeks, When the system analyzes trends, Then a proactive alert is generated before pH reaches danger zone
- Given a user asks "any alerts?", When the AI responds, Then all proactive findings are shown with trend analysis and suggested actions
- Given a parameter spike correlates with recent livestock addition, When the alert is generated, Then it includes the correlation: "This spike happened 2 days after you added 3 new fish"
- Given a user has custom thresholds set, When trend analysis runs, Then it uses those thresholds instead of defaults

---

#### R-017.2: Action Execution Backend

**Description**: Backend API endpoints that execute actions directly from AI chat requests. Supports logging parameters, adding livestock, scheduling maintenance, and completing tasks with proper validation and error handling.

**API Endpoint:** `POST /api/ai/actions/execute`

**Request Format:**
```typescript
{
  action: "log_parameters" | "add_livestock" | "schedule_maintenance" | "complete_maintenance",
  tank_id: string,
  payload: {
    // For log_parameters:
    parameters: { ph?: number, ammonia?: number, nitrite?: number, nitrate?: number, ... },
    // For add_livestock:
    species_id: string,
    quantity: number,
    // For schedule_maintenance:
    task_type: string,
    due_date: string,
    frequency?: string,
    // For complete_maintenance:
    task_id: string,
    notes?: string
  },
  confirmation_token?: string // From user confirmation step
}
```

**Response Format:**
```typescript
{
  success: boolean,
  data: {
    action_id: string,
    executed_at: string,
    result: any // Action-specific result data
  } | null,
  error: {
    code: string,
    message: string,
    details?: any
  } | null
}
```

**Supported Actions:**

1. **log_parameters**: Logs water test results
   - Validates parameter values are within reasonable ranges
   - Creates entry in `water_parameters` table
   - Triggers proactive trend analysis (R-017.1)
   - Returns success with logged values

2. **add_livestock**: Adds species to tank inventory
   - Runs compatibility check before adding
   - Validates tank capacity and species requirements
   - Creates entry in `livestock` table
   - Returns success with added species details

3. **schedule_maintenance**: Creates maintenance task
   - Parses natural language dates/times
   - Validates task type and frequency
   - Creates entry in `maintenance_tasks` table
   - Returns success with scheduled task details

4. **complete_maintenance**: Marks task as complete
   - Validates task exists and belongs to user
   - Creates log entry in `maintenance_logs` table
   - Advances next_due_date for recurring tasks
   - Returns success with completion timestamp

**Error Handling:**
- Validation errors: Invalid parameter values, missing required fields
- Authorization errors: User doesn't own tank, task doesn't exist
- Business logic errors: Compatibility conflicts, capacity exceeded
- All errors return user-friendly messages with guidance

**Acceptance Criteria:**
- Given a user confirms "log pH 7.2, ammonia 0", When the API is called, Then parameters are logged successfully and success response is returned
- Given a user tries to add incompatible species, When the API is called, Then an error is returned with compatibility details
- Given a user schedules maintenance with invalid date, When the API is called, Then a validation error is returned with guidance
- Given an action execution fails, When the error is returned, Then it includes a user-friendly message explaining why and how to fix it

---

#### R-017.3: Action Execution Frontend

**Description**: Frontend components and flows that enable AI to execute actions from chat with user confirmation, success feedback, and error handling.

**Confirmation Flow:**
1. User sends natural language request: "log pH 7.2, ammonia 0"
2. AI parses intent and prepares action: "I'll log pH 7.2 and ammonia 0. Confirm?"
3. User confirms via button or "yes" message
4. Frontend calls `/api/ai/actions/execute` with confirmation token
5. Success: AI shows confirmation message with executed action details
6. Error: AI shows error message with guidance

**Confirmation UI:**
- Inline confirmation button in chat: "✅ Confirm" / "❌ Cancel"
- Or user types "yes" / "confirm" to proceed
- Confirmation includes action summary: "I'll log pH 7.2 and ammonia 0 for your tank"

**Success Feedback:**
- AI message: "✅ Logged pH 7.2 and ammonia 0 for [Tank Name]"
- Optional: Show updated parameter values or task details
- Action buttons update if relevant (e.g., "View Parameters" after logging)

**Error Feedback:**
- AI message: "❌ Couldn't log parameters: [error message]. [Guidance on how to fix]"
- Retry option if appropriate
- Fallback to manual entry link if action fails

**Action Parsing:**
- AI uses system prompt instructions to parse natural language
- Supported patterns:
  - "log pH 7.2, ammonia 0, nitrite 0, nitrate 20"
  - "add 3 neon tetras"
  - "schedule water change for Saturday"
  - "mark water change as complete"

**Acceptance Criteria:**
- Given a user says "log pH 7.2", When the AI responds, Then it shows confirmation prompt with parsed values
- Given a user confirms an action, When the action executes, Then success message is shown with executed details
- Given an action execution fails, When the error is returned, Then AI shows user-friendly error message with guidance
- Given a user cancels an action, When they click cancel, Then no action is executed and AI acknowledges cancellation

---

#### R-017.4: Trend Analysis Edge Function

**Description**: Supabase Edge Function that analyzes parameter trends daily (or on parameter log) and generates proactive alerts. Calls Claude AI to interpret trends and generate natural language alerts.

**Function:** `analyze-parameter-trends`

**Trigger:**
- Daily cron job (runs at 9 AM user timezone)
- On parameter log (optional — can be enabled per user)

**Input:**
- `tank_id`: Tank to analyze
- `user_id`: User who owns the tank
- `parameter_history`: Last 14 days of parameter entries

**Analysis Steps:**
1. **Data Preparation**: Extract parameter values for last 7-14 days, group by parameter type
2. **Trend Detection**: Calculate:
   - Rate of change (slope)
   - Acceleration (change in rate)
   - Proximity to thresholds
   - Pattern breaks (sudden changes)
3. **Event Correlation**: Query recent events:
   - Livestock additions (last 7 days)
   - Maintenance actions (last 14 days)
   - Equipment changes
4. **AI Interpretation**: Call Claude Sonnet 4.5 with:
   - Parameter history
   - Trend calculations
   - Recent events
   - Tank context (livestock, type, volume)
   - User's custom thresholds
5. **Alert Generation**: AI returns:
   - Trend description
   - Projection
   - Likely cause
   - Suggested action

**Output:**
- Alert records stored in `proactive_alerts` table (new table)
- Alert badge updated (in-app notification)
- Optional: Push notification or email digest

**Acceptance Criteria:**
- Given a tank has pH dropping 0.1 per week for 3 weeks, When the function runs, Then it generates a proactive alert with trend analysis
- Given a parameter spike correlates with recent livestock addition, When the function runs, Then it includes correlation in the alert
- Given a tank has insufficient data (< 3 data points), When the function runs, Then it skips analysis and logs reason
- Given a user has custom thresholds, When the function runs, Then it uses those thresholds for analysis

---

### Nice-to-Have (P1)

- **R-017.5: Push Notification Delivery** — Send proactive alerts via PWA push notifications
- **R-017.6: Email Digest** — Daily email summary of all proactive alerts
- **R-017.7: Alert Preferences** — User-configurable alert frequency and delivery methods
- **R-017.8: Multi-Step Action Flows** — Complex workflows like "Add fish → Check compatibility → Schedule quarantine → Log parameters"

---

### Future Considerations (P2)

- **R-017.9: Predictive Analytics** — Forecast future parameter states based on trends
- **R-017.10: Cross-Tank Intelligence** — Learn from patterns across multiple tanks
- **R-017.11: Adaptive Learning** — AI learns user patterns and pre-fills forms automatically

---

## Success Metrics

### Leading Indicators
- **Alert Generation Rate**: 30%+ of tanks with 7+ days of data receive at least one proactive alert per week
- **Action Execution Rate**: 50%+ of users who see action confirmation prompts execute the action
- **Daily Engagement**: 40%+ of users check for alerts daily (via "any alerts?" query or alert badge)

### Lagging Indicators
- **Disaster Prevention**: 30%+ reduction in parameter-related emergencies (measured by users logging parameters in danger zone)
- **Retention Impact**: Users who receive proactive alerts have 20%+ higher 30-day retention
- **Action Adoption**: 60%+ of parameter logs happen via conversational action execution (vs. manual form entry)

### Engagement Metrics
- **Chat Message Increase**: Average AI messages per user per day increases by 25%+ (alerts drive engagement)
- **Alert Response Rate**: 70%+ of users who receive alerts take suggested actions

---

## Data Model Changes

### New Table: `proactive_alerts`

**Purpose**: Store proactive alerts generated by trend analysis.

**Schema:**
```sql
CREATE TABLE proactive_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parameter VARCHAR(50) NOT NULL, -- e.g., 'pH', 'ammonia', 'nitrate'
  current_value DECIMAL(8,2),
  unit VARCHAR(10),
  trend_direction VARCHAR(20) NOT NULL, -- 'increasing', 'decreasing', 'stable', 'spiking'
  trend_rate DECIMAL(8,4), -- Rate of change per day/week
  projection_text TEXT, -- AI-generated projection: "pH will hit danger zone in 2 weeks"
  likely_cause TEXT, -- AI-generated correlation: "This spike happened 2 days after you added 3 new fish"
  suggested_action TEXT, -- AI-generated action: "I've drafted a water change reminder for tomorrow"
  severity VARCHAR(20) NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'alert'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'dismissed', 'resolved'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by_action_id UUID -- Links to action that resolved the alert
);

CREATE INDEX idx_proactive_alerts_tank ON proactive_alerts(tank_id);
CREATE INDEX idx_proactive_alerts_user ON proactive_alerts(user_id);
CREATE INDEX idx_proactive_alerts_status ON proactive_alerts(status) WHERE status = 'active';
CREATE INDEX idx_proactive_alerts_created ON proactive_alerts(created_at DESC);
```

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- INSERT/UPDATE/DELETE: `auth.uid() = user_id`

**Triggers:**
- `update_updated_at()` — Auto-update timestamps

---

## AI Integration Points

### System Prompt Enhancements

Add to `src/lib/ai/system-prompt.ts`:

**Proactive Alert Instructions:**
```
## Proactive Alert Detection

When analyzing parameters, proactively detect concerning trends:

1. **Trend Analysis**: Look for:
   - Gradual increases/decreases over 7+ days
   - Accelerating trends (rate of change increasing)
   - Parameters approaching danger zones
   - Pattern breaks (sudden changes)

2. **Event Correlation**: Correlate parameter changes with:
   - Recent livestock additions (last 7 days)
   - Maintenance actions (water changes, filter cleaning)
   - Equipment changes

3. **Alert Generation**: When you detect a concerning trend:
   - Describe the trend: "pH has been dropping 0.1 per week for 3 weeks"
   - Project future state: "At this rate, pH will hit danger zone in 2 weeks"
   - Identify likely cause: "This trend started 2 days after you added 3 new fish"
   - Suggest action: "I've drafted a water change reminder for tomorrow. Should I schedule it?"

4. **Alert Delivery**: When user asks "any alerts?" or "check my parameters", show all proactive findings.
```

**Action Execution Instructions:**
```
## Action Execution

When user requests an action, follow this flow:

1. **Parse Intent**: Extract action type and parameters from natural language
   - "log pH 7.2, ammonia 0" → log_parameters with {ph: 7.2, ammonia: 0}
   - "add 3 neon tetras" → add_livestock with {species: "neon tetra", quantity: 3}
   - "schedule water change for Saturday" → schedule_maintenance with {type: "water_change", due_date: "Saturday"}

2. **Validate Action**: Check:
   - Required parameters are present
   - Values are within reasonable ranges
   - User has permission (tank ownership, tier limits)

3. **Confirm with User**: Show confirmation prompt:
   - "I'll log pH 7.2 and ammonia 0 for [Tank Name]. Confirm?"
   - Wait for user confirmation ("yes", "confirm", or button click)

4. **Execute Action**: Call /api/ai/actions/execute with parsed action and confirmation token

5. **Handle Response**:
   - Success: "✅ Logged pH 7.2 and ammonia 0 for [Tank Name]"
   - Error: "❌ Couldn't log parameters: [error]. [Guidance]"

Always confirm before executing actions. Never execute without explicit user confirmation.
```

---

## Component Specifications

### ProactiveAlertBadge Component

**File**: `src/components/chat/proactive-alert-badge.tsx`

**Props:**
```typescript
interface ProactiveAlertBadgeProps {
  tankId: string;
  alertCount: number;
  onClick: () => void;
  className?: string;
}
```

**Features:**
- Red dot badge showing alert count
- Appears on chat icon when alerts exist
- Click opens alert list in chat
- Auto-updates when new alerts are generated

---

### ActionConfirmationModal Component

**File**: `src/components/chat/action-confirmation-modal.tsx`

**Props:**
```typescript
interface ActionConfirmationModalProps {
  action: {
    type: string;
    description: string;
    payload: any;
  };
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}
```

**Features:**
- Shows action summary: "I'll log pH 7.2 and ammonia 0 for [Tank Name]"
- Confirm/Cancel buttons
- Loading state during execution
- Success/error feedback

---

## Open Questions

1. **Alert Frequency**: Daily digest vs. real-time alerts? **Recommendation**: Daily digest for non-critical, real-time for critical (alert severity).

2. **Tier Gating**: Should proactive alerts be Pro-only, or free for all? **Recommendation**: Basic threshold alerts free, trend detection Pro-only.

3. **Action Confirmation**: Always confirm, or allow "trusted" actions without confirmation? **Recommendation**: Always confirm for v1, add trusted actions in v2.

4. **Trend Analysis Frequency**: Daily cron vs. on parameter log? **Recommendation**: Daily cron for all tanks, optional on-log for immediate feedback.

5. **Alert Dismissal**: How long do dismissed alerts stay dismissed? **Recommendation**: Dismissed alerts stay dismissed until new data suggests the trend continues.

6. **Error Recovery**: If action execution fails, should AI retry automatically? **Recommendation**: No auto-retry. Show error and let user decide.

---

## Implementation Notes

### Edge Function Deployment

Create migration: `supabase/migrations/YYYYMMDDHHMMSS_sprint11_proactive_alerts.sql`

```sql
-- Proactive alerts table
CREATE TABLE IF NOT EXISTS proactive_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parameter VARCHAR(50) NOT NULL,
  current_value DECIMAL(8,2),
  unit VARCHAR(10),
  trend_direction VARCHAR(20) NOT NULL CHECK (trend_direction IN ('increasing', 'decreasing', 'stable', 'spiking')),
  trend_rate DECIMAL(8,4),
  projection_text TEXT,
  likely_cause TEXT,
  suggested_action TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'alert')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by_action_id UUID
);

CREATE INDEX idx_proactive_alerts_tank ON proactive_alerts(tank_id);
CREATE INDEX idx_proactive_alerts_user ON proactive_alerts(user_id);
CREATE INDEX idx_proactive_alerts_status ON proactive_alerts(status) WHERE status = 'active';
CREATE INDEX idx_proactive_alerts_created ON proactive_alerts(created_at DESC);

-- RLS Policies
ALTER TABLE proactive_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own proactive alerts"
  ON proactive_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proactive alerts"
  ON proactive_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proactive alerts"
  ON proactive_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proactive alerts"
  ON proactive_alerts FOR DELETE
  USING (auth.uid() = user_id);
```

### API Route Implementation

**File**: `src/app/api/ai/actions/execute/route.ts`

- Validate request (auth, tank ownership, action type)
- Parse action payload based on action type
- Execute action (call existing APIs or database directly)
- Return success/error response
- Log action in `ai_usage` table

---

## Related Specifications

- **Spec 01 (AI Chat Engine)**: Proactive alerts and action execution extend the chat interface
- **Spec 03 (Water Parameters)**: Trend analysis uses parameter data and thresholds
- **Spec 05 (Maintenance Scheduling)**: Action execution includes scheduling maintenance tasks
- **Spec 04 (Species & Livestock)**: Action execution includes adding livestock with compatibility checks

---

## Research Reference

Full research and opportunity scoring: `Docs/Tools/agents/memory/research/ai-enhancement-opportunities-discovery.md`

**Key Findings:**
- Proactive Parameter Alerts scores 23/25 (highest ROI)
- Full Action Execution scores 22/25 (core capability)
- Both features address explicit gaps in current implementation
- Creates daily engagement loop and strong AI differentiation

---

## Phase 3 Additional Features (Deferred)

The following features are planned for Phase 3 but not included in this spec:
- Predictive Analytics (forecasting future parameter states)
- Cross-Tank Intelligence (learning from patterns across tanks)
- Adaptive Learning (AI learns user patterns automatically)

See roadmap Phase 3 for details.
