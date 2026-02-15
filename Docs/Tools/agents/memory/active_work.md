# Active Work Board

> Last updated: 2026-02-15 | Updated by: PM Orchestrator | Sprint 37 COMPLETE ✅

## MILESTONE: MVP Launch-Ready ✅ → Phase 2 Complete ✅ → AI Coaching ✅ → Interaction Design ✅ → Equipment Tracking ✅ → Multi-Tank Comparison ✅

| Feature | Status | Progress |
|---------|--------|----------|
| Auth & Onboarding | DONE | 100% |
| Subscription & Billing | DONE | 100% |
| PWA Shell | DONE | 100% |
| AI Chat Engine | DONE | 100% — Streaming, rich formatting, action execution |
| Tank Profiles | DONE | 100% |
| Water Parameters | DONE | 100% |
| Species & Livestock | DONE | 100% |
| Maintenance Scheduling | DONE | 100% — Full push notification support |
| AI Action Execution | DONE | 100% — Log params, add livestock, schedule tasks from chat |
| Proactive Alerts | DONE | 100% — Trend detection, alert badge, alerts page |
| **Pricing Strategy (Spec 18)** | **DONE** | **100% — Backend foundation complete** |
| **Push Notifications** | **DONE** | **100% — Fully implemented with web-push, ready to use** |
| **AI Chat Embedded Widgets** | **DONE** | **100% — Water Change Calculator, Quarantine Checklist, Parameter Troubleshooting** |
| **Equipment Tracking (Spec 10)** | **DONE** | **100% — R-102 complete: catalog, lifespan tracking, status alerts, Plus+ tier** |
| **Multi-Tank Comparison (Spec 11)** | **DONE** | **100% — R-105 complete: health grid, comparison charts, AI insights, Pro tier** |

**Overall MVP: 100%** 🚀
**Phase 2 (AI Proactive Intelligence): 100%** ✅
**Spec 18 Backend: 100%** ✅
**AI Chat Widgets (Spec 16): 100%** ✅

## Sprint 14 Deliverables (Pricing Strategy Backend)

| What | Details |
|------|---------|
| Schema Migration | 6 new columns: `billing_interval`, `stripe_price_id`, `tier_override`, `override_reason`, `override_expires_at`, `grace_period_ends_at` |
| Trial Duration | Updated from 14 days → 7 days (new subscriptions only) |
| TIER_LIMITS | Updated: Free=0, Starter=10, Plus=100, Pro=500 AI msgs/day |
| `resolveUserTier()` | Centralized tier resolution with admin/override/trial priority chain |
| Trend Analysis Gating | Free/Starter users skipped (Plus+ only) |
| Pricing Display | All UIs updated to $4.99/$9.99/$19.99 |
| admin_profiles Table | Created for admin tier override |
| SQL Functions | `check_and_increment_ai_usage` and `get_tier_limits` updated |

## Sprint 12 Deliverables (Proactive Trend Detection)

| What | Details |
|------|---------|
| Trend Analysis Edge Function | `supabase/functions/analyze-parameter-trends/index.ts` — Linear regression, spike detection, AI interpretation |
| Alert Badge in Chat | Fetches active count, pulse animation, click to alerts page |
| "Any Alerts?" Query | System prompt enhancement for alert queries |
| Proactive Alert in Chat | RichMessage parses `proactive-alert` blocks, renders AlertCard |
| Alerts List Page | `/tanks/[id]/alerts` — Filter tabs, dismiss, severity badges |
| Enhanced Alerts API | Chat format support, analyze trigger action |

## What This Unlocks

- **Early Warning System**: AI detects concerning trends BEFORE disasters
- **Event Correlation**: "This spike started 2 days after you added 3 new fish"
- **Actionable Suggestions**: "Consider a 20% water change this weekend"
- **Daily Engagement**: Alert badge creates return-visit loop
- **Voice of the Tank**: "Any alerts?" gives users instant health status

