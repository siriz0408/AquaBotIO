# Progressive Web App (PWA) Shell — Feature Specification
**Aquatic AI | R-011 | P0 — Must-Have**

## Problem Statement
Aquatic AI's primary users are hobbyists who interact with their tanks at home — often with wet hands, standing at their aquarium, needing quick access on their phone. A native app requires App Store approval, separate codebases, and delays our launch. A PWA gives us app-like mobile experience (installability, offline support, push notifications, full-screen mode) with a single codebase deployed on Vercel, avoiding App Store friction and fees. The PWA shell is the delivery vehicle that makes Aquatic AI feel like a native app on any device.

## Goals
- App-like experience on mobile: full-screen, splash screen, no browser chrome
- Installable on home screen via "Add to Home Screen" on Android and iOS
- Offline support: cached UI shell loads instantly, queued actions sync when online
- Push notifications for maintenance reminders, parameter alerts, and AI insights
- Responsive design that works flawlessly on desktop (1440px+), tablet (768-1024px), and mobile (320-767px)
- Lighthouse PWA score > 90

## Non-Goals
- NG1: Native mobile apps (iOS/Android) — PWA only in v1
- NG2: Background sync for complex operations — basic queue-and-sync only
- NG3: Camera/hardware access beyond basic photo upload — no real-time camera features
- NG4: Offline AI chat — AI requires network; offline mode focuses on data entry and cached content
- NG5: App Store listing (Microsoft Store, Google Play TWA) — P2 consideration

## User Stories
- **US-pwa1:** As a mobile user, I want to install Aquatic AI on my home screen so it feels like a native app with its own icon and splash screen.
- **US-pwa2:** As a user at my tank with wet hands, I want the app to be fully usable on mobile with large touch targets and simple navigation.
- **US-pwa3:** As a user who loses internet briefly, I want the app UI to still load from cache so I'm not staring at a blank screen.
- **US-pwa4:** As a user who logs parameters while offline, I want my entries to sync automatically when I'm back online.
- **US-21:** As a hobbyist, I want to receive push notifications for maintenance reminders and parameter alerts, so I stay on top of my tanks.
- **US-pwa5:** As a desktop user, I want the full app experience with expanded layouts that take advantage of screen real estate.

## Requirements

### Must-Have (P0)

#### R-011.1: PWA Manifest
Valid web app manifest with: app name, short name, icons (192px, 512px), theme color, background color, display mode (standalone), start URL, scope.

**Acceptance Criteria:**
- Given a user visits the app on mobile Chrome, they see the "Add to Home Screen" prompt
- Given they install, the app icon appears on their home screen
- Given the app launches, it opens in standalone mode with the configured splash screen

**Implementation Details:**
- Location: `/public/manifest.json`
- Include all required fields: name, short_name, icons, theme_color, background_color, display, start_url, scope
- Provide 192x192px and 512x512px PNG icons
- Include maskable icon variant for Android adaptive icons
- Set preferred_color_scheme based on user preference or system theme

---

#### R-011.2: Service Worker
Cache-first strategy for app shell (HTML, CSS, JS, static assets). Network-first for API data. Handles offline gracefully.

**Acceptance Criteria:**
- Given the app is installed and the user goes offline, the app shell loads from cache within 1 second
- Given API calls fail while offline, the user sees a clear "offline" indicator (not a cryptic error)
- Given the app updates, the service worker caches new versions and serves them without breaking current session
- Given the user comes back online, background resources are re-fetched and cached

**Implementation Details:**
- Use Workbox (via next-pwa) for service worker generation
- Cache-first strategy for: static assets (CSS, JS, fonts), images, app shell
- Network-first strategy for: API endpoints, dynamic content
- Stale-while-revalidate for: navigation requests, ensuring quick loads with fresh data in background
- Implement proper cache invalidation and cleanup for old cached versions
- Add offline page fallback with helpful messaging

---

#### R-011.3: Offline Data Queue
When offline, parameter entries and task completions are queued locally and synced when connectivity returns.

**Acceptance Criteria:**
- Given a user logs parameters while offline, the entries appear in the UI immediately (optimistic update)
- Given connectivity returns, queued entries sync to Supabase and the queue clears
- Given sync fails, entries remain in queue and user is notified of retry status
- Given a conflict occurs (server and local data diverge), resolution follows a documented strategy

