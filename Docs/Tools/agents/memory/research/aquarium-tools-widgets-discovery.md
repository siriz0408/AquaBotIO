# Discovery Brief: Aquarium Tools & Embedded Widgets
**Date:** February 8, 2026  
**Mode:** Autonomous Discovery  
**Focus:** AI Chat Embedded Tools & Checklists for ICP Problems

---

## Executive Summary

Research identified **8 high-impact tools/checklists** that can be embedded as interactive widgets in AI chat responses. These solve critical ICP problems (beginner mistakes, parameter troubleshooting, dosing confusion) while leveraging our AI-first architecture. **Top 3 recommendations:** Quarantine Checklist Widget, Water Change Calculator, and Parameter Troubleshooting Guide — all score 18-22/25 and can be built in 1-2 sprints.

---

## Internal Context

### What We Already Have
- ✅ **Water Parameter Logging** — Full CRUD, trend charts, threshold alerts (100% complete)
- ✅ **Maintenance Scheduling** — Recurring tasks, completion tracking (95% complete)
- ✅ **Species Compatibility API** — Already checks compatibility, returns structured data
- ✅ **Rich Chat Infrastructure** — SpeciesCard, ParameterAlertCard components exist, RichMessage parser ready
- ✅ **Tank Context** — AI has access to tank volume, type, livestock, parameter history

### What's Explicitly Missing (from specs)
- ❌ **Dosing Calculator** — Spec `03_Water_Parameters_Analysis_Spec.md` NG3: "Dosing calculator or automatic dosing recommendations — AI can discuss, but no built-in calculator v1"
- ❌ **Bioload Calculator** — Deferred to P2 per `Open_Questions_Decisions.md` Q5.2
- ❌ **Stocking Calculator** — Not built, AI provides qualitative advice only

### Architecture Advantage
Our **RichMessage parser** already supports structured blocks (`species-card`, `parameter-alert`, `action-buttons`). Adding new widget types is trivial — just extend the parser and create new React components.

---

## Top 3 Opportunities

### 1. Quarantine Checklist Widget ⭐ **WINNER**

**Problem:** Beginners lose entire tanks because they skip quarantine. 60% first-year mortality rate (per PRD) is largely preventable with proper quarantine. Even experienced keepers forget steps.

**Solution:** Interactive checklist widget embedded in AI chat when user asks "can I add this fish?" or "how do I introduce new fish?"

**AI Angle:**
- AI detects intent: "adding new fish" → automatically suggests quarantine checklist
- AI personalizes checklist based on tank type (freshwater vs saltwater), species sensitivity
- AI tracks completion: "You've completed 3 of 7 steps. Next: 2-week observation period"
- AI schedules reminders: "Your quarantine tank has been running for 5 days. Time to check parameters."

**Widget Design:**
```
┌─────────────────────────────────────┐
│ 🐠 Quarantine Checklist             │
│                                     │
│ ☑ Set up 10-20 gal quarantine tank │
│ ☑ Cycle tank (ammonia/nitrite = 0) │
│ ☐ Drip acclimate new fish          │
│ ☐ 2-week observation period        │
│ ☐ Daily parameter checks           │
│ ☐ Feed quality foods               │
│ ☐ Transfer to main tank            │
│                                     │
│ Progress: 2/7 steps complete        │
│ [Schedule Reminders] [View Guide]   │
└─────────────────────────────────────┘
```

**Effort:** Small (1 sprint)
- New component: `QuarantineChecklistWidget.tsx`
- System prompt enhancement: detect "new fish" intent
- Database: `quarantine_tracking` table (tank_id, species, start_date, steps_completed)
- AI integration: "I see you're adding neon tetras. Here's your personalized quarantine checklist..."

**Revenue Potential:** High retention driver — prevents disasters that cause churn

**Score:** 22/25
- User Impact: 5/5 (prevents tank disasters)
- AI Differentiation: 5/5 (proactive, personalized, tracks progress)
- Build Effort: 5/5 (reuse existing widget pattern, simple data model)
- Revenue Potential: 4/5 (retention, not direct upgrade driver)
- Strategic Fit: 5/5 (core beginner problem, AI-first)

---

