'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type BusinessModelType = 'service' | 'digital_product' | 'content_affiliate'

interface Inputs {
  availableHours: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsAmount: number
  savingsMonths: number
  savingsMode: 'amount' | 'months'
  skillLeverage: string
  comfortLevel: string
  riskTolerance: string
  preferredBusiness: string
  nicheInterest: string
  targetIncome: number
  freedomMultiplier: number
}

interface ModelResult {
  type: BusinessModelType
  name: string
  description: string
  score: number
}

interface OfferResult {
  name: string
  target: string
  promise: string
  deliverables: string[]
  priceRange: string
  firstVersionScope: string[]
}

interface SprintDay { days: string; tasks: string[] }
interface RoadmapPhase { phase: string; weeks: string; milestones: string[]; kpis: string[] }
interface LeadsPlan { channel: string; dailyTarget: string; totalTarget: number; scripts: string[] }

interface Outputs {
  freedomNumber: number
  runwayMonths: number
  primary: ModelResult
  secondary: ModelResult
  rationale: string[]
  offer: OfferResult
  sprint: SprintDay[]
  roadmap: RoadmapPhase[]
  leads: LeadsPlan
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'dl:freedom-os:v0:state'

const DEFAULT_INPUTS: Inputs = {
  availableHours: 10,
  monthlyIncome: 0,
  monthlyExpenses: 3000,
  savingsAmount: 0,
  savingsMonths: 3,
  savingsMode: 'months',
  skillLeverage: 'Not sure',
  comfortLevel: 'Beginner',
  riskTolerance: 'Medium',
  preferredBusiness: 'Not sure',
  nicheInterest: '',
  targetIncome: 0,
  freedomMultiplier: 1.5,
}

const EXAMPLE_INPUTS: Inputs = {
  availableHours: 12,
  monthlyIncome: 4500,
  monthlyExpenses: 3200,
  savingsAmount: 8000,
  savingsMonths: 0,
  savingsMode: 'amount',
  skillLeverage: 'Writing/Content',
  comfortLevel: 'Some experience',
  riskTolerance: 'Medium',
  preferredBusiness: 'Content+affiliate',
  nicheInterest: 'Personal finance for millennials',
  targetIncome: 0,
  freedomMultiplier: 1.5,
}

const SKILL_OPTIONS = ['Sales/Outreach', 'Writing/Content', 'Design/Creative', 'Tech/Automation', 'Ops/Admin', 'Not sure']
const COMFORT_OPTIONS = ['Beginner', 'Some experience', 'Already tried before']
const RISK_OPTIONS = ['Low', 'Medium', 'High']
const BUSINESS_OPTIONS = ['Service', 'Digital product', 'Content+affiliate', 'Not sure']

// ═══════════════════════════════════════════════════════════════
// COMPUTATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function computeFreedomNumber(inputs: Inputs): number {
  if (inputs.targetIncome > 0) return inputs.targetIncome
  return Math.round(inputs.monthlyExpenses * inputs.freedomMultiplier)
}

function computeRunway(inputs: Inputs): number {
  if (inputs.savingsMode === 'amount' && inputs.savingsAmount > 0 && inputs.monthlyExpenses > 0) {
    return Math.round((inputs.savingsAmount / inputs.monthlyExpenses) * 10) / 10
  }
  return inputs.savingsMonths || 0
}

function scoreModels(inputs: Inputs): { primary: ModelResult; secondary: ModelResult; rationale: string[] } {
  const scores = { service: 50, digital_product: 50, content_affiliate: 50 }

  if (inputs.availableHours < 8) {
    scores.content_affiliate += 20; scores.digital_product += 15; scores.service -= 10
  } else if (inputs.availableHours <= 15) {
    scores.service += 15; scores.content_affiliate += 10
  } else {
    scores.service += 25; scores.digital_product += 5
  }

  const skillMap: Record<string, Partial<typeof scores>> = {
    'Sales/Outreach': { service: 20 },
    'Writing/Content': { content_affiliate: 20, digital_product: 10 },
    'Design/Creative': { digital_product: 15, content_affiliate: 10 },
    'Tech/Automation': { service: 15, digital_product: 15 },
    'Ops/Admin': { service: 15 },
  }
  const bonus = skillMap[inputs.skillLeverage]
  if (bonus) {
    for (const [k, v] of Object.entries(bonus)) {
      scores[k as keyof typeof scores] += v as number
    }
  }

  if (inputs.riskTolerance === 'Low') { scores.service += 15; scores.digital_product -= 5 }
  if (inputs.riskTolerance === 'Medium') { scores.service += 5; scores.content_affiliate += 5 }
  if (inputs.riskTolerance === 'High') { scores.digital_product += 15; scores.content_affiliate += 10 }

  if (inputs.comfortLevel === 'Beginner') scores.service += 10
  if (inputs.comfortLevel === 'Already tried before') { scores.digital_product += 10; scores.content_affiliate += 10 }

  if (inputs.preferredBusiness === 'Service') scores.service += 10
  if (inputs.preferredBusiness === 'Digital product') scores.digital_product += 10
  if (inputs.preferredBusiness === 'Content+affiliate') scores.content_affiliate += 10

  const runway = computeRunway(inputs)
  if (runway > 0 && runway < 3) { scores.service += 15; scores.content_affiliate -= 10 }
  if (runway >= 6) { scores.content_affiliate += 10; scores.digital_product += 5 }

  const models: ModelResult[] = [
    { type: 'service', score: scores.service, name: 'Service Business', description: 'Offer a skill-based service — consulting, freelancing, or done-for-you work. Fastest path to revenue.' },
    { type: 'digital_product', score: scores.digital_product, name: 'Digital Product', description: 'Create and sell templates, courses, or tools. Higher upfront effort, scalable long-term.' },
    { type: 'content_affiliate', score: scores.content_affiliate, name: 'Content + Affiliate', description: 'Build an audience via content and monetize through affiliate partnerships. Compounds over time.' },
  ]
  models.sort((a, b) => b.score - a.score)

  const rationale: string[] = []
  if (inputs.availableHours < 8) rationale.push(`With ${inputs.availableHours} hrs/week, ${models[0].name.toLowerCase()} fits your limited bandwidth.`)
  else if (inputs.availableHours >= 15) rationale.push(`${inputs.availableHours} hrs/week gives you capacity for direct ${models[0].name.toLowerCase()} execution.`)
  else rationale.push(`${inputs.availableHours} hrs/week is enough to build momentum with a ${models[0].name.toLowerCase()}.`)

  if (inputs.skillLeverage !== 'Not sure') rationale.push(`Your ${inputs.skillLeverage.toLowerCase()} skills map directly to ${models[0].name.toLowerCase()} opportunities.`)
  else rationale.push(`We balanced the recommendation since you're still exploring your strongest skill.`)

  if (runway > 0 && runway < 3) rationale.push(`With ~${runway} months of runway, we prioritized faster-to-revenue models.`)
  else if (runway >= 6) rationale.push(`Your ${runway}-month runway gives room for audience-building strategies.`)
  else rationale.push(`${models[0].name} balances speed-to-revenue with growth potential for your situation.`)

  return { primary: models[0], secondary: models[1], rationale }
}

