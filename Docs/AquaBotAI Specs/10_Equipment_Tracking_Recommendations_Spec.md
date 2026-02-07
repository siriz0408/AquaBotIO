# Equipment Tracking & AI Recommendations — Feature Specification

**Aquatic AI | R-102, R-103 | P1 — Nice-to-Have (Fast Follow)**

---

## Problem Statement

Aquarium equipment — filters, heaters, lights, protein skimmers, dosing pumps — is the life support system of every tank. Equipment failures are one of the leading causes of catastrophic fish loss. Yet hobbyists rarely track when equipment was purchased, when it last received maintenance, or when it's approaching end-of-life. Separately, choosing the right equipment is overwhelming — hundreds of options with conflicting reviews.

Aquatic AI combines equipment lifecycle tracking with AI-powered, web-search-based equipment recommendations personalized to each user's specific tank setup. This specification covers two related P1 features: **R-102 (Equipment Tracking)** and **R-103 (AI Equipment Recommendations via Web Search)**.

---

## Goals

1. Let users catalog all equipment per tank with key details (brand, model, purchase date, settings).
2. Proactively remind users when equipment needs maintenance or replacement based on typical lifespans.
3. Provide AI-driven equipment recommendations via real-time web search with actual products, pricing, and review summaries.
4. Equipment recommendations personalized to the user's tank type, size, livestock, and existing equipment.
5. Equipment web search is a Pro tier ($14.99/mo) exclusive — a key upgrade incentive.
6. Enable data-driven equipment decisions and reduce unplanned downtime.

---

## Non-Goals

- **NG1:** E-commerce or affiliate purchasing through the app — recommendations only, no buy buttons in v1.
- **NG2:** IoT integration with smart equipment — manual tracking only.
- **NG3:** Equipment warranty tracking or claims management.
- **NG4:** Used equipment marketplace.
- **NG5:** Equipment comparison tool (side-by-side specs) — P2 consideration.
- **NG6:** Equipment rental or loan tracking.

---

## User Stories

### Core
- **US-23:** As a hobbyist, I want to catalog my equipment (filters, heaters, lights, dosing pumps) with details like model, purchase date, and settings, so the AI has a complete picture of my setup.
- **US-24:** As a hobbyist, I want the AI to perform real web searches to find and recommend specific equipment with actual product info, pricing, and reviews, so I get actionable buying recommendations.
- **US-25:** As a hobbyist, I want the AI to alert me when equipment may need maintenance or replacement based on typical lifespans, so I prevent equipment failures.

### Extended
- **US-equip1:** As a hobbyist, I want to log equipment settings (flow rate, temperature setting, light schedule), so the AI can factor these into its analysis.
- **US-equip2:** As a new hobbyist setting up a tank, I want the AI to recommend a complete equipment list based on my tank type and size, so I buy the right stuff from the start.
- **US-equip3:** As a Pro user, I want equipment recommendations to include pricing and where to buy, so I can make informed purchase decisions immediately.
- **US-equip4:** As a hobbyist, I want to see the age and maintenance history of my equipment, so I understand which pieces are due for attention.

---

## Requirements

### Must-Have (P0 for this feature)

#### **R-102: Equipment Tracking**

**R-102.1: Equipment Catalog Per Tank**
- Users can add equipment entries with the following fields:
  - **Equipment Type** (dropdown): filter, heater, light, protein skimmer, powerhead, dosing pump, controller, test kit, substrate, media, carbon, or custom type
  - **Brand** (text input)
  - **Model** (text input)
  - **Purchase Date** (date picker)
  - **Settings/Notes** (textarea): flow rate, wattage, light intensity schedule, temperature set point, etc.
  - **Photo** (optional file upload)
  - **Purchase Price** (optional decimal)
  - **Location** (optional): e.g., "filter chamber 1", "sump"

- **Acceptance Criteria:**
  - Given a user adds a filter with brand "Fluval", model "304", purchase date "2023-08-15", and settings "flow rate: 1000 LPH", it appears in their tank's equipment list.
  - Given a user selects equipment type "other", they can specify a custom type name.
  - Equipment entries persist in Supabase and are scoped to the tank.

