# AquaBotAI Ship Readiness: Test Plan
**Document ID:** 02_Test_Plan.md
**Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** 2026-02-07

---

## Executive Summary

This test plan provides a practical, solo-developer-friendly testing strategy for AquaBotAI. Rather than aiming for 100% coverage (unrealistic for a bootstrapped project), we focus on **high-impact, high-risk** areas: authentication, billing, tier enforcement, AI integration, and data isolation. The plan balances automation with manual testing to maximize quality per hour invested.

**Testing Philosophy:**
- **Automate what's fragile & repetitive** — auth flows, tier logic, webhook processing
- **Manually test what needs human judgment** — UI flows, visual layouts, Claude response quality
- **Skip nice-to-haves** — exhaustive edge cases in non-critical features, cosmetic styling tests
- **Prioritize launch blockers** — payment processing, user isolation, chat functionality, push notifications

---

## 1. Test Strategy Overview

### 1.1 Testing Pyramid for Solo Dev

```
                    /\
                   /  \        Manual/Exploratory (15%)
                  /----\       UI flows, edge cases, performance hunting
                 /      \
                /--------\     Integration Tests (25%)
               /          \    API chains, webhook→subscription, notification queues
              /            \
             /              \  Unit Tests (60%)
            /________________\ Helpers, validators, tier logic, recurrence
```

### 1.2 Recommended Test Stack

| Tool | Purpose | Notes |
|------|---------|-------|
| **Vitest** | Unit + integration tests | Fast, TypeScript-native, ESM support |
| **@testing-library/react** | Component testing | Focuses on user behavior, not implementation |
| **Playwright** | E2E tests | Cross-browser, headless, API testing |
| **Supabase Local Dev** | Database testing | `supabase start`, seed with SQL, full RLS testing |
| **Stripe CLI** | Webhook testing | `stripe listen`, forward events to localhost |
| **Anthropic mock SDK** | Claude testing | Mock `messages.create()` calls |
| **Mock Service Worker (MSW)** | API mocking | Intercept fetch/axios at network layer |

### 1.3 Testing Scope by Feature

| Feature | Unit | Integration | E2E | Manual |
|---------|------|-------------|-----|--------|
| Auth & Onboarding | ✓ | ✓ | ✓ | ✓ |
| Tank Profiles | ✓ | ✓ | ✓ | — |
| AI Chat Engine | ✓ | ✓ | ✓ | ✓ |
| Water Parameters | ✓ | ✓ | ✓ | — |
| Species Database | ✓ | ✓ | ✓ | — |
| Maintenance Tasks | ✓ | ✓ | ✓ | ✓ |
| Billing & Subscriptions | ✓ | ✓ | ✓ | ✓ |
| PWA & Offline | — | ✓ | ✓ | ✓ |
| Photo Diagnosis | ✓ | ✓ | ✓ | ✓ |
| Equipment Tracking | ✓ | ✓ | — | — |
| Dashboards & Reports | — | ✓ | ✓ | ✓ |
| Admin Portal | — | ✓ | ✓ | ✓ |

### 1.4 Test Environment Baseline

**Local Dev (Most Tests):**
- Node.js 20+
- Supabase CLI with local PostgreSQL
- Anthropic API key (test account)
- Stripe test mode keys
- Next.js dev server running on `localhost:3000`

**Staging/Vercel Preview:**
- Real Stripe test cards
- Supabase staging project
- Verify push notification flow end-to-end

**Production:**
- Smoke tests only (critical user flows)
- Monitoring & alerting (not traditional tests)

---

## 2. Unit Test Coverage Map

Unit tests focus on isolated, deterministic logic. Mock all external dependencies.

### 2.1 Authentication Module (`lib/auth/*`)

**Test File:** `tests/unit/auth.test.ts`

#### Test Cases:

**2.1.1 JWT Token Validation**
```typescript
describe('validateJWT', () => {
  test('accepts valid token with valid signature', () => {
    const token = createSignedToken(secret);
    expect(validateJWT(token, secret)).toEqual({ valid: true, user_id: '123' });
  });

  test('rejects expired token', () => {
    const token = createSignedToken(secret, { expiresIn: '-1h' });
    expect(validateJWT(token, secret)).toEqual({ valid: false, error: 'TOKEN_EXPIRED' });
  });

  test('rejects token with invalid signature', () => {
    const token = createSignedToken(secret);
    expect(validateJWT(token, 'wrong_secret')).toEqual({ valid: false, error: 'INVALID_SIGNATURE' });
  });

  test('rejects malformed token', () => {
    expect(validateJWT('not.a.token', secret)).toEqual({ valid: false, error: 'MALFORMED' });
  });
});
```

**2.1.2 Session Refresh Logic**
```typescript
describe('refreshSession', () => {
  test('returns new token when refresh token is valid', async () => {
    const refreshToken = await createRefreshToken(user_id);
    const result = await refreshSession(refreshToken);
    expect(result.accessToken).toBeDefined();
    expect(result.expiresIn).toBe(3600);
  });

  test('rejects refresh token after one use (rotation)', async () => {
    const refreshToken = await createRefreshToken(user_id);
    await refreshSession(refreshToken);
    const second = await refreshSession(refreshToken);
    expect(second.error).toBe('REFRESH_TOKEN_REVOKED');
  });

  test('rate-limits refresh attempts (max 5/min per user)', async () => {
    const refreshToken = await createRefreshToken(user_id);
    for (let i = 0; i < 5; i++) {
      await refreshSession(refreshToken);
    }
    const sixth = await refreshSession(refreshToken);
    expect(sixth.error).toBe('RATE_LIMIT_EXCEEDED');
  });
});
```

**2.1.3 Rate Limiting**
```typescript
describe('rateLimitCheck', () => {
  test('allows requests under rate limit', () => {
    const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60000 });
    for (let i = 0; i < 10; i++) {
      expect(limiter.check('user123')).toBe(true);
    }
  });

  test('blocks requests over rate limit', () => {
    const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60000 });
    for (let i = 0; i < 10; i++) {
      limiter.check('user123');
    }
    expect(limiter.check('user123')).toBe(false);
  });

  test('resets rate limit after window expires', async () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 100 });
    limiter.check('user123');
    limiter.check('user123');
    expect(limiter.check('user123')).toBe(false);
    await new Promise(r => setTimeout(r, 150));
    expect(limiter.check('user123')).toBe(true);
  });
});
```

### 2.2 Tier Enforcement Module (`lib/tiers/*`)

**Test File:** `tests/unit/tiers.test.ts`

#### Test Cases:

**2.2.1 Tank Creation Limits**
```typescript
describe('canUserCreateTank', () => {
  test('free tier allowed 1 tank', async () => {
    const user = { id: 'user1', tier: 'free' };
    const tanks = []; // 0 tanks
    expect(await canUserCreateTank(user, tanks)).toBe(true);
  });

  test('free tier blocked at 1 tank', async () => {
    const user = { id: 'user1', tier: 'free' };
    const tanks = [{ id: 'tank1' }];
    const result = await canUserCreateTank(user, tanks);
    expect(result).toEqual({ allowed: false, reason: 'FREE_TIER_LIMIT', message: 'Upgrade to Starter for 5 tanks' });
  });

  test('starter tier allows 5 tanks', async () => {
    const user = { id: 'user1', tier: 'starter' };
    const tanks = Array(5).fill({}).map((_, i) => ({ id: `tank${i}` }));
    expect(await canUserCreateTank(user, tanks)).toEqual({ allowed: true });
  });

  test('pro tier unlimited tanks', async () => {
    const user = { id: 'user1', tier: 'pro' };
    const tanks = Array(100).fill({}).map((_, i) => ({ id: `tank${i}` }));
    expect(await canUserCreateTank(user, tanks)).toEqual({ allowed: true });
  });
});
```

**2.2.2 AI Chat Message Limits**
```typescript
describe('canSendAIMessage', () => {
  test('free tier: 10 messages/day', async () => {
    const user = { id: 'user1', tier: 'free' };
    const usage = { messages_today: 9 };
    expect(await canSendAIMessage(user, usage)).toBe(true);

    usage.messages_today = 10;
    expect(await canSendAIMessage(user, usage)).toEqual({ allowed: false, reason: 'DAILY_LIMIT' });
  });

  test('starter tier: 100 messages/day', async () => {
    const user = { id: 'user1', tier: 'starter' };
    const usage = { messages_today: 99 };
    expect(await canSendAIMessage(user, usage)).toBe(true);
  });

  test('pro tier: unlimited messages', async () => {
    const user = { id: 'user1', tier: 'pro' };
    const usage = { messages_today: 10000 };
    expect(await canSendAIMessage(user, usage)).toBe(true);
  });

  test('trial users get starter limits', async () => {
    const user = { id: 'user1', tier: 'free', trial_active: true };
    const usage = { messages_today: 99 };
    expect(await canSendAIMessage(user, usage)).toBe(true);
  });
});
```

**2.2.3 Feature Access Control**
```typescript
describe('canAccessFeature', () => {
  test('photo diagnosis free → blocked', () => {
    expect(canAccessFeature('free', 'photo_diagnosis')).toBe(false);
  });

  test('photo diagnosis plus → allowed', () => {
    expect(canAccessFeature('plus', 'photo_diagnosis')).toBe(true);
  });

  test('equipment tracking pro → allowed', () => {
    expect(canAccessFeature('pro', 'equipment_tracking')).toBe(true);
  });

  test('equipment tracking starter → blocked', () => {
    expect(canAccessFeature('starter', 'equipment_tracking')).toBe(false);
  });
});
```

