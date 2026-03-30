import { redirect } from 'next/navigation';

export default function AdvancedTrendPredictionsDashboardPage() {
  redirect('/dashboard-view/trend-predictions-dashboard/advanced');
}
// This is a server component that redirects immediately without client-side rendering
// This prevents the flash of content before redirect 