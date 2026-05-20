// User-facing renderer for an Escape Assessment.
// Server component: fetches the row, validates payload, hands off to the HUD
// client component for animation + interactivity.
//
// URL format: /assessment/{EA-X-XXX}-{share_token}. The share_token is a
// 20-char unguessable suffix added so URLs aren't enumerable. Both halves must
// match a stored row — on either mismatch we 404 (never redirect; never reveal
// which half was wrong).

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  fetchAssessmentByShareId,
  parseShareIdParam,
} from '@/lib/assessment/fetch-assessment'
import { AssessmentHUD } from '@/components/assessment/AssessmentHUD'
import MetaPixelAssessmentEvent from '@/components/analytics/MetaPixelAssessmentEvent'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Your Escape Assessment',
  description: 'The personalized 14-day sprint, calibrated to your inputs.',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: { assessmentId: string }
}

export default async function AssessmentPage({ params }: PageProps) {
  const parsed = parseShareIdParam(params.assessmentId)
  if (!parsed) notFound()

  const row = await fetchAssessmentByShareId(parsed.displayId, parsed.shareToken)
  if (!row) notFound()

  return (
    <>
      <MetaPixelAssessmentEvent assessmentId={row.assessment_id} />
      <AssessmentHUD
        assessmentId={row.assessment_id}
        shareToken={row.share_token}
        payload={row.payload}
        sprintProgress={row.sprint_progress}
      />
    </>
  )
}
