# AquaBotAI Ship Readiness: Deployment Plan

**Document Version:** 1.0
**Last Updated:** February 2025
**Author:** Solo Developer
**Project:** AquaBotAI - AI-Powered Aquarium Management PWA

---

## Table of Contents

1. [Environment Strategy](#environment-strategy)
2. [Infrastructure Architecture](#infrastructure-architecture)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Database Migration Strategy](#database-migration-strategy)
5. [Environment Variables & Secrets](#environment-variables--secrets)
6. [Deployment Checklist](#deployment-checklist)
7. [Rollback Strategy](#rollback-strategy)
8. [Scaling Considerations](#scaling-considerations)
9. [Domain & SSL](#domain--ssl)
10. [Service Worker & PWA Deployment](#service-worker--pwa-deployment)

---

## Environment Strategy

AquaBotAI operates across three distinct environments, each with specific purposes, configurations, and data isolation.

### Environment Overview

| Aspect | Local Dev | Staging/Preview | Production |
|--------|-----------|-----------------|------------|
| **Platform** | Local machine | Vercel Preview | Vercel Production |
| **Database** | Supabase Dev Project | Supabase Staging (Branch) | Supabase Prod Project |
| **URL** | localhost:3000 | preview-*.vercel.app | aquabotai.com |
| **Auth** | Full (email, Google, magic link) | Full (email, Google, magic link) | Full (email, Google, magic link) |
| **Stripe** | Test Mode (sk_test_*) | Test Mode (sk_test_*) | Live Mode (sk_live_*) |
| **Claude API** | Full access | Full access | Full access |
| **RLS** | Enforced (local-only user) | Enforced | Enforced |
| **Backups** | None | Daily automatic | Hourly automatic + manual snapshots |
| **Monitoring** | Local logs | Sentry + Vercel Analytics | Sentry + Vercel Analytics |
| **Edge Function Logs** | Console | Supabase Logs | Supabase Logs + Sentry |

### Supabase Project Strategy

**Recommendation: 2-Project Approach (More Practical for Solo Dev)**

```
┌─────────────────────────────────────────────────────────────┐
│  Supabase Project Structure                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────┐                        │
│  │  Production Project              │                        │
│  │  (aquabotai-prod)                │                        │
│  ├─────────────────────────────────┤                        │
│  │  - Main database                 │                        │
│  │  - 22 tables, ~320 columns       │                        │
│  │  - 800+ species entries          │                        │
│  │  - RLS on all tables             │                        │
│  │  - Hourly backups                │                        │
│  │  - Production Edge Functions     │                        │
│  │  - Real paying customers         │                        │
│  └─────────────────────────────────┘                        │
│           ↑                                                   │
│           │ Deploy migrations first                          │
│           │ on staging branch                                │
│           │                                                   │
│  ┌─────────────────────────────────┐                        │
│  │  Staging Project                 │                        │
│  │  (aquabotai-staging)             │                        │
│  ├─────────────────────────────────┤                        │
│  │  - Full copy of prod schema      │                        │
│  │  - Test/dummy user data          │                        │
│  │  - Daily backup refresh from prod│                        │
│  │  - Staging Edge Functions       │                        │
│  │  - Preview deployments           │                        │
│  └─────────────────────────────────┘                        │
│           ↑                                                   │
│           │ Initialize with                                  │
│           │ production schema snapshot                       │
│           │                                                   │
│  ┌─────────────────────────────────┐                        │
│  │  Local Dev (your machine)        │                        │
│  ├─────────────────────────────────┤                        │
│  │  - supabase start                │                        │
│  │  - Docker-based local instance   │                        │
│  │  - Minimal data for testing      │                        │
│  │  - Local auth (no email sending) │                        │
│  │  - Quick iteration cycle         │                        │
│  └─────────────────────────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Local Development Setup

**Initialize local Supabase:**

```bash
# Install Supabase CLI (one-time)
npm install -g supabase

# Navigate to project root
cd ~/projects/aquabotai

# Initialize local Supabase instance
supabase init

# Start local services (PostgreSQL, Auth, Storage, Functions)
supabase start

# Output will show:
# - API URL: http://localhost:54321
# - Anon Key: eyJhbGc...
# - Service Role Key: eyJhbGc...
# - Database: postgresql://postgres:postgres@localhost:5432/postgres
```

**Create `.env.local` for local development:**

```bash
# Next.js
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<LOCAL_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<LOCAL_SERVICE_ROLE_KEY>

# Stripe (Test Mode)
STRIPE_PUBLIC_KEY=pk_test_51234...
STRIPE_SECRET_KEY=sk_test_51234...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Resend (Test)
RESEND_API_KEY=re_test_...

# SerpAPI
SERPAPI_API_KEY=your_test_key

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Feature Flags (local)
NEXT_PUBLIC_FEATURE_MAINTENANCE=false
```

### Staging Environment

**Vercel Preview Deployments + Staging Supabase Project:**

- Every PR creates automatic preview deployment on Vercel
- Preview uses staging Supabase project (separate from production)
- Test mode Stripe keys ensure no real charges
- Full CI/CD runs before preview creation
- Email goes through Resend sandbox (doesn't send actual emails)

**Connect Staging Preview to Staging Supabase:**

Create `.env.staging` in Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://aquabotai-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
ANTHROPIC_API_KEY=sk-ant-...
```

### Production Environment

**Vercel Production + Production Supabase Project:**

- Main branch deploys to production
- Uses production Supabase project
- Live Stripe mode (real transactions)
- Customers' actual data in database
- Full monitoring and alerting

**Production Environment Variables in Vercel:**

```
NEXT_PUBLIC_SUPABASE_URL=https://aquabotai-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Infrastructure Architecture

### Full System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           AQUABOTAI SYSTEM ARCHITECTURE                     │
└────────────────────────────────────────────────────────────────────────────┘

                          ┌─────────────────────┐
                          │     End Users       │
                          │  (Web + PWA App)    │
                          └──────────┬──────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
        ┌───────────▼───────────┐   │   ┌────────────▼──────────────┐
        │   DNS (Custom Domain) │   │   │  Service Worker (PWA)     │
        │   aquabotai.com       │   │   │  - Offline caching       │
        │   (via Vercel DNS)    │   │   │  - Push notifications    │
        │                       │   │   │  - Background sync       │
        └───────────┬───────────┘   │   └────────────┬──────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
        ┌───────────────────────────▼────────────────────────────┐
        │              VERCEL EDGE NETWORK (CDN)                 │
        │  - Next.js 14 App Runtime                              │
        │  - Automatic image optimization                        │
        │  - Edge caching                                        │
        │  - Global distribution                                 │
        └───────────────────────────┬────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
    ┌───────▼──────────┐  ┌────────▼────────┐  ┌──────────▼──────────┐
    │ VERCEL FUNCTIONS │  │ STATIC ASSETS   │  │ API ROUTES          │
    │ (Serverless)     │  │ - CSS, JS, fonts│  │ - /api/auth         │
    │                  │  │ - Images        │  │ - /api/webhooks     │
    │ - Vote & logging │  │ - Tank photos   │  │ - /api/stripe       │
    │ - Real-time sync │  │ - Cached data   │  │ - /api/chat         │
    └──────┬───────────┘  └────────┬────────┘  └──────────┬──────────┘
           │                       │                      │
           └───────────────────────┼──────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  SUPABASE API LAYER         │
                    │  (PostgreSQL + PostgREST)   │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
    ┌───▼────────────────┐  ┌──────▼─────────┐  ┌────────────▼────────┐
    │  PostgreSQL 15     │  │  Auth Service  │  │  Storage Service    │
    │  Database          │  │  - JWT tokens  │  │  - Tank photos      │
    │                    │  │  - Sessions    │  │  - Diagnosis images │
    │  22 Tables:        │  │  - OAuth2      │  │  - Reports          │
    │  - users           │  │  - Magic links │  │  - Model artifacts  │
    │  - tanks           │  │                │  │                     │
    │  - species         │  └────┬───────────┘  └─────────┬───────────┘
    │  - parameters      │        │                       │
    │  - diagnoses       │        │                       │
    │  - reports         │        │                       │
    │  - water_tests     │        │                       │
    │  - equipment       │        │                       │
    │  - recommendations │        │                       │
    │  - subscriptions   │        │                       │
    │  - RLS on all      │        │                       │
    │                    │        │                       │
    │  Row-Level         │        │                       │
    │  Security:         │        │                       │
    │  ✓ users table     │        │                       │
    │  ✓ tanks table     │        │                       │
    │  ✓ all user-owned  │        │                       │
    │    resources       │        │                       │
    └────────┬───────────┘        │                       │
             │                    │                       │
             └────────┬───────────┴───────────┬───────────┘
                      │                       │
    ┌─────────────────▼──────────────────────▼──────────────┐
    │     SUPABASE EDGE FUNCTIONS (Deno Runtime)            │
    │                                                        │
    │  /functions/                                           │
    │  ├── ai-diagnosis/ (Claude Vision API calls)          │
    │  ├── process-report/ (CSV report generation)          │
    │  ├── sync-parameters/ (Real-time updates)             │
    │  ├── webhooks/stripe/ (Payment confirmations)         │
    │  ├── send-email/ (Resend integration)                 │
    │  └── search-equipment/ (SerpAPI equipment lookup)     │
    │                                                        │
    │  All functions:                                        │
    │  - Require JWT auth                                    │
    │  - Rate-limited                                        │
    │  - Logged for debugging                               │
    └─────┬─────────────────────────────────────────────────┘
          │
          ├─────────────────┬─────────────────┬──────────┐
          │                 │                 │          │
    ┌─────▼────────┐  ┌────▼──────────┐  ┌──▼─────┐  ┌─▼──────────┐
    │ Anthropic    │  │ Stripe API    │  │ Resend │  │ SerpAPI    │
    │ Claude API   │  │ (Payments)    │  │ (Mail) │  │ (Search)   │
    │              │  │               │  │        │  │            │
    │ - Chat       │  │ - Create      │  │- Send  │  │ - Equipment│
    │   endpoint   │  │   customers   │  │  email │  │  search    │
    │              │  │ - Create      │  │- Track │  │            │
    │ - Vision     │  │   payment     │  │  opens │  │            │
    │   (diagnose) │  │   intents     │  │        │  │            │
    │              │  │ - Manage      │  │        │  │            │
    │ - Embeddings │  │   subscriptions│  │        │  │            │
    │ - Models:    │  │ - Webhooks    │  │        │  │            │
    │   Sonnet 4.5 │  │               │  │        │  │            │
    └──────────────┘  └───────────────┘  └────────┘  └────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW EXAMPLES                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  EXAMPLE 1: User uploads tank photo for diagnosis                           │
│  ─────────────────────────────────────────────────────────────              │
│  1. User selects image in PWA (browser)                                      │
│  2. Image uploaded to Supabase Storage                                       │
│  3. Frontend calls /api/chat with image reference                            │
│  4. Vercel Function receives request                                         │
│  5. Function calls Supabase Edge Function (ai-diagnosis)                    │
│  6. Edge Function calls Anthropic Claude Vision API                          │
│  7. Claude analyzes image, returns diagnosis                                 │
│  8. Edge Function stores diagnosis in PostgreSQL                             │
│  9. Realtime subscription pushes update to all open PWA clients              │
│  10. Users see diagnosis in real-time                                        │
│                                                                              │
│  EXAMPLE 2: User subscribes to Pro plan                                      │
│  ────────────────────────────────────────                                   │
│  1. User clicks "Subscribe" button                                           │
│  2. Frontend redirects to Stripe Checkout (hosted)                           │
│  3. User completes payment on Stripe                                         │
│  4. Stripe sends webhook to /api/webhooks/stripe                             │
│  5. Webhook verifies signature + updates subscription in PostgreSQL          │
│  6. Webhook triggers Resend email confirmation                               │
│  7. Supabase Realtime notifies all sessions: user now Pro                   │
│  8. UI instantly unlocks Pro features                                        │
│                                                                              │
│  EXAMPLE 3: Scheduled report generation (cron)                              │
│  ────────────────────────────────────────────                               │
│  1. External cron service (e.g., Novu) calls /api/reports/generate          │
│  2. API route invokes Supabase Edge Function                                 │
│  3. Edge Function queries PostgreSQL for tank data                           │
│  4. Generates CSV report                                                     │
│  5. Stores report in Supabase Storage                                        │
│  6. Sends download link via Resend email                                     │
│  7. User receives email with report                                          │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                    SERVICE CONNECTIVITY SUMMARY                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Vercel ←→ Supabase:           REST API calls + Realtime websockets         │
│  Vercel ←→ Anthropic:           HTTP API calls (via Edge Functions)         │
│  Vercel ←→ Stripe:              HTTP API calls + webhooks                   │
│  Vercel ←→ Resend:              HTTP API calls (via Edge Functions)         │
│  Supabase ←→ Anthropic:         via Edge Functions (Deno)                  │
│  Supabase ←→ Stripe:            via Edge Functions or webhooks              │
│  Clients ←→ PWA Service Worker: IndexedDB caching + sync                    │
│  All services:                  HTTPS only, TLS 1.3                         │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

### Key Routing Rules

**API Gateway (Vercel):**
- `/api/*` → Next.js API routes
- `/api/chat` → Supabase Edge Function → Anthropic Claude
- `/api/webhooks/stripe` → Webhook handler → Database
- `/_next/*` → Static assets (CDN cached)
- `/` → Next.js App Router pages (SSR/SSG)

**Authentication Flow:**
1. User logs in via Supabase Auth
2. JWT token stored in HTTP-only cookie + localStorage (PWA)
3. All API calls include JWT in `Authorization: Bearer` header
4. Supabase RLS policies validate token + enforce row-level access

**Realtime Subscriptions:**
- Client WebSocket connection to Supabase Realtime
- PostgreSQL LISTEN/NOTIFY triggers updates
- Service Worker receives update → broadcasts to all PWA instances

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. PR Workflow (`pull_request.yml`)

```yaml
name: Pull Request Checks

on:
  pull_request:
    branches: [main, staging]

jobs:
  lint_type_test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint code
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Run unit tests
        run: pnpm test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e_tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Start Supabase
        run: |
          npx supabase init
          npx supabase start -x realtime,storage,vector

      - name: Build app
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5NjM1NjM2MDB9.CRXP3sSgZWQi8_-hQNaKPqc4lqQPS4XWO9jf8qrCIpQ

      - name: Start app server
        run: |
          pnpm start &
          sleep 5

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5NjM1NjM2MDB9.CRXP3sSgZWQi8_-hQNaKPqc4lqQPS4XWO9jf8qrCIpQ

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  preview_deployment:
    needs: [lint_type_test, e2e_tests]
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Preview
        run: |
          npx vercel deploy \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --env NEXT_PUBLIC_SUPABASE_URL=${{ secrets.VERCEL_PREVIEW_SUPABASE_URL }} \
            --env NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.VERCEL_PREVIEW_SUPABASE_ANON_KEY }} \
            --env STRIPE_PUBLIC_KEY=${{ secrets.STRIPE_PUBLIC_KEY }} \
            --env STRIPE_SECRET_KEY=${{ secrets.STRIPE_SECRET_KEY_PREVIEW }} \
            --env ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }}

      - name: Comment preview URL on PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployment ready: ${{ steps.preview.outputs.url }}'
            })
```

**Location:** `.github/workflows/pull_request.yml`

#### 2. Production Deployment Workflow (`main.yml`)

```yaml
name: Main Branch Deploy

on:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint code
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Run unit tests
        run: pnpm test:unit

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.VERCEL_STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.VERCEL_STAGING_SUPABASE_ANON_KEY }}

  database_migrations:
    needs: validate
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1

      - name: Verify migrations syntax
        run: |
          supabase migration list --project-ref=${{ secrets.SUPABASE_PROD_PROJECT_ID }}

      - name: Deploy migrations to staging first (dry run)
        run: |
          supabase migration push \
            --project-ref=${{ secrets.SUPABASE_STAGING_PROJECT_ID }} \
            --dry-run
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deploy migrations to production
        run: |
          supabase migration push \
            --project-ref=${{ secrets.SUPABASE_PROD_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Validate RLS policies
        run: |
          npx tsx scripts/validate-rls.ts \
            --project-ref=${{ secrets.SUPABASE_PROD_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy_edge_functions:
    needs: validate
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1

      - name: Deploy Edge Functions to production
        run: |
          for func in supabase/functions/*/; do
            func_name=$(basename "$func")
            supabase functions deploy "$func_name" \
              --project-ref=${{ secrets.SUPABASE_PROD_PROJECT_ID }}
          done
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Verify Edge Functions
        run: npx tsx scripts/verify-functions.ts
        env:
          SUPABASE_PROJECT_URL: ${{ secrets.SUPABASE_PROD_PROJECT_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

  deploy_frontend:
    needs: [validate, database_migrations, deploy_edge_functions]
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Production
        run: |
          npx vercel deploy \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --prod \
            --env NEXT_PUBLIC_SUPABASE_URL=${{ secrets.SUPABASE_PROD_PROJECT_URL }} \
            --env NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.SUPABASE_PROD_ANON_KEY }} \
            --env SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }} \
            --env STRIPE_PUBLIC_KEY=${{ secrets.STRIPE_PUBLIC_KEY }} \
            --env STRIPE_SECRET_KEY=${{ secrets.STRIPE_SECRET_KEY }} \
            --env STRIPE_WEBHOOK_SECRET=${{ secrets.STRIPE_WEBHOOK_SECRET }} \
            --env ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }} \
            --env RESEND_API_KEY=${{ secrets.RESEND_API_KEY }} \
            --env SERPAPI_API_KEY=${{ secrets.SERPAPI_API_KEY }}

  smoke_tests:
    needs: deploy_frontend
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run smoke tests
        run: pnpm test:smoke
        env:
          SMOKE_TEST_URL: https://aquabotai.com
          SMOKE_TEST_USER: ${{ secrets.SMOKE_TEST_USER }}
          SMOKE_TEST_PASSWORD: ${{ secrets.SMOKE_TEST_PASSWORD }}

      - name: Check UptimeRobot or Sentry
        run: |
          curl -X GET "https://api.uptimerobot.com/v2/getMonitors" \
            -H "api_key: ${{ secrets.UPTIMEROBOT_API_KEY }}"

  notify:
    needs: [deploy_frontend, smoke_tests]
    runs-on: ubuntu-latest
    if: always()

    steps:
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "AquaBotAI Production Deployment",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment*\nStatus: ${{ job.status }}\nCommit: ${{ github.sha }}"
                  }
                }
              ]
            }
