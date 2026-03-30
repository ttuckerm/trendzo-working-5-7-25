import { redirect } from 'next/navigation';

export default function TrendPredictionsRedirect() {
  redirect('/dashboard-view/trend-predictions-dashboard');
}
// This is a server component that redirects immediately, without client-side rendering
// This prevents the flash of content before redirect 