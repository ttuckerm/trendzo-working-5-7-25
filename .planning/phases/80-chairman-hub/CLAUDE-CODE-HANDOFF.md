# Chairman's Hub - Claude Code Build Handoff

**Date:** February 4, 2026 (Updated)
**Purpose:** Complete context for building the Chairman's Hub in Claude Code
**Estimated Build Time:** 3-5 days (8-hour workdays)

---

## Quick Start for Claude Code

**STEP 1: Design test in sandbox first. Copy this into Claude Code:**

```
I need to build a design test page for the Chairman's Hub at /sandbox/chairman-design-test.

Read these files first:
1. .planning/phases/80-chairman-hub/MAKE-CSS-SPECIFICATION.md (EXACT CSS values)
2. .planning/phases/80-chairman-hub/PHASE4-DESIGN-SPECIFICATION.md (component specs)

Look at these Make.com screenshots as the EXACT visual target (match pixel-for-pixel):
- assets/c__Users_thoma_AppData_Roaming_Cursor_User_workspaceStorage_29f734521cb0efe90408c6c93856cf4e_images_image-45b800cd-8042-464b-929d-341fdd989eab.png
- assets/c__Users_thoma_AppData_Roaming_Cursor_User_workspaceStorage_29f734521cb0efe90408c6c93856cf4e_images_image-9958a9f0-c6e2-4c7a-b6fd-9668fb4e96b1.png
- assets/c__Users_thoma_AppData_Roaming_Cursor_User_workspaceStorage_29f734521cb0efe90408c6c93856cf4e_images_image-d2810a6f-69a9-4497-a27b-8d45df2d67fa.png

Build a SANDBOX test page at src/app/sandbox/chairman-design-test/page.tsx that renders:
1. Black sidebar (60px, icons only)
2. Light canvas background with dot grid
3. 4-5 sample nodes in pastel colors with icons
4. Connection lines between nodes (bezier curves)
5. White right panel with collapsible sections
6. Bottom toolbar with "Run audit" button

Use HARDCODED static content only - no real data. This is purely a visual design test.
Match the Make.com screenshots EXACTLY in terms of colors, spacing, typography, shadows, and layout.
```

**STEP 2: After design is approved, start the real build:**

```
The sandbox design test at /sandbox/chairman-design-test looks good.

Now read ALL of these files:
1. .planning/phases/80-chairman-hub/PHASE1-VISUAL-RESEARCH.md (design direction)
2. .planning/phases/80-chairman-hub/PHASE2-WORKFLOW-MAPPING.md (user workflows)
3. .planning/phases/80-chairman-hub/PHASE3-INFORMATION-ARCHITECTURE.md (data sources)
4. .planning/phases/80-chairman-hub/PHASE4-DESIGN-SPECIFICATION.md (build spec)
5. .planning/phases/80-chairman-hub/MAKE-CSS-SPECIFICATION.md (exact CSS)
6. .planning/phases/80-chairman-hub/CLAUDE-CODE-HANDOFF.md (this file)

Reuse the components from the sandbox test. Start Phase 5A: Create /admin/chairman with real data.
```

---

## What We're Building

A **Chairman's Hub** - a centralized command center for the super admin that:

1. Shows overall business health in **plain English** (not raw numbers)
2. Has **two views**: Dashboard (cards) and Topology (node map)
3. Provides **approval queue** for payouts, agencies, features
4. Sends **SMS alerts** for critical issues
5. Shows **strategic prompts** and **news** daily

---

## Design Direction Summary

**PRIMARY VISUAL REFERENCE:** Make.com screenshots (see file paths in Quick Start above)
**CSS SPECIFICATION:** `.planning/phases/80-chairman-hub/MAKE-CSS-SPECIFICATION.md`

| Aspect | Decision |
|--------|----------|
| Theme | **Make.com style** - Light canvas, black sidebar (NOT dark mode) |
| Canvas | Light off-white/mint `#f5f5f0` with dot grid |
| Sidebar | Solid black `#2d2d2d`, 60px wide, icons only |
| Nodes/Cards | Pastel colored backgrounds (pink, blue, green, purple) |
| Right Panel | White `#ffffff`, 300px wide, collapsible sections |
| Bottom Toolbar | White, 52px tall, "Run audit" button |
| Primary View | Dashboard with 6 health cards |
| Secondary View | Node/topology map (EXACTLY like Make.com) |
| Information Style | Plain English sentences, not raw metrics |
| Alert Method | SMS to phone for critical, visual indicators for rest |