**Implementation Details:**
- Use IndexedDB via idb library for local queue persistence
- Store: action type, timestamp, payload, retry count, sync status
- Implement automatic sync trigger when navigator.onLine fires
- Expose queue status in UI: "1 pending parameter reading waiting to sync"
- Implement exponential backoff for retry attempts (1s, 2s, 4s, 8s max)
- Clear queue on successful sync with timestamp confirmation

---

#### R-011.4: Push Notifications
Web Push API via service worker. Support notification types: maintenance reminders, parameter alerts, AI insights, trial expiration.

**Acceptance Criteria:**
- Given a user has granted notification permission, they receive push notifications even when the app is not actively open
- Given a user has not granted permission, they see a contextual prompt (not on first visit — after they've used the app)
- Given a notification is tapped, the app opens and navigates to the relevant context (e.g., maintenance details, alert source)
- Given a maintenance reminder is sent, it includes the tank name, task details, and action button
- Given parameter alerts are sent, they include the parameter name, current value, and normal range

**Implementation Details:**
- Use Web Push API with service worker push event listeners
- Store subscription tokens in Supabase after user grants permission
- Implement server-side push delivery via Supabase Edge Function
- Notification payload structure: title, body, icon, badge, tag (for grouping), data (context), actions (buttons)
- Support notification grouping by tank (show "3 alerts" instead of 3 separate notifications)
- Track notification engagement: received, opened, dismissed, acted upon
- Implement permission request modal after first 5 app sessions, with clear benefit messaging

---

#### R-011.5: Responsive Design
Mobile-first responsive layout. Breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px). All features accessible at all breakpoints.

**Acceptance Criteria:**
- Given a user on a 375px-wide phone, all features are accessible with no horizontal scrolling
- Given a desktop user at 1440px, the layout expands to use available space (sidebar nav, wider content area)
- Given a tablet user (768-900px), the layout provides an optimized middle ground (possibly split view)
- Given content exists that would exceed viewport width, it wraps or uses scrollable containers

**Implementation Details:**
- Use Tailwind CSS responsive utilities (sm:, md:, lg:, xl:) throughout
- Define breakpoints: sm: 640px, md: 768px, lg: 1024px, xl: 1280px
- Implement mobile-first CSS: base styles for mobile, add breakpoint modifiers as needed
- Use fluid typography (scale with viewport) where appropriate
- Test at actual device dimensions: 375px (iPhone SE), 768px (iPad), 1440px (desktop)
- Ensure touch targets are minimum 48x48px on mobile for accessibility

---

#### R-011.6: App-like UX
Standalone display mode (no browser chrome). Custom splash screen during load. Smooth transitions between views. Pull-to-refresh on mobile.

**Acceptance Criteria:**
- Given a user opens the installed PWA, it launches in full-screen mode with splash screen, no address bar
- Given navigation between views, transitions are smooth (no full-page reloads, fade or slide animations)
- Given a user is on mobile, they can pull down to refresh the current view
- Given the app is loading, a branded splash screen (matching manifest background_color and icon) appears
- Given the user navigates away and returns, view state is restored (scroll position, form inputs, etc.)

**Implementation Details:**
- Configure manifest display: "standalone"
- Create splash screen component using manifest colors and icons
- Implement route transitions with CSS transitions or Framer Motion
- Add pull-to-refresh gesture handler (or use native browser support where available)
- Use Next.js Layout Routes to preserve state across navigation where appropriate
- Implement scroll restoration and form state caching in context or IndexedDB

---

#### R-011.7: Performance Targets
First Contentful Paint < 1.5 seconds. Time to Interactive < 3 seconds. Lighthouse Performance score > 80. Lighthouse PWA score > 90.

**Acceptance Criteria:**
- Given a Lighthouse audit on mobile (throttled), PWA score is > 90
- Given first visit on 4G connection, FCP is under 1.5 seconds
- Given a user interacts with the page, interactive response time is under 100ms
- Given the full page is loaded, TTI is under 3 seconds on 4G
- Given an image-heavy page loads, images load progressively (blur-up or skeleton)

