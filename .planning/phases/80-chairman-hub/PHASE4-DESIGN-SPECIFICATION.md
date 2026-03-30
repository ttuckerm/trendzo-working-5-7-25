# Phase 4: Design Specification
## Chairman's Hub - Complete Design Document

**Date:** February 4, 2026
**Purpose:** Comprehensive specification for building the Chairman's Hub
**Visual Mockups:** See `/assets/chairman-hub-*.png`

---

## Visual Mockups Reference

### PRIMARY VISUAL REFERENCE: Make.com Screenshots

These are the EXACT target design. Match pixel-for-pixel:

| Screenshot | File |
|------------|------|
| Full view (top) | `assets/c__Users_thoma_..._image-45b800cd-8042-464b-929d-341fdd989eab.png` |
| Top half (zoomed) | `assets/c__Users_thoma_..._image-9958a9f0-c6e2-4c7a-b6fd-9668fb4e96b1.png` |
| Bottom half (zoomed) | `assets/c__Users_thoma_..._image-d2810a6f-69a9-4497-a27b-8d45df2d67fa.png` |

### Exact CSS Values
See: `MAKE-CSS-SPECIFICATION.md` in this same directory for every CSS value extracted from screenshots.

### Conceptual Mockups (for layout reference only, NOT pixel-accurate)
| Mockup | File | Description |
|--------|------|-------------|
| Topology concept | `chairman-hub-make-style-topology.png` | Conceptual layout |
| Dashboard concept | `chairman-hub-make-style-dashboard.png` | Conceptual layout |
| Approvals concept | `chairman-hub-make-style-approvals.png` | Conceptual layout |

---

## 1. Page Structure

### Route
```
/admin/chairman
```

### Layout Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                          │
│ [Logo] Chairman's Hub    [Dashboard|Topology]    [Bell] [Avatar]│
├────┬────────────────────────────────────────────────────────────┤
│    │                                                            │
│ S  │                    MAIN CONTENT                            │
│ I  │                                                            │
│ D  │    (Dashboard View OR Topology View based on toggle)       │
│ E  │                                                            │
│ B  │                                                            │
│ A  │                                                            │
│ R  │                                                            │
│    │                                                            │
└────┴────────────────────────────────────────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 Header Bar

| Element | Specification |
|---------|---------------|
| Background | `#0f0f0f` (near black) |
| Height | 64px |
| Logo | Trendzo logo or "C" monogram |
| Title | "Chairman's Hub" - 18px, white, font-weight 600 |
| View Toggle | Pill buttons: "Dashboard" / "Topology" |
| Notification Bell | Icon with red badge if alerts exist |
| User Avatar | 32px circle, links to settings |

### 2.2 Sidebar (Minimal)