```

**Location:** `.github/workflows/main.yml`

### Workflow Trigger Rules

| Event | Workflow | Actions |
|-------|----------|---------|
| Create PR | `pull_request.yml` | Lint → Type check → Unit tests → E2E → Preview deploy |
| Push to main | `main.yml` | All PR checks + DB migrations + Edge Functions + Prod deploy + Smoke tests |
| Manual trigger | (Deployment / Rollback) | Run rollback scripts |

---

## Database Migration Strategy

### Supabase Migrations Overview

Supabase uses a migration-based approach (similar to Rails, Django). All schema changes are versioned and reversible.

### Migration File Naming Convention

```
migrations/
├── 20250207120000_initial_schema.sql
├── 20250208093045_add_species_table.sql
├── 20250209144530_add_rls_policies.sql
├── 20250210101530_add_tank_parameters.sql
├── 20250211155000_add_diagnosis_images.sql
└── 20250212092000_seed_species_data.sql
```

**Naming Format:** `YYYYMMDDHHmmss_description.sql`

### Creating a New Migration

**Step 1: Create migration file locally**

```bash
# Option A: Let Supabase CLI generate the timestamp
supabase migration new add_new_feature

# This creates: migrations/20250213120000_add_new_feature.sql
```

**Step 2: Write migration SQL**

```sql
-- migrations/20250213120000_add_new_feature.sql

