/**
 * Intelligent Clay Registry — Single Source of Truth
 *
 * Declares ALL 18 action types, their implementation status, target DB tables,
 * confirmation styles, and handler locations. Also declares triage item types
 * and the action catalog that AgencyClient.tsx consumes.
 *
 * Mirrors the pattern of src/lib/prediction/system-registry.ts (D11): pure
 * typed constants, no server-only imports, safe for 'use client'.
 *
 * Reference: design doc §Action Handler Inventory,
 * CEO plan §Phase 1, Step 1 (Wire all 18 action handlers).
 */

// =============================================================================
// ACTION REGISTRY — all 18 operator-facing actions
// =============================================================================

/**
 * Status of each action's implementation.
 *  - `wired`       : handler fully implemented, returns structured confirmation
 *  - `placeholder` : handler runs but is a stub (e.g., export_report's alert)
 *  - `dead`        : declared in UI, no handler in AgencyClient.tsx actionHandlers map
 */
export type ActionStatus = 'wired' | 'placeholder' | 'dead';

/**
 * Classification for how the action affects state.
 *  - `chat`      : sends a prompt to the AI chat pipeline (read-only from DB POV)
 *  - `write`     : routes through /api/clay/action → action-handler.ts for DB mutation
 *  - `navigate`  : client-side navigation (route change / reload / external link)
 *  - `external`  : hits a 3rd-party API (email provider, etc.)
 */
export type ActionKind = 'chat' | 'write' | 'navigate' | 'external';

/**
 * How the confirmation card renders after the action resolves.
 *  - `inline`    : ActionConfirmationCard shown in-thread
 *  - `directive` : hidden ACTION_RESULT marker injected into chat → LLM renders spec
 *  - `silent`    : no confirmation (e.g., page reload)
 */
export type ConfirmationStyle = 'inline' | 'directive' | 'silent';

export interface ActionDefinition {
  /** Canonical action id used by AgencyClient.tsx actionHandlers map keys. */
  id: string;
  /** Current implementation status. */
  status: ActionStatus;
  /** What kind of side effect this action has. */
  kind: ActionKind;
  /** DB table the handler writes to, if any. */
  targetTable?: string;
  /** Required payload fields the handler needs. */
  requiredPayload?: string[];
  /** How the confirmation is surfaced to the operator. */
  confirmationStyle: ConfirmationStyle;
  /** Human-readable label for debug/docs. */
  label: string;
  /** Which component(s) can fire this action. */
  firedBy: string[];
  /** Handler location when wired, or the file that should own it when dead. */
  handlerLocation: string;
  /** Notes for the implementer (edge cases, dependencies, known quirks). */
  notes?: string;
}

