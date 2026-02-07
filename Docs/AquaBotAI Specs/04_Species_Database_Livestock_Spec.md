# Species Database & Livestock Management — Feature Specification
**Aquatic AI | R-006, R-007 | P0 — Must-Have**

---

## 1. Problem Statement

Stocking mistakes are among the most common and costly errors in aquarium keeping. Hobbyists frequently:
- Add incompatible species that exhibit aggression or predatory behavior
- Overstock tanks beyond biological capacity, causing ammonia spikes and disease
- Choose fish unsuited to their water parameters (pH, temperature, hardness)
- Lack visibility into whether a new species will thrive in their specific tank conditions

These mistakes result in fish loss, wasted money, frustration, and tank crashes. Current mobile aquarium apps offer basic species lookup (static care charts, photos) but lack intelligence: they provide no real-time compatibility checking against a user's actual tank, no personalized stocking suggestions based on tank data, and no warnings when a user is about to add an incompatible species.

**Aquatic AI solves this by combining:**
1. A comprehensive, beautiful species database (500+ freshwater and saltwater species)
2. AI-powered compatibility analysis that evaluates a new species against the user's actual tank inhabitants, water parameters, and tank size
3. Real-time livestock tracking so the AI always knows what's in each tank
4. Personalized, data-driven stocking recommendations

---

## 2. Goals

- **Comprehensive Species Data**: Provide a searchable, well-organized database of 500+ freshwater and saltwater species with complete care information (photos, care levels, temperature ranges, compatibility data, etc.)
- **Intelligent Compatibility Analysis**: Leverage the AI engine to analyze compatibility between a proposed species and existing tank inhabitants, water parameters, and tank dimensions in real time
- **Accurate Livestock Tracking**: Enable users to maintain an up-to-date list of what species and quantities are in each tank, so the AI always has current data
- **Personalized Recommendations**: Offer AI-generated stocking suggestions tailored to each user's specific tank parameters, existing livestock, and available space
- **Error Prevention**: Reduce stocking-related fish loss by 50%+ through proactive warnings and recommendations

---

## 3. Non-Goals

- **NG1: User-Contributed Species Data** — In v1, the species database is curated and maintained by the Aquatic AI team only. User corrections/suggestions are P2.
- **NG2: Breeding Pair Matching & Genetics Tracking** — Breeding intelligence and lineage tracking are future considerations (P2).
- **NG3: Species Price Tracking** — Regional availability, price comparisons, and vendor listings are out of scope.
- **NG4: Aquatic Plant Database** — Plant species care, lighting/CO2 requirements are a P2 extension.
- **NG5: Advanced Invertebrate Care** — Detailed shrimp morphology, snail lineage, coral spectrum requirements are P2 enhancements.

---

## 4. User Stories

### Core Stories (P0 — Must-Have)

**US-15: Species Database Browser**
> As a hobbyist, I want to browse a comprehensive species database with beautiful species cards showing photos, care requirements, and compatibility info, so I can research fish before buying.
- Acceptance Criteria:
  - User can navigate to the Species Database section
  - Each species has a visually appealing card showing: photo, common name, care level, minimum tank size, and a quick compatibility summary
  - User can tap a card to view full details

**US-16: Compatibility Checking**
> As a hobbyist, I want the AI to tell me whether a specific species is compatible with my current tank inhabitants, parameters, and tank size, so I avoid stocking mistakes.
- Acceptance Criteria:
  - When adding a species from the database to a tank, the AI automatically analyzes compatibility
  - AI provides specific warnings if: (a) species is incompatible with existing fish, (b) tank is too small for the species, (c) water parameters don't match species needs
  - User sees warnings before confirming the addition

**US-17: Livestock Tracking**
> As a hobbyist, I want to add species from the database to my tank's livestock list, so the AI knows what's in my tank and factors it into recommendations.
- Acceptance Criteria:
  - User can search the species database and select a species to add to a specific tank
  - User specifies quantity, optional nickname, and notes
  - Species appears immediately in the livestock list for that tank
  - AI receives updated tank context for future recommendations