### 2.3 Water Parameter Validation (`lib/parameters/*`)

**Test File:** `tests/unit/parameters.test.ts`

#### Test Cases:

**2.3.1 Safe/Warning/Danger Classification**
```typescript
describe('classifyParameter', () => {
  const spec = {
    name: 'pH',
    safe_min: 6.5,
    safe_max: 7.5,
    warning_min: 6.0,
    warning_max: 8.0,
    unit: ''
  };

  test('value in safe range → SAFE', () => {
    expect(classifyParameter(7.0, spec)).toEqual({ status: 'SAFE', color: 'green' });
  });

  test('value in warning range (low) → WARNING', () => {
    expect(classifyParameter(6.2, spec)).toEqual({ status: 'WARNING', color: 'yellow' });
  });

  test('value in warning range (high) → WARNING', () => {
    expect(classifyParameter(7.8, spec)).toEqual({ status: 'WARNING', color: 'yellow' });
  });

  test('value in danger range (too low) → DANGER', () => {
    expect(classifyParameter(5.5, spec)).toEqual({ status: 'DANGER', color: 'red' });
  });

  test('value in danger range (too high) → DANGER', () => {
    expect(classifyParameter(8.5, spec)).toEqual({ status: 'DANGER', color: 'red' });
  });
});
```

**2.3.2 Parameter Entry Validation**
```typescript
describe('validateParameterEntry', () => {
  test('rejects negative values where invalid', () => {
    expect(validateParameterEntry({ temp_c: -5, tank_id: '1' })).toEqual({
      valid: false,
      errors: [{ field: 'temp_c', message: 'Temperature cannot be negative' }]
    });
  });

  test('rejects out-of-realistic-range values', () => {
    expect(validateParameterEntry({ temp_c: 100, tank_id: '1' })).toEqual({
      valid: false,
      errors: [{ field: 'temp_c', message: 'Temperature unrealistic (expected 10-40°C)' }]
    });
  });

  test('accepts valid parameter set', () => {
    const valid = { temp_c: 25, ph: 7.0, ammonia_ppm: 0.1, tank_id: '1' };
    expect(validateParameterEntry(valid)).toEqual({ valid: true });
  });

  test('warns on sudden parameter swings', () => {
    const current = { temp_c: 25, timestamp: Date.now() };
    const previous = { temp_c: 20, timestamp: Date.now() - 3600000 };
    const result = validateParameterEntry(current, previous);
    expect(result.warnings).toContain('Temperature jumped 5°C in 1 hour');
  });
});
```

### 2.4 AI Context Builder (`lib/ai/context.ts`)

**Test File:** `tests/unit/ai-context.test.ts`

#### Test Cases:

**2.4.1 System Prompt Construction**
```typescript
describe('buildSystemPrompt', () => {
  test('includes tank species info', () => {
    const tank = {
      name: 'Community Tank',
      type: 'freshwater',
      species: [
        { name: 'Neon Tetra', count: 10 },
        { name: 'Corydoras Catfish', count: 5 }
      ]
    };
    const prompt = buildSystemPrompt(tank);
    expect(prompt).toContain('10 Neon Tetra');
    expect(prompt).toContain('5 Corydoras Catfish');
  });

  test('includes recent parameter history', () => {
    const tank = { name: 'Tank 1' };
    const params = [
      { temp_c: 25, ph: 7.0, timestamp: '2 hours ago' }
    ];
    const prompt = buildSystemPrompt(tank, params);
    expect(prompt).toContain('25°C');
    expect(prompt).toContain('pH 7.0');
  });

  test('includes active maintenance tasks', () => {
    const tank = { name: 'Tank 1' };
    const tasks = [
      { name: 'Water Change', due_date: '2 days overdue' },
      { name: 'Filter Clean', due_date: 'due tomorrow' }
    ];
    const prompt = buildSystemPrompt(tank, [], tasks);
    expect(prompt).toContain('Water Change');
    expect(prompt).toContain('2 days overdue');
  });

  test('enforces context length limit (4000 tokens)', () => {
    const largeSpecies = Array(500).fill({ name: 'Fish', count: 10 });
    const prompt = buildSystemPrompt({ name: 'Tank', species: largeSpecies });
    const tokens = estimateTokenCount(prompt);
    expect(tokens).toBeLessThanOrEqual(4000);
  });
});
```

**2.4.2 Token Counting**
```typescript
describe('estimateTokenCount', () => {
  test('counts roughly 1 token per 4 characters', () => {
    const text = 'a'.repeat(400); // 400 chars ≈ 100 tokens
    expect(estimateTokenCount(text)).toBeCloseTo(100, -1); // ±10 tokens
  });

  test('counts complete message chain', () => {
    const messages = [
      { role: 'system', content: 'You are an aquarium expert.' },
      { role: 'user', content: 'Is my pH safe?' },
      { role: 'assistant', content: 'Yes, pH 7.0 is ideal for most freshwater fish.' }
    ];
    const tokens = estimateTokenCount(messages);
    expect(tokens).toBeGreaterThan(30);
    expect(tokens).toBeLessThan(100);
  });

  test('flags when approaching rate limit', () => {
    const context = buildContextChunk(3800); // 3800 tokens
    expect(context.nearLimit).toBe(false);

    const context2 = buildContextChunk(3950); // 3950 tokens
    expect(context2.nearLimit).toBe(true);
  });
});
```

### 2.5 Stripe Webhook Handler (`app/api/webhooks/stripe.ts`)

**Test File:** `tests/unit/stripe-webhooks.test.ts`

#### Test Cases:

**2.5.1 Signature Verification**
```typescript
describe('verifyStripeSignature', () => {
  test('accepts valid signature', () => {
    const payload = JSON.stringify({ id: 'evt_test', type: 'customer.subscription.updated' });
    const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
    expect(verifyStripeSignature(payload, sig)).toBe(true);
  });

  test('rejects invalid signature', () => {
    const payload = JSON.stringify({ id: 'evt_test', type: 'customer.subscription.updated' });
    expect(verifyStripeSignature(payload, 'invalid_sig')).toBe(false);
  });

  test('rejects tampered payload', () => {
    const payload = JSON.stringify({ id: 'evt_test', type: 'customer.subscription.updated' });
    const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
    const tamperedPayload = JSON.stringify({ id: 'evt_test', type: 'charge.succeeded' });
    expect(verifyStripeSignature(tamperedPayload, sig)).toBe(false);
  });
});
```

**2.5.2 Subscription Event Handling**
```typescript
describe('handleSubscriptionEvent', () => {
  test('subscription.created → inserts subscription record', async () => {
    const event = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test123',
          customer: 'cus_test123',
          status: 'active',
          items: {
            data: [{ price: { id: 'price_starter' } }]
          }
        }
      }
    };
    await handleSubscriptionEvent(event);
    const sub = await db.subscriptions.findOne({ stripe_subscription_id: 'sub_test123' });
    expect(sub).toBeDefined();
    expect(sub.tier).toBe('starter');
  });

  test('subscription.updated → updates tier if price changed', async () => {
    // Setup: user has starter subscription
    await db.subscriptions.insert({
      user_id: 'user1',
      stripe_subscription_id: 'sub_test123',
      tier: 'starter'
    });

    const event = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          items: { data: [{ price: { id: 'price_pro' } }] }
        }
      }
    };
    await handleSubscriptionEvent(event);
    const sub = await db.subscriptions.findOne({ stripe_subscription_id: 'sub_test123' });
    expect(sub.tier).toBe('pro');
  });

  test('subscription.deleted → soft-deletes subscription', async () => {
    await db.subscriptions.insert({
      user_id: 'user1',
      stripe_subscription_id: 'sub_test123',
      tier: 'starter'
    });

    const event = {
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_test123' } }
    };
    await handleSubscriptionEvent(event);
    const sub = await db.subscriptions.findOne({ stripe_subscription_id: 'sub_test123' });
    expect(sub.deleted_at).toBeDefined();
  });

  test('idempotency: processing same event twice has no side effects', async () => {
    const event = {
      type: 'customer.subscription.created',
      id: 'evt_idempotent123',
      data: {
        object: {
          id: 'sub_test123',
          customer: 'cus_test123',
          status: 'active',
          items: { data: [{ price: { id: 'price_starter' } }] }
        }
      }
    };

    await handleSubscriptionEvent(event);
    const count1 = await db.subscriptions.count({ stripe_subscription_id: 'sub_test123' });

    await handleSubscriptionEvent(event);
    const count2 = await db.subscriptions.count({ stripe_subscription_id: 'sub_test123' });

    expect(count1).toBe(count2); // no duplication
  });
});
```

**2.5.3 Payment Failure Handling**
```typescript
describe('handlePaymentFailure', () => {
  test('charge.failed → increments retry count', async () => {
    await db.subscriptions.insert({
      user_id: 'user1',
      stripe_subscription_id: 'sub_test123',
      payment_retries: 0
    });

    const event = {
      type: 'charge.failed',
      data: {
        object: {
          billing_details: { customer: 'cus_test123' }
        }
      }
    };
    await handlePaymentFailure(event);
    const sub = await db.subscriptions.findOne({ stripe_subscription_id: 'sub_test123' });
    expect(sub.payment_retries).toBe(1);
  });

  test('grace period: 3 retries before downgrade', async () => {
    await db.subscriptions.insert({
      user_id: 'user1',
      stripe_subscription_id: 'sub_test123',
      tier: 'pro',
      payment_retries: 2
    });

    const event = {
      type: 'charge.failed',
      data: { object: { billing_details: { customer: 'cus_test123' } } }
    };

    // Retry 3 triggers downgrade
    await handlePaymentFailure(event);
    const sub = await db.subscriptions.findOne({ stripe_subscription_id: 'sub_test123' });
    expect(sub.tier).toBe('starter');
    expect(sub.grace_period_ends_at).toBeDefined();
  });
});
```

