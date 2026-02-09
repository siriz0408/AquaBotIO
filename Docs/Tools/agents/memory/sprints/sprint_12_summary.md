# Sprint 12 Summary — Proactive Trend Detection

> Date: 2026-02-09 | Progress: 98% → 100% MVP | Status: COMPLETE

## Goals
1. Build trend analysis Edge Function for proactive parameter monitoring
2. Integrate alert badge into chat header
3. Add "any alerts?" query support in AI chat
4. Create alerts list page for tank management

## Deliverables

### Backend (Agent: adf8b25)

**1. Trend Analysis Edge Function**
- File: `supabase/functions/analyze-parameter-trends/index.ts`
- 665 lines of production-ready code
- Features:
  - Linear regression for slope calculation (change per day)
  - R-squared confidence scoring
  - Spike detection (> 2 std dev from mean)
  - Direction classification: increasing, decreasing, stable, spiking
  - Days-to-threshold projection
  - Event correlation (livestock additions, maintenance)
  - Claude Sonnet 4.5 AI interpretation
  - Alert generation and storage in `proactive_alerts` table

**2. Enhanced Alerts API**
- File: `src/app/api/ai/alerts/route.ts`
- GET with `format=chat` returns markdown summary
- POST with `action: "analyze"` triggers Edge Function
- Severity counts (info, warning, alert) in response

**3. TypeScript Types**
- File: `src/types/database.ts`
- Added: AlertSeverity, AlertStatus, TrendDirection, ProactiveAlert interface

### Frontend (Agent: a083f81)

**4. Alert Badge in Chat Header**
- File: `src/components/chat/chat-top-bar.tsx`
- Fetches active alert count via API
- Shows ProactiveAlertBadge with pulse animation
- Click navigates to alerts page
- Auto-refreshes on `alerts-updated` and `parameter-logged` events

**5. System Prompt Enhancement**
- File: `src/lib/ai/system-prompt.ts`
- Added ALERT_QUERY_INSTRUCTIONS section
- Trigger phrases: "any alerts?", "check my tank", "how's my tank?"
- Proactive-alert code block format specification
- Severity definitions and trend guidelines

**6. Proactive Alert Card in Chat**
- File: `src/components/chat/rich-message.tsx`
- Parses `proactive-alert` code blocks from AI
- Renders ProactiveAlertCard inline
- Dismiss functionality with API call
- Dispatches `alerts-updated` event on dismiss

**7. Alerts List Page**
- File: `src/app/(dashboard)/tanks/[id]/alerts/page.tsx`
- Full alerts page with:
  - Active count and severity breakdown badges
  - Filter tabs: Active, Dismissed, All
  - Dismiss functionality per alert
  - "Ask AquaBot for Help" navigation
  - Empty states with helpful messaging
  - Mobile-responsive design

## Files Created
1. `supabase/functions/analyze-parameter-trends/index.ts` — Edge Function
2. `src/app/(dashboard)/tanks/[id]/alerts/page.tsx` — Alerts page

## Files Modified
1. `src/app/api/ai/alerts/route.ts` — Chat format, analyze trigger
2. `src/components/chat/chat-top-bar.tsx` — Alert badge integration
3. `src/components/chat/chat-container.tsx` — Pass tankId to ChatTopBar
4. `src/components/chat/rich-message.tsx` — Proactive-alert parsing
5. `src/lib/ai/system-prompt.ts` — ALERT_QUERY_INSTRUCTIONS
6. `src/types/database.ts` — ProactiveAlert types
7. `tsconfig.json` — Exclude supabase/functions (Deno)

## Verification
- `npm run build` — PASS (production build successful)
- `npm run typecheck` — PASS (no TypeScript errors)
- `npm run lint` — PASS (no new ESLint errors)

## Algorithm Details

### Trend Detection
```typescript
// Per-parameter analysis steps:
1. Extract values from last 14 days
2. Calculate linear regression (slope = rate of change/day)
3. Calculate R-squared for confidence (0-1)
4. Check for spikes (value > 2 std dev from mean)
5. Project days until threshold breach
6. Classify direction: increasing/decreasing/stable/spiking
```

### AI Interpretation Prompt
```
You are analyzing water parameter trends for an aquarium.
Input: Tank info, parameter trends, recent events
Output: Structured alerts with severity, projection, cause, action
```

### Alert Generation Rules
- Minimum 3 data points required
- Concerning trend: slope > 0.01 with confidence > 0.3
- OR approaching danger threshold within 30 days
- OR spiking (> 2 std dev from mean)

## Deployment Notes

### Edge Function Deployment
```bash
# Deploy to Supabase
npx supabase functions deploy analyze-parameter-trends

# Required secrets (auto-set in Supabase):
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - ANTHROPIC_API_KEY (must be manually set)
```

### Testing
```bash
# Trigger analysis via API
POST /api/ai/alerts
{ "action": "analyze", "tank_id": "<uuid>" }

# Get alerts in chat format
GET /api/ai/alerts?tank_id=<uuid>&format=chat
```

## What This Unlocks
- AI proactively detects concerning parameter trends BEFORE disasters
- Users get early warnings: "pH dropping 0.1/week, will hit danger in 2 weeks"
- Event correlation: "This spike started 2 days after you added 3 new fish"
- Actionable suggestions: "Consider a 20% water change this weekend"
- Alert badge creates daily engagement loop
- "Any alerts?" query in chat for quick status check

## Sprint 12 Completes Spec 17

| Requirement | Status |
|-------------|--------|
| R-017.1 Proactive Trend Detection | ✅ Complete |
| R-017.2 Action Execution Backend | ✅ Sprint 11 |
| R-017.3 Action Execution Frontend | ✅ Sprint 11 |
| R-017.4 Trend Analysis Edge Function | ✅ Complete |

## Next Recommendations

**Phase 2 Complete — Ready for Production**

P1 enhancements for future sprints:
1. Push notification delivery for critical alerts
2. Email digest for daily alert summary
3. Cron job for automatic daily trend analysis
4. Alert preferences (frequency, delivery methods)

**Phase 3 considerations:**
- Predictive analytics (forecast future states)
- Cross-tank intelligence
- Adaptive learning from user patterns