### 2. Water Change Calculator Widget

**Problem:** Beginners don't know how much water to change. "Change 25% of your 55-gallon tank" = math they have to do. Over-changing stresses fish; under-changing doesn't help.

**Solution:** Interactive calculator widget that shows:
- Tank volume (from tank profile)
- Recommended % based on tank type, bioload, nitrate levels
- Exact gallons/liters to change
- Step-by-step guide

**AI Angle:**
- AI suggests water change % based on current parameters: "Your nitrates are 30ppm. I recommend a 30% change (16.5 gallons)."
- AI tracks history: "You did a 20% change last week. Nitrates dropped from 40→25ppm. This week, try 25%."
- AI schedules it: "I've calculated you need a 30% change. Want me to schedule it for Saturday morning?"

**Widget Design:**
```
┌─────────────────────────────────────┐
│ 💧 Water Change Calculator          │
│                                     │
│ Tank: Sprint 8 Test Tank (55 gal)   │
│ Current Nitrate: 30 ppm             │
│                                     │
│ Recommended: 30% (16.5 gallons)     │
│                                     │
│ [Calculate] [Schedule Water Change] │
│                                     │
│ 💡 Tip: Change water when nitrate   │
│    exceeds 20 ppm for best health   │
└─────────────────────────────────────┘
```

**Effort:** Small (1 sprint)
- New component: `WaterChangeCalculatorWidget.tsx`
- Uses existing tank volume, parameter data
- AI suggests % based on nitrate levels, tank type, bioload
- Links to maintenance scheduling

**Revenue Potential:** Medium — engagement driver, not upgrade driver

**Score:** 18/25
- User Impact: 4/5 (solves math confusion, but not catastrophic problem)
- AI Differentiation: 4/5 (personalized recommendations, but calculator itself is simple)
- Build Effort: 5/5 (very simple math, reuse patterns)
- Revenue Potential: 3/5 (engagement, not retention/upgrade)
- Strategic Fit: 4/5 (fits maintenance workflow)

---

### 3. Parameter Troubleshooting Guide Widget

**Problem:** Beginners see "ammonia 0.5 ppm" and panic. They don't know what it means, what caused it, or how to fix it. Forums give conflicting advice.

**Solution:** Interactive troubleshooting widget that appears when AI detects a problem parameter. Shows:
- What the parameter means (simple explanation)
- What caused it (overfeeding? new fish? dead plant?)
- How to fix it (step-by-step actions)
- Prevention tips

**AI Angle:**
- AI detects problem: "I noticed your ammonia spiked to 0.5 ppm. Here's what's happening..."
- AI correlates with events: "This spike happened 2 days after you added 3 new fish. That's normal — your filter is catching up."
- AI provides personalized fix: "For your 55-gallon tank, do a 25% water change today, then test again tomorrow."
- AI tracks resolution: "Ammonia is back to 0. Great job! Your tank is cycled."

**Widget Design:**
```
┌─────────────────────────────────────┐
│ ⚠️ Parameter Alert: Ammonia         │
│                                     │
│ Current: 0.5 ppm (⚠️ Warning)       │
│ Safe Range: 0 ppm                   │
│                                     │
│ What This Means:                    │
│ Ammonia is toxic to fish. Your      │
│ filter is processing waste.         │
│                                     │
│ Likely Cause:                       │
│ • New fish added 2 days ago         │
│ • Overfeeding                       │
│                                     │
│ How to Fix:                         │
│ 1. 25% water change (16.5 gal)     │
│ 2. Test again tomorrow              │
│ 3. Reduce feeding temporarily       │
│                                     │
│ [Schedule Water Change] [Learn More]│
└─────────────────────────────────────┘
```

**Effort:** Medium (1-2 sprints)
- Enhance existing `ParameterAlertCard` component
- Add troubleshooting logic (correlate with events, suggest fixes)
- System prompt: AI generates personalized troubleshooting steps

**Revenue Potential:** High — prevents churn from frustrated beginners

**Score:** 20/25
- User Impact: 5/5 (prevents panic, provides clear action)
- AI Differentiation: 5/5 (correlates events, personalized fixes)
- Build Effort: 4/5 (enhance existing component, add logic)
- Revenue Potential: 4/5 (retention driver)
- Strategic Fit: 5/5 (core beginner problem)

