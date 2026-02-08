# Water Parameters & Analysis — Feature Specification
**Aquatic AI | R-003, R-004, R-005 | P0 — Must-Have**

## Problem Statement
Water chemistry is the single most important factor in aquarium health, yet most hobbyists either don't track it consistently or can't interpret trends. Current apps let users log numbers but provide no intelligence — no trend analysis, no predictive alerts, no correlation with events. Beginners don't know what the numbers mean; intermediates can't spot slow-moving problems; experts want cross-parameter analytics. Aquatic AI turns raw parameter data into actionable intelligence through interactive dashboards and AI-powered analysis.

## Goals
- Make parameter logging fast enough that users do it consistently (under 60 seconds per entry)
- Provide interactive visualizations that make trends and anomalies immediately visible
- Use AI to detect concerning trends BEFORE parameters reach danger zones (predictive, not just threshold alerts)
- Correlate parameter changes with tank events (new livestock, water changes, medication) to help users understand cause and effect
- Generate daily/weekly AI health summaries so users don't have to interpret raw data

## Non-Goals
- NG1: Automated parameter reading from IoT sensors — manual entry only in v1
- NG2: Photo-based parameter reading (reading test strip colors from photos) — future consideration
- NG3: Dosing calculator or automatic dosing recommendations — AI can discuss, but no built-in calculator v1
- NG4: Export parameter data to CSV/PDF — P2 consideration
- NG5: Parameter entry via AI chat — P1 consideration (chat action integration)

## User Stories

### All Users
- US-10: As a hobbyist, I want to log my water test results (pH, ammonia, nitrite, nitrate, temperature, salinity, etc.) quickly and easily, so that I build a historical record.
- US-13: As a hobbyist, I want to set custom alert thresholds for each parameter, so I'm notified when something goes out of range.

### Visual/Data-Oriented Users
- US-11: As a hobbyist, I want to see interactive charts showing my parameter trends over time, so I can spot patterns visually.
- US-27: As a hobbyist, I want interactive dashboards with drill-down capability (daily, weekly, monthly views).

### AI-Assisted Users
- US-12: As a hobbyist, I want the AI to generate a daily/weekly tank health report, so I get a summary without interpreting raw data.
- US-14: As a hobbyist, I want the AI to correlate parameter changes with events (new livestock, water changes, medication), so I understand cause and effect.
- US-2 (cross-ref): As a hobbyist, I want the AI to proactively alert me when it detects concerning trends before they become emergencies.

## Requirements

### Must-Have (P0)

**R-003: Water Parameter Logging**
- **R-003.1: Manual parameter entry form** — Quick-entry form with fields for all supported parameters. Freshwater: pH, ammonia, nitrite, nitrate, temperature, GH, KH. Saltwater adds: salinity, calcium, alkalinity, magnesium, phosphate.
  - Acceptance: Given a user opens the parameter entry form, they can enter all values and save in under 60 seconds. Given a parameter is outside normal range, the field highlights in warning/danger color.
- **R-003.2: Historical data storage** — All entries stored with timestamp, queryable by date range.
  - Acceptance: Given a user has 1 year of parameter data, they can query any date range and results load in under 2 seconds.
- **R-003.3: Unit support** — Temperature in °F or °C (user preference). Volume in gallons or liters.
  - Acceptance: Given a user switches from °F to °C, all historical data displays in the new unit.

**R-004: Parameter Visualization (Interactive Dashboards)**
- **R-004.1: Line charts** — Show parameter trends over time with selectable time ranges: 7 days, 30 days, 90 days, all-time.
  - Acceptance: Given 30+ days of data, charts render in under 2 seconds.
- **R-004.2: Multi-parameter overlay** — Display multiple parameters on a single chart for correlation analysis.
  - Acceptance: Given a user selects pH and ammonia, both render on the same chart with separate Y-axes.
- **R-004.3: Color-coded zones** — Safe (green), warning (yellow), danger (red) zones based on tank type and species requirements.
  - Acceptance: Given a freshwater community tank, pH zone boundaries reflect the species' combined ideal range.
