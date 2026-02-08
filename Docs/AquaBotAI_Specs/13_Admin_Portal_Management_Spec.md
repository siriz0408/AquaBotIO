# Admin Portal & Management — Feature Specification
**Aquatic AI | R-013 | P0/P1 — Must-Have (MVP Phase 1), Nice-to-Have (Phases 2-3)**

## Problem Statement
Aquatic AI's backend operations require administrative oversight across user accounts, billing, AI system configuration, content management, and platform health monitoring. Without a dedicated admin portal, the team must rely on manual SQL queries, Stripe Dashboard, and Supabase Studio to resolve user issues, manage subscriptions, update system prompts, and monitor system health. This creates operational friction, increases support response time, and makes it difficult to scale customer support. A comprehensive, secure admin portal centralized in one place reduces operational burden, accelerates issue resolution, enables data-driven business decisions, and allows non-technical team members (support, content, business) to perform their roles without database access.

## Goals
- Provide a secure, role-based admin interface (Super Admin, Content Admin, Support Admin) that consolidates user management, billing operations, content management, and analytics
- Reduce support response time by enabling faster user account troubleshooting, subscription adjustments, and data retrieval
- Enable data-driven business decisions with real-time dashboards (DAU/WAU/MAU, MRR, trial conversion, churn, AI usage)
- Support content operations (species database CRUD, equipment defaults, AI system prompts) without requiring SQL knowledge
- Achieve admin task completion in < 5 minutes (e.g., suspend user, issue refund, update tier, search user)
- Maintain 100% audit trail of all admin actions for compliance and security
- Phase 1 (MVP): Minimum viable admin capability via Supabase Studio + Stripe Dashboard; no custom UI needed
- Phase 2: Custom admin dashboard with user management, basic analytics, and content CRUD
- Phase 3: Full-featured portal with moderation tools, advanced analytics, and AI prompt versioning

## Non-Goals
- NG1: Real-time user behavior tracking or session replay — admin portal is for data review and action, not surveillance
- NG2: Complex workflow automation — admin portal is transactional, not workflow orchestration
- NG3: Multi-tenant admin support — single-tenant admin for Aquatic AI team only
- NG4: Admin feature parity with user features — admin tools are operational, not feature-full experiences
- NG5: Self-service admin signup — all admin accounts must be created via invitation by Super Admin only

## User Stories

### Admin Roles & Access Control
- US-admin1: As a Super Admin, I want to invite new admins via email, assign roles (Super, Content, Support), and revoke access, so I can expand the team and manage permissions.
- US-admin2: As a Support Admin, I want to search for users by email/name, view their subscription and AI usage, and perform actions (suspend, issue credits, upgrade tier), so I can quickly resolve support tickets.
- US-admin3: As a Content Admin, I want to add/edit/remove species from the database, update equipment defaults and maintenance intervals, and manage AI system prompts, so I can keep the platform content current.
- US-admin4: As any admin, I want all my actions (who, what, when, IP) logged in an audit trail, so I can verify what happened and maintain compliance.

### Dashboard & Analytics
- US-admin5: As a business analyst, I want to see real-time system metrics (DAU/WAU/MAU, new signups, trial conversion, churn rate, MRR, ARPU), so I can track product health and growth.
- US-admin6: As a platform operator, I want to see system health metrics (API latency, error rates, Edge Function performance, Anthropic API status), so I can detect issues early.
- US-admin7: As a Support Admin, I want to export user data (CSV) and analytics reports (PDF), so I can share findings with the team and process GDPR requests.

### User Management
- US-admin8: As a Support Admin, I want to view a user's profile, tanks, AI conversations, and subscription details in one place, so I can understand their context without multiple tools.
- US-admin9: As a Support Admin, I want to perform account actions (suspend, ban, delete) without manual SQL, so I can enforce policy quickly.
- US-admin10: As a Support Admin, I want to issue refunds, extend trial, apply credits, and change subscription tier on behalf of users, so I can resolve billing issues without Stripe context-switching.
- US-admin11: As a Support Admin, I want to impersonate a user's session (with audit logging), so I can debug issues and understand the user experience firsthand.

### Content Management
- US-admin12: As a Content Admin, I want to manage the species database (add, edit, delete species with care requirements and photos), so I keep the database accurate and up-to-date.
- US-admin13: As a Content Admin, I want to manage equipment defaults (lifespan, categories, maintenance intervals), so I can improve maintenance scheduling recommendations.
- US-admin14: As a Content Admin, I want to view and edit the AI system prompt templates, test prompts, and see version history, so I can optimize AI responses.

### System Configuration
- US-admin15: As a Super Admin, I want to enable/disable features per tier or globally via feature flags, so I can roll out features gradually or quickly disable problematic features.
- US-admin16: As a Super Admin, I want to edit tier limits (tank count, message limits) without code changes, so I can adjust the product model rapidly.
- US-admin17: As a Super Admin, I want to configure which AI model to use (Claude Sonnet vs. Haiku), temperature, and max tokens, so I can optimize cost vs. quality.
- US-admin18: As a Super Admin, I want to toggle maintenance mode and customize the maintenance banner, so I can communicate planned downtime to users.

## Requirements

### Phase 1 MVP (P0 — Must-Have for Launch)

**R-013.1: Admin Portal Infrastructure**
Define admin access infrastructure using Supabase RLS policies, custom claims, and a protected admin route group in the Next.js app. No custom UI needed for MVP — rely on Supabase Studio and external dashboards.

**Acceptance Criteria:**
- Admin accounts are stored in the `users` table with a `role` column (enum: 'user', 'super_admin', 'content_admin', 'support_admin')
- Supabase RLS policies restrict admin table access to admins only; users cannot access admin rows
- Admin routes (admin.aquaticai.app or /admin) require authentication + admin role verification via middleware
- All admin actions are logged with user_id, action, timestamp, IP address in an `admin_audit_log` table
- Sessions timeout after 30 minutes of inactivity; force re-authentication for sensitive actions (suspension, deletion, billing)

**R-013.2: Admin Role Hierarchy & Permissions Matrix**
Three admin roles with graduated permissions. Super Admin > Content Admin > Support Admin.

**Acceptance Criteria:**
- **Super Admin**: Full access to all admin functions, can invite/revoke admins, modify tier limits, toggle features, enable maintenance mode, view all analytics
- **Content Admin**: Can CRUD species, equipment defaults, AI system prompts; cannot access user data, billing, or analytics
- **Support Admin**: Can search/view users, manage subscriptions (upgrade/downgrade/suspend/issue credits), perform account actions (ban, delete), export user data; cannot modify tier limits or system prompts
- Each admin account is created only via email invitation from a Super Admin (no self-registration)
- Role changes and account creation/deletion are logged in `admin_audit_log`

