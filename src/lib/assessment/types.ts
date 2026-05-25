// Shape returned by POST /api/assessment/generate once an assessment has been
// successfully created. Consumed by the loading-screen overlay (to decide
// between auto-routing and a caller-supplied onAssessmentReady callback) and
// by any sibling that needs the canonical share URL — e.g. the loading-screen
// mini-game's "View My Plan" CTA and the Freedom Agent's post-generation
// hand-off.
export interface AssessmentReadyData {
  assessmentId: string
  shareUrlId: string
}
