# Maintenance Scheduling & Notifications — Feature Specification
**Aquatic AI | R-008 | P0 — Must-Have**

## Problem Statement
Consistent maintenance is the difference between a thriving aquarium and a dying one, yet hobbyists routinely forget or delay routine tasks — water changes, filter cleaning, dosing, feeding schedules. Current aquarium apps offer basic reminder features but don't adapt to the tank's actual needs. A 10-gallon tank with heavy bioload needs more frequent water changes than a lightly stocked 75-gallon. Aquatic AI provides intelligent, AI-suggested maintenance schedules that adapt to each tank's specific needs, combined with reliable push notifications to keep users on track.

## Goals
- Let users create recurring and one-time maintenance tasks with reminders in under 30 seconds
- Provide AI-suggested maintenance schedules based on tank size, bioload, filtration, and parameter trends
- Deliver push notifications via PWA that reliably remind users of upcoming tasks
- Track maintenance completion history so the AI can factor consistency into its analysis
- Improve maintenance consistency by 40%+ compared to unassisted hobbyists

## Non-Goals
- NG1: Automated task execution (auto-dosing, auto-water-change) — manual confirmation only
- NG2: Calendar integration (Google Calendar, Apple Calendar sync) — P2 consideration
- NG3: Multi-user task assignment — single-user only
- NG4: Maintenance supply tracking or shopping lists — P2 consideration
- NG5: SMS notifications — PWA push and email only

## User Stories
- US-19: As a hobbyist, I want to create maintenance tasks (water changes, filter cleaning, dosing schedules) with reminders, so I never forget routine care.
- US-20: As a hobbyist, I want the AI to suggest a maintenance schedule based on my tank's specific needs (size, bioload, filtration), so I'm doing the right things at the right frequency.
- US-21: As a hobbyist, I want to receive push notifications for upcoming maintenance, parameter alerts, and AI insights, so I stay on top of my tanks even when not in the app.
- US-22: As a hobbyist, I want to log completed maintenance tasks, so the AI can track my consistency and factor it into recommendations.
- US-extra1: As a hobbyist, I want to see an overview of all upcoming and overdue tasks across all my tanks, so I can plan my maintenance time efficiently.
- US-extra2: As a hobbyist, I want the AI to adjust my maintenance schedule when my tank conditions change (new livestock added, parameter trends shifting), so the schedule stays optimal.

## Requirements

### Must-Have (P0)

#### R-008.1: Create Maintenance Tasks
Support recurring and one-time tasks. Task types: water change, filter cleaning, feeding, dosing, equipment maintenance, water testing, custom.

**Fields:**
- title (string, required, max 100 chars)
- type (enum: water_change, filter_clean, feeding, dosing, equipment_maintenance, water_testing, custom)
- description (string, optional, max 500 chars)
- tank_id (UUID, required) — links task to a specific tank
- frequency (for recurring: daily, every_X_days, weekly, biweekly, monthly)
- next_due_date (date, required)
- reminder_time (time, optional; default: 9:00 AM)
- is_recurring (boolean)
- created_at (timestamp)
- created_by (user_id)

**Acceptance Criteria:**
- Given a user creates a recurring weekly water change task, it appears in their task list with the correct next due date
- Given a user creates a one-time task, it appears once and is archived after completion
- Given a user creates a task with an invalid frequency, the system rejects it with a clear error message
- Given a user sets a reminder time, the notification is scheduled for that time on the due date

---

#### R-008.2: Task Completion Logging
Mark tasks as complete with optional notes. Completed tasks are logged in maintenance history.

**Behavior:**
- Marking a task complete triggers:
  - Creation of a log entry (maintenance_logs table)
  - Auto-advancement of next_due_date for recurring tasks
  - Update of last_completed timestamp
  - Cancellation of pending notifications
- Users can log completion with optional notes (e.g., "Water slightly cloudy, did 30% change instead of 25%")

**Acceptance Criteria:**
- Given a user marks a water change as complete, the next due date auto-advances per the recurrence schedule
- Given completion, it's logged in maintenance_logs with timestamp, user_id, notes, and tank_id
- Given a user logs a one-time task as complete, it's moved to archive and no longer appears in active task list
- Given a user undoes completion (optional feature), the task reverts and the log entry is marked as reversed

