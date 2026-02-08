# CLAUDE.md — Instructions for AI-Assisted Development

## Purpose

You are working in this repository to implement features and fixes for **AquaBotAI** — an AI-powered aquarium management platform built as a PWA.

Primary goal: ship correct, secure, maintainable changes with minimal diffs. This is a solo-developer vibe-coded project. Speed matters, but never at the expense of data integrity, security, or billing correctness.

## Source of Truth Docs

All product + build specs live in `Docs/` (Markdown). Before proposing changes, read the relevant spec files and follow them.

If specs conflict with code, prefer specs unless they are clearly outdated; flag the conflict in your response.

### Spec Doc Index

**Product Specs** (`Docs/AquaBotAI_Specs/`):

| File | Covers |
|------|--------|
| `AquaBotAI PRDV1.md` | Master PRD — product vision, feature overview, success metrics, pricing tiers |
| `00_Data_Model_Schema.md` | Unified database schema — 22 tables, ~320 columns, 29 FKs, RLS policies, indexes |
| `01_AI_Chat_Engine_Spec.md` | Claude Sonnet 4.5 chat — context injection, action execution, usage tracking, tier limits |
| `02_Tank_Profile_Management_Spec.md` | Tank CRUD, photo upload, tier-gated multi-tank, soft-delete |
| `03_Water_Parameters_Analysis_Spec.md` | Parameter entry, Recharts dashboards, AI trend analysis, safe/warning/danger zones |
| `04_Species_Database_Livestock_Spec.md` | 800+ species, full-text search, livestock tracking, AI compatibility checking |
| `05_Maintenance_Scheduling_Spec.md` | Task CRUD, recurring tasks, push notifications, AI-suggested schedules |
| `06_Authentication_Onboarding_Spec.md` | Email/password + Google OAuth + magic link, onboarding flow, JWT sessions |
| `07_Subscription_Billing_Spec.md` | Stripe Checkout, 14-day trial, 3 tiers, webhooks, grace period |
| `08_PWA_Shell_Spec.md` | Installable PWA, service worker, offline queue, push notifications |
| `09_Photo_Diagnosis_Spec.md` | Claude Vision — species ID, disease diagnosis, treatment plans (P1) |
| `10_Equipment_Tracking_Recommendations_Spec.md` | Equipment catalog, lifespan tracking, SerpAPI web search recs (P1) |
| `11_Interactive_Dashboards_Reports_Spec.md` | Email reports via Resend, multi-tank comparison, health score (P1) |
| `12_API_Integration_Spec.md` | Complete REST API contract — all endpoints, request/response schemas, error codes |
| `13_Admin_Portal_Management_Spec.md` | Admin roles, user management, audit logging, feature flags |
| `14_Implementation_Status.md` | System changes audit — feature matrix, bug tracker, schema status, env config |
| `15_UI_UX_Design_System.md` | **Canonical UI/UX guide** — colors, typography, layout, components, mobile patterns (from Wireframes) |
| `Open_Questions_Decisions.md` | 89 product decisions — 81 resolved, 8 awaiting input |

**Wireframes** (`Docs/Wireframes/`):

| Path | Covers |
|------|--------|
| `Docs/Wireframes/` | Figma-exported React component library — **source of truth for all UI design**. 43 files covering every screen, color, spacing, and interaction pattern. Run with `npm run dev` in that directory to preview. |

**Ship Readiness** (`Docs/Ship_Readiness/`):

| File | Covers |
|------|--------|
| `01_Security_Privacy_Checklist.md` | Auth security, secrets, input validation, RLS, STRIDE threat model, pre-launch checklist |
| `02_Test_Plan.md` | Unit/integration/E2E test cases, regression checklist, performance benchmarks |
| `03_Deployment_Plan.md` | Environments, CI/CD (GitHub Actions), migrations, rollback, scaling guide |
| `04_Runbook_Ops_Guide.md` | Monitoring, alerts, 15 failure playbooks, backup/restore, cron jobs |
| `05_Release_Notes_Launch_Checklist.md` | Release notes, T-7 to T+7 launch checklist, support handoff, go/no-go |
| `06_Post_Launch_Measurement_Plan.md` | KPIs, event tracking, dashboards, feedback loops, iteration cadence |

**Roadmap** (root):

