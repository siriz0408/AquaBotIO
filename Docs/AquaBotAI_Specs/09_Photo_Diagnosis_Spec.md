# Photo Diagnosis — Feature Specification
**Aquatic AI | R-101 | P1 — Nice-to-Have (Fast Follow)**

## Problem Statement
When a hobbyist sees something wrong with their fish — white spots, torn fins, cloudy eyes, unusual behavior — they panic. Their first instinct is to take a photo and post it on Reddit or a Facebook group, waiting hours or days for a response from strangers. By then, the disease may have spread or the fish may have died. Meanwhile, species identification is another pain point: new hobbyists often don't know exactly what species they have, especially when fish were sold with incorrect or vague labels. Aquatic AI's photo diagnosis provides instant, AI-powered species identification and disease diagnosis with actionable treatment plans — personalized to the user's specific tank.

## Goals
- Identify common freshwater and saltwater species from photos with > 85% accuracy
- Diagnose visible diseases and conditions from photos with > 75% accuracy
- Provide actionable treatment plans including medication name, dosing adjusted for tank volume, and duration
- Response time under 10 seconds for photo analysis
- Available on Plus and Pro tiers (upgrade incentive for Starter users)

## Non-Goals
- NG1: Real-time video analysis — photos only in v1
- NG2: Plant disease/deficiency diagnosis — fish and invertebrate only
- NG3: Replacing veterinary advice — always include disclaimer about professional consultation
- NG4: Historical photo comparison (tracking disease progression over time) — P2 consideration
- NG5: Automated photo capture or camera integration — users upload existing photos

## User Stories
- US-7: As a hobbyist, I want to upload a photo of my fish and have the AI identify the species, so I can learn about its care requirements and check compatibility.
- US-8: As a hobbyist, I want to upload a photo of a sick fish and have the AI diagnose the likely disease, so I can start treatment quickly.
- US-9: As a hobbyist, I want the AI's diagnosis to include recommended treatments with medication dosing adjusted for my tank size, so I have an actionable plan.
- US-photo1: As a hobbyist, I want to take a photo directly from the app (camera access) or upload from my gallery, so the process is seamless.
- US-photo2: As a hobbyist, I want the AI to tell me its confidence level in the diagnosis, so I know whether to seek a second opinion.
- US-photo3: As a hobbyist, I want the photo diagnosis to be integrated into the AI chat, so I can ask follow-up questions about the diagnosis.

## Requirements

### Must-Have (P0 for this feature)
- **R-101.1: Photo upload** — Accept JPEG and PNG images up to 10MB. Support camera capture (via HTML input) and gallery selection. Compress/resize client-side before upload if needed.
  - Acceptance: Given a user taps "upload photo", they can choose camera or gallery. Given a valid image, it uploads and processing begins within 2 seconds.

- **R-101.2: Species identification** — Send photo to Claude Sonnet 4.5 (vision). Return: identified species (common + scientific name), confidence score, link to species database entry, care summary.
  - Acceptance: Given a clear photo of a common freshwater fish (neon tetra, betta, clownfish), the AI correctly identifies it with > 85% accuracy. Given the species is in our database, the response links to its species card.

- **R-101.3: Disease diagnosis** — Analyze photos for visible symptoms. Return: likely diagnosis (with confidence), symptom description, severity assessment, and treatment plan.
  - Acceptance: Given a photo showing visible ich (white spot disease), the AI diagnoses ich and provides a treatment plan. Given a photo with no visible symptoms, the AI says it doesn't detect obvious issues and suggests monitoring.

- **R-101.4: Personalized treatment plans** — Treatment recommendations include: medication name, dosing calculation adjusted for the user's tank volume, treatment duration, water change schedule during treatment, and warnings about medication interactions with existing livestock.
  - Acceptance: Given a diagnosis of ich in a 30-gallon tank with snails, the AI recommends a treatment, calculates dosing for 30 gallons, and warns about medications unsafe for invertebrates.

- **R-101.5: Confidence scoring** — Display confidence level for both identification and diagnosis (high/medium/low). For low-confidence results, recommend professional consultation.
  - Acceptance: Given a blurry or ambiguous photo, the AI indicates low confidence and recommends uploading a clearer photo or consulting a vet/experienced hobbyist.

- **R-101.6: Chat integration** — Photo diagnosis results appear in the AI chat conversation. Users can ask follow-up questions about the diagnosis, treatment, or species.
  - Acceptance: Given a diagnosis is provided, the user can ask "how long will treatment take?" and the AI responds with context from the diagnosis.

