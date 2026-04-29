# Dashboard Current State Survey

Date: 2026-04-29
Scope: descriptive map of `/agency/dashboard` as it exists today
Mode: read-only; no recommendations

---

## T1 — Page entry and top-level layout

**File:** `src/app/agency/dashboard/page.tsx` (75 lines, server component)

**Auth/redirect logic (lines 35-53):**
- `createServerSupabaseClient()` at line 36, `getUser()` at line 37 — pulls the current logged-in user from the session.
- `getUserAgencyId(user.id)` at line 41 — looks up which agency the user belongs to.
- If no user OR no agency, the page short-circuits and renders a "No Agency Found" full-screen message at lines 44-52. No redirect — just a static fallback view.

**Server-side queries (in a single `Promise.all`, lines 55-60):**
| Line | Function | Imported from |
|---|---|---|
| 56 | `getAgencyStats(agencyId)` | `@/lib/dashboard/queries` |
| 57 | `getAgencyCreatorsList(agencyId)` | same |
| 58 | `getAgencyBriefs(agencyId)` | same |
| 59 | `getAgencyInvites(agencyId)` | same (added by OB-1 build) |

Plus two synchronous helpers run after the queries return:
- `deriveAlerts(creators)` at line 61 — local function in this file (lines 14-33), generates 1-3 alert objects from the creators list.
- `getCoachingInsights(creators)` at line 63 — imported from `queries.ts`, in-memory.

**Props passed to `<DashboardClient>` (lines 65-74):**
`stats`, `creators`, `alerts`, `briefs`, `insights`, `invites` — all six computed above.

---

## T2 — DashboardClient.tsx top-to-bottom inventory

DashboardClient.tsx is 1,229 lines. The visible structure has two outer wrappers (lines 456-1228) and one optional right rail. Everything below renders only when `activeDimension === 'momentum'` unless noted; the four other dimensions render alternative views (see T3).

> **Plain-English glosses for jargon used below:**
> - **`useState`** — a React hook that stores a piece of in-page state (a value plus a setter function).
> - **`useCallback`** — a React hook that memoizes a function so it doesn't get recreated on every render.
> - **conditional rendering** — JSX that only appears on screen when some condition is true.

### 1. Animation styles
- **Lines:** 457
- **What you see:** Nothing visible — injects keyframe CSS animations.
- **What you can do:** Nothing.
- **Always renders.**

