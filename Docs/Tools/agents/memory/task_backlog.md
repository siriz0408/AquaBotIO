# Task Backlog — PM Orchestrator
**Last Updated:** 2026-02-09  
**Maintained By:** PM Orchestrator  
**Purpose:** Central task list for sprint planning. PM updates this regularly as new tasks emerge from specs, feedback, bugs, or research.

---

## How This Works

- **PM updates this doc** when new tasks are identified (from specs, feedback, bugs, research)
- **During sprint planning**, PM references this backlog to select tasks for the next sprint
- **Tasks move from backlog → sprint plan → active work → completed**
- **Status values:** `PENDING` → `PLANNED` → `IN_PROGRESS` → `COMPLETED` → `DEFERRED`

---

## Task Status Legend

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `PENDING` | Task identified, not yet planned | PM evaluates during sprint planning |
| `PLANNED` | Assigned to a sprint, sprint plan created | Ready for execution |
| `IN_PROGRESS` | Currently being worked on | Track in `active_work.md` |
| `COMPLETED` | Done, verified, merged | Archive to sprint summary |
| `DEFERRED` | Postponed (not urgent, blocked, or out of scope) | Revisit quarterly |

---

## P0 — Pre-Launch (Must Ship Before MVP)

### Pricing Strategy Implementation (Spec 18)

**Source:** `Docs/Tools/agents/memory/research/pricing-strategy-pm-handoff.md`  
**Priority:** P0 — Pre-Launch  
**Estimated Effort:** 3.5-5 sprints  
**Dependencies:** Spec 16 (Free Tools) must ship first

#### Task 18.1: Free Tools (Pre-Requisite Sprint)
- **Status:** `COMPLETED` ✅ (Sprint 16)
- **Agent:** Frontend Engineer
- **Effort:** 1 sprint
- **Description:** Build static (non-AI) versions of key tools so Free tier has value
- **Deliverables:**
  - [x] Static water change calculator (tank volume × percentage = gallons)
  - [x] Static stocking density calculator (basic fish-inches-per-gallon formula)
  - [x] Basic parameter reference guide (safe/warning/danger zones table)
  - [x] Tools accessible to ALL tiers including Free
- **Reference:** Spec 16 (AI Chat Embedded Widgets) for tool designs
- **Completed:** Sprint 16 — Commit `ad218a2`

#### Task 18.2: Pricing Backend (Schema + Stripe + Limits)
- **Status:** `COMPLETED` ✅ (Sprint 14)
- **Agent:** Backend Engineer
- **Effort:** 1 sprint
- **Dependencies:** Task 18.1 (Free Tools) complete
- **Description:** Schema migration, Stripe reconfiguration, tier limit updates, backend AI gating
- **Deliverables:**
  - [ ] Schema migration: Add `billing_interval`, `stripe_price_id`, `tier_override`, `override_reason`, `override_expires_at`, `grace_period_ends_at` columns
  - [ ] Update trial duration default: 14 days → 7 days
  - [ ] Create new Stripe prices: Starter $4.99, Plus $9.99, Pro $19.99 (monthly)
  - [ ] Create annual prices (not exposed yet): Starter $49.90, Plus $99.90, Pro $199.90
  - [ ] Create beta tester coupon: 100% off, 3-month duration
  - [ ] Update `TIER_LIMITS` constant: 0/10/100/500 AI msgs/day
  - [ ] Update `TIER_PRICING` constants: $4.99/$9.99/$19.99
  - [ ] Update price ID mapping in `stripe/client.ts`
  - [ ] Update webhook handlers to store `billing_interval` + `stripe_price_id`
  - [ ] Gate trend analysis Edge Function to Plus+ tiers only
  - [ ] Extract `resolveUserTier()` helper with admin/override/trial priority chain
- **Files:** See Spec 18 Section "Implementation Touchpoints" for full list
- **Reference:** `Docs/AquaBotAI_Specs/18_Pricing_Strategy_Spec.md` R-018.1 through R-018.7

