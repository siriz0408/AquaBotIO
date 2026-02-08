# How to Use Your Agent Team — Practical Guide for Sam

This is your step-by-step guide to running the AI agent team for AquaBotAI development. No developer knowledge needed.

---

## The Big Picture

You talk to **one agent** — the PM Orchestrator. It handles everything else automatically.

1. **PM Orchestrator** — The brain. Plans sprints, **automatically spawns** the other agents, reviews their work, merges code, updates the dashboard, and reports to you.
2. **Frontend Engineer** — Builds everything users see (pages, buttons, forms, charts). **Auto-spawned by PM.**
3. **Backend Engineer** — Builds everything behind the scenes (database, APIs, auth, billing). **Auto-spawned by PM.**
4. **R&D Discovery Agent** — Your product scout. Researches new features, evaluates competitors, specs out ideas, finds opportunities. **You start directly OR PM spawns it.**

You never have to open separate sessions, paste Task Briefs, or manually coordinate between agents. Say "run sprint" to the PM and it does the rest. Say "R&D mode" to start the R&D agent.

### Future Agents (unlock as needed)

| Phase | Agents | When to Add |
|-------|--------|-------------|
| **Phase B** | Test Engineer, Code Reviewer, Browser Test | When test coverage drops below 70% OR 3+ bugs escape to main |
| **Phase C** | DB Specialist, UI/UX, DevOps, Docs | When specific expertise needed OR scaling past 5 sprints |

---

## How to Start

### Step 1: Open one session

Open a single Claude Code / Cursor session in your AquaBotAI project directory. This is the only session you need.

### Step 2: Start the PM

Paste this to activate the PM Orchestrator:

```
You are the PM Orchestrator for AquaBotAI. Read your instructions at Docs/Tools/agents/prompts/pm_orchestrator.md and follow them. Start by reading CLAUDE.md, then check memory/INDEX.md and memory/active_work.md for current state.
```

### Step 3: Tell it what to do

Say "run sprint" and the PM handles the entire cycle:
1. Reads your feedback, specs, roadmap, and memory
2. Proposes a sprint plan for your approval
3. **Automatically spawns** Frontend and Backend agents (in parallel)
4. Collects their results when they finish
5. Reviews code, resolves conflicts, merges to main
6. Updates the roadmap dashboard
7. Reports back to you with a summary

You do not need to open separate sessions for Frontend or Backend. The PM spawns them as sub-agents using the Task tool. They run concurrently and return their results to the PM.

**You can also start individual agents directly if needed** (for quick fixes or one-off tasks):

```
You are the Frontend Engineer for AquaBotAI. Read your instructions at Docs/Tools/agents/prompts/frontend.md and follow them. [Describe the task.]
```

```
You are the Backend Engineer for AquaBotAI. Read your instructions at Docs/Tools/agents/prompts/backend.md and follow them. [Describe the task.]
```

```
You are the R&D Discovery Agent for AquaBotAI. Read your instructions at Docs/Tools/agents/prompts/rd_agent.md and follow them. [Describe what to research — or say "autonomous discovery" to have it hunt for ideas.]
```

But for sprint work, always go through the PM. For research and feature ideation, use the R&D agent directly.

---

## Your Typical Workflow

### Running a Sprint (one command)

1. **Tell the PM:** "run sprint"
2. **PM reads** your feedback (from Supabase), specs, roadmap, and memory
3. **PM proposes** a sprint plan — what to build and why
4. **You approve** (or redirect): "looks good" / "swap X for Y" / "focus on Z"
5. **PM auto-spawns** Frontend and Backend agents in parallel — they build concurrently
6. **PM collects results** when both agents finish
7. **PM reviews** the code, resolves any conflicts, merges to main
8. **PM updates** the roadmap dashboard (progress bars, sprint summary, milestones)
9. **PM reports** back to you — what was built, what to test, what's next

**That's it.** One command, one session. No manual handoffs.

### Day-to-Day

- **When you have feedback:** Submit it via the Feedback tab on the roadmap page (saved to Supabase) or tell the PM directly. The PM checks the Supabase `feedback` table at the start of every run.
- **When something breaks:** Tell the PM. It will classify severity and take action.
- **When you want to test:** Test the app yourself and report what you find to PM
- **When you need a decision explained:** Ask the PM. It explains everything in plain language.

---

## Things That Require Your Approval

The PM will always ask you before these happen:

| Area | Why It's Sensitive | What PM Will Tell You |
|------|-------------------|----------------------|
| **Stripe/Billing changes** | Real money involved | "We're changing X in billing. Risk: [what could go wrong]. Worth it because [reason]." |
| **Auth/RLS changes** | Security-critical | "This changes who can access what. Here's the change and why it's safe." |
| **AI system prompt changes** | Affects all chat responses | "We're updating how the AI responds. Here's the old vs new behavior." |
| **Database migrations** | Data integrity | "We're changing the database structure. Tested on staging. Ready for production?" |
| **Conflicting priorities** | You decide what matters | "We can do A or B this sprint, not both. What matters more?" |

---