| File | Covers |
|------|--------|
| `AquaBotAI_Product_Roadmap.md` | 6-month Now/Next/Later roadmap, RICE scores, dependency map, milestones |
| `AquaBotAI_Product_Roadmap.html` | Interactive visual roadmap dashboard |

## Tech Stack

| Layer | Technology | Version/Details |
|-------|-----------|-----------------|
| Frontend | Next.js (App Router) | 14+ with TypeScript |
| UI | Tailwind CSS + shadcn/ui | Latest |
| Charts | Recharts | For parameter dashboards |
| Backend | Supabase Edge Functions | Deno runtime |
| Database | PostgreSQL | 15 (via Supabase) |
| Auth | Supabase Auth | Email/password, Google OAuth, magic link |
| Storage | Supabase Storage | 3 buckets: `tank-photos`, `equipment-photos`, `photo-diagnosis` |
| AI | Anthropic Claude | Sonnet 4.5 (`claude-sonnet-4-5-20250929`), Haiku 4.5 (`claude-haiku-4-5-20251001`) |
| Payments | Stripe | Checkout, Customer Portal, webhooks, Stripe Tax |
| Email | Resend | Transactional emails, React Email templates |
| Search | SerpAPI | Equipment recommendations (Pro-only, 24hr cache) |
| PWA | next-pwa | Workbox-based service worker |
| Monitoring | Sentry | `@sentry/nextjs` (frontend), `@sentry/deno` (Edge Functions) |
| Hosting | Vercel | Frontend + serverless |
| Testing | Vitest + Playwright | Unit/integration + E2E |

## Repo Navigation

```
aquatic-ai/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (signup, login, callback)
│   ├── (dashboard)/              # Protected routes
│   ├── api/                      # API routes
│   │   ├── auth/                 # Magic link, refresh, logout
│   │   ├── ai/                   # Chat, photo diagnosis, equipment search
│   │   ├── billing/              # Stripe checkout, portal
│   │   ├── webhooks/             # Stripe webhooks
│   │   └── notifications/        # Push, email
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # React components
│   ├── auth/
│   ├── dashboard/
│   ├── tanks/
│   ├── parameters/
│   ├── chat/
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utilities & helpers
│   ├── api/                      # API clients
│   ├── auth/                     # Auth utilities
│   ├── ai/                       # Prompts, context builder, token counting
│   ├── validation/               # Zod schemas
│   ├── storage/                  # File upload, image processing
│   ├── email/                    # React Email templates
│   ├── logging/                  # Security events, analytics
│   ├── notifications/            # Push + email helpers
│   └── types/                    # TypeScript types
├── hooks/                        # React hooks
├── context/                      # React Context providers
├── public/                       # Static assets, manifest, sw.js
├── tests/
│   ├── unit/                     # *.test.ts
│   ├── integration/              # *.test.ts
│   └── e2e/                      # *.spec.ts (Playwright)
├── supabase/
│   ├── migrations/               # {timestamp}_{name}.sql
│   ├── functions/                # Edge Functions (Deno)
│   │   ├── ai-chat/
│   │   ├── photo-diagnosis/
│   │   ├── equipment-search/
│   │   ├── generate-reports/
│   │   └── cron-jobs/
│   └── config.toml
├── Docs/                         # Specs + ship readiness (source of truth)
├── middleware.ts                  # Auth, CORS, rate limiting
├── .env.local                    # Local env (git-ignored)
├── .env.example                  # Example env (git-tracked)
├── next.config.js
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── CLAUDE.md                     # This file
```

## Operating Mode

- Prefer small, incremental changes over rewrites.
- Preserve existing patterns and architecture.
- Ask for clarification only if blocked; otherwise make the safest assumption and document it in the PR notes.
- This is a solo-dev project — no code review process. Be extra careful with billing, auth, and RLS changes.
- **IMPORTANT: Complete each task fully before moving to the next.** Verify all deliverables, run verification commands, and confirm exit criteria are met before proceeding. Do not leave tasks partially done.

### PM Orchestrator Mode

