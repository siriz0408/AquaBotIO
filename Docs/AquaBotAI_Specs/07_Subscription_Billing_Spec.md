# Subscription & Billing — Feature Specification
**Aquatic AI | R-010 | P0 — Must-Have**

## Problem Statement
Aquatic AI's AI-powered features have real per-user costs (Anthropic API tokens, infrastructure). A sustainable subscription model must balance value delivery with cost management. Users need to clearly understand what each tier offers, experience enough value during trial to convert, and manage their subscription without friction. Poor billing UX leads to involuntary churn; unclear tier differentiation leads to low conversion.

## Goals
- 14-day free trial with full Pro access to maximize perceived value before paywall
- Clear, simple tier differentiation that drives 15% trial-to-paid conversion within 6 months
- Frictionless payment via Stripe Checkout with support for cards, Apple Pay, Google Pay
- Self-service subscription management (upgrade, downgrade, cancel) — zero support tickets needed
- AI usage tracking per user to manage costs and enforce tier limits
- Achieve $5,000+ MRR within 6 months; maintain AI cost per user under $2/month

## Non-Goals
- NG1: Annual billing or discounts — monthly only in v1; annual is a P2 upsell opportunity
- NG2: Family/group plans — single-user subscriptions only
- NG3: Lifetime deals or one-time purchase — subscription-only model
- NG4: In-app purchase (Apple/Google) — web payments only (no App Store fees since we're a PWA)
- NG5: Invoicing or enterprise billing — self-service only

## User Stories
- US-31: As a free trial user, I want to experience the full app for 14 days, so I can evaluate whether it's worth paying for.
- US-32: As a user, I want to see clear pricing tiers (Starter $3.99/mo, Plus $7.99/mo, Pro $14.99/mo) and understand what each includes, so I can choose the right plan.
- US-33: As a paying user, I want to manage my subscription (upgrade, downgrade, cancel) easily, so I'm never locked in.
- US-billing1: As a trial user approaching expiration, I want to receive reminders about my trial ending, so I can decide to subscribe before losing access.
- US-billing2: As a Starter user, I want to see upgrade prompts when I hit tier limits (tank count, message limits), so I understand the value of upgrading.
- US-billing3: As a user who cancels, I want to retain access until the end of my billing period, so I don't feel penalized immediately.
- US-billing4: As a user whose payment fails, I want clear communication and a grace period to update my payment method, so I don't lose access due to an expired card.

## Requirements

### Must-Have (P0)

**Canonical Tier Structure (4-Tier Model):**

| Tier | Price | Description |
|------|-------|-------------|
| **Free** | $0 | Limited access, no credit card required |
| **Starter** | $3.99/mo | Entry paid tier, unlocks basic features |
| **Plus** | $7.99/mo | Mid-tier, unlocks photo diagnosis + equipment |
| **Pro** | $14.99/mo | Full access, unlimited everything |

- **14-day trial gives Pro access**, then drops to Free unless user subscribes

**Canonical Tier/Feature Matrix:**

| Feature | Free | Starter ($3.99) | Plus ($7.99) | Pro ($14.99) |
|---------|------|-----------------|--------------|--------------|
| Tanks | 1 | 1 | 5 | Unlimited |
| AI Messages/day | 10 | 100 | 200 | Unlimited |
| Maintenance Tasks | 3 total | 10/tank | 10/tank | Unlimited |
| Photo Diagnosis | — | — | 10/day | 30/day |
| Equipment Tracking | — | — | ✓ | ✓ |
| AI Equipment Recs | — | — | — | 10/day |
| Email Reports | — | — | — | ✓ |
| Multi-Tank Comparison | — | — | — | ✓ |
| Parameter Tracking | ✓ | ✓ | ✓ | ✓ |
| Species Database | ✓ | ✓ | ✓ | ✓ |
| Livestock Management | ✓ | ✓ | ✓ | ✓ |
| Interactive Dashboards | Basic | Basic | Full | Advanced |

**Notes:**
- Free tier users after trial cannot use AI features but can read existing data
- Trial access grants full Pro features for 14 days
- Upgrade/downgrade changes tier limits immediately (upgrade) or at next billing cycle (downgrade)

#### R-010.1: 14-Day Free Trial
All new users get 14 days of full Pro access. No credit card required to start trial. Clear countdown of days remaining in trial.

**Acceptance Criteria:**
- Given a new user signs up, they automatically receive Pro-level access for 14 days
- Given a user is in trial mode, the app displays a prominent countdown (e.g., "13 days left in your trial")
- Given the trial period expires, the user is prompted to subscribe and downgraded to limited free experience
- Trial access is granted at signup before any authentication confirmation

#### R-010.2: Stripe Checkout Integration
Redirect to Stripe Checkout for payment. Support credit/debit cards, Apple Pay, Google Pay. Post-payment, update user's subscription tier in Supabase.

**Acceptance Criteria:**
- Given a user selects a plan and clicks "Subscribe", they are taken to a Stripe Checkout page
- Stripe Checkout displays all supported payment methods (cards, Apple Pay, Google Pay)
- Given successful payment, user's subscription_tier in Supabase is updated within 10 seconds
- Given payment cancellation or failure, the user remains on their current tier and sees a retry option
- Checkout pre-fills email and retains it for confirmation emails

#### R-010.3: Subscription Management via Stripe Customer Portal
Self-service portal for upgrade, downgrade, cancel, and update payment method. Accessed from account settings.

**Acceptance Criteria:**
- Given a user clicks "Manage Subscription" in account settings, they are taken to Stripe Customer Portal
- Stripe Customer Portal displays current plan, next billing date, billing history, and payment methods
- Given a user upgrades, their tier changes immediately and they are charged the pro-rata difference
- Given a user downgrades, the change takes effect at the next billing cycle
- Given a user cancels, they retain access to all features until the end of the current billing period
- Portal properly reflects all subscription changes within 60 seconds in the app

#### R-010.4: Webhook Handlers for Subscription Lifecycle
Handle the following events from Stripe: subscription created, updated, deleted, payment succeeded, payment failed, trial ending.

**Acceptance Criteria:**
- Given a subscription is created in Stripe, a subscriptions table entry is created in Supabase
- Given a subscription is canceled via Stripe, the user's tier is updated to "free" in Supabase within 60 seconds
- Given a payment fails, the user receives an email notification and has a 7-day grace period before feature lockdown
- Given a subscription is upgraded/downgraded, the tier change reflects in Supabase within 60 seconds
- Webhook signature verification prevents unauthorized updates
- All webhook events are logged for auditing and troubleshooting

#### R-010.5: Tier Enforcement
App enforces tier limits in real-time: tank count, AI message limits, and feature access.

**Acceptance Criteria:**
- Given a Starter user tries to create a 2nd tank, they see an upgrade prompt (not an error)
- Given a user hits their daily AI message limit, they see a helpful upgrade prompt with a link to /pricing
- Given a Plus user tries to access the Web Search Agent (Pro-only), they see a feature-locked UI with upgrade path
- Tier enforcement checks occur before any paid action (AI call, feature access, resource creation)
- Free-tier users after trial cannot use AI features but can read existing data

#### R-010.6: AI Usage Tracking
Track message count, token consumption, and feature type (chat/diagnosis/report) per user per day. Data stored in ai_usage table.

**Acceptance Criteria:**
- Given a user sends an AI message, the message count and token usage are logged in the ai_usage table
- Usage data includes: user_id, date, message_count, tokens_used, feature_type
- Internal reporting can show average tokens/cost per user per tier
- Usage data is logged asynchronously and does not block user interactions
- Usage limits are enforced based on ai_usage data to prevent overage
- Monthly cost per user is calculated from token usage and Anthropic pricing

#### R-010.7: Pricing Page
Clean, scannable pricing page showing all tiers with feature comparison. Highlight recommended tier. Show current plan for authenticated users.

**Acceptance Criteria:**
- Given an unauthenticated user visits /pricing, they see all three tiers with features, pricing, and CTAs
- Given an authenticated user visits /pricing, their current plan is highlighted
- CTA buttons show "Start Trial" for non-trial users and "Upgrade" or "Downgrade" for paying users
- Feature comparison table is easy to scan with checkmarks and dashes
- Recommended tier (Plus) is visually highlighted
- Includes brief FAQ or feature explanations to reduce confusion

#### R-010.8: Trial Expiration Handling
3-day and 1-day reminders before trial ends (in-app notification + email). Post-expiration, user can still access the app in a limited free mode (read-only for existing data, no new AI interactions).

**Acceptance Criteria:**
- Given a user's trial expires in 3 days, they receive an in-app banner and email reminder
- Given a user's trial expires in 1 day, they receive an urgent in-app banner and email reminder
- Given the trial expires and the user doesn't subscribe, they are downgraded to a free, read-only mode
- Free-mode users can view existing tanks, parameters, and history but cannot create new tanks or use AI features
- Trial expiration is checked at login and displayed prominently

### Nice-to-Have (P1)
- **R-010.9: Annual Billing** — Offer annual plans at a 20% discount (e.g., Starter annual $39.90/year vs. $47.88/year monthly equivalent).
- **R-010.10: Promo Codes and Discounts** — Support Stripe coupon codes for marketing campaigns and time-limited promotions.
- **R-010.11: Usage Analytics Dashboard** — In-app view showing users their AI usage patterns (messages sent, tokens used, estimated costs).

### Future Considerations (P2)
- **R-010.12: Family/Group Plans** — Shared subscription for households or small businesses.
- **R-010.13: Enterprise Tier** — Custom pricing for fish stores, breeders, aquarium maintenance companies with tiered support.
- **R-010.14: Referral Program** — Offer credits or discounts for successful referrals.
- **R-010.15: Lifetime Access (Limited)** — Exclusive limited-time offers for early adopters.

## Success Metrics

### Leading Indicators
- Trial-to-paid conversion: 15% within 30 days of trial end
- Average revenue per user (ARPU): Target $8.50/month (based on 40/40/20 tier distribution: 40% Starter @ $3.99, 40% Plus @ $7.99, 20% Pro @ $14.99)
- Payment success rate: > 98% of payment attempts succeed on first try
- Time from pricing page to payment completion: < 3 minutes median
- Failed payment recovery rate: > 70% (users who fix payment method after first failure)

### Lagging Indicators
- Monthly Recurring Revenue (MRR): $5,000+ within 6 months
- Monthly churn rate for paid subscribers: < 8%
- Involuntary churn (failed payments + payment recoverable): < 3% of active subscribers per month
- Tier distribution: 40% Starter, 40% Plus, 20% Pro (by subscriber count)
- AI cost per user: < $2/month average (tokens consumed × Anthropic pricing)
- Customer lifetime value (CLV): Target $150+ (18+ month average lifetime)

## Decisions (Resolved)

### Business Decisions
- ✅ Payment methods: Credit/debit cards via Stripe Checkout. Apple Pay and Google Pay auto-enabled when card payments are configured. No additional payment methods in v1.
- ✅ Post-trial free tier: Users retain read-only access to all existing data (tanks, parameters, history). No new AI interactions, no new tank creation. Existing data is never deleted.
- ✅ Refund policy: NO REFUNDS. Cancellation takes effect at end of current billing period. No prorated refunds for mid-cycle cancellations. This is a firm business decision. See Spec 12 Section 7.9 for implementation details.
- ✅ Free tier long-term: Maintain a functional free tier (read-only for existing data) after trial. No hard paywall — users always have access to their data.
- ✅ Tier distribution target: 40% Starter, 40% Plus, 20% Pro. Validate with actual data after first 500 subscribers.

### Engineering Decisions
- ✅ Grace period: 7 days from first payment failure before feature lockdown. Stripe Smart Retries enabled (4 attempts over ~3 weeks). See Spec 12 Section 7.8 for full recovery flow.
- ✅ Payment recovery: Stripe Smart Retries enabled (ML-optimized retry timing). Application sends notifications at Day 0, Day 3, Day 7. User can self-service update payment via Stripe Customer Portal.
- ✅ Currency: USD only for v1. Stripe Tax enabled for automatic tax calculation. International pricing and currency localization deferred to P2.
- ✅ Usage limits: Per-day limits (not per-month). Resets at midnight UTC. This is fairer — prevents users from burning through monthly limits in one day.
- ✅ Limit enforcement: Hard limits (blocking) for tank creation and AI messages. Friendly upgrade prompts shown when limits are reached (not error messages).

### Legal/Compliance
- ✅ Tax handling: Stripe Tax handles all US markets. International tax compliance evaluated when expanding beyond US.
- ✅ Refund/cancellation policy: No refunds. Cancellation retains access until period end. Compliant with US consumer protection standards. Terms of service explicitly state no-refund policy.
- ✅ Terms of service: Explicit terms required. Checkbox consent at Stripe Checkout. Terms cover automatic billing, trial-to-paid conversion, and no-refund policy.

## Timeline Considerations

### Phase 1: MVP (Blocker for Launch)
Estimated: 2-3 sprints
- Implement 14-day trial with no credit card required
- Build 3-tier pricing structure with clear feature gates
- Integrate Stripe Checkout for payment collection
- Implement webhook handlers for subscription lifecycle
- Build tier enforcement logic across the app
- Create pricing page with CTA and feature comparison
- Implement trial expiration reminders and downgrade flow

### Phase 2: Post-Launch Polish
Estimated: 1-2 sprints (after gathering user feedback)
- Implement AI usage tracking and analytics dashboard
- Improve grace period handling for failed payments
- Add more granular feature restriction messaging
- Optimize Stripe Customer Portal integration

### Dependencies
- **On R-009 (Authentication):** Billing is tied to user accounts; auth must be stable and tested first
- **Pre-Development:** Stripe account setup, Checkout configuration, Customer Portal settings, Webhook endpoint configuration
- **Architectural:** Tier enforcement touches nearly every feature (AI chat, tank creation, diagnostics, reports) — must be architected early as middleware/utility functions

## Technical Notes

### Payment Stack
- **Stripe Checkout:** Hosted payment page for initial subscription
- **Stripe Customer Portal:** Self-service management (upgrade, downgrade, cancel, payment method updates)
- **Stripe Webhooks:** Event-driven updates to subscription status in Supabase (subscription.created, invoice.payment_succeeded, etc.)
- **Stripe Tax (Optional):** For automatic tax calculation and compliance

### Data Models

**users table additions:**
```
- subscription_tier: enum ('free', 'starter', 'plus', 'pro')
- trial_end_date: timestamp (null if not in trial)
- stripe_customer_id: string (unique, references Stripe customer)
- subscription_status: enum ('active', 'past_due', 'canceled', 'expired')
```

**subscriptions table (new):**
```
- id: uuid (primary key)
- user_id: uuid (foreign key to users)
- stripe_subscription_id: string (unique)
- stripe_product_id: string
- tier: enum ('starter', 'plus', 'pro')
- status: enum ('active', 'past_due', 'canceled', 'expired')
- current_period_start: timestamp
- current_period_end: timestamp
- cancel_at_period_end: boolean (true if user canceled but access retained until period end)
- created_at: timestamp
- updated_at: timestamp
```

**ai_usage table (new):**
```
- id: uuid (primary key)
- user_id: uuid (foreign key to users)
- date: date
- feature: enum ('chat', 'diagnosis', 'report', 'search')
- message_count: integer
- tokens_used: integer
- estimated_cost: numeric (calculated from tokens × Anthropic pricing)
- created_at: timestamp
```

### Tier Enforcement Architecture
Implement as middleware/utility functions:
- `canCreateTank(user_id): boolean` — check tank count vs. tier limit
- `canUseAIFeature(user_id): boolean` — check if trial/paid or in grace period
- `canAccessFeature(user_id, feature): boolean` — check if feature is available for tier
- `getRemainingAIMessages(user_id): number` — calculate remaining daily messages
- Called before any paid action or resource creation

### Security Considerations
- **Webhook Signature Verification:** Always verify Stripe webhook signature using shared secret before processing events
- **No Sensitive Billing Data in Supabase:** Only store subscription IDs and tier; never store card details, customer data beyond ID
- **API Key Management:** Stripe keys stored as environment variables, never committed to source control
- **HTTPS Only:** All Stripe communication over HTTPS
- **Rate Limiting:** Rate limit webhook endpoints to prevent abuse

### Monitoring and Logging
- Log all webhook events (creation, updates, failures) with timestamps and payloads
- Monitor failed payments and alert ops team for manual follow-up if recovery fails
- Track subscription churn trends weekly
- Monitor AI usage for cost overruns per user and alert if approaching limits

## Acceptance Test Plan

### Feature-Level Tests

**Trial & Onboarding:**
- [ ] New user signs up and receives 14-day trial with full Pro access
- [ ] Trial countdown displays correctly and updates daily
- [ ] Trial expiration email sent 3 days and 1 day before expiration
- [ ] Trial expiration downgrade to free mode works as designed

**Pricing Page:**
- [ ] All three tiers display with accurate pricing and features
- [ ] Feature comparison table is accurate and scannable
- [ ] Authenticated user sees "current plan" highlight
- [ ] CTA buttons work correctly for each user state (trial, free, paid)

**Payment Flow:**
- [ ] User can subscribe to Starter, Plus, or Pro from pricing page
- [ ] Stripe Checkout loads correctly with email pre-filled
- [ ] All payment methods work (card, Apple Pay, Google Pay on supported devices)
- [ ] Successful payment updates user tier in Supabase within 10 seconds
- [ ] User receives confirmation email with invoice and next billing date

**Subscription Management:**
- [ ] User can access Stripe Customer Portal from account settings
- [ ] User can upgrade tier and see immediate upgrade
- [ ] User can downgrade tier with change effective next billing cycle
- [ ] User can cancel subscription and retain access until period end
- [ ] User can update payment method via Customer Portal

**Tier Enforcement:**
- [ ] Starter user cannot create 2nd tank; sees upgrade prompt instead of error
- [ ] Plus user cannot create 6th tank; sees upgrade prompt
- [ ] Pro user can create unlimited tanks
- [ ] Starter user with daily message limit sees upgrade prompt when limit hit
- [ ] Photo diagnosis feature unavailable to Starter; shows feature lock with upgrade link
- [ ] Web Search Agent unavailable to Starter/Plus; shows feature lock with upgrade link

**Failed Payments & Grace Period:**
- [ ] Failed payment triggers email notification to user
- [ ] User retains access for 7 days during grace period
- [ ] User can update payment method via Customer Portal to recover access
- [ ] After grace period, access revoked and user sees upgrade/retry messaging

**AI Usage Tracking:**
- [ ] Each AI message increments ai_usage.message_count for user
- [ ] Each AI call logs tokens_used accurately
- [ ] Internal reporting query shows cost per user and tier
- [ ] Usage limits prevent overage (hard or soft limits per spec)

---

**Document Status:** Initial Draft
**Last Updated:** 2026-02-07
**Author:** Product & Engineering Team
**Next Review:** After Phase 1 MVP launch