function generateOffer(inputs: Inputs, model: ModelResult): OfferResult {
  const niche = inputs.nicheInterest || 'your target market'
  const runway = computeRunway(inputs)

  if (model.type === 'service') {
    const skill = inputs.skillLeverage
    let offerName = `${niche} Growth Sprint`
    let deliverables = [
      'Initial audit / assessment call (60 min)',
      'Custom action plan document',
      'Implementation or done-for-you execution',
      '2 revision rounds included',
      'Final review + handoff call',
    ]
    if (skill === 'Sales/Outreach') {
      offerName = `${niche} Outreach Sprint`
      deliverables = ['Outreach strategy + target list', 'Custom DM/email templates (10)', 'Campaign setup + first 50 sends', 'Performance review call', 'Iteration round based on replies']
    } else if (skill === 'Writing/Content') {
      offerName = `${niche} Content Jumpstart`
      deliverables = ['Content audit + strategy doc', '7 pieces of optimized content', 'Content calendar (30 days)', 'Distribution checklist', 'Performance review + next steps']
    } else if (skill === 'Tech/Automation') {
      offerName = `${niche} Automation Setup`
      deliverables = ['Workflow audit + automation map', 'Tool stack recommendation', '3 core automations built', 'Documentation + SOPs', 'Training walkthrough call']
    } else if (skill === 'Design/Creative') {
      offerName = `${niche} Brand Sprint`
      deliverables = ['Visual audit + mood board', 'Core brand assets (logo, colors, fonts)', '5 social media templates', 'Brand guidelines document', 'Revision round + final handoff']
    }
    let priceRange = '$500\u2013$1,500'
    if (runway > 0 && runway < 3) priceRange = '$750\u2013$2,000'
    if (inputs.riskTolerance === 'High') priceRange = '$1,000\u2013$3,000'
    return {
      name: offerName,
      target: `Small businesses or creators in ${niche} who need help fast`,
      promise: 'Deliver a specific, measurable result in 2\u20134 weeks',
      deliverables,
      priceRange,
      firstVersionScope: [
        'Start with ONE deliverable, not the full package',
        'Offer a "pilot" rate for first 3 clients to get testimonials',
        'Use Google Docs and Loom \u2014 no fancy tools needed',
        'Set a clear 2-week delivery timeline',
      ],
    }
  }

  if (model.type === 'digital_product') {
    return {
      name: `The ${niche} Toolkit`,
      target: `People in ${niche} who want a shortcut to results`,
      promise: 'Save 10+ hours with proven templates and frameworks',
      deliverables: [
        'Core template pack (Notion/Google Sheets/Figma)',
        'Quick-start guide (video or written)',
        'Bonus: checklist or cheat sheet',
        'Community access or Q&A thread (optional)',
      ],
      priceRange: (runway > 0 && runway < 3) ? '$47\u2013$97' : '$27\u2013$67',
      firstVersionScope: [
        'Build ONE template that solves ONE specific problem',
        'Use Gumroad or Lemon Squeezy \u2014 ship in 48 hours',
        'Get 5 beta users for feedback before public launch',
        'Iterate based on real usage, not assumptions',
      ],
    }
  }

  return {
    name: `${niche} Authority Newsletter`,
    target: `People curious about ${niche} who consume content regularly`,
    promise: 'Become the go-to voice with consistent, valuable content',
    deliverables: [
      'Weekly newsletter or content series',
      'Resource recommendations (affiliate links)',
      'Free lead magnet (PDF/template)',
      'Social media content repurposed from long-form',
    ],
    priceRange: '$0 upfront (affiliate: $500\u2013$2,000/mo at scale)',
    firstVersionScope: [
      'Pick ONE platform (newsletter OR social) to start',
      'Publish 3x/week minimum for 30 days',
      'Join 2\u20133 affiliate programs relevant to your niche',
      'Track clicks and sign-ups from day one',
    ],
  }
}