export const ACTION_REGISTRY: Record<string, ActionDefinition> = {
  // -------------------------------------------------------------------------
  // WIRED (7) — already working before Phase 1
  // -------------------------------------------------------------------------
  analyze_creator: {
    id: 'analyze_creator',
    status: 'wired',
    kind: 'chat',
    confirmationStyle: 'silent',
    label: 'Deep analysis of creator',
    firedBy: ['CreatorProfileCard', 'MorningBriefCard', 'CalendarSnippetCard'],
    handlerLocation: 'AgencyClient.tsx actionHandlers.analyze_creator',
    notes: 'Sends chat message "Give me a deep analysis of [name]". Pure read.',
  },
  generate_brief: {
    id: 'generate_brief',
    status: 'wired',
    kind: 'chat',
    confirmationStyle: 'silent',
    label: 'Generate content brief for creator',
    firedBy: ['CreatorProfileCard', 'CalendarSnippetCard', 'TrendCard'],
    handlerLocation: 'AgencyClient.tsx actionHandlers.generate_brief',
    notes: 'Sends chat prompt. Distinct from generate_report (below, dead).',
  },
  refresh_data: {
    id: 'refresh_data',
    status: 'wired',
    kind: 'navigate',
    confirmationStyle: 'silent',
    label: 'Refresh the page',
    firedBy: ['KPISummaryCard', 'MorningBriefCard'],
    handlerLocation: 'AgencyClient.tsx actionHandlers.refresh_data',
    notes: 'window.location.reload(). Client-only, no DB round trip.',
  },
  navigate_creator: {
    id: 'navigate_creator',
    status: 'wired',
    kind: 'chat',
    confirmationStyle: 'silent',
    label: 'Deep-dive into creator profile',
    firedBy: ['CreatorProfileCard', 'KPISummaryCard'],
    handlerLocation: 'AgencyClient.tsx actionHandlers.navigate_creator',
  },
  update_brief_status: {
    id: 'update_brief_status',
    status: 'wired',
    kind: 'write',
    targetTable: 'content_briefs',
    requiredPayload: ['briefId', 'new_status'],
    confirmationStyle: 'directive',
    label: 'Update brief lifecycle status',
    firedBy: ['ContentBriefCard', 'MorningBriefCard'],
    handlerLocation: 'action-handler.ts case "update_brief_status"',
    notes: 'Valid new_status: acknowledged | in_production | published. Emits brief_status confirmation.',
  },
  log_performance: {
    id: 'log_performance',
    status: 'wired',
    kind: 'write',
    targetTable: 'content_briefs',
    requiredPayload: ['briefId', 'actual_views', 'actual_engagement_rate'],
    confirmationStyle: 'directive',
    label: 'Log post-publication performance',
    firedBy: ['ContentBriefCard', 'PerformanceTimelineCard'],
    handlerLocation: 'action-handler.ts case "log_performance"',
  },
  export_report: {
    id: 'export_report',
    status: 'placeholder',
    kind: 'navigate',
    confirmationStyle: 'silent',
    label: 'Export agency report',
    firedBy: ['AgencyScorecardCard', 'KPISummaryCard'],
    handlerLocation: 'AgencyClient.tsx actionHandlers.export_report',
    notes: 'Currently just alert("Export coming soon"). Phase 2C replaces with real PDF/PNG export.',
  },

  // -------------------------------------------------------------------------
  // DEAD (11) — declared in UI catalogs, missing handler (Turn 2 wires these)
  // -------------------------------------------------------------------------
  approve_brief: {
    id: 'approve_brief',
    status: 'dead',
    kind: 'write',
    targetTable: 'content_briefs',
    requiredPayload: ['briefId'],
    confirmationStyle: 'directive',
    label: 'Approve a generated brief',
    firedBy: ['ContentBriefCard', 'MorningBriefCard (action card)'],
    handlerLocation: 'action-handler.ts (new case) + AgencyClient.tsx actionHandlers (new key)',
    notes: 'Distinct from existing "approve" case which targets pre_generated_briefs. approve_brief sets content_briefs.status = "accepted" (the CHECK-constraint value that represents operator approval; the agency dashboard statusMap collapses "accepted" to the "Approved" tab).',
  },
  send_invite: {
    id: 'send_invite',
    status: 'dead',
    kind: 'external',
    targetTable: 'agency_invites',
    requiredPayload: ['creatorEmail', 'creatorName'],
    confirmationStyle: 'directive',
    label: 'Invite a creator via email',
    firedBy: ['CreatorProfileCard', 'MorningBriefCard'],
    handlerLocation: 'action-handler.ts (new case) + lib/email/send-invite.ts',
    notes: 'Must handle Nodemailer send failure → surface "Email failed to send" and log to chairman_alerts.',
  },
  nudge_creator: {
    id: 'nudge_creator',
    status: 'dead',
    kind: 'external',
    targetTable: 'content_briefs',
    requiredPayload: ['briefId', 'creatorId'],
    confirmationStyle: 'directive',
    label: 'Nudge creator about overdue brief',
    firedBy: ['ContentBriefCard (overdue)', 'MorningBriefCard (action card)'],
    handlerLocation: 'action-handler.ts (new case) + lib/email/send-nudge.ts',
    notes: 'Uses Nodemailer. Tracking pixel wired in Phase 1 Step 11. Updates content_briefs.last_nudged_at.',
  },
  create_event: {
    id: 'create_event',
    status: 'dead',
    kind: 'write',
    targetTable: 'agency_events',
    requiredPayload: ['eventName', 'eventDate', 'category'],
    confirmationStyle: 'directive',
    label: 'Create a new agency event',
    firedBy: ['CalendarSnippetCard'],
    handlerLocation: 'action-handler.ts (new case)',
  },
  match_creators_to_event: {
    id: 'match_creators_to_event',
    status: 'dead',
    kind: 'write',
    targetTable: 'profiles',
    requiredPayload: ['eventId'],
    confirmationStyle: 'directive',
    label: 'Find creators matching event niche',
    firedBy: ['CalendarSnippetCard'],
    handlerLocation: 'action-handler.ts (new case)',
    notes: 'Query profiles where niche overlap with agency_events.category. Returns list in confirmation.',
  },
  push_brief_to_creators: {
    id: 'push_brief_to_creators',
    status: 'dead',
    kind: 'external',
    targetTable: 'content_briefs',
    requiredPayload: ['briefId', 'creatorIds'],
    confirmationStyle: 'directive',
    label: 'Push brief to matched creators',
    firedBy: ['ContentBriefCard', 'CalendarSnippetCard'],
    handlerLocation: 'action-handler.ts (new case)',
    notes: 'Iterates creatorIds, sends brief email per creator, updates delivery_status per row.',
  },
  check_push_status: {
    id: 'check_push_status',
    status: 'dead',
    kind: 'write',
    targetTable: 'content_briefs',
    requiredPayload: ['briefId'],
    confirmationStyle: 'directive',
    label: 'Query brief delivery/open status',
    firedBy: ['ContentBriefCard', 'MorningBriefCard'],
    handlerLocation: 'action-handler.ts (new case)',
    notes: 'Read delivery_status + opened_at + clicked_at (added by Phase 1 migration). No DB write.',
  },
  generate_batch_briefs: {
    id: 'generate_batch_briefs',
    status: 'dead',
    kind: 'write',
    targetTable: 'content_briefs',
    requiredPayload: ['creatorIds', 'topic'],
    confirmationStyle: 'directive',
    label: 'Generate briefs for multiple creators',
    firedBy: ['CalendarSnippetCard', 'TrendCard'],
    handlerLocation: 'action-handler.ts (new case)',
    notes: 'Loop over creatorIds calling existing generate-brief logic. Return count in confirmation.',
  },
  schedule_post: {
    id: 'schedule_post',
    status: 'dead',
    kind: 'write',
    targetTable: 'scheduled_actions',
    requiredPayload: ['briefId', 'scheduledFor'],
    confirmationStyle: 'directive',
    label: 'Schedule a brief for future publication',
    firedBy: ['ContentBriefCard'],
    handlerLocation: 'action-handler.ts (new case)',
    notes: 'scheduled_actions table already exists (migration 20260411_prompt40). Uses existing scheduler/executors.ts.',
  },
  generate_report: {
    id: 'generate_report',
    status: 'dead',
    kind: 'write',
    targetTable: 'content_briefs',
    requiredPayload: ['timeWindow', 'agencyId'],
    confirmationStyle: 'directive',
    label: 'Generate agency performance report',
    firedBy: ['AgencyScorecardCard', 'KPISummaryCard'],
    handlerLocation: 'action-handler.ts (new case)',
    notes: 'Aggregate content_briefs performance data over timeWindow. Distinct from export_report (which delivers the file).',
  },
  reschedule_post: {
    id: 'reschedule_post',
    status: 'dead',
    kind: 'write',
    targetTable: 'scheduled_actions',
    requiredPayload: ['scheduledActionId', 'newScheduledFor'],
    confirmationStyle: 'directive',
    label: 'Reschedule a pending post',
    firedBy: ['ContentBriefCard', 'CalendarSnippetCard'],
    handlerLocation: 'action-handler.ts (new case)',
  },
};