-- Create new table
create table if not exists public.new_feature (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes
create index idx_new_feature_user_id on public.new_feature(user_id);

-- Enable RLS
alter table public.new_feature enable row level security;

-- Create RLS policy
create policy "users can view their own features"
  on public.new_feature
  for select
  using (auth.uid() = user_id);

create policy "users can insert their own features"
  on public.new_feature
  for insert
  with check (auth.uid() = user_id);

-- Create triggers for updated_at
create trigger new_feature_update_timestamp
  before update on public.new_feature
  for each row
  execute function update_timestamp();
```

**Step 3: Test locally**

```bash
# Reset local database and apply all migrations
supabase db reset

# Check that migration applied successfully
supabase db remote commit

# Test with app
pnpm dev

# Run E2E tests to verify
pnpm test:e2e
```

### Applying Migrations to Production

```bash
# Step 1: Verify migrations list
supabase migration list --project-ref=aquabotai-prod

# Step 2: Push to staging first (always!)
supabase migration push \
  --project-ref=aquabotai-staging \
  --dry-run

# Step 3: Actually apply to staging
supabase migration push --project-ref=aquabotai-staging

# Step 4: Verify staging is healthy
# - Check Supabase dashboard
# - Run smoke tests against staging
# - Check Edge Function logs

# Step 5: Apply to production
supabase migration push --project-ref=aquabotai-prod

# Step 6: Verify production
# - Check Supabase dashboard
# - Run monitoring checks
# - Monitor error rates in Sentry
```

### Rollback Procedures

#### Reversible Migrations (Recommended)

**For most schema changes**, create a pair of up/down migrations:

```sql
-- migrations/20250213120000_add_new_feature.sql (UP)

create table public.new_feature (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

alter table public.new_feature enable row level security;
create policy "user_access" on public.new_feature for all using (auth.uid() = user_id);
```

```sql
-- migrations/20250214093000_rollback_new_feature.sql (DOWN)

drop table if exists public.new_feature cascade;
```

**To rollback:**

```bash
# Apply the rollback migration
supabase migration push --project-ref=aquabotai-prod

# This applies the next migration file, which drops the table
```

#### Irreversible Migrations (Data Loss)

Some migrations (e.g., column drops) are destructive:

```sql
-- migrations/20250213120000_drop_column.sql

alter table public.tanks drop column if exists deprecated_field;
```

**Safeguards:**

1. **Always backup first:**
   ```bash
   supabase db pull --project-ref=aquabotai-prod
   # Creates supabase/migrations/ with current schema
   ```

2. **Test on staging:**
   ```bash
   supabase migration push --project-ref=aquabotai-staging
   supabase db remote commit --project-ref=aquabotai-staging
   # Verify staging still works
   ```

3. **Create snapshot before applying:**
   ```bash
   supabase projects create \
     --name aquabotai-prod-backup-20250213 \
     --organization-id <ORG_ID> \
     --region us-east-1

   # Manual: Use Supabase dashboard to create backup snapshot
   ```

4. **Apply to production with caution:**
   ```bash
   supabase migration push --project-ref=aquabotai-prod
   ```

### Seed Data Management (800+ Species)

#### Initial Seed

Create a seed migration that's separate from schema:

```sql
-- migrations/20250215100000_seed_species_data.sql

insert into public.species (name, category, optimal_temperature, optimal_ph, difficulty_level)
values
  ('Neon Tetra', 'tropical_fish', 25, 6.5, 'easy'),
  ('Betta Fish', 'tropical_fish', 26, 7.0, 'easy'),
  ('Angelfish', 'tropical_fish', 24, 7.0, 'medium'),
  -- ... 800+ more entries
on conflict (name) do nothing;
```

**Better approach: CSV import**

```bash
# Export species data to CSV
npx tsx scripts/export-species.ts > species.csv

# Upload via Supabase CLI
psql $DATABASE_URL -c "\copy public.species(name, category, optimal_temperature, optimal_ph, difficulty_level) from stdin with (format csv, header true)" < species.csv

# Or use Supabase dashboard: Data > species > Import data
```

#### Updating Seed Data

```bash
# Always: Don't modify via direct SQL in production
# Instead: Create migration that updates records

-- migrations/20250220140000_update_species_data.sql
update public.species
set optimal_temperature = 24
where name = 'Neon Tetra';
```

### RLS Policy Deployment

RLS policies are defined in migrations:

```sql
-- migrations/20250216120000_setup_rls.sql

-- Enable RLS on all user-accessible tables
alter table public.users enable row level security;
alter table public.tanks enable row level security;
alter table public.species enable row level security;
alter table public.parameters enable row level security;
alter table public.diagnoses enable row level security;

-- Users can only see their own record
create policy "users_view_self"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "users_update_self"
  on public.users for update
  using (auth.uid() = id);

-- Users can see their own tanks
create policy "tanks_view_own"
  on public.tanks for select
  using (auth.uid() = user_id);

-- Users can create tanks
create policy "tanks_insert_own"
  on public.tanks for insert
  with check (auth.uid() = user_id);

-- Users can update their own tanks
create policy "tanks_update_own"
  on public.tanks for update
  using (auth.uid() = user_id);

-- Public: Everyone can read species data (no RLS needed for read)
-- But we still recommend RLS for consistency
alter table public.species enable row level security;
create policy "species_view_all"
  on public.species for select
  to public
  using (true);

-- Diagnoses: Only the tank owner can see
create policy "diagnoses_view_own"
  on public.diagnoses for select
  using (
    auth.uid() in (
      select user_id from public.tanks where id = diagnoses.tank_id
    )
  );

-- Parameters: Only the tank owner can see
create policy "parameters_view_own"
  on public.parameters for select
  using (
    auth.uid() in (
      select user_id from public.tanks where id = parameters.tank_id
    )
  );
```

**Validate RLS policies before deploy:**

```bash
# Create a script to test RLS
# scripts/validate-rls.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test that RLS blocks unauthorized access
const { data, error } = await supabase
  .from('tanks')
  .select('*')
  .neq('user_id', 'test-user-id');

if (error) {
  console.log('✓ RLS is working: unauthorized access blocked');
} else if (data.length === 0) {
  console.log('✓ RLS is working: no data returned for unauthorized user');
} else {
  throw new Error('✗ RLS FAILED: unauthorized user can see data!');
}
```

Run before production deploy:

```bash
npx tsx scripts/validate-rls.ts \
  --project-ref=aquabotai-prod \
  --access-token=$SUPABASE_ACCESS_TOKEN
```

---

## Environment Variables & Secrets

### Complete Environment Variable Reference

#### Frontend Variables (`.env.local`, `.env.production`)

| Variable | Example | Storage | Required | Description |
|----------|---------|---------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://aquabotai-prod.supabase.co` | Vercel Env | Yes | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Vercel Env | Yes | Supabase anonymous key (safe for public) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Vercel Env | Yes | Stripe public key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BJxxxxx...` | Vercel Env | Yes | Web Push public key (PWA notifications) |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://...@sentry.io/...` | Vercel Env | No | Sentry error tracking |
| `NEXT_PUBLIC_APP_URL` | `https://aquabotai.com` | Vercel Env | Yes | App base URL (for PWA manifest) |
| `NEXT_PUBLIC_API_URL` | `https://aquabotai.com/api` | Vercel Env | Yes | API endpoint (for PWA) |

#### Backend Variables (Vercel & Supabase)

| Variable | Example | Storage | Required | Description |
|----------|---------|---------|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Vercel Secret | Yes | Supabase admin key (server-only!) |
| `SUPABASE_PROJECT_URL` | `https://aquabotai-prod.supabase.co` | Vercel Env | Yes | Supabase URL (backend reference) |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Vercel Secret | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_live_...` | Vercel Secret | Yes | Stripe webhook signing secret |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Vercel Secret | Yes | Claude API key (server-only!) |
| `RESEND_API_KEY` | `re_...` | Vercel Secret | Yes | Resend email API key |
| `SERPAPI_API_KEY` | `...` | Vercel Secret | No | SerpAPI key (Pro plans only) |
| `VAPID_PRIVATE_KEY` | `...` | Vercel Secret | Yes | Web Push private key |

#### Supabase-Specific Variables

**In Supabase Edge Functions (`supabase/.env`):**

```
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
SERPAPI_API_KEY=...
```

**For local development (`supabase/.env.local`):**

```
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_test_...
SERPAPI_API_KEY=...
```

### Managing Secrets in Different Environments

#### Local Development

**File: `.env.local`** (add to `.gitignore`)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_test_...
SERPAPI_API_KEY=test_key...
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
```

**How to get keys for local:**

```bash
# Get Supabase keys from local instance
supabase status

# Stripe test keys: https://dashboard.stripe.com/test/apikeys
# Anthropic test key: https://console.anthropic.com/account/keys
# Resend test key: https://resend.com/api-keys (test mode)
```

#### Vercel Environment Variables

**Vercel Dashboard → Project → Settings → Environment Variables**

```bash
# Production Environment
NEXT_PUBLIC_SUPABASE_URL=https://aquabotai-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BJ...
NEXT_PUBLIC_APP_URL=https://aquabotai.com
STRIPE_SECRET_KEY=sk_live_... (sensitive)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (sensitive)
ANTHROPIC_API_KEY=sk-ant-... (sensitive)
STRIPE_WEBHOOK_SECRET=whsec_live_... (sensitive)
RESEND_API_KEY=re_... (sensitive)
SERPAPI_API_KEY=... (sensitive)
VAPID_PRIVATE_KEY=... (sensitive)
```

**Command-line alternative using Vercel CLI:**

```bash
# Install Vercel CLI
npm i -g vercel

# Link project (one-time)
vercel link

# Set production variables
vercel env add STRIPE_SECRET_KEY
# Prompts for value, automatically encrypted

# View all variables
vercel env list

# Pull variables locally (into .env.production.local)
vercel env pull

# Deploy with variables
vercel deploy --prod
```

#### GitHub Secrets (for CI/CD)

**GitHub → Repository → Settings → Secrets & variables → Actions**

```
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...

SUPABASE_ACCESS_TOKEN=...
SUPABASE_PROD_PROJECT_ID=aquabotai-prod
SUPABASE_STAGING_PROJECT_ID=aquabotai-staging
SUPABASE_PROD_PROJECT_URL=https://aquabotai-prod.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_SECRET_KEY_PREVIEW=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

ANTHROPIC_API_KEY=sk-ant-...

RESEND_API_KEY=re_...

SERPAPI_API_KEY=...

SMOKE_TEST_USER=test@example.com
SMOKE_TEST_PASSWORD=secure_password

SLACK_WEBHOOK=https://hooks.slack.com/services/...
UPTIMEROBOT_API_KEY=...
```

### Rotating Secrets

#### Stripe Keys Rotation

```bash
# 1. Generate new API key in Stripe Dashboard
# 2. Update STRIPE_SECRET_KEY in Vercel
vercel env add STRIPE_SECRET_KEY

# 3. Wait 24 hours (webhooks may use old key in transit)

# 4. Delete old key from Stripe Dashboard
```

#### Anthropic API Key Rotation

```bash
# 1. Create new key in Anthropic Console
# https://console.anthropic.com/account/keys

# 2. Update in Vercel and GitHub
vercel env add ANTHROPIC_API_KEY

# 3. Delete old key from Anthropic Console
```

#### Supabase Service Role Key Rotation

```bash
# 1. In Supabase Dashboard → Settings → API
# Click "Rotate" next to service role key

# 2. Update in Vercel
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 3. Update in Supabase Edge Functions
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=new_key

# 4. Confirm old key is revoked
```

#### VAPID Keys Rotation (Push Notifications)

```bash
# 1. Generate new VAPID keys
npx web-push generate-vapid-keys

# 2. Update in Vercel
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY

# 3. Users will re-subscribe to notifications with new key
# (Service worker will handle this automatically)
```

### Secret Hygiene Checklist

- [ ] Never commit secrets to Git
- [ ] `.env.local` is in `.gitignore`
- [ ] All secrets stored in Vercel/GitHub (encrypted)
- [ ] Rotate keys every 3-6 months
- [ ] Use separate keys for test and production
- [ ] Regularly audit which services have access to which keys
- [ ] Delete unused API keys immediately
- [ ] Use environment-specific versions (e.g., `STRIPE_SECRET_KEY_PREVIEW`)

---

## Deployment Checklist

### Pre-Deployment Checklist (All Deployments)

- [ ] **Code Review**
  - [ ] PR approved by self (code review notes in commit)
  - [ ] All conversations resolved
  - [ ] No `console.log` or `debugger` statements in code
  - [ ] No commented-out code blocks

- [ ] **Testing**
  - [ ] All unit tests passing (`pnpm test:unit`)
  - [ ] All E2E tests passing (`pnpm test:e2e`)
  - [ ] Linting passes (`pnpm lint`)
  - [ ] Type checking passes (`pnpm type-check`)
  - [ ] No new TypeScript errors introduced

- [ ] **Dependencies**
  - [ ] `pnpm install` runs without errors
  - [ ] No deprecated dependencies
  - [ ] Security audit passing (`pnpm audit`)
  - [ ] Lockfile committed to Git

- [ ] **Database**
  - [ ] All migrations created and tested
  - [ ] Rollback migration exists for all changes
  - [ ] Tested against staging Supabase project
  - [ ] No breaking changes to RLS policies
  - [ ] Seed data (if any) is correct

- [ ] **Environment**
  - [ ] All required env vars set in Vercel
  - [ ] No unencrypted secrets in repository
  - [ ] `.env.local` is NOT in Git history
  - [ ] Vercel environment matches production settings

- [ ] **Performance**
  - [ ] No new performance regressions
  - [ ] Bundle size acceptable (`pnpm build`)
  - [ ] Lighthouse score >= 90 (mobile)
  - [ ] API response times < 500ms

- [ ] **Security**
  - [ ] CORS properly configured
  - [ ] No new XSS vulnerabilities
  - [ ] CSRF tokens in place (if needed)
  - [ ] API keys not exposed in client code
  - [ ] RLS policies enforce authorization

- [ ] **Documentation**
  - [ ] Deployment notes updated
  - [ ] Any config changes documented
  - [ ] Breaking changes noted
  - [ ] README updated (if applicable)

### Staging Deployment Checklist

- [ ] **PR Created**
  - [ ] PR opened against `main`
  - [ ] Title clearly describes changes
  - [ ] Description explains "why" not just "what"
  - [ ] Linked to relevant issues

- [ ] **Preview Deployment**
  - [ ] Vercel preview deployed automatically
  - [ ] Preview URL commented on PR
  - [ ] Preview environment variables correct
  - [ ] No errors in preview deployment logs

- [ ] **Staging Testing**
  - [ ] Test all changed features manually on preview
  - [ ] Test on mobile (PWA functionality)
  - [ ] Test offline mode (service worker)
  - [ ] Test push notifications (if changed)
  - [ ] Test auth flow (login, logout, signup)
  - [ ] Test Stripe test mode (if payment changes)
  - [ ] Check Sentry for any new errors

### Production Deployment Checklist

- [ ] **Pre-Deployment (30 min before)**
  - [ ] Merge PR to `main`
  - [ ] GitHub Actions running (all checks must pass)
  - [ ] Have rollback plan ready
  - [ ] Backup created
  - [ ] Slack notified of incoming deployment

- [ ] **Database Migration (if any)**
  - [ ] Tested on staging Supabase
  - [ ] Dry-run executed successfully
  - [ ] Backup snapshot created
  - [ ] RLS policies validated

- [ ] **Edge Functions (if changed)**
  - [ ] All functions tested locally
  - [ ] Function logs verified
  - [ ] Rate limiting configured
  - [ ] Error handling in place

- [ ] **During Deployment**
  - [ ] Monitor GitHub Actions workflow
  - [ ] Watch Vercel build logs for errors
  - [ ] Check Supabase migration status
  - [ ] Monitor error rates in Sentry

- [ ] **Post-Deployment (Immediately After)**
  - [ ] [ ] Production site loads without errors
  - [ ] [ ] No 500 errors in Sentry
  - [ ] [ ] Authentication working (test login)
  - [ ] [ ] Database queries responding normally
  - [ ] [ ] API endpoints responding (200 status)
  - [ ] [ ] Stripe webhooks processing
  - [ ] [ ] Email sending working (Resend)
  - [ ] [ ] PWA installable (check Web App Manifest)
  - [ ] [ ] Service worker updated
  - [ ] [ ] Analytics reporting data

- [ ] **Smoke Tests**
  - [ ] [ ] Visit homepage: loads in < 3s
  - [ ] [ ] Login with test account: works
  - [ ] [ ] Create test tank: saves to database
  - [ ] [ ] Upload tank photo: appears in storage
  - [ ] [ ] AI diagnosis: Claude API responding
  - [ ] [ ] Payment flow: Stripe checkout loads
  - [ ] [ ] PDF report: generates and downloads
  - [ ] [ ] Search equipment: returns results
  - [ ] [ ] Notifications: push notification works
  - [ ] [ ] Realtime: parameter update broadcasts

- [ ] **Monitoring (1 hour post-deploy)**
  - [ ] [ ] Error rate < 0.1%
  - [ ] [ ] API latency < 500ms (p95)
  - [ ] [ ] Database CPU < 70%
  - [ ] [ ] Supabase storage operations normal
  - [ ] [ ] Claude API calls succeeding (> 95%)
  - [ ] [ ] Stripe webhook processing successfully
  - [ ] [ ] No unusual traffic patterns
  - [ ] [ ] User reports (Slack) are positive

- [ ] **Cleanup**
  - [ ] [ ] Git tag release version: `git tag v1.2.3`
  - [ ] [ ] Create GitHub release with notes
  - [ ] [ ] Close related issues
  - [ ] [ ] Update internal documentation
  - [ ] [ ] Notify team/stakeholders of completion

### Smoke Test Script

**Create `scripts/smoke-tests.ts`:**

```typescript
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.SMOKE_TEST_URL || 'https://aquabotai.com';
const TEST_USER = process.env.SMOKE_TEST_USER || 'test@example.com';
const TEST_PASS = process.env.SMOKE_TEST_PASSWORD || '';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: String(error),
    });
    console.error(`✗ ${name}:`, error);
  }
}

async function smokeTests() {
  // Test 1: Homepage loads
  await test('Homepage loads', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  // Test 2: API health check
  await test('API health check', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (!data.healthy) throw new Error('Health check failed');
  });

  // Test 3: Auth login
  await test('Authentication login', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER, password: TEST_PASS }),
    });
    if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  });

  // Test 4: Database connectivity
  await test('Database connectivity', async () => {
    const res = await fetch(`${BASE_URL}/api/tanks`);
    if (!res.ok) throw new Error(`Tanks API failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid response format');
  });

  // Test 5: Claude API
  await test('Claude API integration', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });
    if (!res.ok) throw new Error(`Claude API failed: ${res.status}`);
  });

  // Print results
  console.log('\n' + '='.repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`Results: ${passed}/${total} passed`);

  if (passed === total) {
    console.log('✓ All smoke tests passed!');
    process.exit(0);
  } else {
    console.error('✗ Some tests failed!');
    process.exit(1);
  }
}

