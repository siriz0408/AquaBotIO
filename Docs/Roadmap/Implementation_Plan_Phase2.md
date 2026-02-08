# AquaBotAI Implementation Plan — Phase 2 MVP Launch

**Document Created:** February 7, 2026
**MVP Launch Target:** Week 14 (Late May 2026)
**Phase 2 Duration:** Weeks 10-14

---

## Overview

Phase 2 completes MVP features and prepares for public launch. This phase covers Water Parameters, Species Database, Maintenance Scheduling, and Admin Portal v1, culminating in the Week 14 launch.

---

## Phase 2 Dependencies

**Prerequisite (from Phase 1):**
- ✅ Authentication & Onboarding complete
- ✅ Tank Profile Management complete
- ✅ AI Chat Engine operational
- ✅ Subscription & Billing live

**Phase 2 builds on:**
- Tank profiles → Water parameters, Species, Maintenance
- AI Chat → Parameter analysis, Species compatibility, Task suggestions
- Billing → Tier enforcement across new features

---

## Week 10-11: Water Parameters & Analysis (Days 46-55)

### Goals
- Implement parameter logging for all water chemistry values
- Create interactive dashboards with Recharts
- Add AI-powered trend detection

### Day 46-47: Parameter Entry Form

**Tasks:**
- [ ] Create parameter entry page (`/tanks/[id]/parameters/new`)
- [ ] Build parameter form with all fields:

  **Freshwater:**
  - pH (6.0-9.0)
  - Ammonia (0-8 ppm)
  - Nitrite (0-5 ppm)
  - Nitrate (0-200 ppm)
  - Temperature (°F/°C)
  - GH (0-30 dGH)
  - KH (0-20 dKH)

  **Saltwater (additional):**
  - Salinity (1.020-1.030)
  - Calcium (350-500 ppm)
  - Alkalinity (7-12 dKH)
  - Magnesium (1200-1400 ppm)
  - Phosphate (0-0.25 ppm)

- [ ] Add quick-entry mode (most common params only)
- [ ] Implement form validation with realistic ranges
- [ ] Store in `water_parameters` table with timestamp

**Deliverable:** Users can log water parameters

### Day 48-49: Parameter History & Charts

**Tasks:**
- [ ] Create parameter history page (`/tanks/[id]/parameters`)
- [ ] Implement Recharts line graphs:
  - 7-day view (default)
  - 30-day view
  - 90-day view
- [ ] Add zoom and pan functionality
- [ ] Create parameter-specific color coding:
  - Green: Safe zone
  - Yellow: Warning zone
  - Red: Danger zone
- [ ] Display safe zones based on tank type + livestock

**Deliverable:** Interactive parameter charts with time range selection

### Day 50-51: Safe Zones & Alerts

**Tasks:**
- [ ] Create `safe_zones` table/view based on livestock requirements
- [ ] Calculate safe ranges from species in tank
- [ ] Implement alert triggers:
  - Parameter outside safe zone
  - Significant trend detected (>20% change in 7 days)
  - Missing readings (>7 days)
- [ ] Add in-app alert badges
- [ ] Create AI proactive alerts in chat

**Deliverable:** Users alerted when parameters outside safe zones

### Day 52-53: AI Trend Detection

**Tasks:**
- [ ] Build AI prompt for parameter trend analysis
- [ ] Inject parameter history into chat context
- [ ] Implement trend detection logic:
  - Rising/falling trends
  - Cyclical patterns (tank cycling)
  - Correlation detection (e.g., pH-KH relationship)
- [ ] Create AI-suggested actions based on trends
- [ ] Add "Analyze my parameters" quick action in chat

**Deliverable:** AI provides proactive parameter insights

### Day 54-55: Unit Preferences & Polish

**Tasks:**
- [ ] Implement unit conversion (°F/°C, ppm/mg/L)
- [ ] Store user preference in profile
- [ ] Apply preference to all displays
- [ ] Add parameter entry from AI chat ("Log pH 7.2")
- [ ] Create parameter summary card on tank detail page

**Deliverable:** Full parameter tracking with user preferences

**Week 10-11 Exit Criteria:**
- [ ] Parameter entry works for all water chemistry values
- [ ] Charts render in < 2 seconds for 90 days of data
- [ ] AI can analyze parameter trends
- [ ] Safe zone alerts trigger correctly