/** All action IDs, for catalog enumeration. */
export const ALL_ACTION_IDS = Object.keys(ACTION_REGISTRY);

/** All dead actions (the Phase 1 Step 1 backlog). */
export const DEAD_ACTION_IDS = ALL_ACTION_IDS.filter(
  (id) => ACTION_REGISTRY[id].status === 'dead',
);

/** All actions that mutate DB (used by action-handler.ts switch generation). */
export const WRITE_ACTION_IDS = ALL_ACTION_IDS.filter(
  (id) => ACTION_REGISTRY[id].kind === 'write' || ACTION_REGISTRY[id].kind === 'external',
);

// =============================================================================
// TRIAGE ITEM TYPES — overnight BullMQ job output shape
// =============================================================================

/**
 * Types of triage items the overnight job produces. Each drives a different
 * action card in the morning brief.
 */
export type TriageItemType = 'overdue_brief' | 'performance_highlight' | 'trend_opportunity';

export interface TriageItem {
  type: TriageItemType;
  /** 1-10. Used to sort within the top-5 cap. */
  urgency: number;
  creator_id: string;
  creator_name: string;
  /** One-line description for the hero/action card ("Marcus +32% over prediction"). */
  summary: string;
  /** Type-specific payload. */
  data: Record<string, unknown>;
  /** Action IDs the card can fire. Must be keys of ACTION_REGISTRY. */
  suggested_actions: string[];
}

/**
 * Urgency scoring formulas (design doc §Overnight Triage Specification, Scoring).
 * Implementer in overnight-triage.ts applies these.
 */
