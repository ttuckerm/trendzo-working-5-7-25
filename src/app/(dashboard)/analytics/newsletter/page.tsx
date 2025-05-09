'use client';

// Import the newsletter analytics dashboard implementation
// This is a direct reference to the page component we've already created
import NewsletterAnalyticsPage from '../../../dashboard-view/newsletter-analytics/page';

/**
 * Newsletter Analytics Page
 * 
 * This is a wrapper that imports the main newsletter analytics dashboard
 * implementation to make it accessible from the dashboard route group.
 */
export default function NewsletterAnalyticsDashboardPage() {
  return <NewsletterAnalyticsPage />;
} 