**Implementation Details:**
- Use Next.js Image component for automatic optimization and responsive images
- Implement code splitting with dynamic imports for route bundles
- Minify and compress all assets (CSS, JS, images)
- Use Brotli compression for text-based assets
- Implement lazy loading for off-screen content
- Set up Lighthouse CI in build pipeline to catch regressions
- Monitor Core Web Vitals in production with web-vitals library
- Cache-bust static assets with content hashing (Next.js default)

### Nice-to-Have (P1)

#### R-011.8: Offline Species Browsing
Cache species database for offline browsing.

**Details:** Store species profiles (name, temperature range, compatibility, care tips) in IndexedDB. Allow users to browse and search species while offline. Sync new species added to database when online.

---

#### R-011.9: Smart Notification Scheduling
Don't send notifications during user's typical sleeping hours.

**Details:** Collect user timezone and preferred quiet hours (settings). Filter server-side notification delivery to respect these windows. Deliver reminders at next available window or as badge update instead.

---

#### R-011.10: Install Prompt UX
Custom in-app install banner with contextual messaging about benefits.

**Details:** Show a native-looking banner after user has completed 2-3 key flows. Include icons, messaging ("Install for quick access"), and dismiss/install buttons. Track install conversion from banner vs. native prompt.

---

### Future Considerations (P2)

#### R-011.11: Background Sync API
Use Background Sync API for more reliable offline-to-online data transfer.

**Details:** Register background sync tag when queue has pending items. OS will attempt sync after connectivity returns. Fallback to IndexedDB queue for browsers without support.

---

#### R-011.12: TWA Wrapper
Trusted Web Activity for Google Play Store listing.

**Details:** Wrapper Android app that launches the PWA in trusted web activity context. Enables Play Store listing without rebuilding native code.

---

#### R-011.13: Periodic Background Sync
Fetch updated data and AI reports in the background.

**Details:** Use Periodic Background Sync API to fetch tank parameters, AI insights, and maintenance updates when device is charging/connected to power. Update home screen widgets.

---

## Success Metrics

### Leading Indicators
- **Install rate:** > 30% of mobile users install the PWA within first week of signup
- **Notification opt-in:** > 50% of users enable push notifications during onboarding or first usage
- **Lighthouse PWA score:** > 90 on all audits
- **Offline recovery:** 100% of queued offline entries sync successfully to Supabase
- **Performance:** FCP < 1.5s on throttled 4G (mobile), TTI < 3s

### Lagging Indicators
- **Mobile engagement:** Mobile users have equal or higher engagement than desktop (daily active users, session duration, features used)
- **Notification-driven returns:** > 20% of app opens come from notification taps (tracked via notification data context)
- **Reliability:** < 1% of sessions experience a crash, blank screen, or offline state without graceful handling
- **Installation persistence:** > 80% of installed apps remain on home screen after 1 month
- **Offline usage:** > 10% of parameter logs come from offline-queued entries (tracking offline feature adoption)

---

## Decisions (Resolved)
- ✅ Offline mode: Basic offline shell (cached app shell, cached species database) with clear "You're offline" messaging. No offline AI chat. Parameter entries queued for sync when back online. Full offline-first architecture deferred to P2.
- ✅ Install prompt: Show custom install prompt after 3rd visit within 7 days (heuristic for engaged users). Dismiss is persistent — don't re-show for 30 days. Position as bottom banner, not modal.
- ✅ Update strategy: Automatic service worker updates with "New version available — tap to refresh" banner. No forced updates. Background download of new version.
- ✅ Navigation: Bottom tab bar with 5 tabs (Home, Parameters, Species, Maintenance, Chat) per Figma wireframes. Brand color #1B998B. iOS safe area handling for bottom bar.
- ✅ Splash screen: Branded splash screen with Aquatic AI logo during app load (< 2 seconds). Match system theme (light/dark).

---

## Timeline Considerations

### Critical Path
1. **Phase 1 (MVP):** Manifest, service worker, responsive layout, push notifications, offline queue — **Ship Blocker**
2. **PWA infrastructure must be set up early** — It's the delivery mechanism for all other features
3. **Dependency:** Next.js setup with next-pwa must be configured before other routes/features
4. **Push notification infrastructure** needs to be in place before Maintenance Scheduling (R-008) can deliver reminders
5. **Responsive design testing** must start early — responsive bugs are expensive to fix late