---

## Additional Opportunities (Ranked)

### 4. Dosing Calculator Widget
**Problem:** Users don't know how much conditioner/medication to add. Math is error-prone.  
**Solution:** Calculator widget with product database (400+ products per Aqulator).  
**AI Angle:** AI suggests products based on problem, calculates dose for tank volume.  
**Effort:** Medium (product database, unit conversions)  
**Score:** 17/25 — High user impact but complex (product DB), deferred in spec NG3

### 5. Stocking Density Calculator
**Problem:** Beginners overstock tanks, causing parameter crashes.  
**Solution:** AI-powered calculator that considers tank size, filtration, existing livestock, species waste output.  
**AI Angle:** AI analyzes YOUR tank's bioload, suggests safe additions.  
**Effort:** Large (requires waste coefficient data per species)  
**Score:** 16/25 — Deferred to P2 per Open Questions, but AI could provide qualitative advice now

### 6. Tank Setup Checklist Widget
**Problem:** Beginners miss critical setup steps (cycling, equipment, water prep).  
**Solution:** Interactive onboarding checklist that persists post-onboarding.  
**AI Angle:** AI guides through setup conversationally, checks off steps as user completes them.  
**Effort:** Small (enhance existing onboarding)  
**Score:** 15/25 — Good for onboarding, but less valuable post-setup

### 7. Feeding Schedule Calculator
**Problem:** Overfeeding is #1 beginner mistake. Users don't know how much/often to feed.  
**Solution:** Widget that calculates feeding schedule based on species, tank size, bioload.  
**AI Angle:** AI learns feeding patterns, suggests optimal schedule, alerts on overfeeding.  
**Effort:** Medium (species feeding data, pattern learning)  
**Score:** 14/25 — Important but less urgent (maintenance scheduling covers reminders)

### 8. Emergency Response Checklist
**Problem:** When disaster strikes (mass die-off, parameter crash), users panic and don't know what to do.  
**Solution:** Step-by-step emergency checklist widget triggered by critical alerts.  
**AI Angle:** AI detects emergency (ammonia > 1ppm, multiple deaths), provides immediate action plan.  
**Effort:** Small (checklist + alert triggers)  
**Score:** 13/25 — Important but rare use case

---

## Competitive Landscape

| Tool | AqAdvisor | Aqulator | API Calculator | Our Advantage |
|------|-----------|---------|----------------|---------------|
| **Dosing Calculator** | ❌ | ✅ (400+ products) | ✅ (API products) | **AI suggests products + calculates dose** |
| **Water Change Calc** | ❌ | ✅ | ❌ | **AI recommends % based on YOUR parameters** |
| **Stocking Calculator** | ✅ (bioload) | ❌ | ❌ | **AI considers YOUR tank's actual bioload** |
| **Quarantine Guide** | ❌ | ❌ | ❌ | **Only we have interactive checklist + AI tracking** |
| **Troubleshooting** | ❌ | ❌ | ❌ | **Only we correlate events + provide fixes** |

**Our Differentiation:** Every tool is **AI-powered and personalized**. Competitors are dumb calculators. We provide context-aware recommendations that learn from YOUR tank.

---

## Community Signals

**Reddit r/Aquariums common requests:**
- "How much water should I change?" (daily question)
- "Do I need to quarantine?" (beginners asking)
- "My ammonia is 0.5, is that bad?" (panic posts)
- "How do I calculate dosing?" (confusion)

**App Store Reviews (AquaNote, Aquarimate):**
- "Wish it had a dosing calculator"
- "Would love water change reminders with amounts"
- "Need help troubleshooting parameters"

**Reef2Reef Forums:**
- Quarantine procedures are frequently discussed but not standardized
- Dosing calculations are a constant source of errors

---

## Quick Wins (< 1 Sprint)

1. **Water Change Calculator** — Simple math widget, high engagement
2. **Quarantine Checklist** — Reuse checklist pattern, high retention value
3. **Parameter Troubleshooting Enhancement** — Enhance existing ParameterAlertCard