---

## The 6 Health Areas

| Area | Green State | Yellow State | Red State |
|------|-------------|--------------|-----------|
| **System Health** | "All services running" | "Service X slow" | "Service X DOWN" |
| **AI Performance** | "78% accuracy" | "Accuracy dropped 5%" | "Accuracy < 60%" |
| **Revenue** | "Up 12% this week" | "Flat for 3 days" | "Down > 15%" |
| **User Activity** | "147 active creators" | "Logins down 10%" | "Logins down 20%+" |
| **Approvals** | "No pending" | "3 items pending" | "Items > 48h old" |
| **Data Pipeline** | "Healthy" | "Processing slow" | "Pipeline stopped" |

---

## Build Order (Daily Breakdown)

### Day 0: SANDBOX DESIGN TEST (Do This First!)

**CRITICAL:** Build in sandbox BEFORE touching the real site.

**Tasks:**
1. Create `/sandbox/chairman-design-test/page.tsx`
2. Build ALL visual components with HARDCODED static content:
   - Black sidebar (60px, icons only)
   - Light canvas with dot grid background
   - 4-5 sample nodes in pastel colors
   - Bezier connection lines between nodes
   - White right panel with collapsible sections
   - Bottom toolbar with "Run audit" button
3. Match the Make.com screenshots PIXEL FOR PIXEL
4. Reference: `.planning/phases/80-chairman-hub/MAKE-CSS-SPECIFICATION.md`

**Verification:** Navigate to `/sandbox/chairman-design-test` and compare side-by-side with Make.com screenshots. User must approve before proceeding.

**DO NOT PROCEED TO DAY 1 UNTIL USER APPROVES THE SANDBOX DESIGN.**

---

### Day 1: Foundation + Dashboard Structure

**Tasks:**
1. Copy approved sandbox components to `/admin/chairman/`
2. Create `/admin/chairman/page.tsx` and `/admin/chairman/layout.tsx`
3. Implement Dashboard/Topology view toggle
4. Build `GreetingBanner` component
5. Build `HealthCard` component (static first)
6. Create 6-card grid layout

**Verification:** Navigate to `/admin/chairman`, see layout with placeholder cards

### Day 2: Real Data + Approvals

**Tasks:**
1. Create `/api/chairman/status` endpoint (aggregates all health)
2. Create `/api/chairman/approvals` endpoint
3. Connect health cards to real data
4. Build `ApprovalsPanel` slide-out
5. Implement approve/reject actions
6. Create `/api/chairman/revenue` endpoint
7. Create `/api/chairman/users` endpoint

**Verification:** All 6 cards show real data, approvals panel works with real pending items

### Day 3: Prompts + News + SMS

**Tasks:**
1. Create `strategic_prompts` table + seed data
2. Create `/api/chairman/prompts` endpoint
3. Build `StrategicPrompt` panel
4. Integrate news API (Perplexity or Bing)
5. Build `NewsPanel` component
6. Set up Twilio integration
7. Create `/api/chairman/alerts/sms` endpoint
8. Create alert trigger logic in health monitoring

**Verification:** See daily prompt, see real news, receive test SMS

### Day 4: Topology View

**Tasks:**
1. Install React Flow: `npm install reactflow`
2. Build `TopologyCanvas` component
3. Create `TopologyNode` custom node
4. Add 6 satellite nodes + center node
5. Connect nodes with bezier lines
6. Implement click behaviors
7. Add hover highlighting

**Verification:** Toggle to Topology view, see node map, click nodes to drill down

### Day 5: Polish + Testing

**Tasks:**
1. Add loading skeletons to all components
2. Add error states with retry buttons
3. Implement auto-refresh (60s health, 30s approvals)
4. Test mobile responsiveness
5. Test all approval flows end-to-end
6. Test SMS alert delivery
7. Fix any bugs found

**Verification:** Everything works smoothly, no errors, mobile looks good

---

## Key Files to Create

### Pages
```
src/app/admin/chairman/page.tsx
src/app/admin/chairman/layout.tsx
```

### Components
```
src/app/admin/chairman/components/
├── ChairmanHeader.tsx
├── ChairmanSidebar.tsx
├── DashboardView.tsx
├── TopologyView.tsx
├── GreetingBanner.tsx
├── HealthCard.tsx
├── HealthCardGrid.tsx
├── ApprovalsPanel.tsx
├── ApprovalItem.tsx
├── StrategicPrompt.tsx
├── NewsPanel.tsx
├── TopologyCanvas.tsx
├── TopologyNode.tsx
└── DetailPanel.tsx
```

