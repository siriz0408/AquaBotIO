# AI Chat Engine Specification (R-001)
## Aquatic AI: AI-Native Aquarium Management Platform

---

## Problem Statement

Aquarium hobbyists currently rely on fragmented forums, outdated apps, and guesswork for tank management. There is no intelligent assistant that knows their specific tank setup — parameters, livestock, equipment, history — and can provide personalized, contextual advice. The AI Chat Engine solves this by being the primary interface through which users interact with the entire Aquatic AI platform.

---

## Goals

- **G1**: Provide personalized, tank-context-aware answers to any aquarium question within 3 seconds average response time
- **G2**: Enable conversational actions — users can manage their tank (add livestock, schedule maintenance, log parameters) through natural language instead of navigating menus
- **G3**: Build persistent memory per tank per user so advice improves over time as the AI accumulates knowledge about each specific setup
- **G4**: Serve all skill levels — explain simply for beginners, discuss nuanced topics (trace elements, coral fragging, breeding) for advanced keepers
- **G5**: Achieve 5+ average AI messages per active user per day within 30 days of launch

---

## Non-Goals

- **NG1**: Real-time voice interaction — text-only in v1; voice is a future consideration
- **NG2**: Multi-user collaboration on a single tank — single-user context only
- **NG3**: Autonomous actions without user confirmation — AI suggests actions, user confirms
- **NG4**: Integration with external IoT devices — no hardware data feeds in v1
- **NG5**: Fine-tuned or custom-trained models — uses Anthropic Claude Sonnet 4.5 via API with prompt engineering

---

## User Stories

### Beginner Hobbyist

- **US-1**: As a beginner, I want to ask the AI any question about my aquarium and get an answer that considers my specific tank's parameters, livestock, and history, so that I get personalized advice rather than generic information.

- **US-2**: As a beginner, I want the AI to explain things in simple terms and walk me through processes step-by-step, so that I can learn without feeling overwhelmed.

- **US-3**: As a beginner, I want to tell the AI "add a clownfish to my tank" and have it check compatibility and take that action, so that I can manage my tank through conversation.

### Intermediate Hobbyist (The Optimizer)

- **US-4**: As an intermediate keeper, I want the AI to proactively alert me when it detects concerning trends in my tank data (e.g., rising nitrates, pH drift), so that I can address issues before they become emergencies.

- **US-5**: As an intermediate keeper, I want the AI to remember our previous conversations and my tank's complete history, so that its advice gets more tailored over time.

### Advanced Keeper (The Expert)

- **US-6**: As an advanced keeper, I want the AI to discuss complex topics like trace element ratios, coral fragging techniques, and breeding triggers with depth and nuance, so that it's useful beyond basic care advice.

- **US-7**: As a multi-tank keeper, I want to switch tank context in chat and have the AI immediately load the relevant tank data, so that I get accurate advice for the right tank.

### All Users

- **US-8**: As a user, I want to tell the AI to "schedule a water change for Saturday" and have it create a maintenance task, so that I can manage tasks conversationally.

- **US-9**: As a user, I want AI responses rendered as rich markdown with formatting (bold, lists, tables), so that complex information is easy to read.

---

## Requirements

### Must-Have (P0)

#### R-001.1: Conversational AI Interface Powered by Anthropic Claude Sonnet 4.5

**Description**: The core chat interface accepts user messages and returns contextual responses from Anthropic Claude Sonnet 4.5 model with appropriate latency guarantees and formatting support.

**Acceptance Criteria**:
- Given a user types a question and sends it, When the AI processes it, Then a contextual response is returned within 3 seconds average.
- Given response content, When rendered in the chat UI, Then markdown formatting (bold, lists, code blocks, tables) renders correctly.

**Details**:
- Real-time processing of user input
- Consistent sub-3-second response times under typical load
- Support for markdown output including bold, italics, lists, tables, and code blocks
- Graceful error handling with user-friendly messages for timeouts or API failures

---

#### R-001.2: Persistent Conversation History Per Tank Per User

**Description**: All conversations are preserved per tank per user, allowing the AI to maintain context across sessions and reference prior interactions.

**Acceptance Criteria**:
- Given a user has had previous conversations about Tank A, When they return to Tank A's chat, Then previous conversation history is visible and the AI can reference prior context.
- Given a conversation exceeds a configurable length threshold, When the system processes it, Then older messages are summarized and key facts are persisted so context is maintained without exceeding token limits.

