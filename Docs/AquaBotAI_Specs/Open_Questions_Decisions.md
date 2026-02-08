# Aquatic AI — Open Questions & Decisions Log
**Version 1.0 | February 2026**
**Status:** DRAFT — Pending Product Owner Approval

---

## Purpose

This document consolidates all 89 open questions from Specs 01–12, provides a recommended decision for each, and tracks approval status. Once approved, each decision will be written back into the originating spec document.

---

## Decision Legend

- ✅ **DECIDED** — Decision made, ready to write back to spec
- ⏳ **NEEDS INPUT** — Requires product owner decision
- 💡 **RECOMMENDATION** — Strong recommendation included

---

## Category 1: AI & Chat Architecture (13 questions)

### Q1.1 — Context Window Management
**Source:** Spec 01 [Engineering — Blocking]
**Question:** How do we handle users with months of conversation history without exceeding token limits?
**Options:** (1) Rolling summarization (2) Key-fact extraction (3) Tiered context (4) Hybrid

**✅ DECISION: Option 1 — Rolling Summarization**
Already implemented in the API spec (Section 3.5). When `total_tokens > 8,000`, older messages are summarized by Claude Haiku 4.5 into the `summary` field. Last 50 messages kept in array. Cost: ~$0.002 per summarization. Simple, proven approach. Key-fact extraction (Option 2) is a P2 enhancement if summaries lose important details.

---

### Q1.2 — AI Usage Limits Enforcement
**Source:** Spec 01 [Data]
**Question:** When a user hits their usage limit, how should the system respond?
**Options:** (1) Hard cutoff with upgrade prompt (2) Soft degradation (3) Gradual throttling

**✅ DECISION: Option 1 — Hard Cutoff with Upgrade Prompt**
Clean UX, clear value prop for upgrading. Already specified in API spec (Section 2.6) with `429 DAILY_LIMIT_REACHED` error including tier details, count, reset time, and upgrade URL. Soft degradation (Option 2) would require maintaining two response quality tiers, adding complexity with limited benefit.

---

### Q1.3 — Streaming vs. Non-Streaming AI Responses
**Source:** Spec 12 [Engineering — Blocking]
**Question:** Should v1 use streaming responses from Anthropic API?

**✅ DECISION: Non-Streaming for v1**
Simpler error handling, cleaner implementation. Perceived wait of 2–3 seconds is acceptable for MVP. Streaming is P1 fast-follow — already noted in API spec. The loading state with a typing indicator is sufficient.

---

### Q1.4 — Model Routing (Sonnet vs. Haiku)
**Source:** Spec 01 [Engineering — P2 originally]
**Question:** Should v1 implement multi-model routing?

**✅ DECISION: Yes — Simple Rule-Based Routing in v1**
Already defined in API spec (Section 3.6). Simple keyword + context rules route ~30–40% of queries to Haiku, saving ~40% on AI costs. No ML needed — just pattern matching.

---

### Q1.5 — AI Analysis Frequency (Water Parameters)
**Source:** Spec 03 [Engineering]
**Question:** Real-time AI analysis on each new entry, or batch on schedule?

**✅ DECISION: On-Demand Only**
AI analysis happens when the user asks the AI about their parameters, not automatically on each log entry. This avoids wasted AI calls when users just want to record data. Proactive alerts (P1 feature in Spec 01, R-001.7) will add scheduled analysis later.

---

### Q1.6 — Minimum Data Density for AI Analysis
**Source:** Spec 03 [Data]
**Question:** What's the minimum data density before AI trend analysis is meaningful?

**✅ DECISION: 3 data points over 7+ days**
AI will note in its response when data is too sparse: "I only see 2 readings so far — log a few more over the next week and I can start identifying trends." This is handled via the system prompt context, not a hard gate.

---

### Q1.7 — Compatibility Rules Engine
**Source:** Spec 04 [Engineering]
**Question:** How are species compatibility rules determined?
**Options:** (A) AI-interpreted dynamically (B) Structured database matrix (C) Hybrid

**✅ DECISION: Option C — Hybrid**
Basic rules (temperature range overlap, pH overlap, temperament conflicts, tank size minimums) checked programmatically from `species` table data. Nuanced cases (e.g., "will these two cichlid species coexist?") sent to Claude Haiku 4.5 for assessment. Already reflected in API spec Section 2.4 (`check_compatibility` endpoint).

---

