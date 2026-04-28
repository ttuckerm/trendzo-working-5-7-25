// The Escape Assessment — data contract.
// (Renamed from "Escape Blueprint" on 2026-04-26. The user-facing deliverable
//  will eventually live at /assessment/[assessmentId] — see Cursor Prompt 2.)
//
// Every other piece of the Assessment feature (generator, validator,
// renderer, agent) MUST conform to the shapes declared in this file.

export type OperatorStatus =
  | 'W2 escape candidate'
  | 'Runway-constrained operator'
  | 'Sub-replacement income'
  | 'Established earner seeking freedom'

export const OPERATOR_STATUS_VALUES: readonly OperatorStatus[] = [
  'W2 escape candidate',
  'Runway-constrained operator',
  'Sub-replacement income',
  'Established earner seeking freedom',
]

export type FreedomConfidence = 'LOW' | 'MEDIUM' | 'HIGH'

export type OfferCadence = 'monthly' | 'weekly' | 'one-time'

export type SkillProfile =
  | 'Analytical'
  | 'Creative'
  | 'Technical'
  | 'Sales/Marketing'
  | 'Operational'
  | 'Not sure'

export type RiskTolerance = 'Low' | 'Medium' | 'High'

export type SprintDayCategory =
  | 'customer-facing'
  | 'customer-conversation'
  | 'offer-delivery'
  | 'infrastructure'
  | 'refinement'

export const SPRINT_DAY_CATEGORIES: readonly SprintDayCategory[] = [
  'customer-facing',
  'customer-conversation',
  'offer-delivery',
  'infrastructure',
  'refinement',
]

export interface AssessmentInput {
  firstName: string
  hoursPerWeek: number
  monthlyIncome: number
  monthlyExpenses: number
  runwayMonths: number
  skillProfile: string
  riskTolerance: RiskTolerance
  audienceAccess: string
  nicheSignal: string
  freedomMultiplier: number
}

export interface OperatorInputsEcho {
  hoursPerWeek: number
  monthlyIncome: number
  monthlyExpenses: number
  runwayMonths: number
  skillProfile: string
  riskTolerance: string
  audienceAccess: string
  nicheSignal: string
}

export interface FreedomNumber {
  monthlyTarget: number
  multiplier: number
  runwayMonths: number
  timelineMonths: string
  confidence: FreedomConfidence
}

export interface FirstOffer {
  name: string
  price: number
  cadence: OfferCadence
  description: string
}

export interface PathToFreedom {
  subscribersNeeded: number
  revenuePerSubscriber: number
}

export interface BusinessMatch {
  businessName: string
  firstOffer: FirstOffer
  rationale: string[]
  pathToFreedom: PathToFreedom
}

export interface SprintDay {
  dayNumber: number
  date: string
  task: string
  estimatedMinutes: number
  category: SprintDayCategory
}

export interface SprintBlock {
  startDate: string
  days: SprintDay[]
}

export interface RoadmapMonth {
  monthNumber: 1 | 2 | 3
  title: string
  subscriberGoal: number
  revenueTarget: number
  hoursRequired: number
  estimatedHoursPerWeek: number
  keyMilestone: string
}

export interface RoadmapBlock {
  months: RoadmapMonth[]
}

export interface LeadScript {
  type: 'cold' | 'warm'
  channel: string
  template: string
}

export interface LeadsBlock {
  platforms: string[]
  searchSignals: string[]
  scripts: LeadScript[]
}

export interface AgentKnownState {
  businessName: string
  freedomTarget: number
  sprintStartDate: string
  currentDay: number
}

export interface AgentContext {
  greeting: string
  quickReplies: string[]
  knownState: AgentKnownState
}

export interface AssessmentPayload {
  // Display ID (format EA-X-XXX). Internal DB primary key is a separate UUID
  // on the assessment_id column.
  assessmentId: string
  generatedAt: string
  operator: {
    firstName: string
    status: OperatorStatus
    inputs: OperatorInputsEcho
  }
  freedomNumber: FreedomNumber
  businessMatch: BusinessMatch
  sprint: SprintBlock
  roadmap: RoadmapBlock
  leads: LeadsBlock
  agentContext: AgentContext
}
