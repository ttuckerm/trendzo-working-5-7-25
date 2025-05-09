import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HelpGuide() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Template Analyzer Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <h3>How to Use the Template Analyzer</h3>
          
          <p>
            The Template Analyzer helps you understand TikTok video templates by breaking down their 
            structure, analyzing engagement factors, and identifying template patterns.
          </p>
          
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-lg font-medium">Step 1: Fetch Videos</h4>
              <p className="text-gray-600">
                Start by fetching TikTok videos using the Apify scraper. You can adjust the number of videos
                to fetch (between 1-20). These videos will be analyzed for template patterns.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium">Step 2: Select & Analyze</h4>
              <p className="text-gray-600">
                Browse through the fetched videos and select one to analyze. The analyzer will use AI to
                identify template characteristics including structure, engagement factors, and viral potential.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium">Step 3: Review Analysis</h4>
              <p className="text-gray-600">
                View the detailed template analysis, including:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Template category classification</li>
                <li>Section breakdown (intro, content, outro, etc.)</li>
                <li>Engagement metrics and viral potential</li>
                <li>Similar templates with similarity scores</li>
              </ul>
            </div>
          </div>
          
          <h3 className="mt-6">Running Tests</h3>
          <p className="text-gray-600">
            You can also run automated tests on the analyzer to verify different aspects of its functionality:
          </p>
          
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li><strong>Video Processing</strong> - Tests the ability to fetch and process TikTok videos</li>
            <li><strong>Template Categorization</strong> - Verifies template category identification</li>
            <li><strong>Structure Extraction</strong> - Tests the identification of video sections</li>
            <li><strong>Template Similarity</strong> - Verifies the detection of similar templates</li>
          </ul>
          
          <div className="bg-blue-50 p-4 rounded-md mt-4">
            <h4 className="text-blue-800 font-medium">Troubleshooting Tips</h4>
            <ul className="list-disc pl-5 space-y-1 text-blue-800 mt-2">
              <li>If video fetching fails, check your Apify API key in .env.local</li>
              <li>If analysis fails, verify your Claude API key is correctly set</li>
              <li>In development, the system will use mock data if API keys aren't available</li>
              <li>For best results, analyze videos with at least 10,000 views</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 