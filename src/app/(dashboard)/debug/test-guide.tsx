"use client";

import Link from 'next/link';

export default function TestGuidePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Analytics Testing Guide</h1>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Testing URLs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border rounded-md p-4 bg-gray-50">
            <h3 className="font-medium mb-2">Main Features</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/analytics" className="text-blue-600 hover:underline">
                  Analytics Dashboard
                </Link>
                <p className="text-sm text-gray-600">Main analytics dashboard with all interactive features</p>
              </li>
              <li>
                <Link href="/api/templates/analytics?includeExpertData=true" className="text-blue-600 hover:underline" target="_blank">
                  Analytics API (with experts)
                </Link>
                <p className="text-sm text-gray-600">Raw API data with expert insights included</p>
              </li>
              <li>
                <Link href="/api/templates/analytics?includeExpertData=false" className="text-blue-600 hover:underline" target="_blank">
                  Analytics API (AI-only)
                </Link>
                <p className="text-sm text-gray-600">Raw API data without expert insights</p>
              </li>
            </ul>
          </div>
          
          <div className="border rounded-md p-4 bg-gray-50">
            <h3 className="font-medium mb-2">Debug Tools</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/debug/subscription" className="text-blue-600 hover:underline">
                  Subscription Debug Tools
                </Link>
                <p className="text-sm text-gray-600">Toggle between free and premium tier</p>
              </li>
              <li>
                <Link href="/api/debug/analytics" className="text-blue-600 hover:underline" target="_blank">
                  Debug Analytics API
                </Link>
                <p className="text-sm text-gray-600">All templates with forced expert data</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">1. Testing Analytics Data Display</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <strong>Visit the Analytics Dashboard:</strong>
              <p className="text-gray-600">Go to <Link href="/analytics" className="text-blue-600 hover:underline">/analytics</Link> to view the complete dashboard</p>
            </li>
            <li>
              <strong>Verify Template Cards:</strong>
              <p className="text-gray-600">Check that template cards display with thumbnails, title, view counts, and engagement percentages</p>
              <p className="text-gray-600">Templates with expert insights should show an "Expert Enhanced" badge</p>
            </li>
            <li>
              <strong>Select a Template with Expert Data:</strong>
              <p className="text-gray-600">Click on a template with the "Expert Enhanced" badge</p>
              <p className="text-gray-600">Scroll down to the "Additional Insights" section to see expert insights and AI vs Expert comparison</p>
            </li>
            <li>
              <strong>Verify Performance Charts:</strong>
              <p className="text-gray-600">Check that the "View Trends" and "Engagement Rate" charts are displaying correctly</p>
              <p className="text-gray-600">If a template has expert data, charts should show both AI-predicted line and expert-enhanced line</p>
            </li>
          </ol>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">2. Testing Tier-Gating for Premium Features</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <strong>Set Subscription to Free Tier:</strong>
              <p className="text-gray-600">Go to <Link href="/debug/subscription" className="text-blue-600 hover:underline">/debug/subscription</Link> and click "Free Tier"</p>
            </li>
            <li>
              <strong>Attempt to Access Analytics:</strong>
              <p className="text-gray-600">Visit <Link href="/analytics" className="text-blue-600 hover:underline">/analytics</Link></p>
              <p className="text-gray-600">You should see an upgrade prompt with "Premium Feature" message</p>
            </li>
            <li>
              <strong>Switch to Premium Tier:</strong>
              <p className="text-gray-600">Go back to <Link href="/debug/subscription" className="text-blue-600 hover:underline">/debug/subscription</Link> and click "Premium Tier"</p>
            </li>
            <li>
              <strong>Access Analytics Again:</strong>
              <p className="text-gray-600">Go to <Link href="/analytics" className="text-blue-600 hover:underline">/analytics</Link> again</p>
              <p className="text-gray-600">You should now have full access to the analytics dashboard</p>
            </li>
          </ol>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">3. Testing Interactive Elements</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <strong>Test Filter Controls:</strong>
              <p className="text-gray-600">Try changing the time range using the dropdown (7d, 30d, 90d, all)</p>
              <p className="text-gray-600">Filter by different categories and sort options</p>
              <p className="text-gray-600">Toggle the "Include expert insights" checkbox to see changes in displayed data</p>
            </li>
            <li>
              <strong>Test Template Comparison:</strong>
              <p className="text-gray-600">Select a template, then click "Select another template to compare"</p>
              <p className="text-gray-600">Select a second template to see the comparison chart</p>
              <p className="text-gray-600">Verify that the radar chart displays data for both templates</p>
            </li>
            <li>
              <strong>Test Chart Interactions:</strong>
              <p className="text-gray-600">Hover over chart data points to see tooltips</p>
              <p className="text-gray-600">Check that legend items can toggle visibility of data lines</p>
            </li>
          </ol>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">4. Testing Expert vs AI Data</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <strong>Toggle Expert Data:</strong>
              <p className="text-gray-600">Check the "Include expert insights" checkbox at the top of the dashboard</p>
              <p className="text-gray-600">Select a template with expert data (with the "Expert Enhanced" badge)</p>
            </li>
            <li>
              <strong>Verify Expert Insights Panel:</strong>
              <p className="text-gray-600">Check that expert notes, tags, and recommended uses are displayed</p>
            </li>
            <li>
              <strong>Verify AI vs Expert Comparison:</strong>
              <p className="text-gray-600">Check the "AI vs Expert Comparison" section for: </p>
              <ul className="list-disc pl-6 text-gray-600">
                <li>AI-Only Score value</li>
                <li>Expert-Adjusted Score value</li>
                <li>Impact percentage showing the difference</li>
              </ul>
            </li>
            <li>
              <strong>Verify Charts with Expert Data:</strong>
              <p className="text-gray-600">Look at the performance charts to verify that both AI and expert lines are displayed</p>
              <p className="text-gray-600">Check that the expert line shows the adjusted values</p>
            </li>
          </ol>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium">Firebase Errors:</h3>
              <p className="text-gray-600">
                If you see Firebase errors in the console, don't worry. The application falls back to mock data when Firebase has issues, 
                which is expected in this development environment.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Data Not Displaying:</h3>
              <p className="text-gray-600">
                If data isn't showing up, check the browser console for errors. You can also try the debug API endpoint to 
                verify that data generation is working: <Link href="/api/debug/analytics" className="text-blue-600 hover:underline" target="_blank">/api/debug/analytics</Link>
              </p>
            </div>
            <div>
              <h3 className="font-medium">Tier-Gating Not Working:</h3>
              <p className="text-gray-600">
                If tier-gating isn't working, check:
              </p>
              <ul className="list-disc pl-6 text-gray-600">
                <li>Whether the mock subscription status is being correctly set</li>
                <li>If the local storage values are being properly saved</li>
                <li>That you're using the debug tools to switch between tiers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 