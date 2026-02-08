# Memory System — Master Index

> Last updated: 2026-02-08
> Total entries: 31 (8 bugs, 9 decisions, 8 patterns, 2 mistakes, 10 sprints + docs audit)
> System version: v2 (updated with auto-spawn agent system + Supabase feedback)

## How This Works

This is the team's shared brain. Memory is organized into categories with individual entries.
Agents find what they need in 3 steps:
1. Read this INDEX (you're here) — find the relevant category
2. Read the category's INDEX.md — scan entries by domain/impact
3. Load only the 2-4 entries that matter for your task

## How Memory Gets Populated

Memory is populated through two loops:

1. **Agent Memory Reports** — Every time Frontend or Backend agents complete a task, they return a Memory Report to the PM with bugs found, decisions made, patterns discovered, mistakes made, and gotchas. The PM files these into the appropriate categories (see Step 11.5 in `pm_orchestrator.md`).

2. **Sam's Feedback** — Sam submits feedback via the Roadmap page Feedback tab, which saves to the Supabase `feedback` table (project `mtwyezkbmyrgxqmskblu`). The PM reads this at the start of every run and creates entries in `feedback/`.

**If categories remain at 0 entries after multiple sprints, something is broken.** The PM should check that agents are including Memory Reports in their returns.

## Categories

| Category | Directory | Entries | Purpose |
|----------|-----------|---------|---------|
| Bugs | `bugs/` | 8 (0 active, 8 resolved) | Active and resolved bug tracker |
| Decisions | `decisions/` | 9 | Architecture choices and reasoning |
| Patterns | `patterns/` | 8 | Proven solutions that work |
| Mistakes | `mistakes/` | 2 | What went wrong and how to prevent it |
| Sprints | `sprints/` | 10 (+ docs audit) | Sprint summaries and outcomes |
| Feedback | `feedback/` | 0 | Sam's feedback and how we acted on it |
| Agent Notes | `agent_notes/` | 0 | Per-agent working notes and gotchas |
| Archive | `archive/` | 0 | Resolved entries older than 60 days |

## Feedback Sources

| Source | Location | How PM Accesses |
|--------|----------|-----------------|
| **Supabase feedback table** (primary) | `public.feedback` in Supabase project `mtwyezkbmyrgxqmskblu` | `SELECT * FROM feedback WHERE status = 'pending'` |
| **Feedback images** | `feedback-images` Storage bucket (public URLs in `image_urls` column) | Direct URL access |
| **Legacy feedback files** | `feedback/` directory here | Read INDEX.md |

## Active Work Board

See `active_work.md` in this directory for what every agent is currently working on.

## Entry Format (Standard)

Every memory entry follows this template (5-15 lines max):

```
# Title
ID | Date | Impact: HIGH/MEDIUM/LOW | Status: ACTIVE/RESOLVED | Domain: auth/billing/ui/db/ai/etc.

**Summary:** One sentence — what this entry is about.

**Details:** What happened / how it works (2-3 sentences).

**Action:** What to do about it (the practical takeaway).

**Links:** Related entries (e.g., → P003, → B007)
```

## Naming Conventions

| Category | ID Format | Example |
|----------|-----------|---------|
| Bugs | `B{NNN}` | `B001-tank-delete-race-condition.md` |
| Decisions | `D{NNN}` | `D001-use-recharts-over-d3.md` |
| Patterns | `P{NNN}` | `P001-api-response-envelope.md` |
| Mistakes | `M{NNN}` | `M001-forgot-rls-on-new-table.md` |
| Feedback | `F{NNN}` | `F001-prioritize-water-params.md` |
| Sprints | `sprint_{NN}` | `sprint_03_summary.md` |

## Maintenance Schedule

- **Every run:** PM processes agent Memory Reports → files into categories. PM reads Supabase feedback → files into `feedback/`. Updates INDEX files and entry counts.
- **Weekly (Friday):** PM prunes, merges duplicates, archives old entries, validates links.
- **After every error:** PM adds mistake + bug entry immediately.
