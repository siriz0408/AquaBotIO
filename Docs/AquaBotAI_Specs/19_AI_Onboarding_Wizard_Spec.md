# AI Onboarding Wizard & Persistent User Memory — Feature Specification
**Aquatic AI | R-019 | P0 — Critical User Experience**

---

## Problem Statement

New users who sign up for AquaBotAI don't know what to do. The current onboarding (name → tank type → tank name/volume → AI intro → done) is fast but shallow — it collects minimal data and doesn't differentiate between:

- A **complete beginner** starting their first tank ever (needs hand-holding, cycling guidance, starter species)
- An **experienced keeper** adding their 5th tank (knows what they want, skip the basics)
- A **returning hobbyist** who had tanks years ago and is getting back in (remembers some things, rusty on others)

Without understanding the user's context, goals, and experience level, the AI can't be the "personal aquarium coach" it should be. It gives generic advice when it should give *personalized coaching*.

Additionally, the AI currently has no persistent memory about the user beyond their skill level and current tank data. It doesn't know:
- What the user is trying to achieve (breed discus, create a low-maintenance community tank, start a reef)
- What struggles they've had (algae problems, fish losses, equipment failures)
- What their learning style is (wants deep explanations vs. just tell me what to do)
- What topics they've already covered (don't re-explain the nitrogen cycle every time)

This spec defines an **AI-powered onboarding wizard** that learns about the user through conversational questionnaires and creates a **persistent user memory** that makes every future AI interaction smarter and more personalized.

---

## Goals

- **G1**: Capture user context (experience, goals, challenges, tank status) during onboarding to enable personalized AI coaching from day 1
- **G2**: Create a persistent "AI memory" per user that accumulates knowledge from onboarding, chat interactions, and app actions — and injects this into every AI conversation
- **G3**: Auto-generate appropriate initial tasks, checklists, and recommendations based on user situation (e.g., cycling checklist for new tanks)
- **G4**: Reduce time-to-first-meaningful-AI-interaction from "user must ask something" to "AI proactively offers helpful guidance"
- **G5**: Increase 7-day retention by 30% through better first-time experience and personalized ongoing guidance

---

## Non-Goals

- **NG1**: Replacing manual tank creation — the wizard augments, not replaces, the existing tank CRUD
- **NG2**: Mandatory onboarding — users can skip (but are gently reminded later)
- **NG3**: Collecting data for advertising/selling — this is purely for personalization
- **NG4**: Voice-based onboarding — text-only in v1
- **NG5**: Psychometric profiling — we're not building a personality test, just understanding aquarium goals

---

## User Stories

### First-Time Setup

- **US-OB1**: As a complete beginner, I want the AI to ask me questions about my situation (new tank? existing tank? goals?) so it can guide me through getting started without overwhelming me.

- **US-OB2**: As an experienced keeper, I want to indicate my experience level early so the AI doesn't waste my time with basic explanations I already know.

- **US-OB3**: As someone starting a new tank, I want the AI to automatically create a cycling checklist and initial tasks so I don't have to figure out what to do first.

- **US-OB4**: As someone with an existing established tank, I want the AI to help me log my current setup quickly (livestock, parameters) so it can start giving relevant advice immediately.

### Ongoing Memory

- **US-MEM1**: As a returning user, I want the AI to remember what we discussed last time (my algae problem, my cycling progress) without me having to re-explain.

- **US-MEM2**: As a user who just added fish, I want the AI to remember this context and proactively check in about how the new fish are doing.

- **US-MEM3**: As a user who told the AI my goal is to breed discus, I want future advice to be oriented toward that goal (higher temperature discussions, conditioning guidance, etc.).

### Adaptive Guidance

- **US-GUIDE1**: As a beginner who skipped onboarding, I want the AI to gently ask clarifying questions during regular chat to build up my profile over time.

- **US-GUIDE2**: As a user who mentioned they're struggling with algae, I want the AI to proactively bring it up and offer to help when relevant.