function generateSprint(inputs: Inputs, model: ModelResult): SprintDay[] {
  const niche = inputs.nicheInterest || 'your niche'

  const sprints: Record<BusinessModelType, SprintDay[]> = {
    service: [
      { days: 'Days 1\u20132', tasks: [`Finalize your niche: "${niche}"`, 'Define your starter offer (use the offer builder above)', 'Write a 2-sentence pitch that explains what you do'] },
      { days: 'Days 3\u20134', tasks: ['Build a simple landing page (Carrd, Notion, or Google Doc)', 'Write 3 DM/email outreach templates', 'Create a list of 50 potential clients/leads'] },
      { days: 'Days 5\u20137', tasks: ['Send 15\u201320 outreach messages per day', 'Post 1 value-driven piece of content daily', 'Track all responses in a simple spreadsheet'] },
      { days: 'Days 8\u201310', tasks: ['Follow up with all non-responders', 'Refine your pitch based on responses', 'Create a simple case study or proof of concept'] },
      { days: 'Days 11\u201314', tasks: ['Book and run discovery calls', 'Close your first client (even at a pilot rate)', 'Set up a basic delivery workflow', 'Document your process for repeatability'] },
    ],
    digital_product: [
      { days: 'Days 1\u20132', tasks: [`Pick your sub-niche within "${niche}"`, 'Research top 3 competing products (note gaps)', 'Define your product: what problem does it solve?'] },
      { days: 'Days 3\u20134', tasks: ['Build the core template/tool (MVP \u2014 1 thing done well)', 'Write the product description + benefit bullets', 'Set up Gumroad or Lemon Squeezy store'] },
      { days: 'Days 5\u20137', tasks: ['Create 3 social media posts previewing the product', 'Reach out to 10 potential beta users', 'Refine based on beta feedback'] },
      { days: 'Days 8\u201310', tasks: ['Record a quick walkthrough video (Loom)', 'Create a lead magnet related to the product', 'Set up an email capture page'] },
      { days: 'Days 11\u201314', tasks: ['Launch publicly with limited-time intro price', 'Post launch content on 2\u20133 platforms', 'Engage with every early buyer for testimonials', 'Plan version 2 based on feedback'] },
    ],
    content_affiliate: [
      { days: 'Days 1\u20132', tasks: [`Finalize your content angle within "${niche}"`, 'Choose primary platform (newsletter, X, TikTok, YouTube)', 'Research and join 3 relevant affiliate programs'] },
      { days: 'Days 3\u20134', tasks: ['Create your content template (make it repeatable)', 'Write/record your first 3 pieces of content', 'Create a simple lead magnet (PDF, checklist)'] },
      { days: 'Days 5\u20137', tasks: ['Publish daily content (3\u20135 pieces)', 'Engage with 20 accounts in your niche daily', 'Start building an email list with your lead magnet'] },
      { days: 'Days 8\u201310', tasks: ['Analyze what content performed best', 'Create your first affiliate-linked resource post', 'Reach out to 5 creators for cross-promotion'] },
      { days: 'Days 11\u201314', tasks: ['Double down on top-performing content format', 'Set up automated email welcome sequence', 'Publish a "best tools" resource post', 'Review analytics: clicks, sign-ups, affiliate revenue'] },
    ],
  }
  return sprints[model.type]
}

