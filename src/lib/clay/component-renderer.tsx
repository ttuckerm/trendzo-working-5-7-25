'use client'

import React from 'react'
import { ComponentType } from './component-registry'
import { UniversalSkeleton } from '@/components/clay/UniversalSkeleton'
import { MorningBriefCard, type MorningBriefData } from '@/components/clay/MorningBriefCard'
import { ContentBriefCard, type ContentBriefData } from '@/components/clay/ContentBriefCard'
import { CreatorProfileCard, type CreatorProfileData } from '@/components/clay/CreatorProfileCard'
import { KPISummaryCard, type KPISummaryData } from '@/components/clay/KPISummaryCard'
import { TrendCard, type TrendCardData } from '@/components/clay/TrendCard'
import { PerformanceTimelineCard, type PerformanceTimelineData } from '@/components/clay/PerformanceTimelineCard'
import { MomentumDecayCard, type MomentumDecayData } from '@/components/clay/MomentumDecayCard'
import { TrainerResultCard, type TrainerResultData } from '@/components/clay/TrainerResultCard'
import { ProactiveAlertCard, type ProactiveAlertData } from '@/components/clay/ProactiveAlertCard'
import { NetworkInsightCard, type NetworkInsightData } from '@/components/clay/NetworkInsightCard'
import { MemoryFactCard, type MemoryFactData } from '@/components/clay/MemoryFactCard'
import { CalendarSnippetCard, type CalendarSnippetData } from '@/components/clay/CalendarSnippetCard'
import { AgencyScorecardCard, type AgencyScorecardData } from '@/components/clay/AgencyScorecardCard'
import { ActionConfirmationCard, type ActionConfirmationData } from '@/components/clay/ActionConfirmationCard'
import { VariantComparisonCard, type VariantComparisonData } from '@/components/clay/VariantComparisonCard'

/** Human-readable labels for each component type */
const COMPONENT_LABELS: Record<ComponentType, string> = {
  [ComponentType.MORNING_BRIEF]: 'Morning Brief',
  [ComponentType.CONTENT_BRIEF]: 'Content Brief',
  [ComponentType.CREATOR_PROFILE]: 'Creator Profile',
  [ComponentType.KPI_SUMMARY]: 'KPI Summary',
  [ComponentType.TREND_CARD]: 'Trend Card',
  [ComponentType.PERFORMANCE_TIMELINE]: 'Performance Timeline',
  [ComponentType.MOMENTUM_DECAY]: 'Momentum Decay',
  [ComponentType.TRAINER_RESULT]: 'Trainer Result',
  [ComponentType.PROACTIVE_ALERT]: 'Proactive Alert',
  [ComponentType.NETWORK_INSIGHT]: 'Network Insight',
  [ComponentType.MEMORY_FACT]: 'Memory Fact',
  [ComponentType.CALENDAR_SNIPPET]: 'Calendar Snippet',
  [ComponentType.AGENCY_SCORECARD]: 'Agency Scorecard',
  [ComponentType.ACTION_CONFIRMATION]: 'Action Confirmation',
  [ComponentType.VARIANT_COMPARISON]: 'Variant Comparison',
}

interface ClayComponentRendererProps {
  type: ComponentType
  data: Record<string, unknown>
  onAction?: (action: string, payload: unknown) => void
}

/**
 * Renders a Clay Formless UI component.
 * For implemented types, renders the real component with data.
 * For unimplemented types, renders a placeholder card.
 */