When acting as the PM Orchestrator (prompt at `Docs/Tools/agents/prompts/pm_orchestrator.md`):
- **Auto-spawn sub-agents** using the `Task` tool (`subagent_type="generalPurpose"`). Do NOT ask Sam to open separate sessions.
- Launch Frontend and Backend agents **in parallel** (two Task calls in one message) so they work concurrently.
- Each spawned agent receives: its system prompt path, the Task Brief, and instructions to return a structured result.
- After agents return: review results, resolve conflicts, merge to main, update the dashboard, report to Sam.
- See the full Sprint Execution Protocol in `Docs/Tools/agents/prompts/pm_orchestrator.md` (Steps 10-15).

## Change Workflow (Required)

For every task:

1. **Identify** impacted areas (files/modules) and the relevant spec docs.
2. **Propose** a short plan (3–7 steps) before editing.
3. **Implement** with minimal diffs.
4. **Update/extend tests** — unit tests for logic, E2E for critical flows.
5. **Run required checks** (see Commands below) and report results.
6. **Update docs** if behavior or interfaces changed.

## Coding Standards (Enforced)

### Language & Framework
- TypeScript everywhere. Strict mode enabled. No `any` unless absolutely necessary (document why).
- Next.js App Router conventions. Server Components by default; `"use client"` only when needed.
- Supabase Edge Functions in Deno/TypeScript.

### Formatting & Style
- Follow existing Prettier/ESLint config. Do not reformat unrelated files.
- Use `import type` for type-only imports.
- Prefer named exports over default exports (except page/layout components).

### Error Handling
- Use the standard API response envelope (see below). No silent failures.
- All Edge Functions: wrap in try/catch, return structured error response.
- Client-side: show user-friendly error messages; log technical details to Sentry.

### API Response Envelope (All Endpoints)
```typescript
{
  success: boolean;
  data: T | null;
  error: { code: ErrorCode; message: string } | null;
  meta: { timestamp: string; request_id: string };
}
```

### Error Codes (Use These Exactly)
| Code | HTTP | When |
|------|------|------|
| `AUTH_REQUIRED` | 401 | Missing or invalid JWT |
| `AUTH_EXPIRED` | 401 | JWT expired, client should refresh |
| `PERMISSION_DENIED` | 403 | User lacks access to resource |
| `NOT_FOUND` | 404 | Resource does not exist |
| `TIER_REQUIRED` | 403 | Feature gated to higher subscription tier |
| `DAILY_LIMIT_REACHED` | 429 | AI message quota exhausted for the day |
| `RATE_LIMIT_EXCEEDED` | 429 | General rate limit hit |
| `INVALID_INPUT` | 400 | Validation error (details in message) |
| `STRIPE_ERROR` | 402/500 | Stripe API failure |
| `AI_UNAVAILABLE` | 503 | Anthropic API down (retry with exponential backoff, max 3) |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `CONFLICT` | 409 | Data conflict (e.g., duplicate entry) |

### Logging
- Never log secrets, tokens, passwords, or PII.
- Use structured logs. Include `request_id` for traceability.
- Admin actions always go to `admin_audit_log` table (immutable, append-only).

### Time & Money
- **Timestamps:** Store in UTC. Convert only at UI boundaries using user's timezone.
- **Money:** All amounts in cents (integer). Stripe uses minor currency units. Never use floats for currency. Display formatting happens client-side only.

### Tier Enforcement
Always enforce server-side. Never trust client-side tier checks.

| Tier | Tanks | AI Msgs/Day | Photo Dx/Day | Equipment Recs/Day | Price |
|------|-------|-------------|-------------|-------------------|-------|
| Free | 1 | 10 | — | — | $0 |
| Starter | 1 | 100 | — | — | $3.99/mo |
| Plus | 5 | 200 | 10 | — | $7.99/mo |
| Pro | Unlimited | Unlimited | 30 | 10 | $14.99/mo |

Check tier before every gated action:
```typescript
// Pattern: always check server-side via Edge Function or middleware
const { tier } = await getUserSubscription(userId);
if (!canAccess(tier, 'photo_diagnosis')) {
  return errorResponse('TIER_REQUIRED', 'Photo diagnosis requires Plus or Pro plan');
}
```

## Security + Privacy Rules

**Read `Docs/Ship_Readiness/01_Security_Privacy_Checklist.md` for the full checklist.** Key rules:

- **Never commit secrets.** Use `.env.example` with placeholder values. Real values in Vercel env vars and Supabase Vault.
- **Validate all external inputs** — request bodies, query params, file uploads, webhook payloads. Use Zod schemas.
- **Enforce authorization server-side** on every protected action. RLS policies are the primary guard.
- **Stripe webhooks:** Always verify signature with `stripe.webhooks.constructEvent()`. Process idempotently (check `webhook_events` table for duplicate `event_id`).
- **AI prompt injection:** Never include raw user input in system prompts. User messages go in the `user` role only. System prompt is constructed server-side from database context.
- **File uploads:** Validate MIME type, enforce size limits (5MB photos), re-encode images server-side with Sharp to strip metadata.
- **Protect against XSS/CSRF/SQLi** per existing patterns. Supabase client uses parameterized queries — never concatenate user input into SQL.
- If handling sensitive data: redact in logs, avoid storing unless required.

### RLS Policy Pattern (Standard)
```sql
-- User data tables: tanks, livestock, water_parameters, maintenance_tasks, etc.
CREATE POLICY "Users can only access their own data"
  ON {table_name} FOR ALL
  USING (auth.uid() = user_id);

-- Reference data: species, equipment_lifespan_defaults
CREATE POLICY "Authenticated users can read"
  ON species FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin audit log: append-only, no update/delete
CREATE POLICY "Admins can read audit log"
  ON admin_audit_log FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_profiles));
-- No INSERT policy for users — only Edge Functions with service role key can write
```

## Data + Migrations

### Database Schema
- **22 total tables** across 3 phases. See `00_Data_Model_Schema.md` for complete schema.
- **Phase 1 (MVP):** users, tanks, water_parameters, species, livestock, ai_conversations, ai_usage, maintenance_tasks, maintenance_logs, notification_preferences, push_subscriptions, subscriptions
- **Phase 2:** equipment, equipment_lifespan_defaults, photo_diagnoses, report_preferences, report_history, compatibility_checks
- **Phase 3:** webhook_events, admin_profiles, admin_audit_log, species_revisions

### Migration Rules
- Any schema change requires a migration file: `supabase/migrations/{YYYYMMDDHHmmss}_{description}.sql`
- Backward-compatible rollout when possible (add column → backfill → make required).
- Include RLS policies in the same migration that creates the table.
- Test migrations on staging Supabase project before applying to production.
- Seed/fixture data must be sanitized and non-production.

### Key JSONB Columns
| Table | Column | Contains |
|-------|--------|----------|
| `ai_conversations` | `messages` | `{id, role, content, timestamp, tokens: {input, output}, action}[]` |
| `ai_conversations` | `summary` | Rolling AI summary (max 300 tokens) |
| `photo_diagnoses` | `treatment_plan` | Medication, dosing, duration |
| `compatibility_checks` | `warnings` | Compatibility warning objects |
| `admin_audit_log` | `old_value` / `new_value` | State snapshots (before/after) |

### Critical Indexes
| Index | On | Purpose |
|-------|----|---------|
| `idx_params_tank_date` | `water_parameters(tank_id, test_date DESC)` | Chart queries (<2s for 90 days) |
| `idx_tanks_user_active` | `tanks(user_id, deleted_at)` | Active tank lookups |
| `idx_ai_conv_user_tank` | `ai_conversations(user_id, tank_id, updated_at DESC)` | Chat history loading |
| `idx_ai_usage_user_date` | `ai_usage(user_id, date DESC)` | Daily limit checks |
| `idx_maint_tasks_due` | `maintenance_tasks(next_due_date, is_active)` | Cron notification queries |
| GIN index | `species(common_name)` | Full-text species search |

## APIs and Contracts

- Do not break the API response envelope format without updating `12_API_Integration_Spec.md`, all client code, and tests.
- For new endpoints, add: Zod schema validation, error handling with proper error codes, rate limiting, and tests.
- **Stripe webhooks** must be idempotent — always check `webhook_events` table before processing.
- **AI endpoints** must track token usage in `ai_usage` table and enforce daily limits.

### Authentication
- JWT via Supabase Auth. Access token: 1 hour. Refresh token: 7 days (auto-rotated).
- Token in `Authorization: Bearer {jwt}` header. Never in URL params.
- `auth.uid()` in PostgreSQL resolves to JWT `sub` claim for RLS.
- Rate limit auth endpoints: 5 attempts per 15 minutes per IP.