smokeTests();
```

**Run smoke tests:**

```bash
pnpm ts-node scripts/smoke-tests.ts
# Or in GitHub Actions
SMOKE_TEST_URL=https://aquabotai.com pnpm ts-node scripts/smoke-tests.ts
```

---

## Rollback Strategy

### Vercel Deployment Rollback

Vercel provides instant rollback to previous deployments (fastest option for frontend).

**Method 1: Vercel Dashboard (Fastest)**

1. Go to `Vercel Dashboard → aquabotai → Deployments`
2. Find the previous stable deployment
3. Click `•••` → `Promote to Production`
4. Confirm: "Rollback to deployment?"
5. Done in < 10 seconds

**Method 2: Vercel CLI**

```bash
# List recent deployments
vercel deployments --prod

# Rollback to specific deployment
vercel rollback <DEPLOYMENT_ID> --token=$VERCEL_TOKEN

# Example
vercel rollback dpl_xyz123 --token=veq_...
```

**Method 3: Git Revert (if needed to undo code)**

```bash
# Get commit SHA that caused issue
git log --oneline -5

# Revert the commit
git revert -n abc1234

# Push to main (triggers new deployment)
git push origin main

# This creates a new commit that undoes changes
```

**When to use Vercel rollback:**
- Frontend bugs introduced
- CSS/UI broken
- JavaScript errors on page load
- API route issues
- Quick recovery needed (< 5 min)

### Database Migration Rollback

#### Reversible Migrations

```bash
# Create rollback migration (opposite of changes)
supabase migration new rollback_add_new_feature

