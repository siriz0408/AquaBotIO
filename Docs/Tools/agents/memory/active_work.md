# Active Work Board

> Last updated: 2026-02-08 | Updated by: PM Orchestrator | Sprint 8 COMPLETE

## MILESTONE: MVP Launch-Ready

| Feature | Status | Progress |
|---------|--------|----------|
| Auth & Onboarding | DONE | 100% |
| Subscription & Billing | DONE | 100% |
| PWA Shell | DONE | 100% (SW registration added Sprint 8) |
| AI Chat Engine | DONE | 95% (live with Claude, non-streaming) |
| Tank Profiles | DONE | 100% |
| Water Parameters | DONE | 100% |
| Species & Livestock | DONE | 100% |
| Maintenance Scheduling | DONE | 95% |
| E2E Testing | DONE | All features validated with live data |
| Documentation Audit | DONE | All specs, roadmap, ship readiness reviewed & updated |
| **Color Palette Alignment** | **DONE** | **Matched wireframe spec (Sprint 8)** |
| **Security Headers** | **DONE** | **HSTS, X-Frame, CSP, Referrer-Policy (Sprint 8)** |
| **Build Verification** | **DONE** | **`npm run build` passes cleanly (Sprint 8)** |
| **AI Chat Live** | **DONE** | **Claude responds with tank-context-aware answers (Sprint 8)** |

**Overall MVP: 93%**

## Next Sprint: Sprint 9 — Production Deployment

**P0 — Must complete for launch:**
1. Vercel deployment — `vercel.json`, env vars, domain config
2. Stripe live keys — configure for real payments
3. Species data expansion — 25 → 200+ species (AI-assisted seeding)

**P1 — Should have:**
4. AI streaming responses — better UX (currently waits for full response)
5. Push notification wiring — maintenance reminders
6. Email notifications — Resend integration

**P2 — Nice to have:**
7. Photo Diagnosis — Claude Vision integration
8. Admin Portal — user/content management

## Environment Status

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set |
| `ANTHROPIC_API_KEY` | ✅ Set (key: `aqua-bot-ai`) — VERIFIED WORKING |
| `NEXT_PUBLIC_APP_URL` | ✅ Set (`localhost:3000`) |
| `STRIPE_SECRET_KEY` | ❌ Not set |
| `STRIPE_WEBHOOK_SECRET` | ❌ Not set |
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
| Docs Audit | — | New specs (14, 15), roadmap/ship readiness updates, wireframe comparison |
| Sprint 8 | 88% → 93% | Color palette alignment, SW registration, security headers, AI chat live, build verified |