### 2.6 Maintenance Task Recurrence (`lib/maintenance/recurrence.ts`)

**Test File:** `tests/unit/recurrence.test.ts`

#### Test Cases:

**2.6.1 Next Due Date Calculation**
```typescript
describe('calculateNextDueDate', () => {
  const baseDate = new Date('2026-02-07T10:00:00Z');

  test('daily: next due tomorrow', () => {
    const task = { name: 'Feed', frequency: 'daily', last_completed_at: baseDate };
    const next = calculateNextDueDate(task, baseDate);
    expect(next).toEqual(new Date('2026-02-08T10:00:00Z'));
  });

  test('weekly: next due in 7 days', () => {
    const task = { name: 'Water Change', frequency: 'weekly', last_completed_at: baseDate };
    const next = calculateNextDueDate(task, baseDate);
    expect(next).toEqual(new Date('2026-02-14T10:00:00Z'));
  });

  test('biweekly: next due in 14 days', () => {
    const task = { name: 'Filter Clean', frequency: 'biweekly', last_completed_at: baseDate };
    const next = calculateNextDueDate(task, baseDate);
    expect(next).toEqual(new Date('2026-02-21T10:00:00Z'));
  });

  test('monthly: next due at same time next month', () => {
    const task = { name: 'Heater Service', frequency: 'monthly', last_completed_at: baseDate };
    const next = calculateNextDueDate(task, baseDate);
    expect(next).toEqual(new Date('2026-03-07T10:00:00Z'));
  });

  test('custom interval (every 3 days)', () => {
    const task = { name: 'Custom', frequency: 'custom', custom_interval_days: 3, last_completed_at: baseDate };
    const next = calculateNextDueDate(task, baseDate);
    expect(next).toEqual(new Date('2026-02-10T10:00:00Z'));
  });

  test('handles never-completed task (use created_at)', () => {
    const task = { name: 'First Clean', frequency: 'weekly', created_at: baseDate, last_completed_at: null };
    const next = calculateNextDueDate(task, baseDate);
    expect(next).toEqual(new Date('2026-02-14T10:00:00Z'));
  });

  test('overdue task: next due is next occurrence from now', () => {
    const lastCompleted = new Date('2026-01-24T10:00:00Z'); // 14 days ago
    const task = { name: 'Water Change', frequency: 'weekly', last_completed_at: lastCompleted };
    const next = calculateNextDueDate(task, baseDate);
    expect(next).toEqual(new Date('2026-02-07T10:00:00Z')); // due now
  });
});
```

**2.6.2 Overdue Task Detection**
```typescript
describe('isTaskOverdue', () => {
  const now = new Date('2026-02-07T10:00:00Z');

  test('task due tomorrow: not overdue', () => {
    const task = { due_date: new Date('2026-02-08T10:00:00Z') };
    expect(isTaskOverdue(task, now)).toBe(false);
  });

  test('task due now: not overdue (grace period)', () => {
    const task = { due_date: new Date('2026-02-07T10:00:00Z') };
    expect(isTaskOverdue(task, now)).toBe(false);
  });

  test('task due 1 hour ago: overdue', () => {
    const task = { due_date: new Date('2026-02-07T09:00:00Z') };
    expect(isTaskOverdue(task, now)).toBe(true);
  });

  test('task due 5 days ago: overdue', () => {
    const task = { due_date: new Date('2026-02-02T10:00:00Z') };
    const daysOverdue = getDaysOverdue(task, now);
    expect(daysOverdue).toBe(5);
  });
});
```

---

## 3. Integration Test Cases

Integration tests verify interactions between modules. Use real Supabase local instance & mock external APIs.

### 3.1 Auth → Tank Creation → AI Chat Flow

**Test File:** `tests/integration/auth-tank-chat.test.ts`

```typescript
describe('New user flow: signup → tank → AI chat', () => {
  beforeEach(async () => {
    // Reset local Supabase
    await supabase.reset();
  });

  test('complete flow with context injection', async () => {
    // Step 1: Sign up
    const { user, session } = await signupUser({
      email: 'newuser@test.com',
      password: 'TestPass123!',
      name: 'Alex'
    });
    expect(user.id).toBeDefined();
    expect(session.access_token).toBeDefined();

    // Step 2: Verify email (skip in local dev for speed)
    await setUserMetadata(user.id, { email_verified: true });

    // Step 3: Create tank
    const tank = await createTank(user.id, {
      name: 'Beginner Tank',
      type: 'freshwater',
      gallons: 20,
      species: [
        { name: 'Neon Tetra', count: 10 },
        { name: 'Corydoras Catfish', count: 4 }
      ]
    });
    expect(tank.id).toBeDefined();

    // Step 4: Add water parameters
    await addWaterParameter(tank.id, {
      temp_c: 26,
      ph: 6.8,
      ammonia_ppm: 0.1,
      timestamp: new Date()
    });

    // Step 5: Send AI message
    const mockClaude = vi.spyOn(anthropic.messages, 'create')
      .mockResolvedValueOnce({
        id: 'msg_test',
        content: [{ type: 'text', text: 'Your tank looks healthy!' }],
        usage: { input_tokens: 150, output_tokens: 25 }
      });

    const response = await sendAIMessage(user.id, tank.id, {
      message: 'Is my tank healthy?'
    });

    // Verify context was built and sent
    expect(mockClaude).toHaveBeenCalledOnce();
    const callArgs = mockClaude.mock.calls[0][0];
    expect(callArgs.system).toContain('Neon Tetra');
    expect(callArgs.system).toContain('26°C');
    expect(callArgs.messages[callArgs.messages.length - 1].content).toContain('Is my tank healthy?');

    // Verify usage tracking
    expect(response.usage_tokens_consumed).toBe(175);
    const userUsage = await getUserAIUsageToday(user.id);
    expect(userUsage.messages_today).toBe(1);
    expect(userUsage.tokens_used).toBe(175);
  });

  test('tier enforcement: free user hits 10 message limit', async () => {
    const { user } = await signupUser({ email: 'free@test.com', password: 'Pass123!' });
    await setUserMetadata(user.id, { tier: 'free' });
    const tank = await createTank(user.id, { name: 'Tank' });

    // Send 10 messages
    for (let i = 0; i < 10; i++) {
      const response = await sendAIMessage(user.id, tank.id, { message: `Q${i}` });
      expect(response.success).toBe(true);
    }

    // 11th message should fail
    const response = await sendAIMessage(user.id, tank.id, { message: 'Q11' });
    expect(response.error).toBe('DAILY_LIMIT_EXCEEDED');
    expect(response.upgrade_prompt).toBeDefined();
  });
});
```

### 3.2 Parameter Entry → AI Analysis → Dashboard Update

**Test File:** `tests/integration/params-analysis-dashboard.test.ts`

```typescript
describe('Parameter logging flow', () => {
  test('parameter entry → classification → dashboard update', async () => {
    const user = await createTestUser();
    const tank = await createTank(user.id, { name: 'Tank' });

    // Add parameters with warning values
    await addWaterParameter(tank.id, {
      temp_c: 28, // high end, normal
      ph: 5.5,    // WARNING: below safe min of 6.5
      ammonia_ppm: 0.5, // WARNING: elevated
      timestamp: new Date()
    });

    // Query dashboard data
    const dashboard = await getTankDashboard(tank.id);
    expect(dashboard.current_parameters).toEqual({
      temp: { value: 28, status: 'SAFE', color: 'green' },
      ph: { value: 5.5, status: 'WARNING', color: 'yellow' },
      ammonia: { value: 0.5, status: 'WARNING', color: 'yellow' }
    });

    // Trigger AI analysis
    const analysis = await analyzeWaterParameters(tank.id);
    expect(analysis.summary).toContain('pH is low');
    expect(analysis.summary).toContain('ammonia elevated');
    expect(analysis.recommendations).toContain('perform water change');

    // Dashboard health score should reflect warnings
    expect(dashboard.health_score).toBeLessThan(80);
  });

  test('chart data aggregation for 90-day dashboard', async () => {
    const user = await createTestUser();
    const tank = await createTank(user.id, { name: 'Tank' });

    // Insert 90 days of parameters (1 per day)
    for (let i = 0; i < 90; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (90 - i));
      await addWaterParameter(tank.id, {
        temp_c: 25 + Math.sin(i / 14) * 2, // sine wave pattern
        ph: 7.0 + Math.random() * 0.2,
        timestamp: date
      });
    }

    const chartData = await getParameterChartData(tank.id, { days: 90 });
    expect(chartData.length).toBe(90);
    expect(chartData[0].timestamp).toBeDefined();
    expect(chartData[0].temp).toBeDefined();
  });
});
```

### 3.3 Livestock Add → Compatibility Check → AI Warning

**Test File:** `tests/integration/livestock-compatibility.test.ts`

