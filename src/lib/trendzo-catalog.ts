import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod4';

export const trendzoCatalog = defineCatalog(schema, {
  components: {
    // === LAYOUT ===
    Row: {
      props: z.object({
        gap: z.number().optional(),
        align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
        wrap: z.boolean().optional(),
      }),
      slots: ['default'],
      description: 'Horizontal flex container for arranging children side by side',
    },
    Column: {
      props: z.object({
        gap: z.number().optional(),
        align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
      }),
      slots: ['default'],
      description: 'Vertical flex container for stacking children',
    },
    Grid: {
      props: z.object({
        columns: z.number().min(1).max(4),
        gap: z.number().optional(),
      }),
      slots: ['default'],
      description: 'CSS grid layout with specified column count',
    },
    Section: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
      }),
      slots: ['default'],
      description: 'Titled section with optional subtitle, used to group related content',
    },

    // === DATA DISPLAY ===
    KPICard: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        change: z.string().optional(),
        changeDirection: z.enum(['up', 'down', 'neutral']).optional(),
        accentColor: z.enum(['crimson', 'violet', 'cyan', 'gold', 'green']).optional(),
      }),
      description: 'Key performance indicator card with value, label, and optional trend. Use for metrics like total creators, average VPS, scripts this week, active briefs.',
    },
    CreatorCard: {
      props: z.object({
        name: z.string(),
        niche: z.string(),
        vpsScore: z.number(),
        scriptCount: z.number(),
        status: z.enum(['active', 'inactive', 'onboarding']),
        lastActive: z.string().optional(),
        avatarColor: z.enum(['crimson', 'violet', 'cyan', 'gold', 'green']).optional(),
      }),
      description: 'Creator profile card showing name, niche, VPS score (colored circle: green 80+, gold 70-79, red below 70), script count, and activity status. Use when showing individual creator info.',
    },
    VPSRing: {
      props: z.object({
        score: z.number().min(0).max(100),
        label: z.string().optional(),
        size: z.enum(['sm', 'md', 'lg']).optional(),
      }),
      description: 'Circular VPS score indicator with color coding. Green for 80+, gold for 70-79, red for below 70.',
    },
    MorningBriefCard: {
      props: z.object({
        title: z.string(),
        body: z.string(),
        severity: z.enum(['success', 'warning', 'info']),
        timestamp: z.string().optional(),
      }),
      description: 'Morning brief notification card with colored left border (green=success, red=warning, cyan=info). Use for daily digest items, alerts, and status updates.',
    },
    ScriptCard: {
      props: z.object({
        title: z.string(),
        creatorName: z.string(),
        vpsScore: z.number().optional(),
        status: z.enum(['draft', 'review', 'approved', 'published']),
        hookPreview: z.string().optional(),
        createdAt: z.string().optional(),
      }),
      description: 'Content script card showing title, creator, VPS prediction score, status badge, and hook preview text.',
    },
    TrendItem: {
      props: z.object({
        topic: z.string(),
        category: z.string(),
        momentum: z.enum(['rising', 'peaking', 'declining']),
        relevanceScore: z.number().optional(),
        description: z.string().optional(),
      }),
      description: 'Trending topic item showing topic name, category, momentum direction with colored indicator, and relevance score.',
    },
    ComparisonTable: {
      props: z.object({
        title: z.string().optional(),
        headers: z.array(z.string()),
        rows: z.array(z.array(z.string())),
      }),
      description: 'Data comparison table with headers and rows. Use for side-by-side creator comparisons, performance breakdowns, or any tabular data.',
    },

    // === FEEDBACK & STATUS ===
    StatBadge: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        variant: z.enum(['default', 'success', 'warning', 'danger']).optional(),
      }),
      description: 'Small inline badge showing a label-value pair with optional color variant.',
    },
    AlertBanner: {
      props: z.object({
        title: z.string(),
        message: z.string(),
        variant: z.enum(['info', 'success', 'warning', 'danger']),
      }),
      description: 'Full-width alert banner for important notifications or status messages.',
    },
    EmptyState: {
      props: z.object({
        title: z.string(),
        message: z.string(),
        icon: z.enum(['search', 'chart', 'user', 'clock']).optional(),
      }),
      description: 'Placeholder shown when no data is available for a section.',
    },

    // === TYPOGRAPHY ===
    Heading: {
      props: z.object({
        text: z.string(),
        level: z.enum(['h1', 'h2', 'h3']).optional(),
      }),
      description: 'Display heading using Playfair Display font. h1 for page titles, h2 for sections, h3 for subsections.',
    },
    Text: {
      props: z.object({
        content: z.string(),
        variant: z.enum(['body', 'caption', 'mono', 'label']).optional(),
      }),
      description: 'Text paragraph. body=DM Sans, caption=smaller DM Sans, mono=JetBrains Mono, label=uppercase tracking-wider.',
    },

    // === INTERACTIVE ===
    ActionButton: {
      props: z.object({
        label: z.string(),
        action: z.string(),
        variant: z.enum(['primary', 'secondary', 'ghost', 'danger']).optional(),
        icon: z.enum(['analyze', 'generate', 'export', 'refresh', 'navigate']).optional(),
      }),
      description: 'Button that triggers an action. primary=violet gradient, secondary=bordered, ghost=text only, danger=crimson.',
    },

    // === CREATOR DEEP-DIVE ===
    CreatorProfile: {
      description: 'Full creator profile header with avatar, stats, and bio. Use as the hero element at the top of any creator deep-dive.',
      props: z.object({
        creator_name: z.string().describe('Full display name'),
        handle: z.string().describe('TikTok handle with @ prefix'),
        niche: z.string().describe('Primary content niche'),
        follower_count: z.number().describe('Current follower count'),
        vps_score: z.number().min(0).max(100).describe('Current VPS score'),
        avatar_url: z.string().optional().describe('Profile image URL'),
        bio: z.string().optional().describe('Creator bio or tagline'),
        join_date: z.string().optional().describe('When they joined the agency, ISO date'),
        total_videos: z.number().optional().describe('Total videos analyzed'),
        avg_dps: z.number().optional().describe('Average DPS across all scored content'),
        top_dps: z.number().optional().describe('Highest DPS score achieved'),
        status: z.enum(['active', 'inactive', 'onboarding']).optional().describe('Current creator status'),
      }),
    },
    VPSTimeline: {
      description: 'Timeline chart showing VPS score changes over time. Shows trajectory and momentum. Use after CreatorProfile to show score history.',
      props: z.object({
        creator_name: z.string().describe('Creator this timeline belongs to'),
        data_points: z.array(z.object({
          date: z.string().describe('ISO date string'),
          score: z.number().min(0).max(100).describe('VPS score at this date'),
          label: z.string().optional().describe('Optional annotation like "Script #4 published"'),
        })).describe('Chronological VPS data points'),
        current_score: z.number().min(0).max(100).describe('Most recent VPS score'),
        trend: z.enum(['rising', 'falling', 'stable']).describe('Overall trend direction'),
        period: z.string().optional().describe('Time period shown, e.g. "Last 30 days"'),
      }),
    },
    NicheRanking: {
      description: 'Shows how a creator ranks against peers in their niche. Displays position, percentile, and comparison to top/bottom performers.',
      props: z.object({
        creator_name: z.string().describe('Creator being ranked'),
        niche: z.string().describe('The niche cohort'),
        rank: z.number().describe('Position in niche (1 = best)'),
        total_in_niche: z.number().describe('Total creators in this niche cohort'),
        percentile: z.number().min(0).max(100).describe('Percentile ranking within niche'),
        creator_vps: z.number().describe('This creator VPS'),
        niche_avg_vps: z.number().describe('Average VPS in niche'),
        top_performer_vps: z.number().describe('Highest VPS in niche'),
        bottom_performer_vps: z.number().describe('Lowest VPS in niche'),
      }),
    },
    ContentTable: {
      description: 'Sortable table showing a creator videos with DPS scores and engagement metrics. Use for detailed content analysis.',
      props: z.object({
        creator_name: z.string().describe('Creator whose content is shown'),
        videos: z.array(z.object({
          title: z.string().describe('Video title or first line of caption'),
          dps_score: z.number().optional().describe('DPS score if available'),
          views: z.number().describe('View count'),
          shares: z.number().optional().describe('Share count'),
          saves: z.number().optional().describe('Save count'),
          comments: z.number().optional().describe('Comment count'),
          posted_date: z.string().optional().describe('When the video was posted'),
          url: z.string().optional().describe('TikTok URL'),
        })).describe('Array of video entries'),
        sort_by: z.enum(['dps_score', 'views', 'shares', 'posted_date']).optional().describe('Current sort column'),
        total_videos: z.number().optional().describe('Total videos in database for this creator'),
      }),
    },
    EngagementBreakdown: {
      description: 'Visual breakdown comparing creator engagement rates against niche averages. Shows share, save, comment, and view-to-follower ratios as horizontal bars with niche comparison.',
      props: z.object({
        creator_name: z.string().describe('Creator being analyzed'),
        niche: z.string().describe('Niche for comparison'),
        metrics: z.array(z.object({
          metric_name: z.string().describe('e.g. "Share Rate", "Save Rate", "Comment Rate", "View/Follower Ratio"'),
          creator_value: z.number().describe('Creator metric value as percentage or ratio'),
          niche_avg: z.number().describe('Niche average for same metric'),
          unit: z.enum(['percent', 'ratio', 'count']).optional().describe('How to display the value'),
        })).describe('Engagement metrics with niche comparison'),
        overall_engagement_grade: z.enum(['A', 'B', 'C', 'D', 'F']).optional().describe('Letter grade vs niche'),
      }),
    },
    RecommendationCard: {
      description: 'Strategic recommendation card with priority level, title, rationale, and action items. Use at the end of a deep-dive to give actionable advice.',
      props: z.object({
        title: z.string().describe('Recommendation headline'),
        priority: z.enum(['critical', 'high', 'medium', 'low']).describe('Priority level'),
        rationale: z.string().describe('Why this recommendation matters — 2-3 sentences'),
        action_items: z.array(z.string()).describe('Specific next steps the agency should take'),
        expected_impact: z.string().optional().describe('What improvement to expect'),
        timeframe: z.string().optional().describe('e.g. "Next 2 weeks", "Immediate"'),
      }),
    },

    // === ONBOARDING MANAGEMENT ===
    OnboardingPipeline: {
      description: 'Visual pipeline showing creators grouped by onboarding stage. Use when the agency asks about onboarding status, pipeline, or "who is where in onboarding." Renders as a horizontal stage flow.',
      props: z.object({
        stages: z.array(z.object({
          stage_name: z.string().describe('Stage label, e.g. "Invited", "Profile Setup", "Calibrating", "Ready", "Active"'),
          stage_key: z.string().describe('Machine key, e.g. "invited", "profile_setup", "calibrating", "ready", "active"'),
          creators: z.array(z.object({
            name: z.string(),
            handle: z.string().optional(),
            niche: z.string().optional(),
            days_in_stage: z.number().optional().describe('Days spent in this stage'),
            avatar_initials: z.string().optional().describe('1-2 letter initials for avatar'),
          })).describe('Creators currently in this stage'),
          color: z.string().optional().describe('Accent color for this stage'),
        })).describe('Ordered list of pipeline stages with creators in each'),
        total_creators: z.number().describe('Total creators across all stages'),
        avg_completion_days: z.number().optional().describe('Average days from invite to active'),
      }),
    },
    OnboardingStats: {
      description: 'Summary statistics for the onboarding funnel. Shows total invited, in-progress, completed, and drop-off metrics. Use at the top of onboarding overviews.',
      props: z.object({
        total_invited: z.number().describe('Total creators ever invited'),
        currently_onboarding: z.number().describe('Creators currently in the onboarding pipeline'),
        completed: z.number().describe('Creators who finished onboarding and are active'),
        dropped_off: z.number().describe('Creators who stopped or were removed during onboarding'),
        completion_rate: z.number().min(0).max(100).describe('Percentage who complete onboarding'),
        avg_days_to_complete: z.number().optional().describe('Average days from invite to active'),
        this_week_new: z.number().optional().describe('New invites sent this week'),
        this_week_completed: z.number().optional().describe('Completed onboarding this week'),
      }),
    },
    CalibrationProgress: {
      description: 'Shows a creator calibration progress through the Viral DNA Fingerprint profiling process. Displays completion percentage, steps done, and what remains. Use when asked about a specific creator onboarding progress.',
      props: z.object({
        creator_name: z.string().describe('Creator being tracked'),
        handle: z.string().optional(),
        completion_percent: z.number().min(0).max(100).describe('Overall calibration completion'),
        steps: z.array(z.object({
          step_name: z.string().describe('e.g. "Profile Basics", "Video Reactions", "Niche Preferences", "Content Style", "Posting Schedule"'),
          status: z.enum(['completed', 'in_progress', 'not_started']).describe('Step status'),
          completed_at: z.string().optional().describe('ISO date when completed'),
        })).describe('Ordered calibration steps'),
        started_at: z.string().optional().describe('When calibration began'),
        last_activity: z.string().optional().describe('Last time creator was active in calibration'),
        estimated_remaining: z.string().optional().describe('e.g. "~10 minutes", "2 steps left"'),
      }),
    },
    OnboardingCreatorRow: {
      description: 'Compact row showing one creator onboarding status with key info and actions. Use inside lists or when showing multiple creators onboarding states.',
      props: z.object({
        creator_name: z.string(),
        handle: z.string().optional(),
        niche: z.string().optional(),
        stage: z.enum(['invited', 'profile_setup', 'calibrating', 'ready', 'active', 'dropped']).describe('Current onboarding stage'),
        invited_date: z.string().optional().describe('When the invite was sent'),
        days_in_pipeline: z.number().optional().describe('Total days since invite'),
        calibration_percent: z.number().min(0).max(100).optional().describe('Calibration completion if in calibrating stage'),
        blocker: z.string().optional().describe('What is holding them up, if anything'),
        avatar_initials: z.string().optional(),
      }),
    },
    InviteCard: {
      description: 'Displays an invitation that was sent or is pending. Shows invite details, status, and expiration. Use when the agency asks about invites or wants to manage pending invitations.',
      props: z.object({
        creator_name: z.string().optional().describe('Name if known'),
        email: z.string().optional().describe('Email invite was sent to'),
        invite_status: z.enum(['pending', 'accepted', 'expired', 'revoked']).describe('Current invite status'),
        sent_date: z.string().describe('When the invite was sent'),
        expires_date: z.string().optional().describe('When the invite expires'),
        accepted_date: z.string().optional().describe('When the invite was accepted'),
        invite_code: z.string().optional().describe('Invite code or link identifier'),
        niche: z.string().optional().describe('Expected niche for this creator'),
        sent_by: z.string().optional().describe('Who sent the invite'),
      }),
    },
    OnboardingTimeline: {
      description: 'Chronological timeline of onboarding milestones and events for a creator. Shows the journey from invite to active. Use when asked about a specific creator onboarding journey or history.',
      props: z.object({
        creator_name: z.string(),
        events: z.array(z.object({
          event_type: z.enum(['invited', 'accepted', 'profile_started', 'profile_completed', 'calibration_started', 'calibration_step_done', 'calibration_completed', 'activated', 'dropped', 'reactivated', 'note']).describe('Type of onboarding event'),
          description: z.string().describe('Human-readable description of what happened'),
          timestamp: z.string().describe('ISO datetime'),
          metadata: z.string().optional().describe('Additional context like step name or reason'),
        })).describe('Chronological list of onboarding events'),
        current_stage: z.string().describe('Where they are now'),
        total_days: z.number().optional().describe('Days from first event to now'),
      }),
    },

    // === CULTURAL EVENT MANAGEMENT ===
    EventCard: {
      description: 'Displays a cultural event, trend, or moment that creators should prepare content for. Shows event name, date, category, relevance score, and matched creators. Use when showing individual events.',
      props: z.object({
        event_name: z.string().describe('Name of the cultural event or moment'),
        event_date: z.string().describe('When the event occurs or peaks, ISO date'),
        category: z.enum(['holiday', 'trending_topic', 'cultural_moment', 'industry_event', 'seasonal', 'platform_trend', 'news_cycle']).describe('Event category'),
        description: z.string().describe('Brief description of the event and why it matters for content'),
        relevance_score: z.number().min(0).max(100).optional().describe('How relevant this event is to the agency creators, 0-100'),
        matched_niches: z.array(z.string()).optional().describe('Niches this event is most relevant to'),
        matched_creators: z.array(z.object({
          name: z.string(),
          niche: z.string().optional(),
          fit_reason: z.string().optional().describe('Why this creator is a good match'),
        })).optional().describe('Creators who should create content for this event'),
        days_until: z.number().optional().describe('Days until the event'),
        status: z.enum(['upcoming', 'active', 'passed', 'draft']).optional().describe('Event status'),
        content_suggestions: z.array(z.string()).optional().describe('Content angle suggestions for this event'),
        source: z.string().optional().describe('Where this event was sourced from'),
      }),
    },
    EventCalendar: {
      description: 'Calendar view showing cultural events across a time period. Use when the agency asks to see upcoming events, the content calendar, or "what is coming up." Shows events plotted on a timeline.',
      props: z.object({
        view_mode: z.enum(['week', 'month']).describe('Calendar view mode'),
        start_date: z.string().describe('Start of the visible period, ISO date'),
        events: z.array(z.object({
          event_name: z.string(),
          event_date: z.string(),
          category: z.string(),
          relevance_score: z.number().optional(),
          days_until: z.number().optional(),
        })).describe('Events to display on the calendar'),
        total_events: z.number().optional().describe('Total events in the system'),
        highlight_today: z.boolean().optional().describe('Whether to highlight today on the calendar'),
      }),
    },
    EventForm: {
      description: 'Form for entering a new cultural event or editing an existing one. Renders as a structured form with fields for event details. Use when the agency wants to "add an event", "log a trend", or "create a cultural moment."',
      props: z.object({
        mode: z.enum(['create', 'edit']).describe('Whether creating new or editing existing'),
        prefilled: z.object({
          event_name: z.string().optional(),
          event_date: z.string().optional(),
          category: z.string().optional(),
          description: z.string().optional(),
          matched_niches: z.array(z.string()).optional(),
          source: z.string().optional(),
        }).optional().describe('Pre-filled values if editing or if AI detected event details from conversation'),
        available_niches: z.array(z.string()).optional().describe('Niches available in this agency for matching'),
        available_categories: z.array(z.string()).optional().describe('Event categories to choose from'),
      }),
    },
    TrendAlert: {
      description: 'Urgent or time-sensitive alert about a trending topic or imminent event. More compact and attention-grabbing than EventCard. Use for events happening within 48 hours or trending topics that need immediate action.',
      props: z.object({
        alert_title: z.string().describe('Short alert headline'),
        urgency: z.enum(['immediate', 'today', 'this_week', 'upcoming']).describe('How urgent this is'),
        description: z.string().describe('Brief context on why this matters now'),
        recommended_action: z.string().describe('What the agency should do about it'),
        affected_creators: z.array(z.string()).optional().describe('Creator names who should act on this'),
        expires_at: z.string().optional().describe('When this alert is no longer relevant'),
        source: z.string().optional().describe('Where this trend was detected'),
      }),
    },
    EventSummary: {
      description: 'Summary statistics about cultural events — how many are upcoming, how many have content planned, coverage gaps. Use at the top of event overviews.',
      props: z.object({
        total_events: z.number().describe('Total cultural events in the system'),
        upcoming_this_week: z.number().describe('Events happening this week'),
        upcoming_this_month: z.number().describe('Events happening this month'),
        with_content_planned: z.number().describe('Events that have at least one creator assigned or brief generated'),
        without_content: z.number().describe('Events with no content planned — coverage gaps'),
        top_category: z.string().optional().describe('Most common event category'),
        next_event: z.object({
          name: z.string(),
          date: z.string(),
          days_until: z.number(),
        }).optional().describe('The next upcoming event'),
      }),
    },

    // === EVENT-TO-CREATOR BRIDGE ===
    EventBrief: {
      description: 'Content brief generated from a cultural event. Contains talking points, content angles, deadlines, and creator assignments. Use when the agency asks to "push an event to creators", "create briefs for an event", or "prepare creators for an event."',
      props: z.object({
        event_name: z.string().describe('The cultural event this brief is for'),
        event_date: z.string().describe('When the event occurs'),
        brief_title: z.string().describe('Title of the content brief'),
        content_angle: z.string().describe('The specific angle or hook for content creation'),
        talking_points: z.array(z.string()).describe('Key points creators should cover'),
        content_format: z.enum(['video', 'series', 'duet', 'stitch', 'live', 'story', 'any']).optional().describe('Recommended content format'),
        tone: z.string().optional().describe('Recommended tone, e.g. "educational", "entertaining", "emotional"'),
        hashtags: z.array(z.string()).optional().describe('Suggested hashtags'),
        deadline: z.string().optional().describe('When content should be posted by, ISO date'),
        priority: z.enum(['urgent', 'high', 'normal', 'low']).optional().describe('Brief priority level'),
        assigned_creators: z.array(z.object({
          name: z.string(),
          niche: z.string().optional(),
          status: z.enum(['pending', 'accepted', 'in_progress', 'submitted', 'published']).optional(),
          personalized_angle: z.string().optional().describe('Angle tailored to this specific creator'),
        })).optional().describe('Creators this brief is assigned to'),
        reference_links: z.array(z.string()).optional().describe('URLs for reference material'),
      }),
    },
    CreatorMatch: {
      description: 'Detailed match analysis between a creator and a cultural event. Shows fit score, reasoning, and personalized content suggestions. Use when explaining WHY a creator should cover a specific event.',
      props: z.object({
        creator_name: z.string(),
        handle: z.string().optional(),
        niche: z.string(),
        vps_score: z.number().optional(),
        event_name: z.string(),
        fit_score: z.number().min(0).max(100).describe('How well this creator fits this event, 0-100'),
        fit_reasons: z.array(z.string()).describe('Specific reasons this creator is a good match'),
        suggested_angles: z.array(z.string()).describe('Content angles tailored to this creator + event combo'),
        risk_factors: z.array(z.string()).optional().describe('Potential risks or concerns about this match'),
        past_performance: z.object({
          similar_content_count: z.number().optional(),
          avg_dps_similar: z.number().optional(),
          best_performing_similar: z.string().optional(),
        }).optional().describe('How this creator has performed on similar content'),
      }),
    },
    PushStatus: {
      description: 'Status tracker showing which creators have received an event brief, their response status, and content progress. Use when the agency asks "how is the push going?" or wants to track brief distribution.',
      props: z.object({
        event_name: z.string(),
        push_date: z.string().optional().describe('When the push was initiated'),
        deadline: z.string().optional(),
        creators: z.array(z.object({
          name: z.string(),
          status: z.enum(['not_sent', 'sent', 'viewed', 'accepted', 'in_progress', 'submitted', 'published', 'declined']),
          sent_at: z.string().optional(),
          responded_at: z.string().optional(),
          content_url: z.string().optional().describe('URL to their content if published'),
          notes: z.string().optional(),
        })).describe('Creator-level push status'),
        summary: z.object({
          total: z.number(),
          sent: z.number(),
          accepted: z.number(),
          published: z.number(),
          pending: z.number(),
        }).optional().describe('Aggregate push stats'),
      }),
    },
    BriefPreview: {
      description: 'Compact preview of a content brief. Shows title, event, deadline, and creator count. Use in lists when showing multiple briefs at once.',
      props: z.object({
        brief_title: z.string(),
        event_name: z.string(),
        content_angle: z.string(),
        deadline: z.string().optional(),
        priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
        creator_count: z.number().optional().describe('Number of creators assigned'),
        status: z.enum(['draft', 'sent', 'in_progress', 'completed']).optional(),
        completion_percent: z.number().min(0).max(100).optional().describe('What percentage of creators have published'),
      }),
    },
    PushConfirmation: {
      description: 'Confirmation card shown before pushing an event brief to creators. Summarizes what will be sent and to whom. Use as the final step before executing a push.',
      props: z.object({
        event_name: z.string(),
        brief_title: z.string(),
        content_angle: z.string(),
        target_creators: z.array(z.object({
          name: z.string(),
          niche: z.string().optional(),
          personalized_angle: z.string().optional(),
        })).describe('Creators who will receive this brief'),
        deadline: z.string().optional(),
        priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
        estimated_reach: z.number().optional().describe('Estimated total follower reach across assigned creators'),
      }),
    },

    // === BATCH OPERATIONS ===
    BriefGrid: {
      description: 'Grid of content briefs for batch review and management. Shows multiple briefs as cards in a responsive grid. Use when the agency asks to "generate briefs for all events", "show all pending briefs", or needs to review multiple briefs at once.',
      props: z.object({
        title: z.string().optional().describe('Grid header, e.g. "Batch Briefs for Week of June 2"'),
        briefs: z.array(z.object({
          brief_title: z.string(),
          event_name: z.string(),
          content_angle: z.string(),
          deadline: z.string().optional(),
          priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
          creator_count: z.number().optional(),
          status: z.enum(['draft', 'sent', 'in_progress', 'completed']).optional(),
          completion_percent: z.number().min(0).max(100).optional(),
        })).describe('Array of brief summaries to display'),
        total_briefs: z.number().optional(),
        filter_active: z.string().optional().describe('Currently active filter, e.g. "urgent only", "this week"'),
      }),
    },
    BriefEditor: {
      description: 'Detailed view of a single brief for editing within a batch workflow. Shows all brief fields with the ability to review and approve. Use when the user selects a specific brief from a BriefGrid to edit.',
      props: z.object({
        brief_title: z.string(),
        event_name: z.string(),
        event_date: z.string().optional(),
        content_angle: z.string(),
        talking_points: z.array(z.string()),
        content_format: z.enum(['video', 'series', 'duet', 'stitch', 'live', 'story', 'any']).optional(),
        tone: z.string().optional(),
        hashtags: z.array(z.string()).optional(),
        deadline: z.string().optional(),
        priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
        assigned_creators: z.array(z.object({
          name: z.string(),
          niche: z.string().optional(),
          personalized_angle: z.string().optional(),
          status: z.enum(['pending', 'accepted', 'in_progress', 'submitted', 'published']).optional(),
        })).optional(),
        editor_notes: z.string().optional().describe('Notes or feedback from the agency operator'),
        version: z.number().optional().describe('Brief version number for iteration tracking'),
        ai_confidence: z.number().min(0).max(100).optional().describe('AI confidence in this brief quality'),
      }),
    },
    BatchProgress: {
      description: 'Progress tracker showing how a batch brief generation job is progressing. Shows total, completed, and in-progress counts with a progress bar. Use during and after batch generation.',
      props: z.object({
        batch_name: z.string().describe('Name of the batch, e.g. "June Week 1 Briefs"'),
        total: z.number().describe('Total briefs in the batch'),
        generated: z.number().describe('Briefs fully generated'),
        in_review: z.number().describe('Briefs awaiting agency review'),
        approved: z.number().describe('Briefs approved and ready to push'),
        sent: z.number().describe('Briefs already pushed to creators'),
        progress_percent: z.number().min(0).max(100).describe('Overall batch progress'),
        started_at: z.string().optional(),
        estimated_completion: z.string().optional().describe('Estimated completion time or date'),
        errors: z.array(z.object({
          brief_title: z.string(),
          error: z.string(),
        })).optional().describe('Briefs that failed to generate'),
      }),
    },
    CreatorBriefAssignment: {
      description: 'Matrix view showing creator-to-brief assignments. Rows are creators, columns are events/briefs. Use when the agency wants to see "who is assigned to what" or review workload distribution.',
      props: z.object({
        creators: z.array(z.object({
          name: z.string(),
          niche: z.string().optional(),
          total_assigned: z.number(),
          total_completed: z.number(),
        })).describe('Creators with their assignment counts'),
        events: z.array(z.object({
          event_name: z.string(),
          deadline: z.string().optional(),
        })).describe('Events/briefs as columns'),
        assignments: z.array(z.object({
          creator_name: z.string(),
          event_name: z.string(),
          status: z.enum(['assigned', 'in_progress', 'submitted', 'published', 'not_assigned']),
        })).describe('The matrix cells — each creator × event combination'),
        workload_warning: z.string().optional().describe('Warning if any creator is overloaded'),
      }),
    },
    BatchSummary: {
      description: 'Summary card showing results of a batch brief generation. Total briefs created, creators covered, events covered, and key stats. Use after a batch generation completes.',
      props: z.object({
        batch_name: z.string(),
        total_briefs_generated: z.number(),
        total_creators_covered: z.number(),
        total_events_covered: z.number(),
        priority_breakdown: z.object({
          urgent: z.number(),
          high: z.number(),
          normal: z.number(),
          low: z.number(),
        }).optional(),
        avg_ai_confidence: z.number().optional().describe('Average AI confidence across generated briefs'),
        coverage_gaps: z.array(z.object({
          event_name: z.string(),
          missing_niches: z.array(z.string()),
        })).optional().describe('Events that still lack coverage for certain niches'),
        next_steps: z.array(z.string()).optional().describe('Recommended next actions after batch generation'),
      }),
    },

    // === CONTENT CALENDAR ===
    CalendarView: {
      description: 'Full content calendar showing scheduled posts, event deadlines, and brief due dates across a time period. The central scheduling hub. Use when the agency asks to "show me the calendar", "what is scheduled", or "content schedule."',
      props: z.object({
        view_mode: z.enum(['day', 'week', 'month']).describe('Calendar granularity'),
        current_date: z.string().describe('The focal date for the calendar view, ISO date'),
        items: z.array(z.object({
          id: z.string().optional(),
          title: z.string().describe('Item title'),
          date: z.string().describe('Scheduled date, ISO date'),
          time: z.string().optional().describe('Scheduled time if applicable, e.g. "2:00 PM"'),
          type: z.enum(['post', 'event', 'brief_deadline', 'milestone', 'reminder']).describe('What kind of calendar item'),
          creator_name: z.string().optional().describe('Which creator this is for'),
          niche: z.string().optional(),
          status: z.enum(['scheduled', 'draft', 'published', 'overdue', 'cancelled']).optional(),
          color: z.string().optional().describe('Override color for the item'),
        })).describe('All items to display on the calendar'),
        total_items: z.number().optional(),
        has_conflicts: z.boolean().optional().describe('Whether any scheduling conflicts exist'),
      }),
    },
    ScheduleGrid: {
      description: 'Grid showing multiple creators posting schedules side by side for a given week. Rows are creators, columns are days. Use when the agency asks "what is everyone posting this week?" or needs to coordinate timing.',
      props: z.object({
        week_start: z.string().describe('Monday of the week, ISO date'),
        creators: z.array(z.object({
          name: z.string(),
          niche: z.string().optional(),
          schedule: z.array(z.object({
            day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
            items: z.array(z.object({
              title: z.string(),
              time: z.string().optional(),
              type: z.enum(['post', 'brief_deadline', 'event']),
              status: z.enum(['scheduled', 'draft', 'published', 'overdue']).optional(),
            })),
          })).describe('7-day schedule for this creator'),
        })).describe('All creators with their weekly schedules'),
        conflicts: z.array(z.object({
          day: z.string(),
          description: z.string(),
        })).optional().describe('Scheduling conflicts detected'),
      }),
    },
    PostSlot: {
      description: 'A single scheduled content post with creator, timing, brief reference, and status. Use in calendar detail views or when discussing a specific scheduled post.',
      props: z.object({
        title: z.string().describe('Post title or content description'),
        creator_name: z.string(),
        scheduled_date: z.string().describe('When the post is scheduled'),
        scheduled_time: z.string().optional(),
        niche: z.string().optional(),
        brief_reference: z.string().optional().describe('Name of the brief this post is based on'),
        event_reference: z.string().optional().describe('Name of the cultural event this relates to'),
        content_format: z.enum(['video', 'series', 'duet', 'stitch', 'live', 'story', 'any']).optional(),
        status: z.enum(['scheduled', 'draft', 'in_production', 'ready', 'published', 'overdue', 'cancelled']).optional(),
        notes: z.string().optional(),
        estimated_reach: z.number().optional().describe('Estimated follower reach'),
      }),
    },
    WeekOverview: {
      description: 'Summary statistics for a specific week — total posts scheduled, by creator, by status, and any gaps. Use at the top of weekly calendar views.',
      props: z.object({
        week_label: z.string().describe('e.g. "Week of March 30, 2026"'),
        week_start: z.string(),
        total_scheduled: z.number(),
        by_status: z.object({
          scheduled: z.number(),
          draft: z.number(),
          published: z.number(),
          overdue: z.number(),
        }).optional(),
        by_creator: z.array(z.object({
          name: z.string(),
          post_count: z.number(),
        })).optional(),
        busiest_day: z.string().optional().describe('Day with most content scheduled'),
        gap_days: z.array(z.string()).optional().describe('Days with no content scheduled'),
        upcoming_events: z.array(z.object({
          event_name: z.string(),
          event_date: z.string(),
        })).optional().describe('Cultural events happening this week'),
      }),
    },
    ScheduleConflict: {
      description: 'Alert highlighting a scheduling conflict or concern — creators posting at the same time, overloaded days, gaps, or missed deadlines. Use proactively when conflicts are detected.',
      props: z.object({
        conflict_type: z.enum(['overlap', 'overload', 'gap', 'missed_deadline', 'no_content_for_event']).describe('Type of scheduling issue'),
        severity: z.enum(['critical', 'warning', 'info']).describe('How urgent this conflict is'),
        description: z.string().describe('Human-readable explanation of the conflict'),
        affected_creators: z.array(z.string()).optional(),
        affected_date: z.string().optional(),
        suggestion: z.string().describe('Recommended resolution'),
      }),
    },

    // === PERFORMANCE REPORTING ===
    PerformanceChart: {
      description: 'Chart showing performance metrics over time. Supports line, bar, and area chart types. Use for VPS trends, DPS distributions, engagement trends, or any time-series metric visualization.',
      props: z.object({
        title: z.string().describe('Chart title'),
        chart_type: z.enum(['line', 'bar', 'area', 'stacked_bar']).describe('Chart visualization type'),
        x_axis: z.object({
          label: z.string().optional(),
          values: z.array(z.string()).describe('X-axis labels, typically dates or categories'),
        }),
        series: z.array(z.object({
          name: z.string().describe('Series name, e.g. "Luna Martinez" or "Share Rate"'),
          values: z.array(z.number()).describe('Data points matching x_axis values'),
          color: z.string().optional().describe('Override color for this series'),
        })).describe('One or more data series to plot'),
        y_axis_label: z.string().optional(),
        y_axis_max: z.number().optional(),
        show_legend: z.boolean().optional(),
        highlight_max: z.boolean().optional().describe('Highlight the peak value'),
        period: z.string().optional().describe('Time period shown, e.g. "Last 30 days"'),
      }),
    },
    ReportCard: {
      description: 'Performance report card summarizing a key metric with current value, trend, comparison, and context. Use for individual KPIs in a performance dashboard.',
      props: z.object({
        metric_name: z.string().describe('What is being measured, e.g. "Average DPS", "Total Views"'),
        current_value: z.number().describe('Current metric value'),
        previous_value: z.number().optional().describe('Value from the comparison period'),
        change_percent: z.number().optional().describe('Percentage change from previous period'),
        trend: z.enum(['up', 'down', 'stable']).optional(),
        period: z.string().optional().describe('Reporting period, e.g. "This Month", "Last 7 Days"'),
        unit: z.enum(['number', 'percent', 'score', 'views', 'currency']).optional(),
        context: z.string().optional().describe('Brief explanation of what this metric means or why it changed'),
        benchmark: z.number().optional().describe('Industry or niche benchmark for comparison'),
        benchmark_label: z.string().optional().describe('e.g. "Niche Average", "Industry Standard"'),
      }),
    },
    AgencyScorecard: {
      description: 'Comprehensive agency performance scorecard showing all key metrics at once. Use when the agency asks for "the report", "how are we doing", "agency performance", or "weekly/monthly report."',
      props: z.object({
        period: z.string().describe('Reporting period, e.g. "March 2026", "Week of March 23"'),
        overall_grade: z.enum(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']).optional().describe('Overall agency performance grade'),
        metrics: z.array(z.object({
          name: z.string(),
          value: z.number(),
          change_percent: z.number().optional(),
          trend: z.enum(['up', 'down', 'stable']).optional(),
          unit: z.string().optional(),
        })).describe('Key metrics in the scorecard'),
        top_performer: z.object({
          name: z.string(),
          metric: z.string(),
          value: z.number(),
        }).optional().describe('Best performing creator this period'),
        needs_attention: z.array(z.object({
          creator_name: z.string(),
          issue: z.string(),
        })).optional().describe('Creators who need attention'),
        highlights: z.array(z.string()).optional().describe('Key wins or achievements this period'),
        concerns: z.array(z.string()).optional().describe('Issues or risks to address'),
      }),
    },
    CreatorComparison: {
      description: 'Side-by-side comparison of 2-5 creators across key metrics. Use when the agency asks "compare my creators", "who is performing best", or wants to benchmark creators against each other.',
      props: z.object({
        creators: z.array(z.object({
          name: z.string(),
          niche: z.string().optional(),
          vps_score: z.number().optional(),
          avg_dps: z.number().optional(),
          total_views: z.number().optional(),
          total_videos: z.number().optional(),
          engagement_grade: z.enum(['A', 'B', 'C', 'D', 'F']).optional(),
          share_rate: z.number().optional(),
          save_rate: z.number().optional(),
          follower_count: z.number().optional(),
          trend: z.enum(['up', 'down', 'stable']).optional(),
        })).describe('Creators to compare, 2-5 entries'),
        comparison_metric: z.string().optional().describe('Primary metric being compared, e.g. "VPS Score"'),
        winner: z.string().optional().describe('Name of the best performing creator'),
        insights: z.array(z.string()).optional().describe('Comparative insights generated from the data'),
      }),
    },
    ContentROI: {
      description: 'ROI analysis for content campaigns or events. Shows what content was produced, its performance, and the return relative to effort. Use when the agency asks about ROI, "was it worth it", or wants to evaluate campaign effectiveness.',
      props: z.object({
        campaign_name: z.string().describe('Name of the campaign or event being evaluated'),
        period: z.string().optional(),
        total_posts: z.number().describe('Total content pieces produced'),
        total_views: z.number().describe('Aggregate views across all content'),
        total_engagement: z.number().optional().describe('Total engagement actions'),
        avg_dps: z.number().optional().describe('Average DPS across campaign content'),
        top_performing_post: z.object({
          title: z.string(),
          creator_name: z.string(),
          views: z.number(),
          dps_score: z.number().optional(),
        }).optional(),
        worst_performing_post: z.object({
          title: z.string(),
          creator_name: z.string(),
          views: z.number(),
          dps_score: z.number().optional(),
        }).optional(),
        creator_breakdown: z.array(z.object({
          name: z.string(),
          posts: z.number(),
          views: z.number(),
          avg_dps: z.number().optional(),
        })).optional(),
        verdict: z.enum(['strong_roi', 'moderate_roi', 'weak_roi', 'negative_roi']).optional(),
        verdict_explanation: z.string().optional(),
        recommendations: z.array(z.string()).optional(),
      }),
    },
    TrendReport: {
      description: 'Trend analysis report showing patterns in performance data over time. Identifies what is improving, declining, or emerging. Use for "what trends are you seeing?", "performance insights", or strategic analysis.',
      props: z.object({
        report_title: z.string(),
        period: z.string(),
        rising_trends: z.array(z.object({
          metric: z.string(),
          description: z.string(),
          magnitude: z.string().optional().describe('e.g. "+23% over 30 days"'),
        })).optional().describe('Metrics that are improving'),
        falling_trends: z.array(z.object({
          metric: z.string(),
          description: z.string(),
          magnitude: z.string().optional(),
        })).optional().describe('Metrics that are declining'),
        emerging_patterns: z.array(z.object({
          pattern: z.string(),
          description: z.string(),
          confidence: z.enum(['high', 'medium', 'low']).optional(),
        })).optional().describe('New patterns detected in the data'),
        strategic_recommendations: z.array(z.string()).optional(),
        data_quality_note: z.string().optional().describe('Note about data completeness or limitations'),
      }),
    },
  },

  actions: {
    analyze_creator: {
      params: z.object({ creatorName: z.string() }),
      description: 'Deep-dive analysis of a specific creator — shows their full profile, VPS history, and content performance',
    },
    generate_brief: {
      params: z.object({ creatorName: z.string(), topic: z.string().optional() }),
      description: 'Generate a content brief for a creator, optionally focused on a specific topic',
    },
    refresh_data: {
      params: z.object({}),
      description: 'Refresh all dashboard data from the database',
    },
    export_report: {
      description: 'Export a performance report as a downloadable document.',
      params: z.object({
        report_type: z.string().optional(),
        format: z.enum(['pdf', 'csv', 'json']).optional(),
      }),
    },
    navigate_creator: {
      params: z.object({ creatorId: z.string() }),
      description: 'Navigate to a specific creator deep-dive view',
    },
    send_invite: {
      description: 'Send an onboarding invite to a new creator. Triggers the invite flow.',
      params: z.object({
        creator_name: z.string().optional(),
        email: z.string().optional(),
        niche: z.string().optional(),
      }),
    },
    nudge_creator: {
      description: 'Send a reminder nudge to a creator who is stalled in onboarding.',
      params: z.object({
        creator_name: z.string(),
        message: z.string().optional().describe('Custom nudge message'),
      }),
    },
    create_event: {
      description: 'Create a new cultural event entry. Triggers the event creation flow.',
      params: z.object({
        event_name: z.string().optional(),
        event_date: z.string().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
      }),
    },
    match_creators_to_event: {
      description: 'Find and suggest creators who should create content for a specific event.',
      params: z.object({
        event_name: z.string(),
        event_id: z.string().optional(),
      }),
    },
    push_brief_to_creators: {
      description: 'Push a content brief to selected creators for an event. Initiates the distribution.',
      params: z.object({
        event_name: z.string(),
        brief_title: z.string().optional(),
        creator_names: z.array(z.string()).optional(),
      }),
    },
    check_push_status: {
      description: 'Check the status of a brief push — who has received, accepted, submitted, or published.',
      params: z.object({
        event_name: z.string().optional(),
        brief_id: z.string().optional(),
      }),
    },
    generate_batch_briefs: {
      description: 'Generate content briefs in batch for multiple events and creators at once.',
      params: z.object({
        scope: z.enum(['all_upcoming', 'this_week', 'this_month', 'specific_events']).optional(),
        event_names: z.array(z.string()).optional(),
        creator_names: z.array(z.string()).optional(),
      }),
    },
    approve_brief: {
      description: 'Approve a brief for pushing to creators.',
      params: z.object({
        brief_title: z.string(),
        event_name: z.string().optional(),
      }),
    },
    schedule_post: {
      description: 'Schedule a content post for a specific creator on a specific date.',
      params: z.object({
        creator_name: z.string(),
        date: z.string(),
        title: z.string().optional(),
        brief_reference: z.string().optional(),
      }),
    },
    generate_report: {
      description: 'Generate a performance report for a specific period, creator, or campaign.',
      params: z.object({
        report_type: z.enum(['agency', 'creator', 'campaign', 'trend']).optional(),
        period: z.string().optional(),
        creator_name: z.string().optional(),
        campaign_name: z.string().optional(),
      }),
    },
    reschedule_post: {
      description: 'Move a scheduled post to a different date or time.',
      params: z.object({
        post_title: z.string(),
        creator_name: z.string().optional(),
        new_date: z.string(),
        new_time: z.string().optional(),
      }),
    },
  },
});
