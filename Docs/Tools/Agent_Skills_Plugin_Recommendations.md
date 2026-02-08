# Agent Skills & Plugin Recommendations
**AquaBotAI | Agent Enhancement Plan**
**February 2026**

---

## Executive Summary

Your 3-agent system (PM Orchestrator, Frontend Engineer, Backend Engineer) is well-architected. The agent prompts are solid — clear scopes, memory systems, handoff protocols. But right now your agents are running on raw instructions alone. By wiring in Claude Code **skills** and **MCP plugins**, each agent gets specialized knowledge injected at task time — like giving each team member a reference manual for their exact job.

Below are concrete recommendations organized by: what to add, which agent benefits, how to wire it in, and priority level.

---

## How Skills & Plugins Work (Quick Primer)

**Skills** = instruction files that get loaded into an agent's context when relevant. They contain best practices, code patterns, and step-by-step guides. Think of them as "expert cheat sheets." They live in `.skills/skills/` or `.local-plugins/cache/`.

**MCP Plugins** = live connections to external services (Supabase, Stripe, Vercel, GitHub). Instead of the agent running CLI commands and parsing output, MCPs give structured data directly. Think of them as "API connections the agent can use natively."

**How to wire them in:** Add references to agent prompts so they know when to load a skill or use an MCP tool.

---

## TIER 1: HIGH IMPACT (Add These First)

### 1. Postgres Best Practices Skill → Backend Agent

**What it does:** 100+ optimization rules for PostgreSQL — indexing, RLS performance, query patterns, connection management, VACUUM tuning. Sourced directly from Supabase's own best practices.

**Why it matters for AquaBotAI:**
- Your backend agent writes migrations, RLS policies, and indexes constantly
- You have 22 tables with 29 foreign keys — indexing decisions matter
- The spec calls for query performance targets (<2s for 90-day parameter charts)
- RLS policy performance is critical since every query goes through RLS

**Skill location:** `/mnt/.skills/skills/postgres-best-practices/SKILL.md`

**How to wire in — add to `backend.md` prompt:**
```
### Required Skills
Before writing any migration, RLS policy, or complex query:
1. Read the Postgres Best Practices skill at .skills/skills/postgres-best-practices/SKILL.md
2. Apply relevant patterns (especially indexing, RLS optimization, query performance)
3. Reference the impact levels in the skill to prioritize optimizations
```

---

### 2. Web Design Guidelines Skill → Frontend Agent

**What it does:** 100+ UI audit rules covering accessibility (ARIA labels, keyboard nav, focus states), performance (lazy loading, animation), forms (validation UX, error states), and responsive design. Based on Vercel's Web Interface Guidelines.

**Why it matters for AquaBotAI:**
- PWA needs to be installable and accessible — App Store-quality
- Your frontend agent builds forms (parameter entry, tank creation), dashboards (Recharts), and navigation (bottom tabs)
- Accessibility is required for a consumer product and you're a solo dev who can't manually audit every component

**Skill location:** `/mnt/.skills/skills/web-design-guidelines/SKILL.md`

**How to wire in — add to `frontend.md` prompt:**
```
### Required Skills
After building any component, page, or form:
1. Read the Web Design Guidelines skill at .skills/skills/web-design-guidelines/SKILL.md
2. Self-audit your UI against the accessibility, focus states, forms, and responsive rules
3. Report any violations fixed in your Memory Report under PATTERNS DISCOVERED
```

---

### 3. Supabase MCP → Backend Agent (Formalize)

**What it does:** Direct database operations — run queries, apply migrations, check logs, list tables, run security advisors, manage Edge Functions. No CLI needed.

**Why it matters:** You already have Supabase MCP connected (noted in CLAUDE.md and CLI_vs_MCP_Guide.md), but your agent prompts don't tell agents to USE it. The backend agent should be explicitly told: "Use Supabase MCP tools for database operations instead of CLI commands."

**Available MCP tools (already connected):**
- `execute_sql` — Run queries directly
- `apply_migration` — Apply DDL changes
- `list_tables` — Explore schema
- `get_advisors` — Security/performance checks (catches missing RLS!)
- `get_logs` — Debug Edge Function issues
- `list_migrations` — See migration history

**How to wire in — add to `backend.md` prompt:**
```
### MCP Tools (Prefer Over CLI)
You have access to Supabase MCP tools. Use them for:
- Database queries: use `execute_sql` instead of `supabase db` CLI commands
- Migrations: use `apply_migration` for DDL changes
- Schema exploration: use `list_tables` to understand current schema
- Security audit: run `get_advisors` after any migration to catch missing RLS or indexes
- Debugging: use `get_logs` for Edge Function issues

Always run `get_advisors` after applying any migration — it catches missing RLS policies automatically.
```