**US-18: Stocking Recommendations**
> As a hobbyist, I want the AI to suggest species that would work well in my specific tank (based on parameters, existing livestock, and tank size), so I get personalized stocking recommendations.
- Acceptance Criteria:
  - User can ask the AI: "What fish should I add?" or "Recommend a species for my 40-gallon tank"
  - AI provides 3–5 specific species recommendations with reasoning
  - Recommendations are tailored to the user's tank's actual parameters, livestock, and available capacity
  - User can tap any recommendation to view the full species card or add it directly

### Additional Stories (P0/P1)

**US-19: Advanced Search & Filtering**
> As a hobbyist, I want to search and filter species by type, care level, tank size, and temperament, so I can narrow down options quickly.
- Acceptance Criteria:
  - Full-text search by common name and scientific name
  - Filters for: aquatic type (freshwater/saltwater), care level (beginner/intermediate/advanced), minimum tank size, temperament (peaceful/semi-aggressive/aggressive)
  - Filters work in combination (e.g., "freshwater + beginner + 20 gallons or less")

**US-20: Detailed Livestock Tracking**
> As a hobbyist, I want to track quantity, date added, nicknames, and notes for each livestock entry, so my livestock list reflects my actual tank.
- Acceptance Criteria:
  - Livestock entries display: species photo/name, quantity, date added, nickname, and user notes
  - User can edit quantity or notes at any time
  - Historical record is maintained (e.g., for AI context)

**US-21: Livestock Removal & History**
> As a hobbyist, I want to remove a species from my livestock list (with reason: died, rehomed, sold), so the AI's understanding stays current.
- Acceptance Criteria:
  - User can remove a species entry with a reason
  - Removed entries are archived (not deleted) for tank history/AI context
  - AI can reference removed entries when discussing tank history

---

## 5. Functional Requirements

### 5.1 R-006: Species Database

#### R-006.1: Comprehensive Database
**Requirement**: Maintain a curated database of 500+ freshwater and saltwater aquarium species at launch. Each species entry includes:
- **Basic Identifiers**: Common name, scientific name, species photo/image
- **Care Requirements**: Care level (Beginner/Intermediate/Advanced), minimum tank size (in gallons), temperature range (°F), pH range, water hardness (dGH) range, dietary notes
- **Behavior & Compatibility**: Temperament classification (Peaceful/Semi-Aggressive/Aggressive), group behavior (solitary/pair/group), compatibility notes (e.g., "Aggressive toward other males", "Safe with community fish")
- **Husbandry Info**: Origin/habitat, description, maximum adult size, lifespan, breeding difficulty, common diseases, dietary preferences (carnivore/omnivore/herbivore)

**Acceptance Criteria**:
- When a user searches "clownfish", they see relevant species cards with complete care information displayed
- Every species card in the database contains at minimum: photo, common name, scientific name, care level, minimum tank size, temperature range, pH range, temperament, and compatibility notes
- Database is searchable by common name and scientific name with results returned in <500ms
- Species database is deployed and seeded before MVP launch

#### R-006.2: Search and Filter
**Requirement**: Provide robust search and filtering functionality to help users find species matching their tank criteria.

**Search Capabilities**:
- Full-text search by common name (e.g., "neon tetra", "clownfish")
- Full-text search by scientific name (e.g., "Paracheirodon innesi")
- Search results ranked by relevance and popularity

**Filter Options**:
- **Type**: Freshwater / Saltwater / Brackish
- **Care Level**: Beginner / Intermediate / Advanced
- **Minimum Tank Size**: ≤5 gal, 6–10 gal, 11–20 gal, 21–40 gal, 41–75 gal, 76+ gal
- **Temperament**: Peaceful / Semi-Aggressive / Aggressive
- **Dietary Type**: Carnivore / Omnivore / Herbivore (optional, for refinement)