---

#### R-008.3: Push Notifications via PWA
Browser-based push notifications for upcoming tasks via the Web Push API. Notifications are configurable: 1 hour before, morning of (9:00 AM), or day before (evening).

**Notification Content:**
- Title: "{Task Name}" (e.g., "Weekly Water Change")
- Body: "{Tank Name} • Due at {time}" (e.g., "Planted 40-gallon • Due at 10:00 AM")
- Icon: Aquatic AI logo or task-type icon
- Action buttons: "Mark Complete" (optional, dependent on browser support), "Dismiss"
- Tag: unique per task to prevent duplicate notifications in notification center

**Implementation:**
- Service worker listens for push events from server
- Supabase Edge Function checks for tasks due in next 24 hours every hour
- Sends Web Push API payload to FCM or native browser push
- Graceful degradation: if PWA permissions denied, suggest email notifications

**Acceptance Criteria:**
- Given a user has enabled notifications and a task is due, they receive a push notification at the configured reminder time
- Given a user has not granted notification permission, they see a prompt explaining the value with "Enable" and "Later" buttons
- Given a task is snoozed (if implemented), the user receives a re-notification in 2 hours
- Given multiple tasks are due, each receives its own notification (not batched)

---

#### R-008.4: Task Overview
Dashboard view (or dedicated page) showing all upcoming tasks across all tanks, sorted by due date. Overdue tasks highlighted with visual urgency.

**Display:**
- List or card view showing:
  - Tank name (with tank color/icon for quick visual identification)
  - Task name and type icon
  - Due date and time
  - Recurrence indicator (if recurring)
  - Checkbox to complete directly from overview
  - "X days overdue" label for overdue tasks
- Filtering/sorting:
  - Sort by: due date (default), tank, type
  - Filter by: tank, type, status (upcoming, overdue, completed)
- Summary stats:
  - Total tasks due this week
  - Number of overdue tasks
  - Streak indicator (if P1 feature implemented)

**Acceptance Criteria:**
- Given a user has tasks across 3 tanks, the overview shows all tasks sorted chronologically with tank name labels
- Given a task is overdue, it's highlighted with visual urgency (red badge, "X days overdue" label)
- Given a user completes a task from the overview, the task advances and the view updates immediately
- Given a user filters by tank, only that tank's tasks are shown
- Given the user has no tasks, a helpful prompt appears: "No tasks scheduled. Create one or accept AI suggestions."

---

#### R-008.5: AI-Suggested Maintenance Schedules
When a user completes tank setup, the AI suggests an initial maintenance schedule based on tank type, size, livestock, and filtration.

**Suggestion Engine:**
- Triggered after tank profile completion (tank type, volume, filter type, livestock added)
- AI Chat Engine queries tank data and generates schedule based on:
  - Tank volume (smaller tanks need more frequent changes)
  - Bioload (fish count, feeding frequency, plant density)
  - Filtration (mechanical, biological, chemical capacity)
  - Tank type (planted, reef, cichlid, shrimp, etc.)
- Returns 3–5 suggested tasks with justification (e.g., "Weekly 30% water changes maintain stable parameters in this planted setup")

**Suggestion Payload Example:**
```json
{
  "suggestions": [
    {
      "title": "Water Change",
      "type": "water_change",
      "frequency": "weekly",
      "description": "30% water change to maintain nutrient balance in planted tank",
      "rationale": "Your 40-gallon planted tank with 8 fish requires weekly changes to balance plant uptake and fish bioload"
    },
    {
      "title": "Filter Media Rinse",
      "type": "filter_clean",
      "frequency": "biweekly",
      "description": "Rinse mechanical media in tank water",
      "rationale": "Prevents clogging while maintaining beneficial bacteria"
    }
  ]
}
```

**Acceptance Criteria:**
- Given a user completes tank setup with livestock, the AI suggests a starter maintenance schedule (e.g., 25% water change weekly, filter rinse monthly)
- Given a user accepts the suggestion, tasks are auto-created with next_due_date set to an appropriate time (3 days for first task, then per schedule)
- Given a user rejects a suggestion, it's not persisted but can be re-requested
- Given the AI suggestion rationale is shown to the user, they can see the reasoning behind each task

