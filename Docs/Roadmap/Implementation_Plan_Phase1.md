# AquaBotAI Implementation Plan — Phase 1 Foundation

**Document Created:** February 7, 2026
**MVP Launch Target:** Week 14 (Late May 2026)
**Solo Developer Project**

---

## Overview

This document provides a week-by-week implementation plan for Phase 1 (Foundation & Core MVP), covering Weeks 1-10. It translates the Product Roadmap into actionable development tasks with specific deliverables, dependencies, and verification criteria.

---

## Current State

| Item | Status |
|------|--------|
| Documentation | ✅ Complete (16 specs, PRD, roadmap, ship readiness) |
| Source Code | ❌ Not started |
| GitHub Repository | ✅ Connected (`siriz0408/AquaBotIO`) |
| Supabase Project | ✅ Connected (`mtwyezkbmyrgxqmskblu`) |
| Vercel Project | ⏳ Pending |
| Stripe Account | ⏳ Pending |

---

## Phase 1 Timeline (Weeks 1-10)

```
Week 1-2     Week 2-4     Week 4-5     Week 5-8     Week 8-10
   │            │            │            │            │
Scaffolding → Auth ────→ Tanks ────→ AI Chat ────→ Params/Species
   │                         │            │
   └─────────────────────────┴→ Billing ──┘
                              (parallel)
```

---

## Week 1: Project Scaffolding & Infrastructure (Days 1-5)

### Goals
- Set up development environment
- Initialize Next.js project with TypeScript
- Create Supabase database schema (Phase 1 tables)
- Configure Vercel deployment pipeline

### Day 1: Development Environment

**Tasks:**
- [ ] Initialize Next.js 14 project with TypeScript
  ```bash
  npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
  ```
- [ ] Install core dependencies
  ```bash
  npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
  npm install shadcn/ui class-variance-authority clsx tailwind-merge
  npm install lucide-react
  npm install -D @types/node
  ```
- [ ] Configure Tailwind with shadcn/ui
- [ ] Set up path aliases in `tsconfig.json`
- [ ] Create environment variables structure (`.env.local.example`)

**Deliverable:** Next.js app runs locally with Tailwind + shadcn/ui

**Verification:**
```bash
npm run dev
# App loads at localhost:3000 with placeholder page
```

### Day 2: Supabase Database Schema (Phase 1)

**Tasks:**
- [ ] Create Phase 1 migration for core tables:
  - `users` (extends auth.users)
  - `tanks`
  - `water_parameters`
  - `species` (seed structure only)
  - `livestock`
  - `maintenance_tasks`
  - `ai_messages`
  - `subscriptions`
  - `audit_logs`
- [ ] Apply RLS policies for user data isolation
- [ ] Create required indexes
- [ ] Run migration against Supabase project

**Deliverable:** Database schema deployed with RLS enabled

**Verification:**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

**Reference:** `00_Data_Model_Schema.md`

### Day 3: Vercel Deployment Pipeline

**Tasks:**
- [ ] Create Vercel project and link repository
- [ ] Configure environment variables in Vercel
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set up preview deployments for PRs
- [ ] Configure production domain (staging first)
- [ ] Verify build and deploy pipeline

**Deliverable:** Automatic deployments on push to main

**Verification:**
```bash
git push origin main
# Verify deployment at https://aquabotai-*.vercel.app
```

### Day 4: PWA Foundation

**Tasks:**
- [ ] Create `manifest.json` with app metadata
- [ ] Create service worker shell (`/public/sw.js`)
- [ ] Add PWA meta tags to `layout.tsx`
- [ ] Configure offline fallback page
- [ ] Add install prompt component

**Deliverable:** App installable as PWA on mobile

**Verification:**
- Lighthouse PWA audit score > 80
- App installable on Chrome Android
- App installable on Safari iOS

**Reference:** `08_PWA_Shell_Spec.md`

### Day 5: Project Structure & Utilities