```typescript
describe('Livestock compatibility flow', () => {
  test('add aggressive fish → compatibility check warns of conflicts', async () => {
    const user = await createTestUser();
    const tank = await createTank(user.id, {
      name: 'Community Tank',
      type: 'freshwater',
      gallons: 20,
      species: [
        { name: 'Neon Tetra', count: 10, temperament: 'peaceful' }
      ]
    });

    // Add Oscar Fish (aggressive, incompatible with Neon Tetras)
    const result = await addLivestock(tank.id, {
      species_id: 'oscar_fish',
      count: 1
    });

    expect(result.compatibility_issues).toBeDefined();
    expect(result.compatibility_issues[0]).toContain('Oscar may eat Neon Tetras');

    // Trigger AI warning generation
    const aiWarning = await generateCompatibilityWarning(tank.id);
    expect(aiWarning.message).toContain('aggressive');
    expect(aiWarning.severity).toBe('HIGH');
  });

  test('add compatible species → no warnings', async () => {
    const user = await createTestUser();
    const tank = await createTank(user.id, {
      name: 'Community Tank',
      type: 'freshwater',
      species: [{ name: 'Neon Tetra', count: 10 }]
    });

    const result = await addLivestock(tank.id, {
      species_id: 'cardinal_tetra',
      count: 8
    });

    expect(result.compatibility_issues).toEqual([]);
  });
});
```

### 3.4 Task Creation → Notification Scheduling → Push Delivery

**Test File:** `tests/integration/task-notification.test.ts`

```typescript
describe('Maintenance task notification flow', () => {
  test('create recurring task → schedule notification → push on due date', async () => {
    const user = await createTestUser();
    const tank = await createTank(user.id, { name: 'Tank' });

    // Create recurring task
    const task = await createMaintenanceTask(tank.id, {
      name: 'Weekly Water Change',
      frequency: 'weekly',
      notification_enabled: true,
      push_notification: true
    });
    expect(task.id).toBeDefined();

    // Verify notification is scheduled for next due date
    const scheduled = await getScheduledNotifications(user.id);
    expect(scheduled).toContainEqual({
      task_id: task.id,
      type: 'TASK_DUE',
      scheduled_for: expect.any(Date)
    });

    // Simulate time progression: fast-forward 7 days
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    vi.useFakeTimers();
    vi.setSystemTime(futureDate);

    // Trigger notification queue processor
    const notifications = await processNotificationQueue();
    expect(notifications).toContainEqual({
      user_id: user.id,
      title: 'Weekly Water Change due',
      body: expect.stringContaining('Tank')
    });

    // Verify Web Push would be sent
    const mockPush = vi.spyOn(webPush, 'sendNotification');
    await sendNotifications(notifications);
    expect(mockPush).toHaveBeenCalled();

    vi.useRealTimers();
  });

  test('completed task → mark done → reschedule next occurrence', async () => {
    const user = await createTestUser();
    const tank = await createTank(user.id, { name: 'Tank' });

    const task = await createMaintenanceTask(tank.id, {
      name: 'Water Change',
      frequency: 'weekly',
      last_completed_at: null
    });
    const originalDue = task.due_date;

    // Complete the task
    await completeMaintenanceTask(task.id);

    // Fetch updated task
    const updated = await getMaintenanceTask(task.id);
    expect(updated.last_completed_at).toBeDefined();
    expect(updated.due_date).toBeAfter(originalDue);
    expect(updated.due_date).toEqual(addDays(originalDue, 7));
  });
});
```

### 3.5 Stripe Webhook → Subscription Update → Tier Enforcement

**Test File:** `tests/integration/stripe-subscription.test.ts`

```typescript
describe('Stripe billing flow', () => {
  test('subscription.created webhook → tier upgrade → feature unlock', async () => {
    const user = await createTestUser({ tier: 'free' });
    expect(user.tier).toBe('free');

    // Simulate Stripe webhook: customer upgrades to Starter
    const event = createStripeEvent('customer.subscription.created', {
      id: 'sub_test123',
      customer: 'cus_test123',
      items: { data: [{ price: { id: 'price_starter_monthly' } }] },
      status: 'active'
    });

    // Link Stripe customer to user
    await db.users.update(user.id, { stripe_customer_id: 'cus_test123' });

    // Process webhook
    await handleStripeWebhook(event);

    // Verify tier updated
    const updatedUser = await getUser(user.id);
    expect(updatedUser.tier).toBe('starter');

    // Verify tank creation now allowed (5 vs 1)
    const tank1 = await createTank(user.id, { name: 'Tank 1' });
    expect(tank1.id).toBeDefined();
    const tanks = await getUserTanks(user.id);
    expect(canUserCreateTank(updatedUser, tanks)).toBe(true);
  });

  test('subscription.deleted webhook → downgrade to free → enforce limits', async () => {
    const user = await createTestUser({ tier: 'starter' });
    const tanks = await Promise.all([
      createTank(user.id, { name: 'Tank 1' }),
      createTank(user.id, { name: 'Tank 2' })
    ]);

    // Simulate Stripe webhook: subscription cancelled
    const event = createStripeEvent('customer.subscription.deleted', {
      id: 'sub_test123'
    });
    await db.users.update(user.id, { stripe_customer_id: 'cus_test123' });
    await handleStripeWebhook(event);

    // Verify tier reverted to free
    const updatedUser = await getUser(user.id);
    expect(updatedUser.tier).toBe('free');

    // Verify only 1 tank accessible (others hidden but not deleted)
    const accessibleTanks = await getUserTanks(updatedUser.id);
    expect(accessibleTanks).toHaveLength(1); // First tank only
    expect(accessibleTanks[0].id).toBe(tanks[0].id);
  });

  test('charge.failed → grace period → retry → recovery', async () => {
    const user = await createTestUser({ tier: 'pro' });

    // Simulate payment failure
    const failEvent = createStripeEvent('charge.failed', {
      billing_details: { customer: 'cus_test123' }
    });
    await db.users.update(user.id, { stripe_customer_id: 'cus_test123' });
    await handleStripeWebhook(failEvent);

    // User still Pro (grace period)
    let currentUser = await getUser(user.id);
    expect(currentUser.tier).toBe('pro');
    expect(currentUser.in_grace_period).toBe(false);

    // After 3 failures
    for (let i = 0; i < 2; i++) {
      await handleStripeWebhook(failEvent);
    }

    currentUser = await getUser(user.id);
    expect(currentUser.in_grace_period).toBe(true);
    expect(currentUser.tier).toBe('starter'); // downgraded

    // Simulate successful payment
    const successEvent = createStripeEvent('charge.succeeded', {
      billing_details: { customer: 'cus_test123' }
    });
    await handleStripeWebhook(successEvent);

    currentUser = await getUser(user.id);
    expect(currentUser.tier).toBe('pro'); // restored
    expect(currentUser.in_grace_period).toBe(false);
  });
});
```

---

## 4. E2E Test Scenarios (Playwright)

End-to-end tests simulate real user interactions in a real browser. Run these on Vercel preview deployments before merging to main.

### 4.1 New User Signup → Onboarding → First Tank → First AI Chat

**Test File:** `tests/e2e/signup-onboarding-chat.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('New user onboarding flow', () => {
  test('signup → email verification → tank creation → AI chat', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3000');
    await page.click('text=Get Started');

    // Step 1: Signup form
    await page.fill('input[name=email]', `user${Date.now()}@test.com`);
    await page.fill('input[name=password]', 'TestPass123!');
    await page.fill('input[name=confirmPassword]', 'TestPass123!');
    await page.click('text=Sign Up');

    // Expect redirect to email verification
    await page.waitForURL('**/verify-email');
    expect(page.url()).toContain('verify-email');

    // Mock email verification (skip in local dev)
    await page.evaluate(() => {
      localStorage.setItem('email_verified', 'true');
    });
    await page.click('text=Continue');

    // Step 2: Onboarding form
    await page.waitForURL('**/onboarding');
    await page.selectOption('select[name=experience]', 'beginner');
    await page.check('input[value=freshwater]');
    await page.click('text=Next');

    // Step 3: Create first tank
    await page.waitForURL('**/tanks/new');
    await page.fill('input[name=tank_name]', 'My First Tank');
    await page.fill('input[name=gallons]', '20');
    await page.selectOption('select[name=type]', 'freshwater');

    // Add species
    await page.click('text=Add Species');
    await page.fill('input[name=species_search]', 'neon');
    await page.click('text=Neon Tetra');
    await page.fill('input[name=species_count]', '10');
    await page.click('text=Confirm Species');

    // Create tank
    await page.click('text=Create Tank');
    await page.waitForURL('**/tanks/**');

    // Step 4: First AI chat
    await page.click('text=Chat with AI');
    await page.fill('textarea[name=message]', 'Is my tank setup good?');
    await page.click('text=Send');

    // Expect AI response within 5 seconds
    await page.waitForSelector('[data-testid=ai-response]', { timeout: 5000 });
    const response = await page.locator('[data-testid=ai-response]').textContent();
    expect(response).toContain('Neon Tetra');
  });

  test('Google OAuth signup flow', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signin');
    await page.click('text=Sign in with Google');

    // Mock OAuth redirect
    await page.goto('http://localhost:3000?code=mock_oauth_code&state=mock_state');
    await page.waitForURL('**/onboarding');
    expect(page.url()).toContain('onboarding');
  });

  test('Magic link signup flow', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signin');
    await page.click('text=Sign in with Magic Link');
    await page.fill('input[name=email]', 'user@test.com');
    await page.click('text=Send Link');

    // Expect confirmation message
    await expect(page.locator('text=Check your email')).toBeVisible();

    // Mock magic link click
    await page.goto('http://localhost:3000?token=mock_magic_token');
    await page.waitForURL('**/onboarding');
  });
});
```