#### Task 18.3: Pricing Frontend (Billing UI + Prompts)
- **Status:** `COMPLETED` ✅ (Sprint 14)
- **Agent:** Frontend Engineer
- **Effort:** 1 sprint
- **Dependencies:** Task 18.2 (Backend) complete
- **Description:** Update all billing UI to reflect new pricing, tier names, and limits
- **Deliverables:**
  - [ ] Update billing page with new prices ($4.99/$9.99/$19.99)
  - [ ] Update subscription cards with new tier structure
  - [ ] Update trial banner (7-day messaging)
  - [ ] Update upgrade prompts with value-based messaging
  - [ ] Update usage indicator with new daily limits (0/10/100/500)
  - [ ] Free users see "Upgrade to Starter for AI chat access" prompts
- **Files:** `billing/page.tsx`, `subscription-card.tsx`, `trial-banner.tsx`, `upgrade-prompt.tsx`, `usage-indicator.tsx`
- **UX Principles:** Emphasize value over features, simple 3-tier layout, recommended tier highlighted

#### Task 18.4: Pricing Testing + Verification
- **Status:** `PENDING`
- **Agent:** Both (Frontend + Backend)
- **Effort:** 0.5-1 sprint
- **Dependencies:** Task 18.3 (Frontend) complete
- **Description:** End-to-end testing of full billing flow with new pricing
- **Deliverables:**
  - [ ] Full upgrade/downgrade test matrix (Free→Starter→Plus→Pro and back)
  - [ ] Admin override verification (create admin, confirm Pro access)
  - [ ] Beta coupon verification (apply coupon, confirm 100% off)
  - [ ] Stripe webhook verification (all events handled correctly)
  - [ ] Trial expiration verification (7-day countdown, reminders, downgrade)
  - [ ] Trend analysis gating verification (Free/Starter tanks skipped)
  - [ ] Edge cases: expired override, past_due with grace period, canceled subscription
- **Reference:** Spec 18 Section "Acceptance Test Plan"

---

## P1 — Post-Launch Enhancements

### Annual Billing (Spec 18, R-018.8)
- **Status:** `DEFERRED`
- **Priority:** P1 — Post-Launch
- **Effort:** 1 sprint
- **Trigger:** 90 days of monthly churn data collected
- **Description:** Enable annual billing UI with 20% discount. Schema already prepared in Task 18.2.
- **Deliverables:**
  - [ ] Monthly/annual toggle on pricing page
  - [ ] Annual price display with "Save 20%" badge
  - [ ] Checkout supports `billing_interval` parameter
  - [ ] Webhook handlers store `billing_interval` in subscriptions table

### Cost Monitoring Dashboard (Spec 18, R-018.9)
- **Status:** `PENDING`
- **Priority:** P1 — Post-Launch
- **Effort:** 0.5 sprint
- **Agent:** Backend Engineer
- **Description:** Admin view showing AI costs per user per tier
- **Deliverables:**
  - [ ] Admin dashboard pulls from `ai_usage` table
  - [ ] Shows: total messages, total tokens, estimated cost, margin per tier
  - [ ] Alert when any tier's average cost approaches price point

### Pricing Page Redesign (Spec 18, R-018.10)
- **Status:** `PENDING`
- **Priority:** P1 — Post-Launch
- **Effort:** 0.5 sprint
- **Agent:** Frontend Engineer
- **Description:** Emphasize value over features, improve conversion
- **Deliverables:**
  - [ ] Value-based copy ("Prevent fish deaths", "Save 3+ hours/week")
  - [ ] Simple 3-visible-tier layout with expandable "Compare all features"
  - [ ] Free tier shown as "Get Started Free" CTA
  - [ ] Recommended tier (Plus) visually highlighted

---

## P2 — Future Considerations