---

## Requirements

### Must-Have (P0) — MVP

#### R-019.1: AI Onboarding Questionnaire

A conversational, AI-guided questionnaire that runs after account creation (before or integrated with tank creation).

**Question Flow:**

The AI adapts questions based on answers. Core branching logic:

```
1. "Is this your first aquarium ever, or do you have experience?"
   ├── First aquarium → Beginner path
   ├── Some experience (had tanks before) → Returning path
   └── Experienced keeper → Expert path

2. "What's your current situation?"
   ├── Starting a brand new tank → New Tank flow
   ├── Have an existing tank to add → Existing Tank flow
   └── Just exploring / learning → Explorer flow

3. [If New Tank] "Do you know what type of tank you want?"
   ├── Yes → Capture type, guide on specifics
   ├── Not sure → AI recommends based on goals
   └── What are my options? → Educational overview

4. [If New Tank] "What's drawing you to this hobby?"
   ├── Relaxation / decoration
   ├── Kids/family project
   ├── Specific fish I want to keep
   ├── Nature/ecosystem interest
   └── Other (free text)

5. [If Existing Tank] "Tell me about your tank"
   ├── Quick setup (guided form)
   └── Let me describe it (AI extracts info)

6. "What's your biggest concern or challenge right now?"
   ├── Not sure what to do first
   ├── Keeping fish alive
   ├── Water quality issues
   ├── Specific problem (describe)
   └── No concerns, just getting set up
```

**Questionnaire Features:**
- Conversational UI (chat-like, not form-like)
- AI generates follow-up questions based on answers
- Users can skip any question (default to safe assumptions)
- Progress indicator showing completion
- Estimated time: 2-3 minutes for quick path, 5-7 minutes for detailed path
- All answers stored in `user_preferences` table

**Acceptance Criteria:**
- Given a new user completes signup, they are offered the AI questionnaire before tank creation
- Given a user answers "first aquarium," the AI asks beginner-appropriate follow-ups
- Given a user skips the questionnaire, they can access it later from Settings or via AI prompt
- Given a user completes the questionnaire, their preferences are stored and immediately available to AI

---

#### R-019.2: User Preferences Table (AI Memory Core)

New table to store persistent user context that informs AI behavior.