**R-102.2: Equipment Lifespan Tracking**
- System maintains a configurable table of default lifespans for common equipment types:
  - **Filter media:** 3-6 months (configurable by type)
  - **Heater:** 2-3 years
  - **Light bulb/LED (conventional):** 12-18 months
  - **LED strips (modern):** 3-5 years
  - **Protein skimmer:** 2-5 years (if marine)
  - **Powerhead/circulation pump:** 2-4 years
  - **Dosing pump:** 3-7 years
  - **Controller:** 3-5 years
  - **Carbon media:** 2-4 weeks
  - **Substrate:** 5-10+ years (stable)

- Equipment age is calculated as `(today - purchase_date)` in months.
- System tracks and displays "time remaining" for each piece of equipment.

- **Acceptance Criteria:**
  - Given a user's filter media was purchased 5 months ago and the typical lifespan is 6 months, the system calculates "1 month remaining" and displays a warning status.
  - Given a filter media has exceeded its lifespan, the system displays "overdue for replacement" status in red.
  - Lifespan data can be updated by admins and per-tank customizations can override defaults.

**R-102.3: Maintenance & Replacement Reminders**
- Proactive alerts when equipment approaches end-of-life or a user-defined maintenance interval:
  - Alert triggers when equipment is **within 2 weeks of expected maintenance interval**.
  - Alerts are sent via the existing push notification system (see R-001: Notification System).
  - Users can snooze or dismiss alerts, and mark equipment as "maintained" to reset the lifespan clock.
  - Reminders are batched (one push per day max per tank) to avoid notification fatigue.

- **Acceptance Criteria:**
  - Given equipment is 2 weeks away from its expected maintenance date, user receives a push notification: "Your Fluval 304 filter is due for media change in ~2 weeks".
  - Given a user marks equipment as "serviced", the maintenance timer resets to today.
  - Given equipment is overdue, notifications escalate to higher urgency (e.g., color, frequency).

**R-102.4: Equipment List View**
- Visual list of all equipment per tank displaying:
  - Equipment type icon
  - Brand and model
  - Age (e.g., "6 months old")
  - Time remaining (e.g., "2 months remaining" or "overdue")
  - Health status badge: **Good** (green), **Due Soon** (yellow), **Overdue** (red)
  - Last maintenance/service date (if available)
  - Quick action button: edit, delete, or mark as serviced

- Equipment can be sorted by:
  - Type (filters, heaters, etc.)
  - Age (newest/oldest)
  - Status (overdue first)
  - Due date (soonest first)

- **Acceptance Criteria:**
  - Given a tank with 5 pieces of equipment, all are visible with clear status indicators and type icons.
  - Given the user filters by "status = overdue", only overdue equipment is displayed.
  - Given equipment is marked as "maintained", its status resets to "Good" and timer restarts.

**R-102.5: Edit & Remove Equipment**
- Users can update equipment details:
  - Edit brand, model, purchase date, settings, photo, or any field.
  - Remove equipment with a required "reason": replaced, removed, failed, sold, or other.
  - Removed equipment is archived (soft delete) and can be viewed in a history tab.
  - Removing equipment logs the action for audit trail and historical reference.

- **Acceptance Criteria:**
  - Given a user replaces a heater, they click "Remove" on the old heater, select reason "replaced", and add a new heater.
  - Given equipment is removed, it no longer appears in the active equipment list but can be viewed in "Equipment History".
  - Given a user edits equipment settings, changes persist and the AI receives the updated data.

---

#### **R-103: AI Equipment Recommendations via Web Search**

