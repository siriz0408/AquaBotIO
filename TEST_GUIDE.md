# AquabotIO — Test Guide for Automated Agents

> **Purpose:** This guide provides pre-seeded test user profiles and step-by-step workflow instructions for automated browser testing via Playwright MCP. Use these existing accounts instead of creating new ones.
>
> **App URL:** `http://localhost:3000`
>
> **Shared Password for ALL test accounts:** `TestPass123!`

---

## Test User Profiles

### Profile 1 — Maria Garcia (New User / Onboarding)

| Field | Value |
|---|---|
| Email | `maria.garcia@testaquabot.com` |
| Password | `TestPass123!` |
| Tier | Free |
| Status | Trialing (13 days remaining) |
| Skill Level | Beginner |
| Onboarding | **Not completed** (stuck at step 1) |
| Tanks | 0 |
| Livestock | None |

**Use this profile for:** First-time user flows, onboarding wizard, creating a first tank, initial AI chat interactions.

**Expected behavior after login:** Should be redirected to `/onboarding` since onboarding is incomplete.

---

### Profile 2 — Emily Chen (Active Starter User)

| Field | Value |
|---|---|
| Email | `emily.chen@testaquabot.com` |
| Password | `TestPass123!` |
| Tier | Starter ($9.99/mo) |
| Status | Active |
| Skill Level | Intermediate |
| Onboarding | Completed |
| Tanks | 1 — "Living Room Community" (29 gal freshwater) |
| Livestock | 10 Neon Tetras, 5 Corydoras, 3 Cherry Shrimp, 1 Pleco, 2 Java Ferns |

**Use this profile for:** Happy-path testing — logging parameters, chatting with AI, managing maintenance tasks, adding livestock, checking compatibility.

**Pre-existing data:**
- 8 water parameter readings (stable: pH 7.1–7.2, temp 75–77°F, ammonia 0, nitrite 0, nitrate 20–26 ppm)
- 3 maintenance tasks (water change due tomorrow, filter cleaning in 14 days, water testing in 3 days)
- 5 completed maintenance logs
- 6 AI chat messages (intermediate questions)
- 15 AI messages used today (daily limit: 100)

---

### Profile 3 — David Kim (Multi-Tank Plus User)

| Field | Value |
|---|---|
| Email | `david.kim@testaquabot.com` |
| Password | `TestPass123!` |
| Tier | Plus ($19.99/mo) |
| Status | Active |
| Skill Level | Advanced |
| Onboarding | Completed |
| Unit Preferences | **Celsius** / **Liters** |
| Tanks | 3 total |

**Tanks:**

| Tank Name | Type | Volume | Key Livestock |
|---|---|---|---|
| Reef Paradise | Saltwater | 75 gal | 2 Clownfish, 1 Royal Gramma, 1 Cleaner Shrimp, 1 Hermit Crab |
| Planted Paradise | Freshwater | 40 gal | 6 Cherry Barbs, 4 Corydoras, 5 Amano Shrimp, 3 Java Ferns, 2 Anubias, 1 Monte Carlo |
| Brackish Experiment | Brackish | 20 gal | 2 Bumblebee Gobies, 3 Indian Glassfish |

**Use this profile for:** Multi-tank workflows, switching between tanks, saltwater parameter logging (salinity, calcium, alkalinity, magnesium), unit preference display (Celsius/Liters), AI compatibility checks, advanced maintenance scheduling.

**Pre-existing data:**
- Water parameters across all 3 tanks (reef has full saltwater params)
- 7 maintenance tasks across tanks (4 on Reef Paradise, 3 on Planted Paradise)
- 4 completed maintenance logs
- 6 AI chat messages (advanced reef questions)
- 10 AI messages used today (daily limit: 200)

---

### Profile 4 — Mike Thompson (Canceled / Neglected)

| Field | Value |
|---|---|
| Email | `mike.thompson@testaquabot.com` |
| Password | `TestPass123!` |
| Tier | Starter |
| Status | **Canceled** (access until period end, ~5 days left) |
| Skill Level | Intermediate |
| Onboarding | Completed |
| Tanks | 1 — "Office Tank" (20 gal freshwater) |
| Livestock | 2 Guppies (alive), 1 Guppy "Spot" (**deceased**) |