export const URGENCY_SCORING = {
  overdue_brief: {
    formula: 'min(10, days_overdue * 2)',
    description: 'Brief delivered 4+ days ago with no acknowledgment = urgency 8',
  },
  trend_opportunity: {
    formula: '10 - (hours_remaining / max_window_hours * 10)',
    description: '6hr window with 2hr left = urgency 7',
  },
  performance_highlight: {
    formula: 'performance_delta > 30% ? 5 : 2',
    description: 'Always low (informational). Boosted to 5 if delta > 30%.',
  },
} as const;

/** Tie-break priority when two items have equal urgency. */
export const TRIAGE_TYPE_PRIORITY: Record<TriageItemType, number> = {
  overdue_brief: 3,
  trend_opportunity: 2,
  performance_highlight: 1,
};

/** Max items per agency per day (design doc §Cap). */
export const TRIAGE_MAX_ITEMS = 5;

/** Days of triage history to retain (design doc §Retention). */
export const TRIAGE_RETENTION_DAYS = 30;

// =============================================================================
// INFORMATION ARCHITECTURE — per-surface hierarchy (from design review addendum)
// =============================================================================

/**
 * Morning brief IA — 4 zones in vertical order.
 * Per Pass 1 decisions (2026-04-17 design review):
 *  - Zone 1 HERO: most urgent item wins over biggest performance win
 *  - Zone 4 PULSE: real avatars, never placeholder icon-in-circles
 */
export const MORNING_BRIEF_ZONES = [
  {
    zone: 'hero',
    order: 1,
    component: 'MorningBriefCard (hero variant)',
    sourceData: 'agency_triage.items[0]',
    empty: 'All quiet on the roster. Nothing needs you right now.',
    notes: 'Urgency wins over wins. On triage failure, show last-known-good with "Stale: from [yesterday]" banner.',
  },
  {
    zone: 'action_cards',
    order: 2,
    component: 'ContentBriefCard (action variant)',
    sourceData: 'agency_triage.items[1..3]',
    empty: '(omit zone if zero items)',
    notes: 'Max 3, vertical stack (NOT grid). Left-aligned, typography-first, no decorative icons.',
  },
  {
    zone: 'wins_strip',
    order: 3,
    component: 'PerformanceTimelineCard (wins variant)',
    sourceData: 'prediction_runs ORDER BY (actual_views - predicted_views) DESC LIMIT 5',
    empty: '"No wins yet — watch this space."',
    notes: 'Horizontal scroll. Ranked by VPS delta DESC.',
  },
  {
    zone: 'creator_pulse',
    order: 4,
    component: 'CreatorProfileCard (pulse variant)',
    sourceData: 'profiles WHERE agency_id=? (status = derived)',
    empty: '"Add creators to see their pulse."',
    notes: 'Small ambient footer band. Real avatars only.',
  },
] as const;

// =============================================================================
// DESIGN SYSTEM BINDINGS — DESIGN.md token per surface (from design review Pass 5)
// =============================================================================

export const DESIGN_TOKEN_BINDINGS = {
  'morning_brief_page':      { surface: 'surface-primary',   text: 'text-primary',   accent: 'accent-blue' },
  'hero_card_urgent':        { surface: 'surface-elevated',  text: 'text-primary',   accent: 'accent-coral', wash: 'status-error-bg' },
  'action_card':             { surface: 'surface-elevated',  text: 'text-primary',   accent: 'accent-blue',  badge: 'status-warning' },
  'wins_strip_pill':         { surface: 'surface-elevated',  text: 'text-primary',   accent: null,            wash: 'status-success-bg', delta: 'status-success' },
  'creator_pulse_avatar':    { surface: 'surface-primary',   text: 'text-secondary', dot: 'status-*' },
  'agency_scorecard_live':   { surface: 'surface-primary',   text: 'text-primary',   accent: 'accent-blue' },
  'shareable_scorecard':     { surface: 'surface-secondary', text: 'text-primary',   accent: 'accent-coral' },
  'free_user_vps_card':      { surface: 'surface-elevated',  text: 'text-primary',   accent: 'accent-blue' },
  'managed_by_agency_footer':{ surface: 'inherit',            text: 'text-tertiary',  accent: null },
} as const;

// =============================================================================
// CEO-APPROVED STRATEGIC DECISIONS (2026-04-17)
// =============================================================================

export const STRATEGIC_DECISIONS = {
  D1_scorecard_hero_metric: '22 hours saved this month',
  D2_weekly_win_email: {
    mode: 'auto',
    unsubscribe: 'one-click footer link',
  },
  D3_kill_criteria: {
    threshold_days: 7,
    measure_from: 'after first week of activity',
    signal: 'no /agency open',
  },
  D4_trendzo_brand_mark: {
    placement: 'header, left of agency name',
    togglable_per_agency: true,
    white_label_default: false,
  },
} as const;