### 4.2 Free User Hits Tier Limit → Upgrade Prompt → Stripe Checkout → Feature Unlocked

**Test File:** `tests/e2e/tier-upgrade-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Tier upgrade flow', () => {
  let testUserId: string;

  test.beforeEach(async ({ page }) => {
    // Create free user via API
    const res = await page.request.post('http://localhost:3000/api/test/create-user', {
      data: { tier: 'free' }
    });
    testUserId = (await res.json()).user_id;

    // Login
    await page.goto('http://localhost:3000');
    await page.evaluate((uid) => {
      localStorage.setItem('user_id', uid);
      localStorage.setItem('session_token', 'mock_token');
    }, testUserId);
  });

  test('hit message limit → upgrade prompt → checkout → feature unlocked', async ({ page, context }) => {
    // Create tank
    const tank = await page.request.post('http://localhost:3000/api/tanks', {
      data: { name: 'Test Tank' }
    });
    const tankId = (await tank.json()).id;

    // Navigate to chat
    await page.goto(`http://localhost:3000/tanks/${tankId}/chat`);

    // Send 10 messages (free limit)
    for (let i = 0; i < 10; i++) {
      await page.fill('textarea[name=message]', `Message ${i + 1}`);
      await page.click('text=Send');
      await page.waitForSelector('[data-testid=message-item]', { hasText: `Message ${i + 1}` });
    }

    // 11th message should show upgrade prompt
    await page.fill('textarea[name=message]', 'Message 11');
    await page.click('text=Send');

    // Expect modal with upgrade offer
    await expect(page.locator('[data-testid=upgrade-modal]')).toBeVisible();
    await expect(page.locator('text=Upgrade to Starter')).toBeVisible();

    // Click upgrade button
    await page.click('text=Upgrade Now');

    // Expect Stripe Checkout redirect
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.click('text=Go to Checkout')
    ]);

    expect(popup.url()).toContain('stripe.com');

    // Mock Stripe success (in real test, use Stripe test card)
    await popup.fill('input[placeholder="Card number"]', '4242 4242 4242 4242');
    await popup.fill('input[placeholder="MM"]', '12');
    await popup.fill('input[placeholder="YY"]', '25');
    await popup.fill('input[placeholder="CVC"]', '123');
    await popup.click('text=Pay');

    // Verify redirect back to app
    await page.waitForURL('**/checkout/success');
    expect(page.url()).toContain('success');

    // Verify tier updated
    await page.goto(`http://localhost:3000/tanks/${tankId}/chat`);
    await page.fill('textarea[name=message]', 'Message 11');
    await page.click('text=Send');

    // Should succeed now (Starter allows 100/day)
    await page.waitForSelector('[data-testid=ai-response]', { timeout: 5000 });
    expect(page.locator('[data-testid=upgrade-modal]')).not.toBeVisible();
  });

  test('downgrade flow: cancel subscription → grace period → enforce limits', async ({ page }) => {
    // Setup: user on Starter tier
    await page.evaluate((uid) => {
      localStorage.setItem('user_id', uid);
      localStorage.setItem('tier', 'starter');
    }, testUserId);

    await page.goto('http://localhost:3000/settings/subscription');
    await page.click('text=Manage Subscription');

    // Cancel subscription
    await page.click('text=Cancel Subscription');
    await page.click('text=Continue with Cancellation');

    // Verify grace period message
    await expect(page.locator('text=Grace period until')).toBeVisible();

    // Tier should still be Starter during grace period
    const tierBadge = await page.locator('[data-testid=tier-badge]').textContent();
    expect(tierBadge).toContain('Starter');
  });
});
```

### 4.3 Parameter Logging → Chart Visualization → AI Health Summary

**Test File:** `tests/e2e/parameters-dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Parameter logging and dashboard', () => {
  test('log parameters → chart updates → AI summary', async ({ page }) => {
    // Setup: login & navigate to tank
    await page.goto('http://localhost:3000/tanks/tank-123');

    // Click "Log Parameters"
    await page.click('text=Log Parameters');
    await page.waitForSelector('[data-testid=parameter-form]');

    // Fill form
    await page.fill('input[name=temperature]', '26');
    await page.fill('input[name=ph]', '7.0');
    await page.fill('input[name=ammonia]', '0.1');
    await page.fill('input[name=nitrite]', '0.0');
    await page.click('text=Log');

    // Expect success toast
    await expect(page.locator('text=Parameters logged')).toBeVisible();

    // Navigate to dashboard
    await page.click('text=Dashboard');
    await page.waitForURL('**/dashboard');

    // Verify current readings display
    await expect(page.locator('[data-testid=temp-display]')).toContainText('26°C');
    await expect(page.locator('[data-testid=ph-display]')).toContainText('7.0');

    // Verify status indicators
    await expect(page.locator('[data-testid=temp-status]')).toHaveClass(/safe|green/);
    await expect(page.locator('[data-testid=ph-status]')).toHaveClass(/safe|green/);

    // Log 30 more parameters over time to populate chart
    for (let i = 1; i < 30; i++) {
      const offset = i * 1440 * 60 * 1000; // 1 day apart
      const temp = 25 + Math.sin(i / 7) * 2; // sine pattern

      await page.goto(`http://localhost:3000/tanks/tank-123`);
      await page.click('text=Log Parameters');
      await page.fill('input[name=temperature]', temp.toFixed(1));
      await page.fill('input[name=ph]', '7.0');
      await page.fill('input[name=ammonia]', '0.1');
      await page.click('text=Log');

      // Advance fake time
      await page.evaluate((ms) => {
        // In real test, use Playwright's clock
      }, offset);
    }

    // View charts
    await page.click('text=View Charts');
    await page.waitForSelector('[data-testid=parameter-chart]');

    // Verify chart renders with 30 data points
    const points = await page.locator('[data-testid=chart-point]').count();
    expect(points).toBeGreaterThan(25);

    // Verify chart is interactive
    await page.hover('[data-testid=parameter-chart]', { position: { x: 200, y: 100 } });
    await expect(page.locator('[data-testid=chart-tooltip]')).toBeVisible();

    // Get AI summary
    await page.click('text=AI Health Summary');
    await page.waitForSelector('[data-testid=ai-summary]', { timeout: 5000 });

    const summary = await page.locator('[data-testid=ai-summary]').textContent();
    expect(summary).toMatch(/stable|consistent|healthy/i);
  });
});
```

### 4.4 Maintenance Task → Push Notification → Task Completion

**Test File:** `tests/e2e/maintenance-notifications.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Maintenance task and notifications', () => {
  test('create task → receive notification → mark complete → reschedule', async ({ page, context }) => {
    // Setup: grant notification permission
    await context.grantPermissions(['notifications']);

    // Navigate to tank
    await page.goto('http://localhost:3000/tanks/tank-123');

    // Create task
    await page.click('text=Maintenance Tasks');
    await page.click('text=Create Task');

    await page.fill('input[name=task_name]', 'Weekly Water Change');
    await page.selectOption('select[name=frequency]', 'weekly');
    await page.check('input[name=enable_notifications]');
    await page.click('text=Create');

    // Verify notification scheduled message
    await expect(page.locator('text=Notification scheduled')).toBeVisible();

    // Mock Web Push API
    let pushEvent;
    await page.evaluateHandle(() => {
      window.__pushPayload = null;
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'MOCK_PUSH',
          payload: {
            title: 'Weekly Water Change due',
            body: 'Your Tank'
          }
        });
      }
    });

    // Simulate push notification delivery
    const notifications = await page.context().evaluate(() => {
      return new Promise((resolve) => {
        if ('Notification' in window) {
          const n = new Notification('Weekly Water Change due', {
            body: 'Your Tank',
            tag: 'task-123'
          });
          resolve([n]);
        } else {
          resolve([]);
        }
      });
    });

    // Click notification (if delivered)
    if (notifications.length > 0) {
      await page.click('text=Weekly Water Change due');
      await page.waitForURL('**/tanks/tank-123/maintenance');
    }

    // Mark task complete
    await page.click('[data-testid=task-item-123]');
    await page.click('text=Mark Complete');

    // Verify next due date calculated
    const taskCard = page.locator('[data-testid=task-item-123]');
    const dueDate = await taskCard.locator('[data-testid=due-date]').textContent();
    expect(dueDate).toMatch(/in 7 days|Feb 14/);
  });
});
```

### 4.5 Photo Upload → Diagnosis Result → Treatment Plan

**Test File:** `tests/e2e/photo-diagnosis.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Photo diagnosis flow (Plus/Pro only)', () => {
  test('upload photo → disease diagnosis → treatment plan', async ({ page }) => {
    // Setup: Plus tier user
    await page.goto('http://localhost:3000/tanks/tank-123');

    // Click Photo Diagnosis
    await page.click('text=Photo Diagnosis');
    await page.waitForURL('**/diagnosis');

    // Upload photo
    await page.setInputFiles('input[type=file]', './tests/fixtures/sick-fish.jpg');
    await expect(page.locator('[data-testid=preview]')).toBeVisible();

    // Submit for analysis
    await page.click('text=Analyze');

    // Loading state
    await expect(page.locator('[data-testid=analysis-loading]')).toBeVisible();

    // Wait for Claude Vision result
    await page.waitForSelector('[data-testid=diagnosis-result]', { timeout: 10000 });

    // Verify diagnosis contains expected elements
    const result = page.locator('[data-testid=diagnosis-result]');
    await expect(result).toContainText(/ich|white spot|fin rot|disease/i);

    // Verify treatment plan
    const treatment = page.locator('[data-testid=treatment-plan]');
    await expect(treatment).toBeVisible();

    const steps = await treatment.locator('[data-testid=treatment-step]').count();
    expect(steps).toBeGreaterThan(0);

    // Verify recommendations link to products (if Pro)
    const proUser = await page.evaluate(() => localStorage.getItem('tier')) === 'pro';
    if (proUser) {
      const recommendations = page.locator('[data-testid=product-recommendation]');
      const count = await recommendations.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('free tier user: photo diagnosis blocked', async ({ page }) => {
    // Setup: Free tier user
    await page.evaluate(() => localStorage.setItem('tier', 'free'));
    await page.goto('http://localhost:3000/tanks/tank-123');

    await page.click('text=Photo Diagnosis');

    // Expect upgrade prompt
    await expect(page.locator('[data-testid=upgrade-prompt]')).toBeVisible();
    await expect(page.locator('text=Upgrade to Plus')).toBeVisible();
  });
});
```

### 4.6 Admin Portal: User Lookup → Subscription Change → Audit Log

**Test File:** `tests/e2e/admin-portal.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Admin portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/admin');
    await page.evaluate(() => localStorage.setItem('role', 'admin'));
  });

  test('admin lookup user → view subscription → change tier → audit log', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/users');

    // Search for user
    await page.fill('input[placeholder=Search]', 'testuser@test.com');
    await page.click('text=Search');

    // Click user result
    await page.click('[data-testid=user-row]');
    await page.waitForURL('**/admin/users/user-123');

    // Verify user details
    await expect(page.locator('text=testuser@test.com')).toBeVisible();
    await expect(page.locator('[data-testid=current-tier]')).toContainText('Free');

    // Change tier to Pro
    await page.click('text=Edit Subscription');
    await page.selectOption('select[name=tier]', 'pro');
    await page.click('text=Apply');

    // Verify success message
    await expect(page.locator('text=Tier updated')).toBeVisible();

    // Verify tier changed
    await expect(page.locator('[data-testid=current-tier]')).toContainText('Pro');

    // Check audit log
    await page.click('text=Audit Log');
    const logEntries = page.locator('[data-testid=audit-log-entry]');
    const count = await logEntries.count();
    expect(count).toBeGreaterThan(0);

    const latestEntry = await logEntries.first().textContent();
    expect(latestEntry).toContain('tier');
    expect(latestEntry).toContain('pro');
    expect(latestEntry).toContain('admin');
  });
});
```

---

## 5. Critical Flow Test Cases

Detailed test case tables for high-risk flows.

### 5.1 Authentication Flows

| ID | Flow | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| AUTH-001 | Email/password signup | User not in DB | 1. Fill signup form 2. Submit 3. Verify email | Account created, verification email sent | **CRITICAL** |
| AUTH-002 | Email/password login | Account exists, verified | 1. Enter credentials 2. Submit | JWT token issued, session created | **CRITICAL** |
| AUTH-003 | Password reset | User exists | 1. Click "Forgot password" 2. Enter email 3. Submit 4. Click reset link 5. Enter new password | Password updated, able to login with new password | **HIGH** |
| AUTH-004 | Google OAuth | User not in DB | 1. Click "Sign in with Google" 2. Complete Google flow | Account created via Google, linked to existing email if exists | **HIGH** |
| AUTH-005 | Magic link signup | User not in DB | 1. Enter email 2. Click link in email 3. Complete onboarding | Account created, no password required | **HIGH** |
| AUTH-006 | Session refresh | Token near expiry | 1. Send request with nearly-expired token 2. Check response | New access token in response, session extended | **HIGH** |
| AUTH-007 | Token expiry | Token past expiry | 1. Submit request with expired token | 401 Unauthorized, redirect to login | **HIGH** |
| AUTH-008 | Rate limiting | User sends >5 login attempts/min | 1. Attempt login 6+ times in 60s | 429 Too Many Requests on attempt 6 | **MEDIUM** |
| AUTH-009 | Cross-site request forgery | Attacker tries to forge login | 1. POST to login endpoint without CSRF token | Request rejected, CSRF validation fails | **CRITICAL** |
| AUTH-010 | Password requirements | Password < 8 chars or no uppercase | 1. Signup with weak password | Validation error, password not accepted | **MEDIUM** |
| AUTH-011 | Duplicate email | Email already registered | 1. Signup with existing email | Error: email already exists | **HIGH** |
| AUTH-012 | Account lockout | Password wrong 5+ times | 1. Attempt login with wrong password 5+ times | Account locked, unlock link sent to email | **HIGH** |

### 5.2 Billing Flows

| ID | Flow | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| BILL-001 | Trial signup | New free user | 1. Signup 2. Create tank 3. Verify trial active | Trial period shown (14 days remaining) | **CRITICAL** |
| BILL-002 | Trial usage | Free trial active | 1. Use 100 AI messages 2. Use 2 photo diagnoses (trial includes Plus) | All features work, no limits enforced | **CRITICAL** |
| BILL-003 | Trial expiry | Trial expired 1 day ago | 1. Attempt AI message | Blocked: trial expired, upgrade prompt | **CRITICAL** |
| BILL-004 | Upgrade to Starter | Free user with active trial | 1. Click upgrade 2. Complete Stripe checkout 3. Pay $3.99 | Subscription active, tier = Starter | **CRITICAL** |
| BILL-005 | Stripe webhook: subscription.created | Checkout completed, webhook pending | 1. Simulate webhook | Subscription record created, tier updated | **CRITICAL** |
| BILL-006 | Downgrade workflow | Pro tier user | 1. Go to Billing 2. Click downgrade 3. Confirm | Downgrade scheduled for next renewal | **HIGH** |
| BILL-007 | Upgrade mid-cycle | Starter user | 1. Click upgrade to Pro 2. Pay $14.99 | Prorated charge, tier upgraded immediately | **HIGH** |
| BILL-008 | Card decline (charge.failed) | Stripe charges card | 1. Simulate failed charge 2. Check email | Payment failure email sent, grace period starts | **CRITICAL** |
| BILL-009 | Grace period (3 failed attempts) | 2 failed charges | 1. 3rd charge attempt fails 2. Check user tier | Tier downgraded, grace period shown (7 days to fix) | **CRITICAL** |
| BILL-010 | Grace period recovery | In grace period, payment fixed | 1. Update card 2. Charge succeeds | Tier restored to original, grace period cleared | **HIGH** |
| BILL-011 | Cancellation | Active subscription | 1. Go to Settings 2. Cancel Subscription 3. Confirm | Subscription marked for deletion, grace period shown | **HIGH** |
| BILL-012 | Invoice generation | Subscription created | 1. Stripe invoice.created webhook received | Invoice record created, email sent to user | **MEDIUM** |
| BILL-013 | Dunning workflow | Payment failed | 1. 1st attempt fails 2. Email sent 3. Retry after 3 days 4. Success | Invoice collected, subscription continues | **HIGH** |
| BILL-014 | Tax calculation | User from tax jurisdiction | 1. Checkout with address | Tax added to total, displayed before payment | **MEDIUM** |
| BILL-015 | Refund | User requests refund within 30 days | 1. Request refund 2. Admin approves | Charge refunded, subscription cancelled | **MEDIUM** |

### 5.3 AI Chat Flows

| ID | Flow | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| CHAT-001 | Normal AI response | User in tank, free tier, 0/10 messages used | 1. Type question 2. Submit | Response in <3 sec, usage tracked | **CRITICAL** |
| CHAT-002 | Context injection | Tank with species, params, tasks | 1. Send message 2. Inspect context sent to Claude | Context includes species, recent params, tasks | **CRITICAL** |
| CHAT-003 | Tier limit: free (10/day) | Free user, 10/10 messages used | 1. Attempt message 11 | Blocked: Daily limit reached, upgrade prompt | **CRITICAL** |
| CHAT-004 | Tier limit: starter (100/day) | Starter, 100/100 used | 1. Attempt message 101 | Blocked: Daily limit, suggest Plus | **HIGH** |
| CHAT-005 | Tier limit: pro (unlimited) | Pro user | 1. Send 200+ messages | All succeed, no limit enforced | **HIGH** |
| CHAT-006 | Context overflow | Tank with 500+ species, 2 years param history | 1. Send message | Context truncated to 4000 tokens, response succeeds | **HIGH** |
| CHAT-007 | Action execution | Chat response includes action (add task, schedule notification) | 1. Receive response with action 2. Confirm execution | Action parsed and executed, user notified | **HIGH** |
| CHAT-008 | API timeout | Claude API takes >10 sec | 1. Send message 2. Wait | Graceful timeout after 5 sec, error message shown | **MEDIUM** |
| CHAT-009 | Token counting accuracy | Message is 500 tokens, response 150 | 1. Send message 2. Check usage logged | Usage shows 650 tokens (input + output) | **MEDIUM** |
| CHAT-010 | Conversation history | Previous messages in thread | 1. Send Q1 2. Send Q2 referencing Q1 | Response understands context from Q1 | **MEDIUM** |
| CHAT-011 | RLS isolation | User 1 talks about Tank A | User 2 with Tank B sends message | User 2's response never mentions Tank A | **CRITICAL** |
| CHAT-012 | Offensive content | User sends prompt injection / jailbreak | 1. Send malicious prompt | Claude refuses, logs incident | **CRITICAL** |

### 5.4 Data Integrity Flows

| ID | Flow | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| DATA-001 | RLS: tank isolation | User 1 has Tank A, User 2 has Tank B | User 1 tries to query Tank B via direct SQL | Query returns 0 rows (RLS blocks) | **CRITICAL** |
| DATA-002 | RLS: parameter isolation | User 1 logged params for Tank A | User 2 tries to access Tank A params | Access denied (RLS blocks) | **CRITICAL** |
| DATA-003 | Soft delete: tank | User deletes Tank A | 1. Query deleted_at column 2. List tanks | deleted_at set, tank hidden from UI | **HIGH** |
| DATA-004 | Soft delete: recovery | Tank soft-deleted 5 days ago | Admin permanently deletes | deleted_at retained, hard_deleted_at set | **MEDIUM** |
| DATA-005 | Tank CRUD: create | Valid tank data | 1. Create tank 2. Query | Tank appears in user's tank list | **HIGH** |
| DATA-006 | Tank CRUD: update | Tank exists | 1. Update tank name 2. Refresh | New name persists | **HIGH** |
| DATA-007 | Tank CRUD: read | Tank exists with species | 1. Fetch tank details | All fields including species returned | **HIGH** |
| DATA-008 | Tank CRUD: delete | Tank exists with params, tasks | 1. Delete tank 2. List | Tank soft-deleted, params/tasks still queryable (if cascaded) | **HIGH** |
| DATA-009 | Cascade delete: tank → params | Tank deleted | 1. Delete tank 2. Query params | Params soft-deleted if cascade enabled | **MEDIUM** |
| DATA-010 | Cascade delete: tank → tasks | Tank deleted | 1. Delete tank 2. Query tasks | Tasks soft-deleted if cascade enabled | **MEDIUM** |
| DATA-011 | Cross-user access prevention | User 1 tries to access User 2's tank via API | Direct API call with User 2's tank_id | 403 Forbidden (ownership check) | **CRITICAL** |
| DATA-012 | Photo file isolation | User 1 uploads photo to Tank A | User 2 tries to download photo via storage URL | Access denied (Supabase Storage RLS) | **CRITICAL** |

---

## 6. Regression Checklist

Quick run-through before every release. Expected runtime: ~30 minutes manual testing.

### Core Features
- [ ] **Auth** — Email signup, Google login, password reset, email verification
- [ ] **Auth** — Session survives page reload
- [ ] **Auth** — Logout clears session
- [ ] **Auth** — Invalid token rejected, redirect to login
- [ ] **Onboarding** — New user flow (experience level, tank type, first species)
- [ ] **Onboarding** — Onboarding page not shown after completion

### Tank Management
- [ ] **Tank CRUD** — Create tank with name, type, gallons
- [ ] **Tank CRUD** — Edit tank details
- [ ] **Tank CRUD** — Add species to tank
- [ ] **Tank CRUD** — Delete tank (soft-delete confirmed)
- [ ] **Tank CRUD** — View list of user's tanks
- [ ] **Tank List** — Tank counts match tier (free=1, starter=5, etc.)
- [ ] **Tank List** — Can create new tank button disabled if at limit
- [ ] **Tank Photos** — Upload tank photo
- [ ] **Tank Photos** — Photo displays in tank card

### AI Chat
- [ ] **Chat UI** — Message input appears, send button active
- [ ] **Chat Send** — Message submits, appears in chat
- [ ] **Chat Response** — AI response appears within 5 sec
- [ ] **Chat Context** — Tank name mentioned in response (context injected)
- [ ] **Chat Usage** — Usage counter increments after each message
- [ ] **Chat Limit (Free)** — 10th message succeeds, 11th fails with upgrade prompt
- [ ] **Chat Limit (Starter)** — 100th message succeeds, 101st fails
- [ ] **Chat Limit (Pro)** — 200+ messages succeed
- [ ] **Chat Input** — Disabled during submission
- [ ] **Chat History** — Previous messages visible in thread

### Water Parameters
- [ ] **Parameter Entry** — Form has fields for temp, pH, ammonia, nitrite, nitrate
- [ ] **Parameter Entry** — Submit logs parameter with timestamp
- [ ] **Parameter Display** — Current values shown in dashboard
- [ ] **Parameter Status** — Green (safe), yellow (warning), red (danger) badges
- [ ] **Parameter Validation** — Rejects negative temp, negative pH
- [ ] **Parameter Validation** — Rejects unrealistic values (temp 100°C)
- [ ] **Parameter Chart** — 30+ days renders chart without lag
- [ ] **Parameter Chart** — Tooltip appears on hover
- [ ] **Parameter AI Analysis** — "Get AI Summary" triggers analysis
- [ ] **Parameter Trends** — Summary mentions stable/trending up/down

### Maintenance Tasks
- [ ] **Task Create** — Create task with name, frequency
- [ ] **Task Frequency** — Daily, weekly, biweekly, monthly, custom intervals
- [ ] **Task Due Date** — Next due date calculated correctly
- [ ] **Task Overdue** — Overdue tasks highlighted
- [ ] **Task Complete** — Mark complete, next occurrence scheduled
- [ ] **Task Notifications** — Enable toggle present
- [ ] **Task List** — All active tasks visible
- [ ] **Task Edit** — Update task name, frequency
- [ ] **Task Delete** — Soft-delete task

### Species & Livestock
- [ ] **Species Search** — Search bar functional, 800+ species available
- [ ] **Species Add** — Add species with count
- [ ] **Species Details** — Click species shows care requirements
- [ ] **Livestock List** — All livestock for tank listed
- [ ] **Compatibility Check** — Aggressive species shows warning
- [ ] **Compatibility Check** — Compatible species shows no warning
- [ ] **Species Remove** — Remove species from tank

### Billing & Subscriptions
- [ ] **Trial Status** — Free user sees "14-day trial remaining"
- [ ] **Tier Badge** — Current tier displayed in header
- [ ] **Billing Page** — Shows current plan, price, renewal date
- [ ] **Upgrade Button** — Links to Stripe Checkout
- [ ] **Stripe Checkout** — Form accepts test card (4242 4242 4242 4242)
- [ ] **Subscription Active** — After checkout, tier updates
- [ ] **Settings → Billing** — Edit card, update payment method
- [ ] **Settings → Billing** — Cancel subscription shows confirmation
- [ ] **Trial Expiry Message** — Shows at 24 hours before expiry
- [ ] **Trial Expiry Block** — Free features blocked after expiry

### Photo Diagnosis (Plus/Pro)
- [ ] **Diagnosis UI** — Photo upload button present (Plus/Pro only)
- [ ] **Diagnosis Upload** — Upload image, preview displays
- [ ] **Diagnosis Analysis** — "Analyze" button submits to Claude Vision
- [ ] **Diagnosis Result** — Diagnosis appears within 10 sec
- [ ] **Diagnosis Result** — Includes disease/condition identification
- [ ] **Treatment Plan** — Treatment steps listed with instructions
- [ ] **Photo History** — Previous diagnoses accessible
- [ ] **Free Tier Block** — Free users see upgrade prompt instead of upload

### Equipment Tracking (Pro)
- [ ] **Equipment Add** — Add equipment with name, type, date purchased
- [ ] **Equipment Lifespan** — Equipment shows replacement due date
- [ ] **Equipment Overdue** — Overdue replacements highlighted
- [ ] **Equipment Search** — SerpAPI recommendations load (Pro only)
- [ ] **Equipment Remove** — Delete equipment
- [ ] **Starter Tier Block** — Starter users can't access feature

### Dashboards & Reports
- [ ] **Tank Dashboard** — Shows current parameters, health score, tasks
- [ ] **Health Score** — Calculated from recent parameters
- [ ] **Multi-Tank Dashboard** — Compare stats across all tanks
- [ ] **Email Reports** — Report scheduled weekly (if enabled)
- [ ] **Report Content** — Includes parameters, tasks, summary
- [ ] **Report Delivery** — Email received by due date

### PWA & Offline
- [ ] **Install Prompt** — "Add to Home Screen" appears on mobile
- [ ] **Service Worker** — Installs without errors (DevTools)
- [ ] **Offline Mode** — App loads cached shell when offline
- [ ] **Offline Actions** — Parameter entry queued offline
- [ ] **Sync on Online** — Queued actions sync when online
- [ ] **Push Notifications** — Notification granted, permission shown
- [ ] **Notification Test** — Test push from DevTools → notification appears

### Admin Portal
- [ ] **Admin Login** — Admin role required, non-admins blocked
- [ ] **User Search** — Search by email, display results
- [ ] **User Details** — View user info, subscription, tier
- [ ] **Tier Change** — Edit tier from dropdown
- [ ] **Tier Save** — Changes persist, audit log updated
- [ ] **Audit Log** — Shows all changes with timestamp, admin name
- [ ] **Suspension** — Can suspend user account
- [ ] **Suspension Effect** — Suspended user can't login

### Performance Targets
- [ ] **AI Response P95** — Response < 3 sec (excluding network latency)
- [ ] **Chart Render** — 90-day chart renders in <2 sec
- [ ] **Parameter Entry** — Form + submit + response < 60 sec
- [ ] **Page TTI** — Home/dashboard pages TTI < 3 sec
- [ ] **PWA Lighthouse** — PWA score > 90
- [ ] **Bundle Size** — Next.js build < 500 KB gzipped

### Cross-Browser & Mobile
- [ ] **Chrome Desktop** — Core flows work
- [ ] **Firefox Desktop** — Core flows work
- [ ] **Safari Desktop** — Core flows work
- [ ] **Chrome Mobile** — Core flows, touch gestures
- [ ] **Safari Mobile (iOS)** — Core flows, PWA installable
- [ ] **Responsive Layout** — Mobile, tablet, desktop layouts correct

### Data Security
- [ ] **RLS Policy Check** — Supabase console shows RLS enabled on all tables
- [ ] **No Plaintext Secrets** — Env vars loaded from secrets, never logged
- [ ] **HTTPS Only** — All requests via HTTPS (or localhost)
- [ ] **CSRF Token** — Forms include CSRF tokens
- [ ] **SQL Injection Prevention** — Parameterized queries used (Supabase client)
- [ ] **XSS Prevention** — React auto-escapes user content

### Error Handling
- [ ] **404 Pages** — Non-existent tank shows 404
- [ ] **Network Error** — Offline error message shown
- [ ] **API Error** — Server error shows friendly message + retry
- [ ] **Form Validation** — Invalid email shows validation error
- [ ] **Rate Limit** — 429 error message shown

---

## 7. Performance Test Targets

Based on AquaBotAI PRD specs, validate these benchmarks before release.

| Metric | Target | Test Method | Priority |
|--------|--------|-------------|----------|
| **AI Response Latency** | < 3 sec P95 | Send 100 messages, measure time from submit to first response token | **CRITICAL** |
| **Chart Render Time** | < 2 sec for 90-day data | Load parameter chart with 90 data points, measure TTI | **HIGH** |
| **Parameter Form Submission** | < 60 sec (incl. processing) | Submit form, measure to success confirmation | **MEDIUM** |
| **Page Time-to-Interactive** | < 3 sec on home/dashboard | Lighthouse, 3G network throttle | **HIGH** |
| **PWA Lighthouse Score** | > 90 | Run Lighthouse audit | **HIGH** |
| **Next.js Build Output** | < 500 KB gzipped | `npm run build`, check .next size | **MEDIUM** |
| **Database Query Time** | < 100 ms (p95) | Query parameters with 2-year history | **MEDIUM** |
| **Stripe Webhook Processing** | < 2 sec | Process webhook, verify DB updated | **HIGH** |
| **Photo Upload Size** | < 5 MB limit | Try uploading 10 MB file | **MEDIUM** |
| **Concurrent AI Requests** | Support 10 simultaneous users | Load test with k6 or Artillery | **LOW** |

### Performance Test Script (k6)

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // ramp-up
    { duration: '5m', target: 100 }, // stay at 100
    { duration: '2m', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% < 3 sec
  },
};

export default function () {
  const userId = `user_${__VU}`;
  const tankId = 'tank_123';

  const payload = JSON.stringify({
    message: 'Is my tank healthy?',
    tank_id: tankId,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
    },
  };

  const response = http.post('https://app.aquabotai.local/api/chat', payload, params);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 3s': (r) => r.timings.duration < 3000,
    'has ai_response': (r) => r.json('ai_response') !== undefined,
  });
}
```