**R-013.3: Admin Audit Logging**
All admin actions recorded in a new `admin_audit_log` table for compliance and security review.

**Acceptance Criteria:**
- `admin_audit_log` table structure: id, admin_user_id, action (enum: 'user_created', 'subscription_updated', 'species_added', 'prompt_edited', 'account_suspended', etc.), resource_type, resource_id, changes_before (JSON), changes_after (JSON), ip_address, user_agent, created_at
- Every admin action (user suspension, subscription change, content edit, system config change) is logged before execution
- Logs are immutable (no updates after creation; deletion only by Super Admin with special approval)
- Query support: filter by admin, date range, action type, resource type
- Logs are retained for >= 2 years for compliance

**R-013.4: MVP Admin Interface via Supabase Studio**
For Phase 1, use Supabase Studio as the primary admin interface instead of building custom UI. Supplement with SQL scripts for bulk operations and Stripe Dashboard for billing.

**Acceptance Criteria:**
- Admin team is given Supabase Studio access with RLS-enforced row-level security (they can only see admin tables and user data within their role scope)
- SQL scripts are provided for common operations: suspend user, issue credits, export user data, export analytics snapshot
- Stripe Dashboard is used for subscription operations (refunds, invoice adjustments) and revenue reporting
- No custom admin UI is built in Phase 1; all work is done through Supabase Studio, Stripe, and scripts
- Transition plan to Phase 2 (custom UI) is documented

**R-013.5: Admin User Search & Filtering**
Support efficient searching and filtering of user records by email, tier, signup date, activity level, and subscription status.

**Acceptance Criteria:**
- Search is available in Supabase Studio (native feature)
- SQL query templates provided for common filters: by email, by tier (free/starter/plus/pro), by signup date range, by last login date, by trial status
- Results include: user_id, email, tier, signup_date, last_login, total_tanks, trial_end_date, subscription_status
- Search returns <= 100 results by default; pagination supported
- Search performance stays < 500ms on the users table even with 100k+ users

**R-013.6: User Detail View**
Admin can view comprehensive user profile including account info, tanks, subscription, AI usage, and conversation history.

**Acceptance Criteria:**
- A user detail view (accessible via Supabase Studio or a simple admin page) displays:
  - Basic: user_id, email, display_name, created_at, last_login, auth_method
  - Subscription: current_tier, trial_end_date (if in trial), subscription_status, stripe_customer_id, current_period_end, auto_renew status
  - Usage: total_ai_messages (all time and last 30 days), total_tokens_consumed, estimated_cost, tanks_created, last_activity_date
  - Tanks: list of user's tanks (name, type, volume, created_at, last_parameter_log_date)
  - AI Conversations: snippet view of recent AI conversations (topic, timestamp, AI model used)
- All data is read-only in the detail view; edits are performed via separate "account actions" flow

**R-013.7: Account Actions (Suspend, Ban, Delete)**
Admins can suspend, ban, or permanently delete user accounts with audit logging.

**Acceptance Criteria:**
- **Suspend**: User's account is temporarily inactive; they cannot log in or use app features. Suspension reason is logged. User receives email notification.
- **Ban**: User is permanently blocked; their account is deleted, all data is marked as deleted (with soft delete flag). Email notification is sent.
- **Delete**: Account and all associated data (tanks, conversations, parameters) are permanently deleted from Supabase. User receives notification.
- All three actions require Super Admin or Support Admin + confirmation prompt to prevent accidents
- Actions are logged in `admin_audit_log` with before/after state
- User receives email notification of account action (configurable per action type)

**R-013.8: Subscription Management**
Support Admins can manage user subscriptions without leaving the admin portal.

**Acceptance Criteria:**
- Admins can upgrade/downgrade/cancel a user's subscription on their behalf
- When upgrading mid-cycle, pro-rata credit is applied automatically
- When downgrading, change takes effect at next billing cycle (or immediately if manually requested)
- Admins can extend trial by X days (default: 7 days) with reason logged
- Admins can issue account credits (e.g., $5 credit) which appear as a balance in the user's account and apply to next invoice
- All subscription changes are synced with Stripe (via API call or webhook) and logged in `admin_audit_log`
- Stripe Dashboard remains the source of truth for refunds (noting the NO REFUNDS policy in terms of service)

**R-013.9: System Overview Dashboard (P1 — Phase 2)**
Real-time dashboard showing system metrics (DAU, new signups, trial conversion, churn, MRR, ARPU, AI usage).

**Acceptance Criteria:**
- Dashboard displays at a glance:
  - **Growth**: Total users, new signups (today, week, month), trial conversion rate, churn rate
  - **Revenue**: MRR, ARPU, tier distribution (% Starter/Plus/Pro), failed payments count
  - **AI Usage**: Total messages (today, week, month), tokens consumed, cost per user, model distribution (Sonnet vs. Haiku)
  - **System Health**: API latency (p50, p95), error rate (5xx errors), Edge Function execution time, Anthropic API status
- All metrics update every 5 minutes (near real-time)
- Trends visible for 30-day period (daily aggregates)
- Dashboard is interactive: drill-down by tier, by date range, by feature

**R-013.10: AI Usage Analytics**
Track and report on AI usage metrics per user, per tier, and per feature (chat, diagnosis, report, search).

**Acceptance Criteria:**
- `ai_usage` table (if not already present) includes: id, user_id, date, feature, message_count, tokens_used, estimated_cost, created_at
- Analytics queries answer: total tokens consumed per user, average tokens per message, cost per user per month, which features are most used, Sonnet vs. Haiku usage ratio
- Admins can export AI usage data (CSV) for cost analysis
- AI cost per user is calculated and compared against $2/month threshold for profitability review
- Alerts trigger if a single user's AI usage exceeds cost threshold (e.g., $10 in a day)

**R-013.11: Feature Flags**
Super Admins can enable/disable features globally or per subscription tier without code deployment.

**Acceptance Criteria:**
- New `feature_flags` table: id, flag_name (string), enabled (boolean), scope (enum: 'global', 'tier_specific'), tier (nullable), rollout_percent (0-100 for gradual rollout), created_at, updated_at
- Examples: 'web_search_agent', 'photo_diagnosis', 'email_reports', 'equipment_tracking'
- Feature checks are evaluated server-side in Next.js middleware or Edge Functions before feature access
- Feature flag changes take effect within 1 minute (with client refresh)
- Super Admin can view active feature flags, change values, and review history