## Error Severity — What Happens

When something goes wrong, the PM classifies it and responds:

| Level | Examples | PM Response | Your Involvement |
|-------|----------|-------------|------------------|
| **CRITICAL** | Data loss, billing error, security breach | Halts all work. Rollback. Notifies you immediately. | You'll know right away. May need action from you. |
| **HIGH** | Feature broken, users affected | Prioritizes fix. May rollback. | PM tells you if user-facing. |
| **MEDIUM** | Bug found, needs fixing | Schedules fix normally. | You'll see it in sprint report. |
| **LOW** | Minor issue, cosmetic | Adds to backlog. | You'll see it next sprint planning. |

### Automatic Safety Stops

The PM will halt and ask you if:
- 3+ CRITICAL/HIGH errors happen in one sprint
- Same feature breaks twice after being fixed
- Any database integrity issue is suspected
- Any Stripe billing error occurs
- Root cause can't be found in 15 minutes

---

## Memory System

The team shares knowledge through the memory system. Here's what's in it:

| Folder | What's Inside | Who Updates It |
|--------|---------------|----------------|
| `memory/active_work.md` | What every agent is currently working on | PM (constantly) |
| `memory/bugs/` | Known bugs, status, who's fixing | PM, any agent finding a bug |
| `memory/mistakes/` | Things that went wrong + how to prevent | PM after any error |
| `memory/patterns/` | Proven solutions that worked | Any agent after a success |
| `memory/feedback/` | Your input and priorities | You or PM |
| `memory/sprints/` | History of what was built each sprint | PM after each sprint |
| `memory/INDEX.md` | Master index with counts and dates | PM weekly |

**Your primary way to give feedback** is the Feedback tab on the roadmap page (`Docs/Roadmap/AquaBotAI_Product_Roadmap.html`). This saves to Supabase so the PM reads it automatically at the start of every sprint. You can also attach screenshots. Alternatively, create a text file in `memory/feedback/` for legacy-style feedback.

---

## Ship Readiness — What You'll See

The PM tracks 6 areas that must be "green" before launch:

| Area | What It Means | Green = | Yellow = | Red = |
|------|---------------|---------|----------|-------|
| **Security** | Auth, data protection, secrets | All checks pass | Minor gaps | Vulnerabilities exist |
| **Testing** | Code is tested | 70%+ coverage | 50-70% coverage | <50% or no tests |
| **Deployment** | Can deploy safely | CI/CD working | Manual steps needed | Can't deploy |
| **Runbook** | Know how to fix issues | All playbooks written | Some gaps | No documentation |
| **Release Notes** | Ready to announce | Written and reviewed | Draft only | Not started |
| **Analytics** | Can measure success | All events tracked | Partial tracking | No tracking |

Ask the PM "Show me ship readiness" anytime to see current status.

---

## Quick Reference Commands

Everything goes through the PM. Here's what you can say:

| You Say | What Happens |
|---------|-------------|
| **"Run sprint"** | PM plans, spawns agents, builds, reviews, merges, updates dashboard, reports back. The full cycle. |
| "Start next sprint" | Same as "run sprint" |
| "What's the current status?" | PM reports progress, blockers, what's in flight |
| "I found a bug: [description]" | PM classifies severity, spawns an agent to fix it, updates memory |
| "I want to focus on [feature]" | PM adjusts priorities, may re-plan the sprint |
| "Explain [decision/change] to me" | Plain-language explanation of why |
| "Show me ship readiness" | Green/yellow/red status for all 6 areas |
| "What decisions do you need from me?" | Lists anything waiting on your input |
| "What should I test?" | Lists features ready for manual testing with instructions |
| "Fix [specific thing]" | PM spawns the right agent to fix it immediately |
| **"R&D mode"** | R&D agent scans competitors, community, and your product — returns Top 3 opportunities with scores |
| "Research [feature idea]" | R&D agent asks clarifying questions, then researches internal docs + external market, delivers scored recommendation |
| "What should we build next?" | R&D agent audits your product and roadmap, scans market, presents ranked opportunities |
| "Spec out [feature]" | R&D agent writes a full PRD with user stories, requirements, success metrics, and AI integration points |
| "What are competitors doing?" | R&D agent researches competitor apps, forums, app reviews, returns competitive landscape update |

---

## Important Things to Know

### You're the Boss
Every agent works for you. The PM recommends, but you decide. If you don't like a plan, say so. If you want to change direction, say so. Your word is final.

### Context Budget is a Soft Cap
The agents are designed to be focused and efficient with context. But if a task needs more context to be done right, the PM will provide it. Completing the task correctly always matters more than staying under a token number.

### How Agents Coordinate
Agents don't share a live connection, but the PM orchestrates everything so you don't have to. They coordinate through:
- **The PM** — spawns each agent with exactly the context it needs, collects results, resolves conflicts
- **Active Work Board** (`memory/active_work.md`) — what everyone's working on
- **Memory system** (`memory/`) — shared knowledge across sprints
- **Task Briefs** — focused instructions so each agent stays in scope