| Element | Specification |
|---------|---------------|
| Width | 64px (icons only, no labels) |
| Background | `#1a1a1a` |
| Icons | 24px, gray (#888) default, accent when active |
| Items | Home, Analytics, Users, Settings |
| Active State | Icon color changes to accent (#3b82f6) |

### 2.3 Main Content Area

| Element | Specification |
|---------|---------------|
| Background | `#0f0f0f` |
| Padding | 32px |
| Max Width | 1400px (centered) |

---

## 3. Dashboard View Components

### 3.1 Morning Greeting Banner

**Purpose:** First thing chairman sees - overall status in plain English

| Element | Specification |
|---------|---------------|
| Position | Top of main content |
| Height | ~80px |
| Content | Status dot + greeting message |
| Examples | |
| | 🟢 "Good morning. All systems operational." |
| | 🟡 "Good morning. 2 items need your attention." |
| | 🔴 "ALERT: Payment service is DOWN." |

**Logic:**
```typescript
function getGreeting(): { dot: 'green' | 'yellow' | 'red', message: string } {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  
  if (criticalAlerts > 0) {
    return { dot: 'red', message: `ALERT: ${criticalAlerts[0].message}` };
  }
  if (pendingApprovals > 0 || warnings > 0) {
    return { dot: 'yellow', message: `${timeGreeting}. ${pendingApprovals + warnings} items need your attention.` };
  }
  return { dot: 'green', message: `${timeGreeting}. All systems operational.` };
}
```

### 3.2 Health Status Cards (6 Cards)

**Layout:** 3 columns x 2 rows grid

| Card | Icon | Color | Data Source |
|------|------|-------|-------------|
| System Health | Circuit/chip | Cyan | `/api/chairman/status` |
| AI Performance | Brain/neural | Purple | `/api/chairman/status` |
| Revenue | Dollar/chart | Green | `/api/chairman/revenue` |
| User Activity | People | Orange | `/api/chairman/users` |
| Approvals | Checkbox | Red (if pending) | `/api/chairman/approvals` |
| Data Pipeline | Database | Blue | `/api/chairman/pipeline` |

**Card Structure:**
```
┌──────────────────────────────────────┐
│ [Icon]  Card Title           [Dot]  │
│         Plain English status         │
│         (1-2 lines max)              │
└──────────────────────────────────────┘
```

**Card Styling:**
| Property | Value |
|----------|-------|
| Background | `#1e1e1e` |
| Border | 1px solid `#2a2a2a` |
| Border Radius | 12px |
| Padding | 20px |
| Icon Size | 40px in colored circle |
| Title | 16px, white, font-weight 600 |
| Status Text | 14px, `#a0a0a0` |
| Status Dot | 8px circle, positioned top-right |

**Click Behavior:**
- System Health → Opens detail panel with module status
- AI Performance → Opens accuracy breakdown
- Revenue → Opens revenue trends
- User Activity → Opens user stats
- Approvals → Opens approval queue panel (see 3.4)
- Data Pipeline → Opens pipeline status

### 3.3 Bottom Panels (Strategic Prompt + News)

**Layout:** 2 columns, equal width

#### Strategic Prompt Panel

| Element | Specification |
|---------|---------------|
| Background | `#1e1e1e` |
| Title | "Strategic Prompt" - 14px, `#888` |
| Prompt Text | 18px, white, italic |
| Input Field | Text area for optional response |
| Submit Button | "Submit" - saves to ideas log |
| Dismiss | "Skip" link - marks as seen |

**Prompt Categories (rotates daily):**
1. Value Creation: "What's one feature that could 10x creator retention?"
2. Moat Building: "What data do you have that competitors can't easily get?"
3. Improvement: "Which part of the platform is underutilized?"

#### News Panel

| Element | Specification |
|---------|---------------|
| Background | `#1e1e1e` |
| Title | "Today's News" - 14px, `#888` |
| Items | 3 news headlines max |
| Item Format | Headline (link) + source + time ago |
| Categories | AI news, Marketing news |

**News Item Structure:**
```
• AI Marketing Trends 2024: Hyper-Personalization...
  TechCrunch • 2 hours ago
```

### 3.4 Approval Queue Panel (Slide-Out)

**Trigger:** Click on Approvals card

| Element | Specification |
|---------|---------------|
| Type | Slide-out panel from right |
| Width | 480px |
| Background | `#1a1a1a` |
| Header | "Approval Queue" + count badge + close X |

**Approval Item Card:**
```
┌──────────────────────────────────────────────────┐
│ [Icon]  Title                   [Approve][Reject]│
│         Subtitle • Time ago                      │
└──────────────────────────────────────────────────┘
```

**Approval Types:**
| Type | Icon | Icon Color | Data Source |
|------|------|------------|-------------|
| Payout | Dollar | Green | `payouts` where status='pending' |
| Agency | Building | Blue | `agencies` where needs_approval=true |
| Creator | Person | Orange | `creators` where verification_status='pending' |
| Feature | Toggle | Purple | `feature_toggles` where needs_approval=true |

**Button Actions:**
- Approve → Updates status, shows success toast, refreshes count
- Reject → Opens modal for rejection reason, then updates

---

## 4. Topology View Components

### 4.1 Canvas

| Element | Specification |
|---------|---------------|
| Background | `#0a0a0a` with subtle dot grid |
| Pan | Click and drag to pan |
| Zoom | Scroll wheel to zoom (0.5x - 2x) |
| Library | Recommend: React Flow or similar |

### 4.2 Center Node (TRENDZO CORE)

| Element | Specification |
|---------|---------------|
| Size | 160px x 80px |
| Background | Gradient border (accent color) |
| Icon | AI/brain icon |
| Label | "TRENDZO CORE" |
| Subtitle | "Central Intelligence Active" |
| Position | Center of canvas |

### 4.3 Satellite Nodes (6 nodes)

| Node | Position | Icon | Color |
|------|----------|------|-------|
| Prediction Engine | Top-left | Brain | Purple |
| Revenue System | Top-right | Dollar | Green |
| Creator Platform | Left | Person | Orange |
| Agency Portal | Right | Building | Blue |
| Training Pipeline | Bottom-left | Database | Cyan |
| Admin Tools | Bottom-right | Gear | Gray |

**Node Structure:**
```
┌────────────────────────────┐
│ [Icon]  Node Name     [●]  │
│         Status text        │
└────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Size | 200px x 70px |
| Background | `#1e1e1e` |
| Border | 2px solid (node color, subtle) |
| Border Radius | 8px |
| Status Dot | 10px, top-right corner |

### 4.4 Connection Lines

| Property | Value |
|----------|-------|
| Color | `#333` default, node color on hover |
| Width | 2px |
| Style | Bezier curves |
| Animation | Subtle pulse when data flowing |
| Arrows | Small arrow heads showing direction |

### 4.5 Click Behavior

- Click node → Opens detail panel for that system
- Hover node → Highlights connections to that node
- Double-click → Navigates to that system's admin page

### 4.6 Legend

| Element | Specification |
|---------|---------------|
| Position | Bottom-right corner |
| Content | Green = Healthy, Yellow = Warning, Red = Critical |
| Style | Small, semi-transparent background |

---

## 5. Interaction Patterns

### 5.1 View Toggle

| Action | Result |
|--------|--------|
| Click "Dashboard" | Shows health cards view |
| Click "Topology" | Shows node map view |
| State Persistence | Remember last view in localStorage |

### 5.2 Notifications

| Element | Specification |
|---------|---------------|
| Bell Icon | Shows red badge with count if alerts |
| Click | Opens notification dropdown |
| Items | Recent alerts, approval requests |
| Mark Read | Click to dismiss |

### 5.3 Auto-Refresh

| Data | Refresh Interval |
|------|-----------------|
| Health status | Every 60 seconds |
| Approval count | Every 30 seconds |
| News | Every 15 minutes |
| Prompts | Once per day (midnight) |

### 5.4 Loading States

| State | Display |
|-------|---------|
| Initial Load | Skeleton cards (gray pulsing rectangles) |
| Refreshing | Subtle spinner in corner, data stays visible |
| Error | Red banner with retry button |

---

## 6. Mobile Responsiveness

### Breakpoints

| Screen | Layout |
|--------|--------|
| Desktop (>1200px) | Full layout as designed |
| Tablet (768-1200px) | 2-column grid, sidebar collapses |
| Mobile (<768px) | Single column, no topology view |

### Mobile Specific

- Hide topology view toggle (dashboard only)
- Stack health cards vertically
- Full-width approval panel
- Bottom navigation bar instead of sidebar

---

## 7. Color System (Make.com Style)

### Base Colors

| Name | Hex | Usage |
|------|-----|-------|
| Canvas Background | `#e8f5e9` | Light mint/sage green canvas |
| Sidebar | `#1a1a1a` | Black sidebar |
| Card/Panel | `#ffffff` | White cards and right panel |
| Border | `#e0e0e0` | Subtle gray borders |
| Text Primary | `#1a1a1a` | Dark text on light backgrounds |
| Text Secondary | `#666666` | Subtitles, descriptions |
| Text Muted | `#999999` | Hints, timestamps |

### Status Colors

| Status | Hex | Usage |
|--------|-----|-------|
| Healthy | `#22c55e` | Green dot, success states |
| Warning | `#eab308` | Yellow dot, attention needed |
| Critical | `#ef4444` | Red dot, urgent action |
| Info | `#3b82f6` | Blue, informational |

### Accent Colors (Node Icons)

| System | Hex |
|--------|-----|
| System Health | `#06b6d4` (Cyan) |
| AI Performance | `#a855f7` (Purple) |
| Revenue | `#22c55e` (Green) |
| User Activity | `#f97316` (Orange) |
| Approvals | `#ef4444` (Red) |
| Data Pipeline | `#3b82f6` (Blue) |

---

## 8. Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page Title | Inter | 24px | 700 |
| Card Title | Inter | 16px | 600 |
| Body Text | Inter | 14px | 400 |
| Status Text | Inter | 14px | 400 |
| Small Text | Inter | 12px | 400 |
| Prompt Text | Inter | 18px | 400 italic |

---

## 9. API Requirements

### Endpoints to Build

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chairman/status` | GET | Unified health for all 6 areas |
| `/api/chairman/revenue` | GET | Revenue metrics + plain English |
| `/api/chairman/users` | GET | User activity + plain English |
| `/api/chairman/approvals` | GET | Approval queue with counts |
| `/api/chairman/approvals/:id` | POST | Approve/reject an item |
| `/api/chairman/pipeline` | GET | Pipeline status + plain English |
| `/api/chairman/prompts` | GET | Today's prompt + news |
| `/api/chairman/prompts/dismiss` | POST | Mark prompt as seen |
| `/api/chairman/alerts/sms` | POST | Trigger SMS alert |
| `/api/chairman/alerts/config` | GET/POST | Alert configuration |

### Response Format (All Endpoints)

```typescript
interface ChairmanResponse<T> {
  data: T;
  plain_english: string; // Human-readable summary
  status: 'healthy' | 'warning' | 'critical';
  updated_at: string; // ISO timestamp
}
```

---

## 10. Database Requirements

### New Tables

```sql
-- Alert configuration
CREATE TABLE chairman_alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  threshold NUMERIC,
  cooldown_minutes INT DEFAULT 30,
  channels TEXT[] DEFAULT ARRAY['sms', 'in_app'],
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategic prompts library
CREATE TABLE strategic_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'value', 'moat', 'improvement'
  prompt_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  times_shown INT DEFAULT 0,
  last_shown_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chairman's ideas log (from prompt responses)
CREATE TABLE chairman_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES strategic_prompts(id),
  response_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval action log
CREATE TABLE approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_type TEXT NOT NULL, -- 'payout', 'agency', 'creator', 'feature'
  item_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'approved', 'rejected'
  reason TEXT,
  acted_by UUID REFERENCES profiles(id),
  acted_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 11. External Integrations

### Twilio (SMS Alerts)

| Config | Value |
|--------|-------|
| Service | Twilio SMS API |
| Env Vars | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| Chairman Phone | `CHAIRMAN_PHONE_NUMBER` |
| Message Format | "TRENDZO ALERT: [message]. Check hub for details." |

### News API (Recommended: Perplexity or Bing)

| Config | Value |
|--------|-------|
| Service | Perplexity API or Bing News API |
| Env Var | `NEWS_API_KEY` |
| Queries | "AI technology news", "digital marketing trends" |
| Refresh | Every 15 minutes, cache results |
| Limit | 3 headlines per category |

---

## 12. Implementation Order

### Phase 5A: Foundation (Day 1)

1. Create `/admin/chairman/page.tsx` with basic layout
2. Create sidebar and header components
3. Implement view toggle (Dashboard/Topology state)
4. Set up dark theme styling

### Phase 5B: Dashboard View (Day 1-2)

1. Build morning greeting banner component
2. Build health status card component
3. Create `/api/chairman/status` endpoint
4. Connect cards to real data
5. Implement click-to-expand detail panels

### Phase 5C: Approvals System (Day 2)

1. Create `/api/chairman/approvals` endpoint
2. Build approval queue slide-out panel
3. Implement approve/reject actions
4. Add success/error toasts

### Phase 5D: Strategic Prompts + News (Day 2-3)

1. Create `strategic_prompts` table with seed data
2. Create `/api/chairman/prompts` endpoint
3. Build prompts panel component
4. Integrate news API
5. Build news panel component

### Phase 5E: SMS Alerts (Day 3)

1. Set up Twilio account (manual step)
2. Create `/api/chairman/alerts/sms` endpoint
3. Create alert configuration table
4. Build alert config UI
5. Connect health monitoring to trigger alerts

### Phase 5F: Topology View (Day 3-4)

1. Install React Flow library
2. Build canvas with center node
3. Add satellite nodes with real data
4. Implement connection lines
5. Add click behaviors and hover states

### Phase 5G: Polish (Day 4-5)

1. Loading skeletons
2. Error states
3. Mobile responsiveness
4. Auto-refresh implementation
5. Testing all flows end-to-end

---

## 13. Files to Create

```
src/app/admin/chairman/
├── page.tsx                    # Main page component
├── layout.tsx                  # Layout with sidebar
├── components/
│   ├── ChairmanHeader.tsx      # Header with toggle
│   ├── ChairmanSidebar.tsx     # Minimal icon sidebar
│   ├── DashboardView.tsx       # Dashboard view container
│   ├── TopologyView.tsx        # Node map view container
│   ├── GreetingBanner.tsx      # Morning greeting
│   ├── HealthCard.tsx          # Individual health card
│   ├── HealthCardGrid.tsx      # 6-card grid
│   ├── ApprovalsPanel.tsx      # Slide-out approval queue
│   ├── ApprovalItem.tsx        # Single approval card
│   ├── StrategicPrompt.tsx     # Prompt panel
│   ├── NewsPanel.tsx           # News headlines panel
│   ├── TopologyCanvas.tsx      # React Flow canvas
│   ├── TopologyNode.tsx        # Custom node component
│   └── DetailPanel.tsx         # Expandable detail view

src/app/api/chairman/
├── status/route.ts             # Unified health status
├── revenue/route.ts            # Revenue metrics
├── users/route.ts              # User activity
├── approvals/route.ts          # Approval queue
├── approvals/[id]/route.ts     # Approve/reject action
├── pipeline/route.ts           # Pipeline status
├── prompts/route.ts            # Strategic prompts + news
├── prompts/dismiss/route.ts    # Mark prompt seen
└── alerts/
    ├── sms/route.ts            # Trigger SMS
    └── config/route.ts         # Alert configuration

src/lib/chairman/
├── types.ts                    # TypeScript types
├── plain-english.ts            # Plain English generators
├── thresholds.ts               # Status threshold logic
└── twilio.ts                   # Twilio integration
```

---

## 14. Success Criteria

When Phase 5 is complete, the chairman can:

| Action | Expected Result |
|--------|-----------------|
| Navigate to `/admin/chairman` | See dashboard with 6 health cards |
| Read greeting banner | Understand overall status in one sentence |
| Click any health card | See detailed breakdown |
| Click Approvals | See all pending items, approve/reject |
| Toggle to Topology | See visual map of all systems |
| Click a node | See that system's status |
| Receive critical alert | Get SMS on phone within 60 seconds |
| Check strategic prompt | See thought-provoking question |
| View news | See 3 recent AI/marketing headlines |

**All of the above with REAL data, not mocks.**

---

## Phase 4 Complete

This design specification provides everything needed to build the Chairman's Hub:

- Visual mockups showing exact layout
- Component specifications with colors, sizes, behaviors
- API specifications with endpoints and response formats
- Database schemas for new tables
- Implementation order with daily breakdown
- File structure for organized code
- Success criteria for verification

**Ready for Phase 5 build in Claude Code.**
