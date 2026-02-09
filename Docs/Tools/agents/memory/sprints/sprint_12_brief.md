# Sprint 12 Brief — Proactive Trend Detection

> **Date:** 2026-02-09 | **Target:** 98% → 100% MVP (Phase 2 feature)

## Goals

Complete R-017.1 (Proactive Parameter Trend Detection) and R-017.4 (Trend Analysis Edge Function) from Spec 17.

## Why This Sprint

Sprint 11 built the **action execution foundation** — users can log parameters, add livestock, and schedule tasks directly from chat. Now we need the **proactive intelligence** — the AI should detect concerning trends BEFORE problems occur and alert users.

This completes the core AI proactive intelligence feature, making AquaBot a true "AI agent with hands" that proactively monitors tank health.

## Deliverables

### Backend Agent (P0)

**1. Trend Analysis Edge Function**
- File: `supabase/functions/analyze-parameter-trends/index.ts`
- Analyzes last 7-14 days of parameter data per tank
- Calculates:
  - Rate of change (slope) for each parameter
  - Proximity to thresholds
  - Pattern breaks (sudden spikes/drops)
- Correlates with recent events (livestock additions, maintenance)
- Calls Claude Sonnet 4.5 to interpret trends and generate alert text
- Creates alerts in `proactive_alerts` table

**2. Alerts API Enhancement**
- File: `src/app/api/ai/alerts/route.ts` (already exists)
- Ensure GET returns alerts with severity counts
- Add support for "any alerts?" query context in chat

**3. Cron Job Configuration**
- Add cron trigger for daily trend analysis (9 AM UTC)
- Or implement on-parameter-log trigger as fallback

### Frontend Agent (P0)

**4. Alert Badge in Chat Header**
- File: `src/components/chat/chat-top-bar.tsx`
- Fetch active alert count for current tank
- Show ProactiveAlertBadge when count > 0
- Click navigates to alert list or opens in chat

**5. "Any Alerts?" Query Support**
- Update system prompt: `src/lib/ai/system-prompt.ts`
- Add ALERT_QUERY_INSTRUCTIONS section
- AI should fetch and display active alerts when asked

**6. ProactiveAlertCard Integration in Chat**
- File: `src/components/chat/rich-message.tsx`
- Parse `proactive-alert` code blocks from AI response
- Render ProactiveAlertCard components inline
- Wire up dismiss functionality

**7. Alert List View**
- File: `src/app/(dashboard)/tanks/[id]/alerts/page.tsx`
- List all active alerts for tank
- Dismiss/resolve actions
- Navigate to from alert badge

## Acceptance Criteria

1. ✅ Given a tank has pH dropping 0.1 per week for 3 weeks, When trend analysis runs, Then a proactive alert is generated with trend description and suggested action
2. ✅ Given user opens chat with active alerts, When the chat header loads, Then alert badge shows count with pulse animation
3. ✅ Given user asks "any alerts?", When AI responds, Then it shows all active alerts with trend analysis
4. ✅ Given user dismisses an alert, When they click dismiss, Then alert status updates to "dismissed"
5. ✅ `npm run build` passes
6. ✅ `npm run typecheck` passes
7. ✅ Edge Function deploys successfully

## Technical Notes

### Trend Analysis Algorithm

```typescript
// Per-parameter analysis
interface TrendAnalysis {
  parameter: string;
  values: { date: string; value: number }[];
  slope: number;           // Rate of change per day
  direction: 'increasing' | 'decreasing' | 'stable' | 'spiking';
  daysToThreshold: number; // Projected days until danger zone
  confidence: number;      // 0-1 based on data points
}

// Minimum 3 data points required for trend analysis
// Use linear regression for slope calculation
// Flag as 'spiking' if last value is >2 std dev from mean
```

### Claude AI Call (Edge Function)

```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 500,
  system: `You are analyzing water parameter trends for an aquarium.
Generate a proactive alert if concerning trends exist.`,
  messages: [{
    role: "user",
    content: JSON.stringify({
      tank: { name, type, volume, livestock_count },
      parameters: trendAnalyses,
      recent_events: { livestock_added, maintenance_completed },
      thresholds: userThresholds || defaultThresholds
    })
  }]
});
```

### Response Format from AI

```json
{
  "alerts": [
    {
      "parameter": "pH",
      "severity": "warning",
      "trend_direction": "decreasing",
      "projection_text": "pH has dropped 0.3 over 3 weeks. At this rate, it will reach the danger zone in 2 weeks.",
      "likely_cause": "This trend started after you added 3 new fish on Feb 1",
      "suggested_action": "Consider doing a 20% water change and checking your KH levels"
    }
  ]
}
```

## Files to Create

1. `supabase/functions/analyze-parameter-trends/index.ts`
2. `src/app/(dashboard)/tanks/[id]/alerts/page.tsx`

## Files to Modify

1. `src/components/chat/chat-top-bar.tsx` — Add alert badge
2. `src/components/chat/rich-message.tsx` — Parse proactive-alert blocks
3. `src/lib/ai/system-prompt.ts` — Add ALERT_QUERY_INSTRUCTIONS
4. `src/app/api/ai/alerts/route.ts` — Enhance GET response

## Dependencies

- Sprint 11 complete (proactive_alerts table, AlertCard components)
- Claude Sonnet 4.5 API access
- Supabase Edge Functions runtime

## Exit Criteria

- Trend analysis runs and generates alerts for test tank
- Alert badge appears in chat header when alerts exist
- "Any alerts?" returns formatted alert cards
- Build and typecheck pass
- Edge Function deploys to Supabase