### API Routes
```
src/app/api/chairman/
├── status/route.ts
├── revenue/route.ts
├── users/route.ts
├── approvals/route.ts
├── approvals/[id]/route.ts
├── pipeline/route.ts
├── prompts/route.ts
├── prompts/dismiss/route.ts
└── alerts/
    ├── sms/route.ts
    └── config/route.ts
```

### Library
```
src/lib/chairman/
├── types.ts
├── plain-english.ts
├── thresholds.ts
└── twilio.ts
```

---

## Database Migrations Needed

Create file: `supabase/migrations/YYYYMMDD_chairman_hub.sql`

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
  category TEXT NOT NULL CHECK (category IN ('value', 'moat', 'improvement')),
  prompt_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  times_shown INT DEFAULT 0,
  last_shown_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed prompts
INSERT INTO strategic_prompts (category, prompt_text) VALUES
('value', 'What''s one feature that could 10x creator retention?'),
('value', 'Which part of the platform is most underutilized?'),
('value', 'What would make agencies pay 2x for your service?'),
('moat', 'What data do you have that competitors can''t easily get?'),
('moat', 'What would take a competitor 2+ years to replicate?'),
('moat', 'Which integration would lock in your best customers?'),
('improvement', 'What''s the biggest friction point for new users?'),
('improvement', 'Which metric would you most want to improve this week?'),
('improvement', 'What''s one thing you''ve been avoiding that needs attention?');

-- Chairman's ideas log
CREATE TABLE chairman_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES strategic_prompts(id),
  response_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval action log
CREATE TABLE approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  reason TEXT,
  acted_by UUID,
  acted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE chairman_alert_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chairman_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;

-- Chairman can do everything
CREATE POLICY "Chairman full access" ON chairman_alert_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'chairman')
  );

CREATE POLICY "Chairman full access" ON strategic_prompts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'chairman')
  );

CREATE POLICY "Chairman full access" ON chairman_ideas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'chairman')
  );

CREATE POLICY "Chairman full access" ON approval_actions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'chairman')
  );
```

---

## Environment Variables Needed

Add to `.env.local`:

```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
CHAIRMAN_PHONE_NUMBER=+1987654321

# News API (choose one)
PERPLEXITY_API_KEY=your_key
# OR
BING_NEWS_API_KEY=your_key
```

---

## Existing Data Sources to Use

| Data | Source | Notes |
|------|--------|-------|
| System modules | `/api/system/health` | 12 modules with status |
| Component health | `/api/system-health` | Pages, components, accuracy |
| Prediction accuracy | `/api/system-health/accuracy` | avgAccuracy, component scores |
| Pending payouts | `payouts` table | WHERE status='pending' |
| Pending creators | `creators` table | WHERE verification_status='pending' |
| Revenue | `transactions`, `earnings_ledger` | Need to aggregate |
| Active users | `profiles`, `creators` | WHERE last_login_at recent |
| Pipeline jobs | `scraping_jobs`, `training_jobs` | Check status field |

---

## Plain English Generator Examples

```typescript
// src/lib/chairman/plain-english.ts

export function getSystemHealthMessage(modules: Module[]): string {
  const down = modules.filter(m => m.status === 'down');
  const degraded = modules.filter(m => m.status === 'degraded');
  
  if (down.length > 0) {
    return `${down[0].name} is DOWN`;
  }
  if (degraded.length > 0) {
    return `${degraded[0].name} is responding slowly`;
  }
  return 'All services running';
}

export function getRevenueMessage(current: number, previous: number): string {
  const change = ((current - previous) / previous) * 100;
  
  if (change > 5) return `Up ${change.toFixed(0)}% this week`;
  if (change < -5) return `Down ${Math.abs(change).toFixed(0)}% - unusual pattern`;
  return 'Stable this week';
}