### Q1.8 — Custom Species AI Insights
**Source:** Spec 04 [Data]
**Question:** For species not in our database, how do we provide AI insights?

**✅ DECISION: AI uses training knowledge**
Claude's training data covers most aquarium species. When a user adds a custom species name, the AI can discuss it using general knowledge. No web scraping needed. The AI will caveat: "I don't have this species in my database, but based on what I know about [species]..."

---

### Q1.9 — Photo Diagnosis Preprocessing
**Source:** Spec 09 [Engineering]
**Question:** Resize/compress server-side or client-side? What resolution for Claude?

**✅ DECISION: Server-side resize to 1024px longest edge**
Already specified in API spec (Section 2.7). Server-side is more reliable across devices. Claude Sonnet 4.5 vision works well at 1024px. Client-side compression is unreliable across browsers/devices.

---

### Q1.10 — Photo Diagnosis Rate Limiting
**Source:** Spec 09 [Engineering]
**Question:** How many photo diagnoses per day per user?

**✅ DECISION: Plus: 10/day, Pro: 30/day**
Already specified in API spec rate limiting table. Vision calls cost ~5x more than text. These limits balance utility with cost control.

---

### Q1.11 — Diagnosis Accuracy Measurement
**Source:** Spec 09 [Data]
**Question:** How do we measure diagnosis accuracy at scale?

**✅ DECISION: User feedback + optional thumbs up/down**
Add a "Was this diagnosis helpful?" prompt after each diagnosis result (thumbs up/down). Track in `photo_diagnoses` table (add `user_feedback VARCHAR(10)` — `'helpful'`, `'not_helpful'`, `NULL`). Expert review panel is P2. Target: >80% helpful ratings.

---

### Q1.12 — Safe Zones Calculation
**Source:** Spec 03 [Engineering]
**Question:** How to calculate safe zones when species have different ideal ranges?

**✅ DECISION: Use the overlap (intersection) of all species' ranges**
If Neon Tetras need pH 6.0–7.0 and Corydoras need pH 6.5–7.5, the safe zone is 6.5–7.0. If there's no overlap, flag as a compatibility warning. The AI will also contextualize: "Your pH of 7.2 is slightly above the ideal range for your Neon Tetras but perfect for your Corydoras."

---

### Q1.13 — Health Score Algorithm
**Source:** Spec 11 [Data]
**Question:** How to calculate the aggregate health score per tank?

**✅ DECISION: Weighted formula — computed, not stored**
Already defined in API spec (Section 2.12): Parameter stability (40%) + Maintenance compliance (30%) + No active alerts (20%) + Livestock stability (10%). Score 0–100. Computed at query time in the Edge Function. Parameters scored against species-specific ideal ranges.

---

## Category 2: UX & Design (19 questions)

### Q2.1 — Chat-First vs. Dashboard-First Landing
**Source:** Spec 01 [Design]
**Question:** Default view after login?
**Options:** (1) Chat-first (2) Dashboard-first (3) Configurable

**✅ DECISION: Dashboard-First with Bottom Tab Bar Navigation**
Per Figma wireframes. Dashboard gives users an instant health overview. Bottom tab bar with 5 tabs: Home, Parameters, Species, Maintenance, Chat (using brand teal `#1B998B`). Floating chat button available on dashboard. Chat accessible via tab or floating button. Aligns with existing wireframe component structure.

---

### Q2.2 — Action Confirmation UX
**Source:** Spec 01 [Engineering]
**Question:** How should the AI present action confirmations?
**Options:** (1) Inline buttons (2) Modal dialog (3) Swipe-to-undo (4) Hybrid

**✅ DECISION: Option 1 — Inline Buttons**
Confirm/Cancel buttons rendered directly in the chat message below the action card. Clean, contextual, no modal interruption. Already reflected in API spec tool use flow (Section 3.3). No undo window needed — user explicitly confirms before execution.

---

### Q2.3 — Tank Creation: Single Form vs. Wizard
**Source:** Spec 02 [Design]
**Question:** Single form or multi-step wizard?

**✅ DECISION: Single Form (main flow) + Wizard (onboarding only)**
Per spec recommendation. Fast entry for experienced users. Onboarding wizard guides beginners through their first tank setup with explanations at each field.

---

### Q2.4 — Tank Switcher Truncation
**Source:** Spec 02 [Design]
**Question:** How many tanks visible before truncating?