**Reference:** `03_Water_Parameters_Analysis_Spec.md`

---

## Week 11-13: Species Database & Livestock (Days 56-68)

### Goals
- Seed species database with 200+ species for MVP
- Implement species search and detail views
- Enable livestock tracking per tank with AI compatibility

### Day 56-57: Species Data Seeding

**Tasks:**
- [ ] Prepare species seed data (start with top 200):
  - 100 freshwater species
  - 50 saltwater species
  - 50 invertebrates/plants
- [ ] Create seed script with fields:
  - Common name, scientific name
  - Care level, temperament
  - Temperature range, pH range
  - Max size, minimum tank size
  - Diet, compatibility notes
  - Photo URL (placeholder initially)
- [ ] Run seed against Supabase
- [ ] Create GIN index for full-text search

**Deliverable:** 200+ species searchable in database

**Note:** Species curation is a major effort. Use AI to help generate initial data from FishBase. Expand to 800+ post-MVP.

### Day 58-59: Species Search & Browse

**Tasks:**
- [ ] Create species pages:
  - `/species` - Browse/search page
  - `/species/[id]` - Detail page
- [ ] Implement search functionality:
  - Full-text search on name
  - Filter by type (freshwater/saltwater/invertebrate)
  - Filter by care level
  - Filter by tank size requirements
- [ ] Create species card component
- [ ] Add pagination (50 per page)

**Deliverable:** Users can search and browse species

### Day 60-61: Species Detail Page

**Tasks:**
- [ ] Build species detail page with:
  - Hero image
  - Care requirements summary
  - Parameter ranges (pH, temp, etc.)
  - Tank size requirements
  - Diet and feeding info
  - Temperament and compatibility notes
- [ ] Add "Add to Tank" button
- [ ] Show tanks this species is compatible with
- [ ] Create related species section

**Deliverable:** Rich species information available

### Day 62-63: Livestock Tracking

**Tasks:**
- [ ] Create livestock pages:
  - `/tanks/[id]/livestock` - List view
  - Add modal for new livestock
- [ ] Implement livestock tracking:
  - Species selection (from database)
  - Quantity
  - Date added
  - Optional nickname
  - Optional notes
- [ ] Store in `livestock` table
- [ ] Show livestock on tank detail page
- [ ] Implement removal (soft-delete, retain for history)

**Deliverable:** Users can track livestock in each tank

### Day 64-65: AI Compatibility Checking

**Tasks:**
- [ ] Build compatibility checking logic:
  - Temperature overlap
  - pH overlap
  - Temperament conflicts (aggressive vs peaceful)
  - Size mismatches (predator/prey)
  - Tank size requirements
- [ ] Trigger check on every livestock addition
- [ ] Create compatibility result UI:
  - ✅ Compatible
  - ⚠️ Caution (with reason)
  - ❌ Incompatible (with reason)
- [ ] Add AI enhancement for nuanced compatibility
- [ ] Store check results in `compatibility_checks` table

**Deliverable:** AI warns before incompatible livestock additions

### Day 66-68: AI Stocking Recommendations

**Tasks:**
- [ ] Build AI stocking advisor:
  - "What fish should I add to my tank?"
  - Consider tank size, current livestock, parameters
  - Generate 3-5 compatible species suggestions
- [ ] Add "Get stocking ideas" quick action
- [ ] Create stocking recommendation card in chat
- [ ] Add species card with "Add to tank" action

**Deliverable:** AI can recommend compatible species

**Week 11-13 Exit Criteria:**
- [ ] 200+ species searchable
- [ ] Livestock tracking per tank
- [ ] AI compatibility checking on every addition
- [ ] AI stocking recommendations working

**Reference:** `04_Species_Database_Livestock_Spec.md`

---

## Week 12-14: Maintenance Scheduling & Push Notifications (Days 69-80)

### Goals
- Implement task CRUD with recurring schedules
- Enable push notifications via Web Push API
- Add AI-suggested maintenance schedules

### Day 69-70: Maintenance Task CRUD

**Tasks:**
- [ ] Create maintenance pages:
  - `/tanks/[id]/maintenance` - Task list
  - Add/edit modals