function generateRoadmap(inputs: Inputs, model: ModelResult): RoadmapPhase[] {
  const fn = computeFreedomNumber(inputs)
  const fmt = (n: number) => `$${n.toLocaleString()}`

  const roadmaps: Record<BusinessModelType, RoadmapPhase[]> = {
    service: [
      { phase: 'Phase 1: First Win', weeks: 'Weeks 1\u20132', milestones: ['Land first paying client', 'Complete first delivery', 'Get first testimonial', 'Refine offer based on feedback'], kpis: [`Revenue: ${fmt(Math.round(fn * 0.15))}/mo`, '2\u20133 discovery calls booked', '1 client closed', '50+ outreach messages sent'] },
      { phase: 'Phase 2: Pipeline', weeks: 'Weeks 3\u20136', milestones: ['Build repeatable outreach system', 'Raise prices 20\u201350%', 'Create a referral incentive', 'Productize your delivery'], kpis: [`Revenue: ${fmt(Math.round(fn * 0.4))}\u2013${fmt(Math.round(fn * 0.6))}/mo`, '3\u20135 active clients', '10+ testimonials', 'Consistent weekly lead flow'] },
      { phase: 'Phase 3: Scale', weeks: 'Weeks 7\u201312', milestones: ['Hire first contractor or leverage AI', 'Launch higher-ticket offer', 'Build inbound content engine', 'Create SOPs for core processes'], kpis: [`Revenue: ${fmt(Math.round(fn * 0.8))}\u2013${fmt(fn)}/mo`, '5\u20138 clients on retainer', 'Inbound leads > outbound', 'Weekly time investment stabilized'] },
    ],
    digital_product: [
      { phase: 'Phase 1: Launch', weeks: 'Weeks 1\u20132', milestones: ['Launch MVP product', 'Get 10+ sales', 'Collect early buyer feedback', 'Create 1 content piece driving traffic'], kpis: [`Revenue: ${fmt(Math.round(fn * 0.05))}\u2013${fmt(Math.round(fn * 0.1))}/mo`, '10\u201325 units sold', '3+ testimonials', '100+ landing page views'] },
      { phase: 'Phase 2: Traffic', weeks: 'Weeks 3\u20136', milestones: ['Release v2 with top requests', 'Build content \u2192 product funnel', 'Launch email nurture sequence', 'Explore 1 paid traffic channel'], kpis: [`Revenue: ${fmt(Math.round(fn * 0.2))}\u2013${fmt(Math.round(fn * 0.4))}/mo`, '50\u2013100 total sales', 'Email list: 200+', 'Conversion rate: 3\u20135%'] },
      { phase: 'Phase 3: Portfolio', weeks: 'Weeks 7\u201312', milestones: ['Launch product #2 (upsell)', 'Build affiliate program', 'Automate marketing sequences', 'Explore bundling or membership'], kpis: [`Revenue: ${fmt(Math.round(fn * 0.6))}\u2013${fmt(fn)}/mo`, '200+ total sales', 'Email list: 500+', 'Multiple revenue streams'] },
    ],
    content_affiliate: [
      { phase: 'Phase 1: Publish', weeks: 'Weeks 1\u20132', milestones: ['Publish 10+ pieces of content', 'Grow to 100+ followers/subscribers', 'Get first affiliate clicks', 'Identify top content format'], kpis: [`Revenue: ${fmt(Math.round(fn * 0.02))}\u2013${fmt(Math.round(fn * 0.05))}/mo`, '10+ pieces published', '100+ audience', 'First affiliate commission'] },
      { phase: 'Phase 2: Consistency', weeks: 'Weeks 3\u20136', milestones: ['Publish 3\u20135x/week consistently', 'Grow email list to 300+', 'Land 2\u20133 higher-paying affiliate deals', 'Test sponsored content'], kpis: [`Revenue: ${fmt(Math.round(fn * 0.1))}\u2013${fmt(Math.round(fn * 0.25))}/mo`, '500\u20131,000 audience', 'Email list: 300+', 'Affiliate clicks: 500+/mo'] },
      { phase: 'Phase 3: Authority', weeks: 'Weeks 7\u201312', milestones: ['Launch paid product (guide, course, community)', 'Cross-promote with 5+ creators', 'Diversify to 2 platforms', 'Build evergreen content library'], kpis: [`Revenue: ${fmt(Math.round(fn * 0.4))}\u2013${fmt(fn)}/mo`, '2,000+ audience', 'Email list: 1,000+', 'Multiple monetization channels'] },
    ],
  }
  return roadmaps[model.type]
}

function generateLeadsPlan(inputs: Inputs, model: ModelResult): LeadsPlan {
  const skill = inputs.skillLeverage

  if (model.type === 'service') {
    if (skill === 'Sales/Outreach' || skill === 'Ops/Admin' || skill === 'Not sure') {
      return {
        channel: 'Cold DM / Direct Outreach',
        dailyTarget: '15\u201320 personalized DMs per day',
        totalTarget: 50,
        scripts: [
          '"Hey [Name], I noticed [specific observation]. I help [niche] businesses [specific result]. Would a quick 10-min call make sense?"',
          '"Hi [Name], I just [relevant proof]. I\'m offering [service] for [niche] businesses this month \u2014 free audit to start. Interested?"',
          '"[Name], quick question: are you currently [pain point]? I\'ve helped [X] clients [result] and have 2 spots open this month."',
        ],
      }
    }
    if (skill === 'Writing/Content') {
      return {
        channel: 'Content + DM Hybrid',
        dailyTarget: '1 post + 10 targeted DMs per day',
        totalTarget: 50,
        scripts: [
          'Post: "Most [niche] businesses waste time on [mistake]. Here\'s what works instead: [3 bullets]. DM me \'PLAN\' for a free [deliverable]."',
          'DM: "Hey [Name], saw you liked my post about [topic]. I\'m helping 3 [niche] businesses with [service] this month \u2014 want details?"',
          'Email: "Subject: Quick [niche] question \u2014 Hi [Name], I help [niche] businesses [result]. Noticed [observation]. Worth 15 min?"',
        ],
      }
    }
    return {
      channel: 'LinkedIn + Email Outreach',
      dailyTarget: '10 connection requests + 5 emails per day',
      totalTarget: 50,
      scripts: [
        'Connect: "Hi [Name], I work with [niche] businesses on [area]. Would love to connect and share ideas."',
        'Follow-up: "[Name], thanks for connecting! I noticed [observation]. I help businesses like yours [result]. Quick chat?"',
        'Cold email: "Subject: [Result] for [company] \u2014 I help [niche] businesses [result]. I noticed [observation] and have a few ideas. 15 minutes?"',
      ],
    }
  }

  if (model.type === 'digital_product') {
    return {
      channel: 'Social Media + Community Seeding',
      dailyTarget: '2 posts + 10 community interactions per day',
      totalTarget: 50,
      scripts: [
        '"I just built a [product type] for [niche]. Here\'s the #1 problem it solves: [problem]. Link in bio."',
        'Community reply: "Great question! I built a [product] for exactly this. Happy to share \u2014 DM me."',
        'DM: "Hey! Saw your comment about [topic]. I built a [product] that helps. Here\'s the link: [URL]"',
      ],
    }
  }

  return {
    channel: 'Content Publishing + Engagement',
    dailyTarget: '1 long-form post + 20 engagement comments per day',
    totalTarget: 50,
    scripts: [
      '"[Controversial opinion about niche]. Here\'s why most people get this wrong: [thread/post]"',
      'Reply: "Great point! I wrote about this recently. The key is [insight]. [Link if allowed]"',
      'Newsletter CTA: "I send 1 email/week with [value]. No spam, unsubscribe anytime. Join [X] others \u2192 [link]"',
    ],
  }
}

