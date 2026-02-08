# Authentication & Onboarding — Feature Specification
**Aquatic AI | R-009, R-012 | P0 — Must-Have**

## Problem Statement
Aquarium hobbyists are not tech-savvy power users — they're people passionate about their fish. Every friction point in signup and onboarding costs users who would otherwise love the product. However, different users have different security and authentication preferences. Some users prefer the frictionless experience of passwordless magic links; others trust traditional email and password authentication; still others want the convenience and security of signing in with their Google account. By supporting multiple authentication methods, Aquatic AI removes barriers for all user types while maintaining security and a fast path to value.

## Goals
- Support 3 authentication methods (email/password, Google OAuth, magic link) to accommodate user preference and security expectations
- All authentication methods complete signup or login in under 60 seconds
- Onboarding completion rate > 70% (user creates first tank + logs initial parameters)
- Time to first value: users receive their first personalized AI recommendation within 10 minutes of signup, regardless of auth method chosen
- Progressive disclosure — don't overwhelm with all features; reveal capabilities as users explore
- Trial activation: > 80% of free trial users engage with AI chat in first 3 days

## Non-Goals
- NG1: Multi-factor authentication (MFA) — not needed for consumer hobby app in v1; P2 feature for security-conscious users
- NG2: Team/organization accounts — single-user accounts only
- NG3: Admin panel or user management dashboard — internal tooling is separate
- NG4: Apple Sign-In — P2 feature; prioritize email/password, Google OAuth, and magic link in v1

## User Stories

### Authentication
- US-30: As a new user, I want to sign up with just my email via magic link, so that onboarding is fast and frictionless without creating a password.
- US-30a: As a new user, I want to sign up with email and a password using traditional signup, so that I have a familiar authentication experience.
- US-30b: As a new user, I want to sign up by clicking "Sign in with Google," so that I can use my existing Google account without creating new credentials.
- US-auth1: As a returning user with email/password, I want to log in by entering my credentials, so I can quickly access my tanks and recommendations.
- US-auth1a: As a returning user, I want to log in by entering my email and clicking a magic link, so I never need to remember a password.
- US-auth1b: As a returning user, I want to log in with a single tap using "Sign in with Google," so I can authenticate with minimal friction.
- US-auth2: As a user, I want my session to persist across browser sessions, so I don't need to re-authenticate every time I open the app.
- US-auth3: As a user on a shared device, I want to log out securely, so my data isn't accessible to others.
- US-auth4: As a user who forgot their password, I want to reset it via email link, so I can regain access to my account.
- US-auth5: As a user who signs up with email/password and later tries to sign in with Google using the same email, I want my accounts to be linked automatically, so I can use either method interchangeably.

### Onboarding
- US-34: As a new user, I want a guided onboarding flow that helps me set up my first tank profile (type, size, livestock, parameters), so that the AI has enough context to be immediately useful.
- US-35: As a new user, I want the AI to greet me and walk me through what it can do, so I understand the value right away.
- US-onboard1: As a new user, I want to skip optional steps and come back to them later, so I'm not forced to complete everything before using the app.
- US-31: As a free trial user, I want to experience the full app for 14 days, so I can evaluate whether it's worth paying for.

## Requirements

### Must-Have (P0)

**R-009: Multi-Method Authentication**

**R-009.1: Email/Password Authentication**

Traditional email and password signup and login.

- **Signup flow**: User enters email and password → Email verification link sent → User clicks link to verify → Account created and authenticated → Redirected to onboarding
- **Login flow**: User enters email and password → Credentials validated → Session created → Redirected to dashboard
- **Password requirements**: Minimum 8 characters, at least 1 uppercase letter, at least 1 number, at least 1 special character (configurable via Supabase Auth)
- **Email verification**: Required before account is fully activated; verification link valid for 24 hours
- **Acceptance**: Given a new user enters a valid email and password meeting requirements, they receive a verification email within 30 seconds. Given they click the verification link, their account is created and they are authenticated. Given a user attempts to login with incorrect credentials, they see an error message after 1 second. Given 5 failed login attempts, the account is locked for 15 minutes with a message explaining the lockout.