**Acceptance Criteria**:
- Filters work independently and in combination
- Given a user applies filters "Freshwater" + "Beginner" + "20 gallons or less", the results show only species matching all three criteria
- Filter application updates results in <300ms
- Clear visual indication of active filters and option to reset

#### R-006.3: Species Detail Cards & Views
**Requirement**: Display species information in both card (summary) and detail (full-page) views.

**Card View** (used in browse/search results):
- Species photo (thumbnail, 150x150px or responsive equivalent)
- Common name and scientific name
- Care level badge (color-coded: green/beginner, yellow/intermediate, red/advanced)
- Minimum tank size
- Temperature range
- Temperament label
- Quick compatibility indicator (when user has active livestock)

**Detail View** (accessed via card tap):
- Large species photo
- All basic identifiers (common, scientific names)
- Full care parameters (temperature, pH, tank size, water hardness, etc.)
- Behavioral notes and compatibility details
- Dietary and habitat information
- Breeding difficulty and lifespan
- Link/button to "Add to Tank" (if user has multiple tanks)
- "Ask AI about this species" prompt/button to trigger AI conversation

**Acceptance Criteria**:
- Species cards are responsive and display correctly on mobile (375px) and tablet (768px+)
- Detail view loads in <1s for a typical species entry
- All required fields are present and legible
- Photo placeholder exists for species without images

#### R-006.4: AI-Enhanced Species Insights
**Requirement**: Integrate the AI engine to provide deep, contextual knowledge about any species beyond the static database.

**Capabilities**:
- When a user asks the AI "Tell me about neon tetras", the AI response draws on both database data (care parameters) and broader knowledge (schooling behavior, common tank mate conflicts, breeding challenges, disease susceptibility, etc.)
- AI can answer follow-up questions: "Are they aggressive?", "Can I keep them with shrimp?", "How often do they eat?", etc.
- AI references the species database when relevant and can compare species on request

**Acceptance Criteria**:
- User can invoke AI insights from the species detail page
- AI response is contextual, informative, and references actual species data when applicable
- Conversation flows naturally; user can ask follow-ups
- Response time is <3s for typical AI queries

---

### 5.2 R-007: Livestock Management

#### R-007.1: Add Species to Tank
**Requirement**: Enable users to add species to their tank's livestock list, either from the database or as custom entries.

**Add Flow**:
1. User navigates to Tank > Livestock section
2. User taps "+ Add Species"
3. Two options presented:
   - **From Database**: User searches/filters the species database, selects a species
   - **Custom Entry**: User enters species name manually (for unlisted species)
4. User enters:
   - Species (selected from database or custom name)
   - Quantity (number of individuals)
   - Date Added (default: today, user can set custom date)
   - Nickname (optional, e.g., "Neon Tetras - School 1")
   - Notes (optional, e.g., "Wild-caught, very stressed initially")
5. User reviews and confirms; species is added to livestock list

**Data Stored**:
- livestock table entry with: tank_id, species_id (or custom_species_name), quantity, nickname, date_added, notes

**Acceptance Criteria**:
- Adding a database species pre-fills all care parameters automatically
- Custom entries allow manual species names but do not include pre-filled database data
- Species appears immediately in the livestock list after addition
- User receives confirmation toast/notification

#### R-007.2: AI Compatibility Checking
**Requirement**: Automatically analyze compatibility when a user adds a species, providing warnings and guidance based on tank conditions and existing livestock.

**Compatibility Analysis**:
When a user adds a species, the system:
1. Queries the tank's current state: existing livestock, water parameters (temp, pH, etc.), tank dimensions
2. Invokes the AI engine to assess:
   - **Species-to-Species Compatibility**: Will the new species conflict with existing tank mates? (e.g., "This species is aggressive toward tetras, and you have 10 tetras")
   - **Parameter Compatibility**: Do the tank's water parameters match the species' requirements? (e.g., "Tank is pH 6.2 but species needs pH 7.0–8.0")
   - **Space Adequacy**: Is the tank large enough for the species? (e.g., "Your 20-gallon tank is below this species' 40-gallon minimum requirement")
   - **Bioload**: Is the tank's current bioload compatible with adding this species? (calculated based on existing livestock)
