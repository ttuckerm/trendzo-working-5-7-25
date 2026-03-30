'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdvisorServicePage() {
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
            AdvisorService
          </h1>
          <p className="text-gray-400 text-lg">
            Compares draft content to HOT templates and returns actionable fix list
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Advisory Status
              <Badge variant="outline" className="text-gray-500 border-gray-600 ml-auto">
                Not Implemented
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                AdvisorService Coming Soon
              </h3>
              <p className="text-gray-400 max-w-md">
                AI-powered analysis that compares user drafts against viral templates to generate improvement recommendations.
              </p>
              <div className="mt-6 space-y-2 text-left">
                <p className="text-sm text-gray-500">
                  • 🔍 Compare draft against HOT viral templates
                </p>
                <p className="text-sm text-gray-500">
                  • 📋 Generate actionable fix list with priorities
                </p>
                <p className="text-sm text-gray-500">
                  • 🎯 Specific recommendations for improvement
                </p>
                <p className="text-sm text-gray-500">
                  • 📈 Predict viral score improvement potential
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}