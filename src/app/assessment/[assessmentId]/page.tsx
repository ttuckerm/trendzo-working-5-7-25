// User-facing renderer for an Escape Assessment.
// Server component: fetches the row, validates payload, hands off to the HUD
// client component for animation + interactivity.

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchAssessment } from '@/lib/assessment/fetch-assessment'
import { AssessmentHUD } from '@/components/assessment/AssessmentHUD'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Your Escape Assessment — Trendzo',
  description: 'The personalized 14-day sprint, calibrated to your inputs.',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: { assessmentId: string }
}

export default async function AssessmentPage({ params }: PageProps) {
  const row = await fetchAssessment(params.assessmentId)
  if (!row) notFound()

  return (
    <AssessmentHUD
      assessmentId={row.assessment_id}
      payload={row.payload}
      sprintProgress={row.sprint_progress}
    />
  )
}