export function getApprovalMessage(count: number, oldestDays: number): string {
  if (count === 0) return 'No pending approvals';
  if (oldestDays > 2) return `${count} items pending (oldest: ${oldestDays} days)`;
  return `${count} items need your approval`;
}
```

---

## API Response Format

All `/api/chairman/*` endpoints should return:

```typescript
interface ChairmanApiResponse<T> {
  data: T;
  plain_english: string;
  status: 'healthy' | 'warning' | 'critical';
  updated_at: string;
}
```

Example `/api/chairman/status` response:

```json
{
  "data": {
    "system_health": { "modules_up": 12, "modules_down": 0, "error_rate": 0.5 },
    "ai_performance": { "accuracy": 78, "drift_detected": false },
    "revenue": { "current_week": 12450, "change_percent": 12 },
    "user_activity": { "active_creators": 147, "change_percent": -3 },
    "approvals": { "total": 3, "payouts": 1, "agencies": 2, "oldest_days": 5 },
    "pipeline": { "scraping_active": true, "training_active": true, "records_24h": 2340 }
  },
  "areas": [
    { "name": "System Health", "status": "healthy", "plain_english": "All services running" },
    { "name": "AI Performance", "status": "healthy", "plain_english": "78% accuracy" },
    { "name": "Revenue", "status": "healthy", "plain_english": "Up 12% this week" },
    { "name": "User Activity", "status": "warning", "plain_english": "Logins down 3%" },
    { "name": "Approvals", "status": "warning", "plain_english": "3 items pending" },
    { "name": "Data Pipeline", "status": "healthy", "plain_english": "Healthy" }
  ],
  "overall_status": "warning",
  "greeting": "Good morning. 2 items need your attention.",
  "updated_at": "2026-02-04T14:30:00Z"
}
```

---

## Success Criteria Checklist

Before marking Phase 5 as complete, verify ALL of the following:

### Dashboard View
- [ ] `/admin/chairman` loads without errors
- [ ] Greeting banner shows correct time-based greeting
- [ ] Greeting reflects overall status (green/yellow/red)
- [ ] All 6 health cards show REAL data (not mocks)
- [ ] Each card shows plain English status
- [ ] Status dots are correct colors
- [ ] Clicking a card opens detail panel

### Approvals
- [ ] Approvals card shows correct pending count
- [ ] Clicking Approvals opens slide-out panel
- [ ] Panel shows all pending items from database
- [ ] Approve button works and updates database
- [ ] Reject button works with reason modal
- [ ] Count updates after approval/rejection

### Strategic Prompts
- [ ] Prompt panel shows a prompt from database
- [ ] Prompt rotates daily (not same one every time)
- [ ] Can submit a response that saves to database
- [ ] Can dismiss prompt

### News
- [ ] News panel shows 2-3 real headlines
- [ ] Headlines are from last 24 hours
- [ ] Links open in new tab
- [ ] Categories include AI and marketing

### SMS Alerts
- [ ] Twilio credentials configured
- [ ] Test SMS sends successfully
- [ ] Alert triggers when system goes down (simulate)
- [ ] Cooldown prevents spam (30 min minimum)

### Topology View
- [ ] Toggle switches between Dashboard and Topology
- [ ] Canvas renders with center node
- [ ] 6 satellite nodes visible with real data
- [ ] Connection lines drawn correctly
- [ ] Clicking node shows detail
- [ ] Hover highlights connections

### Polish
- [ ] Loading skeletons appear during data fetch
- [ ] Error state shows retry button
- [ ] Auto-refresh works (check network tab)
- [ ] Mobile view is usable (test at 375px width)
- [ ] No console errors

---

## Common Pitfalls to Avoid

1. **Don't use mock data** - Connect everything to real database/APIs
2. **Don't skip error handling** - Every API call needs try/catch
3. **Don't forget loading states** - User should never see blank screen
4. **Don't hardcode thresholds** - Use the config table
5. **Don't skip mobile** - Chairman may check from phone
6. **Test SMS early** - Twilio setup can have gotchas

---

## Questions for User During Build

If blocked, ask about:

1. **Twilio account** - Do you have one? Need help setting up?
2. **News API preference** - Perplexity ($20/mo) or Bing ($50/mo)?
3. **SMS phone number** - What number should receive alerts?
4. **Threshold values** - What error rate triggers yellow/red?
5. **Revenue source** - Which tables represent actual revenue?

---

## After Build is Complete

Run through the success criteria checklist with the user watching. Let them:

1. Navigate to `/admin/chairman`
2. Read the greeting and confirm it's accurate
3. Click each health card and verify data
4. Open approvals and process one item
5. Toggle to Topology view
6. Trigger a test SMS alert
7. Check on mobile device

Only mark as **DONE** when user confirms everything works.

---

**This document contains everything needed to build the Chairman's Hub. Good luck!**
