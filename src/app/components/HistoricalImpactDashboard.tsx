'use client';

import React, { useState, useEffect } from 'react';
import { HistoricalImpactAnalysis } from '@/lib/types/expertDashboard';
import { generateHistoricalImpactAnalysis } from '@/lib/utils/historicalImpactAnalysis';
import { Prediction } from '@/lib/types/prediction';
import ImpactTimelineChart from './HistoricalImpact/ImpactTimelineChart';
import AdjustmentTypeImpactChart from './HistoricalImpact/AdjustmentTypeImpactChart';
import TopImpactfulAdjustmentsTable from './HistoricalImpact/TopImpactfulAdjustmentsTable';
import ExpertPerformanceComparison from './HistoricalImpact/ExpertPerformanceComparison';
import TimeframeSelector from './HistoricalImpact/TimeframeSelector';

// Use our custom UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface HistoricalImpactDashboardProps {
  predictions: Prediction[];
}

// Simple Card components since we're missing the original ones
const CardHeader = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`p-4 pb-2 ${className || ''}`}>{children}</div>
);

const CardTitle = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <h3 className={`text-sm font-medium ${className || ''}`}>{children}</h3>
);

const CardContent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`p-4 pt-0 ${className || ''}`}>{children}</div>
);

// Simple Tabs components
const Tabs = ({ value, onValueChange, children }: { value: string, onValueChange: (value: string) => void, children: React.ReactNode }) => (
  <div className="space-y-4">{children}</div>
);

const TabsList = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`flex space-x-1 bg-gray-100 p-1 rounded-md ${className || ''}`}>{children}</div>
);

const TabsTrigger = ({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) => (
  <button
    className={`px-3 py-1.5 text-sm font-medium rounded-sm ${value === 'active' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-900'} ${className || ''}`}
    onClick={() => {}}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children }: { value: string, children: React.ReactNode }) => (
  <div className={`mt-2 ${value === 'active' ? 'block' : 'hidden'}`}>{children}</div>
);

export default function HistoricalImpactDashboard({ predictions }: HistoricalImpactDashboardProps) {
  // Create state for timeframe and time granularity
  const [timeRange, setTimeRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    endDate: new Date()
  });
  
  const [timeGranularity, setTimeGranularity] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisData, setAnalysisData] = useState<HistoricalImpactAnalysis | null>(null);
  
  // Generate historical impact analysis when predictions, timeRange, or timeGranularity changes
  useEffect(() => {
    if (predictions.length === 0) return;
    
    const data = generateHistoricalImpactAnalysis(predictions, timeRange, timeGranularity);
    setAnalysisData(data);
  }, [predictions, timeRange, timeGranularity]);
  
  // Handle timeframe selection
  const handleTimeframeChange = (range: { startDate: Date; endDate: Date }) => {
    setTimeRange(range);
  };
  
  // Handle granularity selection
  const handleGranularityChange = (granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly') => {
    setTimeGranularity(granularity);
  };
  
  if (!analysisData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading impact analysis data...</p>
        </div>
      </div>
    );
  }
  
  // Calculate overall metrics
  const totalAdjustments = analysisData.timeframes.reduce((sum, timeframe) => sum + timeframe.adjustedPredictions, 0);
  const weightedImprovement = analysisData.timeframes.reduce((sum, timeframe) => {
    return sum + (timeframe.improvementPercent * timeframe.adjustedPredictions);
  }, 0) / (totalAdjustments || 1);
  
  // Find most beneficial adjustment type
  const mostBeneficialType = [...analysisData.adjustmentTypes]
    .sort((a, b) => b.averageImprovement - a.averageImprovement)[0];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Historical Impact Analysis</h1>
        <TimeframeSelector 
          onTimeframeChange={handleTimeframeChange}
          onGranularityChange={handleGranularityChange}
          timeRange={timeRange}
          granularity={timeGranularity}
        />
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border rounded-lg shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdjustments}</div>
          </CardContent>
        </Card>
        
        <Card className="border rounded-lg shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weightedImprovement.toFixed(2)}%</div>
          </CardContent>
        </Card>
        
        <Card className="border rounded-lg shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Beneficial Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostBeneficialType?.adjustmentType || 'N/A'}</div>
            {mostBeneficialType && (
              <p className="text-xs text-muted-foreground">
                {mostBeneficialType.averageImprovement.toFixed(2)}% improvement
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="border rounded-lg shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Performing Expert</CardTitle>
          </CardHeader>
          <CardContent>
            {analysisData.expertPerformance.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {analysisData.expertPerformance[0].name}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(analysisData.expertPerformance[0].averageImpact * 100).toFixed(2)}% improvement
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold">N/A</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value={activeTab === 'overview' ? 'active' : ''}>Overview</TabsTrigger>
          <TabsTrigger value={activeTab === 'adjustments' ? 'active' : ''}>Adjustments</TabsTrigger>
          <TabsTrigger value={activeTab === 'experts' ? 'active' : ''}>Experts</TabsTrigger>
          <TabsTrigger value={activeTab === 'categories' ? 'active' : ''}>Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab === 'overview' ? 'active' : ''} className="space-y-4">
          <Card className="border rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Impact Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ImpactTimelineChart 
                timeframes={analysisData.timeframes} 
                granularity={timeGranularity}
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle>Top Impactful Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                <TopImpactfulAdjustmentsTable 
                  adjustments={analysisData.topImpactfulAdjustments.slice(0, 5)} 
                />
              </CardContent>
            </Card>
            
            <Card className="border rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle>Adjustment Volume Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ImpactTimelineChart 
                  seriesData={analysisData.trendData.adjustmentVolume}
                  granularity={timeGranularity}
                  type="bar"
                  yAxisLabel="Number of Adjustments"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value={activeTab === 'adjustments' ? 'active' : ''} className="space-y-4">
          <Card className="border rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Adjustments Impact by Type</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <AdjustmentTypeImpactChart types={analysisData.adjustmentTypes} />
            </CardContent>
          </Card>
          
          <Card className="border rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>All Impactful Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <TopImpactfulAdjustmentsTable 
                adjustments={analysisData.topImpactfulAdjustments} 
                showAll
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value={activeTab === 'experts' ? 'active' : ''} className="space-y-4">
          <Card className="border rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Expert Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ExpertPerformanceComparison experts={analysisData.expertPerformance} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value={activeTab === 'categories' ? 'active' : ''} className="space-y-4">
          <Card className="border rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Impact by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <AdjustmentTypeImpactChart 
                types={analysisData.adjustmentTypes}
                categoryView
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 