## Environment Variables

**Never hardcode these. Use `.env.local` locally, Vercel env vars + Supabase Vault in production.**

### Public (OK in client bundle — `NEXT_PUBLIC_` prefix)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://{project-ref}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BL...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_APP_URL=https://aquaticai.com
```

### Secret (Server-only — Supabase Vault + Vercel encrypted)
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
SERPAPI_API_KEY=...
VAPID_PRIVATE_KEY=...
```

### Stripe Product/Price IDs
```bash
STRIPE_PRODUCT_STARTER=prod_...
STRIPE_PRODUCT_PLUS=prod_...
STRIPE_PRODUCT_PRO=prod_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PLUS_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PORTAL_CONFIG_ID=bpc_...
```

### App Config
```bash
ANTHROPIC_MODEL_SONNET=claude-sonnet-4-5-20250929
ANTHROPIC_MODEL_HAIKU=claude-haiku-4-5-20251001
RESEND_FROM_ADDRESS=reports@aquaticai.com
VAPID_SUBJECT=mailto:support@aquaticai.com
```

## Testing Requirements

Minimum expectations for each change:
- **Unit tests** for core logic (tier enforcement, validation, token counting, date calculations).
- **Integration tests** for feature interactions (auth → tank → AI chat flow).
- **E2E tests** (Playwright) for critical user journeys (signup, billing, parameter logging).
- **Regression tests** for every bug fix.

### Commands to Run

```bash
# Install
npm install

# Dev server
npm run dev

# Unit tests
npm run test              # All Vitest tests
npm run test:unit         # Unit only
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e          # Headless Playwright
npm run test:e2e:ui       # Playwright UI mode

# Lint & format
npm run lint              # ESLint
npm run format            # Prettier

# Type check & build
npm run typecheck         # tsc --noEmit
npm run build             # Production build

# Database
npx supabase db push      # Apply migrations
npx supabase gen types typescript --local > lib/types/database.ts  # Regenerate types
```

If you cannot run commands, state what you would run and why.

## Scheduled Jobs (Cron)

These run as Supabase Edge Functions on a schedule. Be aware of them when modifying related tables.

| Job | Schedule | What It Does |
|-----|----------|-------------|
| Notification scheduler | Every 15 min | Checks `maintenance_tasks.next_due_date`, sends push/email |
| AI usage reset | Midnight UTC | Resets daily message counters in `ai_usage` |
| Email report generation | Daily 6am UTC / Weekly Mon 8am UTC | Generates AI health reports for Pro users |
| Soft-delete cleanup | Daily 3am UTC | Purges tanks deleted >90 days, free-tier photos >30 days |
| Equipment lifespan alerts | Daily 9am UTC | Checks equipment due for maintenance |
| Subscription grace check | Daily 6am UTC | Processes grace period expirations |

## Key Decisions to Know

These are the most impactful architectural decisions from `Open_Questions_Decisions.md`:

1. **AI context management:** Rolling summarization when `total_tokens > 8,000`. Older messages summarized by Haiku into `summary` field. Last 50 messages kept.
2. **Usage limits:** Hard cutoff with upgrade prompt. Return `429 DAILY_LIMIT_REACHED` with tier info and upgrade URL.
3. **Landing page:** Dashboard-first (not chat-first). Bottom tab bar: Home, Parameters, Species, Maintenance, Chat. Floating chat button.
4. **AI responses:** Non-streaming for v1. Streaming is P1.
5. **Free tier:** Functional with hard limits. Data always accessible. After trial: 1 tank, 10 AI messages/day.
6. **Notifications:** Email fallback for unsupported devices. Push is best-effort; email reminder if unacknowledged within 60 min.
7. **Offline:** AI chat disabled offline. Parameter entries queued in IndexedDB, synced on reconnect.
8. **Billing:** No refunds. Cancellation takes effect at period end. 7-day grace period for failed payments with Stripe Smart Retries.

## What to Include in Your Response

Return in this order:

1. **What you changed** (high-level summary)
2. **Files changed** (bulleted list)
3. **How you verified** (commands + results)
4. **Risks/edge cases + follow-ups** (if any)
5. **Spec alignment** (which spec docs this change implements or affects)

## Guardrails