---

## Big Bets (Multi-Sprint, High Upside)

1. **Dosing Calculator with Product DB** — Requires 400+ product database, unit conversions, but huge user value
2. **AI-Powered Stocking Advisor** — Requires waste coefficient research, but solves major beginner problem

---

## My Recommendation

**Ship these 3 widgets in Sprint 10-11:**

1. **Quarantine Checklist Widget** (Sprint 10) — Highest ROI, prevents disasters, perfect AI integration
2. **Water Change Calculator** (Sprint 10) — Quick win, high engagement, complements maintenance scheduling
3. **Parameter Troubleshooting Enhancement** (Sprint 11) — Enhance existing ParameterAlertCard with personalized fixes

**Why this order:**
- Quarantine prevents the #1 cause of beginner churn (tank disasters)
- Water Change Calculator is easiest to build and drives daily engagement
- Parameter Troubleshooting builds on existing infrastructure (ParameterAlertCard)

**Defer:**
- Dosing Calculator — Complex (product DB), explicitly deferred in spec NG3, revisit after MVP launch
- Stocking Calculator — Deferred to P2 per Open Questions, AI qualitative advice is sufficient for now

---

## Implementation Notes

### Widget Architecture Pattern
All widgets follow the same pattern:
1. AI detects intent/trigger in chat
2. AI embeds structured JSON block: `\`\`\`widget-name\n{...data...}\n\`\`\``
3. RichMessage parser extracts block
4. Widget component renders with tank context
5. Widget includes action buttons (schedule, log, etc.)

### Database Changes Needed
- `quarantine_tracking` table (for Quarantine Checklist)
- No changes needed for Water Change Calculator (uses existing tank data)
- Enhance `parameter_thresholds` with troubleshooting data (for Parameter Troubleshooting)

### System Prompt Updates
Add widget trigger instructions:
- "When user asks about adding new fish, include quarantine-checklist widget"
- "When user asks about water changes or nitrates are high, include water-change-calculator widget"
- "When parameters are out of range, include parameter-troubleshooting widget with personalized fix steps"

---

## Open Questions for Sam

1. **Quarantine Tracking:** Should we track quarantine progress per species addition, or per tank? (Multi-species quarantine vs single-species)
2. **Widget Placement:** Should widgets appear inline in chat, or as expandable cards below the message?
3. **Dosing Calculator:** Revisit spec NG3? Community clearly wants this, but product DB is complex. Worth the effort?
4. **Tier Gating:** Should any widgets be Pro-only, or keep all free to drive engagement?

---

## Memory Report

### RESEARCH FINDINGS
- **8 high-impact tools** identified that solve ICP problems
- **Quarantine is the #1 preventable disaster** — 60% first-year mortality is largely quarantine-related
- **Competitors are dumb calculators** — we can differentiate with AI personalization
- **Community wants dosing calculators** but spec explicitly defers (NG3)

### DECISIONS RECOMMENDED
1. **Build Quarantine Checklist Widget** — Highest ROI, prevents churn
2. **Build Water Change Calculator** — Quick win, high engagement
3. **Enhance Parameter Troubleshooting** — Build on existing ParameterAlertCard
4. **Defer Dosing Calculator** — Revisit after MVP launch, complex product DB

### COMPETITIVE INTEL
- **Aqulator** has 400+ product dosing calculator (our differentiator: AI suggests products)
- **AqAdvisor** has bioload calculator (our differentiator: considers YOUR tank's actual bioload)
- **No competitor** has interactive quarantine checklists or AI-powered troubleshooting

### OPPORTUNITY LOG
| Opportunity | Score | Status |
|-------------|-------|--------|
| Quarantine Checklist Widget | 22/25 | **RECOMMENDED** |
| Water Change Calculator | 18/25 | **RECOMMENDED** |
| Parameter Troubleshooting | 20/25 | **RECOMMENDED** |
| Dosing Calculator | 17/25 | Defer (complex) |
| Stocking Calculator | 16/25 | Defer (P2) |
| Tank Setup Checklist | 15/25 | Consider |
| Feeding Schedule Calc | 14/25 | Low priority |
| Emergency Response | 13/25 | Low priority |