## Environment Status

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set |
| `ANTHROPIC_API_KEY` | ✅ Set — VERIFIED WORKING |
| `NEXT_PUBLIC_APP_URL` | ✅ Set |
| `STRIPE_SECRET_KEY` | ✅ Set (Vercel + .env.local) |
| `STRIPE_WEBHOOK_SECRET` | ✅ Set (Vercel + .env.local) |
| `STRIPE_PRICE_*` | ✅ Set — New prices ($4.99/$9.99/$19.99) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ Set (Vercel) |
| `VAPID_PRIVATE_KEY` | ✅ Set (Vercel) |
| `VAPID_SUBJECT` | ✅ Set (Vercel) |
| `RESEND_API_KEY` | ❌ Not set |
| `SENTRY_DSN` | ❌ Not set |

## Sprint History

| Sprint | Progress | Key Deliverables |
|--------|----------|------------------|
| Sprint 1–2 | 0% → 25% | Scaffolding, Auth, Supabase schema, PWA foundation |
| Sprint 3 | 25% → 48% | AI Chat, Billing, 40 E2E tests |
| Sprint 4 | 48% → 65% | Water Params, Species, Livestock, Thresholds, Trend Analysis |
| Sprint 5 | 65% → 75% | Maintenance Scheduling (CRUD, AI recs, UI) |
| Sprint 6 | 75% → 80% | Auth deadlock fix (P0), middleware fix (P1), full E2E testing |
| Sprint 7 | 80% → 88% | DB migration fixes, Species Library live, PWA icons |
| Docs Audit | — | New specs (14, 15), roadmap/ship readiness updates |
| Sprint 8 | 88% → 93% | Color palette alignment, SW registration, security headers, build verified |
| Sprint 9 | 93% → 96% | Rich chat (streaming, species cards, parameter alerts, action buttons, prose CSS) |
| Sprint 10 | 96% → 100% | Signup auto-login fix (FB-MLE7MCRC), security headers fix (B014), species expansion (25→180), Vercel deployment, Stripe live keys |
| Sprint 11 | 96% → 98% | AI Action Execution API, proactive_alerts table, ActionConfirmation/ProactiveAlertBadge/ProactiveAlertCard components |
| Sprint 12 | 98% → 100% | Trend Analysis Edge Function, alert badge in chat, "any alerts?" query, alerts list page |
| Sprint 13 | 100% → PROD | Production deployment: Edge Function deployed, Supabase secrets set |
| **Sprint 14** | **Spec 18** | **Pricing Strategy backend: schema migration, tier limits (0/10/100/500), resolveUserTier(), trend gating, price display ($4.99/$9.99/$19.99)** |
| **Sprint 14b** | **PROD DEPLOY** | **Stripe prices created, Vercel env vars updated, deployed to production (https://aquabotai-mu.vercel.app)** |
| **Sprint 18** | **COMPLETE** | **Push Notifications infrastructure: tables, APIs, permission prompt, settings page, usePushNotifications hook** |
| **Sprint 17** | **COMPLETE** | **Auth fix + Google OAuth: retry logic, fallback profile, middleware, Supabase Google provider enabled** |
| **Sprint 16** | **FREE TOOLS** | **Static calculators for Free tier: Water Change, Stocking, Parameter Reference at /tools** |
| **Sprint 15** | **VERIFICATION** | **Billing E2E tests updated ($4.99/$9.99/$19.99), webhook code verified, action items for Sam (webhook + env vars)** |
| **Sprint 19** | **COMPLETE** | **AI Chat Embedded Widgets: Water Change Calculator, Quarantine Checklist, Parameter Troubleshooting** |
| **Sprint 20-22** | **COMPLETE** | **Admin Portal, Push Notifications polish, Pricing fixes** |
| **Sprint 23** | **COMPLETE** | **P0 Bug Fixes: notification settings, admin hook, onboarding tank context, storage bucket** |
| **Sprint 37** | **COMPLETE** | **Multi-Tank Comparison Dashboard (Spec 11 R-105): Health score algorithm, aggregate view, comparison charts, AI insights, Pro tier** |
| **Sprint 36** | **COMPLETE** | **Equipment Tracking (Spec 10 R-102): DB schema, lifespan defaults, API CRUD, UI components, tier gating** |
| **Sprint 35** | **COMPLETE** | **Interaction Design + Photo Diagnosis: animation system, SQL RPC functions, photo diagnosis chat integration (Spec 09)** |
| **Sprint 34** | **COMPLETE** | **Coaching History: coaching_history table, coaching page, settings editor, preferences UI** |
| **Sprint 33** | **COMPLETE** | **Daily AI Coaching: Edge Function + API endpoint** |
| **Sprint 32** | **COMPLETE** | **AI Onboarding Phase 2: Integration with onboarding flow** |
| **Sprint 31** | **COMPLETE** | **AI Onboarding Wizard Phase 1: Wizard UI components** |
| **Sprint 30** | **COMPLETE** | **Livestock Edit + AI Onboarding Spec** |
| **Sprint 29** | **COMPLETE** | **Bug Fixes: B023-4 storage bucket fix with self-healing upload** |
| **Sprint 28** | **COMPLETE** | **Species Images: External images from GBIF/iNaturalist** |
| **Sprint 27** | **COMPLETE** | **Species Database Upgrade: 94 species, enhanced schema, AI tools** |
| **Sprint 24** | **COMPLETE** | **UX Polish: page centering, dashboard My Tanks, chat without tank, code flash fix, action normalization** |

## Sprint 24 Deliverables (UX Polish + Chat Improvements)

| What | Details |
|------|---------|
| Page Centering | Tailwind `container` now auto-centered globally with responsive padding; dashboard + alerts pages wrapped |
| Dashboard My Tanks | New `MyTanks` component — grid of tank cards with photo, type, volume, active indicator, View Details link |
| Chat Without Tank | `tank_id` now optional in chat API, validation, and UI; general chat prompts for users without tanks |
| Streaming Code Flash Fix | `parseContent()` now strips incomplete structured code blocks during streaming |
| Action Payload Normalization | `normalizeActionPayload()` handles AI-generated values: task_type, frequency, relative dates |

## Sprint 19 Deliverables (AI Chat Embedded Widgets)

| What | Details |
|------|---------|
| Water Change Calculator Widget | Shows tank volume, nitrate, recommended %, exact gallons; "Schedule Water Change" creates task |
| Quarantine Checklist Widget | 7-step interactive checklist, progress tracking, species sensitivity, daily reminder scheduling |
| Parameter Troubleshooting Widget | Explains parameter, lists causes, personalized fix steps, action buttons |
| quarantine_tracking Table | New DB table for tracking quarantine progress per species |
| Quarantine API | Full CRUD at `/api/quarantine` with Zod validation |
| RichMessage Parser | Extended for 3 new widget block types |
| System Prompt | Updated with widget embedding instructions and JSON schemas |

## What's Next

### Production Launch — COMPLETE ✅
- [x] Configure Stripe products in Dashboard ($4.99 Starter, $9.99 Plus, $19.99 Pro)
- [x] Get Stripe live keys and set in Vercel env vars
- [x] Deploy to Vercel production
- [x] Verify pricing displays correctly on live site
- [x] Webhook code verified (Sprint 15) — handles 5 events with idempotency
- [x] **Live webhook endpoint configured** (`we_1Syfda1d1AvgoBGom3mj1nBl`)
- [x] **All Stripe env vars set in Vercel** (verified via `vercel env ls`)

### P1 Enhancements (After Launch)
1. ~~Free Tools (Spec 16)~~ — ✅ DONE (Sprint 16)
2. ~~Push notification infrastructure~~ — ✅ DONE (Sprint 18) — **FULLY CONFIGURED**
3. Email digest for daily alert summary
4. Cron job for automatic daily trend analysis
5. ~~Photo Diagnosis (Claude Vision)~~ — ✅ DONE (Sprint 35) — **Chat integration complete**
6. Equipment Tracking

### Sprint 18 Action Items — ALL COMPLETE ✅
- [x] Generate VAPID keys: `npx web-push generate-vapid-keys`
- [x] Set in Vercel: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- [x] Apply migration: `npx supabase db push`
- [x] Install web-push: `npm install web-push`
- [x] Implement actual sending: Updated `push.ts` with web-push
- [x] Enhanced service worker: Action buttons, tags, requireInteraction