- **Do not** add broad refactors unless explicitly asked.
- **Do not** change working code "for style."
- **Do not** add large dependency additions without justification.
- **Do not** modify RLS policies without reviewing `01_Security_Privacy_Checklist.md`.
- **Do not** change Stripe webhook handlers without testing idempotency.
- **Do not** modify AI system prompts without reviewing `01_AI_Chat_Engine_Spec.md`.
- **Do not** touch tier enforcement logic without testing all 4 tiers.
- Prefer configuration over code when it's the established pattern.
- If there are multiple options, pick the simplest that matches existing conventions.
- When in doubt, check the spec. When specs are ambiguous, make the safest assumption and flag it.

## Priority Context

**Current phase:** MVP development (P0 features)
**MVP target:** Late May 2026 (~Week 14)
**What's shipping:** Auth, Tanks, AI Chat, Parameters, Species, Maintenance, Billing, PWA, Admin v1
**What's NOT shipping yet:** Photo Diagnosis, Equipment Tracking, Email Reports, Streaming AI, Admin v2
**Full roadmap:** See `AquaBotAI_Product_Roadmap.md`

## Roadmap Dashboard Updates (REQUIRED — EVERY RUN)

**CRITICAL:** The PM Orchestrator MUST update `Docs/Roadmap/AquaBotAI_Product_Roadmap.html` at the **end of every single run**. Each run IS a sprint cycle. This is Sam's primary view into project status — if you don't update it, Sam has no visibility into what happened.

The dashboard has these tabs that need regular updates:
- **Overview:** Sprint banner, feature progress bars, phase status
- **Sprints:** Sprint history, outcomes, what was built, metrics
- **Feedback:** Sam's feedback submissions (backed by Supabase — see below)
- **Testing:** Features ready for Sam to test, test scenarios, Sam's updates

### Feedback System (Supabase-Backed)

Sam submits feedback and screenshots through the Feedback tab on the roadmap page. All data is persisted to Supabase:

| Resource | Location |
|----------|----------|
| Feedback data | `public.feedback` table (Supabase project `mtwyezkbmyrgxqmskblu`) |
| Feedback images | `feedback-images` Storage bucket (public URLs in `image_urls` column) |
| Visual view | Roadmap HTML → Feedback tab (reads from Supabase) |

**Feedback table schema:**
- `id` (TEXT PK) — e.g., `FB-MLDU3SVW`
- `type` — `priority`, `bug`, `feature`, `question`, `other`
- `message` (TEXT) — Sam's feedback text
- `image_urls` (TEXT[]) — Array of public URLs to attached screenshots
- `submitted_by` (TEXT) — defaults to `Sam`
- `status` — `pending`, `addressed`, `wontfix`
- `pm_notes` (TEXT) — PM's response (you fill this in)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**How to access:**
- **Read pending:** `SELECT * FROM feedback WHERE status = 'pending' ORDER BY created_at DESC`
- **Respond:** `UPDATE feedback SET status = 'addressed', pm_notes = 'Your response', updated_at = NOW() WHERE id = 'FB-xxx'`
- **View images:** Check `image_urls` array — each URL is a public link to the `feedback-images` bucket
- **Dashboard:** Supabase Dashboard → Table Editor → `feedback`
- **REST API:** `GET https://mtwyezkbmyrgxqmskblu.supabase.co/rest/v1/feedback?status=eq.pending&order=created_at.desc`

### PM Run Checklist (complete before every run ends):

When acting as PM, **always** do ALL of the following before ending your run:
1. **START of run:** Query `feedback` table for pending items. Read messages AND check `image_urls` for screenshots. Sam's feedback drives priorities.
2. **Respond to all pending feedback** — update `status` to `'addressed'` and add your response to `pm_notes`
3. **END of run:** Update the Sprints tab with what was accomplished
4. Update the Testing tab with what Sam should manually test
5. Update all progress bars and milestone status to reflect current state
6. Update the "Last updated" timestamp in the sprint banner
7. Update memory files (`memory/sprints/`, INDEX files)

---

## Connected Services

| Service | Status | Reference |
|---------|--------|-----------|
| GitHub | Connected | `siriz0408/AquaBotIO` |
| Supabase | Connected | Project `mtwyezkbmyrgxqmskblu` |
| Vercel | Pending | — |
| Stripe | Pending | — |
