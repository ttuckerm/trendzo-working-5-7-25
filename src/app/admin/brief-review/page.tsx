import { redirect } from 'next/navigation'

/**
 * Brief review is now integrated into the Workspace dashboard (/agency/dashboard)
 * and the Clay conversational UI (/agency). This page redirects to the dashboard.
 */
export default function BriefReviewRedirect() {
  redirect('/agency/dashboard')
}