function generatePlan(inputs: Inputs): Outputs {
  const freedomNumber = computeFreedomNumber(inputs)
  const runwayMonths = computeRunway(inputs)
  const { primary, secondary, rationale } = scoreModels(inputs)
  const offer = generateOffer(inputs, primary)
  const sprint = generateSprint(inputs, primary)
  const roadmap = generateRoadmap(inputs, primary)
  const leads = generateLeadsPlan(inputs, primary)
  return { freedomNumber, runwayMonths, primary, secondary, rationale, offer, sprint, roadmap, leads }
}

function formatSummary(inputs: Inputs, outputs: Outputs): string {
  const lines = [
    'Financial Freedom OS \u2014 Your Plan',
    '================================',
    '',
    `Freedom Number: $${outputs.freedomNumber.toLocaleString()}/mo`,
    `Runway: ${outputs.runwayMonths} months`,
    '',
    `Recommended Model: ${outputs.primary.name}`,
    ...outputs.rationale.map(r => `  \u2022 ${r}`),
    '',
    `Starter Offer: ${outputs.offer.name}`,
    `  For: ${outputs.offer.target}`,
    `  Promise: ${outputs.offer.promise}`,
    `  Price: ${outputs.offer.priceRange}`,
    '',
    'First 7 Days:',
    ...outputs.sprint.slice(0, 3).flatMap(s => [`  ${s.days}:`, ...s.tasks.map(t => `    \u2022 ${t}`)]),
    '',
    '\u2014',
    'Generated by Financial Freedom OS',
    `${typeof window !== 'undefined' ? window.location.origin : ''}/free/freedom-os`,
  ]
  return lines.join('\n')
}

// ═══════════════════════════════════════════════════════════════
// SMALL UI HELPERS
// ═══════════════════════════════════════════════════════════════

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.85)',
}