**Details**:
- Conversation history stored in `ai_conversations` table with JSONB message array
- Automatic context summarization when conversation length approaches token limits
- Per-tank isolation ensures users don't see unrelated tank conversations
- Conversation metadata includes timestamps, message count, and usage metrics

---

#### R-001.3: Full Tank Context Injection

**Description**: The AI has programmatic access to all relevant tank data and automatically injects this context into every request to enable personalized responses.

**Acceptance Criteria**:
- The AI has access to: current water parameters, livestock list, equipment catalog, maintenance history, and tank profile data.
- Given a user asks "is my pH okay?", When the AI responds, Then it references the user's actual current pH value and evaluates it against the specific species in their tank.

**Details**:
- Tank context includes:
  - Tank profile (volume, type, setup date, substrate, lighting)
  - Current water parameters (pH, temperature, salinity, nitrate, phosphate, etc.)
  - Livestock inventory with species, quantity, and dates added
  - Equipment catalog (filters, heaters, chillers, reactors)
  - Maintenance history (water changes, cleanings, treatments)
  - User's skill level designation
- Context injected via system prompt at query time
- Context data fetched from authoritative sources (Tank Profile, Water Parameters, Livestock Management modules)
- Fallback behavior if context data unavailable (graceful degradation with disclosure)

---

#### R-001.4: Action Execution Via Chat

**Description**: Users can perform platform actions through natural language conversation. The AI interprets intent, validates actions, and executes them with user confirmation.

**Acceptance Criteria**:
- AI can execute: add/remove livestock, schedule/complete maintenance tasks, log water parameters.
- Given a user says "schedule a water change for Saturday", When the AI processes it, Then a maintenance task is created for Saturday and the user receives confirmation.
- Given a user says "add a clownfish to my tank", When the AI processes it, Then it runs a compatibility check, warns of any issues, and adds the species to the livestock list upon confirmation.

**Details**:
- Supported actions:
  - **Livestock Management**: Add species, remove species, quantity adjustments
  - **Maintenance Tasks**: Create, complete, reschedule maintenance jobs
  - **Water Parameters**: Log new parameter values with timestamp
- Action workflow:
  1. User sends natural language request
  2. AI interprets intent and identifies required action
  3. AI validates action (e.g., compatibility check, data completeness)
  4. AI presents results and asks for confirmation via interactive UI element
  5. User confirms or cancels
  6. Action executed and confirmation message shown
- All actions logged in `ai_usage` table for tracking and auditing
- Action execution failures result in user-friendly error messages with guidance

---

#### R-001.5: Adaptive Skill-Level Responses

**Description**: The AI tailors response complexity and depth to match the user's skill level, ensuring relevance across beginner to advanced keepers.

**Acceptance Criteria**:
- Given a beginner user asks about water changes, When the AI responds, Then it uses simple language and step-by-step instructions.
- Given an advanced user asks about trace element dosing, When the AI responds, Then it provides detailed, nuanced technical information.

**Details**:
- Skill levels: Beginner, Intermediate, Advanced
- User skill level stored in user profile and passed to AI via context
- Beginner responses include:
  - Simple, non-technical language
  - Step-by-step process breakdowns
  - Safety warnings and common mistakes
  - References to learning materials
- Advanced responses include:
  - Technical terminology and ratios
  - Discussion of edge cases and trade-offs
  - References to scientific literature where applicable
  - Advanced optimization techniques
- AI instructed to ask clarifying questions if user skill level uncertain for topic

---

#### R-001.6: AI Usage Tracking

**Description**: Platform tracks all AI interactions to enforce usage limits, measure engagement, and support billing/tier management.

**Acceptance Criteria**:
- Track message count, token consumption, and feature type (chat/diagnosis/report) per user per day.
- Given a Starter-tier user reaches their daily message limit, When they send another message, Then they see a clear upgrade prompt.

**Details**:
- Tracked metrics:
  - Message count (user and AI messages separately)
  - Token consumption (input and output tokens)
  - Feature type (conversation, action execution, proactive alert, etc.)
  - Response latency
  - Action execution count and success rate
