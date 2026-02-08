# AquaBotAI UI/UX Design System & Mobile Layout Guide

> **Version:** 1.0 | **Last Updated:** February 8, 2026
> **Source of Truth:** `Docs/Wireframes/` (Figma export) + This Document

---

## 1. Design Principles

1. **Mobile-First** — Every screen is designed for 375px viewport first, then enhanced at `md:` (768px+)
2. **Touch-Friendly** — Minimum 44px touch targets, generous spacing
3. **Aquatic Identity** — Deep navy and teal evoke the underwater aesthetic
4. **Glanceable Data** — Parameter cards, health gauges, and alerts designed for quick comprehension
5. **Progressive Disclosure** — Bottom sheets and expandable cards over page navigations
6. **Offline-Aware** — Loading states, cached data indicators, graceful degradation

---

## 2. Color System

### 2.1 Brand Colors (Canonical)

| Token | Hex | HSL | Usage | Tailwind Class |
|-------|-----|-----|-------|----------------|
| **Navy** | `#0A2463` | `225 82% 21%` | Backgrounds, gradients, text headings | `brand-navy` |
| **Teal** | `#1B998B` | `170 71% 35%` | Primary accent, CTAs, active states, good status | `brand-teal` |
| **Cyan** | `#00B4D8` | `193 100% 42%` | Secondary accent, links, hover states | `brand-cyan` |

### 2.2 Semantic Colors

| Token | Hex | Usage | Tailwind Class |
|-------|-----|-------|----------------|
| **Good/Success** | `#1B998B` | Healthy parameters, completed tasks | `brand-teal` |
| **Warning/Caution** | `#F59E0B` | Parameters approaching limits | `amber-500` |
| **Alert/Danger** | `#FF6B6B` | Out-of-range, overdue, errors | `brand-alert` |
| **Info** | `#00B4D8` | Tips, informational badges | `brand-cyan` |

### 2.3 Surface Colors

| Token | Hex | Usage |
|-------|-----|-------|
| **Page Background** | `#F0F4F8` | Global `bg-[#F0F4F8]` or `bg-brand-bg` |
| **Card Surface** | `#FFFFFF` | Cards, modals, bottom sheets |
| **Elevated Surface** | `#FFFFFF` + shadow | Headers, floating elements |
| **Subtle Background** | `#F0F4F8` | Input backgrounds, tag pills |

### 2.4 Text Colors

| Usage | Class |
|-------|-------|
| Headings | `text-[#0A2463]` (navy) |
| Body | `text-gray-700` |
| Secondary | `text-gray-500` |
| On-dark | `text-white` |
| On-teal | `text-white` |
| Links | `text-brand-cyan hover:underline` |

### 2.5 Gradient Definitions

| Name | CSS | Usage |
|------|-----|-------|
| **Header Gradient** | `from-[#0A2463] to-[#1B998B]` | Tank header, hero sections |
| **CTA Gradient** | `from-[#1B998B] to-[#0A2463]` | Primary buttons, floating chat |
| **User Bubble** | `from-[#1B998B] to-[#0A2463]` | Chat user messages |
| **Auth Gradient** | `from-[#0A2463] to-[#1B998B]` | Welcome screen background |

### 2.6 Status Color Matrix

| Context | Good | Caution | Alert |
|---------|------|---------|-------|
| Parameter Values | `#1B998B` dot | `#F59E0B` dot | `#FF6B6B` dot |
| Health Score | `#1B998B` (≥80) | `#F59E0B` (≥60) | `#FF6B6B` (<60) |
| Maintenance Tasks | — | — | `border-l-4 border-[#FF6B6B]` (overdue) |
| Compatibility | `bg-[#1B998B]/10 text-[#1B998B]` | `bg-[#F59E0B]/10 text-[#F59E0B]` | `bg-[#FF6B6B]/10 text-[#FF6B6B]` |

---

## 3. Typography

### 3.1 Type Scale

| Element | Class | Size | Weight |
|---------|-------|------|--------|
| Page Title | `text-2xl font-bold` | 24px | 700 |
| Section Title | `text-xl font-bold` | 20px | 700 |
| Card Title | `text-lg font-semibold` | 18px | 600 |
| Body | `text-base` | 16px | 400 |
| Small Body | `text-sm` | 14px | 400 |
| Label | `text-xs font-medium` | 12px | 500 |
| Caption | `text-xs text-gray-500` | 12px | 400 |

### 3.2 Font Family
- Primary: System font stack (Tailwind `font-sans`)
- Monospace: `font-mono` (parameter values, code)

