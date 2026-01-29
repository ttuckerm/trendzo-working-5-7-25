'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FeedbackIngestPage() {
  const { user, isAdmin } = useAuth();

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6 text-center">
            You need to be logged in as an admin to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">
            FeedbackIngest
          </h1>
          <p className="text-gray-400 text-lg">
            Automated service that pulls real post stats back in each hour for continuous learning
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-2xl">📥</span>
              Ingest Status
              <Badge variant="outline" className="text-gray-500 border-gray-600 ml-auto">
                Not Implemented
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                FeedbackIngest Coming Soon
              </h3>
              <p className="text-gray-400 max-w-md">
                Continuous feedback loop that monitors real-world performance and updates prediction models.
              </p>
              <div className="mt-6 space-y-2 text-left">
                <p className="text-sm text-gray-500">
                  • 🕐 Hourly ingestion of real post performance data
                </p>
                <p className="text-sm text-gray-500">
                  • 📊 Track views, likes, shares, comments across platforms
                </p>
                <p className="text-sm text-gray-500">
                  • 🔄 Update prediction models with actual results
                </p>
                <p className="text-sm text-gray-500">
                  • 📈 Improve accuracy through continuous learning
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}