**R-013.12: Tier Limit Configuration**
Super Admins can adjust subscription tier limits (tank count, AI message limits, feature access) without code deployment.

**Acceptance Criteria:**
- New `tier_config` table: id, tier, max_tanks, daily_messages_limit, max_photos_per_month, features_enabled (JSON array), created_at, updated_at
- Admins can view and edit limits for Starter, Plus, Pro tiers
- Changes take effect immediately for new resource creations; existing resources are unaffected
- Limits are cached in Redis (if available) to avoid repeated database queries
- Historical changes are logged for audit purposes

**R-013.13: AI System Prompt Management (P1 — Phase 2)**
Content Admins can view, edit, and version the system prompt used for all AI interactions.

**Acceptance Criteria:**
- New `content_versions` table: id, content_type (enum: 'system_prompt', 'species', 'equipment'), version_number, content (JSON or text), created_by (admin_user_id), created_at, is_active (boolean), change_notes (text)
- Content Admins can view the current system prompt and its edit history
- Content Admins can create a new version of the system prompt, with change notes
- Only one version is marked active at a time; switching versions takes effect within 1 minute
- Admins can A/B test prompts by flagging experimental prompts (20% traffic to new prompt, 80% to old)
- Version control allows rollback if a prompt change degrades quality

**R-013.14: Species & Equipment Database CRUD (P1 — Phase 2)**
Content Admins can add, edit, and delete species and equipment defaults without SQL.

**Acceptance Criteria:**
- Content Admins can use a CRUD interface (in Supabase Studio or custom forms in Phase 2) to:
  - **Species**: Add/edit species name, care requirements (temperature, pH, hardness, size), compatibility rules, photos, difficulty level
  - **Equipment**: Add/edit equipment category, lifespan defaults, maintenance intervals, recommended brands
- All changes are versioned in `content_versions` table
- Photos are stored in Supabase Storage with versioning (old photos retained for history)
- Deletions are soft-deletes (mark as deleted, retain in database)
- Changes are logged in `admin_audit_log` with before/after snapshots

**R-013.15: Admin Account Management**
Super Admins can create, modify, and revoke admin accounts via email invitations.

**Acceptance Criteria:**
- Super Admin sends invite to a new team member's email address
- Invitation email contains a magic link (same as user auth) that sets up their admin account
- New admin sets their password (if password auth is enabled for admins) or uses magic link for each login
- Super Admin can change an admin's role or revoke access
- Revoked admins lose access immediately; their session is terminated
- All admin account management is logged in `admin_audit_log`

### Phase 2 (P1 — Nice-to-Have, Post-Launch)

**R-013.16: Custom Admin Dashboard UI**
Build a dedicated admin portal (admin.aquaticai.app or /admin route) with custom Next.js pages replacing Supabase Studio.

**Acceptance Criteria:**
- Dashboard is a separate Next.js app or route group with its own layout
- User authentication is via Supabase Auth with admin role check
- Two-factor authentication (TOTP) is required for all admin accounts
- UI includes: admin sidebar navigation, user search/filter interface, analytics dashboard, content management CRUD forms
- Responsive design (desktop-focused; mobile support is nice-to-have)
- Session timeout after 30 minutes of inactivity; force re-authentication for sensitive actions
- All features from Phase 1 are available in the custom UI (user search, subscription management, content CRUD)

**R-013.17: Two-Factor Authentication (2FA)**
All admin accounts must use 2FA (TOTP or SMS) for added security.

**Acceptance Criteria:**
- 2FA is mandatory at first admin login
- Admins scan a QR code to set up TOTP in authenticator app (Google Authenticator, Authy, Microsoft Authenticator)
- Backup codes (10 one-time codes) are generated in case of app loss
- 2FA verification is required on every admin login (not just first login)
- Admins can reset/regenerate 2FA only via Super Admin request

**R-013.18: IP Allowlisting**
Optional IP allowlisting for admin access (security best practice for team behind corporate VPN).

**Acceptance Criteria:**
- Super Admin can set a list of allowed IP addresses/ranges for admin portal access
- If IP allowlisting is enabled, only requests from allowed IPs can access /admin routes
- Alerts are triggered if login is attempted from a non-whitelisted IP
- Allowlist is stored in `admin_config` table

**R-013.19: User Impersonation (with Audit Logging)**
Support Admins can temporarily log in as a user's session for debugging, with full audit logging.

**Acceptance Criteria:**
- Support Admin initiates impersonation from user detail view
- A special token is issued that simulates the user's session (without their password)
- The app shows a clear "impersonation mode" banner with the user's email and a "stop impersonation" button
- All actions taken during impersonation are logged in `admin_audit_log` with admin_user_id and `impersonation_mode: true`
- Impersonation session expires after 30 minutes or when admin clicks "stop impersonation"
- User is NOT notified of impersonation (but logs are available for security review)
- Only Support Admin or Super Admin can impersonate

**R-013.20: Export User Data (GDPR Compliance)**
Support Admins can export a user's complete data (CSV or JSON) for GDPR requests or support tickets.

**Acceptance Criteria:**
- Admin initiates export from user detail view
- Export includes: profile (email, name, signup_date), tanks (details, parameters, livestock), AI conversations (full history), subscription history, all logs and activity
- Export is generated asynchronously; admin receives email with download link (expires in 7 days)
- Export file is generated on-the-fly and not stored permanently on server (for privacy)
- Timestamp of export is logged in `admin_audit_log`

**R-013.21: Failed Payment Management**
Dashboard view of failed payments with retry and user contact workflows.

**Acceptance Criteria:**
- Admins see a list of failed payments (card declined, expired, insufficient funds)
- For each failed payment, admin can:
  - Retry the payment immediately via Stripe API
  - Send a custom email to the user asking them to update payment method
  - Issue a one-time credit (to bypass payment, extend trial instead)
- Failed payments are categorized (card error, address mismatch, insufficient funds, expired)
- Grace period status is shown (e.g., "2 days until feature lockout")
- Recovery rate is tracked: % of failed payments that are retried and succeed

**R-013.22: Coupon & Promo Code Management (P1)**
Super Admins can create, track, and expire promotional codes.