---

## 4. Spacing & Layout

### 4.1 Spacing Scale
| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight inline spacing |
| `gap-2` | 8px | Icon-text pairing |
| `gap-3` | 12px | Card grid gaps |
| `gap-4` | 16px | Section spacing |
| `gap-6` | 24px | Major section breaks |
| `p-4` | 16px | Standard card padding |
| `p-6` | 24px | Form/modal padding |
| `px-4` | 16px | Horizontal page gutter |

### 4.2 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-xl` | 12px | Input fields, filter pills |
| `rounded-2xl` | 16px | Cards, modals, message bubbles |
| `rounded-full` | 9999px | Badges, avatar, floating button |

### 4.3 Shadows

| Level | Class | Usage |
|-------|-------|-------|
| Subtle | `shadow-sm` | Cards at rest |
| Medium | `shadow-md` | Cards on hover, headers |
| Large | `shadow-lg` | Floating buttons, modals |
| XL | `shadow-xl` | Bottom sheets |

---

## 5. Component Patterns

### 5.1 Cards

```tsx
// Standard Card
<div className="bg-white rounded-2xl shadow-sm p-4">
  {/* content */}
</div>

// Interactive Card (hover state)
<div className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow">
  {/* content */}
</div>

// Status Card (left border)
<div className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-[#FF6B6B]">
  {/* overdue task */}
</div>
```

### 5.2 Buttons

```tsx
// Primary CTA (gradient)
<button className="bg-gradient-to-r from-[#1B998B] to-[#0A2463] text-white rounded-full px-6 py-3 font-medium shadow-lg">
  Log Results
</button>

// Secondary Button
<button className="bg-[#F0F4F8] text-gray-700 rounded-xl px-4 py-2 font-medium">
  Cancel
</button>

// Outlined Button
<button className="border-2 border-[#1B998B] text-[#1B998B] rounded-xl px-4 py-2 font-medium">
  Edit
</button>

// Dashed Add Button
<button className="border-2 border-dashed border-[#1B998B] text-[#1B998B] rounded-2xl p-4">
  + Add
</button>
```

### 5.3 Input Fields

```tsx
// Text Input
<input className="w-full border-2 border-gray-200 focus:border-[#1B998B] rounded-xl px-4 py-3 text-base outline-none transition-colors" />

// Parameter Value Input
<input type="number" className="w-full text-3xl font-bold text-center border-2 border-gray-200 focus:border-[#1B998B] rounded-xl p-4" />
```

### 5.4 Badges & Pills

```tsx
// Filter Pill (inactive)
<span className="bg-[#F0F4F8] text-gray-700 rounded-full px-3 py-1.5 text-sm font-medium">
  Freshwater
</span>

// Filter Pill (active)
<span className="bg-[#1B998B] text-white rounded-full px-3 py-1.5 text-sm font-medium">
  Freshwater
</span>

// Status Badge
<span className="bg-[#1B998B]/10 text-[#1B998B] rounded-full px-2 py-0.5 text-xs font-medium">
  Good
</span>
```

### 5.5 Bottom Sheet Modal

```tsx
// Bottom Sheet Overlay
<div className="fixed inset-0 bg-black/50 z-40" />
<div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto z-50 pb-safe">
  <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
  <div className="p-6">
    {/* content */}
  </div>
</div>
```

---

## 6. Mobile Layout Architecture

### 6.1 Screen Shell

```
┌──────────────────────────┐
│   TopBar (sticky)        │  ← sticky top-0 z-10, white, shadow
│   [Tank ▼] [🔔] [⚙️]    │
├──────────────────────────┤
│                          │
│   Scrollable Content     │  ← flex-1 overflow-y-auto
│   (pb-20 for tab bar)    │
│                          │
│                          │
│                          │
│              [💬]        │  ← FloatingChatButton (fixed bottom-24 right-6)
├──────────────────────────┤
│  🏠  📊  🐠  🔧  💬     │  ← BottomTabBar (fixed bottom-0)
└──────────────────────────┘
```

### 6.2 Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile (default) | < 768px | Bottom tab bar, floating chat, TopBar, full-width cards |
| Tablet/Desktop (`md:`) | ≥ 768px | Desktop navbar (top), no tab bar, no floating chat, max-width content |

### 6.3 Safe Area Insets (iOS)

```css
/* Applied via Tailwind utility classes */
.pb-safe { padding-bottom: env(safe-area-inset-bottom); }
.mb-safe { margin-bottom: env(safe-area-inset-bottom); }
.pt-safe { padding-top: env(safe-area-inset-top); }
```