---

#### R-008.6: Edit and Delete Tasks
Users can modify any task field or delete tasks they no longer need.

**Edit Capabilities:**
- Change title, description, type, frequency, due date, reminder time
- Update is_recurring, change single recurring instance without affecting others (P1)
- Recalculate next_due_date if frequency is changed

**Delete Behavior:**
- Hard delete for one-time tasks
- For recurring tasks, option to delete "this occurrence" or "this and all future"
- Deleted tasks remain in maintenance_logs for historical record (soft delete on task, hard delete on association)

**Acceptance Criteria:**
- Given a user changes a task from weekly to biweekly, the next due date recalculates correctly
- Given a user deletes a recurring task, they're prompted to choose "this occurrence," "this and future," or "all occurrences"
- Given a user edits a task that's already overdue, a warning prompt appears
- Given a user deletes a task, it's removed from the active task list but still queryable in maintenance history

---

### Nice-to-Have (P1)

#### R-008.7: AI Schedule Adjustment
AI proactively suggests schedule changes when conditions change (e.g., "Your bioload increased — consider more frequent water changes").

**Trigger Events:**
- New livestock added (triggers re-evaluation)
- Parameter trends flagged (e.g., ammonia creeping up despite tasks completed)
- User marks multiple tasks as overdue
- User adds large water change notes indicating parameter swings

**Adjustment Notification:**
- Chat message or in-app notification: "I noticed you've added 4 new fish. Your bioload increased ~30%. Consider weekly water changes instead of biweekly."
- User can accept (auto-update schedule), dismiss, or ignore

---

#### R-008.8: Maintenance Streaks and Consistency Tracking
Visual streak counter and consistency score to gamify regular maintenance.

**Metrics:**
- Current streak: days/weeks of on-time task completion (resets if task overdue by >48 hours)
- Consistency score: percentage of tasks completed on-time over last 90 days
- Streak badges: 7-day, 30-day, 90-day milestones with celebrations

**Display:**
- Widget on dashboard showing current streak and consistency %
- Leaderboard per tank (optional)

---

#### R-008.9: Batch Task Completion
Complete multiple tasks at once for users who do all maintenance in one session.

**Behavior:**
- Checkbox to select multiple tasks from overview
- "Complete Selected" button
- Single confirmation prompt
- All tasks advance with next_due_dates recalculated
- Single maintenance_logs entry per task (or batched entry if preferred)

---

### Future Considerations (P2)

#### R-008.10: Calendar Sync
Export tasks to Google Calendar, Apple Calendar, or iCal.

**Implementation:**
- OAuth integration with Google/Apple
- Bidirectional sync or export-only
- Allows users to view maintenance in their native calendar app

---

#### R-008.11: Maintenance Supply Tracking
Track supplies (filter media, water conditioner, food) and alert when running low.

**Features:**
- Log supplies purchased and quantity
- Set reorder thresholds
- Alert when supply level drops below threshold
- Link supplies to maintenance tasks (e.g., filter cleaning task links to filter media supply)

---

#### R-008.12: Community Maintenance Templates
Share and import maintenance schedules from other users or curated templates.

**Implementation:**
- Template marketplace or community section
- Users can export their schedule as a template
- New users can browse and import templates for their tank type
- Upvote/review system for templates

---

## Success Metrics

### Leading (Adoption & Engagement)
- **Task creation rate:** > 60% of active users create at least one maintenance task within first week of onboarding
- **Notification opt-in rate:** > 50% of users enable PWA push notifications
- **Quick task creation:** > 80% of task creation completed in < 2 minutes
- **AI suggestion acceptance:** > 40% of suggested schedules are fully or partially accepted

### Lagging (Long-term Impact)
- **Task completion rate:** > 70% of due tasks are marked complete within 24 hours of due date
- **Maintenance consistency:** Users with active maintenance schedules show 40%+ better parameter stability over 90 days compared to pre-feature baseline
- **Overdue task rate:** < 20% of recurring tasks become overdue by more than 48 hours
- **Retention lift:** Users with ≥3 active tasks show 25%+ higher 30-day retention vs. users with 0 tasks
- **Fish/livestock health:** Proxy metric — users with task compliance show fewer reported parameter emergencies in chat logs