3. AI generates a compatibility report with:
   - **Status**: "Compatible" / "Caution" / "Not Recommended"
   - **Specific Warnings**: Bulleted list of any concerns
   - **Suggestions**: If conflicts exist, suggest alternative species or tank adjustments

**User Experience**:
- Compatibility check runs automatically after species selection
- Report displayed in a modal/sheet before user confirms addition
- If status is "Compatible", user can proceed immediately
- If status is "Caution" or "Not Recommended", user can still proceed (with checkbox: "I understand the risks") or cancel
- Report is saved and accessible in the livestock entry's history

**Acceptance Criteria**:
- Compatibility check completes in <2s
- Report includes specific, actionable feedback (not generic warnings)
- User cannot accidentally add without seeing the report
- User can bypass warnings if desired (logged for later analysis)

#### R-007.3: Edit/Remove Livestock
**Requirement**: Allow users to update livestock entries and remove species with versioning.

**Edit Capabilities**:
- Update quantity (e.g., "I added 3 more tetras, now have 13")
- Update notes (e.g., "One fish died, now investigating")
- Update date added (if user discovers they have incorrect info)
- Update nickname

**Remove Capabilities**:
- User taps "Remove" on a livestock entry
- User selects reason: "Died" / "Rehomed" / "Sold" / "Other"
- Optional: User enters removal date and notes (e.g., "Disease outbreak")
- Entry is moved to tank's "Removed Livestock" history (not deleted)

**Data Handling**:
- Removed entries retain tank_id, species_id, and are marked with date_removed and removal_reason
- Removed livestock is archived but accessible in tank history for AI context
- Current livestock list shows only active entries

**Acceptance Criteria**:
- Updates are reflected immediately in the livestock list
- Removed entries do not appear in the active livestock count but are preserved in history
- User receives confirmation when removing a species
- AI can reference removed livestock when discussing tank history

#### R-007.4: Livestock List View
**Requirement**: Display a clear, organized view of all current inhabitants per tank.

**List Layout**:
- Tank name header with total species count and total fish count
- Species entries displayed as cards or rows, each showing:
  - Species photo (50x50px, left-aligned)
  - Species name (common + scientific if from database)
  - Quantity (e.g., "×5" or "5 individuals")
  - Date added (e.g., "Added Feb 1, 2026")
  - Nickname (if set)
  - Quick actions: Edit, Remove, View Details
- Scrollable list for tanks with many species
- Empty state: "No livestock added yet. Add your first species!" with CTA button

**Visual Indicators**:
- Care level badge for each species (color-coded)
- Compatibility status indicator (green checkmark = compatible, yellow caution = conflicts exist)
- If tank has parameter issues or overstocking risk, banner at top alerts user

**Acceptance Criteria**:
- List is responsive and scrollable on mobile
- Each entry displays required info without truncation (or with ellipsis + expand option)
- Tapping a species card shows more details or options
- Total counts (species, individuals) are accurate
- Empty state is user-friendly and encourages first entry

#### R-007.5: AI Stocking Recommendations
**Requirement**: Provide AI-generated, personalized species recommendations based on tank data and existing livestock.

**Recommendation Trigger**:
- User asks: "What fish should I add?" or "Recommend a species for my 40-gallon tank"
- User taps "Get Recommendations" button in Livestock section
- AI Chat prompt: "Suggest compatible species I could add to my [Tank Name]"

**AI Analysis**:
The AI considers:
1. Tank dimensions and water parameters (temperature, pH, hardness)
2. Existing livestock and their compatibility profiles
3. Available bioload capacity (based on tank volume and current inhabitants)
4. User's care level (beginner/intermediate/advanced) as inferred from existing choices
5. Stocking goals (if user has set any, e.g., "Community-focused", "Nano tank specialist")