---

## 8. Test Environment Setup

### 8.1 Local Testing with Supabase CLI

**Install Supabase CLI:**
```bash
brew install supabase/tap/supabase
```

**Initialize local Supabase instance:**
```bash
cd /path/to/aquabotai
supabase init
supabase start
```

**Output:**
```
Supabase started: http://localhost:54321
          API URL: http://localhost:54321
      GraphQL URL: http://localhost:54321/graphql/v1
           DB URL: postgresql://postgres:postgres@localhost:54322/postgres
       Studio URL: http://localhost:54323
     Inbucket URL: http://localhost:54324
```

**Load schema and seed data:**
```bash
# Apply migrations
supabase migration list
supabase db reset

# Seed test data
psql postgresql://postgres:postgres@localhost:54322/postgres -f tests/fixtures/seed.sql
```

**Seed SQL example** (`tests/fixtures/seed.sql`):
```sql
-- Insert test user
INSERT INTO auth.users (id, email, email_confirmed_at)
VALUES ('user-123', 'testuser@test.com', now());

-- Insert user profile
INSERT INTO public.users (id, email, tier, trial_active)
VALUES ('user-123', 'testuser@test.com', 'free', true);

-- Insert test tank
INSERT INTO public.tanks (id, user_id, name, type, gallons, created_at)
VALUES ('tank-123', 'user-123', 'Test Tank', 'freshwater', 20, now());

-- Insert species
INSERT INTO public.tank_species (tank_id, species_id, count)
VALUES ('tank-123', 'neon_tetra', 10);
```

