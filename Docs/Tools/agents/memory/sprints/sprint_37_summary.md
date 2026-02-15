# Sprint 37 Summary — Multi-Tank Comparison Dashboard (Spec 11 - R-105)

> Date: 2026-02-15 | Status: COMPLETE

## Goals
1. Implement Multi-Tank Comparison Dashboard (Spec 11 R-105)
2. Health score calculation algorithm
3. Aggregate health view for all tanks
4. Side-by-side parameter comparison charts
5. Pro tier gating

## Deliverables

### Health Score Calculation (`src/lib/health/calculate-health-score.ts`)
**Algorithm:**
- **Parameter Score (50%)** — % of parameters within safe zone for tank type
  - Safe ranges defined for freshwater, saltwater, brackish, planted
  - Missing parameters get 50% credit
  - Out-of-range parameters generate issues list
- **Maintenance Score (30%)** — Consistency of maintenance tasks
  - Each overdue task reduces score by 20% (max -80%)
  - No tasks = neutral 75%
- **Recency Score (20%)** — Days since last parameter log
  - Within recommended interval = 100%
  - Up to 2x interval = 75%
  - Up to 3x interval = 50%
  - Beyond 3x = 25%

**Status Thresholds:**
- 90+ = Excellent (green-600)
- 75-89 = Good (green-500)
- 60-74 = Fair (amber-500)
- 40-59 = Poor (orange-500)
- <40 = Critical (red-600)

### API Endpoints

**`/api/tanks/health` (GET)**
- Returns health scores for all user's tanks
- Includes latest parameters, overdue task counts
- Summary stats: total tanks, counts by status, average score, tanks needing attention

**`/api/tanks/compare` (GET) — Pro Only**
- Query params: `tankIds` (comma-separated), `parameter`, `days` (7/30/90)
- Validates user owns all requested tanks
- Returns parameter time series for each tank with stats (min/max/avg/latest/trend)
- Generates AI insight about cross-tank differences

### UI Components

**`src/components/compare/tank-health-grid.tsx`**
- Animated grid of tank cards with health indicators
- Shows photo, tank type, volume, health badge
- Key parameters (temp, pH, ammonia) at a glance
- Overdue task warnings
- Click to navigate to tank details

**`src/components/compare/comparison-chart.tsx`**
- Multi-line Recharts chart for parameter comparison
- Up to 3 tanks with distinct colors
- Unified timeline merging all data points
- Custom tooltip showing all tanks' values
- Stats summary below chart with trend indicators
- Supports all 8 tracked parameters

### Compare Page (`/compare`)

**For All Users:**
- Summary stats cards (total tanks, avg health, needs attention, healthy tanks)
- Aggregate health view showing all tanks with status badges

**For Pro Users Only:**
- Tank selector (click to toggle, max 3)
- Parameter dropdown (pH, temperature, ammonia, nitrite, nitrate, salinity, calcium, alkalinity)
- Time range selector (7/30/90 days)
- Comparison chart with multi-line overlay
- AI insight card analyzing differences

**Tier Gating:**
- Non-Pro users see locked comparison section with upgrade CTA
- API returns `TIER_REQUIRED` error for comparison endpoint
- Aggregate health view available to all users

## Commits
- `ca253a0` - Add Multi-Tank Comparison Dashboard (Spec 11 - R-105)

## Verification
- TypeScript: PASS
- Build: PASS
- New page renders at `/compare`

## What This Unlocks
- **At-a-Glance Overview**: See all tanks' health status without drilling into each one
- **Side-by-Side Analysis**: Compare specific parameters across tanks to learn what works
- **Trend Detection**: Identify which tanks are improving or declining
- **AI Insights**: Get suggestions about environmental differences between tanks
- **Pro Value**: Comparison is a compelling Pro tier upgrade driver

## Remaining for Spec 11
- R-104: Email Reports (requires RESEND_API_KEY) — Future sprint
- R-105.5: Custom comparison groups (save tank combos) — P1
- R-105.6: Leaderboard view (rank tanks by health) — P1