# Apply to staging first
supabase migration push --project-ref=aquabotai-staging

# Verify staging works
pnpm test:e2e

# Apply to production
supabase migration push --project-ref=aquabotai-prod
```

#### Irreversible Migrations (Data Loss)

**If data was corrupted or deleted:**

```bash
# Option 1: Restore from backup snapshot
# 1. Go to Supabase Dashboard → Backups
# 2. Click "Restore" on pre-deployment snapshot
# 3. Wait for restore (takes 5-30 min)
# 4. Verify data integrity
# 5. Redeploy app code

# Option 2: Manual data restoration
# 1. Query backup: SELECT * FROM backup_table WHERE ...
# 2. INSERT INTO live table: INSERT INTO users SELECT * FROM backup_table
# 3. Verify counts match
```

**Prevention steps:**
- Always create snapshots before irreversible migrations
- Test on staging with production data copy
- Use `--dry-run` flag before actual apply

### Edge Functions Rollback

```bash
# Option 1: Deploy previous function version
supabase functions deploy ai-diagnosis \
  --project-ref=aquabotai-prod \
  --version=<PREVIOUS_VERSION>

# Option 2: Redeploy from last known good code
git checkout HEAD~1 supabase/functions/ai-diagnosis/
supabase functions deploy ai-diagnosis --project-ref=aquabotai-prod