**Acceptance Criteria:**
- Admin creates a coupon in Stripe Dashboard or via admin UI, specifying:
  - Code (e.g., 'LAUNCH10')
  - Discount (% or fixed amount)
  - Applies to tiers (Starter, Plus, Pro, or all)
  - Expiration date
  - Usage limit (max # of codes issued or unlimited)
- Admin can view active coupons and their usage (# of customers, total discount issued)
- Coupons are synced with Stripe; applying a coupon is done at checkout
- Expired coupons are archived but visible in history

**R-013.23: Maintenance Mode**
Super Admin can toggle maintenance mode and customize the maintenance banner shown to all users.

**Acceptance Criteria:**
- Super Admin can toggle maintenance mode (on/off) and set a message (e.g., "Scheduled maintenance 2-4 AM EST")
- When enabled, all users see a banner at the top of the app; app features are read-only or disabled
- Banner includes: maintenance reason, expected duration, estimated completion time
- Maintenance mode does not log users out; they can still view data but cannot perform writes
- Maintenance mode is persisted in a `maintenance_config` table
- API errors during maintenance are suppressed and replaced with maintenance message

### Phase 3 (P2 — Future, Advanced Features)

**R-013.24: Advanced Analytics & Cohort Analysis**
Retention cohorts, funnel analytics, and engagement trends.

**Acceptance Criteria:**
- Cohort analysis: track groups of users by signup week/month and measure retention week-over-week
- Funnel analytics: signup → email verified → trial active → trial ended → first purchase (show drop-off at each stage)
- Engagement trends: trending topics in AI conversations, feature adoption by tier, session duration distribution
- Charts are interactive (zoom, filter, hover for details)
- Export to PDF or email scheduled reports

**R-013.25: Photo Diagnosis Review Queue**
Moderation interface for reviewing flagged or suspicious photo diagnoses.

**Acceptance Criteria:**
- Moderation Admins (new role) see a queue of photo diagnoses flagged for review (by user report, low confidence, explicit content detection)
- For each diagnosis:
  - View the photo and AI diagnosis response
  - Approve (publish) or reject (delete and notify user)
  - Leave a note for the user (e.g., "Please upload a clearer photo")
  - Mark as false positive to improve the flagging algorithm
- Photos are retained for 30 days post-deletion for audit purposes
- Moderation actions are logged in `admin_audit_log`

**R-013.26: AI Conversation Review & Quality Spot-Checks**
Review sample of AI conversations for quality and safety.

**Acceptance Criteria:**
- Moderation Admins can view a random sample of recent AI conversations
- For each conversation, rate quality (poor/fair/good/excellent) and flag safety concerns (harmful advice, misinformation)
- Ratings feed into a quality dashboard (% conversations rated good+, % flagged for safety)
- Conversations flagged for safety are escalated to Super Admin
- Conversation review data is used to retrain/adjust the system prompt

**R-013.27: Bulk Notifications & Campaigns**
Send bulk in-app or email notifications to user segments (by tier, by signup date, by activity level).

**Acceptance Criteria:**
- Super Admin can create a notification campaign:
  - Title and message (supports Markdown)
  - Target segment (all users, by tier, by activity level, by feature usage)
  - Delivery method (in-app banner, email, or both)
  - Schedule (send now, or schedule for specific time)
- Preview before sending
- Track delivery and engagement (open rate, click-through rate)
- Cannot send more than 1 notification per user per day

**R-013.28: Custom Reports & Scheduling**
Admins can schedule recurring reports (daily, weekly, monthly) and receive them via email.

**Acceptance Criteria:**
- Report builder allows selecting metrics to include (DAU, MRR, trial conversion, churn, AI usage, error rates)
- Reports can be scheduled (e.g., every Monday 9 AM) and emailed to one or more admins
- Reports are available in PDF or CSV format
- Recipients can be configured per report (e.g., CEO gets weekly MRR report, ops team gets daily error report)
- Report history is retained for 90 days

## Data Model Additions

New tables required for admin functionality:

### admin_users (or admin role in users table — recommend separate)
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role ENUM ('super_admin', 'content_admin', 'support_admin') NOT NULL,
  invited_by UUID REFERENCES admin_users(id),
  invited_at TIMESTAMP,
  accepted_at TIMESTAMP,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES admin_users(user_id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50), -- 'user', 'subscription', 'species', 'system_config', etc.
  resource_id VARCHAR(255),
  changes_before JSONB,
  changes_after JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  flag_name VARCHAR(100) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT FALSE,
  scope ENUM ('global', 'tier_specific') DEFAULT 'global',
  tier VARCHAR(20), -- 'starter', 'plus', 'pro' if scope='tier_specific'
  rollout_percent INT DEFAULT 100, -- 0-100 for gradual rollout
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tier_config (
  id UUID PRIMARY KEY,
  tier VARCHAR(20) NOT NULL UNIQUE,
  max_tanks INT NOT NULL,
  daily_messages_limit INT,
  max_photos_per_month INT,
  features_enabled JSONB, -- array of feature names
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_versions (
  id UUID PRIMARY KEY,
  content_type ENUM ('system_prompt', 'species', 'equipment') NOT NULL,
  version_number INT NOT NULL,
  content_id UUID, -- reference to species.id, equipment.id, or null for system_prompt
  content JSONB NOT NULL, -- full content snapshot
  created_by UUID NOT NULL REFERENCES admin_users(user_id),
  is_active BOOLEAN DEFAULT FALSE,
  change_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(content_type, content_id, version_number)
);

CREATE TABLE admin_notes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES admin_users(user_id),
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE maintenance_config (
  id UUID PRIMARY KEY,
  maintenance_enabled BOOLEAN DEFAULT FALSE,
  message TEXT,
  expected_duration VARCHAR(100),
  estimated_completion_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tier_config_history (
  id UUID PRIMARY KEY,
  tier VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID NOT NULL REFERENCES admin_users(user_id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Requirements

**R-013.29: Admin Portal Separate Subdomain**
Admin portal is hosted on a separate subdomain (admin.aquaticai.app) with distinct SSL certificate and separate Next.js deployment.

**Acceptance Criteria:**
- Admin portal is deployed to admin.aquaticai.app (not /admin route on main app, though route is acceptable if same domain)
- Admin portal has distinct authentication and session management
- Admin portal is not indexed by search engines (robots.txt disallows /admin)
- CORS headers prevent admin API requests from other domains
- Admin cookies are marked as Secure, HttpOnly, and SameSite=Strict

**R-013.30: Two-Factor Authentication (2FA) Mandatory**
All admin accounts must have 2FA enabled.

**Acceptance Criteria:**
- 2FA setup is required during admin account creation (not optional)
- TOTP (Time-based One-Time Password) via authenticator app is the primary 2FA method
- SMS backup is nice-to-have in Phase 2
- Backup codes (10 one-time codes) are printed during setup for emergency access
- 2FA is re-verified on every login (not bypassed for returning admins)

**R-013.31: Session Timeout & Sensitive Action Re-Authentication**
Admin sessions timeout after 30 minutes of inactivity. Sensitive actions (suspension, deletion, refund) require re-authentication.

**Acceptance Criteria:**
- Session timeout is 30 minutes; inactivity is measured by last user action (page load, button click, form submission)
- After timeout, user is logged out and redirected to login page
- Sensitive actions (suspension, deletion, account downgrade, refund) require re-entering password or 2FA code before execution
- Timeout warning is shown 2 minutes before timeout (dismissable to extend session)

**R-013.32: Admin Actions Logged with IP & User Agent**
All admin actions are logged with full context (who, what, when, IP address, user agent).

**Acceptance Criteria:**
- Every admin action writes to `admin_audit_log` BEFORE execution (not after)
- Log includes: admin_user_id, action name, resource_type, resource_id, IP address, user_agent, timestamp
- If action modifies data, `changes_before` and `changes_after` are captured (JSON snapshot)
- Logs are immutable; no updates after creation
- Super Admin can view full audit trail; other admins can view only their own actions
- Logs are retained for >= 2 years

**R-013.33: Supabase RLS Policies for Admin Access**
RLS policies enforce that admins can only access their allowed data scopes.

**Acceptance Criteria:**
- `admin_users` table is accessible only to Super Admins
- User data is accessible to Support Admins (can view all users) but only specific fields are exposed (no sensitive fields like password hashes)
- Species, equipment, and system prompt tables are accessible to Content Admins (read/write)
- `admin_audit_log` table is readable only to Super Admins and the admin whose actions are logged
- All policies use custom Supabase claims (role claim set at JWT creation)

**R-013.34: Password & API Key Management**
Admin credentials and API keys are stored securely.

**Acceptance Criteria:**
- Admin passwords (if used) are hashed with bcrypt or Supabase Auth default
- Stripe API keys are stored as environment variables, never hardcoded or logged
- Supabase service role key is stored as environment variable and used only server-side (not exposed to client)
- Database connection strings are environment variables, rotated quarterly
- No sensitive credentials are committed to GitHub (pre-commit hooks check)

## Technical Notes

### Architecture: Admin Portal as Next.js Route Group (Phase 1-2)
```
/app
  /admin                    # admin route group
    /layout.tsx            # admin-specific layout with sidebar, auth check
    /page.tsx              # admin home / dashboard
    /users
      /page.tsx            # user search and list
      /[id]
        /page.tsx          # user detail view
    /content
      /species
        /page.tsx          # species CRUD
      /equipment
        /page.tsx          # equipment CRUD
      /prompts
        /page.tsx          # system prompt management
    /billing
      /page.tsx            # revenue dashboard, subscription overview
    /analytics
      /page.tsx            # system overview, AI usage, retention
    /settings
      /page.tsx            # feature flags, tier config, maintenance mode
```

Or, alternatively, as a separate Next.js app:
- `app-main` (user-facing app)
- `app-admin` (admin portal, deployed to admin.aquaticai.app)
- Shared dependencies via npm workspaces or monorepo

**Recommendation:** Route group (/admin) for MVP to reduce deployment complexity; separate app in Phase 2 if team and codebase grow.

### Authentication & Authorization
```typescript
// Middleware to protect admin routes
export async function middleware(request: NextRequest) {
  const { user, session } = await getAuth(request);

  if (!user || !session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Check admin role
  const adminRole = session.user?.user_metadata?.admin_role;
  if (!adminRole) {
    return NextResponse.redirect(new URL('/dashboard', request.url)); // redirect non-admins
  }

  // Session timeout check
  if (session.expires_at && Date.now() > session.expires_at) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

// RLS Policy Example for admin_users table
CREATE POLICY "Super admins can manage all admin accounts"
ON admin_users
FOR ALL
USING (
  auth.jwt() ->> 'admin_role' = 'super_admin'
)
WITH CHECK (
  auth.jwt() ->> 'admin_role' = 'super_admin'
);
```

### Data Access Patterns
- **User search**: Query users table with filters (email ILIKE, tier, created_at range, etc.)
- **Analytics**: Pre-computed aggregates (daily snapshots in a separate analytics table) or real-time queries using Supabase functions
- **Audit logs**: Immutable append-only table; queries by date range and action type
- **Feature flags**: Cached in Redis or memory; refresh on update

### Admin API Endpoints (Edge Functions or Next.js API Routes)

Phase 1: Use Supabase Studio for CRUD; Phase 2: Build custom API endpoints
```
POST   /api/admin/users/:id/suspend
POST   /api/admin/users/:id/unsuspend
POST   /api/admin/users/:id/delete
POST   /api/admin/subscriptions/:id/update-tier
POST   /api/admin/subscriptions/:id/issue-credit
POST   /api/admin/species               # CRUD
PUT    /api/admin/species/:id
DELETE /api/admin/species/:id
POST   /api/admin/prompts               # CRUD, versioning
POST   /api/admin/feature-flags/:name/toggle
POST   /api/admin/tier-config/:tier     # update tier limits
POST   /api/admin/maintenance-mode      # toggle & message
```

### Monitoring & Alerting
- **Admin login attempts**: Log all login attempts (success and failure); alert on repeated failures from same IP
- **Admin action frequency**: Alert if one admin performs unusual volume of actions in short time (possible account compromise)
- **Failed webhook events**: Alert if Stripe webhooks fail repeatedly (subscription sync failures)
- **AI cost alerts**: Alert if a single user's AI usage exceeds threshold (e.g., $10/day) or total platform cost spikes

### Performance Considerations
- **User search index**: Ensure indexes on users.email, users.created_at, users.subscription_tier for fast queries
- **Analytics caching**: Pre-compute daily aggregates (DAU, new signups, revenue) into a separate table; query aggregates, not raw tables
- **Audit log retention**: Archive old logs to cold storage (S3) after 90 days; keep recent logs in database for faster queries
- **Impersonation token**: Use short-lived (5 min) JWT with special claims to avoid stealing long-lived admin tokens

### Error Handling
- Admin actions should log errors but not expose details to end user (e.g., "Failed to update subscription" without DB error message)
- Stripe API errors should be caught and mapped to user-friendly messages (e.g., "Card declined" → show retry option)
- Database connection errors should trigger alerts to ops team

## Phase Planning

### Phase 1: MVP (Blocker for Launch) — Estimated 1-2 Sprints
**No custom admin UI; use Supabase Studio + Stripe Dashboard + SQL scripts**

**Deliverables:**
- Define admin roles and RLS policies in Supabase
- Create `admin_users`, `admin_audit_log`, `feature_flags`, `tier_config`, `content_versions` tables
- Grant Supabase Studio access to core team (Super Admin, Content Admin, Support Admin accounts)
- Write SQL scripts for common operations (suspend user, issue credits, export user data, get analytics snapshot)
- Implement admin authentication in Next.js (role check in middleware)
- Implement tier enforcement in app (using tier_config table)
- Implement audit logging middleware (all admin actions logged before execution)
- Document admin operations guide for team (how to use Supabase Studio, scripts, Stripe Dashboard)

**Success Criteria:**
- Admin team can perform essential operations (suspend user, update subscription, add species) without SQL knowledge
- All admin actions are logged with audit trail
- Feature flags and tier limits can be changed without code deployment
- System overview metrics (DAU, MRR, churn) can be queried via SQL scripts

### Phase 2: Post-Launch Polish (2-3 Sprints) — After MVP Launch
**Build custom admin dashboard, analytics, content CRUD**

**Deliverables:**
- Design and build custom admin portal (/admin route or admin.aquaticai.app)
- Implement user search, detail view, account actions (suspend, delete)
- Implement subscription management UI (upgrade, downgrade, issue credits, extend trial)
- Implement content management CRUD (species, equipment, AI prompts)
- Build analytics dashboard (real-time DAU, MRR, ARPU, AI usage)
- Implement 2FA for admin accounts (TOTP)
- Build export functionality (user data CSV, analytics reports)
- Implement impersonation mode with audit logging
- Build failed payment recovery workflow

**Success Criteria:**
- Support team can resolve 80% of issues from admin dashboard without Stripe Dashboard or Supabase Studio context-switching
- Analytics dashboard provides real-time business metrics
- Content updates (species, equipment, prompts) can be made by Content Admins without SQL
- All admin actions logged and auditable

### Phase 3: Scale & Advanced Features (Q3+) — After Phase 2 Stable
**Moderation tools, advanced analytics, bulk campaigns**

**Deliverables:**
- Build photo diagnosis review queue for moderation
- Build AI conversation quality review and flagging system
- Implement bulk notifications / email campaigns
- Build scheduled reporting and email delivery
- Implement cohort analysis and funnel analytics
- Add IP allowlisting for admin portal
- Build custom reports builder

**Success Criteria:**
- Moderation queue processes flagged content within 24 hours
- Bulk campaigns reach users with < 10% unsubscribe rate
- Cohort analysis reveals retention trends; used to inform product decisions
- Cost per admin action is minimized (automation where possible)

## Success Metrics

### Phase 1 (MVP)
- Support response time to admin actions: < 5 minutes (search user, suspend account, issue credit)
- Admin team productivity: > 10 operations per hour per admin
- Audit trail completeness: 100% of admin actions logged
- Feature flag deployment time: < 1 minute (change flag → live in app)
- Zero unauthorized admin access attempts (via RLS enforcement)

### Phase 2
- Support ticket resolution time: reduced by 40% (faster user lookup, subscription management)
- Analytics dashboard uptime: 99%+
- Feature flag usage: >= 2 flags in production for gradual rollout
- Content update frequency: >= 1 species/equipment update per week
- Admin 2FA adoption: 100% of admin accounts have 2FA enabled

### Phase 3
- Moderation queue processing time: < 24 hours per item
- Bulk campaign engagement: > 20% open rate, > 5% click-through rate
- Cohort retention insights: identified 2+ cohort-specific retention drivers
- Admin role adoption: >= 5 admins across all roles
- Zero successful unauthorized admin actions (100% RLS enforcement)

## Decisions (Resolved)

### Business & Product
- ✅ Admin refunds: No refund button in admin portal. Refunds (if legally required) must be processed directly in Stripe Dashboard by Super Admin with documented justification. This aligns with the platform's no-refund policy.
- ✅ Impersonation access: Super Admin only. Read-only mode, clearly labeled, fully logged in audit trail.
- ✅ Audit trail granularity: Every write action (create, update, delete, suspend, tier change) is logged with old/new values in JSONB. Read-only actions (viewing user profiles) logged with target_id only.
- ✅ Admin productivity metrics: Not tracked in v1. Audit log data can be queried ad-hoc if needed.

### Engineering & Architecture
- ✅ Admin portal architecture: Route group within main Next.js app (/admin) for v1. Reduces deployment complexity. Separate app considered for Phase 3 if admin needs outgrow the main app.
- ✅ Timezone handling: All timestamps stored in UTC. Admin UI displays in admin's local timezone (detected from browser). UTC toggle available for debugging.
- ✅ Feature flag updates: Periodic polling (every 60 seconds) for v1. WebSocket push deferred to P2 when feature flag volume warrants it.
- ✅ Tier limit caching: Cache tier_config in Edge Function memory with 5-minute TTL. Invalidate on admin update via Supabase Realtime broadcast.
- ✅ Analytics dashboard: Pre-computed aggregates refreshed every 15 minutes via admin_metrics_cache table. Not real-time, but fresh enough for operational decisions.

### Security & Compliance
- ✅ Admin API rate limiting: 100 requests/minute per admin user. Enforced at Edge Function middleware.
- ✅ IP allowlisting: Deferred to P2. V1 relies on role-based access control + audit logging.
- ✅ Admin password resets: Same auth methods as consumer app (email/password, Google OAuth, magic link). No special admin-only reset flow. Session timeout: 4 hours (shorter than consumer 7 days).
- ✅ Audit log retention: 2 years minimum. Active in PostgreSQL for 90 days, then archived to cold storage (Supabase Storage as compressed JSON).
- ✅ Impersonation privacy disclosure: Documented in privacy policy that authorized admins may view user accounts for support purposes. No real-time notification to users during impersonation. All impersonation sessions logged.

### Data & Analytics
- ✅ Analytics computation: Pre-computed daily snapshots into admin_metrics_cache table, refreshed every 15 minutes. Raw data queries available for ad-hoc analysis by Super Admin.
- ✅ Key business metrics: MRR, trial-to-paid conversion rate, AI cost per user, monthly churn rate, DAU/MAU ratio, tier distribution.
- ✅ Marketing attribution: Out of scope for admin portal. Use external analytics (Mixpanel, PostHog) for marketing attribution.

## Timeline Considerations

### Phase 1: MVP (Blocker for Launch)
**Estimated Duration:** 1-2 sprints (1-2 weeks)
**Timeline:** Must complete before public launch
**Dependencies:**
- Supabase project with auth, database, storage setup (pre-requirement)
- Stripe account and webhook configuration (pre-requirement)
- User authentication flow (R-009) must be complete
- Subscription infrastructure (R-010) must be complete

**Parallel Work:**
- While building admin infrastructure, other teams can work on user-facing features
- Admin testing can happen in staging environment independently

### Phase 2: Custom Admin Dashboard
**Estimated Duration:** 2-3 sprints (2-3 weeks)
**Timeline:** 1-2 weeks after Phase 1 MVP launch
**Dependencies:**
- Phase 1 infrastructure complete and stable
- Analytics queries optimized and validated
- User feedback on what admin operations are most painful

**Parallel Work:**
- Design phase can start during Phase 1; dev starts after Phase 1 complete

### Phase 3: Advanced Features
**Estimated Duration:** 2-3 sprints (2-3 weeks per feature)
**Timeline:** Q3 (later in product roadmap)
**Dependencies:**
- Phase 2 stable and proven valuable
- Moderation and safety tooling decision (is moderation needed based on user behavior?)
- Advanced analytics infrastructure (data warehouse, ETL pipelines)

### Risk Mitigation
- **Risk:** Admin portal becomes bottleneck for support. **Mitigation:** Automate common actions (failed payment retries, trial extensions via workflow rules)
- **Risk:** Audit logging adds significant overhead. **Mitigation:** Log asynchronously to avoid blocking admin actions; archive old logs to cold storage
- **Risk:** Complex RLS policies cause unexpected data exposure. **Mitigation:** Thorough testing of policies in staging; security audit before launch

## Acceptance Test Plan

### Feature-Level Tests

**R-013.1: Admin Portal Infrastructure**
- [ ] Admin accounts exist in `users` table with role field
- [ ] Supabase RLS policies enforce role-based access (test: non-admin user cannot see admin tables)
- [ ] Admin route middleware redirects non-admins to dashboard
- [ ] Admin audit log table exists and is immutable
- [ ] Session timeout occurs after 30 minutes; user is logged out and redirected to login

**R-013.2: Admin Roles & Permissions**
- [ ] Super Admin can invite new admins and assign roles
- [ ] Super Admin can view all admin accounts and revoke access
- [ ] Content Admin can CRUD species, equipment, prompts; cannot access user data
- [ ] Support Admin can search/view users and manage subscriptions; cannot modify tier limits or prompts
- [ ] Attempting to access forbidden resources returns 403 error (not 404)

**R-013.3: Admin Audit Logging**
- [ ] Every admin action writes to `admin_audit_log` with admin_user_id, action, timestamp, IP address
- [ ] Before/after snapshots are captured for data modifications
- [ ] Logs are queryable by date range, admin, action type
- [ ] Logs are immutable; update attempts fail
- [ ] Old logs can be archived but not deleted (soft archive only)

**R-013.4: MVP via Supabase Studio**
- [ ] Admin team has Supabase Studio access and can view users, subscriptions, audit logs
- [ ] SQL scripts are provided and documented for common operations
- [ ] Stripe Dashboard link is documented and accessible
- [ ] MVP phase transition plan to Phase 2 is documented

**R-013.5: User Search & Filtering**
- [ ] Search by email returns matching users (case-insensitive)
- [ ] Filter by tier shows users in that tier (free/starter/plus/pro)
- [ ] Filter by signup date range works (e.g., last 30 days)
- [ ] Filter by activity (last login date) identifies active vs. dormant users
- [ ] Search returns <= 100 results; pagination works for larger result sets

**R-013.6: User Detail View**
- [ ] View shows user basic info (email, name, signup date, last login)
- [ ] View shows subscription info (tier, trial status, next billing date)
- [ ] View shows AI usage (message count, tokens, estimated cost)
- [ ] View shows list of user's tanks with metadata
- [ ] View shows recent AI conversations (last 5, with timestamps and topics)

**R-013.7: Account Actions**
- [ ] Support Admin can suspend a user account (user cannot log in)
- [ ] Suspended user receives email notification
- [ ] Support Admin can ban a user (account deleted, user receives email)
- [ ] Support Admin can delete a user account (soft delete or hard delete per policy)
- [ ] All account actions require confirmation and log to audit trail
- [ ] Super Admin must approve critical actions (delete, ban)

**R-013.8: Subscription Management**
- [ ] Support Admin can upgrade user's tier mid-cycle (pro-rata credit applied)
- [ ] Support Admin can downgrade user's tier (effective next billing cycle)
- [ ] Support Admin can extend trial by 7 days (user sees new trial end date)
- [ ] Support Admin can issue account credit (e.g., $5) applied to next invoice
- [ ] Subscription change is synced to Stripe within 60 seconds
- [ ] Change is logged in audit trail with before/after state

**R-013.9: System Overview Dashboard**
- [ ] Dashboard displays DAU, WAU, MAU (daily/weekly/monthly active users)
- [ ] Dashboard displays new signups (today, week, month)
- [ ] Dashboard displays trial conversion rate (%)
- [ ] Dashboard displays churn rate (cancellations / active subscribers)
- [ ] Dashboard displays MRR, ARPU, tier distribution
- [ ] Dashboard displays API latency (p50, p95) and error rate
- [ ] Metrics update every 5 minutes (or on-demand refresh)

**R-013.10: AI Usage Analytics**
- [ ] Query total messages sent by all users (today, week, month)
- [ ] Query total tokens consumed and estimated cost
- [ ] Query breakdown by model (Sonnet vs. Haiku usage %)
- [ ] Query average tokens per message
- [ ] Query cost per user (identify high-cost outliers)
- [ ] Export AI usage to CSV for further analysis

**R-013.11: Feature Flags**
- [ ] Create a feature flag (e.g., 'web_search_beta') in `feature_flags` table
- [ ] Flag is accessible in app (server-side or client-side check)
- [ ] Enabling/disabling flag takes effect within 1 minute
- [ ] Flag can be scoped globally or per-tier (tier-specific features)
- [ ] Gradual rollout (rollout_percent < 100) directs percentage of users to new feature
- [ ] Flag history is available for review

**R-013.12: Tier Limit Configuration**
- [ ] View current tier limits (tank count, message limits)
- [ ] Edit tier limits (e.g., increase max_tanks for Plus from 5 to 10)
- [ ] Change takes effect immediately for new resource creations
- [ ] Change does not affect existing resources (e.g., users who already have 6 tanks)
- [ ] Historical changes are logged with who/when

**R-013.13: AI System Prompt Management**
- [ ] View current system prompt and its version number
- [ ] View history of prompt versions (with dates and creator)
- [ ] Create a new prompt version (with change notes)
- [ ] Activate a new version (switch which version is used by AI)
- [ ] Ability to rollback to previous version
- [ ] A/B testing: flag experimental prompt for percentage of traffic

**R-013.14: Species & Equipment CRUD**
- [ ] Content Admin can add a new species (name, care requirements, photos)
- [ ] Content Admin can edit species (change care requirements, update photos)
- [ ] Content Admin can soft-delete species (retained in database)
- [ ] Content Admin can add/edit equipment defaults (categories, lifespan, intervals)
- [ ] Photos are stored in Supabase Storage and versioned
- [ ] Changes are logged in `content_versions` table

**R-013.15: Admin Account Management**
- [ ] Super Admin sends invite to new team member's email
- [ ] Invitation email is received and contains magic link
- [ ] New admin clicks link and sets up account
- [ ] Super Admin can change admin's role (super → content, etc.)
- [ ] Super Admin can revoke admin access (admin is logged out immediately)
- [ ] All admin account actions are logged in audit trail

**R-013.16: Custom Admin Dashboard UI (Phase 2)**
- [ ] Admin portal loads at /admin or admin.aquaticai.app
- [ ] Dashboard has sidebar navigation (Users, Content, Billing, Analytics, Settings)
- [ ] User search interface allows filtering and viewing user details
- [ ] Subscription management interface allows upgrade/downgrade/extend trial
- [ ] Analytics dashboard displays metrics with interactive charts
- [ ] Content management interface has CRUD forms for species, equipment, prompts
- [ ] All admin actions log to audit trail

**R-013.17: Two-Factor Authentication (2FA) (Phase 2)**
- [ ] Admin account creation requires 2FA setup
- [ ] Admin scans QR code and sets up TOTP in authenticator app
- [ ] Backup codes (10) are generated and displayed
- [ ] Every admin login requires 2FA code verification
- [ ] If admin loses authenticator app, they can use backup codes
- [ ] Super Admin can reset admin's 2FA (require email verification)

**R-013.18: IP Allowlisting (Phase 2)**
- [ ] Super Admin can set allowed IP list for admin portal
- [ ] Request from allowed IP can access /admin
- [ ] Request from non-allowed IP is denied (403)
- [ ] Alert is triggered if login attempted from non-whitelisted IP
- [ ] Allowlist can be updated without restart

**R-013.19: User Impersonation (Phase 2)**
- [ ] Support Admin can initiate impersonation from user detail view
- [ ] Impersonation session is created; admin sees app as user
- [ ] "Impersonation mode" banner is visible at top of app
- [ ] Actions taken during impersonation are logged (not attributed to user)
- [ ] Impersonation session expires after 30 minutes
- [ ] Admin can stop impersonation and return to admin portal

**R-013.20: Export User Data (Phase 2)**
- [ ] Support Admin can initiate data export for a user
- [ ] Export includes profile, tanks, parameters, AI conversations, subscription history
- [ ] Export is generated asynchronously (admin receives email with download link)
- [ ] Download link expires after 7 days
- [ ] Export is logged in audit trail with timestamp
- [ ] GDPR request can be fulfilled via export

**R-013.21: Failed Payment Management (Phase 2)**
- [ ] Admin sees list of failed payments with error details
- [ ] Admin can retry payment via Stripe API
- [ ] Admin can send custom email to user asking for payment method update
- [ ] Admin can issue one-time credit (instead of payment)
- [ ] Failed payments are categorized (card error, expired, insufficient funds)
- [ ] Grace period status is visible (e.g., "3 days until lockout")

**R-013.22: Coupon & Promo Code Management (Phase 2)**
- [ ] Super Admin can create coupon in Stripe Dashboard
- [ ] Coupon has code, discount amount, applicable tiers, expiration date
- [ ] Admin can view active coupons and usage (# of customers, total discount)
- [ ] Coupon usage is synced from Stripe
- [ ] Expired coupons are archived (not deleted)
- [ ] Coupons can be used at checkout

**R-013.23: Maintenance Mode (Phase 2)**
- [ ] Super Admin can toggle maintenance mode on/off
- [ ] Maintenance banner message is customizable
- [ ] When enabled, all users see banner; app is read-only or features disabled
- [ ] Maintenance config is stored and persists across restarts
- [ ] Estimated completion time is displayed to users
- [ ] API errors during maintenance show maintenance message instead of error details

**R-013.29: Admin Portal Separate Subdomain**
- [ ] Admin portal is deployed to distinct subdomain (admin.aquaticai.app or /admin)
- [ ] Admin portal has separate SSL certificate (if separate domain)
- [ ] Admin portal is excluded from search engine indexing (robots.txt)
- [ ] CORS headers prevent cross-origin admin API requests
- [ ] Admin cookies are Secure, HttpOnly, SameSite=Strict

**R-013.30: 2FA Mandatory**
- [ ] Admin account creation requires 2FA enrollment (not optional)
- [ ] 2FA is re-verified on every login (not cached)
- [ ] TOTP is the primary method; SMS is backup (Phase 2)
- [ ] Backup codes allow emergency access without authenticator app
- [ ] 2FA status is visible in admin account settings

**R-013.31: Session Timeout & Sensitive Action Re-Authentication**
- [ ] Admin session expires after 30 minutes of inactivity
- [ ] Sensitive actions (suspend, delete, refund) require re-authentication
- [ ] Re-authentication can be password + 2FA or just 2FA code
- [ ] Warning is shown 2 minutes before timeout (can be dismissed to extend)
- [ ] After timeout, user is logged out; next action requires login

**R-013.32: Audit Logging with IP & User Agent**
- [ ] Admin action is logged BEFORE execution (not after)
- [ ] Log includes admin_user_id, action, resource, IP, user_agent, timestamp
- [ ] Data modifications capture before/after snapshots (JSON)
- [ ] Logs are queryable by date, admin, action type, resource
- [ ] Super Admin can view all logs; other admins see only their own
- [ ] Logs are retained for >= 2 years

**R-013.33: Supabase RLS Policies**
- [ ] `admin_users` table is readable only by Super Admins
- [ ] User data is readable by Support Admins; sensitive fields (passwords, payment data) are excluded
- [ ] Species/equipment tables are readable/writable by Content Admins
- [ ] Audit log is readable only by Super Admins and the admin whose actions are logged
- [ ] Test: attempt to view forbidden data → query returns 0 rows (not error)

**R-013.34: Password & API Key Management**
- [ ] Admin passwords are hashed (bcrypt or Supabase Auth default)
- [ ] Stripe API keys are environment variables (not hardcoded)
- [ ] Database connection strings are environment variables
- [ ] No credentials are committed to GitHub (pre-commit hooks test)
- [ ] Credentials are rotated quarterly

---

**Document Status:** Initial Draft
**Last Updated:** 2026-02-07
**Author:** Product & Engineering Team
**Next Review:** After Phase 1 MVP launch