**R-103.1: Real-Time Web Search for Equipment**
- AI performs live web searches when users ask for equipment recommendations.
- Recommendations return actual products with:
  - Product name and brand
  - Current retail price (USD or user's region)
  - Star rating/review summary (e.g., 4.5/5 based on aggregated reviews)
  - Brief spec summary (size, power, key features)
  - Suggested retailer(s) and availability status
  - URL to product page (for click-through)

- Search results are **not cached** — each recommendation request triggers a fresh search to ensure current pricing and availability.
- Search covers major aquarium retailers (e.g., Aqueon, Marineland, Fluval, ADA, Aqua Design Amano, etc.) and general e-commerce (Amazon, specialized retailers).

- **Acceptance Criteria:**
  - Given a user (Pro tier) asks "what's the best protein skimmer for my 75-gallon reef?", the AI returns 3-5 real products with names, current prices, ratings, and retailer links.
  - Given search results, product info is updated in real-time (not stale cached data from > 1 week ago).
  - Given a product is out of stock, the system indicates availability and suggests alternatives.
  - Given the user is not Pro tier, they receive general advice instead of web search results.

**R-103.2: Personalized Recommendations**
- Recommendations are personalized based on:
  - Tank type (freshwater, saltwater, brackish, planted, cichlid, planted high-tech, nano, etc.)
  - Tank volume (gallons/liters)
  - Livestock (fish species, shrimp, corals, etc.)
  - Existing equipment (avoid recommending redundant gear)
  - User's stated budget (if provided)
  - Water parameters (if available from test data in R-006)
  - Tank age and maturity level (brand new vs. established)

- The AI uses conversation context to understand the user's needs:
  - "I'm setting up a 30-gallon planted tank" → filter recommendations for plant tanks
  - "My current heater failed" → replacement heater for same tank size
  - "I want to upgrade my lighting" → recommendations compatible with existing setup

- **Acceptance Criteria:**
  - Given a freshwater 20-gallon betta tank, the AI recommends appropriate-sized equipment (e.g., low-flow filter, 25W heater, not oversized).
  - Given a user with an established 90-gallon reef asks for filter upgrades, recommendations are compatible with existing sump/plumbing.
  - Given a user mentions their budget is < $100, recommendations stay within that range.
  - Given a user already owns a specific brand, the AI optionally suggests staying with that brand or exploring alternatives.

**R-103.3: Tier Gating (Aligned with Canonical Tier Matrix)**

Equipment features are gated by subscription tier:

| Feature | Free | Starter ($3.99) | Plus ($7.99) | Pro ($14.99) |
|---------|------|-----------------|--------------|--------------|
| Equipment Tracking | — | — | ✓ | ✓ |
| Lifespan Alerts | — | — | ✓ | ✓ |
| General AI Advice | — | — | ✓ | ✓ |
| AI Equipment Recommendations (Web Search) | — | — | — | 10/day |

- **Free users:** No access to equipment features (upgrade prompt shown).
- **Starter users** ($3.99/mo): No access to equipment features (upgrade prompt shown).
- **Plus users** ($7.99/mo) can:
  - Add and monitor equipment
  - Receive lifespan tracking and maintenance reminders
  - Receive general AI advice based on tank parameters and equipment best practices
  - No live web search, no current pricing, no specific product recommendations
  - Upgrade prompt: "Upgrade to Pro to get real-time equipment recommendations with current pricing."

- **Pro users** ($14.99/mo) receive:
  - All Plus features (equipment tracking, monitoring, reminders)
  - Live web search results with specific products and current pricing (10 searches per day)
  - Retailer links and availability status
  - Integration with their equipment catalog for comparison

- Tier check occurs server-side (Supabase RLS) before web search is triggered to prevent unauthorized access.

- **Acceptance Criteria:**
  - Given a Free or Starter user attempts to add equipment, they receive a tier upgrade prompt.
  - Given a Plus user asks "what filter should I buy?", they receive general advice: "For a 20-gallon freshwater tank, a sponge or hang-on-back filter rated for 2–3x water volume per hour is ideal."
  - Given a Pro user asks the same question, they receive live search results: "Fluval 307 - $89.99 at Amazon, 4.7/5 stars | Aqueon QuietFlow - $65.99 at Petco, 4.2/5 stars | ..."
  - Given a Pro user reaches 10 equipment recommendations in a day, they see a daily limit message.
  - Given a Plus user tries to trigger web search recommendations, the request is denied and they receive an upgrade prompt to Pro.

---

### Nice-to-Have (P1)

**R-102.6: Equipment Cost Tracking**
- Track purchase price per equipment item.
- Display total equipment investment per tank (e.g., "Total Equipment: $1,245.67").
- Equipment cost breakdown chart by type (e.g., 35% filtration, 20% lighting, 15% heating, 30% other).
- Historical cost tracking if equipment is replaced (track cost per item over time).

**R-103.4: Price Alerts**
- AI monitors prices for equipment the user has viewed or marked as "interested".
- When a product price drops > 10% or falls within the user's stated budget, send a notification.
- Optional: Create a "watchlist" where users can mark products to track.

**R-103.5: Equipment Upgrade Paths**
- AI suggests equipment upgrades based on tank progression:
  - "Your tank has grown — consider upgrading from 20-gallon to 30-gallon filter."
  - "Your LED lights are 5+ years old — newer LED technology may improve plant growth."
  - "Your heater is undersized for winter — consider upgrading to maintain stable temps."

**R-102.7: Equipment Maintenance Logs**
- Users can record maintenance performed: water change frequency, filter cartridge replacement date, light cleaning, heater inspection, etc.
- Log entries are timestamped and can include notes and photos.
- Historical logs help the AI understand maintenance patterns and predict future needs.

---

### Future Considerations (P2)

**R-102.8: Equipment Warranty Tracking**
- Track warranty expiration dates and coverage details.
- Send expiration reminders before warranty expires.
- Link warranty info to purchase receipts (stored in Supabase Storage).

**R-103.6: Affiliate Integration**
- Partner links for equipment purchases with revenue sharing.
- Data model supports affiliate partners and commission tracking.
- Monetization: Aquatic AI earns commissions on referred purchases (future phase).

**R-102.9: Equipment Compatibility Matrix**
- Track which equipment works well together and flag potential conflicts.
- Example: "Your dosing pump is compatible with your controller; consider adding auto-dose features."
- Example: "Your HOB filter may create too much flow for your betta — consider diffuser or baffle."

**R-103.7: AI Equipment Setup Wizard**
- Guided conversation to help new users select a complete equipment setup based on tank type, size, and budget.
- AI recommends a starter equipment list (filter, heater, light, test kit, etc.) with estimated total cost.

---

## UI/UX Flow

### Equipment Tracking (Tank Details → Equipment Tab)

1. **Equipment Tab in Tank Detail View**
   - Displays all equipment for the selected tank
   - List view with type icon, name, age, status, and quick actions
   - Large "+" button to add new equipment
   - Sort/filter options (by type, status, date)

2. **Add Equipment Modal**
   - Form fields: type (dropdown), brand, model, purchase date, settings, photo, cost (optional)
   - Type selection includes "other" with custom type input
   - Submit creates equipment record and triggers success toast

3. **Equipment Detail Card**
   - Shows full details: type, brand, model, purchase date, age, lifespan info, settings
   - Status badge (good/due/overdue)
   - "Mark as Serviced" button resets timer
   - "Edit" and "Remove" options
   - Photo display if provided

4. **Equipment History**
   - Archive tab showing removed equipment with reason and date removed
   - Useful for understanding what failed, was replaced, etc.

### AI Equipment Recommendations (Chat → Equipment Context)

1. **Conversational Trigger**
   - User: "What filter should I get for my 30-gallon tank?"
   - Chat interface with tank context already loaded
   - AI detects equipment-related request and checks user tier

2. **Recommendation Response (Pro Tier)**
   - Displays 3-5 product cards in-chat:
     - Product name, brand, image (if available)
     - Price, star rating, review count
     - Key specs (wattage, flow rate, etc.)
     - Availability badge (in stock/out of stock/pre-order)
     - Retailer link ("View at Amazon", "View at Petco", etc.)
   - User can click card to expand details or visit retailer

3. **Recommendation Response (Non-Pro Tier)**
   - Displays general advice text
   - Upgrade prompt card: "Upgrade to Pro to see current prices and where to buy"
   - Link to Pro subscription page

4. **Watchlist / Interested (P1)**
   - User can click heart icon on product card to add to watchlist
   - Watchlist is stored in user preferences
   - System monitors watchlist items for price drops and availability changes

---

## Data Model

### Equipment Table

```sql
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Core fields
  type VARCHAR(50) NOT NULL, -- filter, heater, light, skimmer, powerhead, pump, controller, test_kit, substrate, media, carbon, other
  custom_type VARCHAR(100), -- if type = 'other'
  brand VARCHAR(100),
  model VARCHAR(100),

  -- Dates
  purchase_date DATE NOT NULL,
  last_serviced_date DATE, -- when last maintenance was performed

  -- Settings & notes
  settings TEXT, -- flow rate, wattage, schedule, temperature, etc.
  notes TEXT,

  -- Cost (P1)
  purchase_price DECIMAL(10, 2),

  -- Lifespan & status
  expected_lifespan_months INT, -- override default; NULL uses system default

  -- Media
  photo_url VARCHAR(500), -- Supabase Storage URL

  -- Location & context
  location VARCHAR(100), -- filter chamber 1, sump, etc.

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- soft delete
  deletion_reason VARCHAR(50), -- replaced, removed, failed, sold, other

  CONSTRAINT check_positive_lifespan CHECK (expected_lifespan_months > 0 OR expected_lifespan_months IS NULL)
);

CREATE INDEX idx_equipment_tank_id ON equipment(tank_id);
CREATE INDEX idx_equipment_user_id ON equipment(user_id);
CREATE INDEX idx_equipment_type ON equipment(type);
CREATE INDEX idx_equipment_deleted_at ON equipment(deleted_at);
```

### Equipment Lifespan Defaults Table

```sql
CREATE TABLE equipment_lifespan_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type VARCHAR(50) NOT NULL UNIQUE,
  lifespan_months_min INT NOT NULL,
  lifespan_months_max INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample data
INSERT INTO equipment_lifespan_defaults (equipment_type, lifespan_months_min, lifespan_months_max, notes)
VALUES
  ('filter_media', 3, 6, 'Varies by type (sponge, cartridge, biological)'),
  ('heater', 24, 36, 'Standard aquarium heaters'),
  ('light_bulb', 12, 18, 'Conventional T8, T5 fluorescent'),
  ('light_led', 36, 60, 'Modern LED fixtures'),
  ('protein_skimmer', 24, 60, 'Marine/reef only'),
  ('powerhead', 24, 48, 'Circulation pump'),
  ('dosing_pump', 36, 84, 'Peristaltic/stepper'),
  ('controller', 36, 60, 'Aquarium controller'),
  ('carbon', 2, 4, 'Activated carbon weeks'),
  ('substrate', 60, 120, 'Gravel, sand — very stable');
```

### Equipment Maintenance Log Table (P1)

```sql
CREATE TABLE equipment_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  maintenance_type VARCHAR(100), -- 'media_change', 'cleaning', 'inspection', 'repair', 'other'
  notes TEXT,
  photo_url VARCHAR(500),

  performed_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT check_performed_at CHECK (performed_at <= CURRENT_DATE)
);

CREATE INDEX idx_maintenance_logs_equipment_id ON equipment_maintenance_logs(equipment_id);
CREATE INDEX idx_maintenance_logs_user_id ON equipment_maintenance_logs(user_id);
```

### Equipment Watchlist Table (P1)

```sql
CREATE TABLE equipment_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  product_name VARCHAR(255) NOT NULL,
  product_url VARCHAR(500),
  current_price DECIMAL(10, 2),
  last_price_check TIMESTAMPTZ,
  price_drop_threshold DECIMAL(3, 2) DEFAULT 0.10, -- 10% drop

  added_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_product UNIQUE (user_id, product_url)
);

CREATE INDEX idx_watchlist_user_id ON equipment_watchlist(user_id);
```

---

## Technical Implementation

### Web Search Integration

**Option A: Anthropic Tool Use + Web Search Tool**
- Use Anthropic's tool use to invoke a web search function.
- Integrate with Bing Search API or SerpAPI for product searches.
- Pros: Leverages existing Anthropic integration, secure server-side calling.
- Cons: Additional API cost per search.

**Option B: Google Shopping API**
- Use Google Shopping API for structured product results.
- Requires Google Merchant Center setup.
- Pros: Structured, reliable product data.
- Cons: Higher cost, requires merchant enrollment.

**Option C: SerpAPI or Similar**
- Integrate SerpAPI (or Serper.dev) for Google search scraping.
- Cost-effective, covers general e-commerce search.
- Pros: Easy integration, affordable, covers multiple retailers.
- Cons: Slight latency, volume-dependent pricing.

**Recommended: Option A (Anthropic Tool Use + SerpAPI)**
- Use Anthropic tool use to maintain chat context and reasoning.
- Call SerpAPI when recommendations are needed.
- Cache results for 24 hours to reduce repeated queries.

### Backend Architecture

1. **Recommendation Endpoint**
   ```
   POST /api/v1/equipment/recommendations
   Body: {
     tank_id: UUID,
     equipment_type: string,
     context: string (user message)
   }
   Headers: Authorization: Bearer token
   Response: {
     tier: 'starter' | 'plus' | 'pro',
     recommendations: [
       {
         product_name: string,
         brand: string,
         price: number,
         currency: string,
         rating: number,
         review_count: number,
         specs: object,
         retailer: string,
         retailer_url: string,
         availability: 'in_stock' | 'out_of_stock' | 'pre_order',
         image_url: string
       }
     ] | null, // null if tier < pro
     advice: string // AI advice text (all tiers)
   }
   ```

2. **Tier Check (Server-Side)**
   - Supabase RLS policies enforce equipment feature access.
   - Subscription tier determined from user profiles table.
   - Web search only triggered if `user.subscription_tier = 'pro'`.

3. **Caching Strategy**
   - Cache web search results for 24 hours (key: equipment_type + tank characteristics).
   - Invalidate cache if new equipment is added or tank parameters change.
   - Use Redis or Supabase Cache for storage.

4. **Rate Limiting**
   - Pro users: 10 equipment searches per day.
   - Starter/Plus users: general advice (no rate limit, but no web search).
   - Prevent abuse of web search API.

### Reminder System

1. **Cron Job (Supabase Edge Function)**
   - Runs daily at 06:00 UTC.
   - Query: equipment where `(today - purchase_date) >= (expected_lifespan_months * 30 - 14 days)`.
   - Filter: exclude already-notified today.
   - Batch notifications per user/tank (max 1 per tank per day).

2. **Notification Payload**
   ```json
   {
     "title": "Equipment Maintenance Due",
     "body": "Your Fluval 304 filter is due for media change in ~2 weeks",
     "icon": "filter",
     "priority": "high",
     "data": {
       "equipment_id": "UUID",
       "tank_id": "UUID",
       "action": "view_equipment"
     }
   }
   ```

3. **Supabase Push Notification Integration**
   - Use existing notification system (R-001).
   - Send to user's registered devices.
   - Allow dismiss or snooze (7 days).

---

## Acceptance Testing

### R-102: Equipment Tracking

| Test ID | Scenario | Expected Result | Status |
|---------|----------|-----------------|--------|
| ET-001 | Add filter with type, brand, model, purchase date | Equipment appears in tank list with correct details | |
| ET-002 | Add equipment with type "other" and custom type | Custom type is saved and displayed | |
| ET-003 | Equipment age is calculated as (today - purchase_date) | Age displays correctly (e.g., "6 months old") | |
| ET-004 | Filter purchased 5 months ago, lifespan 6 months | Status shows "Due Soon" with "1 month remaining" | |
| ET-005 | Equipment is overdue (age > lifespan) | Status shows "Overdue" in red, notification sent | |
| ET-006 | User marks equipment as "serviced" | Timer resets, status returns to "Good" | |
| ET-007 | User edits equipment details | Changes persist in database and UI | |
| ET-008 | User removes equipment with reason "replaced" | Equipment moves to archive tab with reason | |
| ET-009 | Equipment list sorted by status | Overdue first, due soon second, good last | |
| ET-010 | Equipment photo uploaded and displayed | Photo appears in equipment detail and list | |

### R-103: AI Equipment Recommendations

| Test ID | Scenario | Expected Result | Status |
|---------|----------|-----------------|--------|
| ER-001 | Pro user asks "best filter for 30-gal tank" | Web search results with 3-5 products, prices, ratings | |
| ER-002 | Starter user asks same question | General advice text, no web search, upgrade prompt | |
| ER-003 | Recommendation considers tank type, size, livestock | Results are appropriate-sized for 30-gal, not oversized | |
| ER-004 | Recommendation considers existing equipment | Avoids suggesting duplicate/redundant items | |
| ER-005 | Web search result is current (checked within 24h) | Prices are accurate, not > 1 week old cached data | |
| ER-006 | User clicks "view at retailer" link | Navigates to correct product page | |
| ER-007 | Product is out of stock | Availability shows "out of stock", alternatives suggested | |
| ER-008 | Recommendation context includes tank info from profile | AI uses tank type, size, livestock in suggestions | |
| ER-009 | Pro tier gating enforced server-side | Non-Pro user cannot trigger web search even if hacking | |
| ER-010 | Recommendation response time < 5 seconds | UX is responsive, not delayed by search latency | |

---

## Success Metrics

### Leading Indicators

- **Equipment Catalog Adoption:** > 40% of active users add at least one piece of equipment within 60 days of feature launch.
- **Web Search Usage:** > 50% of Pro users use equipment recommendations at least once per month.
- **Reminder Engagement:** > 60% of equipment maintenance reminders result in user action (marked as serviced, replaced) within 7 days.
- **Pro Tier Attribution:** Equipment recommendations mentioned in > 15% of Plus-to-Pro upgrade reasons (survey).

### Lagging Indicators

- **Equipment Failure Prevention:** Users with equipment tracking report 30%+ fewer unexpected equipment failures (post-launch survey).
- **Equipment Recommendation Satisfaction:** > 4.0/5.0 average rating on recommendation relevance and accuracy.
- **Web Search Click-Through Rate:** > 25% of search results clicked within 7 days of recommendation.
- **Equipment Watchlist Usage (P1):** > 20% of Pro users add items to watchlist for price monitoring.

### Analytics Instrumentation

- Event: `equipment.added` (type, brand, tank_size, tank_type)
- Event: `equipment.maintained` (type, days_overdue)
- Event: `equipment.removed` (type, reason, age_months)
- Event: `recommendation.viewed` (user_tier, equipment_type, num_results)
- Event: `recommendation.clicked` (product_name, retailer, price)
- Event: `reminder.received` (equipment_type, status)
- Event: `reminder.actioned` (action: serviced | replaced | dismissed)

---

## Decisions (Resolved)
- ✅ Equipment tier gating: Equipment tracking (adding, monitoring, lifespan alerts) available to Plus and Pro users. AI-powered web search recommendations for replacements/upgrades are Pro-only.
- ✅ Lifespan defaults source: Curated defaults maintained by Content Admin via Admin Portal (Spec 13). Initial seed data covers 50+ common equipment types. Users can override defaults for their specific equipment.
- ✅ Web search provider: SerpAPI ($50/month budget). 24-hour cache on search results to minimize API calls. Fallback to cached/curated recommendations if SerpAPI is unavailable.
- ✅ Equipment notifications: Push notification when equipment reaches 80% of expected lifespan ("Your HOB Filter is nearing end of life"). Second alert at 100%. Daily cron job checks all equipment across all users.
- ✅ Equipment history: Track purchase date, replacement history, maintenance logs. Full history retained for lifetime of account. Useful for AI cost analysis and budgeting features (P2).

---

## Timeline & Phasing

### Phase Timeline

- **Phase 2a (Fast Follow – 4 weeks):**
  - R-102: Equipment Tracking (MVP, core P0 features)
  - Lifespan defaults database populated
  - Equipment list view and add/edit/remove
  - No reminders yet (can be added in 2b)

- **Phase 2b (Fast Follow – 2 weeks, post-2a stabilization):**
  - R-102: Equipment maintenance reminders (cron job + notifications)
  - Equipment maintenance logs (P1)
  - Cost tracking (P1)

- **Phase 2c (Fast Follow – 3 weeks, post-2b):**
  - R-103: AI Equipment Recommendations via Web Search
  - Web search integration (SerpAPI + Anthropic tool use)
  - Pro tier gating
  - Recommendation personalization

### Dependencies

1. **R-102 Can Ship:** After R-001 (AI Chat), R-002 (Tank Profile), R-008 (Maintenance Scheduling).
2. **R-103 Can Ship:** After R-102, R-001 (Chat), R-010 (Subscription & Billing).
3. **Reminders (R-102.3):** Requires R-001 (Notification System) stable.

---

## Technical Notes

### Database Schema & RLS

```sql
-- Row-level security for equipment
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY equipment_select_own ON equipment
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY equipment_insert_own ON equipment
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY equipment_update_own ON equipment
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY equipment_delete_own ON equipment
  FOR DELETE USING (auth.uid() = user_id);

-- Verify user owns the tank
CREATE FUNCTION check_tank_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tanks WHERE id = NEW.tank_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Equipment must be associated with a tank owned by the user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_tank_ownership
BEFORE INSERT OR UPDATE ON equipment
FOR EACH ROW EXECUTE FUNCTION check_tank_ownership();
```

### API Endpoints

```
GET    /api/v1/tanks/:tankId/equipment          -- List equipment for tank
POST   /api/v1/tanks/:tankId/equipment          -- Add equipment
GET    /api/v1/tanks/:tankId/equipment/:id      -- Get equipment detail
PATCH  /api/v1/tanks/:tankId/equipment/:id      -- Update equipment
DELETE /api/v1/tanks/:tankId/equipment/:id      -- Remove equipment (soft delete)

POST   /api/v1/equipment/recommendations        -- Get AI recommendations (Pro tier)
GET    /api/v1/equipment/maintenance-logs/:id   -- Get logs for equipment
POST   /api/v1/equipment/maintenance-logs       -- Add maintenance log entry

GET    /api/v1/equipment/lifespan-defaults      -- Get default lifespans
GET    /api/v1/users/equipment-watchlist        -- Get user's watchlist (P1)
POST   /api/v1/users/equipment-watchlist        -- Add to watchlist (P1)
DELETE /api/v1/users/equipment-watchlist/:id    -- Remove from watchlist (P1)
```

### Storage (Supabase)

- Equipment photos stored in Supabase Storage bucket: `equipment-photos/{user_id}/{equipment_id}/{filename}`
- Signed URLs generated for display, expires after 7 days.
- Max file size: 5 MB per photo, format: JPEG, PNG, WebP.

### Notifications

- Push notifications via Supabase Messaging (FCM for Android, APNs for iOS).
- Badge: Equipment icon (filter, heater, light, etc.).
- Actions: "Mark as Serviced" quick-action, "View Equipment" deep link.

---

## Release Notes Template

### Aquatic AI v2.1 Release Notes

**New Features**

- **Equipment Tracking (R-102):** Catalog all your aquarium equipment with details like brand, model, purchase date, and settings. Get automatic reminders when equipment needs maintenance or replacement based on typical lifespans.
- **AI Equipment Recommendations (R-103 – Pro tier):** Ask the AI for equipment recommendations. Pro subscribers get real-time product search results with current prices, ratings, and where to buy. Starter and Plus users get general guidance.

**What You Can Do Now**

- Add, edit, and remove equipment from any tank
- View equipment age and maintenance status at a glance
- Receive proactive maintenance reminders before equipment fails
- (Pro tier) Search for specific equipment recommendations with real-time pricing
- Track equipment cost and investment per tank (P1)
- Log maintenance performed for future reference (P1)

**Upgrade Path**

Equipment tracking is free for all users. For personalized, web-search-powered equipment recommendations with current pricing, upgrade to Aquatic AI Pro ($14.99/mo).

---

## Appendix: Lifespan Reference

| Equipment Type | Min Life | Max Life | Notes |
|---|---|---|---|
| Filter Media | 3 months | 6 months | Sponge, cartridge, biological — varies by type and bioload |
| Heater | 2 years | 3 years | Standard submersible/in-line aquarium heaters |
| Light Bulb (Fluorescent) | 12 months | 18 months | T8, T5 fluorescent tubes |
| Light LED | 3 years | 5 years | Modern LED fixtures; much longer than incandescent/fluorescent |
| Protein Skimmer | 2 years | 5 years | Saltwater/reef only; varies by usage and cleaning |
| Powerhead / Circulation Pump | 2 years | 4 years | Wave maker, return pump, circulation fan |
| Dosing Pump | 3 years | 7 years | Peristaltic or stepper-based, low wear |
| Controller / Monitor | 3 years | 5 years | Aquarium auto-feeder, CO2 monitor, etc. |
| Activated Carbon | 2 weeks | 4 weeks | Rapidly exhausted; weekly replacement is best practice |
| Substrate (Gravel/Sand) | 5 years | 10+ years | Very stable; rarely needs full replacement |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-07 | Aquatic AI Product Team | Initial specification for R-102 and R-103 |

---

**Document Status:** Draft / Ready for Review

**Last Updated:** 2026-02-07

**Owner:** Product Management

**Stakeholders:** Engineering, Design, Data Science, Business Development