**R-009.2: Google OAuth (Sign in with Google)**

Single sign-on via Google account using Supabase Auth Google provider.

- **One-tap sign in**: "Sign in with Google" button on login/signup page; one-tap on supported browsers
- **First-time flow**: User clicks "Sign in with Google" → Google auth popup/redirect → User grants permission → Account created automatically → Profile info (name, avatar) pulled from Google profile → Authenticated → Redirected to onboarding
- **Returning user flow**: User clicks "Sign in with Google" → Google auth popup → Account linked and authenticated → Redirected to dashboard
- **Profile data**: Extract name and profile picture from Google profile; auto-populate display_name and avatar_url
- **Acceptance**: Given a user clicks "Sign in with Google" and completes Google's OAuth flow, they are authenticated within 10 seconds and redirected appropriately. Given they authorize the app, their Google profile picture and name are saved to their Aquatic AI profile. Given a user completes signup via Google, they land on onboarding; given they already have an account, they land on their dashboard.

**R-009.3: Magic Link Authentication**

Passwordless authentication via email link (OTP provider).

- **Unified flow**: Single signup/login flow (no distinct "sign up" vs "log in" — system handles both transparently)
- **Signup**: User enters email → Magic link sent → User clicks link → Account created and authenticated → Redirected to onboarding
- **Login**: User enters email → Magic link sent → User clicks link → Authenticated → Redirected to dashboard
- **Link expiration**: Magic links valid for 15 minutes
- **Email delivery**: Magic link delivered within 30 seconds of request
- **Acceptance**: Given a user enters their email on the magic link screen, they receive a magic link within 30 seconds. Given they click the link, they are authenticated and redirected appropriately (onboarding for new users, dashboard for returning). Given a user clicks an expired magic link (>15 min old), they see a message explaining the link has expired and are offered to request a new one.

**R-009.4: Session Management**

JWT-based sessions via Supabase Auth with automatic token refresh.

- **Token lifetime**: 1-hour access token; 7-day refresh token
- **Session persistence**: Sessions persist across browser restarts via HTTP-only cookies or secure localStorage
- **Token refresh**: Automatic hourly refresh without user action
- **Session expiration**: If refresh token expires after 7 days, user is logged out and redirected to login
- **Acceptance**: Given a user authenticates via any method, their session persists for 7 days without re-authentication. Given they close and reopen the browser within 7 days, they remain logged in. Given the 7-day window passes, they are prompted to re-authenticate via their preferred method.

**R-009.5: Account Linking**

Automatic linking of accounts when a user attempts to authenticate with the same email via a different method.

- **Scenario 1**: User signs up with email/password. Later, they try to sign in with Google using the same email → System detects account exists → Accounts are linked → User is authenticated
- **Scenario 2**: User signs up with Google. Later, they try to sign in with magic link using the same email → System detects account exists → Accounts are linked → User is authenticated
- **UX**: No extra steps for user; linking happens transparently behind the scenes
- **Acceptance**: Given a user signs up via email/password with user@example.com, and later attempts to sign in with Google using user@example.com, the system links the accounts transparently. Given they authenticate via either method, they access the same account and see the same data.

**R-009.6: Auth State Management**

App-wide authentication state with protected routes and proper loading states.

- **Auth context**: App-level React context providing auth state (authenticated, loading, error, user object)
- **Protected routes**: Unauthenticated users navigating to protected routes are redirected to /login with a return-to parameter for post-auth redirect
- **Loading states**: During auth initialization and login/signup, show loading spinner or skeleton; never flash unauthenticated state
- **Acceptance**: Given an unauthenticated user navigates to /dashboard, they're redirected to /login. Given auth is initializing, a loading indicator is shown (not a login page flash). Given a user completes auth, they're redirected to the intended route or onboarding as appropriate.