**Recommendation Output**:
- 3–5 specific species recommendations
- For each recommendation:
  - Common and scientific name
  - Why this species fits the tank (specific reasoning, e.g., "Peaceful schooling fish that pairs well with your corydoras and tetras")
  - Care requirements summary (temp, pH, tank size compatibility)
  - Link to full species card or direct "Add to Livestock" button

**Acceptance Criteria**:
- Recommendations are specific to the user's tank (not generic)
- Each recommendation includes clear reasoning
- Recommended species are available in the species database
- User can add a recommended species to their livestock list with one tap
- AI response includes >3 recommendations and is delivered in <3s
- If tank has no livestock, AI recommends starter-friendly species

---

## 6. Data Model

### Species Table
```
species {
  id: UUID (primary key)
  common_name: string (indexed, required)
  scientific_name: string (indexed, required)
  type: enum ('freshwater', 'saltwater', 'brackish')
  care_level: enum ('beginner', 'intermediate', 'advanced')
  description: text

  # Tank Requirements
  min_tank_size_gallons: integer
  temp_min_f: float
  temp_max_f: float
  ph_min: float
  ph_max: float
  hardness_min_dgh: float (optional)
  hardness_max_dgh: float (optional)

  # Behavior & Compatibility
  temperament: enum ('peaceful', 'semi-aggressive', 'aggressive')
  group_behavior: enum ('solitary', 'pair', 'group')
  compatibility_notes: text

  # Husbandry
  max_adult_size_inches: float
  lifespan_years: integer
  diet: enum ('carnivore', 'omnivore', 'herbivore')
  breeding_difficulty: enum ('easy', 'moderate', 'difficult')

  # Media & Metadata
  photo_url: string (optional)
  created_at: timestamp
  updated_at: timestamp
}
```

### Livestock Table
```
livestock {
  id: UUID (primary key)
  tank_id: UUID (foreign key → tank)
  species_id: UUID (foreign key → species, nullable for custom entries)
  custom_species_name: string (nullable, used if species_id is null)
  quantity: integer (required, ≥1)
  nickname: string (optional)
  date_added: date (required)
  notes: text (optional)

  # Removal Tracking
  date_removed: date (nullable)
  removal_reason: enum ('died', 'rehomed', 'sold', 'other') (nullable)
  removal_notes: text (optional)

  created_at: timestamp
  updated_at: timestamp
}
```

### Compatibility Check Log (Optional, for Analytics)
```
compatibility_check {
  id: UUID (primary key)
  user_id: UUID (foreign key → user)
  tank_id: UUID (foreign key → tank)
  species_id: UUID (foreign key → species)
  status: enum ('compatible', 'caution', 'not_recommended')
  warnings: jsonb (array of warning objects)
  user_confirmed: boolean (did user proceed despite warnings?)
  checked_at: timestamp
}
```

---

## 7. API Endpoints (REST/GraphQL)

### Species Database Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/species` | GET | List all species with pagination and filters (search, type, care_level, temperament) |
| `/api/species/:id` | GET | Fetch single species details |
| `/api/species/search` | GET | Full-text search by common/scientific name |
| `/api/species/:id/compatibility` | GET | Get pre-computed compatibility info for a species (e.g., "incompatible with: X") |

### Livestock Management Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tanks/:tank_id/livestock` | GET | List all active livestock for a tank |
| `/api/tanks/:tank_id/livestock` | POST | Add new livestock entry |
| `/api/tanks/:tank_id/livestock/:id` | PATCH | Update livestock entry (quantity, notes, etc.) |
| `/api/tanks/:tank_id/livestock/:id` | DELETE | Remove livestock (soft delete with reason) |
| `/api/tanks/:tank_id/livestock/history` | GET | Fetch removed livestock history for tank |
| `/api/tanks/:tank_id/livestock/:species_id/compatibility-check` | POST | Run AI compatibility check before adding |

