# Task Brief Template

> PM uses this template to create focused assignments for agents.
> Target: ~50 lines of task-specific context. This is a SOFT CAP — go over if the task needs it.

---

## TASK BRIEF: [Task Title]

**Agent:** [Frontend / Backend]
**Sprint:** [Sprint number]
**Task ID:** [e.g., S01-FE-01]
**Branch:** [e.g., feature/auth-ui]
**Priority:** [P0 Critical / P1 High / P2 Medium / P3 Low]
**Skills to Load:** [e.g., /frontend-design, /mobile-design — or "None" if not applicable]
**Design Reference:** [For UI tasks: `15_UI_UX_Design_System.md` Section [N] + wireframe component name — or "N/A" for backend tasks]

---

### Objective
[2-3 lines: What exactly to build or fix. Plain language. Be specific.]

### Scope
**Files to create/modify:**
- [file path 1]
- [file path 2]

**Files you may read (do not modify):**
- [file path]

**Do NOT touch:**
- [explicitly list files/areas that are off-limits]

---

### Spec Extract
[100-200 lines: Only the relevant section from the spec doc, not the full document.]
[Tag critical requirements: [CRITICAL], [REFERENCE], [EDGE CASE]]

---

### Memory Highlights
[30 lines max: Only relevant patterns, mistakes, or decisions from memory/]

**Relevant patterns:**
- [P001: brief description]

**Watch out for:**
- [M003: brief description of past mistake to avoid]

---

### Active Work Board Snapshot
| Agent | Task | Key Files | Status |
|-------|------|-----------|--------|
[Current state of other agents' work that might affect this task]

**Dependency notes:**
- [What this task depends on]
- [What depends on this task]
- [Shared files to coordinate on]

---

### Success Criteria
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] [Specific, testable criterion 3]
- [ ] Self-review checklist completed
- [ ] No files modified outside scope

---

### Context Budget Note
Base context: ~1,400 tokens
Task context: ~[estimate] tokens
Total: ~[estimate] tokens
Budget status: [Under / At / Over — and that's OK because: reason]

---

> **Reminders:**
> - Check Active Work Board before committing
> - Use commit format: `[agent] task-id: description`
> - Report to PM if you hit a conflict or need to modify files outside scope
> - If you learn something new, note it in memory/agent_notes/[your-role].md
> - **For all UI tasks:** Verify colors and layout match `15_UI_UX_Design_System.md`. Wireframes in `Docs/Wireframes/` are the visual source of truth.