- **R-004.4: Interactive features** — Hover for exact values, zoom, pan, date range selection.
  - Acceptance: Given a user hovers over a data point, they see the exact value, timestamp, and any notes from that entry.

**R-005: AI-Powered Parameter Analysis**
- **R-005.1: Trend analysis and proactive alerts** — AI identifies gradual trends (not just threshold violations) and alerts users before parameters reach danger zones.
  - Acceptance: Given a gradual pH decline over 7 days, the AI proactively alerts the user before pH reaches the danger zone.
- **R-005.2: Event correlation** — AI identifies relationships between parameter changes and tank events.
  - Acceptance: Given a user adds new livestock and nitrates spike 3 days later, the AI identifies and explains the correlation.
- **R-005.3: Daily/weekly health summary** — AI-generated tank health report synthesizing all parameter data, trends, and recommendations.
  - Acceptance: Given a user opens their dashboard, they see an AI-generated summary of their tank's current health status with actionable recommendations.
- **R-005.4: Custom alert thresholds** — Users can set their own min/max thresholds for each parameter, overriding defaults.
  - Acceptance: Given a user sets a custom ammonia threshold of 0.5 ppm, they receive an alert when ammonia exceeds that value.

### Nice-to-Have (P1)
- **R-003.4: Conversational parameter entry** — Log parameters by telling the AI: "pH is 7.2, ammonia 0, nitrite 0, nitrate 20"
- **R-004.5: Annotation layer** — Mark events on charts (water change, new fish, medication) for visual correlation
- **R-005.5: Predictive modeling** — AI predicts where parameters will be in 3-7 days based on current trends

### Future Considerations (P2)
- **R-003.5: Photo-based test reading** — Read API test strip results from a photo
- **R-004.6: Data export** — Export parameter history as CSV or PDF
- **R-005.6: Cross-tank analysis** — Compare parameter patterns across multiple tanks to identify best practices

## Success Metrics
### Leading
- Parameter logging frequency: Active users log 2+ times per week
- Dashboard engagement: 60%+ of active users view charts weekly
- Entry speed: 90th percentile parameter entry under 60 seconds
- Chart render time: < 2 seconds for 90 days of data

### Lagging
- AI alert accuracy: > 80% of proactive alerts are actionable (not false positives)
- Health report engagement: > 50% of daily reports are viewed
- Retention correlation: Users who log parameters 2+/week retain at 2x the rate of infrequent loggers

## Decisions (Resolved)

- ✅ Parameter entry method: Manual entry via structured form (v1). Smart device integrations (Bluetooth probes, API integrations with Neptune, GHL) deferred to P2.
- ✅ Chart time ranges: 7-day (default), 30-day, 90-day, and custom date range. Data retained for 2 years for paid tiers, 90 days for free tier.
- ✅ Ideal ranges source: Curated from FishBase, aquarium hobbyist best practices, and species-specific requirements. Species database includes min/max ranges per parameter per species. Ranges displayed as green (ideal), yellow (caution), red (danger) bands on charts.
- ✅ Alert thresholds: Configurable per tank. Default thresholds set from species-appropriate ranges. Users can adjust via settings. Alerts trigger in-app notification + push notification (if enabled).

## Timeline Considerations
- Phase 1 (MVP): Parameter logging (R-003) + visualization (R-004) + AI analysis (R-005) — all P0
- Dependency: Tank Profile Management (R-002) — parameters are scoped to a tank
- Dependency: Species Database (R-006) for species-specific safe zones
- AI analysis (R-005) requires the AI Chat Engine (R-001) infrastructure

## Technical Notes
- Data model: water_parameters table — id, tank_id, test_date, pH, ammonia, nitrite, nitrate, temperature, salinity, calcium, alkalinity, magnesium, phosphate, GH, KH, notes
- **Temperature Storage:** All temperatures stored in Fahrenheit in the database. Conversion to Celsius happens at display time based on `users.unit_preference_temp`. This ensures consistent storage and simplifies data aggregation and AI analysis.
- Charts: Recharts or Chart.js for interactive visualizations
- AI analysis: Supabase Edge Function triggers on new parameter entry, sends data to Claude Sonnet 4.5 for analysis
- Performance: Index on tank_id + test_date for fast range queries