---

## Decisions (Resolved)

- ✅ **Tier Gating for Maintenance Tasks:** Maintenance task limits are enforced per subscription tier:
  - **Free:** 3 total tasks across all tanks
  - **Starter:** 10 tasks per tank
  - **Plus:** 10 tasks per tank
  - **Pro:** Unlimited tasks
  - When a user hits their limit, show upgrade prompt (not error). AI-suggested schedules respect tier limits.
- ✅ Custom species: Users can add unlisted species with a "custom species" entry (name, basic parameters). Custom species do not get AI compatibility checking. AI chat can still discuss them based on user-provided context.
- ✅ Mortality tracking: When user removes livestock, they select a reason (died, rehomed, returned to store, other). Mortality data feeds into AI health analysis and parameter correlation.
- ✅ Livestock photos: Users can attach photos to livestock entries (via Supabase Storage). Photos appear in livestock detail view. P1 feature.
- ✅ Stocking recommendations: AI provides stocking level guidance based on tank volume, filtration, and existing livestock bioload. Uses rule of thumb (1 inch of fish per gallon for freshwater) as baseline, adjusted by species-specific needs.

---

## Timeline Considerations

### Phase 1 (MVP)
**Scope:** Task CRUD, completion logging, push notifications, AI suggestions
**Blockers/Dependencies:**
- Tank Profile Management (R-002) — tasks scoped to tanks
- AI Chat Engine (R-001) — for generating AI-suggested schedules
- Service Worker & PWA Foundation (R-011) — required for push notifications
- Authentication & RLS (R-003) — for task isolation per user

**Effort:** ~3 weeks (2 engineers: backend + frontend)

### Phase 2 (P1)
**Scope:** AI schedule adjustments, streak tracking, batch completion, calendar sync
**Effort:** ~2 weeks (1 engineer)

### Phase 3 (P2)
**Scope:** Supply tracking, community templates, SMS fallback
**Effort:** ~3 weeks (2 engineers)

---

## Technical Notes

### Data Models

#### maintenance_tasks Table
```sql
CREATE TABLE maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('water_change', 'filter_clean', 'feeding', 'dosing', 'equipment_maintenance', 'water_testing', 'custom')),
  description TEXT,
  frequency VARCHAR(50) CHECK (frequency IN ('daily', 'every_2_days', 'every_3_days', 'every_7_days', 'weekly', 'biweekly', 'monthly')),
  next_due_date DATE NOT NULL,
  last_completed_date TIMESTAMP,
  is_recurring BOOLEAN DEFAULT false,
  reminder_time TIME DEFAULT '09:00:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  INDEX (tank_id),
  INDEX (user_id),
  INDEX (next_due_date),
  CONSTRAINT valid_dates CHECK (next_due_date >= CURRENT_DATE OR NOT is_active)
);
```

#### maintenance_logs Table
```sql
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES maintenance_tasks(id) ON DELETE SET NULL,
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_date TIMESTAMP NOT NULL DEFAULT now(),
  notes TEXT,
  was_late BOOLEAN GENERATED ALWAYS AS (completed_date > (SELECT next_due_date FROM maintenance_tasks WHERE id = task_id) + INTERVAL '1 day') STORED,
  created_at TIMESTAMP DEFAULT now(),
  INDEX (tank_id),
  INDEX (user_id),
  INDEX (task_id),
  INDEX (completed_date)
);
```

#### notification_preferences Table
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  reminder_time VARCHAR(50) DEFAULT 'morning_of', -- 'day_before', 'morning_of', '1_hour_before'
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### API Endpoints (REST/GraphQL)

#### REST Endpoints
- `POST /api/v1/maintenance/tasks` — Create task
- `GET /api/v1/maintenance/tasks?tank_id=xxx&status=upcoming` — List tasks
- `GET /api/v1/maintenance/tasks/:id` — Get task details
- `PATCH /api/v1/maintenance/tasks/:id` — Update task
- `DELETE /api/v1/maintenance/tasks/:id` — Delete task
- `POST /api/v1/maintenance/tasks/:id/complete` — Mark complete
- `GET /api/v1/maintenance/logs?tank_id=xxx` — Maintenance history
- `GET /api/v1/maintenance/stats` — Consistency metrics
- `POST /api/v1/maintenance/suggestions` — AI-generated suggestions for tank

