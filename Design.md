# TRENDZO DESIGN SYSTEM
### Unified Design Language — All Three Platform Layers
**Version:** 1.0 | **Date:** April 2026
**Usage:** Drop this file in the root of the Trendzo repo. Reference it in every Cursor prompt with: "Follow DESIGN.md in the project root for all styling decisions."

---

## CORE PHILOSOPHY

Trendzo has three distinct user layers. Each layer serves a different person with a different job. The design language is unified — same tokens, same typography, same component DNA — but applied differently per layer. A creator should feel inspired. An agency operator should feel in control. The chairman should feel omniscient.

**Design non-negotiables across all layers:**
- Dark surfaces only. No light mode.
- Premium, restrained aesthetic. Never loud, never cheap.
- Functionality is downstream of great design. If it doesn't feel right, it isn't right.
- No gradients on surfaces. Gradients only on accent elements where intentional.
- Glassmorphism is permitted on card overlays and modal surfaces only — never on primary backgrounds.

---

## COLOR SYSTEM

These 5 tokens are the entire palette. Every color decision across all three layers derives from these.

```
--color-surface-primary:    #282929   /* Primary dark background — all pages */
--color-surface-secondary:  #1E1F1F   /* Deeper background — sidebars, panels */
--color-surface-elevated:   #323434   /* Elevated cards, modals, tooltips */
--color-surface-border:     #3A3C3C   /* All borders, dividers, separators */

--color-accent-blue:        #6C92A0   /* Primary accent — active states, links, indicators */
--color-accent-blue-muted:  #4A6B78   /* Hover states, secondary accent */
--color-accent-blue-subtle: #2A3D44   /* Subtle accent backgrounds, active nav bg */

--color-accent-coral:       #C07B74   /* Secondary accent — alerts, highlights, CTA */
--color-accent-coral-muted: #9A5E58   /* Hover on coral elements */
--color-accent-coral-subtle:#3D2523   /* Subtle coral backgrounds, warning states */

--color-text-primary:       #D4D4D4   /* All primary body text */
--color-text-secondary:     #A8A9A9   /* Labels, subtitles, muted text */
--color-text-tertiary:      #6B6D6D   /* Placeholder text, disabled states */
--color-text-inverse:       #1E1F1F   /* Text on light/accent backgrounds */

--color-status-success:     #4A8C6A   /* Built, done, live, healthy */
--color-status-success-bg:  #1A2E23   /* Success background */
--color-status-warning:     #9A7A3A   /* Partial, pending, in progress */
--color-status-warning-bg:  #2E2410   /* Warning background */
--color-status-error:       #8C4A4A   /* Error, blocked, failed */
--color-status-error-bg:    #2E1A1A   /* Error background */
--color-status-active:      #6C92A0   /* Active layer, current state — uses accent blue */
--color-status-active-bg:   #1A2830   /* Active background */
```

**Status badge color map:**
| State | Text color | Background |
|---|---|---|
| BUILT / DONE / LIVE | `#4A8C6A` | `#1A2E23` |
| ACTIVE / IN PROGRESS | `#6C92A0` | `#1A2830` |
| PARTIAL / PENDING | `#9A7A3A` | `#2E2410` |
| BLOCKED / ERROR | `#8C4A4A` | `#2E1A1A` |
| NOT STARTED | `#6B6D6D` | `#282929` |

---

## TYPOGRAPHY

```
--font-sans:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif
--font-mono:  'JetBrains Mono', 'Fira Code', monospace

/* Scale */
--text-xs:    11px / line-height 1.4 / weight 400   /* Labels, badges, captions */
--text-sm:    13px / line-height 1.5 / weight 400   /* Secondary body, subtitles */
--text-base:  15px / line-height 1.6 / weight 400   /* Primary body text */
--text-md:    17px / line-height 1.6 / weight 400   /* Larger body, card content */
--text-lg:    20px / line-height 1.4 / weight 500   /* Section headers */
--text-xl:    24px / line-height 1.3 / weight 500   /* Page titles */
--text-2xl:   32px / line-height 1.2 / weight 500   /* Hero numbers, metrics */

/* Two weights only */
400 — all body text, labels, secondary content
500 — headings, metric values, active states, badge text

/* Never use 600, 700, or 800 — too heavy against dark surfaces */
```

---

## SPACING & RADIUS

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px

--radius-sm:  4px    /* Badges, pills, small tags */
--radius-md:  8px    /* Buttons, inputs, small cards */
--radius-lg:  12px   /* Standard cards */
--radius-xl:  16px   /* Large cards, modals */
--radius-full: 9999px /* Fully rounded pills, avatars */