# Verify function is working
curl -X POST https://aquabotai-prod.supabase.co/functions/v1/ai-diagnosis \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### Feature Flags as Rollback Alternative

**Instead of deploying broken code and rolling back, use feature flags:**

```typescript
// lib/features.ts
export async function isFeatureEnabled(featureName: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('name', featureName)
    .single();
  return data?.enabled ?? false;
}

// pages/tanks/[id].tsx
if (await isFeatureEnabled('new-diagnosis-ui')) {
  return <NewDiagnosisUI />;
}
return <LegacyDiagnosisUI />;
```

**In database:**

```sql
insert into public.feature_flags (name, enabled) values
  ('new-diagnosis-ui', false),
  ('pro-equipment-search', false),
  ('realtime-parameters', true);
```

**To disable broken feature:**

```sql
update public.feature_flags
set enabled = false
where name = 'new-diagnosis-ui';
```

**PWA will auto-reload and disable feature.**

### Rollback Decision Matrix

| Issue | Severity | Best Solution | Time |
|-------|----------|---------------|------|
| Frontend crash (JS error) | Critical | Vercel rollback | < 1 min |
| Auth broken | Critical | Revert git commit + redeploy | 5 min |
| Database schema corrupted | Critical | Restore from snapshot | 30 min |
| Feature partially broken | High | Feature flag disable | < 1 min |
| API performance degraded | Medium | Scale up Supabase | 10 min |
| UI looks broken | Low | Deploy CSS fix | 5 min |
| Edge Function timeout | Medium | Optimize function + redeploy | 10 min |

### Post-Rollback Steps

1. **Investigate**
   - Check Sentry error logs
   - Review recent code changes
   - Check Git diff from last deploy
   - Look for database anomalies

2. **Communicate**
   - Slack: Notify team of rollback
   - Update status page (if public)
   - Email affected users (if critical)

3. **Document**
   - Create incident log entry
   - Record what went wrong
   - Note resolution steps
   - Update runbook

4. **Fix**
   - Create bugfix branch
   - Write tests that catch bug
   - Verify fix on staging
   - Deploy when ready

5. **Monitor**
   - Watch error rates for 1 hour
   - Check performance metrics
   - Verify all services healthy

---

## Scaling Considerations

### User Growth Scenarios

#### At 100 Users

**Architecture:**
- Single Supabase project (free or starter tier) ✓
- Vercel Hobby or Pro plan ✓
- Single Claude API account ✓
- Stripe test mode ✓

**Quotas:**
- Database: 500 MB ✓
- API calls: 60/min ✓
- Edge Functions: 1000 invocations/day ✓
- Storage: 1 GB ✓

**Monitoring:**
- Basic Sentry setup ✓
- Manual checks via dashboard ✓

**Cost:**
- Supabase: $0-20/month (free to starter)
- Vercel: $20/month
- Claude API: ~$10-50/month (depends on usage)
- Stripe: 2.9% + $0.30/transaction
- **Total: $50-100/month**

#### At 1,000 Users

**Needed upgrades:**