**Use this profile for:** Testing canceled subscription behavior, degraded water quality scenarios, overdue maintenance alerts, deceased livestock handling, re-subscription flows.

**Pre-existing data:**
- Water parameters showing decline (ammonia 0.2 → 1.2 ppm, nitrite 0 → 0.4 ppm, nitrate climbing to 90 ppm, pH dropping 7.4 → 6.5)
- Water change overdue by 14 days
- Feeding overdue by 3 days

---

### Profile 5 — Sarah Johnson (Pro Power User)

| Field | Value |
|---|---|
| Email | `sarah.johnson@testaquabot.com` |
| Password | `TestPass123!` |
| Tier | Pro ($49.99/mo) |
| Status | Active |
| Skill Level | Advanced |
| Onboarding | Completed |
| Tanks | 5 total (4 active, 1 soft-deleted) |

**Tanks:**

| Tank Name | Type | Volume | Status |
|---|---|---|---|
| Main Display Reef | Saltwater | 150 gal | Active |
| Discus Palace | Freshwater | 75 gal | Active |
| Koi Pond | Pond | 1000 gal | Active |
| Quarantine Tank | Freshwater | 10 gal | Active |
| Nano Planted | Freshwater | 5 gal | **Deleted** |

**Use this profile for:** Pro-tier feature testing, unlimited AI chat, large tank counts, pond type, soft-deleted tank visibility, expert-level AI conversations, all maintenance and parameter features unlocked.

**Pre-existing data:**
- Full parameter histories across all active tanks
- Reef tank has complete saltwater params (calcium, alkalinity, magnesium)
- Discus tank has warm/acidic readings (pH 5.8–6.0, temp 84–86°F)
- Koi Pond has seasonal temperature variation (48–78°F)
- 4 maintenance tasks (on Main Display Reef only), 5 completed logs
- Livestock on Discus Palace: 5 Discus, 10 Neon Tetras, 3 Amazon Swords
- Koi Pond livestock: 8 Koi, 3 Goldfish (custom named)
- 31 AI messages used today (unlimited for Pro)

---

## Test Workflows

### Workflow 1: Login

**Steps:**
1. Navigate to `http://localhost:3000/login`
2. Enter the email in the `#email` input field
3. Enter `TestPass123!` in the `#password` input field
4. Click the "Sign in" button
5. Wait for redirect to `/dashboard` (or `/onboarding` for Maria)

**Verify:**
- Dashboard loads with the correct user name displayed
- Tank count matches the profile
- Subscription tier badge is visible

---

### Workflow 2: Complete Onboarding (Maria Garcia only)

**Prerequisite:** Login as `maria.garcia@testaquabot.com`

**Steps:**
1. After login, you should be on `/onboarding`
2. **Step 1 — Welcome:** Enter a name in the `#name` field → click Continue
3. **Step 2 — Tank Type:** Select "freshwater" from the tank type options → click Continue
4. **Step 3 — Tank Details:** Enter a tank name in `#tankName` (e.g., "My First Tank"), enter volume in `#volume` (e.g., "20") → click Continue
5. **Step 4 — Meet AI:** Read the AI intro → click Continue
6. **Step 5 — Complete:** Click "Go to Dashboard" or the finish button

**Verify:**
- Redirected to `/dashboard`
- New tank appears in the tank list
- Onboarding does not re-appear on next login

---

### Workflow 3: Create a New Tank

**Best profiles:** Emily Chen (can add up to 3 tanks on Starter), David Kim (up to 10 on Plus)

**Steps:**
1. Navigate to `/tanks/new` or click "Add Tank" from the dashboard
2. Fill in tank details:
   - **Name:** e.g., "Bedroom Nano"
   - **Type:** Select from freshwater / saltwater / brackish / pond
   - **Volume:** e.g., "10" (gallons)
   - **Dimensions** (optional): length, width, height
   - **Substrate** (optional): e.g., "Sand"
3. Click the "Create Tank" / submit button
4. Wait for redirect to the new tank's detail page

**Verify:**
- Tank appears in `/tanks` list
- Tank detail page shows correct info
- Tank count on dashboard increased by 1

**Edge case to test:** Try creating a tank that would exceed the tier limit (e.g., Emily already has 1 tank, Starter allows 3 — try creating 3 more to hit the limit).