#### GraphQL Subscriptions (optional)
- `subscriptions { maintenanceTaskUpdated(tank_id: UUID) }` — Real-time task updates

### Service Worker & Push Notifications

**Service Worker (`/public/sw.js`):**
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/aquatic-ai-icon.png',
    tag: data.taskId, // Prevents duplicates
    actions: [
      { action: 'complete', title: 'Mark Complete' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  if (event.action === 'complete') {
    // Call API to mark task complete
  }
  event.notification.close();
});
```

**Server-side Scheduling (Supabase Edge Function):**
```typescript
// /functions/check_maintenance_notifications.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_KEY'));

  const { data: dueTasks } = await supabase
    .from('maintenance_tasks')
    .select('*, users(id, push_subscription_endpoint)')
    .where('next_due_date', 'lte', new Date())
    .is('is_notified', null);

  for (const task of dueTasks) {
    await sendPushNotification(task.users.push_subscription_endpoint, {
      title: task.title,
      body: `${task.tank.name} • Due at ${task.reminder_time}`,
      taskId: task.id
    });

    await supabase
      .from('maintenance_tasks')
      .update({ is_notified: true })
      .eq('id', task.id);
  }

  return new Response(JSON.stringify({ ok: true }));
});
```

### Row-Level Security (RLS) Policies

```sql
-- Users can only see their own tasks
CREATE POLICY "Users see own maintenance tasks" ON maintenance_tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tasks" ON maintenance_tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks" ON maintenance_tasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks" ON maintenance_tasks
  FOR DELETE USING (user_id = auth.uid());

-- Similar policies for maintenance_logs
```

### Frontend State Management

**Recommended:**
- React Query (TanStack Query) for server state + caching
- Zustand or Jotai for local UI state (active filters, view mode)
- SWR as alternative to React Query

**Key Queries:**
```typescript
// List upcoming tasks
const { data: tasks } = useQuery(
  ['tasks', { tankId, status: 'upcoming' }],
  ({ queryKey }) => fetchTasks(queryKey[1]),
  { refetchInterval: 60000 } // Refetch every minute
);