**Tasks:**
- [ ] Create folder structure:
  ```
  src/
  ├── app/                 # Next.js App Router
  ├── components/          # Reusable UI components
  │   ├── ui/              # shadcn/ui components
  │   └── features/        # Feature-specific components
  ├── lib/                 # Utilities
  │   ├── supabase/        # Supabase client + helpers
  │   ├── utils/           # General utilities
  │   └── hooks/           # Custom React hooks
  ├── types/               # TypeScript types
  └── styles/              # Global styles
  ```
- [ ] Create Supabase client utilities (browser + server)
- [ ] Create TypeScript types from database schema
- [ ] Set up error boundary component
- [ ] Create loading skeleton components

**Deliverable:** Clean project structure with typed Supabase client

**Week 1 Exit Criteria:**
- [ ] Next.js app deploys to Vercel
- [ ] Supabase schema deployed with 9 tables
- [ ] PWA installable on mobile
- [ ] TypeScript types generated from schema

---

## Week 2-3: Authentication & Onboarding (Days 6-15)

### Goals
- Implement email/password + Google OAuth + magic link auth
- Create guided onboarding flow
- Add session management and rate limiting

### Day 6-7: Supabase Auth Configuration

**Tasks:**
- [ ] Configure Supabase Auth providers:
  - Email/password
  - Google OAuth (create GCP OAuth credentials)
  - Magic link
- [ ] Set up auth redirect URLs in Supabase dashboard
- [ ] Configure email templates (confirmation, magic link)
- [ ] Set password requirements (min 8 chars, 1 number)

**Deliverable:** Auth providers configured and tested in Supabase

### Day 8-9: Auth UI Components

**Tasks:**
- [ ] Create auth pages:
  - `/login` - Email/password + Google OAuth + magic link
  - `/signup` - Registration form
  - `/auth/callback` - OAuth callback handler
  - `/auth/confirm` - Email confirmation page
- [ ] Create auth context provider
- [ ] Implement session refresh logic (1hr access / 7-day refresh)
- [ ] Add protected route wrapper

**Deliverable:** Users can sign up, log in, and maintain sessions

**Verification:**
```
1. Sign up with email → Receive confirmation → Login works
2. Sign up with Google OAuth → Redirects back → Session created
3. Request magic link → Receive email → Click link → Logged in
4. Session persists across page refreshes
```

### Day 10-11: Onboarding Flow

**Tasks:**
- [ ] Create onboarding wizard component:
  - Step 1: Welcome + name capture
  - Step 2: Tank type selection (freshwater/saltwater/pond)
  - Step 3: Tank name + volume input
  - Step 4: First AI chat message (guided)
  - Step 5: Completion celebration
- [ ] Store onboarding progress in user profile
- [ ] Add skip option (but track for analytics)
- [ ] Create onboarding progress indicator

**Deliverable:** New users complete 5-step onboarding

**Reference:** `06_Authentication_Onboarding_Spec.md`

### Day 12-13: Rate Limiting & Security

**Tasks:**
- [ ] Implement rate limiting:
  - 5 failed login attempts → 15-min lockout
  - 10 requests/second per IP
- [ ] Add CSRF protection
- [ ] Configure secure cookie settings
- [ ] Add auth error handling (user-friendly messages)
- [ ] Create logout functionality

**Deliverable:** Auth system hardened against abuse

### Day 14-15: User Profile & Settings

**Tasks:**
- [ ] Create user profile page (`/settings/profile`)
- [ ] Add unit preference toggles (imperial/metric, °F/°C)
- [ ] Add notification preferences
- [ ] Create account deletion flow (with confirmation)
- [ ] Add email change flow (with verification)

**Deliverable:** Users can manage profile and preferences

**Week 2-3 Exit Criteria:**
- [ ] Email/password + Google OAuth + magic link all work
- [ ] Onboarding completion rate > 70% (track metric)
- [ ] Time to first value < 10 minutes
- [ ] Rate limiting active

---

## Week 4-5: Tank Profile Management (Days 16-25)

