'use client';

import React from 'react';
import { BarChart2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MLExpertImpactChartProps {
  isLoading?: boolean;
}

export function MLExpertImpactChart({ isLoading = false }: MLExpertImpactChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Card className="border-blue-100 h-full">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center text-blue-800">
                <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
                Expert Impact on ML Accuracy
              </CardTitle>
              <CardDescription>
                How expert adjustments are improving the ML prediction system
              </CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              +22% Overall Improvement
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex items-center justify-center h-full py-10">
          <div className="text-center">
            <BarChart2 className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <p className="text-blue-700 font-medium">
              Expert impact visualization
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Chart showing how expert adjustments have improved prediction accuracy over time
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 