---

### Workflow 4: Log Water Parameters

**Best profiles:** Emily Chen (freshwater), David Kim (saltwater — has salinity/calcium/etc.)

**Steps:**
1. Navigate to `/tanks/[tankId]/parameters` (click into a tank, then go to Parameters tab)
2. Fill in parameter values:
   - **pH:** e.g., `7.2`
   - **Temperature:** e.g., `76` (°F) or `24.4` (°C for David)
   - **Ammonia:** e.g., `0` (ppm)
   - **Nitrite:** e.g., `0` (ppm)
   - **Nitrate:** e.g., `20` (ppm)
   - For saltwater tanks (David's Reef Paradise), also fill:
     - **Salinity:** e.g., `1.025`
     - **Calcium:** e.g., `420` (ppm)
     - **Alkalinity:** e.g., `8.5` (dKH)
     - **Magnesium:** e.g., `1300` (ppm)
3. Click the submit / "Log Parameters" button

**Verify:**
- New reading appears in the parameter history
- Charts/graphs update with the new data point
- Values display in the correct units (°F vs °C, gallons vs liters for David)

**Validation ranges to know:**
- pH: 0–14
- Temperature: 32–120°F (0–48.9°C)
- All ppm values: ≥ 0

---

### Workflow 5: AI Chat

**Best profiles:** Emily Chen (has context), David Kim (reef questions), Sarah Johnson (unlimited)

**Steps:**
1. Navigate to `/chat` (general) or `/tanks/[tankId]/chat` (tank-specific)
2. Type a message in the chat input, for example:
   - For Emily: "My nitrate is reading 25 ppm, is that okay for my community tank?"
   - For David: "What should my calcium level be for my reef tank?"
   - For Sarah: "My discus seem stressed after a water change, what should I check?"
3. Press Enter or click Send
4. Wait for the AI response to stream in

**Verify:**
- AI responds with contextually relevant advice
- Response references the user's actual tank data (name, type, livestock)
- Message appears in chat history
- Token/message count increments (check via `/api/usage`)

**Rate limit test:** For Emily (Starter, 100/day limit, 15 already used), send many messages to approach the daily limit. At 100 messages, should see a rate limit error.

---

### Workflow 6: Add Livestock to a Tank

**Best profiles:** Emily Chen, David Kim

**Steps:**
1. Navigate to `/tanks/[tankId]/livestock`
2. Click "Add Livestock" or equivalent button
3. Search for a species (e.g., "Cardinal Tetra", "Blue Tang")
4. Select the species from results
5. Enter quantity (e.g., `6`)
6. Click Add / Submit

**Verify:**
- New livestock entry appears in the tank's livestock list
- Species info (care level, temperament) is displayed
- Total livestock count updates

---

### Workflow 7: Check Species Compatibility

**Best profiles:** Emily Chen (Starter — gets AI-enhanced checks), David Kim (Plus)

**Steps:**
1. Navigate to a tank's livestock page
2. Initiate adding a new species
3. Select a species to check compatibility, for example:
   - For Emily's community tank: try adding a "Betta" (known aggression issues with Neon Tetras)
   - For David's reef: try adding a species that conflicts with existing livestock
4. The compatibility check should run automatically before confirming

**Verify:**
- Compatibility result shows: "compatible", "caution", or "incompatible"
- Warnings display with severity tags (info / warning / danger)
- AI-enhanced response includes a score (1–5) and recommendation (Starter+ tiers)
- Free tier (if testing with James) shows only basic rule-based checks

---

### Workflow 8: Manage Maintenance Tasks

**Best profiles:** Emily Chen (tasks due soon), Mike Thompson (overdue tasks)

**Steps:**
1. Navigate to `/tanks/[tankId]/maintenance`
2. **View existing tasks** — confirm overdue/upcoming tasks display correctly
3. **Create a new task:**
   - Title: e.g., "Gravel Vacuum"
   - Type: Select from water_change, filter_cleaning, feeding, dosing, equipment_maintenance, water_testing, custom
   - Frequency: Select from once, daily, weekly, biweekly, monthly, custom
   - Next due date: Pick a date
   - Click Create
4. **Complete a task:**
   - Find an existing task (e.g., Emily's "25% Water Change" due tomorrow)
   - Click the Complete / checkmark button
   - Optionally add notes

**Verify:**
- New task appears in the list with correct frequency
- Completed task moves to history / logs
- Next due date recalculates based on frequency (e.g., weekly → 7 days from now)
- Overdue tasks show visual indicator (red/warning styling)

---

### Workflow 9: Update Profile / Settings

**Best profiles:** Any logged-in user

**Steps:**
1. Navigate to `/settings`
2. Click Edit (or the edit toggle)
3. Update fields:
   - **Full Name:** Change to a new name (e.g., "Emily C.")
   - **Experience Level:** Change the `#skillLevel` dropdown (beginner → intermediate → advanced)
   - **Volume Units:** Toggle between gallons and liters
   - **Temperature Units:** Toggle between Fahrenheit and Celsius
4. Click Save

**Verify:**
- Settings page reflects the updated values after save
- Dashboard and tank pages show new unit preferences
- Name change appears in the navigation/header

**Revert after testing:** Change values back to the original profile data.

---

### Workflow 10: Billing / Subscription Management

**Best profiles:** Emily Chen (active Starter), Mike Thompson (canceled)

**Steps:**
1. Navigate to `/billing`
2. View current subscription details (tier, status, renewal date)
3. For upgrade testing: Click "Upgrade" and select a higher tier
   - This opens a Stripe Checkout session (test mode)
4. For portal access: Click "Manage Subscription" to open Stripe Customer Portal

**Note:** Stripe test mode requires test card numbers. Use Stripe test card `4242 4242 4242 4242` with any future expiry and any CVC.

**Verify:**
- Current tier and status display correctly
- Upgrade flow redirects to Stripe Checkout
- After successful payment, subscription tier updates

---

## Quick Reference: Profile Selection by Workflow

| Workflow | Best Profile | Why |
|---|---|---|
| Login (basic) | Emily Chen | Happy path, lands on dashboard |
| Onboarding | Maria Garcia | Only incomplete onboarding user |
| Create Tank | Emily Chen | Room for 2 more tanks on Starter |
| Log Parameters (freshwater) | Emily Chen | Stable community tank |
| Log Parameters (saltwater) | David Kim | Reef tank with full saltwater params |
| AI Chat | Sarah Johnson | Pro tier, unlimited messages |
| Add Livestock | Emily Chen | Community tank with room for more |
| Compatibility Check | David Kim | Plus tier, AI-enhanced checks |
| Maintenance Tasks | Mike Thompson | Has overdue tasks to test alerts |
| Update Profile | Any user | All profiles have editable settings |
| Billing / Upgrade | Emily Chen | Active Starter, can upgrade |
| Canceled Sub Behavior | Mike Thompson | Canceled with 5 days access left |
| Past Due Behavior | Lisa Anderson | Plus tier with past_due status |
| Incomplete Signup | Alex Rivera | Email unconfirmed, signup not finished |

---

## Additional Test Accounts (Not primary, but available)

| User | Email | Tier | Status | Notes |
|---|---|---|---|---|
| James Wilson | `james.wilson@testaquabot.com` | Free | Trial Expired | Beginner with poor water quality, cycling tank |
| Lisa Anderson | `lisa.anderson@testaquabot.com` | Plus | Past Due | 2 tanks (reef + freshwater), payment failed |
| Alex Rivera | `alex.rivera@testaquabot.com` | Free | Incomplete | Email not confirmed, cannot log in normally |

---

## Notes for Agents

- **Do not create new accounts** unless specifically testing the signup flow. Always use these pre-seeded profiles.
- **Password is the same** for all accounts: `TestPass123!`
- **After destructive actions** (deleting a tank, deleting account), the seed data will need to be re-applied by running the seed script against the database.
- **AI chat responses** will vary each time since they use live Claude API calls. Verify the response is contextually relevant, not that it matches exact text.
- **Stripe operations** are in test mode. Use test card `4242 4242 4242 4242` for any payment flows.
- **Rate limits** are enforced. Emily has 15 of 100 daily AI messages used. David has 10 of 200. Sarah has unlimited.
- **Unit preferences** matter: David Kim uses Celsius/Liters. All others use Fahrenheit/Gallons. Verify units display correctly per user.