### Model Routing (Haiku for Simple Queries)
- **Status:** `DEFERRED`
- **Priority:** P2 — Cost Optimization
- **Effort:** 1 sprint
- **Description:** Route simple queries to Claude Haiku, reserve Sonnet for complex analysis. 40% cost reduction on routed messages.
- **Reference:** Spec 18, R-018.11

### Prompt Caching
- **Status:** `DEFERRED`
- **Priority:** P2 — Cost Optimization
- **Effort:** 1 sprint
- **Description:** Cache repeated tank context (90% savings on cached tokens)
- **Reference:** Spec 18, R-018.12

### Usage-Based Overage
- **Status:** `DEFERRED`
- **Priority:** P2 — Revenue Optimization
- **Effort:** 1 sprint
- **Description:** Allow Starter/Plus users to buy additional message packs
- **Reference:** Spec 18, R-018.13

---

## Other Pending Tasks

### Production Deployment Completion (Sprint 13/14b)
- **Status:** `COMPLETED` ✅
- **Priority:** P0 — Blocking Launch
- **Agent:** PM Orchestrator (via MCP tools)
- **Description:** Configure Stripe prices, Vercel env vars, and deploy to production
- **Deliverables:**
  - [x] Created Stripe prices: Starter $4.99, Plus $9.99, Pro $19.99
  - [x] Updated Vercel environment variables with new price IDs
  - [x] Deployed to Vercel production (https://aquabotai-mu.vercel.app)
  - [x] Verified pricing displays correctly on live site
- **Reference:** `Docs/Tools/agents/memory/active_work.md` Sprint 14b

### Photo Diagnosis (Spec 09)
- **Status:** `PENDING`
- **Priority:** P1 — Phase 3
- **Effort:** 2 sprints
- **Description:** Claude Vision API for species ID and disease diagnosis
- **Reference:** `Docs/AquaBotAI_Specs/09_Photo_Diagnosis_Spec.md`

### Equipment Tracking (Spec 10)
- **Status:** `PENDING`
- **Priority:** P1 — Phase 3
- **Effort:** 3 sprints
- **Description:** Equipment catalog, lifespan tracking, AI recommendations
- **Reference:** `Docs/AquaBotAI_Specs/10_Equipment_Tracking_Recommendations_Spec.md`

### AI Chat Embedded Widgets (Spec 16)
- **Status:** `PENDING`
- **Priority:** P1 — Phase 2
- **Effort:** 2 sprints
- **Description:** Quarantine Checklist, Water Change Calculator, Parameter Troubleshooting widgets
- **Reference:** `Docs/AquaBotAI_Specs/16_AI_Chat_Embedded_Widgets_Spec.md`
- **Note:** Static versions needed for Task 18.1 (Free Tools)

### Interactive Dashboards & Reports (Spec 11)
- **Status:** `PENDING`
- **Priority:** P1 — Phase 3
- **Effort:** 2 sprints
- **Description:** Email reports, multi-tank comparison, health score
- **Reference:** `Docs/AquaBotAI_Specs/11_Interactive_Dashboards_Reports_Spec.md`

---

## Task Addition Guidelines

When adding new tasks to this backlog:

1. **Source:** Always note where the task came from (spec, feedback, bug, research)
2. **Priority:** P0 (pre-launch), P1 (post-launch), P2 (future)
3. **Effort:** Estimate in sprints (0.5, 1, 2, etc.)
4. **Dependencies:** List any tasks this depends on
5. **Deliverables:** Bullet list of what "done" looks like
6. **Reference:** Link to spec/doc that defines the task

**PM updates this doc:**
- When new specs are created (add tasks from spec requirements)
- When feedback comes in (convert feedback to tasks)
- When bugs are identified (add bug fix tasks)
- When research surfaces opportunities (add research-driven tasks)
- After sprint planning (update status from `PENDING` → `PLANNED`)
- After sprint completion (update status from `IN_PROGRESS` → `COMPLETED`)

---

**Last Updated:** 2026-02-09  
**Next Review:** During Sprint 14 planning (or when new tasks identified)