### 2. Top header bar
- **Lines:** 463-492 (`<AgencyDashboardHeader>`)
- **What you see:** Sticky bar across the top with the TRENDZO wordmark on the left, a 7-day "week strip" of dots in the center (one per weekday, green if there's content that day), a "Dashboard / Clay" toggle button on the right, and a 4-dot menu icon.
- **What you can do:** Click the toggle to flip to Clay (`/agency`); click the menu for a dropdown with "Cards", "Clients", and (if signed in) "Sign Out".
- **Always renders.**

### 3. WORKSPACE title block
- **Lines:** 498-519
- **What you see:** Giant "WORKSPACE" headline on the left next to a "+ New Brief" pill button, with five `StatCounter` numbers on the right (Creators, Avg VPS, This Week, Pending, Top KPI).
- **What you can do:** Click "+ New Brief" — it's a Link to `/agency` (sends the operator to Clay; no Dashboard form). The five numbers are read-only.
- **Always renders.**

### 4. Dimension buttons row
- **Lines:** 521-524 (`<DimensionButtons>`)
- **What you see:** Five horizontally-scrollable pill buttons: Momentum Pulse, Trend Windows, Prediction Accuracy, Competitive Position, Revenue Signal. Each shows an icon + label + one-line description.
- **What you can do:** Click any one — sets `activeDimension` and swaps the content area below.
- **Always renders.**

### 5. Creator Roster (horizontal scroll cards)
- **Lines:** 533-669
- **What you see:** A horizontally-scrolling row of creator cards (~280px wide each). Each card has avatar+initials, name, status dot, niche badge, content-format tags, "N scripts / avg VPS", a circular VPS ring, and a footer line showing "Posted today" / "Nd ago" / "Nd SILENT" (with a red glow when silent ≥3 days).
- **What you can do:** Click any card → navigates to `/agency?focus=<userId>` (Clay deep-link). Click the four filter pills above (All / Active / Onboarding / Inactive) to filter.
- **Renders only when `activeDimension === 'momentum'`.**

### 6. Active Briefs section header + filters
- **Lines:** 671-697
- **What you see:** "Active Briefs" heading, brief count badge, "+ Generate Briefs" button, then two rows of filter pills (Generation: All/Draft/In-Progress/Approved/Published; Delivery: Delivered toggle).
- **What you can do:** Click "Generate Briefs" → calls `handleGenerateBriefs` which POSTs to `/api/agency/batch-briefs` then re-fetches `/api/agency/brief-review`. Click filter pills to narrow the list below.
- **Renders only inside momentum.**

### 7. Active Briefs list (the big one)
- **Lines:** 698-1004
- **What you see:** Stacked rectangular brief cards. Each card has: a generation-status chip (Draft/Approved/etc.), a completion-status chip if applicable (Delivered/Acknowledged/In Production/Published), title + VPS, creator+niche+event, optional "DECAY"/"OUTPERFORM" priority badges, an "agent attribution" line (only on pending), and on the right side, action buttons whose labels change based on the brief's current status.
- **What you can do:** A LOT. Depending on the brief's source and status, you'll see one or more of: **Approve** + **Reject** (with inline reason input); **Acknowledge**; **Mark In Production**; **Mark Published** (with inline TikTok URL input); **Log Performance** / **Update Performance** (with inline views + engagement % inputs); a "**See N alternatives**" toggle that expands to show variant cards each with their own Approve button.
- After Performance is logged, a small predicted-vs-actual-vs-delta summary appears under the card.
- **Renders only inside momentum.**

### 8. Creator Invites section (OB-1 parity, 2026-04-29)
- **Lines:** 1007-1096
- **What you see:** "Creator Invites" heading + count badge. Two-pane grid below: LEFT (~40%) is an "Invite a creator" panel with email input, name input, and "+ Send Invite" + "Clear" buttons. RIGHT (~60%) is "Recent Invites" — a scrolling list of rows, each showing creator name + email + a status badge (Pending/Sent/Accepted/Declined/Expired/Failed) + a "Invited Xd ago • sent Yd ago" timestamp line + (if failed) an error message in red.
- **What you can do:** Type email + name → click Send Invite. POSTs to `/api/invites/send`, prepends the new row to the local list. Status badges and timestamps are read-only.
- **Renders only inside momentum.** (Detailed structure at T7.)

### 9. Coaching Insights grid
- **Lines:** 1100-1127
- **What you see:** "Coaching Insights" heading + 1-2 violet niche-focus chips. Below: a 2-column grid of insight cards, each with a HIGH/MED/LOW priority badge + title + recommendation paragraph + optional "Re: Creator Name".
- **What you can do:** Read-only — cards are not clickable.
- **Renders only inside momentum.**

### 10. Alerts list (right rail of bottom grid)
- **Lines:** 1129-1152
- **What you see:** "Alerts" heading + a vertical stack of alert cards. Each has a colored severity strip on the left (red critical / amber warning / cyan info), a one-line message, optional detail line, and an attribution line ("Trend Scout" or "Performance Analyst").
- **What you can do:** Read-only.
- **Renders only inside momentum.**

### 11. Agency Scorecard (right rail)
- **Lines:** 1154-1184
- **What you see:** A panel showing a big letter grade (A/B/C/D/F) in a colored square + "Overall Score N/100" label. Below: three horizontal progress bars labeled "Active Creators", "Avg VPS", "Content Coverage".
- **What you can do:** Read-only.
- **Renders only inside momentum.**

### 12. Weekly Calendar mini (right rail)
- **Lines:** 1186-1206
- **What you see:** A 7-square row, one per weekday this week. Each square shows the day label and either a count of briefs scheduled or a `·`. Today is ringed in cyan. Below, a warning line if 4+ days have no content.
- **What you can do:** Read-only.
- **Renders only inside momentum.**

### 13. Other-dimension views (mutually exclusive with everything from #5-12)
- **Lines:** 1212-1216
- `<TrendsView creators={creators} />` when `trends` selected
- `<AccuracyView creators={creators} />` when `accuracy` selected
- `<RankView creators={creators} />` when `rank` selected
- `<RevenueView creators={creators} />` when `revenue` selected
- See T3 for what each contains.

### 14. ClayPanel right rail (conditional, never visible today)
- **Lines:** 1222-1225
- **What you see:** Nothing — `clayOpen` state defaults to `false` and there is NO code anywhere in DashboardClient.tsx that calls `setClayOpen(true)`. Confirmed by grep: only one match for `setClayOpen` in the entire dashboard tree, and it's the `useState` declaration at line 184.
- **What you can do:** Nothing reachable.
- **Renders only when `clayOpen === true`** — currently unreachable from the UI. This is functionally dead code (see T12).

---

## T3 — The five DimensionButtons

The buttons are defined in `src/app/agency/dashboard/components/DimensionButtons.tsx:13-19`:

```tsx
const DIMENSIONS: { key: Dimension; icon: string; label: string; desc: string; color: string }[] = [
  { key: 'momentum', icon: '⚡', label: 'Momentum Pulse', desc: 'Posting cadence & engagement trajectory', color: T.green },
  { key: 'trends', icon: '◆', label: 'Trend Windows', desc: 'Niche opportunities closing soon', color: T.cyan },
  { key: 'accuracy', icon: '◎', label: 'Prediction Accuracy', desc: 'Predicted vs actual performance', color: T.violet },
  { key: 'rank', icon: '▲', label: 'Competitive Position', desc: 'Client niche standings', color: T.gold },
  { key: 'revenue', icon: '◈', label: 'Revenue Signal', desc: 'Content → business outcomes', color: T.crimson },
];
```

| Dimension | Label | When-active file | What you see | Data source |
|---|---|---|---|---|
| momentum | Momentum Pulse | (no separate component — inline in `DashboardClient.tsx:530-1210`) | Items #5-12 from T2 above. | Real DB data via `getAgencyCreatorsList`, `getAgencyBriefs`, `getAgencyInvites`, `getAgencyStats`. The `daysSilent` helper that drives "Nd SILENT" pulses is a deterministic stub (see below). |
| trends | Trend Windows | `components/TrendsView.tsx` (128 lines) | Five trend cards (POV Storytime, Split Screen React, etc.) with VPS rings, velocity numbers (+340%, +210%), windows ("1d left"), creator-chip avatars, and a "Generate for all →" button. Below: a red "Competitor Alert" card claiming "12 agencies in your niche already used X this week". | **100% hardcoded.** Quoted: `const MOCK_TRENDS = [{ id: '1', name: 'POV Storytime', vps: 92, velocity: '+340%', window: '1d left', hot: true }, ...]` (TrendsView.tsx:12-18). |
| accuracy | Prediction Accuracy | `components/AccuracyView.tsx` (128 lines) | Three summary cards (Overall Accuracy %, This Week predictions count with ✓/↑/✕ breakdown, Accuracy Streak in days "Top 15% of agencies"), then a list of up to 12 prediction rows with predicted→actual numbers and a status badge (ACCURATE / OUTPERFORMED / MISSED). | **`Math.random()`-driven.** Quoted: `const predicted = c.avgVPS > 0 ? c.avgVPS + Math.floor(Math.random() * 20 - 10) : 50 + Math.floor(Math.random() * 30); const actual = predicted + Math.floor(Math.random() * 24 - 12);` (AccuracyView.tsx:17-18). The creator names and counts are real (from props), but every single number on screen is randomized client-side. |
| rank | Competitive Position | `components/RankView.tsx` (107 lines) | A 3-column grid of creator cards. Each shows avatar, name, niche, "#N of M" rank with a 👑 if first, a position bar, latestVPS, and a "Dominant" or "Rising" badge. | **`Math.random()`-driven.** Quoted: `const totalInNiche = 10 + Math.floor(Math.random() * 15); const rank = c.latestVPS >= 80 ? 1 : c.latestVPS >= 65 ? Math.floor(Math.random() * 3) + 1 : ...` (RankView.tsx:13-17). VPS is real; rank is invented. |
| revenue | Revenue Signal | `components/RevenueView.tsx` (122 lines) | Three summary cards (Monthly Revenue $X, Avg Client Value $X, Content ROI Nx), then a table with one row per creator: engagement%, cost/content $, revenue $, conversions count. | **`Math.random()`-driven.** Quoted: `const engagementRate = c.latestVPS > 0 ? +(c.latestVPS * 0.08 + Math.random() * 2).toFixed(1) : 0; const costPerContent = 50 + Math.floor(Math.random() * 150);` (RevenueView.tsx:13-14). All dollar amounts are fabricated each render. |

**TODO/FIXME inside the dimension view files:**
- TrendsView.tsx:11 — `// TODO: wire to real trend data source (e.g., trend_windows table, external API)`
- AccuracyView.tsx:11 — `// TODO: wire to real prediction accuracy data from prediction_runs + vps_evaluation`
- RankView.tsx:11 — `// TODO: wire to real competitive ranking data`
- RevenueView.tsx:11 — `// TODO: wire to real revenue/conversion data source`

---

## T4 — Action buttons in DashboardClient.tsx

| Button (visible label) | Line | Handler | Target | Real / Stub |
|---|---|---|---|---|
| Top: "+ New Brief" pill | 504-510 | `<Link href="/agency">` | navigates to Clay | Real navigation — but no Dashboard form; punts to Clay. |
| Dimension buttons (5 of them) | 521-524 (in `DimensionButtons`) | `setActiveDimension(d)` | local state | Real (toggles view). |
| Creator-roster card (entire card is a `<Link>`) | 559-660 | navigation | `/agency?focus=<userId>` | Real navigation. |
| Filter pills — creator status (4) | 541-543 | `setCreatorFilter(f)` | local state | Real. |
| "+ Generate Briefs" | 676-683 | `handleGenerateBriefs` | POST `/api/agency/batch-briefs` then GET `/api/agency/brief-review` | Real (writes briefs to DB). |
| Filter pills — brief status (5) + Delivered toggle | 686-695 | `setBriefFilter` / `setDeliveryFilter` | local state | Real. |
| Per-brief: Approve | 792-797 | `handleApproveBrief(b.id, 'A')` | PATCH `/api/agency/brief-review` | Real. |
| Per-brief: Reject (opens form) | 798-802 | `setRejectingId(b.id)` | local state (form expands) | Real (UI), then... |
| Per-brief: Reject (submit) | 777-782 | `handleRejectBrief(b.id)` | PATCH `/api/agency/brief-review` | Real. |
| Per-brief: Reject Cancel | 783-787 | clears local state | local state | Real. |
| Per-brief: Acknowledge | 809-814 | `handleCompletionUpdate(id, 'acknowledged')` | POST `/api/brief-status` | Real. |
| Per-brief: Mark In Production | 817-822 | `handleCompletionUpdate(id, 'in_production')` | POST `/api/brief-status` | Real. |
| Per-brief: Mark Published (opens form) | 853-858 | `setPublishingId(b.id)` | local state | Real (UI). |
| Per-brief: Mark Published Confirm | 835-844 | `handleCompletionUpdate(id, 'published', url)` | POST `/api/brief-status` | Real. |
| Per-brief: Mark Published Cancel | 845-849 | clears local state | local state | Real. |
| Per-brief: Log Performance / Update Performance (opens form) | 895-905 | `setPerfLoggingId(b.id)` | local state | Real (UI). |
| Per-brief: Log Performance Confirm | 881-886 | `handleLogPerformance(b.id)` | POST `/api/brief-performance` | Real. |
| Per-brief: Log Performance Cancel | 887-891 | clears local state | local state | Real. |
| Per-brief: "See N alternatives" toggle | 916-922 | `toggleAlts(b.id)` | local state | Real (UI). |
| Per-variant: "Approve V" | 945-950 | `handleApproveBrief(b.id, v.variant_label)` | PATCH `/api/agency/brief-review` | Real. |
| OB-1: "+ Send Invite" | 1041-1046 | `handleSendInvite` | POST `/api/invites/send` | Real (writes invite + sends email + emits audit event). |
| OB-1: "Clear" (form reset) | 1047-1053 | clears local state | local state | Real (UI). |
| Header: "Dashboard / Clay" toggle | 118-142 in `AgencyDashboardHeader.tsx` | `handleToggle` | router.push to `/agency` or `/agency/dashboard` | Real navigation. |
| Header: 4-dot menu | 146-161 in header | toggles local menu state | local state | Real (UI). |
| TrendsView: "Generate for all →" (per trend card) | 92-97 in `TrendsView.tsx` | none — bare `<button>` with no `onClick` | nothing | **STUB** — clicking does literally nothing. |
| MomentumView: "Generate rescue →" (per urgent card) | 138-145 in `MomentumView.tsx` | none — bare `<button>` with no `onClick` | nothing | **STUB** — clicking does literally nothing. (Note: MomentumView.tsx is imported nowhere — see T12 — so this button is doubly unreachable.) |

---

## T5 — Data source map

| Source | Where accessed | What's done with it |
|---|---|---|
| Supabase `auth.getUser()` | server, `page.tsx:36-37` | gates the page render. |
| `getUserAgencyId(user.id)` (reads `agency_members` table) | server, `page.tsx:41` | resolves which agency to query. |
| `getAgencyStats(agencyId)` → reads `content_briefs`, `generated_scripts`, `agency_members`, etc. | server, `queries.ts` | feeds the 5 StatCounter numbers in the WORKSPACE title block. |
| `getAgencyCreatorsList(agencyId)` → reads `agency_members` + `onboarding_profiles` + recent VPS | server, `queries.ts` | feeds Creator Roster cards, all 4 dimension views (creators prop), Coaching Insights derivation, Agency Scorecard math. |
| `getAgencyBriefs(agencyId)` → reads `content_briefs` + `pre_generated_briefs` + `brief_variants` + `onboarding_profiles` + `cultural_events` | server, `queries.ts:243` | feeds the Active Briefs list, the week-strip in the header, the Weekly Calendar mini, ScheduleStrip (unused), ClayPanel (unused). |
| `getAgencyInvites(agencyId)` → reads `agency_invites` | server, `queries.ts` (added by OB-1 build) | feeds the Recent Invites list. |
| `getCoachingInsights(creators)` — pure function in `queries.ts`, no DB | server, `queries.ts` | feeds the Coaching Insights grid. |
| `deriveAlerts(creators)` — pure function inline in `page.tsx:14-33` | server, `page.tsx` | feeds the Alerts list. |
| `/api/agency/batch-briefs` (POST) | client fetch from `handleGenerateBriefs` | triggers brief generation. |
| `/api/agency/brief-review` (GET + PATCH) | client fetch from `handleGenerateBriefs`, `handleApproveBrief`, `handleRejectBrief` | reload pending briefs / approve / reject. |
| `/api/brief-status` (POST) | client fetch from `handleCompletionUpdate` | acknowledge / in-production / publish a brief. |
| `/api/brief-performance` (POST) | client fetch from `handleLogPerformance` | log actual performance. |
| `/api/invites/send` (POST) | client fetch from `handleSendInvite` (OB-1) | send creator invite. |
| `getAgencySkills(primaryNiche)` — pure synchronous lookup, no DB | client, computed inside `DashboardClient` | drives the "Top KPI" StatCounter and the niche-focus chips above Coaching Insights. |
| `AGENT_PERSONAS` (object literal) — no DB | client, imported from `@/lib/agents/agent-personas` | drives the agent-attribution lines under brief cards and under alerts. |

---

## T6 — Hardcoded values, fake data, `Math.random()`, and TODO comments

### `Math.random()` calls (every one)
| File | Line | Purpose |
|---|---|---|
| `components/AccuracyView.tsx` | 17-18 | Generates fake "predicted" and "actual" prediction numbers. Quoted: `const predicted = c.avgVPS > 0 ? c.avgVPS + Math.floor(Math.random() * 20 - 10) : 50 + Math.floor(Math.random() * 30); const actual = predicted + Math.floor(Math.random() * 24 - 12);` |
| `components/RankView.tsx` | 13 | Random total competitors in niche: `const totalInNiche = 10 + Math.floor(Math.random() * 15);` |
| `components/RankView.tsx` | 15-17 | Random rank within niche: `: c.latestVPS >= 65 ? Math.floor(Math.random() * 3) + 1 : c.latestVPS >= 40 ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 8) + 5;` |
| `components/RevenueView.tsx` | 13 | Fake engagement rate: `const engagementRate = c.latestVPS > 0 ? +(c.latestVPS * 0.08 + Math.random() * 2).toFixed(1) : 0;` |
| `components/RevenueView.tsx` | 14 | Fake cost per content: `const costPerContent = 50 + Math.floor(Math.random() * 150);` |
| `components/MomentumView.tsx` | 49 | Fake 7-day engagement bars: `const bars = Array.from({ length: 7 }, () => 20 + Math.floor(Math.random() * 80));` (note: this file is unused, see T12) |

To replace: each would need a real query against `prediction_runs` (accuracy), some niche-leaderboard table (rank), and `content_briefs.actual_views`/`actual_engagement_rate` aggregated by creator (revenue).

### Hardcoded UUIDs
| File | Line | What | What it would need |
|---|---|---|---|
| `DashboardClient.tsx` | 177 | `const AGENCY_ID = '62cb020e-5303-452e-8cf2-83368c912b6e';` | Should come from server-resolved session. Used at line 373 (`agency_id: AGENCY_ID` in batch-briefs body) and line 378 (URL query string). Currently single-tenant for these two endpoints. |

### Hardcoded arrays of placeholder data
| File | Lines | What |
|---|---|---|
| `components/TrendsView.tsx` | 12-18 | `const MOCK_TRENDS = [{ id: '1', name: 'POV Storytime', vps: 92, velocity: '+340%', window: '1d left', hot: true }, { id: '2', name: 'Split Screen React', ... }, ...]` — five fake trends. To replace: query `trend_windows` table or external trends API. |

### Suspicious string literals (looks like sample/marketing copy hardcoded into UI)
| File | Lines | Quoted |
|---|---|---|
| `components/TrendsView.tsx` | 119-121 | `<span style={{ color: T.textPrimary }}>12 agencies</span> in your niche already used ... Clients averaged <span style={{ color: T.green }}>34% above baseline</span>.` — the "12 agencies / 34%" numbers are static literals embedded in JSX. |
| `components/AccuracyView.tsx` | 89 | `<p className="text-[10px] font-mono mt-1" style={{ color: T.gold }}>Top 15% of agencies</p>` — "Top 15% of agencies" is a hardcoded label, not derived from any data. |

### TODO / FIXME / XXX / HACK comments
| File | Line | Comment |
|---|---|---|
| `DashboardClient.tsx` | 100 | `// TODO: wire to real last-post date from generated_scripts.created_at` |
| `DashboardClient.tsx` | 104 | `// Deterministic per-creator stub so SSR and client agree (no Math.random — causes hydration errors).` (Server-Side Rendering = Next.js renders the page on the server first, then "hydrates" it in the browser; if random numbers differ between the two passes you get mismatched HTML.) |
| `components/MomentumView.tsx` | 13 | `// TODO: wire to real last-post date from generated_scripts` |
| `components/MomentumView.tsx` | 17 | `// Deterministic per-creator stub — Math.random here caused hydration mismatches.` |
| `components/MomentumView.tsx` | 25 | `// TODO: wire to real engagement trajectory` |
| `components/MomentumView.tsx` | 48 | `// TODO: wire to real daily engagement from generated_scripts` |
| `components/TrendsView.tsx` | 11 | `// TODO: wire to real trend data source (e.g., trend_windows table, external API)` |
| `components/AccuracyView.tsx` | 11 | `// TODO: wire to real prediction accuracy data from prediction_runs + vps_evaluation` |
| `components/RankView.tsx` | 11 | `// TODO: wire to real competitive ranking data` |
| `components/RevenueView.tsx` | 11 | `// TODO: wire to real revenue/conversion data source` |
| `components/ClayPanel.tsx` | 100 | `// TODO: wire to /api/agency-chat` |

No FIXME, XXX, or HACK comments in dashboard tree.

---

## T7 — OB-1 invite section state map

**Line range in DashboardClient.tsx:** 1007-1096 (89 lines).

**Visible structure:**
- Section header + invite count badge (lines 1009-1014).
- 2-column grid: `lg:grid-cols-[2fr_3fr]` (form left ~40%, list right ~60%) at line 1016.
- LEFT pane: rounded glass panel with email input → name input → "+ Send Invite" + "Clear" buttons → optional red error message (lines 1018-1059).
- RIGHT pane: rounded glass panel with "Recent Invites" header → either an empty-state paragraph or a max-height-280px scrolling list of invite rows (lines 1062-1094).
- Each invite row (lines 1071-1089): horizontal flex with creator name + email on the left, status badge on the right, and a tiny mono timestamp line ("Invited Xd ago • sent Yd ago • accepted Zd ago"); failed invites show their `error_message` in red.

**State variables it owns (lines 198-202):**
- `invites: AgencyInvite[]` — initialized from `initialInvites` prop, mutated optimistically on send.
- `inviteEmail: string`
- `inviteName: string`
- `invitingNow: boolean`
- `inviteError: string | null`

Plus one handler: `handleSendInvite` at lines 204-242, posts to `/api/invites/send` and prepends the new row.

**Visual integration with surrounding sections — comparison quotes:**

OB-1 invite section opening (lines 1008-1018):
```tsx
<section>
  <div className="flex items-center gap-3 mb-4">
    <h2 className="text-sm font-display font-bold tracking-wide" style={{ color: T.textPrimary }}>Creator Invites</h2>
    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: `${T.cyan}15`, color: T.cyan }}>
      {invites.length} {invites.length === 1 ? 'Invite' : 'Invites'}
    </span>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">
    {/* LEFT: inline invite form */}
    <div className="rounded-2xl p-5" style={{ background: T.bgGlass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: `1px solid ${T.border}` }}>
```

Section IMMEDIATELY ABOVE (Active Briefs, lines 672-675):
```tsx
<section>
  <div className="flex items-center gap-4 mb-4 flex-wrap">
    <h2 className="text-sm font-display font-bold tracking-wide" style={{ color: T.textPrimary }}>Active Briefs</h2>
    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: `${T.amber}15`, color: T.amber }}>{briefs.length} Briefs</span>
```

Section IMMEDIATELY BELOW (Coaching/Alerts grid, lines 1099-1108):
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
  <section>
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: T.textSecondary }}>Coaching Insights</h2>
      {skills.coachingFocus.slice(0, 2).map(f => (
        <span key={f} className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${T.violet}12`, color: T.violet, border: `1px solid ${T.violet}20` }}>
```

Observations (descriptive, not prescriptive): The OB-1 section's header treatment (`text-sm font-display font-bold` with a colored count badge) matches Active Briefs above it exactly. The Coaching Insights below uses a smaller, all-uppercase mono header (`text-[10px] font-mono uppercase tracking-[0.15em]`) — a different header style. The OB-1 inner panels use `T.bgGlass + T.blur` rounded-2xl, same primitive as creator-roster cards and coaching cards. The 2-column grid ratio `[2fr_3fr]` is unique to this section; the Coaching/Alerts grid uses `[1fr_320px]` and the Briefs list is single-column.

---

## T8 — Visual conventions inventory (DashboardClient.tsx only)

### Colors actually referenced
The `T` token object is the source of truth (see `tokens.ts`). Counts approximate, based on grep:
- `T.bg` — used as background for the outer wrapper, filter pills, the scrollbar inset.
- `T.bgGlass` — heavily used (10+ occurrences) for all rounded-2xl panel backgrounds.
- `T.bgCard` — used in dimension views and the header.
- `T.bgDeep` — used once (Position bar background in RankView, but RankView is its own file).
- `T.border` — used 30+ times for 1px solid borders.
- `T.textPrimary` (`#e8e8f0`) — main heading color, ~15 references.
- `T.textSecondary` (`#8888a0`) — sub-headings + filter pill text, ~25 references.
- `T.textDim` (`#55556a`) — timestamps, captions, quiet labels, ~20 references.
- `T.cyan` (`#00d4ff`) — count badges, accents, "Acknowledged" tints.
- `T.green` (`#2dd4a8`) — VPS-good color, "Approve" buttons, success states.
- `T.amber` (`#f4b942`) — VPS-mid color, "In Production" tint, generation pill.
- `T.accent` (`#f04a4d`) — error text, low-VPS, "Reject" buttons.
- `T.crimson` (`#e63946`) — silent-creator pulse, redundant with `T.accent` (different shade of red).
- `T.violet` (`#7b2ff7`) — Coaching Insights chips and Top KPI counter.
- Hardcoded hex literals embedded directly in JSX (NOT going through `T`):
  - `'#6B6D6D'` (3 places — delivered badge, pending invite badge, sent inv ite background)
  - `'#6C92A0'` (4 places — acknowledged tint, sent badge)
  - `'#4A8C6A'` (4 places — published tint, accepted invite)
  - `'#1a1a1a'` (2 places — in-production foreground)
  - `'#c0c0d0'` (5 places — input field text)
  - `'#1e1e2e'` (2 places — VPS ring track, scorecard bar background)
  - `'#3a3a4a'` (1 place — empty calendar cell text)

### Typography patterns (every distinct combo grep'd)
- Display headings: `text-5xl sm:text-6xl font-display font-black tracking-tighter` (one — WORKSPACE only)
- Section headings: `text-sm font-display font-bold tracking-wide` (Creator Roster, Active Briefs, Creator Invites)
- Sub-section headings: `text-[10px] font-mono uppercase tracking-[0.15em]` (Coaching Insights, Alerts, Agency Scorecard, Weekly Calendar, both OB-1 panel sub-headers)
- Card titles: `text-xs font-sans font-medium` or `text-sm font-display font-bold` (mixed across cards)
- Body text: `text-[11px]` for primary, `text-[10px]` for secondary, `text-[9px]` for quietest
- Numbers / counts: `text-3xl font-display font-bold` (StatCounter) or `text-[10px] font-mono font-bold` (badges)
- Buttons: uniformly `text-[10px] font-mono font-bold uppercase tracking-wide`

### Spacing patterns
- Outer page padding: `px-4 sm:px-6 py-6 space-y-6`
- Section margin: `space-y-6` and `mb-4` for headers
- Card padding: `p-5` (large) or `p-4` (compact) or `px-4 py-3` (rows)
- Button padding: `px-3 py-1.5` (standard) or `px-2.5 py-1` (compact)
- Gaps: `gap-2`, `gap-3`, `gap-4` (most common), `gap-6` (between major sections)

### Border / shadow tokens
- USED: `T.border`, `T.raisedSm`, `T.inset`, `T.cardShadow`, `T.glowCyan`, `T.glowCrimson`, `T.glowGold`, `T.blur`
- DEFINED IN tokens.ts BUT UNUSED in DashboardClient.tsx: `T.raised`, `T.raisedLg`, `T.navShadow`, `T.pillShadow`, `T.borderActive`, `T.bgGlassHover`

---

## T9 — Sidebar / left rail

**File:** `src/app/agency/dashboard/components/IconSidebar.tsx` (56 lines).

**`NAV_ITEMS` definition (lines 7-13):**

| Icon (visible) | Label (hover/title) | Link target | Status |
|---|---|---|---|
| Home (house outline) | Dashboard | `/agency/dashboard` | active=true; works (current page). |
| People | Creators | `/agency/clients` | works (real route exists at `src/app/agency/clients/`). |
| File | Briefs | `/agency/cards` | works (real route at `src/app/agency/cards/`). |
| Calendar | Calendar | `/agency/dashboard` | **points back to itself** — clicking does nothing visible. |
| Bar chart | Reports | `/agency/dashboard` | **points back to itself** — same as above. |

Plus a TRENDZO "T" logo button at the top linking to `/agency` (Clay).

No "coming soon" labels or disabled icons.

**However — this sidebar is currently NOT rendered.** Searched for `IconSidebar` imports across the dashboard tree: the only match is its own file. `DashboardClient.tsx` does not import or render it. The user does not see this sidebar today; the only navigation is the AgencyDashboardHeader at the top. (See T12.)

---

## T10 — Mobile / responsive behavior

DashboardClient.tsx contains 17 `sm:` and 9 `lg:` Tailwind breakpoint references (and one `xl:` in dimension views). The layout is partially responsive: the WORKSPACE header reflows from row to column at the `sm` breakpoint; the bottom Coaching/Alerts grid collapses to one column on small screens; dimension grids (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`) stack on mobile. But the Creator Roster is a horizontal-scroll strip with no mobile-specific handling, the Active Briefs row layout (with right-side action buttons) is not optimized for narrow widths, and the page assumes a desktop-sized viewport overall.

---

## T11 — File weight

| File | Lines |
|---|---|
| `src/app/agency/dashboard/page.tsx` | 75 |
| `src/app/agency/dashboard/DashboardClient.tsx` | 1,229 |
| `src/app/agency/dashboard/components/AccuracyView.tsx` | 128 |
| `src/app/agency/dashboard/components/ClayPanel.tsx` | 285 |
| `src/app/agency/dashboard/components/DimensionButtons.tsx` | 69 |
| `src/app/agency/dashboard/components/IconSidebar.tsx` | 56 |
| `src/app/agency/dashboard/components/MomentumView.tsx` | 152 |
| `src/app/agency/dashboard/components/RankView.tsx` | 107 |
| `src/app/agency/dashboard/components/RevenueView.tsx` | 122 |
| `src/app/agency/dashboard/components/ScheduleStrip.tsx` | 90 |
| `src/app/agency/dashboard/components/TrendsView.tsx` | 128 |
| `src/app/agency/dashboard/components/tokens.ts` | 56 |
| **components subtotal** | **1,193** |
| **GRAND TOTAL (page + client + components)** | **2,497** |

**Hooks in DashboardClient.tsx:**
- `useState` — 14 instances (lines 180-202): `creatorFilter`, `briefFilter`, `deliveryFilter`, `activeDimension`, `clayOpen`, `briefs`, `expandedAlts`, `actionLoading`, `generating`, `rejectingId`, `rejectReason`, `publishingId`, `publishedUrlInput`, `perfLoggingId`, `perfViewsInput`, `perfEngagementInput`, `invites`, `inviteEmail`, `inviteName`, `invitingNow`, `inviteError`. (That's 21 calls — recounted: 21 useState hooks.)
- `useCallback` — 6 instances: `handleSendInvite` (204), `handleLogPerformance` (244), `handleCompletionUpdate` (285), `handleApproveBrief` (312), `handleRejectBrief` (352), `handleGenerateBriefs` (367).

---

## T12 — OBSERVATIONS WORTH FLAGGING

> Plain-English glosses: **"imported nowhere"** = a file exists in the repo but no other file uses it, so the code never runs. **"unreachable"** = the code can run in principle but no UI control triggers it.

1. **Three components in `dashboard/components/` are imported nowhere and never render.**
   - `MomentumView.tsx` (152 lines) — defined, never imported. The "Momentum Pulse" dimension button does NOT show this file; instead it shows the inline content at `DashboardClient.tsx:530-1210`. Two different "momentum" UIs exist; only the inline one is visible.
   - `ScheduleStrip.tsx` (90 lines) — defined, never imported. There IS a "today" mini-strip in the header at `DashboardClient.tsx:467-490`, but that's an inline implementation, not this component.
   - `IconSidebar.tsx` (56 lines) — defined, never imported. (See T9.)
   Evidence: searched the entire `src/app/agency/dashboard/` tree for `MomentumView`, `ScheduleStrip`, `IconSidebar` — each appears only inside its own file.

2. **`ClayPanel` is rendered conditionally on state that is never set to `true`.**
   - At `DashboardClient.tsx:184`: `const [clayOpen, setClayOpen] = useState(false);`
   - At line 1223: `{clayOpen && (<ClayPanel ... />)}`
   - Searched the whole dashboard tree: `setClayOpen` only appears at line 184. There is no button anywhere that calls it. The 285-line `ClayPanel.tsx` is unreachable from the UI today.

3. **Two distinct red colors used interchangeably.** `T.accent = '#f04a4d'` and `T.crimson = '#e63946'` are both reds, used in overlapping contexts (silent-creator badges use `T.crimson`, Reject buttons use `T.accent`, error text uses `T.accent`, MomentumView urgent borders use `T.crimson`). No rule appears to govern which is which.

4. **`AgencyDashboardHeader.tsx` defines its own private `T` token object.** Lines 6-18 of that file declare a local `T` constant (subset of the shared one in `dashboard/components/tokens.ts`). So there are two parallel design-token sources — one at `dashboard/components/tokens.ts` (used by everything in `dashboard/`) and one inside the header file (used only inside the header).

5. **`daysSilent` is duplicated.** Defined twice — once at `DashboardClient.tsx:99-109` and once at `MomentumView.tsx:12-22` — with identical logic and identical "TODO: wire to real last-post date" comments. The `MomentumView` copy never runs (point 1).

6. **Pre-generated brief IDs flow as `Number()`-cast strings into a PATCH endpoint.** At `handleApproveBrief` line 318: `JSON.stringify({ id: Number(briefId), action: 'approve', ... })`. Pre-generated brief IDs come from `pre_generated_briefs.id` which the rest of the codebase treats as integer; content-brief IDs are UUIDs prefixed with `'cb-'`. The same handler is used for both; the `Number(briefId)` cast on a UUID would yield `NaN` — but the code path that calls this is only reachable for pending pre_generated briefs (`isPending` gate at line 702), so the cast is presumably safe in practice. The dual-format ID system is implicit, not documented.

7. **The `+ New Brief` button at line 504 is a `<Link href="/agency">` — clicking it leaves the Dashboard for Clay.** It's the most prominent CTA in the page header but it doesn't open any Dashboard form; it teleports the operator to the Clay surface.

8. **The week-strip in the top header (lines 467-490) and the Weekly Calendar mini in the bottom-right rail (lines 1186-1206) display the same data twice** — both show 7-day brief activity for the current week, sourced from the same `briefsByDay` map computed at lines 427-433.

9. **Single-tenant constant in a multi-tenant client.** `const AGENCY_ID = '62cb020e-5303-452e-8cf2-83368c912b6e';` at line 177 is the chairman's own agency ID hardcoded into a file rendered for any operator. It's referenced at lines 373 and 378 inside `handleGenerateBriefs`, meaning that handler currently issues writes against THIS specific agency regardless of who is logged in. (Other handlers like `handleSendInvite` correctly resolve agency server-side.)

10. **Sub-flag comments contradict themselves.** At `DashboardClient.tsx:104` and `MomentumView.tsx:17` the comment says `(no Math.random — causes hydration errors)` but the file `MomentumView.tsx:49` then immediately uses `Math.random()` for the 7-day engagement bar heights. (The contradiction is moot only because MomentumView never renders — point 1.)

11. **Grand total of "fake" UI surface.** Of the five dimensions, **four out of five** (trends, accuracy, rank, revenue) are fully or mostly invented numbers from `Math.random()` and hardcoded arrays. Only the "momentum" dimension is wired to real data — and even within momentum, the "Nd SILENT" indicator uses a deterministic stub (`(h * 31 + char) % 3`) rather than real last-post timestamps.