**✅ DECISION: Show all if ≤ 5, search/filter for 6+**
Plus tier max is 5 — so most users see all tanks. Pro users with many tanks get a searchable list. Dropdown with tank type icon + name.

---

### Q2.5 — Visual Tank Type Indicators
**Source:** Spec 02 [Design]

**✅ DECISION: Icons + Color Coding**
Freshwater = green droplet, Saltwater = blue wave, Reef = coral icon (orange), Brackish = teal swirl. Used in tank switcher, dashboard cards, and list views.

---

### Q2.6 — Undo Deletion Timing
**Source:** Spec 02 [Design]

**✅ DECISION: 90-day soft delete (not a 30-second undo toast)**
Tank deletion is soft-delete with 90-day retention. User can "restore" from a deleted tanks list in settings. No need for a timed undo toast — the action isn't destructive for 90 days.

---

### Q2.7 — Quick Entry vs. Conversational Parameter Logging
**Source:** Spec 03 [Design]

**✅ DECISION: Both — Form Primary, Chat Secondary**
Dedicated quick-entry form with pre-filled fields based on tank type (freshwater shows pH/ammonia/nitrite/nitrate/temp, reef adds calcium/alk/mag). Users can also say "my pH is 7.2 and ammonia is 0" in chat and the AI logs it via tool use.

---

### Q2.8 — Maintenance Task Overview Location
**Source:** Spec 05 [Design]

**✅ DECISION: Both — Dashboard Widget + Dedicated Page**
Dashboard shows "Upcoming Tasks" card with overdue count badge. Dedicated /maintenance page for full task management, history, and creation. Widget links to full page.

---

### Q2.9 — Recurrence Granularity
**Source:** Spec 05 [Design]

**✅ DECISION: "Every X days" pattern only for v1**
Options: daily, weekly, biweekly, monthly, every X days. Specific day-of-week patterns (Mon/Wed/Fri) are P2. Covers 95% of aquarium maintenance needs.

---

### Q2.10 — Navigation Pattern
**Source:** Spec 08 [Design]

**✅ DECISION: Bottom Tab Bar per Figma Wireframes**
Per existing wireframes: Bottom tab bar with 5 tabs — Home, Parameters, Species, Maintenance, Chat. Brand teal active state (`#1B998B`). Unread chat badge (red dot). Desktop: sidebar with same items + expanded labels. Responsive breakpoint at 768px.

---

### Q2.11 — Offline Indicator
**Source:** Spec 08 [Design]

**✅ DECISION: Subtle top banner**
Thin yellow/amber banner at top of screen: "You're offline — some features are unavailable." Dismissible but returns if user tries an online-only action. Non-intrusive.

---

### Q2.12 — Install Prompt Timing
**Source:** Spec 08 [Design]

**✅ DECISION: After first tank parameter logged**
User has demonstrated engagement by that point. Show a subtle bottom sheet: "Add Aquatic AI to your home screen for quick access and notifications." Dismissible, shown max 3 times.

---

### Q2.13 — Photo Diagnosis UX Flow
**Source:** Spec 09 [Design]

**✅ DECISION: Camera icon in chat input + dedicated diagnosis page**
Camera icon in chat input bar for quick access. Also a dedicated /diagnose page accessible from the tank detail view for users who prefer a structured flow with photo preview and symptom input fields.

---

### Q2.14 — Equipment Entry UX
**Source:** Spec 10 [Design]

**✅ DECISION: Smart form with type-ahead**
Form-based entry with type-ahead brand/model suggestions. Users can also add equipment via chat ("I just installed a Fluval FX6 filter"). Not a wizard — single form with logical field grouping.

---

### Q2.15 — Mobile Equipment Photos
**Source:** Spec 10 [Design]

**✅ DECISION: Camera + Library**
Mobile users get both camera capture and photo library import. Camera for quick snapshots of equipment. 5MB max, JPEG/PNG/WebP.

---

### Q2.16 — Maintenance Logs Location
**Source:** Spec 10 [Design]

**✅ DECISION: History tab in equipment detail**
Equipment detail view has tabs: Overview, Maintenance History, Settings. Cleaner than inline timeline. Logs show date, action taken, and notes.

---

### Q2.17 — Multi-Tank Comparison UX
**Source:** Spec 11 [Design]

**✅ DECISION: Color-coded lines on shared chart**
Single chart with each tank as a different colored line. Legend shows tank name + color. Max 5 tanks on one chart (Pro tier). Toggle tanks on/off via clickable legend.

---