export function ClayComponentRenderer({ type, data, onAction }: ClayComponentRendererProps) {
  // Render real components for implemented types
  switch (type) {
    case ComponentType.MORNING_BRIEF:
      if (data && Object.keys(data).length > 0) {
        return <MorningBriefCard data={data as unknown as MorningBriefData} onAction={onAction} />
      }
      break
    case ComponentType.CONTENT_BRIEF:
      if (data && Object.keys(data).length > 0) {
        return <ContentBriefCard data={data as unknown as ContentBriefData} onAction={onAction} />
      }
      break
    case ComponentType.CREATOR_PROFILE:
      if (data && Object.keys(data).length > 0) {
        return <CreatorProfileCard data={data as unknown as CreatorProfileData} onAction={onAction} />
      }
      break
    case ComponentType.KPI_SUMMARY:
      if (data && Object.keys(data).length > 0) {
        return <KPISummaryCard data={data as unknown as KPISummaryData} />
      }
      break
    case ComponentType.TREND_CARD:
      if (data && Object.keys(data).length > 0) {
        return <TrendCard data={data as unknown as TrendCardData} onAction={onAction} />
      }
      break
    case ComponentType.PERFORMANCE_TIMELINE:
      if (data && Object.keys(data).length > 0) {
        return <PerformanceTimelineCard data={data as unknown as PerformanceTimelineData} />
      }
      break
    case ComponentType.MOMENTUM_DECAY:
      if (data && Object.keys(data).length > 0) {
        return <MomentumDecayCard data={data as unknown as MomentumDecayData} onAction={onAction} />
      }
      break
    case ComponentType.TRAINER_RESULT:
      if (data && Object.keys(data).length > 0) {
        return <TrainerResultCard data={data as unknown as TrainerResultData} onAction={onAction} />
      }
      break
    case ComponentType.PROACTIVE_ALERT:
      if (data && Object.keys(data).length > 0) {
        return <ProactiveAlertCard data={data as unknown as ProactiveAlertData} onAction={onAction} />
      }
      break
    case ComponentType.NETWORK_INSIGHT:
      if (data && Object.keys(data).length > 0) {
        return <NetworkInsightCard data={data as unknown as NetworkInsightData} onAction={onAction} />
      }
      break
    case ComponentType.MEMORY_FACT:
      if (data && Object.keys(data).length > 0) {
        return <MemoryFactCard data={data as unknown as MemoryFactData} />
      }
      break
    case ComponentType.CALENDAR_SNIPPET:
      if (data && Object.keys(data).length > 0) {
        return <CalendarSnippetCard data={data as unknown as CalendarSnippetData} />
      }
      break
    case ComponentType.AGENCY_SCORECARD:
      if (data && Object.keys(data).length > 0) {
        return <AgencyScorecardCard data={data as unknown as AgencyScorecardData} />
      }
      break
    case ComponentType.ACTION_CONFIRMATION:
      if (data && Object.keys(data).length > 0) {
        return <ActionConfirmationCard data={data as unknown as ActionConfirmationData} onAction={onAction} />
      }
      break
    case ComponentType.VARIANT_COMPARISON:
      if (data && Object.keys(data).length > 0) {
        return <VariantComparisonCard data={data as unknown as VariantComparisonData} onAction={onAction} />
      }
      break
  }

  // Graceful empty state — same card shell, muted message
  const label = COMPONENT_LABELS[type] || type
  const EMPTY_MESSAGES: Partial<Record<ComponentType, string>> = {
    [ComponentType.MORNING_BRIEF]: 'No alerts this morning — everything is running smoothly.',
    [ComponentType.CONTENT_BRIEF]: 'No content briefs available right now.',
    [ComponentType.CREATOR_PROFILE]: 'No creator data available.',
    [ComponentType.KPI_SUMMARY]: 'No metrics data to display yet.',
    [ComponentType.TREND_CARD]: 'No active trends detected in your niches.',
    [ComponentType.PERFORMANCE_TIMELINE]: 'Not enough data to build a timeline yet.',
    [ComponentType.MOMENTUM_DECAY]: 'All creators are posting consistently — no decay detected.',
    [ComponentType.TRAINER_RESULT]: 'No training experiments pending review.',
    [ComponentType.PROACTIVE_ALERT]: 'No active alerts — all clear.',
    [ComponentType.NETWORK_INSIGHT]: 'No network insights available.',
    [ComponentType.MEMORY_FACT]: 'No memory facts recorded yet.',
    [ComponentType.CALENDAR_SNIPPET]: 'No upcoming scheduled actions.',
    [ComponentType.AGENCY_SCORECARD]: 'Not enough data to generate a scorecard yet.',
    [ComponentType.ACTION_CONFIRMATION]: 'No pending actions.',
    [ComponentType.VARIANT_COMPARISON]: 'No brief variants to compare.',
  }
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'rgba(255,255,255,0.3)',
          lineHeight: 1.5,
          fontStyle: 'italic',
        }}
      >
        {EMPTY_MESSAGES[type] || 'No data available.'}
      </div>
    </div>
  )
}

/**
 * Render an array of ClayComponentRenderer elements for the given types.
 */
export function renderComponents(
  types: ComponentType[],
  data: Record<string, unknown> = {},
  onAction?: (action: string, payload: unknown) => void,
): React.ReactElement[] {
  return types.map((type) => (
    <ClayComponentRenderer
      key={type}
      type={type}
      data={(data[type] as Record<string, unknown>) || {}}
      onAction={onAction}
    />
  ))
}