### Goals
- Implement tank CRUD operations
- Add photo upload to Supabase Storage
- Enforce tier-based tank limits

### Day 16-17: Tank CRUD Operations

**Tasks:**
- [ ] Create tank pages:
  - `/tanks` - Tank list/grid view
  - `/tanks/new` - Create tank form
  - `/tanks/[id]` - Tank detail view
  - `/tanks/[id]/edit` - Edit tank form
- [ ] Implement tank creation with fields:
  - Name, type, volume, dimensions, substrate, notes
- [ ] Add form validation (Zod or similar)
- [ ] Create tank card component

**Deliverable:** Users can create, view, edit tanks

### Day 18-19: Photo Upload

**Tasks:**
- [ ] Configure Supabase Storage bucket (`tank-photos`)
- [ ] Set storage RLS policies (users access own photos)
- [ ] Create photo upload component:
  - File type validation (JPEG, PNG, WebP)
  - Size limit (5MB max)
  - Client-side compression (optional)
- [ ] Display tank photos in UI
- [ ] Add photo deletion

**Deliverable:** Users can upload and view tank photos

### Day 20-21: Tier Enforcement

**Tasks:**
- [ ] Create tier enforcement middleware
- [ ] Implement tank limits by tier:
  - Free: 1 tank
  - Starter: 1 tank
  - Plus: 5 tanks
  - Pro: Unlimited
- [ ] Add upgrade prompts when limit reached
- [ ] Create "upgrade to add more tanks" UI

**Deliverable:** Tank limits enforced based on subscription tier

### Day 22-23: Tank Switching & Navigation

**Tasks:**
- [ ] Create tank switcher component (header dropdown)
- [ ] Implement "active tank" context
- [ ] Add one-click tank switching
- [ ] Store last viewed tank in local storage
- [ ] Update all tank-dependent pages to use context

**Deliverable:** Users can quickly switch between tanks

### Day 24-25: Soft Delete & Undo

**Tasks:**
- [ ] Implement soft-delete for tanks (`deleted_at` column)
- [ ] Add 30-second undo toast after delete
- [ ] Create retention cleanup job (90 days)
- [ ] Add "deleted tanks" view for recovery

**Deliverable:** Accidental deletes recoverable within 30 seconds

**Week 4-5 Exit Criteria:**
- [ ] Tank CRUD fully functional
- [ ] Photo upload to Supabase Storage works
- [ ] Tier limits enforced
- [ ] Soft-delete with undo working

**Reference:** `02_Tank_Profile_Management_Spec.md`

---

## Week 5-8: AI Chat Engine + Billing (Parallel Tracks)

### Track A: AI Chat Engine (3 weeks)

#### Week 5-6: Core Chat Implementation

**Tasks:**
- [ ] Create Supabase Edge Function for Anthropic API
- [ ] Implement chat API route (`/api/chat`)
- [ ] Create chat UI components:
  - Message list
  - Input field with send button
  - Loading indicator
  - Error handling
- [ ] Store conversation history in `ai_messages` table
- [ ] Implement per-tank conversation isolation

**Deliverable:** Basic chat with Claude Sonnet 4.5 works

#### Week 6-7: Context Injection & System Prompts

**Tasks:**
- [ ] Build dynamic system prompt generator
- [ ] Inject tank context:
  - Tank profile (type, volume, age)
  - Current parameters (latest values)
  - Livestock list
  - Equipment list
  - Recent maintenance
- [ ] Implement skill-level adaptation (beginner/intermediate/advanced)
- [ ] Add rolling context summarization at 8K tokens

**Deliverable:** AI responses are tank-aware and personalized

#### Week 7-8: Action Execution & Tier Limits

**Tasks:**
- [ ] Implement natural language action execution:
  - "Add 5 neon tetras" → Creates livestock entry
  - "Schedule water change for Saturday" → Creates task
  - "Log pH 7.2" → Creates parameter entry