### Q2.18 — Email Template Design
**Source:** Spec 11 [Design]

**✅ DECISION: Clean HTML email with inline sparkline images**
HTML email with: tank health summary, key parameter values with trend arrows (↑↓→), maintenance compliance, and "View Full Report" CTA button. No embedded charts (email client compatibility issues) — use simple trend indicators. Styled to match app branding.

---

### Q2.19 — Landing Page After Auth
**Source:** Spec 06 [Design]

**💡 RECOMMENDATION: Dashboard (if onboarding complete) / Onboarding (if new user)**
Aligns with Q2.1 dashboard-first decision. New users go to onboarding wizard. Returning users go to dashboard.

⏳ **Linked to Q2.1 decision**

---

## Category 3: Platform & Infrastructure (14 questions)

### Q3.1 — Offline Behavior
**Source:** Spec 01 [Engineering]
**Question:** How should AI chat respond when offline?

**✅ DECISION: Option 3 — Clearly indicate offline state; disable AI chat**
AI chat requires an API call — it can't work offline. Show: "AI chat requires an internet connection." Allow users to browse cached tank data, review past conversations, and queue parameter entries for sync. Queued messages sync when back online.

---

### Q3.2 — Edge Function Cold Starts
**Source:** Spec 12 [Engineering — Blocking]

**✅ DECISION: Option 2 — Accept and optimize bundle size**
Keep Edge Function bundles small (< 500KB). Cold starts add ~500ms once every ~5 minutes of inactivity. Acceptable for an MVP. Keep-alive pings (Option 1) add operational complexity. Revisit if user complaints arise.

---

### Q3.3 — Webhook Processing: Sync vs. Async
**Source:** Spec 12 [Engineering]

**✅ DECISION: Synchronous for v1**
Webhook handlers are simple DB upserts (< 500ms). Synchronous is simpler. Queue-based is overkill at launch scale. Move to async if we see webhook delivery failures or processing > 3s.

---

### Q3.4 — iOS Safari PWA Push Limitations
**Source:** Spec 05, Spec 08 [Engineering]

**✅ DECISION: Email fallback for unsupported devices**
iOS 16.4+ supports Web Push in PWA mode. For older iOS (< 16.4) and non-PWA browsers: fall back to email notifications for maintenance reminders. Show a banner: "Install Aquatic AI as an app for push notifications." Track push capability per device in `push_subscriptions.user_agent`.

---

### Q3.5 — Notification Delivery Reliability
**Source:** Spec 05 [Engineering]

**✅ DECISION: No SLA; email fallback 60 minutes after unacknowledged push**
Push notifications are best-effort. If a maintenance task reminder push is sent but the task isn't completed within 60 minutes, send an email reminder. Track push delivery status via Web Push response codes (201 = delivered, 410 = expired subscription).

---

### Q3.6 — Time Zone Handling
**Source:** Spec 05 [Engineering]

**✅ DECISION: Store all times in UTC; localize on client**
`users.timezone` stores the IANA timezone. All DB timestamps are `TIMESTAMPTZ` (UTC). Edge Functions use the user's timezone for scheduling notifications and reports. Frontend converts for display using `Intl.DateTimeFormat`.

---

### Q3.7 — DST Edge Cases
**Source:** Spec 05 [Engineering]

**✅ DECISION: Handle via IANA timezone library**
Deno's `Temporal` API or a library like `date-fns-tz` handles DST automatically. Notification times may shift by 1 hour during transitions — acceptable. No special handling needed.

---

### Q3.8 — Service Worker Caching Strategy
**Source:** Spec 08 [Engineering]

**✅ DECISION: 50MB cache budget**
Cache: App shell (HTML/CSS/JS), species database (JSON, ~2MB), user's tank data (JSON), last 10 species photos per tank. Do NOT cache all 500+ species photos (too large). Use stale-while-revalidate for API responses. Cache-first for static assets. Clear caches older than 30 days.

---

### Q3.9 — Offline Queue Conflict Resolution
**Source:** Spec 08 [Engineering]

**✅ DECISION: Last-write-wins with user notification**
If a conflict is detected on sync (e.g., parameter edited offline but also changed on another device), use last-write-wins. Show a toast: "Some changes were synced. Review your recent entries." For v1, conflicts will be rare (single-user app). Proper conflict resolution is P2.

---

### Q3.10 — Cross-Tab Communication
**Source:** Spec 08 [Engineering]