**Schema:**

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Experience & Background
  experience_level TEXT CHECK (experience_level IN ('first_timer', 'returning', 'experienced', 'expert')),
  years_in_hobby INTEGER,
  previous_tank_types TEXT[], -- e.g., ['freshwater', 'saltwater']

  -- Current Situation
  current_situation TEXT CHECK (current_situation IN ('new_tank', 'existing_tank', 'exploring', 'multiple_tanks')),
  primary_goal TEXT, -- Free text: "breed discus", "low-maintenance community", etc.
  motivation TEXT CHECK (motivation IN ('relaxation', 'family_project', 'specific_species', 'nature_interest', 'other')),
  motivation_details TEXT, -- If "specific species" or "other"

  -- Learning Style & Preferences
  explanation_depth TEXT CHECK (explanation_depth IN ('brief', 'moderate', 'detailed')) DEFAULT 'moderate',
  wants_scientific_names BOOLEAN DEFAULT false,
  wants_reminders BOOLEAN DEFAULT true,
  communication_style TEXT CHECK (communication_style IN ('friendly', 'professional', 'casual')) DEFAULT 'friendly',

  -- Challenges & Context
  current_challenges TEXT[], -- e.g., ['algae', 'fish_loss', 'cycling']
  avoided_topics TEXT[], -- Topics user doesn't want repeated
  completed_topics TEXT[], -- Topics user has learned (don't re-explain)

  -- Tank Preferences (for recommendations)
  preferred_tank_types TEXT[],
  budget_range TEXT CHECK (budget_range IN ('tight', 'moderate', 'flexible', 'unspecified')),
  time_available TEXT CHECK (time_available IN ('minimal', 'moderate', 'plenty', 'unspecified')),

  -- AI Memory (accumulated from conversations)
  ai_learned_facts JSONB DEFAULT '[]'::jsonb, -- [{fact: "user struggles with algae", source: "chat_2024-02-10", confidence: 0.9}]
  ai_interaction_summary TEXT, -- Rolling summary of key learnings
  last_interaction_topics TEXT[], -- What was discussed recently (for continuity)

  -- Timestamps
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_prefs_user ON user_preferences(user_id);
```

**RLS Policy:**
```sql
-- Users can only access their own preferences
CREATE POLICY "Users access own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
```

**Acceptance Criteria:**
- Given a user completes onboarding, their preferences are inserted into this table
- Given preferences exist, the AI context builder includes them in every chat request
- Given a user updates preferences in Settings, the changes take effect immediately in AI

---

#### R-019.3: AI Context Enhancement

Extend the existing `context-builder.ts` to include user preferences in every AI request.

**New UserContext Interface:**

```typescript
export interface UserContext {
  // Existing fields
  skill_level: string;
  unit_preference_volume: string;
  unit_preference_temp: string;

  // New preference fields
  experience_level?: string;
  primary_goal?: string;
  explanation_depth?: string;
  current_challenges?: string[];
  completed_topics?: string[];
  ai_learned_facts?: Array<{fact: string; confidence: number}>;
  last_interaction_topics?: string[];
}
```

**System Prompt Enhancement:**

Add a new section to `system-prompt.ts`:

```
## User Profile & Memory

This user's background and preferences:
- Experience: {experience_level} ({years_in_hobby} years)
- Goal: {primary_goal}
- Current challenges: {current_challenges}
- Explanation preference: {explanation_depth}
- Topics already covered: {completed_topics}

Things I've learned about this user:
{ai_learned_facts as bullet list}

Recent conversation topics: {last_interaction_topics}

Use this context to:
1. Tailor explanations to their experience level
2. Reference their stated goal when relevant
3. Don't re-explain topics in completed_topics unless asked
4. Follow up on their current_challenges proactively
5. Continue threads from recent topics when appropriate
```

**Acceptance Criteria:**
- Given user preferences exist, the AI system prompt includes them
- Given no preferences exist, the AI falls back to defaults (beginner, moderate depth)
- Given a user has `completed_topics`, the AI doesn't re-explain those concepts unless asked

---

#### R-019.4: Automatic Task & Checklist Generation

When onboarding identifies the user's situation, auto-create appropriate tasks.

**New Tank Starter Tasks:**

For users who indicate they're starting a new tank:

```json
{
  "checklist_type": "new_tank_setup",
  "tasks": [
    {
      "title": "Cycle your tank",
      "type": "custom",
      "description": "Establish beneficial bacteria before adding fish. This takes 4-6 weeks.",
      "frequency": null,
      "is_checklist_item": true,
      "checklist_order": 1
    },
    {
      "title": "Test water daily during cycling",
      "type": "water_testing",
      "description": "Monitor ammonia, nitrite, and nitrate to track cycling progress",
      "frequency": "daily",
      "is_checklist_item": true,
      "checklist_order": 2
    },
    {
      "title": "Research compatible fish",
      "type": "custom",
      "description": "Plan your stocking list before buying fish",
      "is_checklist_item": true,
      "checklist_order": 3
    },
    {
      "title": "Add first fish (after cycle complete)",
      "type": "custom",
      "description": "Start with hardy species, add slowly over weeks",
      "is_checklist_item": true,
      "checklist_order": 4
    }
  ]
}
```

**Existing Tank Starter Tasks:**

For users with existing tanks:

```json
{
  "checklist_type": "existing_tank_setup",
  "tasks": [
    {
      "title": "Log current water parameters",
      "type": "water_testing",
      "description": "Establish a baseline for AI analysis"
    },
    {
      "title": "Add your livestock",
      "type": "custom",
      "description": "Record what's in your tank so AI can check compatibility"
    },
    {
      "title": "Set up maintenance schedule",
      "type": "custom",
      "description": "AI will suggest tasks based on your setup"
    }
  ]
}
```

**Acceptance Criteria:**
- Given a user indicates "new tank" during onboarding, cycling checklist tasks are auto-created
- Given a user indicates "existing tank," baseline tasks are auto-created
- Given a user has a checklist, the dashboard shows checklist progress
- Given a task is marked complete, checklist progress updates

---

#### R-019.5: AI Memory Update Mechanism

The AI should learn from interactions and update `user_preferences` over time.

**Memory Triggers:**

1. **Explicit statements**: "I've been struggling with algae for months"
   - AI extracts fact: `{fact: "user has persistent algae problem", source: "chat", confidence: 0.95}`

2. **Implicit learning**: User asks about discus 5 times
   - AI infers: `{fact: "user interested in discus", source: "pattern", confidence: 0.7}`

3. **Action completion**: User marks "nitrogen cycle" topic as learned
   - Add to `completed_topics`

4. **Conversation summary**: At end of significant conversation
   - Update `last_interaction_topics`
   - Append to `ai_interaction_summary` if major learning

**Implementation:**

Add a new Edge Function `update-user-memory` that:
1. Receives conversation summary after significant interactions
2. Uses Claude Haiku to extract learnable facts
3. Updates `user_preferences` table
4. Merges new facts with existing (dedup, update confidence)

**Acceptance Criteria:**
- Given a user mentions a challenge, it's captured in `ai_learned_facts`
- Given a user discusses a topic extensively, it's added to `completed_topics`
- Given a user has prior learned facts, AI references them appropriately

---

### Nice-to-Have (P1)

#### R-019.6: Onboarding Resume & Settings Access

- Users who skip onboarding see a gentle prompt on dashboard
- "Complete your profile" card with estimated time
- Full questionnaire accessible from Settings → "AI Preferences"
- Users can edit any preference at any time

#### R-019.7: AI Proactive Check-ins

Based on user context, AI proactively offers help:
- "I noticed you're cycling a new tank. How's the ammonia looking today?"
- "It's been a week since you added those neon tetras. How are they doing?"
- "You mentioned algae was a problem. Want to troubleshoot it?"

#### R-019.8: Goal Tracking Dashboard

Visual progress toward user's stated goal:
- "Goal: Successfully cycle tank" → Progress bar based on parameter readings
- "Goal: Stock with community fish" → Checklist of species added

---

### Future Considerations (P2)

#### R-019.9: Multi-User Memory (Household)

Support for households where multiple people manage the same tank:
- Shared tank preferences
- Individual user preferences
- "Your partner logged parameters yesterday"

#### R-019.10: AI Coach Personality Selection

Let users choose AI personality:
- "Encouraging mentor" (lots of praise, beginner-friendly)
- "Straight shooter" (direct, minimal fluff)
- "Science nerd" (detailed explanations, citations)

---

## Success Metrics

### Leading (Days to Weeks)

| Metric | Target | Definition |
|--------|--------|-----------|
| Onboarding completion rate | > 60% | % of new users who complete at least 5 questions |
| Time to first AI interaction | < 3 min | Time from signup to first meaningful AI exchange |
| Task checklist adoption | > 50% | % of new tank users who use generated checklists |
| Preference coverage | > 70% | % of users with at least 5 preferences populated |

### Lagging (Weeks to Months)

| Metric | Target | Definition |
|--------|--------|-----------|
| 7-day retention lift | +30% | Retention improvement vs. users who skip onboarding |
| AI satisfaction | > 4.2/5.0 | Rating on "AI understood my needs" metric |
| Repeated topic rate | < 10% | % of AI explanations on topics already in completed_topics |
| Goal achievement | > 40% | % of users who achieve their stated primary goal within 90 days |

---

## UI/UX Design

### Onboarding Wizard Flow

**Screen 1: Welcome Choice**
```
┌─────────────────────────────────────┐
│  🐠 Welcome to AquaBotAI!           │
│                                     │
│  I'm your personal aquarium         │
│  assistant. Let me learn about      │
│  you so I can give better advice.   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🎓 This is my first tank   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  🔄 I've kept tanks before  │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  ⭐ I'm an experienced      │   │
│  │      aquarist               │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Skip for now]                     │
└─────────────────────────────────────┘
```

**Screen 2: Situation (example for beginner)**
```
┌─────────────────────────────────────┐
│  Great! What's your situation?      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🆕 I'm setting up a new    │   │
│  │      tank (haven't bought   │   │
│  │      fish yet)              │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  🐟 I already have a tank   │   │
│  │      with fish              │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  📚 Just exploring /        │   │
│  │      learning first         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ← Back                             │
└─────────────────────────────────────┘
```

**Screen 3: Goal (example)**
```
┌─────────────────────────────────────┐
│  What's your main goal?             │
│                                     │
│  (This helps me give better advice) │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  💧 Easy, low-maintenance   │   │
│  │      tank                   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  🌿 Beautiful planted tank  │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  🐠 Keep specific fish      │   │
│  │      (tell me which!)       │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  🌊 Start a reef tank       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ← Back                             │
└─────────────────────────────────────┘
```

**Screen 4: Challenges (optional)**
```
┌─────────────────────────────────────┐
│  Any challenges I should know       │
│  about?                             │
│                                     │
│  (Select all that apply)            │
│                                     │
│  ☐ Keeping fish alive               │
│  ☐ Water quality / algae            │
│  ☐ Choosing compatible fish         │
│  ☐ Staying on top of maintenance    │
│  ☐ Understanding water chemistry    │
│  ☐ No challenges right now          │
│                                     │
│  ← Back            [Continue →]     │
└─────────────────────────────────────┘
```

**Screen 5: Confirmation + Tank Setup**
```
┌─────────────────────────────────────┐
│  ✨ Perfect! Here's what I know:    │
│                                     │
│  • First-time aquarist              │
│  • Setting up a new freshwater tank │
│  • Goal: Low-maintenance community  │
│  • Challenges: Understanding water  │
│    chemistry                        │
│                                     │
│  Now let's set up your tank and     │
│  I'll create a personalized plan!   │
│                                     │
│  [Create My Tank →]                 │
│                                     │
│  [← Edit answers]                   │
└─────────────────────────────────────┘
```

### AI Chat with Memory Context

The AI greeting changes based on user context:

**For new beginner with new tank:**
```
👋 Hey [Name]! I'm ready to help you get your new tank
set up right!