// Task completion mutation
const completeTaskMutation = useMutation(
  (taskId: string) => api.post(`/maintenance/tasks/${taskId}/complete`),
  { onSuccess: () => queryClient.invalidateQueries('tasks') }
);
```

### Notifications Infrastructure

**Provider:** Firebase Cloud Messaging (FCM) or native Web Push API
- FCM recommended for broader browser/OS support
- Requires service worker registration on client
- Backend subscribes devices, backend sends payloads

**Delivery SLA:**
- Target: > 95% delivery within 5 minutes
- Fallback: Email notification sent if push not acknowledged within 30 mins (P1 feature)

---

## Design Mockup Notes (Placeholder)

**Screens to Design:**
1. Task creation modal — quick-add (under 2 min) or advanced
2. Task overview — list/card view with filters
3. Maintenance history — log viewer with notes and trends
4. AI suggestions — modal with suggestion cards and rationale
5. Notification permission prompt — value prop explanation
6. Settings — notification preferences, reminder times, quiet hours

---

## Acceptance Testing Checklist

- [ ] Create a daily, weekly, biweekly, and monthly recurring task — all show correct next_due_date
- [ ] Create a one-time task — appears in list, completion moves to archive
- [ ] Receive push notification at configured reminder time
- [ ] Disable notifications — notification prompt appears on next app load
- [ ] Enable notifications — no further prompts, notifications deliver on schedule
- [ ] Mark task complete — next_due_date auto-advances, logged in maintenance_logs
- [ ] Accept AI suggestions — 3+ tasks auto-created with correct frequency
- [ ] Filter tasks by tank — only that tank's tasks shown
- [ ] Filter tasks by overdue — only overdue tasks shown
- [ ] Edit task frequency — next_due_date recalculates
- [ ] Delete task — removed from active list, searchable in history
- [ ] Overdue task highlighted — visual distinction in red/orange
- [ ] Multi-tank overview — all tanks' tasks shown with tank labels
- [ ] Service worker installed — check via DevTools Application tab
- [ ] PWA installable — "Install" prompt appears on supported browsers

---

## Definition of Done (per User Story)

### US-19: Create Maintenance Tasks
- [ ] Task creation form supports all field types (title, type, frequency, reminder time)
- [ ] Recurring tasks show correct next_due_date based on frequency
- [ ] One-time tasks display without recurrence indicator
- [ ] Validation prevents future-only tasks (must be today or later)
- [ ] Task appears in overview within 2 seconds of creation

### US-20: AI-Suggested Schedules
- [ ] Tank setup completion triggers AI suggestion fetch
- [ ] Suggestions include rationale text
- [ ] User can accept all, some, or none of suggestions
- [ ] Accepted suggestions auto-create tasks with correct frequencies

### US-21: Push Notifications
- [ ] Push notifications deliver at configured reminder time
- [ ] Notification content includes task name and tank name
- [ ] Permission prompt shown if not yet granted, with clear value prop
- [ ] Works on Chrome, Edge, Firefox, Safari (with fallback for iOS)

### US-22: Task Completion Logging
- [ ] Marking complete logs entry with timestamp, user_id, tank_id, notes
- [ ] Recurring tasks auto-advance next_due_date
- [ ] Completion removes notification from center
- [ ] Logs queryable in maintenance history

### US-extra1: Task Overview
- [ ] All tasks from all tanks shown in single list
- [ ] Sorted by due date (earliest first)
- [ ] Overdue tasks highlighted with visual urgency
- [ ] Quick-complete checkbox available per task
- [ ] No tasks state shows helpful prompt

### US-extra2: AI Schedule Adjustment
- [ ] AI re-evaluates when livestock added
- [ ] Adjustment suggestions sent as chat message or in-app notification
- [ ] User can accept, dismiss, or ignore suggestions
- [ ] Accepted adjustments update schedule immediately

---

## Rollout Plan

### Beta (Internal)
- QA team tests on Chrome, Edge, Firefox, Safari (desktop and mobile)
- Test notification delivery via real devices
- Validate edge cases (DST, time zones, snoozed tasks)
- Gather feedback on task creation UX

### Soft Launch (10% of users)
- Monitor push notification delivery rate
- Track early adoption metrics (task creation, acceptance rate)
- A/B test task overview layout (list vs. cards)
- Collect user feedback via in-app survey

### General Availability
- Rollout to all users
- Announce feature in-app and via email
- Include tutorial/onboarding for PWA notification setup
- Monitor success metrics and iterate

---

## Appendices

### A. Example Maintenance Schedules by Tank Type

#### Planted Freshwater (40-gallon)
- Weekly 25% water change
- Biweekly filter media rinse
- Monthly comprehensive water test
- Daily feeding (auto-logged as reminder)

#### Nano Reef (20-gallon)
- Weekly 20% water change
- Weekly protein skimmer cleaning
- Biweekly reef additive dose (calcium, alkalinity)
- Daily visual parameter check (sniff test, color observation)

#### Cichlid (75-gallon)
- Biweekly 30% water change (heavy bioload)
- Weekly filter cleaning
- Monthly gravel vacuum
- Biweekly live food culture refresh

### B. Frequency Reference Table
| Frequency | Interval | Next Due Calculation |
|-----------|----------|----------------------|
| daily | 1 day | last_completed + 1 day |
| every_2_days | 2 days | last_completed + 2 days |
| every_3_days | 3 days | last_completed + 3 days |
| every_7_days | 7 days | last_completed + 7 days |
| weekly | 7 days | last_completed + 7 days |
| biweekly | 14 days | last_completed + 14 days |
| monthly | ~30 days | same day next month (or last day if month shorter) |

### C. Related Features & Dependencies
- **R-001 (AI Chat Engine)** — powers maintenance schedule suggestions
- **R-002 (Tank Profile Management)** — tasks scoped to tanks
- **R-007 (Livestock Management)** — bioload factors into AI suggestions
- **R-011 (PWA Service Worker)** — enables push notifications
- **R-003 (Auth & RLS)** — secures tasks per user

---

**Document Version:** 1.0
**Last Updated:** 2026-02-07
**Author:** Product Team
**Status:** Ready for Development