**R-009.7: Logout**

Secure session termination across all methods.

- **Action**: User clicks logout → All session tokens cleared → Local auth state reset → Redirect to /login
- **Behavior**: All auth methods (email/password, Google OAuth, magic link) logout identically
- **Acceptance**: Given a user logs out, all session data is cleared from cookies/storage and the app navigates to /login. Given they navigate to a protected route immediately after logout, they're redirected to login.

**R-009.8: Email Validation & Password Requirements**

Input validation and security constraints.

- **Email validation**: Validate email format using RFC 5322 compliant regex before any auth action; show inline errors for invalid format
- **Email uniqueness**: Prevent signup with already-registered email; if email exists, offer to login instead
- **Password requirements**: Minimum 8 characters, at least 1 uppercase (A-Z), at least 1 number (0-9), at least 1 special character (!@#$%^&*), no repeating characters
- **Password feedback**: Show real-time validation feedback (e.g., "Password must contain a number") as user types
- **Acceptance**: Given a user enters an invalid email format, the form shows an inline error immediately. Given they enter a weak password, validation feedback explains what's missing. Given they try to sign up with an already-registered email, the form offers to log them in instead.

**R-009.9: Password Reset**

Self-service password recovery for email/password users.

- **Flow**: User clicks "Forgot password" → Enters email → Password reset link sent via email → User clicks link → Sets new password → Redirected to login
- **Link expiration**: Reset links valid for 24 hours
- **Acceptance**: Given a user requests a password reset, they receive an email within 30 seconds. Given they click the reset link, they're shown a form to set a new password. Given they complete the form, their password is updated and they're redirected to login.

**R-009.10: Password Change**

Logged-in users can change their password from Settings.

- **Flow**: User navigates to Settings → Security → Change Password → Enters current password → Enters new password (with confirmation) → Submits → Password updated
- **Requirements**: Requires current password confirmation before allowing change. New password must meet standard password requirements.
- **Session behavior**: All other active sessions are invalidated upon password change for security.
- **Acceptance**: Given a logged-in user enters their current password correctly and a valid new password, their password is updated. Given they enter an incorrect current password, the form shows an error. Given the password is changed, all other sessions are logged out.

**R-009.11: Email Change**

User can change their email address from Settings.

- **Flow**: User navigates to Settings → Account → Change Email → Enters new email → Confirms with current password → Verification email sent to new address → User clicks verification link → Email updated
- **Requirements**: Requires current password confirmation. New email must be unique (not already registered).
- **Notifications**: Old email receives notification that email change was initiated. New email receives verification link.
- **Acceptance**: Given a user requests an email change with valid password confirmation, a verification email is sent to the new address within 30 seconds. Given the user clicks the verification link, their email is updated. Given the old email owner did not initiate the change, they can report unauthorized activity.

**R-009.12: Account Deletion**

User can delete their account from Settings.

- **Flow**: User navigates to Settings → Account → Delete Account → Confirms by typing "DELETE" and entering password → Account soft-deleted → Confirmation email sent
- **Behavior**:
  - Soft-delete user record (set `deleted_at` timestamp)
  - Anonymize historical data (replace email, display_name with placeholders)
  - Cancel active Stripe subscription immediately
  - Send confirmation email to user's email
  - 30-day grace period before hard delete (user can contact support to restore)
- **Data handling**: All user-generated content (tanks, parameters, conversations, photos) is deleted after the 30-day grace period.
- **Acceptance**: Given a user confirms account deletion, their account is soft-deleted immediately and they are logged out. Given the 30-day grace period passes, the account and all associated data are permanently deleted.

**R-012: Onboarding Flow**

Consistent onboarding experience regardless of authentication method chosen.

**R-012.1: Welcome Screen**

Introduction to Aquatic AI and the AI assistant, shown immediately after first authentication.

- **Content**: Welcome message, brief description of AI capabilities, hero image or video (optional)
- **Shown to**: Brand-new users only (tracked via onboarding_completed flag); returning users skip to dashboard
- **Next action**: Primary CTA to proceed to tank creation
- **Acceptance**: Given a brand-new user authenticates for the first time via any method, they see the welcome screen. Given a returning user logs in, they skip the welcome screen and land on their dashboard.

**R-012.2: Tank Creation**

Guided form to create the first tank profile with essential information.

- **Required fields**: Tank name, tank type (freshwater, saltwater, brackish, planted, reef, etc.), volume (gallons or liters with unit selector)
- **Optional fields**: Substrate type, dimensions, livestock count (can be added later)
- **Time estimate**: Under 2 minutes to complete
- **Next action**: Proceed to optional parameter entry or skip to dashboard
- **Acceptance**: Given a user enters name, type, and volume, they can proceed. Given they skip optional fields, they can complete tank creation in under 2 minutes. Given they complete this step, they have a tank profile visible on the dashboard.

**R-012.3: Initial Parameter Entry**

Optional step to log first water test results; shown parameters relevant to the chosen tank type.

- **Conditional display**: Prioritize parameters by tank type (freshwater users see pH, ammonia, nitrite, nitrate; saltwater users see salinity, calcium, alkalinity)
- **Optional**: Users can skip this step; they can log parameters later from the dashboard
- **AI context**: Parameters logged here are available for AI recommendations immediately
- **Acceptance**: Given a freshwater user, they see freshwater-relevant parameters prioritized. Given they skip this step, they can log parameters later from the dashboard and still receive AI recommendations.

**R-012.4: First AI Interaction**

The AI greets the user, acknowledges their setup, and provides a first personalized insight.

- **Trigger**: After tank creation (or skip)
- **Content**: Contextual greeting referencing the user's tank type/setup + at least one actionable recommendation (e.g., "I see you're setting up a 55-gallon freshwater tank. Here's what I'd prioritize for water quality this week...")
- **Format**: AI chat opening message; user can respond or proceed to dashboard
- **Acceptance**: Given onboarding is complete, the AI chat opens with a contextual greeting referencing the user's tank setup and provides at least one actionable recommendation.

**R-012.5: Progressive Disclosure**

Reveal features gradually through tooltips, contextual hints, and AI suggestions rather than all at once.

- **Implementation**: After onboarding, show 2-3 contextual hints on the dashboard pointing to key features (e.g., "Try asking me about water changes," "Log your livestock here")
- **Dismissal**: Users can dismiss hints; dismissed hints don't reappear
- **Timing**: Hints appear over the first week based on user interactions (e.g., hint about water change recommendations appears after user logs parameters)
- **Acceptance**: Given a user completes onboarding, they see the main dashboard with 2-3 contextual hints pointing to key features. Given they dismiss a hint, it doesn't reappear.

**R-012.6: Skip/Resume**

Users can skip optional onboarding steps; incomplete steps are accessible later.

- **Tracking**: Onboarding completion status tracked in users table (onboarding_completed boolean, onboarding_skipped_steps array)
- **Resume**: Users can access skipped steps from Settings → Finish Setup or via gentle prompts on the dashboard
- **Gentle prompts**: If user skips parameter entry, dashboard shows a light prompt to complete setup (e.g., "Ready to log your first water test?")
- **Acceptance**: Given a user skips parameter entry, they land on the dashboard with a gentle prompt to complete setup. Given they return to the app, skipped steps are accessible from settings.

### Nice-to-Have (P1)
- **R-009.10: Two-Factor Authentication (2FA)** — Optional security enhancement for users who want additional account protection (P2 feature)
- **R-012.7: Onboarding Checklist** — Persistent checklist showing setup progress (create tank ✓, add livestock, log parameters, etc.) with reward/gamification
- **R-012.8: Video Walkthrough** — Optional short video overview of key features during onboarding

### Future Considerations (P2)
- **R-009.11: Apple Sign-In** — OAuth via Apple as an additional sign-in method for iOS users
- **R-012.9: Tank Type-Specific Onboarding** — Different onboarding paths for freshwater beginners vs. reef keepers vs. advanced users
- **R-009.12: Social Account Linking UI** — Dashboard interface for users to link/unlink multiple authentication methods

## Success Metrics

### Leading
- **Multi-method adoption**: Measure signup distribution: email/password %, Google OAuth %, magic link %
- **Signup completion**: > 85% of users who reach the auth screen complete authentication
- **Auth method completion**: All three methods achieve > 30 seconds median signup time
- **Onboarding completion**: > 70% of signups complete onboarding (create tank + first AI interaction)
- **Time to first value**: < 10 minutes from signup to first personalized AI recommendation
- **Magic link delivery**: 95%+ of magic links delivered within 30 seconds
- **Google OAuth success**: 95%+ of users who click "Sign in with Google" complete authentication

### Lagging
- **Trial activation**: > 80% of free trial users engage with AI chat in first 3 days
- **7-day retention**: > 60% of signups return after 7 days
- **Onboarding drop-off**: < 30% abandon during onboarding flow
- **Auth-related support tickets**: < 2% of users contact support about login/signup issues
- **Failed login rate**: < 5% of login attempts fail

## Auth UI Design

### Login & Signup Page Layout

The login page presents all three authentication options to maximize user choice:

1. **"Sign in with Google" Button** (prominent, top)
   - Google branding guidelines: blue button with Google logo
   - Text: "Continue with Google"
   - Positioned above traditional methods

2. **Email/Password Form** (traditional)
   - Tab toggle: "Sign In" / "Sign Up"
   - Sign In: Email input + Password input + "Forgot password?" link + "Sign in" button
   - Sign Up: Email input + Password input + Password confirmation + Password strength indicator + "Sign up" button
   - Error states for invalid email, weak password, incorrect credentials
   - Success state showing "Check your email" after signup

3. **"Sign in with Magic Link" Option** (alternative)
   - Link or button: "Sign in with Magic Link"
   - Opens modal/overlay: Email input → "Send magic link" button → "Check your email" confirmation
   - Positioned below traditional methods as an alternative for users who prefer passwordless

### Responsive & Accessible
- Centered single-column layout on mobile; 2-column on desktop (method options on left, sign-in form on right, optional)
- All buttons meet WCAG AA contrast standards
- Form fields labeled with associated text inputs
- Error messages clearly associated with invalid fields
- Keyboard navigation: Tab through all inputs and buttons; Enter submits forms

## Decisions (Resolved)

The following questions from the original spec have been resolved:

- **Magic link expiration**: 15 minutes ✅ DECIDED
- **Landing page after auth**: Dashboard for returning users, onboarding for new users ✅ DECIDED
- **Deep linking**: Magic link clicks redirect to authenticated session on the same session; if clicked on different device, user re-authenticates and is redirected ✅ DECIDED
- **Onboarding AI vs UI**: Hybrid — structured forms with AI greeting at end and progressive disclosure ✅ DECIDED
- **Privacy policy**: Show during signup flow; acceptance required before account creation ✅ DECIDED
- **Multi-method preference**: All three methods supported equally; no deprecation planned for any method ✅ DECIDED
- **Account linking**: Automatic on same-email signup via different method ✅ DECIDED
- **Session timeout**: 7-day refresh token lifetime; users auto-logout if inactive beyond 7 days ✅ DECIDED

## Technical Notes

### Data Model

Extend the existing users table to support multi-method authentication:

```
users {
  id: UUID (Supabase Auth user_id)
  email: TEXT (unique, indexed)
  email_verified: BOOLEAN (required for email/password method)
  display_name: TEXT (auto-populated from Google profile or user-provided)
  avatar_url: TEXT (auto-populated from Google profile)
  auth_method: TEXT (enum: 'email_password', 'google', 'magic_link' — primary method used last)
  linked_auth_methods: JSONB (array: ['email_password', 'google'] if accounts are linked)
  subscription_tier: TEXT (enum: 'free', 'starter', 'plus', 'pro')
  trial_end_date: TIMESTAMP (nullable; set to 14 days from now on signup)
  stripe_customer_id: TEXT (nullable; set when user upgrades)
  onboarding_completed: BOOLEAN (default: false; set to true after R-012.6)
  onboarding_skipped_steps: JSONB (array of step IDs skipped during onboarding)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  last_login: TIMESTAMP
}
```

### Supabase Auth Configuration

**Email/Password Provider**:
- Enable in Supabase Dashboard → Authentication → Providers → Email
- Configure: Email confirmations enabled, auto-confirm disabled (users must click verification link)
- Email template: Customized confirmation email with branding
- Password requirements: Configure minimum entropy, special characters requirement

**Google OAuth Provider**:
- Enable in Supabase Dashboard → Authentication → Providers → Google
- Configure: OAuth 2.0 Client ID and Client Secret from Google Cloud Console
- Authorized redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`
- Scopes: `email`, `profile` (Supabase handles this by default)
- Auto-confirmation: Enable (Google verification is sufficient)

**Magic Link (OTP) Provider**:
- Enable in Supabase Dashboard → Authentication → Providers → Email (toggle "Email Link")
- Configure: OTP (One-Time Password) expiration to 15 minutes
- Email template: Customized magic link email with branding
- Auto-confirmation: Enable (clicking the link confirms the email)

### Frontend Implementation

**Auth Context Provider**:
- React context wrapping the entire app
- State: `{ user, session, loading, error, methods: { signUpEmail, logInEmail, signInGoogle, sendMagicLink, resetPassword, logout } }`
- Initialization: On app load, check Supabase session and restore auth state

**Protected Route Component**:
```
<ProtectedRoute
  component={Dashboard}
  fallback={<Login />}
/>
```
Redirect unauthenticated users to `/login`; show loading state during auth check.

**Login/Signup Component**:
Implement all three methods with error handling, loading states, and form validation.

### Email Templates

Customize Supabase email templates for all three providers:
- **Email confirmation** (email/password): Include branding, CTA button with verification link, expiration info
- **Magic link**: Include branding, CTA button with magic link, 15-minute expiration warning
- **Password reset**: Include branding, CTA button with reset link, 24-hour expiration
- All templates should include footer with support contact and unsubscribe (if applicable)

### Security Considerations

**Rate Limiting**:
- Login attempts: 5 failed attempts within 15 minutes → 15-minute account lockout
- Signup attempts: 10 per IP per hour
- Magic link requests: 3 per email per hour
- Password reset requests: 3 per email per hour

**CSRF Protection**:
- All auth forms include CSRF tokens (Supabase handles this automatically)
- State parameter validation on OAuth callbacks (Supabase handles this)

**Password Security**:
- Minimum 8 characters, 1 uppercase, 1 number, 1 special character (enforced client and server-side)
- Passwords hashed with bcrypt (handled by Supabase Auth)
- Password reset tokens valid for 24 hours

**OAuth Security**:
- State parameter validation on Google OAuth callback (Supabase handles)
- PKCE flow for authorization code exchange (Supabase uses this by default)
- Secure redirect to authorized URIs only

**Email Verification**:
- Required for email/password accounts before full functionality (dashboard blocked until verified)
- Verification tokens valid for 24 hours; users can request new token
- Magic link and Google OAuth auto-verify (no additional step)

**Session Security**:
- HTTP-only cookies for token storage (prevents XSS token theft)
- Secure flag on cookies (HTTPS-only transmission)
- SameSite=Lax on cookies (CSRF protection)
- Automatic token refresh every hour (users stay logged in, tokens rotate)

## Timeline Considerations

### Phase 1 (MVP)
- **Milestone 1a**: Magic link auth (foundational, fastest to implement)
- **Milestone 1b**: Email/password auth (traditional fallback)
- **Milestone 1c**: Google OAuth (modern convenience)
- **Milestone 1d**: Onboarding flow (same flow for all methods)
- **Dependency**: Supabase project setup, email provider (SendGrid or similar) configured, Google Cloud Console OAuth app created
- **Dependency**: Tank Profile Management (R-002) for onboarding tank creation step
- **Dependency**: AI Chat Engine (R-001) for onboarding AI interaction

### Implementation Order Recommendation

1. **Supabase Auth setup** (all providers): Email/password, magic link, Google OAuth
2. **Backend data model**: users table with multi-method support, session management
3. **Frontend auth context**: Manage auth state across the app
4. **Email/password auth UI + flows**: Signup, login, password reset
5. **Magic link auth UI + flows**: Signup/login unified flow
6. **Google OAuth UI + flow**: One-tap sign-in button and callback handling
7. **Account linking logic**: Detect and link same-email accounts across methods
8. **Onboarding flow**: Welcome, tank creation, parameter entry, first AI interaction, progressive disclosure
9. **Testing + security review**: Rate limiting, CSRF protection, XSS prevention, session handling

### Dependencies & Blockers
- Auth is the FIRST feature implemented — all other features depend on it
- Cannot proceed with Tank Profile Management or AI Chat until users can authenticate
- Stripe billing integration depends on users table and subscription tracking
- Analytics depends on having authenticated users to track

---

## Implementation Status

**Last Updated:** 2026-02-08

### Completed ✅

| Requirement | Implementation | Files |
|-------------|----------------|-------|
| **R-009.1 Email/Password** | Login API with validation, rate limiting | `src/app/api/auth/login/route.ts` |
| **R-009.3 Magic Link** | Magic link API with rate limiting | `src/app/api/auth/magic-link/route.ts` |
| **R-009.9 Password Reset** | Full forgot/reset flow with rate limiting | `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/(auth)/forgot-password/page.tsx`, `src/app/auth/reset-password/page.tsx` |
| **Rate Limiting** | 5 attempts per 15 minutes per IP using @upstash/ratelimit | `src/lib/rate-limit.ts` |
| **Password Validation** | 8+ chars, uppercase, lowercase, number | `src/app/api/auth/reset-password/route.ts` |
| **User Enumeration Prevention** | Generic error messages on auth endpoints | All auth API routes |

### Implementation Details

**Rate Limiting Infrastructure:**
```typescript
// src/lib/rate-limit.ts
// Uses @upstash/ratelimit with in-memory fallback for development
// Sliding window: 5 requests per 15 minutes
export async function checkAuthRateLimit(identifier: string): Promise<RateLimitResult>
export function getClientIp(request: Request): string
```

**Auth API Routes Created:**
- `POST /api/auth/login` - Email/password login with rate limiting
- `POST /api/auth/magic-link` - Magic link request with rate limiting
- `POST /api/auth/forgot-password` - Password reset request with rate limiting
- `POST /api/auth/reset-password` - Set new password after reset link

**Password Reset UI:**
- `/forgot-password` - Email input form, success state
- `/auth/reset-password` - New password form with real-time validation

### Pending ⏳

| Requirement | Notes |
|-------------|-------|
| R-009.2 Google OAuth | Supabase configured, UI integration pending |
| R-009.5 Account Linking | Automatic via Supabase, needs testing |
| R-009.10 Password Change | Settings page not yet built |
| R-009.11 Email Change | Settings page not yet built |
| R-009.12 Account Deletion | Settings page not yet built |
| R-012 Onboarding Flow | Wizard implemented, AI greeting pending |