| Component | Current | Required | Reason |
|-----------|---------|----------|--------|
| **Supabase** | Starter | Pro ($25/month) | 8 GB DB, higher limits |
| **Vercel** | Pro | Pro ($20/month) | Concurrent functions |
| **Storage** | 1 GB | Increase to 10 GB | Tank photos + reports |
| **Backups** | Daily | Hourly | Data loss risk |
| **Monitoring** | Manual | Sentry + Uptime | Track errors + uptime |

**Action items:**
```bash
# Upgrade Supabase to Pro
# - Go to Supabase Dashboard → Settings → Billing
# - Switch to Pro plan
# - Verify new limits apply

# Scale database connection pool
# - Supabase Dashboard → Project Settings → Database
# - Increase connection limit to 100

# Set up Sentry for error tracking
npm install @sentry/nextjs

# Configure in next.config.js
withSentryConfig(nextConfig, {
  org: 'your-org',
  project: 'aquabotai',
})

# Set up UptimeRobot for monitoring
# - https://uptimerobot.com/
# - Monitor https://aquabotai.com/health endpoint
```

**Costs:**
- Supabase: $25/month (Pro)
- Vercel: $20/month
- Claude API: ~$50-150/month
- Stripe: 2.9% + $0.30/transaction
- Sentry: $10/month (paid)
- UptimeRobot: $10/month
- **Total: $150-250/month**

#### At 10,000 Users

**Critical upgrades:**

| Component | Action | Reason |
|-----------|--------|--------|
| **Supabase** | Business plan ($599/month) | 100 GB, advanced features |
| **Database** | Enable read replicas | Distribute read queries |
| **Caching** | Add Redis (Upstash) | Cache frequently accessed data |
| **CDN** | Vercel + Cloudflare | Edge caching for static assets |
| **Storage** | S3 integration | Move large files outside DB |
| **API** | Rate limiting | Prevent abuse |
| **Monitoring** | Datadog or New Relic | Advanced metrics + APM |

**Database optimization:**
```sql
-- Add read-only replica for analytics
-- Supabase Dashboard → Databases → Add Read Replica

-- Add indexes for common queries
create index idx_tanks_user_created
  on public.tanks(user_id, created_at desc);

create index idx_parameters_tank_timestamp
  on public.parameters(tank_id, recorded_at desc);

create index idx_diagnoses_tank_created
  on public.diagnoses(tank_id, created_at desc);

-- Archive old data to reduce table size
create table public.diagnoses_archived as
  select * from public.diagnoses
  where created_at < now() - interval '1 year';

delete from public.diagnoses
  where created_at < now() - interval '1 year';
```

**API rate limiting:**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple rate limiting middleware
const rateLimit = new Map<string, number[]>();

export function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }

  const times = rateLimit.get(ip)!.filter((t) => t > windowStart);
  rateLimit.set(ip, times);

  if (times.length > 100) {
    // 100 requests per minute
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  times.push(now);
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

**Caching strategy:**
```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

// Cache species list (changes rarely)
export const getSpecies = unstable_cache(
  async () => {
    const res = await fetch(`${API_URL}/species`);
    return res.json();
  },
  ['species'],
  { revalidate: 3600 } // 1 hour
);

// Cache user tanks (change frequently, but OK to be slightly stale)
export const getUserTanks = unstable_cache(
  async (userId: string) => {
    const supabase = createClient();
    return supabase.from('tanks').select('*').eq('user_id', userId);
  },
  ['user-tanks'],
  { revalidate: 300 } // 5 minutes
);
```

**Costs at 10K users:**
- Supabase Business: $599/month
- Vercel Pro: $20/month
- Claude API: ~$500-1000/month (depends on usage)
- Stripe: 2.9% + $0.30/transaction (can be 10K+/month in processing)
- Sentry: $50+/month
- Upstash Redis: $10-50/month
- Datadog/Monitoring: $100+/month
- **Total: $1300-2000+/month**

### Service-Specific Scaling Limits

#### Supabase Limits

| Tier | DB Size | Connections | API Calls/min | Storage | Cost |
|------|---------|-------------|---------------|---------|------|
| Free | 500 MB | 10 | 60 | 1 GB | $0 |
| Pro | 8 GB | 60 | 600 | 100 GB | $25 |
| Business | 100 GB | 200 | 6000 | 1 TB | $599 |
| Enterprise | Custom | Custom | Custom | Custom | Custom |

**When to upgrade:**
- Hit 80% of database size limit
- See "too many connections" errors
- API rate limiting (429 errors)
- Need hourly backups (Pro → Business)

#### Anthropic Claude API Limits

| Limit | Default | Cost |
|-------|---------|------|
| Requests per minute (RPM) | 50 | Depends on plan |
| Tokens per minute (TPM) | 10,000 | ~0.003-0.015 per 1K tokens |
| Max tokens per request | 200K | Included in TPM |
| Batch processing | Not available | Available on Enterprise |

**Optimization:**
```typescript
// Cache Claude responses for common questions
const cache = new Map<string, string>();

async function askClaude(question: string) {
  if (cache.has(question)) {
    return cache.get(question);
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4.5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: question }],
  });

  const answer = response.content[0].text;
  cache.set(question, answer);
  return answer;
}
```

**When to contact Anthropic:**
- Hitting rate limits consistently
- Need to process 10K+/month messages
- Want volume discount

#### Stripe Limits

| Feature | Limit | Action |
|---------|-------|--------|
| Webhook retries | 5 days | Implement idempotency |
| API rate limit | 100 req/s | Use rate limiting SDK |
| Concurrent API calls | Unlimited | Queue requests if needed |
| Transaction size | Unlimited | N/A |

**Webhook reliability:**
```typescript
// Ensure webhook is idempotent
export async function POST(req: Request) {
  const event = await stripe.webhooks.constructEvent(
    req.body,
    req.headers.get('stripe-signature')!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  // Store idempotency key in database
  const { data: existing } = await supabase
    .from('webhook_log')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single();

  if (existing) {
    // Already processed
    return NextResponse.json({ received: true });
  }

  // Process webhook
  await handleStripeEvent(event);

  // Log processed event
  await supabase.from('webhook_log').insert({
    stripe_event_id: event.id,
    processed_at: new Date(),
  });

  return NextResponse.json({ received: true });
}
```

#### Vercel Scaling

| Tier | Max Functions | Max Duration | Max Response Size | Cost |
|------|---------------|--------------|-------------------|------|
| Hobby | 1 concurrent | 10s | 4.5 MB | $0 |
| Pro | 12 concurrent | 60s | 4.5 MB | $20 |
| Enterprise | 1000s | Custom | Custom | Custom |

**When to upgrade:**
- See "max duration exceeded" errors
- Seeing 503 Service Unavailable
- Need custom domains
- Need team collaboration features

### Database Connection Pool Optimization

```sql
-- Monitor current connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- Increase pool size in Supabase
-- Settings → Database → Connection Limit: change to 100-150

-- For long-running queries, use connection pooling
-- In app code:
const { createPool } = require('pg');
const pool = createPool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Domain & SSL

### Custom Domain Setup

#### Step 1: Purchase Domain

```bash
# Option A: Via Vercel Marketplace
# 1. Vercel Dashboard → Settings → Domains
# 2. Click "Add" → "Buy new domain"
# 3. Register aquabotai.com ($12/year)
# 4. Automatically connected to Vercel project

# Option B: Register elsewhere (GoDaddy, Namecheap, etc.)
# Then connect to Vercel (see below)
```

#### Step 2: Connect to Vercel

**If domain registered elsewhere:**

```
1. Vercel Dashboard → aquabotai → Settings → Domains
2. Click "Add Custom Domain"
3. Enter: aquabotai.com
4. Choose: "Using external nameservers"
5. Copy Vercel nameservers shown:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
6. Go to domain registrar (GoDaddy, etc.)
7. Update nameservers to Vercel nameservers
8. Wait 24-48 hours for DNS propagation
9. Verify in Vercel: Status should show "Valid Configuration"
```

#### Step 3: Configure DNS Records

**In Vercel Dashboard → Domains → aquabotai.com:**

```
Record Type | Name | Value | TTL
-----------|------|-------|-----
A          | @    | 76.76.19.165 | 3600
CNAME      | www  | cname.vercel-dns.com | 3600
CNAME      | api  | cname.vercel-dns.com | 3600
TXT        | @    | v=spf1 include:sendgrid.net ~all | 3600
```

### SSL Certificate Management

**Vercel automatically provisions SSL certificates (Let's Encrypt) for all domains:**

```
✓ Automatic provisioning when domain added
✓ Auto-renewal 30 days before expiration
✓ No manual action needed
✓ Supports HTTPS, HTTP/2, TLS 1.3

Verify: https://aquabotai.com (should be secure)
```

**Check certificate details:**

```bash
# View certificate info
openssl s_client -connect aquabotai.com:443

# Or use command:
curl -I https://aquabotai.com
# Look for "strict-transport-security" header
```

### DNS Configuration for External Services

#### Resend Email Domain Verification

```bash
# 1. In Resend Dashboard → Domains
# 2. Add domain: aquabotai.com
# 3. Resend provides DNS records to add:

# TXT record (for verification)
Name: @
Value: resend_verification_code=...
TTL: 3600

# CNAME record (for sending)
Name: default._domainkey
Value: default.aquabotai.resend.dev.
TTL: 3600

# 4. Add records in your DNS provider
# 5. Wait for verification (< 1 hour)
# 6. Resend automatically configures SPF/DKIM/DMARC
```

**Verify email domain:**

```bash
# Send test email
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer re_..." \
  -H "Content-Type: application/json" \
  -d '{
    "from": "hello@aquabotai.com",
    "to": "your-email@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

#### Stripe Webhook Domain

```bash
# 1. Stripe Dashboard → Webhooks
# 2. Add endpoint: https://aquabotai.com/api/webhooks/stripe
# 3. Stripe sends POST requests to this URL
# 4. No DNS configuration needed (HTTPS is automatic)
```

### HTTPS & Security Headers

**Configure in `vercel.json` or `next.config.js`:**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ]
}
```

### DNS Propagation Check

```bash
# Check DNS records globally
nslookup aquabotai.com
dig aquabotai.com
host aquabotai.com