- Storage: `ai_usage` table with daily aggregation
- Daily limits enforced per tier:
  - Free: 10 messages/day
  - Starter: 100 messages/day
  - Plus: 200 messages/day
  - Pro: Unlimited
- Limit enforcement: Hard cutoff with upgrade prompt (configurable)
- Usage metrics accessible in user dashboard

---

### Nice-to-Have (P1)

#### R-001.7: Proactive AI Alerts

**Description**: AI monitors parameter trends and surfaces alerts when concerning patterns are detected without being explicitly queried.

**Details**:
- Configurable alert thresholds for key parameters (pH, nitrate, ammonia, temperature, etc.)
- Trend analysis: detection of gradual changes over configurable time windows
- Alert presentation: Non-intrusive badges or notifications in chat
- Alert types:
  - Parameter out of range for current livestock
  - Concerning trend (e.g., pH declining over 7 days)
  - Maintenance overdue (e.g., filter cleaning needed)
- User can configure alert sensitivity and opt out of specific alerts

---

#### R-001.8: Suggested Prompts

**Description**: Contextual prompt suggestions help users get value quickly by showing relevant conversation starters based on their tank state.

**Details**:
- Suggestions shown in chat UI when chat is empty or between exchanges
- Suggestions generated based on:
  - Current tank state (high nitrates, pH trending, upcoming maintenance)
  - User's previous conversation topics
  - User's skill level
- Examples:
  - "Your nitrates are 60 ppm — ask me how to bring them down"
  - "You haven't done a water change in 10 days — schedule one?"
  - "Your water is very warm — should we discuss chiller options?"
- Max 3-5 suggestions shown; user can dismiss

---

#### R-001.9: Chat Export

**Description**: Users can export conversation history for personal records or sharing with other hobbyists.

**Details**:
- Export formats: PDF, plain text, Markdown
- Export includes timestamps, tank context snapshot, and all messages
- PDF includes tank parameters summary at export time
- One-click export button in chat UI

---

### Future Considerations (P2)

#### R-001.10: Voice Input/Output

**Description**: Support voice-based conversation for hands-free interaction during tank maintenance.

**Details**:
- Voice input transcription using a dedicated speech-to-text service (e.g., Deepgram or AssemblyAI)
- Voice output text-to-speech synthesis
- Offline transcription support where available
- Push-to-talk or always-listening mode configurable

---

#### R-001.11: Multi-Model Routing

**Description**: Route queries to appropriate model based on complexity to optimize cost and latency.

**Details**:
- Simple queries (parameter lookup, basic care) → Claude Haiku 4.5
- Complex queries (troubleshooting, advanced topics) → Claude Sonnet 4.5
- Routing logic: Token count, keyword analysis, user skill level
- Target: 40% cost reduction through selective model routing

---

#### R-001.12: Plugin/Tool System

**Description**: Extend AI capabilities by allowing it to invoke external tools and services during response generation.

**Details**:
- Tool types: Calculators, dosing guides, parameter converters, web search
- Example tools:
  - Nitrate reduction calculator
  - Coral fragging guide with species-specific steps
  - Salinity/density converter
  - Species compatibility matrix lookup
- Tool integration via Anthropic tool use

---

## Success Metrics

### Leading Indicators (Days to Weeks)

| Metric | Target | Definition |
|--------|--------|-----------|
| AI chat engagement | 5+ messages/user/day | Average daily conversation message count from active users |
| Response latency | < 3 seconds | P95 response time from message send to first token |
| Action execution success | > 95% | % of user-initiated AI actions that complete without error |
| Token efficiency | < 4,000 tokens/exchange | Average total tokens (input + output) per user message + AI response |

---

### Lagging Indicators (Weeks to Months)

| Metric | Target | Definition |
|--------|--------|-----------|
| AI satisfaction score | > 4.0/5.0 | Average rating on "Was this response helpful?" prompt |
| Retention impact | 2x rate | Retention rate of 3+ weekly AI users vs. non-AI users |
| Support deflection | > 70% | % of questions resolved by AI without forum/support escalation |
| AI cost per user | < $2/month | Average API and infrastructure cost per monthly active user |

---

## Decisions (Resolved)