**✅ DECISION: BroadcastChannel API**
Use the browser's BroadcastChannel API to sync state across tabs. If a user adds a fish in Tab A, Tab B updates via broadcast. Fallback to localStorage events for older browsers. Lightweight, no server involvement.

---

### Q3.11 — Photo Compression Strategy
**Source:** Spec 02 [Engineering]

**✅ DECISION: Client-side compression + server-side validation**
Client-side: Compress to 80% JPEG quality, max 1200px longest edge before upload (using canvas API). Server-side: Validate file size (< 5MB), format (JPEG/PNG), and dimensions. Reject anything > 5MB post-compression.

---

### Q3.12 — Report Generation Timing
**Source:** Spec 11 [Engineering]

**✅ DECISION: Stagger by user timezone**
Cron runs every 15 minutes. Query users where `report_preferences.delivery_time` (converted from local to UTC) falls within the current 15-min window. Staggering prevents thundering herd and ensures reports arrive at each user's preferred local time.

---

### Q3.13 — Email Delivery Service
**Source:** Spec 11 [Engineering]

**✅ DECISION: Resend**
Modern email API, great developer experience, affordable (3,000 emails/month free, then $0.80/1000). Good deliverability. Easy Deno integration. SDK: `resend` npm package, Deno-compatible.

---

### Q3.14 — Web Search Provider for Equipment Recommendations
**Source:** Spec 10 [Engineering]

**✅ DECISION: SerpAPI**
Most reliable API for Google Shopping results. $50/month for 5,000 searches (plenty for Pro-tier users). 24-hour cache on results to reduce costs. API key stored in Supabase Vault.

---

## Category 4: Business & Billing (16 questions)

### Q4.1 — Payment Methods Beyond Cards
**Source:** Spec 07 [Business]

**✅ DECISION: Cards + Apple Pay + Google Pay**
Stripe Checkout supports Apple Pay and Google Pay out of the box with minimal config. Enable both. Other payment methods (PayPal, bank transfers) are P2 based on user demand.

---

### Q4.2 — Post-Trial Free Tier Experience
**Source:** Spec 07 [Business]

**✅ DECISION: Functional free tier with hard limits — data always accessible**
After trial: 1 tank, 10 AI messages/day, basic parameter logging and species database. Users keep ALL their data — nothing gets deleted or locked. They lose access to: maintenance scheduling, photo diagnosis, equipment tracking, reports, and multi-tank support. This preserves the core value while creating clear upgrade motivation.

---

### Q4.3 — Refund Policy
**Source:** Spec 07 [Business]

**✅ DECISION: No refunds**
Cancel anytime — access continues until period end. No refunds issued. Simple, clear policy. Stripe Customer Portal handles self-service cancellation. Document in Terms of Service.

---

### Q4.4 — Free Tier Long-Term Strategy
**Source:** Spec 07 [Business]

**✅ DECISION: Maintain permanent free tier**
Free tier drives user acquisition and word-of-mouth. 1 tank + 10 AI messages/day gives enough value to hook users. Conversion happens when users want: more tanks, photo diagnosis, maintenance scheduling, or more AI messages. No "pay what you want" — clear tier structure.

---

### Q4.5 — Target Tier Distribution
**Source:** Spec 07 [Business]

**✅ DECISION: Validate assumption of 60/20/15/5 (Free/Starter/Plus/Pro)**
More conservative than the 40/40/20 assumption. Most users stay free. Starter converts the budget-conscious. Plus is the sweet spot (multi-tank, photo diagnosis). Pro is power users. Track and adjust pricing based on actual conversion data.

---

### Q4.6 — Grace Period for Failed Payments
**Source:** Spec 07 [Engineering]

**✅ DECISION: 14-day grace period with Stripe Smart Retries**
Stripe retries failed payments automatically over ~3 weeks (up to 4 attempts). During `past_due` status: user retains full access for 14 days. After 14 days with no successful payment: downgrade to free tier. Send push + email at each failed attempt.

---

### Q4.7 — Automatic Payment Recovery
**Source:** Spec 07 [Engineering]

**✅ DECISION: Stripe Smart Retries (automatic)**
Stripe's built-in Smart Retries use ML to determine optimal retry timing. No custom retry logic needed. Additionally, send a "Update payment method" email/push with a direct link to Stripe Customer Portal.

---

### Q4.8 — Currency & Local Pricing
**Source:** Spec 07 [Engineering]