/* Borders: always 1px solid var(--color-surface-border) */
/* Never use box-shadow for depth — use background color contrast instead */
```

---

## SHARED COMPONENTS (ALL LAYERS)

### Status Badge
```css
.badge {
  font-size: var(--text-xs);
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
```

### Card
```css
.card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
}
```

### Metric Value
```css
.metric-value {
  font-size: var(--text-2xl);
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.2;
}
.metric-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
```

### Input / Textarea
```css
.input {
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  height: 36px;
}
.input:focus {
  border-color: var(--color-accent-blue);
  outline: none;
}
.input::placeholder {
  color: var(--color-text-tertiary);
}
```

### Primary Button (Coral CTA)
```css
.btn-primary {
  background: var(--color-accent-coral);
  color: var(--color-text-primary);
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 20px;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
}
.btn-primary:hover { background: var(--color-accent-coral-muted); }
```

### Secondary Button (Ghost)
```css
.btn-secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-md);
  padding: 8px 20px;
  font-size: var(--text-sm);
  font-weight: 400;
  cursor: pointer;
}
.btn-secondary:hover {
  border-color: var(--color-accent-blue);
  color: var(--color-text-primary);
}
```

---

---

# LAYER 1 — CREATOR / USER SURFACE
**Route:** `/admin/studio` and creator-facing public routes
**User:** Content creators
**Job to be done:** Get inspired, discover viral patterns, generate content ideas fast
**Feeling:** Energetic, content-forward, playful but premium

## Layer 1 Design Principles
- Lead with visual content. Video thumbnails and cards are the hero.
- Color is used more liberally here than other layers — category pills use vibrant accent colors
- Large CTAs. Creators need clear, obvious next actions.
- Horizontal scrolling carousels for category filters
- The dark surface recedes — the content thumbnails are the focus

## Layer 1 Specific Tokens
```
/* Category pill accent colors — used only on this layer */
--creator-pill-finance:       #4A8C6A border + text
--creator-pill-fitness:       #6C92A0 border + text
--creator-pill-business:      #9A7A3A border + text
--creator-pill-beauty:        #C07B74 border + text
--creator-pill-realestate:    #7A6A9A border + text
--creator-pill-food:          #6A8A4A border + text

/* Active pill: filled with accent color, dark text */
/* Inactive pill: dark surface, colored border and text */
```

## Layer 1 Layout
```
Header: full-width dark bar, Trendzo wordmark left, search center, user right
Sub-nav: centered icon pill row (category filter icons)
Page title: left-aligned, purple gradient text for brand names (e.g. "Viral DNA™")
Filter pills: horizontal scroll, colored borders per category
CTA bar: centered, coral background button, bold lowercase text
Content grid: 4-column video card grid, 16px gap
```

## Layer 1 Video Card
```css
.video-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-xl);
  overflow: hidden;
  aspect-ratio: 9/16;
  position: relative;
  cursor: pointer;
}
/* Thumbnail fills card */
/* Play button: centered, 48px circle, white with 0.8 opacity bg */
/* Bottom overlay: gradient from transparent to #000 at 0.7 opacity */
/* Caption text: white, 13px, bottom 16px left 16px */
/* Three-dot menu: top right, 8px from corner */
```

---

---

# LAYER 2 — AGENCY SURFACE
**Route:** `/agency` (Intelligent Clay) and `/agency/dashboard`
**User:** Agency operators managing creator rosters
**Job to be done:** Run their creator business, generate briefs, review performance, manage relationships
**Feeling:** Operational, intelligent, conversational — a tool that thinks with you

## Layer 2 Design Principles
- The chat IS the interface. Everything else is secondary context.
- Minimal chrome. The operator's attention belongs on the conversation.
- Status indicators are always visible — engine active/inactive, alert counts
- Data surfaces support the conversation — they don't compete with it
- Suggested action chips replace buttons wherever possible

## Layer 2 Specific Tokens
```
/* Engine indicator */
--agency-engine-active:   #6C92A0   /* Teal-blue pulsing dot */
--agency-engine-inactive: #6B6D6D   /* Gray static dot */

/* Chat bubbles */
--agency-bubble-ai:       var(--color-surface-elevated)   /* AI messages */
--agency-bubble-user:     var(--color-accent-blue-subtle) /* User messages */
--agency-bubble-system:   transparent                     /* System/status messages, centered */