- [ ] Add action confirmation UI
- [ ] Implement daily message limits by tier:
  - Free: 10/day
  - Starter: 100/day
  - Plus: 200/day
  - Pro: Unlimited
- [ ] Create usage tracking in `ai_usage` table
- [ ] Add limit reached message with upgrade prompt

**Deliverable:** AI can execute actions, limits enforced

**Reference:** `01_AI_Chat_Engine_Spec.md`

---

### Track B: Subscription & Billing (2 weeks, parallel)

#### Week 5-6: Stripe Integration

**Tasks:**
- [ ] Create Stripe account and products:
  - Starter: $3.99/month
  - Plus: $7.99/month
  - Pro: $14.99/month
- [ ] Set up Stripe Checkout session API
- [ ] Implement Customer Portal for subscription management
- [ ] Create billing pages:
  - `/pricing` - Plan comparison
  - `/subscribe/[plan]` - Checkout redirect
  - `/billing` - Manage subscription

**Deliverable:** Users can subscribe via Stripe Checkout

#### Week 6-8: Webhooks & Trial Logic

**Tasks:**
- [ ] Create webhook handler (`/api/webhooks/stripe`)
- [ ] Handle webhook events:
  - `checkout.session.completed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] Implement 14-day free trial (Pro access, no CC required)
- [ ] Add 7-day grace period for failed payments
- [ ] Create trial expiration warnings (3-day, 1-day)
- [ ] Sync subscription state to `subscriptions` table

**Deliverable:** Full billing lifecycle with trial and grace period

**Reference:** `07_Subscription_Billing_Spec.md`

---

## Week 8-10: Integration & Stabilization

### Week 8-9: Integration Testing

**Tasks:**
- [ ] Test all features end-to-end:
  - Signup → Onboarding → Tank creation → AI chat → Billing
- [ ] Fix integration issues
- [ ] Add error monitoring (Sentry)
- [ ] Implement comprehensive logging

### Week 9-10: Performance & Polish

**Tasks:**
- [ ] Optimize AI response latency (target: < 3 sec P95)
- [ ] Add loading states to all async operations
- [ ] Implement proper error messages
- [ ] Mobile responsiveness audit
- [ ] Accessibility audit (WCAG 2.1 AA)

**Week 8-10 Exit Criteria:**
- [ ] Full user journey works end-to-end
- [ ] AI responses < 3 sec P95
- [ ] Billing fully functional with trial
- [ ] No critical bugs

---

## Phase 1 Complete Checklist

### Core Features
- [ ] User authentication (email + OAuth + magic link)
- [ ] Guided onboarding flow
- [ ] Tank profile CRUD with photos
- [ ] AI chat with tank context
- [ ] Subscription billing with 14-day trial

### Infrastructure
- [ ] Database schema deployed with RLS
- [ ] Vercel CI/CD pipeline
- [ ] PWA installable
- [ ] Error monitoring active

### Performance
- [ ] AI latency < 3 seconds (P95)
- [ ] Page load < 2 seconds
- [ ] Lighthouse score > 90

### Security
- [ ] Rate limiting active
- [ ] RLS policies verified
- [ ] Auth hardened

---

## Next: Phase 2 (Weeks 10-14)

After Phase 1, proceed to:
- Water Parameters & Analysis (2 weeks)
- Species Database & Livestock (2.5 weeks)
- Maintenance Scheduling & Push (2 weeks)
- Admin Portal v1 (1 week)

**→ MVP Public Launch: Week 14 (Late May 2026)**

---

## References

- `00_Data_Model_Schema.md` — Database schema
- `01_AI_Chat_Engine_Spec.md` — AI implementation details
- `02_Tank_Profile_Management_Spec.md` — Tank features
- `06_Authentication_Onboarding_Spec.md` — Auth + onboarding
- `07_Subscription_Billing_Spec.md` — Billing details
- `08_PWA_Shell_Spec.md` — PWA requirements
- `12_API_Integration_Spec.md` — Edge Function specs

---

*Document Version: 1.0*
*Last Updated: February 7, 2026*
