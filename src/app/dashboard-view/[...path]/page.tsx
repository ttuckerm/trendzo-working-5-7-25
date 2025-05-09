import { redirect } from 'next/navigation';

// Simple redirect handler for dashboard paths
export default function CatchAllPage({ params }: { params: { path: string[] } }) {
  // If no path provided, go to main dashboard
  if (!params.path || params.path.length === 0) {
    return redirect('/dashboard-view/trend-predictions-dashboard');
  }
  
  // Get the full path from the params
  const fullPath = params.path.join('/');
  
  // If it's a trend-predictions-dashboard path, keep it
  if (fullPath === 'trend-predictions-dashboard') {
    return redirect('/dashboard-view/trend-predictions-dashboard');
  }
  
  // For accuracy page, go directly there
  if (fullPath === 'trend-predictions-dashboard/accuracy') {
    return redirect('/dashboard-view/trend-predictions-dashboard/accuracy');
  }
  
  // For all other paths, just go to main dashboard to be safe
  return redirect('/dashboard-view/trend-predictions-dashboard');
} 