### AI Integration Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/compatibility-check` | POST | Request AI compatibility analysis (body: tank_id, species_id) |
| `/api/ai/stocking-recommendations` | POST | Request AI stocking recommendations (body: tank_id) |
| `/api/ai/species-insights` | POST | Request AI conversation about a species (body: species_id, messages) |

---

## 8. UI/UX Specifications

### 8.1 Species Database Screen
**Layout** (Mobile-First):
- Header: "Species Database" with search bar (full-width, sticky)
- Filter button (icon, opens filter panel)
- Species grid (2 columns on mobile, 3+ on tablet/desktop)
- Each species card:
  - Photo (responsive, 16:9 aspect ratio)
  - Common name (16pt, bold)
  - Scientific name (12pt, gray)
  - Care level badge (Beginner/Intermediate/Advanced with color)
  - Min tank size (12pt)
  - Temperament label (12pt)
  - Tap to expand detail view

**Filter Panel**:
- Collapsible/modal panel with checkboxes:
  - Type (Freshwater/Saltwater/Brackish)
  - Care Level (Beginner/Intermediate/Advanced)
  - Min Tank Size (select ranges)
  - Temperament (Peaceful/Semi-Aggressive/Aggressive)
- "Apply Filters" button (sticky at bottom of panel)
- "Clear All" button

**Species Detail View**:
- Full-screen modal or nav stack
- Large species photo (1:1 or 4:3 aspect ratio)
- Horizontal scroll or tabs for sections:
  - **Overview**: Common/scientific name, type, care level, lifespan, max size
  - **Care**: Temp range, pH range, hardness, diet, min tank size
  - **Behavior**: Temperament, group behavior, compatibility notes
  - **Husbandry**: Breeding difficulty, origin, special notes
- "Add to Tank" button (prominent, bottom of screen or floating)
- "Ask AI" button or chat prompt

### 8.2 Livestock Management Screen
**Layout**:
- Tank selector (dropdown or tabs if user has multiple tanks)
- Livestock list (scrollable):
  - Species entries as rows or cards:
    - Species photo (50x50px, left-aligned)
    - Name + quantity (e.g., "Neon Tetras ×10")
    - Date added ("Added 2 weeks ago")
    - Nickname (if set, smaller text)
    - Right-align: Edit/Remove buttons (icons)
  - Tap row to expand details or edit
  - Tap "Remove" to soft-delete with reason
- "+ Add Species" button (prominent, bottom or floating)
- Empty state if no livestock

**Add Species Flow**:
- Modal/screen with two tabs: "From Database" | "Custom Entry"
- **From Database Tab**:
  - Search bar (auto-focus)
  - Filter results by care level, type, etc.
  - Species cards with "Select" button
  - After selection, form with pre-filled data:
    - Species name (read-only)
    - Quantity (input, spinner)
    - Date Added (date picker)
    - Nickname (optional text)
    - Notes (optional textarea)
  - "Add to Tank" button
- **Custom Entry Tab**:
  - Species Name (text input, required)
  - Quantity, Date Added, Nickname, Notes (same as above)

**AI Compatibility Check Modal** (appears after "Add to Tank" if database species):
- Title: "Compatibility Check"
- Status badge: "Compatible" / "Caution" / "Not Recommended"
- Warnings list (if any):
  - Bulleted items, e.g., "Aggressive toward tetras (you have 10)"
  - "Tank is below minimum size (20gal, needs 40gal)"
- "Proceed Anyway" button (with checkbox: "I understand the risks")
- "Cancel" button

### 8.3 AI Stocking Recommendations
**Trigger**:
- Button in Livestock section: "Get Recommendations" or chat-triggered via "What should I add?"

**Display**:
- AI response in chat interface
- Recommendations formatted as cards or expandable list:
  - Species name, photo, temperament
  - Why it fits ("Peaceful schooling fish that pairs well with your corydoras and tetras")
  - Care summary
  - "View Details" button (→ species detail screen)
  - "Add to Livestock" button (shortcut to add flow)

---

## 9. Success Metrics