- **R-101.7: Tier gating** — Photo diagnosis is available on Plus and Pro tiers only, with daily limits:
  - **Free:** Not available (upgrade prompt shown)
  - **Starter ($3.99/mo):** Not available (upgrade prompt shown)
  - **Plus ($7.99/mo):** 10 diagnoses per day
  - **Pro ($14.99/mo):** 30 diagnoses per day
  - Acceptance: Given a Free or Starter user tries to upload a photo for diagnosis, they see an upgrade prompt showing this is a Plus/Pro feature. Given a Plus user reaches 10 diagnoses in a day, they see a limit message with Pro upgrade option.

- **R-101.8: Disclaimer** — Every diagnosis includes a disclaimer: "AI analysis is for informational purposes. For serious concerns, consult a veterinary professional or experienced aquarist."
  - Acceptance: Given any diagnosis result, the disclaimer is visible and not easily missed.

### Nice-to-Have (P1)
- **R-101.9: Photo history** — Store diagnosed photos in the tank's history for reference and tracking.
- **R-101.10: Multiple photos per diagnosis** — Allow users to upload 2-3 photos from different angles for better accuracy.
- **R-101.11: Treatment tracking** — After diagnosis, offer to create a maintenance task for the treatment schedule (medication dosing reminders).

### Future Considerations (P2)
- **R-101.12: Disease progression tracking** — Compare photos over time to track recovery or worsening.
- **R-101.13: Community diagnosis validation** — Expert users can validate or correct AI diagnoses to improve accuracy.
- **R-101.14: Coral and plant diagnosis** — Extend to coral bleaching, plant deficiencies, and algae identification.

## Success Metrics
### Leading
- Photo upload rate: > 30% of Plus/Pro users try photo diagnosis in first 30 days
- Species identification accuracy: > 85% for top 100 common species
- Disease diagnosis accuracy: > 75% for common visible diseases (ich, fin rot, dropsy, swim bladder)
- Analysis response time: < 10 seconds from upload to result

### Lagging
- Treatment success rate: > 60% of users who follow AI treatment plans report improvement (in-app feedback)
- Upgrade conversion: Photo diagnosis mentioned in > 10% of Starter-to-Plus upgrade reasons
- User satisfaction: > 4.0/5.0 rating on photo diagnosis helpfulness

## Decisions (Resolved)
- ✅ Image storage: Supabase Storage with user-scoped buckets. Images retained for 90 days for paid tiers, 30 days for free tier. User can delete their images at any time.
- ✅ Image size limits: Max 10MB per upload. Client-side compression to 2MP before upload (preserves enough detail for AI diagnosis while keeping storage costs manageable). Supported formats: JPEG, PNG, HEIC (auto-converted to JPEG).
- ✅ Diagnosis confidence: Always show confidence score to user (High/Medium/Low). Include disclaimer: "AI analysis is for informational purposes. Consult a veterinarian or aquarium professional for medical treatment." Low-confidence diagnoses emphasize the disclaimer more prominently.
- ✅ Diagnosis history: Stored in photo_diagnoses table with all results. Viewable from tank detail page. User can add feedback (helpful/not helpful) to improve future quality monitoring.
- ✅ Vision model: Claude Sonnet 4.5 (vision-capable). Single image analysis per request. Multi-image comparison deferred to P2.

## Timeline Considerations
- Phase 2 (Fast Follow): Ship after MVP P0 features are stable
- Dependency: AI Chat Engine (R-001) for chat integration
- Dependency: Species Database (R-006) for linking identifications to species cards
- Dependency: Tank Profile Management (R-002) for tank volume in dosing calculations
- Dependency: Subscription & Billing (R-010) for tier gating

## Technical Notes
- AI: Anthropic Claude Sonnet 4.5 API — send image as base64 or URL with system prompt including tank context
- Storage: Supabase Storage for uploaded photos, with auto-cleanup policy for old photos
- Client-side: HTML5 file input with accept="image/*" capture="camera" for mobile camera access
- Compression: Client-side image resize to max 2048px longest edge before upload (reduces API cost and latency)
- Token cost: Vision API calls are more expensive than text — budget ~$0.01-0.03 per photo analysis
- System prompt: Include tank context (volume, livestock, parameters) alongside the image for personalized treatment recommendations