/* Suggested action chips */
--agency-chip-bg:         var(--color-surface-elevated)
--agency-chip-border:     var(--color-surface-border)
--agency-chip-hover-border: var(--color-accent-blue)
```

## Layer 2 Layout — Intelligent Clay
```
Header: minimal — wordmark left, engine status center, dashboard link + menu right
Left sidebar: icon-only navigation, 48px wide, secondary surface background
Main: full-height chat surface, centered content column (max-width 800px)
Suggested chips: 2x2 grid above first message, fade out after first user input
Chat thread: scrollable, messages bottom-anchored
Input bar: fixed bottom, full width of content column, microphone + text + send
```

## Layer 2 Chat Message Styles
```css
/* AI message */
.msg-ai {
  align-self: flex-start;
  max-width: 85%;
  background: var(--color-surface-elevated);
  border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
  padding: 12px 16px;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

/* User message */
.msg-user {
  align-self: flex-end;
  max-width: 75%;
  background: var(--color-accent-blue-subtle);
  border: 1px solid var(--color-accent-blue-muted);
  border-radius: var(--radius-lg) 0 var(--radius-lg) var(--radius-lg);
  padding: 12px 16px;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

/* System / status message */
.msg-system {
  align-self: center;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 4px 0;
}
```

## Layer 2 Suggested Action Chip
```css
.action-chip {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  text-align: left;
}
.action-chip:hover {
  border-color: var(--color-accent-blue);
  color: var(--color-text-primary);
}
```

---

---

# LAYER 3 — CHAIRMAN / ADMIN SURFACE
**Route:** `/admin/chairman` and all `/admin/` routes
**User:** Tommy (Chairman) and sub-admins
**Job to be done:** Omniscience over the entire platform — macro visibility + project-level zoom + AI-powered build management
**Feeling:** Claude editorial layout — clean, intelligent, editorial. Information-dense but never cluttered.

## Layer 3 Design Principles
- **Split screen always.** Left = AI conversation. Right = live dashboard. They are one system.
- Inspired by Claude.ai's UI: clean editorial layout, generous whitespace, flat surfaces, restrained color
- The accent colors from the palette replace Claude's orange/terracotta — same structure, Trendzo colors
- Information hierarchy is strict: metric > label. Status > detail. Alert > normal state.
- Right panel tabs (Map / Queue / Decisions / Loops) are the navigation — no separate pages
- Zoom states: macro view (full platform) → project zoom (single workstream) — back button always visible in zoom
- Sub-admins see the same surface with role-scoped data

## Layer 3 Specific Tokens
```
/* Split screen */
--chairman-divider:           var(--color-surface-border)  /* 1px vertical divider */
--chairman-panel-left-bg:     var(--color-surface-primary) /* Chat panel */
--chairman-panel-right-bg:    var(--color-surface-secondary) /* Dashboard panel */

/* Chat panel */
--chairman-bubble-ai:         var(--color-surface-elevated)
--chairman-bubble-user:       #2A3D44  /* Uses accent-blue-subtle, slightly deeper */
--chairman-bubble-user-border: var(--color-accent-blue-muted)
--chairman-system-msg:        var(--color-text-tertiary)

/* Dashboard panel */
--chairman-tab-active:        var(--color-text-primary)
--chairman-tab-active-border: var(--color-accent-blue)  /* 2px bottom border */
--chairman-tab-inactive:      var(--color-text-tertiary)

/* Layer map rows */
--chairman-row-active-bg:     var(--color-status-active-bg)
--chairman-row-active-border: var(--color-accent-blue)  /* left border accent, 3px */

/* Progress bars */
--chairman-progress-done:     var(--color-status-success)
--chairman-progress-active:   var(--color-accent-blue)
--chairman-progress-blocked:  var(--color-surface-border)
--chairman-progress-track:    var(--color-surface-border)
--chairman-progress-height:   3px

/* Platform pulse metric cards */
--chairman-pulse-bg:          var(--color-surface-elevated)
--chairman-pulse-border:      var(--color-surface-border)

/* Project tiles */
--chairman-tile-bg:           var(--color-surface-elevated)
--chairman-tile-border:       var(--color-surface-border)
--chairman-tile-active-border: var(--color-accent-blue)   /* 3px left border */
--chairman-tile-hover-border: var(--color-accent-blue-muted)
```

## Layer 3 Layout — Chairman OS
```
Full viewport. No scroll on outer container.

LEFT PANEL (50% width):
  Header: "Chairman OS" label (text-sm, weight 500) + status badge
  Chat thread: scrollable, flex column, gap 12px, padding 16px
  Input bar: fixed at bottom of left panel, border-top divider

RIGHT PANEL (50% width):
  Header: "Build Dashboard" label + zoom state indicator (dot + layer name)
  Tab row: Map | Queue | Decisions | Loops — text-xs, uppercase, letter-spacing
  Tab content: scrollable, padding 12px

MACRO VIEW (default, Map tab):
  Platform Pulse row: 5 metric cards in one row, compact height
  Alert bar: appears only when alerts exist — coral left border, amber background
  Project tiles: 2-column grid, each tile zoomable

ZOOM VIEW (when tile clicked):
  Back button: top-left, arrow + layer name, text-sm, accent-blue color
  Tile-specific content fills the right panel
  Active tab content updates to match the zoomed project
```

## Layer 3 Components

### Platform Pulse Card
```css
.pulse-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  flex: 1;
}
.pulse-value {
  font-size: var(--text-lg);
  font-weight: 500;
  color: var(--color-text-primary);
}
.pulse-label {
  font-size: 10px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 2px;
}
```

### Layer Map Row
```css
.layer-row {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
/* Active row override */
.layer-row.active {
  background: var(--color-status-active-bg);
  border-color: var(--color-accent-blue);
  border-left-width: 3px;
}
```

### Skill Queue Card
```css
.skill-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
}
/* Active skill override */
.skill-card.active {
  border-color: var(--color-accent-blue);
  border-left-width: 3px;
  background: var(--color-status-active-bg);
}
.skill-progress-track {
  height: 3px;
  background: var(--color-surface-border);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}
.skill-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}
```

### Project Tile
```css
.project-tile {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-surface-border);
  border-left: 3px solid var(--color-surface-border);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.project-tile:hover {
  border-color: var(--color-accent-blue-muted);
  border-left-color: var(--color-accent-blue);
}
.project-tile.active {
  border-left-color: var(--color-accent-blue);
  background: var(--color-status-active-bg);
}
```

### Chairman Chat Bubbles
```css
/* AI bubble */
.chairman-bubble-ai {
  align-self: flex-start;
  max-width: 88%;
  background: var(--color-surface-elevated);
  border-radius: 2px var(--radius-lg) var(--radius-lg) var(--radius-lg);
  padding: 10px 14px;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  line-height: 1.6;
}