**✅ DECISION: USD only for v1; Stripe handles currency conversion**
All prices displayed in USD. Stripe automatically handles currency conversion for international cards. Localized pricing (different prices per region) is P2 based on international user volume. Enable Stripe Tax for sales tax compliance.

---

### Q4.9 — Usage Limits Cadence
**Source:** Spec 07 [Engineering]

**✅ DECISION: Per-day (daily reset at midnight UTC)**
Already specified throughout all specs. Per-day is fairer — prevents users from burning all messages on day 1 of the month. Daily reset gives users a fresh start each day. Tracked via `ai_usage` table with `(user_id, date, feature)` unique constraint.

---

### Q4.10 — Usage Limit Enforcement
**Source:** Spec 07 [Engineering]

**✅ DECISION: Hard limits (blocking) — same as Q1.2**
Hard cutoff with clear messaging and upgrade CTA. Consistent across all specs.

---

### Q4.11 — Equipment Tier Gating
**Source:** Spec 10 [Data & Product]

**✅ DECISION: Equipment tracking = Plus+, Web search = Pro only**
Give Plus-tier users basic equipment tracking (add/view/alerts). Reserve AI-powered web search recommendations for Pro. This adds value to Plus tier and gives Pro a clear differentiator.

---

### Q4.12 — Affiliate Model
**Source:** Spec 10 [Data & Product]

**✅ DECISION: Design for it, don't implement in v1**
Add `affiliate_url` and `affiliate_source` columns to equipment recommendation responses in P2. For v1, provide clean product links with no affiliate tracking. Affiliate partnerships are a v2 revenue stream.

---

### Q4.13 — Affiliate Partnerships Timeline
**Source:** Spec 10 [Business]

**✅ DECISION: v2 — after proving product-market fit**
Focus v1 on subscription revenue. Explore affiliate partnerships with major aquarium retailers (Bulk Reef Supply, Marine Depot, Amazon Associates) in v2 once we have proven user engagement and recommendation quality.

---

### Q4.14 — Email Digest Option
**Source:** Spec 05 [Product]

**✅ DECISION: Yes — weekly email digest as alternative to push**
Especially valuable for non-PWA users and iOS users without push support. Weekly digest summarizes: upcoming tasks, overdue items, parameter trends. Available to all tiers. Controlled via `notification_preferences.email_enabled`.

---

### Q4.15 — Snooze Functionality
**Source:** Spec 05 [Product]

**✅ DECISION: Yes — snooze to later today or tomorrow**
When a push notification arrives, action buttons: "Complete" and "Snooze." Snooze options: "Later today" (+4 hours) or "Tomorrow" (same time tomorrow). Updates `maintenance_tasks.next_due_date` temporarily. Simple, high value.

---

### Q4.16 — Task Templates
**Source:** Spec 05 [Product]

**✅ DECISION: P1 — not MVP**
For v1, AI suggests common maintenance tasks during onboarding based on tank type. User-created templates (save a task configuration for reuse) is a P1 fast-follow. Most users have standard recurring tasks that the AI can pre-populate.

---

## Category 5: Data & Content (7 questions)

### Q5.1 — Species Database Seeding
**Source:** Spec 04 [Data Sourcing]
**Question:** Seed from FishBase API or curate manually?

**✅ DECISION: FishBase API bulk import + manual curation pass**
Import 500+ species from FishBase for basic data (names, taxonomy, habitat, size). Manual curation pass to add: care level ratings, temperament, compatibility notes, and photo URLs. Target: 500 species at launch, 200 with curated care guides. Expand to 1,000+ in Phase 2.

---

### Q5.2 — Bioload Calculator
**Source:** Spec 04 [Product]

**✅ DECISION: P2 — not MVP**
Bioload calculation requires per-species waste coefficients that FishBase doesn't provide. For v1, the AI provides qualitative stocking advice ("your tank is getting heavily stocked — I'd hold off on adding more fish"). Quantitative bioload calculator in P2 with community-validated data.

---

### Q5.3 — Species Photos
**Source:** Spec 04 [Data]

**✅ DECISION: Curated Creative Commons photos + AI placeholder**
Source photos from Wikimedia Commons (CC-licensed fish photos). For species without photos, generate a simple silhouette placeholder with the species name. Target: 80% real photos at launch. User-contributed photos are P2.

---

### Q5.4 — Equipment Lifespan Database
**Source:** Spec 10 [Data]