### All Code Goes Through Branches
Agents commit to feature branches, never directly to main. PM merges to main after quality checks. This keeps the main branch stable.

### "Never the Same Bug Twice"
When something goes wrong, the PM creates:
1. A test that catches this specific bug
2. A memory entry so no agent makes the same mistake
3. A process change if needed

This means the codebase gets more reliable over time.

---

## File Locations

| What | Where |
|------|-------|
| Agent prompts | `Docs/Tools/agents/prompts/` |
| R&D Discovery Agent | `Docs/Tools/agents/prompts/rd_agent.md` |
| Task Brief template | `Docs/Tools/agents/prompts/task_brief_template.md` |
| Team memory | `memory/` (8 bugs, 9 decisions, 8 patterns, 2 mistakes, 7 sprints) |
| Active Work Board | `memory/active_work.md` |
| Sprint plans | `Docs/Sprints/` |
| Product specs (18 docs) | `Docs/AquaBotAI_Specs/` |
| Implementation status | `Docs/AquaBotAI_Specs/14_Implementation_Status.md` |
| **UI/UX Design System** | **`Docs/AquaBotAI_Specs/15_UI_UX_Design_System.md`** — canonical design guide |
| **Wireframes (UI source of truth)** | **`Docs/Wireframes/`** — Figma-exported React components |
| Ship readiness docs | `Docs/Ship_Readiness/` |
| Roadmap | `Docs/Roadmap/` |
| Architecture reference | `Docs/Tools/Agent_Architecture_v3.html` |
| This guide | `Docs/Tools/agents/HOW_TO_USE_AGENTS.md` |

---

## When Things Go Wrong

### PM seems confused or off-track:
1. Stop it: "Stop. You're off track."
2. Redirect: "Go back and re-read your prompt at Docs/Tools/agents/prompts/pm_orchestrator.md."
3. Or: Close the session and start a new one.

### Something broke in the app:
1. Tell the PM: "I found a bug: [what happened]"
2. PM will classify severity and respond appropriately
3. If CRITICAL, PM halts everything and focuses on fix

### You're not sure what's happening:
Ask the PM. That's literally its job. Good questions:
- "What's the current status?"
- "Why did we do it this way?"
- "What are the risks here?"
- "What should I be worried about?"

### You want to override:
You can always override anything: "Stop. Do it this way instead: [your direction]". Your word is final.

---

## Example Conversations

### Running a sprint (the full automated flow):
```
You: Run sprint

PM: I've checked your feedback in Supabase — you submitted a priority
request to focus on Water Parameters. I've also reviewed specs, the
roadmap, and memory. Here's what I recommend:

This sprint: Water Parameters UI + AI context injection for water data.
Why: Water Parameters is your #1 priority, and it unblocks trend analysis.

Frontend will build the parameter entry form and Recharts dashboards.
Backend will build the API endpoints and AI context injection.

Risk: Recharts is new to us. May need extra time on chart rendering.
Decision needed: Do you want interactive charts or simple tables first?

PM: You said "looks good" — spawning agents now.

[PM automatically spawns Frontend and Backend agents in parallel]
[Both agents work concurrently — you don't see this, just wait]

PM: Both agents finished. Here's what happened:

Frontend built:
- Parameter entry form with validation
- 7/30/90-day Recharts dashboard
- Loading, error, and empty states
- Branch: feature/water-params-ui (merged to main)

Backend built:
- POST /api/parameters endpoint with Zod validation
- GET /api/parameters with date range filtering
- AI context injection for water parameter trends
- Branch: feature/water-params-api (merged to main)

Tests: 12 unit tests, 3 integration tests — all passing.
Ship readiness: Green (security), Yellow (testing — need E2E).

What you should test:
1. Go to any tank → Parameters tab → try adding pH, ammonia, temp
2. Add 3+ entries → check the chart renders correctly
3. Open AI Chat → ask "how are my water parameters?" → it should know

Dashboard updated. Next sprint I recommend Species Database.
```

### Reporting a bug:
```
You: I found a bug: when I add a tank and immediately try to delete it,
     nothing happens. No error, just doesn't delete.

PM: Got it. Classifying now.

Severity: MEDIUM — feature broken but workaround exists (refresh first).
Root cause: Likely a race condition between create and delete.

Spawning Backend agent to fix this now...

[Backend agent fixes the bug, PM reviews and merges]

PM: Fixed. Backend added a loading guard that prevents delete while
create is still in progress. Added a regression test. Merged to main.

I've logged this in memory/bugs/ so it won't happen again.
```

### Asking for explanation:
```
You: Why are we using Supabase instead of Firebase?

PM: Good question. Here's why we chose Supabase:

1. PostgreSQL gives us real database features (joins, transactions,
   complex queries) that we need for water parameter analysis.
2. Row Level Security (RLS) means users can only see their own data —
   built into the database, not just the app.
3. It's open source, so we're not locked into one vendor.
4. The free tier is generous enough for MVP and early users.

Firebase would work, but we'd have to build more security ourselves,
and the NoSQL model makes the analytics queries harder.

Want me to explain any part in more detail?
```