---

### 4. Stripe MCP → Backend Agent (Formalize)

**What it does:** Customer lookup, subscription management, product/price creation, webhook debugging, balance checks, dispute handling, payment link creation — all without CLI.

**Why it matters:** Billing is your most security-critical feature. Direct MCP access means the backend agent can verify webhook setups, check customer subscription status, and test billing flows without parsing CLI output.

**Available MCP tools (already connected):**
- `list_customers`, `create_customer` — Customer management
- `list_subscriptions`, `update_subscription`, `cancel_subscription` — Subscription ops
- `list_products`, `list_prices`, `create_product`, `create_price` — Product catalog
- `list_payment_intents`, `create_payment_link` — Payment flows
- `search_stripe_documentation` — Look up Stripe API docs in real-time

**How to wire in — add to `backend.md` prompt:**
```
### Stripe MCP Tools (Prefer Over CLI)
You have access to Stripe MCP tools. Use them for:
- Customer operations: `list_customers`, `create_customer`
- Subscription management: `list_subscriptions`, `update_subscription`
- Product/price setup: `list_products`, `create_price`
- Debugging: `search_stripe_documentation` for API questions
- Verification: `fetch_stripe_resources` to check specific objects by ID

Before any billing code change, use `search_stripe_documentation` to verify the current API behavior.
```

---

### 5. Vercel MCP → PM Orchestrator + Backend Agent

**What it does:** Deploy projects, check deployment status, view build logs, get runtime logs, manage projects. Your CLI_vs_MCP_Guide says "stick with CLI" but there IS now a Vercel MCP connected.

**Why it matters:**
- Your Connected Services table shows Vercel as "Pending" — this unlocks it
- PM can check deployment status after merging sprints
- Backend agent can debug deployment failures by reading build logs
- No need to manually run `vercel deploy` — the MCP can trigger deployments

**Available MCP tools:**
- `deploy_to_vercel` — Deploy the current project
- `get_deployment`, `list_deployments` — Check deployment status
- `get_deployment_build_logs` — Debug build failures
- `get_runtime_logs` — Debug production errors
- `search_vercel_documentation` — Look up Vercel features

**How to wire in — add to `pm_orchestrator.md`:**
```
### Deployment (Vercel MCP)
After merging sprint branches to main:
1. Use `deploy_to_vercel` to trigger a deployment
2. Use `get_deployment` to check deployment status
3. If build fails, use `get_deployment_build_logs` to diagnose
4. Report deployment status in Sprint Report to Sam
```

---

## TIER 2: MEDIUM IMPACT (Add After Tier 1)

### 6. Product Management Skills → PM Orchestrator

**What they do:** Structured frameworks for feature specs (PRDs), roadmap management (RICE scoring), metrics tracking, stakeholder communications, and competitive analysis.

**Why it matters:** Your PM Orchestrator already does sprint planning, but these skills give it formal frameworks. The feature-spec skill could generate proper PRDs from your existing spec docs. The roadmap skill could formalize RICE scoring (you already use it in your roadmap).

**Available skills (in `.local-plugins/cache/knowledge-work-plugins/product-management/`):**
- `feature-spec` — Structured PRDs with user stories and acceptance criteria
- `roadmap-management` — RICE, MoSCoW, ICE prioritization frameworks
- `metrics-tracking` — OKR frameworks, dashboard design
- `stakeholder-comms` — Tailored updates for different audiences
- `competitive-analysis` — Feature comparison matrices

**Best fit for your workflow:** `feature-spec` and `roadmap-management` — they map directly to your sprint planning algorithm (Steps 2-8 in pm_orchestrator.md).

**How to wire in — add to `pm_orchestrator.md`:**
```
### Product Skills (Load When Planning)
When creating sprint plans or writing Task Briefs:
- For feature scoping: load the feature-spec skill for PRD structure
- For prioritization: load the roadmap-management skill for RICE scoring methodology
These skills are at .local-plugins/cache/knowledge-work-plugins/product-management/
```

---

### 7. Data Visualization Skill → Frontend Agent

**What it does:** Best practices for creating charts with Python (matplotlib, seaborn, plotly) — but the chart type selection guidance, color theory, and accessibility principles apply to Recharts too.

**Why it matters:** Your frontend agent builds Recharts dashboards for water parameters (pH, ammonia, temperature over 7/30/90 days). The skill's guidance on choosing chart types, color accessibility, and annotation patterns translates directly.

**Skill location:** `.local-plugins/cache/knowledge-work-plugins/data/1.0.0/skills/data-visualization/`

---

### 8. Memory Management Skill → PM Orchestrator

**What it does:** Two-tier memory system — working memory (CLAUDE.md) and long-term knowledge base (memory/ directory). Decodes shorthand, acronyms, and internal language.