/* User bubble */
.chairman-bubble-user {
  align-self: flex-end;
  max-width: 80%;
  background: #2A3D44;
  border: 1px solid var(--color-accent-blue-muted);
  border-radius: var(--radius-lg) 2px var(--radius-lg) var(--radius-lg);
  padding: 10px 14px;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  line-height: 1.6;
}

/* System / tool update message */
.chairman-msg-system {
  align-self: center;
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 2px 0;
  font-style: italic;
}
```

### Alert Bar
```css
.alert-bar {
  background: var(--color-accent-coral-subtle);
  border: 1px solid var(--color-accent-coral-muted);
  border-left: 3px solid var(--color-accent-coral);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: var(--text-sm);
  color: var(--color-accent-coral);
  display: flex;
  align-items: center;
  gap: 8px;
}
```

---

## ADMIN DASHBOARD PAGES (all /admin/ routes)

All `/admin/` pages share the same outer shell:

```
Outer shell:
  Background: var(--color-surface-primary) — full viewport
  Left sidebar: 48px wide, var(--color-surface-secondary), icon-only nav
  Top header: full width, var(--color-surface-secondary), 1px bottom border
    - Left: TZ logo square (coral background, white T), page title
    - Center: search bar (max-width 400px)
    - Right: notification bell, user name, avatar, sign out

Content area:
  Padding: 24px
  Max-width: none — full width minus sidebar
  Gap between sections: 24px
```

Page-level metric cards on admin pages use the same `.pulse-card` component from Layer 3 but larger — `text-2xl` for values.

---

## CURSOR USAGE INSTRUCTIONS

When Cursor generates any new component, page, or feature for Trendzo:

1. Identify which layer the component belongs to (Creator / Agency / Chairman)
2. Use only the color tokens defined in this file — no hardcoded hex values except those listed here
3. Match the layout structure for that layer exactly
4. Use Inter font at the weights specified (400 and 500 only)
5. All borders are 1px solid `--color-surface-border` unless a status override applies
6. No box shadows. Depth is created through background color contrast only.
7. No light backgrounds on any surface — this is a dark-only system
8. Status states always use the badge color map defined in the Color System section
9. Active/selected states always use `--color-accent-blue` — never coral for active states
10. Coral (`--color-accent-coral`) is reserved for: CTAs, alerts, and the Trendzo logo only

---
*Trendzo DESIGN.md v1.0 | April 2026 | Drop in repo root — reference in every Cursor prompt*