- [ ] Implement task types:
  - Water change
  - Filter cleaning
  - Feeding
  - Dosing
  - Equipment maintenance
  - Water testing
  - Custom
- [ ] Add frequency options:
  - One-time
  - Daily
  - Weekly
  - Biweekly
  - Monthly
  - Custom interval
- [ ] Store in `maintenance_tasks` table

**Deliverable:** Users can create and manage maintenance tasks

### Day 71-72: Task Completion & History

**Tasks:**
- [ ] Add task completion button
- [ ] Log completions in `maintenance_logs` table:
  - Timestamp
  - Optional notes
  - Optional photo
- [ ] Show completion history
- [ ] Calculate next due date after completion
- [ ] Add streak tracking (consecutive on-time completions)
- [ ] Create completion calendar view

**Deliverable:** Task completion tracking with history

### Day 73-74: Push Notification Setup

**Tasks:**
- [ ] Create VAPID keys for Web Push
- [ ] Build push subscription flow:
  - Permission request UI
  - Store subscription in `push_subscriptions` table
- [ ] Create push notification service worker handler
- [ ] Build notification API endpoint
- [ ] Create notification preference UI:
  - Day before
  - Morning of
  - 1 hour before
  - Custom time

**Deliverable:** Push notification infrastructure ready

**Reference:** `08_PWA_Shell_Spec.md` (Push section)

### Day 75-76: Notification Scheduling

**Tasks:**
- [ ] Create Supabase cron job (every 15 minutes)
- [ ] Build notification scheduling logic:
  - Query due tasks for all users
  - Check user notification preferences
  - Send push if opted-in
  - Queue email fallback if push fails
- [ ] Implement notification batching (combine multiple due tasks)
- [ ] Add notification history logging
- [ ] Create email fallback via Resend

**Deliverable:** Automatic reminders for due tasks

### Day 77-78: AI-Suggested Schedules

**Tasks:**
- [ ] Build AI schedule suggestion prompt
- [ ] Consider factors:
  - Tank type and size
  - Livestock bioload
  - Equipment configuration
  - Parameter stability
- [ ] Create "Set up my maintenance schedule" wizard
- [ ] Generate recommended tasks with frequencies
- [ ] Add one-click accept for suggestions

**Deliverable:** AI can suggest personalized maintenance schedules

### Day 79-80: Polish & iOS Fallback

**Tasks:**
- [ ] Test push on all platforms:
  - Chrome Android ✅
  - Safari iOS ⚠️ (limited support)
  - Chrome Desktop ✅
  - Firefox ✅
- [ ] Implement email fallback for iOS Safari
- [ ] Add notification testing feature ("Send test notification")
- [ ] Create notification troubleshooting guide
- [ ] Polish notification UI (toast style)

**Deliverable:** Notifications work across all platforms (with fallback)

**Week 12-14 Exit Criteria:**
- [ ] Task CRUD with recurring schedules
- [ ] Push notifications working (with email fallback)
- [ ] AI-suggested maintenance schedules
- [ ] > 50% of users enable notifications (target)

**Reference:** `05_Maintenance_Scheduling_Spec.md`

---

## Week 13-14: Admin Portal v1 & Launch Prep

### Admin Portal v1 (Day 81-83)

**Tasks:**
- [ ] Set up admin role check (via `users.role` column)
- [ ] Create admin SQL scripts:
  - User lookup (by email, ID)
  - Subscription management
  - Account actions (ban, suspend, extend trial)
  - Feature flag toggles
- [ ] Document admin procedures in runbook
- [ ] Create audit log for all admin actions
- [ ] Test admin workflows

**Deliverable:** Admin can manage users via Supabase Studio + SQL

**Reference:** `13_Admin_Portal_Management_Spec.md` (Phase 1)

---

## Launch Preparation (Week 13-14)

### T-7: Final Staging Verification (Day 84-85)

**Tasks:**
- [ ] Deploy to staging environment
- [ ] Run full test suite
- [ ] Verify all features work end-to-end
- [ ] Complete security checklist (`01_Security_Privacy_Checklist.md`)
- [ ] Verify backup procedures
- [ ] Test disaster recovery