**Why it matters:** You already HAVE a memory system (bugs/, patterns/, decisions/, etc.) — this skill could formalize it further and help the PM maintain it more consistently.

**Skill location:** `.local-plugins/cache/knowledge-work-plugins/productivity/1.0.0/skills/memory-management/`

---

## TIER 3: FUTURE AGENTS (Phase B/C Enablers)

These map to the future agents you've planned in your architecture doc.

### 9. Test Engineer Agent → Data Validation Skill
When you add a Test Engineer (Phase B trigger: coverage <70% or 3+ bugs escape), give it the `data:data-validation` skill for QA methodology — hypothesis checking, accuracy verification, bias detection.

### 10. Browser Test Agent → Agent Browser Skill
The `agent-browser` skill at `.skills/skills/agent-browser/SKILL.md` automates browser interactions — perfect for your Phase B Browser Test agent. It can fill forms, take screenshots, and verify UI flows programmatically.

### 11. DB Specialist Agent → Postgres Best Practices + SQL Queries Skills
When you add a DB Specialist (Phase C), give it both `postgres-best-practices` and `data:sql-queries` skills. The SQL skill covers dialect-specific optimization across Postgres, which is exactly what this agent would need.

---

## MCP PLUGINS TO ADD (Not Currently Connected)

### 12. GitHub MCP

**Status in your guide:** "No Official MCP Yet" — but this has changed. GitHub MCP is now available.

**What it would unlock:**
- PM Orchestrator could create PRs, manage branches, and check CI status programmatically
- Backend agent could create feature branches without CLI
- Automated PR creation after sprint merges

**How to add:** Install the GitHub MCP server via Claude Code settings or Cursor MCP configuration.

### 13. Sentry MCP (If Available)

**Your stack uses Sentry** for monitoring (`@sentry/nextjs` frontend, `@sentry/deno` Edge Functions). If a Sentry MCP becomes available, it would let agents query error logs, check error rates, and monitor deployments — directly supporting your Runbook (04_Runbook_Ops_Guide.md).

---

## Implementation Checklist

### Quick Wins (30 minutes)

- [ ] Add Postgres Best Practices reference to `backend.md` prompt
- [ ] Add Web Design Guidelines reference to `frontend.md` prompt
- [ ] Add Supabase MCP usage instructions to `backend.md` prompt
- [ ] Add Stripe MCP usage instructions to `backend.md` prompt
- [ ] Add Vercel MCP deployment instructions to `pm_orchestrator.md`
- [ ] Update CLI_vs_MCP_Guide.md — GitHub MCP now exists, Vercel MCP is connected

### Next Sprint

- [ ] Add Product Management skill references to `pm_orchestrator.md`
- [ ] Add Data Visualization skill reference to `frontend.md` for Recharts work
- [ ] Test the `get_advisors` MCP tool after a migration to verify it catches issues

### When Adding Phase B Agents

- [ ] Wire `agent-browser` skill into Browser Test agent prompt
- [ ] Wire `data-validation` skill into Test Engineer agent prompt
- [ ] Wire `postgres-best-practices` + `sql-queries` into DB Specialist prompt (Phase C)

---

## What NOT to Add (Avoid Noise)

These skills/plugins exist but don't match your current needs:

- **Finance skills** (reconciliation, journal entries) — You're a startup, not doing GAAP accounting
- **Legal skills** (contract review, NDA triage) — Not relevant at MVP stage
- **Sales skills** (pipeline, forecasting) — No sales team yet
- **Bio-research skills** — Wrong domain
- **Customer support skills** — No support team yet (but useful post-launch)
- **Marketing skills** — Useful later for launch, but not during build phase
- **Canvas/Algorithmic Art skills** — Not relevant to your product

---

## Summary: Priority Order

| Priority | What to Add | Agent | Time to Wire In |
|----------|-------------|-------|-----------------|
| 1 | Postgres Best Practices skill | Backend | 5 min |
| 2 | Web Design Guidelines skill | Frontend | 5 min |
| 3 | Supabase MCP instructions | Backend | 5 min |
| 4 | Stripe MCP instructions | Backend | 5 min |
| 5 | Vercel MCP instructions | PM | 5 min |
| 6 | Product Management skills | PM | 10 min |
| 7 | Data Visualization skill | Frontend | 5 min |
| 8 | Memory Management skill | PM | 5 min |
| 9 | GitHub MCP (install) | PM + All | 15 min |
| 10 | Agent Browser skill | Future Test Agent | When Phase B triggers |

Total time for Tier 1 (items 1-5): ~25 minutes of prompt edits.

---

*Last Updated: February 8, 2026*
*Status: Recommendation — awaiting Sam's approval*