### Phases
- **Week 1-2:** Manifest, service worker skeleton, responsive layout
- **Week 3:** Push notifications (server-side + client-side infrastructure)
- **Week 4:** Offline queue, graceful offline handling
- **Week 5:** Performance optimization, Lighthouse audits, real device testing
- **Week 6:** Refinements, bug fixes, ship to production

---

## Technical Stack

### Framework & Build
- **Framework:** Next.js 14+ App Router
- **PWA Build Tool:** next-pwa for automatic service worker generation
- **Styling:** Tailwind CSS with responsive utilities
- **Package Manager:** npm or yarn

### Service Worker & Caching
- **Service Worker:** Workbox (via next-pwa)
- **Caching Strategies:** Cache-first (assets), Network-first (API), Stale-while-revalidate (navigation)
- **Cache Storage:** Browser Cache API + IndexedDB

### Offline Support
- **Offline Queue Storage:** IndexedDB via idb library
- **Conflict Resolution Strategy:** Last-write-wins with timestamp comparison
  - If server has newer data than queued offline action, discard offline action and notify user
  - If offline action is newer, apply it to server
  - For parameter logs: always append (no conflict possible — each entry is unique)
  - For task completions: if task already completed on server, skip silently
  - User notification: Toast message when offline actions are discarded due to newer server data
- **Sync Trigger:** navigator.onLine event + periodic retries

### Push Notifications
- **Client:** Web Push API + Service Worker push event
- **Server:** Supabase Edge Function for sending push messages
- **Subscription:** Store user subscription tokens in Supabase (Push Subscriptions table)

### Responsive Design
- **Breakpoints:** sm: 640px, md: 768px, lg: 1024px, xl: 1280px
- **Mobile-First:** Base styles for mobile, modifiers for larger screens
- **Touch Targets:** Minimum 48x48px on mobile

### Testing & Monitoring
- **Lighthouse CI:** Automated PWA score checks in build pipeline
- **Real Device Testing:** Android (Chrome, Firefox), iOS (Safari), Windows (Edge)
- **Performance Monitoring:** web-vitals library for FCP, LCP, CLS, FID in production
- **Error Tracking:** Sentry for crash/error reporting
- **Analytics:** Custom events for install, notification opt-in, offline usage

### Icons & Assets
- **Icon Sizes:** 192x192px and 512x512px PNG
- **Maskable Icon:** 192x192px for Android adaptive icons
- **Splash Screen:** Generated from manifest metadata
- **Favicon:** 32x32px ICO format

---

## Dependencies & Integrations

### External Services
- **Vercel:** Hosting and deployment
- **Supabase:** Push subscription storage and edge function execution
- **Anthropic:** AI features (not PWA-critical but part of overall platform)

### Internal Dependencies
- **R-001: Authentication & Authorization** — User context needed for push subscriptions
- **R-008: Maintenance Scheduling** — Delivery mechanism for maintenance reminders
- **R-009: Parameter Logging & Alerts** — Delivery mechanism for parameter alerts
- **R-004: AI Chat & Insights** — Delivery mechanism for AI insight notifications

---

## Glossary

- **PWA:** Progressive Web App — web app with native-like capabilities
- **Service Worker:** Background script that intercepts network requests and manages caching
- **Manifest:** JSON file describing app metadata (name, icons, theme colors)
- **Offline Queue:** Local storage of user actions that will sync when connectivity returns
- **Web Push API:** Browser API for receiving push notifications
- **Workbox:** Library providing caching strategies and service worker utilities
- **IndexedDB:** Browser database for storing large amounts of local data
- **Standalone Mode:** Full-screen app display without browser chrome (address bar, tabs)
- **Splash Screen:** Loading screen shown when app launches
- **FCP (First Contentful Paint):** Time until first content is visible on screen
- **TTI (Time to Interactive):** Time until page is fully interactive
- **Lighthouse:** Google's automated audit tool for performance, PWA readiness, accessibility

---

## Acceptance & Sign-Off

**Feature Owner:** (To be assigned)
**Engineering Lead:** (To be assigned)
**Product Manager:** (To be assigned)
**Design Lead:** (To be assigned)

**Status:** Draft — Ready for team review
**Last Updated:** February 2026
**Version:** 1.0