All fixed-bottom elements (tab bar, chat input, action buttons) must include `pb-safe`.

### 6.4 Touch Targets
- **Minimum size:** 44 × 44px (`min-h-[44px]`)
- **Button padding:** `py-3` minimum for primary actions
- **Icon buttons:** `w-10 h-10` or `w-12 h-12` with centered icon
- **List items:** `p-4` padding with clear tap areas

---

## 7. Screen-by-Screen Layout Reference

### 7.1 Welcome / Auth Flow

| Screen | Layout | Key Elements |
|--------|--------|--------------|
| **Welcome** | Full-screen gradient (navy → teal) | Logo, 3 value props, "Get Started" CTA |
| **Email Signup** | Centered card on `#F0F4F8` bg | Mail icon, email input, CTA button |
| **Check Email** | Centered card | Mail icon, email display, resend link |
| **Onboarding** | Multi-step wizard | Progress bar, step content, Continue button |

### 7.2 Dashboard (Home Tab)

```
[TopBar: Tank Selector + Notifications]
[TankHeader: Gradient bg, name, type, health gauge]
[ParameterCards: Horizontal scroll, status dots]
[QuickActions: 3-column grid]
[AIInsights: Stacked cards with colored left border]
[LivestockSummary: 3-column grid with emoji]
[UpcomingMaintenance: List with checkboxes]
```

### 7.3 Parameters Tab

```
[Header: Back + "Water Parameters"]
[TimeRange: 4 pills (7d/30d/90d/All)]
[Chart: Recharts LineChart, 300px height]
[ParameterPills: Color-coded filter buttons]
[AIAnalysis: Card with text insights]
```

### 7.4 Species Tab

```
[Header: Search bar]
[Filters: Horizontal scroll pills]
[Grid: 2-column cards (image, name, tank size)]
 → tap → Bottom Sheet Detail Modal
```

### 7.5 Maintenance Tab

```
[Header: Title + Add button (teal)]
[Filters: Horizontal pills (All/Today/Overdue)]
[TaskList: Cards with checkbox, icon, due date]
 → [Add button] → Bottom Sheet Form
```

### 7.6 AI Chat

```
[ChatTopBar: Back + Tank context]
[Messages: Scrollable, multiple types]
  - User: Right-aligned, gradient bubble
  - AI Text: Left-aligned, white bubble
  - Species Card: Card with image + stats
  - Parameter Alert: Card with mini chart
  - Action Confirmation: Success card
[ChatInput: Quick actions + textarea + send]
```

### 7.7 Tank Setup Wizard

```
[Progress: 3 bars at top]
Step 1: Tank name + type grid (4 options)
Step 2: Volume input + dimensions
Step 3: Setup date + substrate + photo
[Footer: Continue + Skip buttons]
```

---

## 8. Animation & Motion

### 8.1 Framer Motion Defaults

```tsx
// Page Transition
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}

// Staggered List
variants={{
  container: { transition: { staggerChildren: 0.05 } },
  item: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }
}}

// Button Press
whileTap={{ scale: 0.95 }}
whileHover={{ scale: 1.05 }}

// Floating Chat Pulse (when unread)
animate={{ scale: [1, 1.1, 1] }}
transition={{ duration: 2, repeat: Infinity }}
```

### 8.2 Transition Classes

| Element | Transition |
|---------|-----------|
| Cards | `transition-shadow duration-200` |
| Buttons | `transition-colors duration-200` |
| Inputs | `transition-colors duration-200` |
| Tabs | `transition-all duration-200` |

---

## 9. Iconography

### 9.1 Icon Library
- **Primary:** Lucide React icons
- **Size:** `w-5 h-5` (default), `w-4 h-4` (small), `w-6 h-6` (large)

### 9.2 Tab Bar Icons
| Tab | Icon | Active Color |
|-----|------|-------------|
| Home | `Home` | `text-[#1B998B]` |
| Parameters | `Activity` | `text-[#1B998B]` |
| Species | `Fish` | `text-[#1B998B]` |
| Maintenance | `Wrench` | `text-[#1B998B]` |
| Chat | `MessageCircle` | `text-[#1B998B]` |

### 9.3 Quick Action Icons
| Action | Icon | Container Color |
|--------|------|----------------|
| Log Parameters | `Droplets` | `bg-[#1B998B]/15` |
| Add Livestock | `Fish` | `bg-[#0A2463]/15` |
| Schedule Task | `CalendarPlus` | `bg-[#1B998B]/15` |

---