### Leading Indicators (Engagement & Adoption)
1. **Species Database Browse Rate**: >60% of active users browse the species database in their first 30 days
2. **Compatibility Check Frequency**: >80% of livestock additions trigger an AI compatibility check (not bypassed)
3. **Livestock List Adoption**: >70% of tanks with water parameter data also have a populated livestock list (≥1 species)
4. **AI Recommendation Clicks**: >40% of users who receive AI stocking recommendations click "View Details" or "Add to Livestock"

### Lagging Indicators (Outcomes & Impact)
1. **Stocking Mistake Prevention**: Users report 50%+ reduction in compatibility-related fish loss or tank crashes (measured via user survey or in-app feedback)
2. **Recommendation Conversion**: >30% of AI-suggested species are added to tanks within 7 days of recommendation
3. **Database Satisfaction**: >4.0/5.0 average rating on species information completeness and accuracy (in-app survey)
4. **Livestock Accuracy**: >80% of users with livestock lists report that the list accurately reflects their current tank (survey)

### Technical Metrics
- Species database query response time: <500ms (50th percentile)
- Compatibility check execution time: <2s
- Species photo load time: <1s (with image optimization)
- Livestock list rendering: <500ms (even for tanks with 50+ species)

---

## 10. Decisions (Resolved)

- ✅ Species data source: Initial seed from curated open-source datasets (FishBase API where available, supplemented by manual curation). Content Admin manages species database via Admin Portal (Spec 13). Community submissions deferred to P2.
- ✅ Compatibility engine: Rule-based compatibility checking against tank type, temperature range, pH range, temperament, and minimum tank size. AI provides contextual compatibility advice during chat. Automated compatibility alerts when adding new livestock to a tank.
- ✅ Species count at launch: Target 500+ freshwater species, 200+ saltwater species, 100+ invertebrates. Expanded via Content Admin over time.
- ✅ Image sourcing: Stock images with proper licensing for initial launch. User-contributed images deferred to P2 (requires moderation pipeline).

---

## 11. Timeline & Dependencies

### MVP Phase (P0)
- **Dependency**: Tank Profile Management (R-002) must be complete—livestock is scoped to tanks
- **Dependency**: AI Chat Engine (R-001) infrastructure must be live—needed for compatibility checks and recommendations
- **Pre-Development**: Species database seeding (500+ species with photos and care data)
- **Estimated Duration**: 3–4 weeks for R-006 + R-007 + AI integration

### Key Milestones
1. **Week 1**: Data preparation and species database schema design
2. **Week 2**: Species database UI (browse, search, filter, detail view) + data seeding
3. **Week 3**: Livestock management UI (add, list, edit, remove) + backend API
4. **Week 4**: AI integration (compatibility checks, recommendations) + testing and refinement

### Post-MVP (P1)
- R-006.5: Species comparison tool (side-by-side view)
- R-007.6: Livestock health log (disease/treatment tracking)
- R-007.7: Bioload calculator (overstocking risk scoring)

---

## 12. Technical Notes

### Frontend (React/Next.js)
- Species database: Searchable grid with lazy-loaded images
- Livestock list: Efficient list rendering with edit-in-place or modal forms
- AI integration: Chat interface with streaming responses
- State management: Redux or Zustand to track current tank context for AI requests

### Backend (Node.js/Next.js API Routes + Supabase)
- Species table: Public read access (RLS: `true` for all users, select *) to enable quick searches
- Livestock table: Row-level security (RLS) scoped to authenticated user and their tanks
- Search: Postgres full-text search on species(common_name, scientific_name)
- AI requests: POST to Anthropic API with tank context in prompt

### Database (Supabase/Postgres)
- species table: Static, indexed on common_name and scientific_name
- livestock table: Dynamic, indexed on tank_id and user_id for fast lookups
- Livestock history: Soft deletes via date_removed field (not hard deletes)
- Compatibility checks: Optional audit log for analytics (compatibility_check table)