### 8.2 Environment Variables

**Create `.env.test` (for Vitest):**
```bash
# Supabase local
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe test mode
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Anthropic test API key
ANTHROPIC_API_KEY=sk-ant-...

# Resend (email)
RESEND_API_KEY=re_test_...

# Web Push (VAPID)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

### 8.3 Mock Anthropic Responses

**Setup MSW (Mock Service Worker):**
```typescript
// tests/mocks/anthropic.ts
import { http, HttpResponse } from 'msw';

export const anthropicHandlers = [
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      id: 'msg_test',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'Your tank looks healthy! Neon Tetras prefer 24-28°C and soft water.'
        }
      ],
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: body.messages[0]?.content?.length || 100,
        output_tokens: 50
      }
    });
  })
];
```

**Configure MSW in tests:**
```typescript
// tests/setup.ts
import { setupServer } from 'msw/node';
import { anthropicHandlers } from './mocks/anthropic';

export const server = setupServer(...anthropicHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 8.4 Stripe Test Mode Setup

**Using Stripe CLI:**
```bash
# Download Stripe CLI
brew install stripe/stripe-cli/stripe

# Authenticate
stripe login

# Listen for webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Outputs: webhook signing secret

# Trigger a test event
stripe trigger customer.subscription.created
```

**Test Cards:**
```
4242 4242 4242 4242 - Success
4000 0000 0000 0002 - Decline
4000 0000 0000 9995 - Insufficient Funds (after 3 retries)
```

### 8.5 Vitest Configuration

**`vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
      ],
      lines: 70,    // Aim for 70% line coverage
      functions: 70,
      branches: 60,
      statements: 70
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
```

### 8.6 Playwright Configuration

**`playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 8.7 Test Script Shortcuts

**Add to `package.json`:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest tests/unit",
    "test:integration": "vitest tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:coverage && npm run test:e2e",
    "test:regression": "npm run test:regression",
    "db:reset": "supabase db reset",
    "db:seed": "psql postgresql://postgres:postgres@localhost:54322/postgres -f tests/fixtures/seed.sql",
    "db:setup": "npm run db:reset && npm run db:seed"
  }
}
```

### 8.8 CI/CD Integration (GitHub Actions)

**`.github/workflows/test.yml`:**
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 9. Pre-Release Checklist

Before shipping to production:

- [ ] All unit tests passing (`npm run test:unit`)
- [ ] All integration tests passing (`npm run test:integration`)
- [ ] All E2E tests passing on staging (`npm run test:e2e`)
- [ ] Code coverage >= 70% (`npm run test:coverage`)
- [ ] Regression checklist completed (manual, ~30 min)
- [ ] Performance targets met (AI < 3s, chart < 2s, etc.)
- [ ] Security scan: `npm audit` no high/critical vulns
- [ ] Lighthouse PWA score > 90
- [ ] Stripe webhook signing verified in prod account
- [ ] Supabase Edge Function logs reviewed for errors
- [ ] Error tracking (Sentry) configured & tested
- [ ] Email templates tested (Resend)
- [ ] Push notification tested on real device
- [ ] Database backups enabled
- [ ] Monitoring & alerting set up (Vercel, Supabase dashboards)

---

## Appendix: Test Metrics & Reporting

### Success Criteria for Launch

| Category | Metric | Target | Current |
|----------|--------|--------|---------|
| **Test Coverage** | Line coverage | >= 70% | TBD |
| **Test Coverage** | Function coverage | >= 70% | TBD |
| **Execution** | All unit tests pass | 100% | — |
| **Execution** | All integration tests pass | 100% | — |
| **Execution** | All E2E tests pass | 100% | — |
| **Performance** | AI response P95 | < 3 sec | — |
| **Performance** | Chart render | < 2 sec | — |
| **Performance** | Page TTI | < 3 sec | — |
| **Stability** | No critical bugs found in regression | 0 | — |
| **Security** | No high-severity vulns | 0 | — |

### Test Execution Report Template

```markdown
## Test Execution Report — v1.0.0

**Date:** 2026-02-XX
**Executed By:** Solo Developer
**Duration:** 4 hours

### Summary
- Unit Tests: 142 passed, 0 failed
- Integration Tests: 24 passed, 0 failed
- E2E Tests: 18 passed, 0 failed
- Code Coverage: 72%
- Performance: All targets met

### Issues Found
| ID | Component | Severity | Status |
|---|---|---|---|
| BUG-001 | Photo upload | HIGH | Fixed, retested |
| BUG-002 | Chart tooltip | LOW | Deferred to v1.1 |

### Sign-off
- [x] Ready for production
- Approved by: Solo Dev (self)
- Deployment: 2026-02-XX
```

---

**Document Version:** 1.0
**Last Updated:** 2026-02-07
**Next Review:** Before v1.0.0 release
**Owner:** AquaBotAI Development Team