# Online tools:
# - https://dnschecker.org/
# - https://mxtoolbox.com/
# - https://tools.dns-lookup.com/

# Expected results:
# aquabotai.com A record pointing to Vercel IP
# www CNAME pointing to vercel-dns.com
```

---

## Service Worker & PWA Deployment

### Service Worker Versioning

**File: `public/sw.js`**

```javascript
// Service Worker with versioning
const CACHE_NAME = 'aquabotai-v1.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/offline.html',
];

// Install event: cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Activate new service worker immediately
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients
  return self.clients.claim();
});

// Fetch event: network-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache on network failure
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page if available
          if (request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Message handling for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

### Cache Busting Strategy

**Next.js automatically handles this, but ensure:**

1. **Build hashes all assets**
   ```bash
   pnpm build
   # Generates: .next/static/chunks/_app-abc123def456.js
   ```

2. **Update cache version on deploy**
   ```javascript
   // In sw.js, increment version
   const CACHE_NAME = 'aquabotai-v1.0.1'; // Changed
   ```

3. **Include in GitHub Actions**
   ```yaml
   - name: Update Service Worker Version
     run: |
       VERSION=$(jq -r .version package.json)
       sed -i "s/aquabotai-v.*/aquabotai-v${VERSION}/" public/sw.js
   ```

### PWA Manifest & Update Notification

**File: `public/manifest.json`**

```json
{
  "name": "AquaBotAI - Aquarium Management",
  "short_name": "AquaBotAI",
  "description": "AI-powered aquarium tank management and water quality diagnostics",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#1f2937",
  "background_color": "#ffffff",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-1.png",
      "sizes": "540x720",
      "type": "image/png"
    }
  ],
  "categories": ["productivity", "aquarium"],
  "screenshots": []
}
```

### Update Notification to Users

**File: `lib/pwa-update.ts`**

```typescript
export function setupPWAUpdateListener() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Service worker has been updated
      showUpdateNotification();
    });

    // Check for updates every 5 minutes
    setInterval(() => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => {
          reg.update();
        });
      });
    }, 5 * 60 * 1000);
  }
}

function showUpdateNotification() {
  // Show toast/dialog to user
  const message =
    'New version available! Refresh to update.';

  // Option 1: Simple toast
  toast.info(message, {
    action: {
      label: 'Refresh',
      onClick: () => {
        window.location.reload();
      },
    },
  });

  // Option 2: Custom component
  showUpdateDialog({
    title: 'Update Available',
    description: 'A new version of AquaBotAI is ready!',
    onUpdate: () => {
      // Claim all clients and reload
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((reg) => {
            reg.unregister();
          });
        });
      window.location.reload();
    },
  });
}
```

**Use in app:**

```typescript
// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { setupPWAUpdateListener } from '@/lib/pwa-update';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    setupPWAUpdateListener();
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Offline-First Deployment Concerns

**During deployment, service worker is still active:**

```javascript
// Prevent cache serving stale data during deploy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Always fetch critical routes (bypass cache)
  const criticalRoutes = ['/api/', '/auth/', '/webhooks/'];
  if (criticalRoutes.some((route) => request.url.includes(route))) {
    return event.respondWith(fetch(request));
  }

  // For static assets, use cache-first
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(caches.match(request).then((response) => response || fetch(request)));
  }

  // For documents, use network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, response.clone());
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});
```

### PWA Deployment Checklist

- [ ] Service Worker script updated with new version
- [ ] Cache names incremented
- [ ] Manifest.json includes all icons (192x192, 512x512, maskable)
- [ ] Update notification tested in browser
- [ ] Offline mode tested (disable network)
- [ ] App installable: "Install app" prompt appears
- [ ] Web app title displays correctly on home screen
- [ ] Icons display correctly (no broken images)
- [ ] Push notifications working (if enabled)
- [ ] Realtime updates working offline (sync on reconnect)
- [ ] Service Worker unregisters old versions
- [ ] No console errors in DevTools

---

## Quick Reference: Pre-Deploy Commands

```bash
# Local Development
supabase start          # Start local Supabase
pnpm dev              # Start Next.js dev server

# Before committing
pnpm lint             # Fix linting issues
pnpm type-check       # Verify TypeScript
pnpm test:unit        # Run unit tests
pnpm test:e2e         # Run E2E tests

# Before pushing to PR
git add .
git commit -m "feat: description of changes"
git push origin feature-branch

# Create PR on GitHub

# After PR approval, merge to main
# (GitHub Actions will deploy automatically)

# Monitor production
# - Vercel Dashboard: https://vercel.com/dashboard
# - Supabase Dashboard: https://app.supabase.com
# - Sentry: https://sentry.io/organizations/aquabotai/
# - Stripe: https://dashboard.stripe.com/
```

---

## Contact & Escalation

- **Vercel Issues:** https://vercel.com/support
- **Supabase Issues:** https://supabase.com/support
- **Anthropic Issues:** https://support.anthropic.com
- **Stripe Issues:** https://support.stripe.com
- **Sentry Issues:** https://sentry.io/support/

---

**Document Status:** FINAL
**Next Review:** After first production deployment
**Maintainer:** Solo Developer