Since you mentioned you're new to the hobby and want
a low-maintenance community tank, I've created a
setup checklist for you.

📋 **Your Getting Started Checklist:**
• Cycle your tank (we'll do this first!)
• Test water daily during cycling
• Research compatible fish
• Add first fish after cycle completes

Want me to explain what cycling is and why it matters?

[Yes, explain cycling] [I already know, skip ahead]
```

**For experienced keeper adding existing tank:**
```
👋 Welcome back to fishkeeping, [Name]!

Since you have an established [freshwater] tank, let's
get you set up quickly:

1. Tell me your tank specs (size, equipment)
2. Log your current livestock
3. Record recent parameters

Then I can start giving you personalized insights.

What would you like to start with?

[Log my tank details] [Just explore for now]
```

---

## Technical Implementation

### Phase 1: MVP (2 sprints)

**Sprint 1: Data Model + Questionnaire**
- [ ] Create `user_preferences` table with migration
- [ ] Build questionnaire UI component
- [ ] Implement branching question logic
- [ ] Store responses to database
- [ ] Add "skip" and "resume later" functionality

**Sprint 2: AI Integration + Tasks**
- [ ] Extend context-builder.ts to include user preferences
- [ ] Update system-prompt.ts with user memory section
- [ ] Implement auto-task generation for new/existing tanks
- [ ] Build memory update Edge Function
- [ ] Add onboarding to dashboard prompt (for skippers)

### Phase 2: Enhancement (1 sprint)

**Sprint 3: Polish + Memory**
- [ ] Settings page for editing preferences
- [ ] Proactive AI check-ins
- [ ] Goal progress tracking
- [ ] Conversation memory updates
- [ ] Analytics/metrics tracking

### Dependencies

- **R-001 (AI Chat Engine)**: Must be functional for AI questionnaire
- **R-002 (Tank Profile)**: Tank creation flow integrates with onboarding
- **R-008 (Maintenance Tasks)**: Auto-generated tasks use this system
- **R-006 (Auth)**: User must be authenticated before onboarding

### Migration Notes

**Existing User Handling:**
- Users without `user_preferences` row get defaults
- Dashboard shows "Complete your profile" card for users missing preferences
- AI works fine without preferences (falls back to skill_level from users table)

---

## Open Questions

1. **Q1**: Should the questionnaire be AI-generated (more dynamic but slower) or predefined with branching (faster but less adaptive)?
   - **Recommendation**: Predefined with branching for MVP, AI-generated follow-ups for P1

2. **Q2**: How aggressively should the AI update learned facts from conversations?
   - **Recommendation**: Only high-confidence explicit statements initially; expand with user feedback

3. **Q3**: Should we show users their AI memory ("Here's what I know about you")?
   - **Recommendation**: Yes, in Settings. Transparency builds trust and lets users correct mistakes.

4. **Q4**: How do we handle users who change experience level over time?
   - **Recommendation**: Allow editing in Settings; AI adapts immediately; don't auto-upgrade based on actions

---

## Appendix: Questionnaire Question Bank

### Experience Assessment

| Question | Options | Maps to |
|----------|---------|---------|
| Is this your first aquarium? | Yes / Had tanks before / Experienced | experience_level |
| How long have you been in the hobby? | New / < 1 year / 1-5 years / 5+ years | years_in_hobby |
| What types of tanks have you kept? | Freshwater / Saltwater / Planted / Reef / Pond | previous_tank_types |

### Situation Assessment

| Question | Options | Maps to |
|----------|---------|---------|
| What's your current situation? | New tank / Existing tank / Multiple tanks / Exploring | current_situation |
| Do you already have equipment? | Yes / Partially / No | (informs recommendations) |
| Is your tank cycled? | Yes / In progress / No / What's cycling? | (triggers checklist) |

### Goals & Motivation

| Question | Options | Maps to |
|----------|---------|---------|
| What's drawing you to fishkeeping? | Relaxation / Family / Specific fish / Nature | motivation |
| What's your main goal? | Free text | primary_goal |
| Any specific species you want? | Free text | motivation_details |

### Preferences

| Question | Options | Maps to |
|----------|---------|---------|
| How detailed do you want explanations? | Brief / Moderate / Detailed | explanation_depth |
| Should I remind you about maintenance? | Yes / Sometimes / No | wants_reminders |
| Budget for this hobby? | Tight / Moderate / Flexible | budget_range |
| Time available for maintenance? | Minimal / Moderate / Plenty | time_available |

### Challenges

| Question | Options | Maps to |
|----------|---------|---------|
| Any current challenges? | Multi-select | current_challenges |
| Topics you already understand well? | Multi-select | completed_topics |

---

**Document Version:** 1.0
**Last Updated:** 2026-02-12
**Author:** R&D Discovery Agent
**Status:** Ready for Review

---

## Related Specs

| Spec | Relationship |
|------|-------------|
| 01_AI_Chat_Engine_Spec.md | User preferences feed into AI context |
| 05_Maintenance_Scheduling_Spec.md | Auto-generated tasks use maintenance system |
| 06_Authentication_Onboarding_Spec.md | This replaces/extends R-012 onboarding |
| 00_Data_Model_Schema.md | Add user_preferences table |