- ✅ Response length: Default to concise (2-3 sentences), expand when user asks follow-up or topic requires detail. System prompt instructs: "Be concise but thorough. Default to 2-3 sentences. Expand only when the topic demands it."
- ✅ Streaming vs non-streaming: Non-streaming for v1 MVP. Streaming added as P1 fast-follow.
- ✅ Conversation context window: Rolling context with summarization at 8K tokens (detailed in Spec 12 Section 3.5).
- ✅ Harmful advice safeguards: System prompt includes explicit guardrails against dangerous recommendations. AI must recommend professional help for disease diagnosis before treatment suggestions. Photo diagnosis always includes confidence score and "consult a vet/expert" disclaimer.
- ✅ Model routing: Claude Haiku 4.5 for simple queries, greetings, and parameter lookups (~30-40%). Claude Sonnet 4.5 for complex analysis, diagnosis, and multi-step reasoning (~60-70%). Routing logic in Spec 12 Section 3.6.

---

## Timeline Considerations

### Phase 1 (MVP) — Blocker

**Core deliverables**:
- Conversational interface with Anthropic Claude Sonnet 4.5 (R-001.1)
- Tank context injection (R-001.3)
- Conversation history persistence (R-001.2)
- Basic action execution (R-001.4) — livestock and maintenance only
- Usage tracking (R-001.6)
- Skill-level adaptation (R-001.5)

**Dependencies**:
- Tank Profile Management (R-002) — must provide tank context data
- Water Parameter Logging (R-003) — must provide current parameter data
- Livestock Management (R-007) — must provide livestock inventory data
- Maintenance Task Management (R-008) — must support task creation/updates

**Critical path blocker**: AI context management strategy must be resolved before development begins (see Open Questions above)

---

## Technical Notes

### Backend Architecture

**AI Engine**:
- **Model**: Anthropic Claude Sonnet 4.5 API
- **System Prompt**: Dynamically constructed with tank context, user skill level, and available actions
- **Orchestration**: Supabase Edge Functions (Deno runtime) for API calls and action routing
- **Error Handling**: Exponential backoff for API timeouts; fallback generic responses

**Storage**:
- **Conversation History**: `ai_conversations` table
  - Columns: `id`, `user_id`, `tank_id`, `messages` (JSONB array), `summary` (TEXT), `created_at`, `updated_at`
  - Indexes: `(user_id, tank_id, updated_at DESC)` for efficient retrieval
- **Usage Tracking**: `ai_usage` table
  - Columns: `id`, `user_id`, `date`, `message_count`, `input_tokens`, `output_tokens`, `action_count`, `created_at`
  - Indexes: `(user_id, date DESC)` for daily aggregation

**Authentication**:
- All queries scoped to authenticated user via Supabase RLS policies
- Conversation access verified against user's tank ownership
- API key rotation and secret management via Supabase vault

### Frontend Integration

**Chat UI Components**:
- Message list with markdown rendering
- Text input with send button
- Typing indicator during AI processing
- Error boundaries with retry prompts
- Usage indicator showing remaining daily messages
- Tank selector dropdown for multi-tank users

**State Management**:
- React hooks for local conversation state
- Server-side persistence via Supabase real-time subscriptions
- Optimistic updates for actions (confirm on server response)

### API Response Format

**Chat Response**:
```json
{
  "id": "msg_...",
  "role": "assistant",
  "content": "Markdown formatted response...",
  "actions": [
    {
      "id": "action_...",
      "type": "add_livestock|schedule_maintenance|log_parameter",
      "description": "Human-readable action description",
      "confirmation_required": true,
      "payload": { ... }
    }
  ],
  "usage": {
    "input_tokens": 1200,
    "output_tokens": 450
  }
}
```

### Performance & Scalability

**Latency Targets**:
- API call to Anthropic: < 2.5 seconds (P95)
- Context data retrieval: < 200ms
- Response rendering: < 300ms
- Total: < 3 seconds (P95)

**Scaling Approach**:
- Conversation history pagination: Load most recent 50 messages; lazy-load older messages on demand
- Token limit management: Automatic summarization when conversation > 8,000 tokens
- Caching: Tank context cached in edge function memory; refresh every 5 minutes or on tank change
- Rate limiting: Per-user rate limit of 60 requests/minute with exponential backoff

---

**Document Version**: 1.0
**Last Updated**: 2026-02-07
**Owner**: Product Team, Aquatic AI
**Status**: Approved for Phase 1 Development