**✅ DECISION: Seed with conservative community estimates; allow user overrides**
Already defined in data model (`equipment_lifespan_defaults` table). Seed data from aquarium hobby forums and manufacturer specs. Users can set custom lifespans per equipment item (field: `equipment.expected_lifespan_months`). Crowdsourced refinement is P2.

---

### Q5.5 — AI Cost Attribution
**Source:** Spec 12 [Data]

**✅ DECISION: Per-user-per-day-per-feature**
Already implemented via `ai_usage` table. Sufficient for tier enforcement, monthly cost reporting, and identifying heavy users. Per-message tracking adds overhead without clear v1 benefit.

---

### Q5.6 — Notification Content Customization
**Source:** Spec 05 [Design]

**✅ DECISION: No customization in v1**
Standard notification templates for each type. Users can enable/disable notification categories but not customize message content. Custom content is low priority and adds UI complexity.

---

### Q5.7 — Geolocation for Notifications
**Source:** Spec 08 [Product]

**✅ DECISION: No — P3 at earliest**
Geofencing requires location permissions (privacy concern) and adds significant complexity. Most aquarium hobbyists maintain tanks at home — they don't need location-based reminders. Deprioritize.

---

## Category 6: Legal & Compliance (6 questions)

### Q6.1 — Privacy Policy & Terms Timing
**Source:** Spec 06 [Legal]

**✅ DECISION: Pre-signup — shown before magic link is sent**
User must check "I agree to the Terms of Service and Privacy Policy" before entering their email. Links open in new tabs. Standard practice. Required for GDPR compliance.

---

### Q6.2 — Veterinary Advice Disclaimers
**Source:** Spec 09 [Legal]

**✅ DECISION: Disclaimer on every diagnosis result**
Every photo diagnosis response includes: "⚠️ This AI assessment is for informational purposes only and is not a substitute for professional veterinary diagnosis. If your fish shows signs of serious illness, please consult a qualified aquatic veterinarian." Shown in the AI response and in the diagnosis history view.

---

### Q6.3 — Tax Handling
**Source:** Spec 07 [Legal]

**✅ DECISION: Enable Stripe Tax**
Stripe Tax automatically calculates and collects sales tax/VAT based on user location. Covers US states, EU VAT, and most international markets. Add ~0.5% per transaction cost but eliminates tax compliance complexity.

---

### Q6.4 — Refund & Cancellation Compliance
**Source:** Spec 07 [Legal]

**✅ DECISION: Standard SaaS terms — compliant**
Cancel anytime, access until period end, NO REFUNDS (per Q4.3). Stripe Customer Portal handles self-service cancellation. Cancellation takes effect at end of current billing period — no prorated refunds. Document no-refund policy explicitly in Terms of Service. For EU compliance, the no-refund policy applies after the user has accessed the digital service (standard for SaaS).

---

### Q6.5 — Automatic Billing Terms
**Source:** Spec 07 [Legal]

**✅ DECISION: Explicit opt-in at checkout**
Stripe Checkout shows clear billing terms before payment. Trial-to-paid conversion: send email 3 days before trial ends + 1 day before with clear "You will be charged $X.XX on [date]" messaging. User can cancel before charge. Compliant with FTC auto-renewal guidelines.

---

### Q6.6 — AI-Guided Onboarding
**Source:** Spec 06 [Design]

**✅ DECISION: Structured UI forms with AI welcome message**
Onboarding uses a 3-step wizard (profile → first tank → preferences). After completion, the AI sends a personalized welcome message in the chat: "Welcome! I see you've set up a [tank type] tank. Here are some things I can help with..." This bridges the structured onboarding into the conversational experience.

---

## Category 7: Remaining Minor Questions (14 questions)

### Q7.1 — Magic Link Expiration
**Source:** Spec 06

**✅ DECISION: 15 minutes**
Balances security with user convenience. 5 minutes is too short (email delivery delays). 1 hour is too long (security risk). 15 minutes is standard for magic links.

---

### Q7.2 — Deep Linking (Magic Link on Different Device)
**Source:** Spec 06

**✅ DECISION: Auth on the device that clicks the link**
Standard magic link behavior. If user initiates on desktop but clicks on mobile, mobile gets authenticated. Show a message on the original device: "Check the device where you opened the link." Supabase Auth handles this automatically.

---

### Q7.3 — Real-Time Tank Data Updates
**Source:** Spec 02