### T-3: Production Freeze (Day 86-87)

**Tasks:**
- [ ] Code freeze (no new features)
- [ ] Final data seeding (800+ species if ready, else 200+)
- [ ] DNS/SSL verification
- [ ] Set up production monitoring:
  - Sentry error tracking
  - Vercel Analytics
  - Supabase monitoring
  - Stripe dashboard

### T-1: Final Smoke Tests (Day 88)

**Tasks:**
- [ ] Run critical path tests:
  - Signup → Onboarding
  - Tank creation
  - AI chat conversation
  - Parameter logging
  - Livestock addition
  - Task creation
  - Trial signup
  - Payment processing (test mode)
- [ ] Verify Stripe live mode ready
- [ ] Activate monitoring alerts
- [ ] Prepare launch announcement

### T-0: Launch Day (Day 89)

**Morning (8 AM):**
- [ ] Run all T-1 tests again
- [ ] Open monitoring dashboards
- [ ] Activate Slack/Discord monitoring channel

**Deploy (9 AM):**
- [ ] Merge main → production
- [ ] Deploy to Vercel production
- [ ] Verify health check passes
- [ ] Flip feature flags if any

**Post-Deploy (9:15 AM):**
- [ ] Run post-deploy smoke tests
- [ ] Verify Stripe live payments work
- [ ] Test push notifications
- [ ] Check AI chat responses

**Announce (9:30 AM):**
- [ ] Update website status
- [ ] Post on social media
- [ ] Send email to waitlist
- [ ] Post on ProductHunt/HN (optional)

**Monitor (9:30 AM - 6 PM):**
- [ ] Check metrics every 30 minutes
- [ ] Respond to any errors immediately
- [ ] Triage user support requests

**Reference:** `05_Release_Notes_Launch_Checklist.md`

---

## MVP Launch Complete Checklist

### P0 Features Shipped
- [ ] Authentication & Onboarding
- [ ] Tank Profile Management
- [ ] AI Chat Engine
- [ ] Subscription & Billing
- [ ] Water Parameters & Analysis
- [ ] Species Database (200+ species)
- [ ] Livestock Tracking with Compatibility
- [ ] Maintenance Scheduling & Notifications
- [ ] Admin Portal v1 (SQL)

### Infrastructure
- [ ] Production deployment on Vercel
- [ ] Production database on Supabase
- [ ] Stripe live mode enabled
- [ ] Error monitoring active (Sentry)
- [ ] Analytics active (Vercel)

### Operational
- [ ] Runbook documented
- [ ] Support FAQ ready
- [ ] Incident response plan ready
- [ ] Backup procedures verified

### Metrics Tracking
- [ ] Signup events
- [ ] Onboarding completion
- [ ] Feature usage events
- [ ] Conversion events
- [ ] Error rates

---

## Post-Launch: T+1 to T+7

**T+1 (Day 90):**
- [ ] Review first 24-hour metrics
- [ ] Triage errors and hotfixes
- [ ] Respond to user support
- [ ] Monitor costs

**T+3 (Day 92):**
- [ ] First user feedback review
- [ ] Deploy any critical hotfixes
- [ ] Feature usage analysis

**T+7 (Day 96):**
- [ ] Week 1 retrospective
- [ ] Metrics summary
- [ ] Hotfix prioritization
- [ ] Plan Phase 3 kickoff

**Reference:** `05_Release_Notes_Launch_Checklist.md` (Post-launch sections)

---

## Success Criteria

### Launch Day (T+0)
- [ ] Error rate < 0.5%
- [ ] P95 response time < 1.5 seconds
- [ ] Stripe payments processing
- [ ] AI responses generating
- [ ] Push notifications delivering

### Week 1 (T+7)
- [ ] > 50 signups (if announced widely)
- [ ] > 10% trial-to-paid conversion
- [ ] > 20% day-1 to day-7 retention
- [ ] < 5% P0 bugs

---

## Next: Phase 3 (Weeks 15-26)

After MVP launch:
- Photo Diagnosis (2 weeks)
- Equipment Tracking (3 weeks)
- Dashboards & Reports (2 weeks)
- Admin Portal v2 (3 weeks)

---

*Document Version: 1.0*
*Last Updated: February 7, 2026*