function SectionCard({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-2xl p-5 sm:p-6 mb-4 print-section" style={cardStyle}>
      <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{title}</h3>
      {children}
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{children}</label>
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function FreedomOSTool() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS)
  const [outputs, setOutputs] = useState<Outputs | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [planLink, setPlanLink] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  // ── Membership preview sidebar state ──
  const [showPreviewSidebar, setShowPreviewSidebar] = useState(false)
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const previewItems = [
    { id: 'studio', label: 'Studio', bullets: ['AI-powered video script generation', 'Viral prediction scoring before you post', 'Template library with proven formats'] },
    { id: 'canvas', label: 'Canvas', bullets: ['Visual strategy builder for your content pipeline', 'Drag-and-drop planning with AI suggestions', 'Connect ideas across campaigns'] },
    { id: 'hub', label: 'Hub', bullets: ['All your tools and analytics in one dashboard', 'Track growth metrics that actually matter', 'Personalized recommendations based on your niche'] },
  ]

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.inputs) setInputs((prev: Inputs) => ({ ...prev, ...parsed.inputs }))
        if (parsed.outputs) setOutputs(parsed.outputs)
      }
    } catch { /* ignore corrupt data */ }
    setHydrated(true)
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ inputs, outputs, updatedAt: new Date().toISOString() }))
    } catch { /* quota exceeded */ }
  }, [inputs, outputs, hydrated])

  const update = useCallback(<K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleGenerate = useCallback(() => {
    const plan = generatePlan(inputs)
    setOutputs(plan)
    console.log('[freedom-os/track] plan_generated', { freedomNumber: plan.freedomNumber, model: plan.primary.type })
    setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)

    // Clear any existing preview timer and restart
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    setShowPreviewSidebar(false)
    previewTimerRef.current = setTimeout(() => setShowPreviewSidebar(true), 5000)
  }, [inputs])

  // Cleanup preview timer on unmount
  useEffect(() => {
    return () => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current) }
  }, [])

  const handleLoadExample = useCallback(() => {
    setInputs(EXAMPLE_INPUTS)
    setOutputs(null)
  }, [])

  const handleReset = useCallback(() => {
    setInputs(DEFAULT_INPUTS)
    setOutputs(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  const handleCopySummary = useCallback(async () => {
    if (!outputs) return
    const text = formatSummary(inputs, outputs)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied('summary')
    console.log('[freedom-os/track] copy_summary')
    setTimeout(() => setCopied(null), 2000)
  }, [inputs, outputs])

  const handleExportJSON = useCallback(() => {
    if (!outputs) return
    const blob = new Blob([JSON.stringify({ inputs, outputs, createdAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `freedom-os-plan-${Date.now()}.json`; a.click()
    URL.revokeObjectURL(url)
    console.log('[freedom-os/track] export_json')
  }, [inputs, outputs])

  const handleSavePDF = useCallback(() => {
    window.print()
    console.log('[freedom-os/track] export_pdf')
  }, [])

  const handleCopyLink = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try { await navigator.clipboard.writeText(url) } catch {}
    setCopied('link')
    console.log('[freedom-os/track] share_link')
    setTimeout(() => setCopied(null), 2000)
  }, [])

  const handleEmailPlan = useCallback(async () => {
    if (!outputs || !email.trim()) return
    setEmailStatus('sending')
    try {
      const res = await fetch('/api/free/freedom-os/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          inputs,
          outputs,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          createdAt: new Date().toISOString(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setEmailStatus('sent')
        if (data.planLink) setPlanLink(data.planLink)
      } else {
        setEmailStatus('error')
        setTimeout(() => setEmailStatus('idle'), 4000)
      }
    } catch {
      setEmailStatus('error')
      setTimeout(() => setEmailStatus('idle'), 4000)
    }
  }, [email, inputs, outputs])

  const handleResend = useCallback(async () => {
    if (!email.trim()) return
    setResendStatus('sending')
    console.log('[freedom-os/track] resend_requested', { email: email.trim() })
    try {
      const res = await fetch('/api/free/freedom-os/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setResendStatus('sent')
        if (data.planLink) setPlanLink(data.planLink)
      } else {
        setResendStatus('error')
      }
      setTimeout(() => setResendStatus('idle'), 4000)
    } catch {
      setResendStatus('error')
      setTimeout(() => setResendStatus('idle'), 4000)
    }
  }, [email])

  const freedomPreview = computeFreedomNumber(inputs)
  const runwayPreview = computeRunway(inputs)

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* ── Hero ────────────────────────────────── */}
      <div className="text-center mb-8 print-hide">
        <Link
          href="/free"
          className="inline-flex items-center gap-1.5 text-xs font-medium no-underline mb-6"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Hub
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          Financial Freedom OS
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Build your first online income stream with a step-by-step launch plan. No login required.
        </p>
      </div>

      {/* ── Print header (only visible in print) ── */}
      <div className="print-only" style={{ display: 'none' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Financial Freedom OS &mdash; Your Plan</h1>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 24 }}>Generated {new Date().toLocaleDateString()}</p>
      </div>

      {/* ── Path selector ────────────────────────── */}
      <div className="flex gap-2 mb-8 print-hide overflow-x-auto pb-1">
        <button
          className="px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
          style={{
            background: 'linear-gradient(135deg, #e50914, #ff1744)',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(229,9,20,0.3)',
          }}
        >
          Start a Business Now
        </button>
        {['Not Ready Yet', 'Video-Specific Booster'].map(label => (
          <button
            key={label}
            disabled
            className="px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-not-allowed"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {label}
            <span className="ml-1.5 text-[9px] uppercase tracking-wider opacity-60">Soon</span>
          </button>
        ))}
      </div>

      {/* ── Input form ───────────────────────────── */}
      <div className="print-hide">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Your Situation</h2>
          <div className="flex gap-2">
            <button
              onClick={handleLoadExample}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Load example
            </button>
            {outputs && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Hours */}
          <div>
            <Label>Available hours/week</Label>
            <input type="number" min={1} max={80} value={inputs.availableHours || ''} onChange={e => update('availableHours', parseInt(e.target.value) || 0)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]" style={inputStyle} placeholder="e.g. 10" />
          </div>
          {/* Monthly income */}
          <div>
            <Label>Monthly income (optional)</Label>
            <input type="number" min={0} value={inputs.monthlyIncome || ''} onChange={e => update('monthlyIncome', parseInt(e.target.value) || 0)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]" style={inputStyle} placeholder="e.g. 4500" />
          </div>
          {/* Monthly expenses */}
          <div>
            <Label>Monthly expenses</Label>
            <input type="number" min={0} value={inputs.monthlyExpenses || ''} onChange={e => update('monthlyExpenses', parseInt(e.target.value) || 0)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]" style={inputStyle} placeholder="e.g. 3000" />
          </div>
          {/* Savings */}
          <div>
            <Label>
              Savings runway
              <select
                value={inputs.savingsMode}
                onChange={e => update('savingsMode', e.target.value as 'amount' | 'months')}
                className="ml-2 text-[10px] rounded px-1 py-0.5 font-normal normal-case tracking-normal"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'none' }}
              >
                <option value="amount">$ amount</option>
                <option value="months">months</option>
              </select>
            </Label>
            {inputs.savingsMode === 'amount' ? (
              <input type="number" min={0} value={inputs.savingsAmount || ''} onChange={e => update('savingsAmount', parseInt(e.target.value) || 0)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]" style={inputStyle} placeholder="e.g. 8000" />
            ) : (
              <select value={inputs.savingsMonths} onChange={e => update('savingsMonths', parseInt(e.target.value))}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914] appearance-none" style={inputStyle}>
                {[0, 1, 2, 3, 6, 9, 12, 18, 24].map(m => <option key={m} value={m}>{m === 0 ? 'No savings' : `${m} months`}</option>)}
              </select>
            )}
          </div>
          {/* Skill */}
          <div>
            <Label>Skill leverage</Label>
            <select value={inputs.skillLeverage} onChange={e => update('skillLeverage', e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914] appearance-none" style={inputStyle}>
              {SKILL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {/* Comfort */}
          <div>
            <Label>Experience level</Label>
            <select value={inputs.comfortLevel} onChange={e => update('comfortLevel', e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914] appearance-none" style={inputStyle}>
              {COMFORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {/* Risk */}
          <div>
            <Label>Risk tolerance</Label>
            <select value={inputs.riskTolerance} onChange={e => update('riskTolerance', e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914] appearance-none" style={inputStyle}>
              {RISK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {/* Business type */}
          <div>
            <Label>Preferred business type</Label>
            <select value={inputs.preferredBusiness} onChange={e => update('preferredBusiness', e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914] appearance-none" style={inputStyle}>
              {BUSINESS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Niche (full width) */}
        <div className="mb-4">
          <Label>Niche interest (optional)</Label>
          <input type="text" value={inputs.nicheInterest} onChange={e => update('nicheInterest', e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]" style={inputStyle}
            placeholder="e.g. Personal finance for millennials" />
        </div>

        {/* Target income + multiplier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div>
            <Label>Target monthly income (optional)</Label>
            <input type="number" min={0} value={inputs.targetIncome || ''} onChange={e => update('targetIncome', parseInt(e.target.value) || 0)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]" style={inputStyle}
              placeholder={`Default: expenses \u00d7 ${inputs.freedomMultiplier}`} />
          </div>
          <div>
            <Label>Freedom multiplier: {inputs.freedomMultiplier.toFixed(1)}x</Label>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>1.2x</span>
              <input type="range" min={1.2} max={2.0} step={0.1} value={inputs.freedomMultiplier}
                onChange={e => update('freedomMultiplier', parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[#e50914]"
                style={{ background: 'rgba(255,255,255,0.1)' }} />
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>2.0x</span>
            </div>
          </div>
        </div>

        {/* Live preview + generate */}
        <div
          className="rounded-xl px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ background: 'rgba(229,9,20,0.06)', border: '1px solid rgba(229,9,20,0.12)' }}
        >
          <div className="flex gap-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Freedom #</div>
              <div className="text-lg font-extrabold text-white">${freedomPreview.toLocaleString()}<span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>/mo</span></div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Runway</div>
              <div className="text-lg font-extrabold text-white">{runwayPreview}<span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}> mo</span></div>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shrink-0"
            style={{
              background: 'linear-gradient(135deg, #e50914, #ff1744)',
              boxShadow: '0 4px 20px rgba(229,9,20,0.35)',
            }}
          >
            Generate My Plan
          </button>
        </div>
      </div>

      {/* ── Results ──────────────────────────────── */}
      {outputs && (
        <div id="results">
          {/* Print-only summary header */}
          <div className="print-only" style={{ display: 'none', marginBottom: 16 }}>
            <p style={{ fontSize: 14 }}><strong>Freedom Number:</strong> ${outputs.freedomNumber.toLocaleString()}/mo &nbsp;|&nbsp; <strong>Runway:</strong> {outputs.runwayMonths} months</p>
          </div>

          {/* A: Model Fit */}
          <SectionCard title="Business Model Fit" id="result-model">
            <div className="rounded-xl p-4 mb-3" style={{ background: 'rgba(229,9,20,0.06)', border: '1px solid rgba(229,9,20,0.12)' }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#ff1744' }}>Recommended</div>
              <div className="text-base font-extrabold text-white mb-1">{outputs.primary.name}</div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{outputs.primary.description}</p>
            </div>
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Alternative</div>
              <div className="text-sm font-bold text-white mb-1">{outputs.secondary.name}</div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{outputs.secondary.description}</p>
            </div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Why this model?</div>
            <ul className="space-y-1.5">
              {outputs.rationale.map((r, i) => (
                <li key={i} className="text-xs flex gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <span style={{ color: '#ff1744' }}>&bull;</span>{r}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* B: Starter Offer */}
          <SectionCard title="Starter Offer Builder" id="result-offer">
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Offer Name</div>
                <div className="text-base font-bold text-white">{outputs.offer.name}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Who It&apos;s For</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{outputs.offer.target}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Promise</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{outputs.offer.promise}</div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Deliverables</div>
                <ul className="space-y-1">
                  {outputs.offer.deliverables.map((d, i) => (
                    <li key={i} className="text-xs flex gap-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      <span style={{ color: '#ff1744' }}>{i + 1}.</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Suggested Price</span>
                <span className="text-sm font-extrabold text-white">{outputs.offer.priceRange}</span>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>First Version Scope Rules</div>
                <ul className="space-y-1">
                  {outputs.offer.firstVersionScope.map((s, i) => (
                    <li key={i} className="text-xs flex gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <span>&#10003;</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* C: 14-Day Sprint */}
          <SectionCard title="14-Day Launch Sprint" id="result-sprint">
            <div className="space-y-4">
              {outputs.sprint.map((block, i) => (
                <div key={i}>
                  <div className="text-xs font-bold text-white mb-2">{block.days}</div>
                  <ul className="space-y-1.5">
                    {block.tasks.map((t, j) => (
                      <li key={j} className="text-xs flex gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        <span className="shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px]" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>&nbsp;</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* D: 90-Day Roadmap */}
          <SectionCard title="90-Day Scale Roadmap" id="result-roadmap">
            <div className="space-y-5">
              {outputs.roadmap.map((phase, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white">{phase.phase}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>{phase.weeks}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Milestones</div>
                      <ul className="space-y-1">
                        {phase.milestones.map((m, j) => (
                          <li key={j} className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>&bull; {m}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>KPIs</div>
                      <ul className="space-y-1">
                        {phase.kpis.map((k, j) => (
                          <li key={j} className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{k}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* E: First 50 Leads */}
          <SectionCard title="First 50 Leads Plan" id="result-leads">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Channel</div>
                  <div className="text-sm font-bold text-white">{outputs.leads.channel}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Daily Target</div>
                  <div className="text-sm font-bold text-white">{outputs.leads.dailyTarget}</div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Script Templates</div>
                <div className="space-y-2">
                  {outputs.leads.scripts.map((script, i) => (
                    <div key={i} className="rounded-lg px-4 py-3 text-xs italic leading-relaxed" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                      {script}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── Email capture (primary save action) ── */}
          <div className="print-hide rounded-2xl p-5 sm:p-6 mb-4" style={{ background: 'rgba(229,9,20,0.05)', border: '1px solid rgba(229,9,20,0.12)' }}>
            {emailStatus === 'sent' ? (
              <div className="text-center py-2">
                <div className="text-sm font-bold text-white mb-1">You&apos;re all set!</div>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Check your email for updates. You can also open your saved plan right now.
                </p>
                {planLink && (
                  <a
                    href={planLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white no-underline transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #e50914, #ff1744)',
                      boxShadow: '0 4px 20px rgba(229,9,20,0.35)',
                    }}
                  >
                    Open my plan now
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  </a>
                )}
                <button
                  onClick={handleResend}
                  disabled={resendStatus === 'sending'}
                  className="mt-3 text-xs font-medium transition-all bg-transparent border-none cursor-pointer disabled:cursor-not-allowed"
                  style={{ color: resendStatus === 'sent' ? '#10b981' : resendStatus === 'error' ? '#ef4444' : 'rgba(255,255,255,0.35)' }}
                >
                  {resendStatus === 'sending' ? 'Resending\u2026' : resendStatus === 'sent' ? 'Resent!' : resendStatus === 'error' ? 'Failed to resend' : "Didn\u2019t get it? Resend"}
                </button>
              </div>
            ) : (
              <>
                <div className="text-sm font-bold text-white mb-1">Email me my plan</div>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  We&apos;ll email you a link to your plan. No spam.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (emailStatus === 'error') setEmailStatus('idle') }}
                    placeholder="you@example.com"
                    className="flex-1 min-w-0 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
                    style={inputStyle}
                    onKeyDown={e => { if (e.key === 'Enter' && emailStatus === 'idle') handleEmailPlan() }}
                  />
                  <button
                    onClick={handleEmailPlan}
                    disabled={emailStatus === 'sending' || !email.trim()}
                    className="px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #e50914, #ff1744)',
                      boxShadow: emailStatus === 'sending' ? 'none' : '0 4px 20px rgba(229,9,20,0.35)',
                    }}
                  >
                    {emailStatus === 'sending' ? 'Sending\u2026' : 'Send my plan'}
                  </button>
                </div>
                {emailStatus === 'error' && (
                  <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
                    Something went wrong. Please check your email and try again.
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Secondary export actions ──────────── */}
          <div className="print-hide rounded-2xl p-4 sm:p-5 mb-4 flex flex-wrap items-center gap-2" style={cardStyle}>
            <button onClick={handleSavePDF}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Save as PDF
            </button>
            <button onClick={handleCopySummary}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              style={{ background: copied === 'summary' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', color: copied === 'summary' ? '#10b981' : 'rgba(255,255,255,0.6)', border: `1px solid ${copied === 'summary' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
              {copied === 'summary' ? 'Copied!' : 'Copy Summary'}
            </button>
            <button onClick={handleExportJSON}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Export JSON
            </button>
            <button onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ml-auto"
              style={{ background: copied === 'link' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: copied === 'link' ? '#10b981' : 'rgba(255,255,255,0.4)', border: `1px solid ${copied === 'link' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
              {copied === 'link' ? 'Copied!' : 'Share Link'}
            </button>
          </div>
        </div>
      )}

      {/* ── Faint Membership Preview Sidebar (left, hidden on mobile) ── */}
      {showPreviewSidebar && outputs && (
        <div
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 flex-col gap-3 pl-3 pr-2 py-4"
          style={{
            opacity: 0,
            animation: 'sidebarFadeIn 800ms ease-out forwards',
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes sidebarFadeIn { from { opacity: 0; transform: translateX(-8px) translateY(-50%); } to { opacity: 1; transform: translateX(0) translateY(-50%); } }
            @keyframes neonPulse {
              0%, 100% { border-color: rgba(74,222,128,0.12); box-shadow: 0 0 3px rgba(74,222,128,0.05); }
              50% { border-color: rgba(74,222,128,0.35); box-shadow: 0 0 8px rgba(74,222,128,0.12); }
            }
          `}} />
          {previewItems.map(item => (
            <div key={item.id} className="group relative">
              <button
                onClick={() => setSelectedPreviewId(item.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium tracking-wide uppercase transition-colors duration-300 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(74,222,128,0.12)',
                  color: 'rgba(255,255,255,0.2)',
                  animation: 'neonPulse 3s ease-in-out infinite',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                }}
              >
                {item.label}
                {/* Preview pill — visible on hover */}
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(229,9,20,0.15)', color: 'rgba(229,9,20,0.7)' }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Preview
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Preview Modal ── */}
      {selectedPreviewId && (() => {
        const item = previewItems.find(p => p.id === selectedPreviewId)
        if (!item) return null
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSelectedPreviewId(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6 sm:p-8 relative"
              style={{
                background: 'linear-gradient(145deg, rgba(20,20,25,0.98), rgba(10,10,14,0.98))',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedPreviewId(null)}
                className="absolute top-4 right-4 p-1 rounded-lg transition-colors border-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-1">{item.label}</h3>
              <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>Coming soon to your toolkit</p>

              {/* Placeholder preview area */}
              <div
                className="rounded-xl mb-5 flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  height: 160,
                }}
              >
                <div className="text-center">
                  <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>Preview coming soon</span>
                </div>
              </div>

              {/* Benefits */}
              <ul className="space-y-2.5 mb-6">
                {item.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {b}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all border-none cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #e50914, #ff1744)',
                  boxShadow: '0 4px 20px rgba(229,9,20,0.35)',
                }}
                onClick={() => setSelectedPreviewId(null)}
              >
                Get Access
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