### Storage (Supabase Storage or CDN)
- Species photos: Stored in Supabase Storage or served from external CDN
- Photo optimization: Resize to multiple sizes (thumb: 50x50, card: 300x300, detail: 800x800) for responsive loading

### AI Integration (Anthropic API)
- Compatibility check: POST to /v1/chat/completions with prompt template:
  ```
  "User's tank: {tank_name}, {volume}gal, Temp: {temp}°F, pH: {pH}
   Current livestock: {livestock_list}
   Species to add: {species_name}
   Assess compatibility and provide specific warnings if any."
  ```
- Stocking recommendation: POST with prompt template:
  ```
  "Tank: {tank_name}, {volume}gal, Temp: {temp}, pH: {pH}
   Current livestock: {livestock_list}
   Suggest 3-5 compatible species I could add, with reasoning."
  ```
- Response parsing: Extract recommendation list from AI response and cross-reference with species database

---

## 13. Acceptance Criteria Summary

| Requirement | Acceptance Criteria |
|-------------|-------------------|
| R-006.1 | 500+ species in database; search for "clownfish" returns relevant card(s) with all care info displayed |
| R-006.2 | Filters (type, care level, tank size, temperament) work independently and in combination; results update <300ms |
| R-006.3 | Card view displays: photo, name, care level, tank size, temperament; detail view shows all attributes and is responsive |
| R-006.4 | AI can discuss any species with reference to database + training data; response <3s; user can ask follow-ups |
| R-007.1 | User selects species from database or custom entry; form captures quantity, date, nickname, notes; entry appears in list immediately |
| R-007.2 | Compatibility check runs automatically; reports specific conflicts (species-to-species, parameters, space); user sees report before confirming |
| R-007.3 | User can edit quantity/notes; remove with reason (died/rehomed/sold); removed entries archived in history, not deleted |
| R-007.4 | Livestock list shows all active species with photo, name, quantity, date added; responsive and scrollable; empty state is clear |
| R-007.5 | AI recommends 3–5 specific species based on tank data; each includes reasoning, care summary, and "Add" shortcut; response <3s |

---

## 14. Glossary

- **Livestock**: The collection of animal inhabitants (fish, invertebrates) in a user's tank
- **Species Card**: A visual summary of a species showing photo, name, care level, and key stats
- **Compatibility Check**: AI-powered analysis of whether a new species will work in a user's specific tank
- **Bioload**: The biological waste (ammonia) produced by tank inhabitants, measured as a function of fish mass and metabolic rate
- **RLS (Row-Level Security)**: Postgres feature enabling data access control at the row level
- **Temperament**: Classification of a fish's behavior (peaceful, semi-aggressive, aggressive)
- **Care Level**: Classification of how difficult a species is to keep (beginner, intermediate, advanced)

---

## 15. Appendix: Example Species Database Entry

```json
{
  "id": "sp-001-neon-tetra",
  "common_name": "Neon Tetra",
  "scientific_name": "Paracheirodon innesi",
  "type": "freshwater",
  "care_level": "beginner",
  "description": "A small, colorful schooling fish popular in community tanks. Displays vibrant red and blue stripes.",

  "min_tank_size_gallons": 10,
  "temp_min_f": 72,
  "temp_max_f": 78,
  "ph_min": 6.0,
  "ph_max": 7.0,
  "hardness_min_dgh": 1,
  "hardness_max_dgh": 2,

  "temperament": "peaceful",
  "group_behavior": "group",
  "compatibility_notes": "Peaceful schooling fish; best kept in groups of 6+. Safe with most community fish. May be eaten by larger predatory fish (e.g., angelfish, corydoras).",

  "max_adult_size_inches": 1.2,
  "lifespan_years": 10,
  "diet": "omnivore",
  "breeding_difficulty": "moderate",

  "photo_url": "https://cdn.example.com/species/neon-tetra.jpg",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

## End of Specification

**Document Version**: 1.0
**Last Updated**: February 2026
**Status**: Ready for Development
**Owner**: Aquatic AI Product Team