## 10. Dark Mode

### 10.1 Approach
- Class-based toggling (Tailwind `darkMode: 'class'`)
- CSS custom properties in `globals.css` define dark surfaces

### 10.2 Dark Mode Overrides
| Element | Light | Dark |
|---------|-------|------|
| Page bg | `#F0F4F8` | `hsl(222.2 84% 4.9%)` |
| Card bg | `#FFFFFF` | `hsl(222.2 84% 6%)` |
| Text primary | `#0A2463` | `#F8FAFC` |
| Text secondary | `gray-500` | `gray-400` |
| Borders | `gray-200` | `gray-700` |
| Brand colors | Unchanged | Unchanged |

---

## 11. Implementation Checklist

### Color Alignment (from wireframes)
- [ ] Update `tailwind.config.ts`: `brand.navy` → `#0A2463`
- [ ] Update `tailwind.config.ts`: `brand.bg` → `#F0F4F8`
- [ ] Update `globals.css` HSL vars to match
- [ ] Promote `brand-teal` to primary CTA color across components
- [ ] Ensure `brand-cyan` is used as secondary accent only
- [ ] Verify alert color `#FF6B6B` is consistent

### Layout Alignment
- [x] Bottom Tab Bar — 5 tabs, mobile-only
- [x] Floating Chat Button — mobile-only, above tab bar
- [x] Desktop Navbar — desktop-only
- [x] TopBar — tank selector + notifications
- [x] Safe area insets — iOS support
- [ ] Health Score Gauge — circular gauge in tank header (per wireframe)
- [ ] Horizontal scroll parameter cards on dashboard
- [ ] 2-column species grid (verify current layout)
- [ ] Bottom sheet modals (verify using Sheet component)

---

## 12. Wireframe Component Mapping

This maps wireframe components to their actual implementation paths.

| Wireframe Component | Implementation Path | Match |
|---------------------|---------------------|-------|
| `WelcomeScreen.tsx` | `src/app/(auth)/login/page.tsx` | ⚠️ Different layout |
| `EmailSignupScreen.tsx` | `src/app/(auth)/signup/page.tsx` | ⚠️ Different layout |
| `TankSetupScreen.tsx` | `src/app/(auth)/onboarding/page.tsx` | ⚠️ Partial |
| `Dashboard.tsx` | `src/app/(dashboard)/dashboard/page.tsx` | ✅ Matches |
| `BottomTabBar.tsx` | `src/components/navigation/bottom-tab-bar.tsx` | ✅ Matches |
| `TopBar.tsx` | `src/components/navigation/top-bar.tsx` | ✅ Matches |
| `FloatingChatButton.tsx` | `src/components/navigation/floating-chat-button.tsx` | ✅ Matches |
| `ParameterCharts.tsx` | `src/app/(dashboard)/tanks/[id]/parameters/page.tsx` | ✅ Matches |
| `ParameterEntryScreen.tsx` | `src/app/(dashboard)/tanks/[id]/log/page.tsx` | ✅ Matches |
| `SpeciesDatabase.tsx` | `src/app/(dashboard)/species/page.tsx` | ✅ Matches |
| `Maintenance.tsx` | `src/app/(dashboard)/tanks/[id]/maintenance/page.tsx` | ✅ Matches |
| `AIChat.tsx` | `src/components/chat/chat-container.tsx` | ✅ Matches |
| `ChatInput.tsx` | `src/components/chat/chat-input.tsx` | ✅ Matches |
| `ChatTopBar.tsx` | `src/components/chat/chat-top-bar.tsx` | ✅ Matches |
| `TankHeader.tsx` | `src/components/dashboard/tank-header.tsx` | ⚠️ Check health gauge |
| `ParameterCards.tsx` | `src/components/dashboard/parameter-cards.tsx` | ⚠️ Check h-scroll |
| `QuickActions.tsx` | `src/components/dashboard/quick-actions.tsx` | ✅ Matches |
| `AIInsights.tsx` | `src/components/dashboard/ai-insights.tsx` | ✅ Matches |
| `UpcomingMaintenance.tsx` | `src/components/dashboard/upcoming-maintenance.tsx` | ✅ Matches |
| `LivestockSummary.tsx` | `src/components/dashboard/livestock-summary.tsx` | ✅ Matches |
| `HealthScoreGauge` (in TankHeader) | `src/components/dashboard/health-score-gauge.tsx` | ✅ Exists |

---

*This is the canonical reference for all UI/UX decisions in AquaBotAI. When in doubt, consult the Wireframes first, then this document.*