**✅ DECISION: Supabase Realtime scoped to active tank**
Subscribe to changes on the active tank's related tables. Unsubscribe when switching tanks. Prevents unnecessary data sync. Uses Supabase Realtime (PostgreSQL NOTIFY/LISTEN under the hood).

---

### Q7.4 — Rate Limiting Tank Creation
**Source:** Spec 02

**✅ DECISION: Tier-based limits + max 10 creations/day**
Primary protection: tier-based tank count limits (DB trigger). Secondary: rate limit of 10 tank create operations per user per day to prevent abuse.

---

### Q7.5 — Caching Strategy for Tank List
**Source:** Spec 02

**✅ DECISION: React Query (TanStack Query) with 5-minute stale time**
Client-side caching via React Query. Stale time: 5 minutes. Invalidate on create/delete/update. No server-side caching needed at v1 scale. React Query handles optimistic updates and background refetch.

---

### Q7.6 — Auto-Prompt for Optional Fields
**Source:** Spec 02

**✅ DECISION: Soft prompt after 7 days**
If a tank has no photo and no dimensions after 7 days, show a subtle info card on the tank detail page: "Add a photo and dimensions to help the AI give better advice for your tank." Dismissible, shown once.

---

### Q7.7 — Tank Volume Conversion
**Source:** Spec 02

**✅ DECISION: Store in gallons; convert on display**
All volumes stored as `volume_gallons` (DECIMAL). Frontend converts to liters when `user.unit_preference_volume = 'liters'`. Conversion factor: 1 gallon = 3.78541 liters. Same pattern as temperature (stored °F, displayed per preference).

---

### Q7.8 — Offline First vs. Online First
**Source:** Spec 08

**✅ DECISION: Online-first with offline resilience**
The app is designed for connected use (AI chat, real-time data). Offline mode is a fallback: view cached data, queue entries, browse cached species. Not designed as an offline-first experience. Service worker ensures the app shell loads offline.

---

### Q7.9 — Push Notification Content Strategy
**Source:** Spec 08

**✅ DECISION: Conservative — max 3 notifications/day per user**
Types: maintenance reminders (max 2/day), parameter alerts (max 1/day), billing alerts (as needed). Respect quiet hours. Users can disable categories individually. Over-notification is the #1 reason users disable push.

---

### Q7.10 — Mobile vs. Desktop Maintenance UI
**Source:** Spec 05

**✅ DECISION: Responsive single UI, optimized for mobile-first**
Mobile: full-screen task cards with swipe-to-complete. Desktop: same layout in wider viewport with side panel for task details. No separate mobile-specific view — responsive CSS handles it.

---

### Q7.11 — Pro Tier Marketing Messaging
**Source:** Spec 10

**✅ DECISION: "AI-Powered Equipment Intelligence"**
Highlight: "Get personalized equipment recommendations with real-time pricing. Know when to replace, what to buy, and where to find the best deals." Position as the premium intelligence layer that saves money on equipment decisions.

---

### Q7.12 — Tank List Sort Order
**Source:** Spec 02 (implicit)

**✅ DECISION: Created date descending (newest first)**
Default sort. Users can re-order via drag-and-drop (P1). Most recent tank is most relevant for most users.

---

### Q7.13 — Notification Delivery for Multiple Devices
**Source:** Spec 05 (implicit)

**✅ DECISION: Send to all registered devices**
Push notification sent to every endpoint in `push_subscriptions` for the user. If user has phone + desktop PWA, both get the notification. Standard Web Push behavior.

---

### Q7.14 — Stripe Webhook Retry Behavior
**Source:** Spec 07 (implicit)

**✅ DECISION: Let Stripe handle retries; always return 200**
Stripe retries up to ~16 times over 3 days for non-2xx responses. Our webhook handler always returns 200 immediately after signature verification. Processing errors are logged and alertable but don't block the webhook response. Idempotency via `webhook_events` table prevents double-processing.

---

## Summary

| Category | Total | Decided | Needs Input |
|----------|-------|---------|-------------|
| AI & Chat Architecture | 13 | 13 | 0 |
| UX & Design | 19 | 16 | 3 |
| Platform & Infrastructure | 14 | 12 | 2 |
| Business & Billing | 16 | 13 | 3 |
| Data & Content | 7 | 7 | 0 |
| Legal & Compliance | 6 | 6 | 0 |
| Minor Questions | 14 | 14 | 0 |
| **TOTAL** | **89** | **81** | **8** |

**8 questions need your input before we can finalize and write decisions back to all specs.**
