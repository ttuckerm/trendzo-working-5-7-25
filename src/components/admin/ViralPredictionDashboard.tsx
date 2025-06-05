'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Zap, TrendingUp, Brain, Target, Clock, Users, Eye, ThumbsUp, Share2, MessageCircle, AlertCircle, CheckCircle, Info, Star, Lightbulb } from 'lucide-react';
import { viralPredictionModel, PredictionResult, MLFeatures } from '@/lib/services/viralPredictionModel';
import { Platform } from '@/lib/types/database';

interface ViralAnalysisData {
  modelPerformance: any[];
  accuracyTrend: any[];
  featureImportance: any[];
  trendPredictions: any;
  recentPredictions: PredictionResult[];
}

export function ViralPredictionDashboard() {
  const [analysisData, setAnalysisData] = useState<ViralAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [customFeatures, setCustomFeatures] = useState<Partial<MLFeatures>>({});
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');

  // Fetch viral analysis data
  const fetchAnalysisData = async () => {
    try {
      const [modelPerformance, accuracyData, featureImportance, trendPredictions] = await Promise.all([
        viralPredictionModel.getModelPerformance(),
        viralPredictionModel.analyzePredictionAccuracy({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }),
        viralPredictionModel.getFeatureImportance(),
        viralPredictionModel.generateTrendAwarePredictions({
          platform: selectedPlatform,
          timeframe: 'day'
        })
      ]);

      // Generate some recent predictions for demo
      const recentPredictions = await generateMockRecentPredictions();

      setAnalysisData({
        modelPerformance,
        accuracyTrend: accuracyData.accuracyTrend,
        featureImportance,
        trendPredictions,
        recentPredictions
      });
    } catch (error) {
      console.error('Failed to fetch viral analysis data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate viral prediction
  const generatePrediction = async () => {
    if (!selectedTemplate) return;

    try {
      const result = await viralPredictionModel.predictViralPotential(
        selectedTemplate,
        customFeatures,
        selectedPlatform
      );
      setPredictionResult(result);
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [selectedPlatform]);

  // Generate mock recent predictions
  const generateMockRecentPredictions = async (): Promise<PredictionResult[]> => {
    return [
      {
        templateId: 'template_1',
        platform: 'instagram',
        predictedScore: 85,
        confidence: 92,
        breakdown: {
          contentScore: 88,
          visualScore: 82,
          audioScore: 90,
          timingScore: 78,
          platformFitScore: 95,
          trendAlignmentScore: 80
        },
        predictions: {
          views: { pessimistic: 25000, realistic: 75000, optimistic: 150000 },
          engagement: { likes: 3750, shares: 1500, comments: 750 },
          viralProbability: 78,
          timeToViralPeak: 4
        },
        recommendations: ['Post during peak hours', 'Add trending audio'],
        risks: ['High competition in niche'],
        optimalPostingTime: '7-9 PM'
      },
      {
        templateId: 'template_2',
        platform: 'tiktok',
        predictedScore: 72,
        confidence: 88,
        breakdown: {
          contentScore: 75,
          visualScore: 88,
          audioScore: 85,
          timingScore: 65,
          platformFitScore: 90,
          trendAlignmentScore: 60
        },
        predictions: {
          views: { pessimistic: 15000, realistic: 45000, optimistic: 90000 },
          engagement: { likes: 2250, shares: 900, comments: 450 },
          viralProbability: 65,
          timeToViralPeak: 2
        },
        recommendations: ['Improve hook strength', 'Optimize timing'],
        risks: ['Content may be too long'],
        optimalPostingTime: '6-8 PM'
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading viral prediction analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Viral Prediction AI
          </h1>
          <p className="text-gray-600">AI-powered content performance predictions</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as Platform)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalysisData} variant="outline">
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predict">Live Prediction</TabsTrigger>
          <TabsTrigger value="analysis">Model Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trend Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Model Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Model Accuracy</p>
                    <p className="text-3xl font-bold text-green-600">85.2%</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Predictions Today</p>
                    <p className="text-3xl font-bold text-blue-600">1,247</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Confidence</p>
                    <p className="text-3xl font-bold text-purple-600">88.7%</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent High-Potential Templates</CardTitle>
                <CardDescription>Templates with 80+ viral scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData?.recentPredictions.map((prediction, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">Template {prediction.templateId}</h4>
                          <Badge variant="outline" className="mt-1">
                            {prediction.platform}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">
                            {prediction.predictedScore}
                          </div>
                          <div className="text-xs text-gray-500">
                            {prediction.confidence}% confidence
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-sm font-semibold">
                            {prediction.predictions.views.realistic.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">Est. Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold">
                            {prediction.predictions.viralProbability}%
                          </div>
                          <div className="text-xs text-gray-600">Viral Chance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold">
                            {prediction.predictions.timeToViralPeak}h
                          </div>
                          <div className="text-xs text-gray-600">Peak Time</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {prediction.recommendations.slice(0, 2).map((rec, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Importance Ranking</CardTitle>
                <CardDescription>Factors that most influence viral potential</CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureImportanceChart data={analysisData?.featureImportance || []} />
              </CardContent>
            </Card>
          </div>

          {/* Performance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown Analysis</CardTitle>
              <CardDescription>Average performance across different content categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreBreakdownChart predictions={analysisData?.recentPredictions || []} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Prediction Tab */}
        <TabsContent value="predict" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prediction Input */}
            <Card>
              <CardHeader>
                <CardTitle>Generate Viral Prediction</CardTitle>
                <CardDescription>
                  Input template features to get AI-powered viral predictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-id">Template ID</Label>
                  <Input
                    id="template-id"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    placeholder="Enter template ID"
                  />
                </div>

                <div>
                  <Label>Platform</Label>
                  <Select value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as Platform)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Content Length</Label>
                  <Slider
                    value={[customFeatures.contentLength || 100]}
                    onValueChange={(value) => setCustomFeatures(prev => ({ ...prev, contentLength: value[0] }))}
                    max={300}
                    min={50}
                    step={10}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    {customFeatures.contentLength || 100} characters
                  </div>
                </div>

                <div>
                  <Label>Duration (seconds)</Label>
                  <Slider
                    value={[customFeatures.duration || 30]}
                    onValueChange={(value) => setCustomFeatures(prev => ({ ...prev, duration: value[0] }))}
                    max={300}
                    min={5}
                    step={5}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    {customFeatures.duration || 30} seconds
                  </div>
                </div>

                <div>
                  <Label>Audio BPM</Label>
                  <Slider
                    value={[customFeatures.bpm || 120]}
                    onValueChange={(value) => setCustomFeatures(prev => ({ ...prev, bpm: value[0] }))}
                    max={180}
                    min={60}
                    step={10}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    {customFeatures.bpm || 120} BPM
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="has-hook"
                      checked={customFeatures.hasHook || false}
                      onChange={(e) => setCustomFeatures(prev => ({ ...prev, hasHook: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="has-hook" className="text-sm">Has Hook</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="has-cta"
                      checked={customFeatures.hasCta || false}
                      onChange={(e) => setCustomFeatures(prev => ({ ...prev, hasCta: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="has-cta" className="text-sm">Has CTA</Label>
                  </div>
                </div>

                <Button onClick={generatePrediction} className="w-full" disabled={!selectedTemplate}>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Prediction
                </Button>
              </CardContent>
            </Card>

            {/* Prediction Result */}
            <Card>
              <CardHeader>
                <CardTitle>Prediction Result</CardTitle>
                <CardDescription>
                  AI analysis and viral potential assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {predictionResult ? (
                  <PredictionResultDisplay result={predictionResult} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generate a prediction to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Model Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Accuracy Over Time</CardTitle>
                <CardDescription>Prediction accuracy trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ModelAccuracyChart data={analysisData?.accuracyTrend || []} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Performance Comparison</CardTitle>
                <CardDescription>Model accuracy by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <PlatformAccuracyChart />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Prediction Distribution</CardTitle>
              <CardDescription>Distribution of viral scores across predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <PredictionDistributionChart />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Insights Tab */}
        <TabsContent value="trends" className="space-y-6">
          <TrendInsightsDashboard trendData={analysisData?.trendPredictions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Feature Importance Chart Component
function FeatureImportanceChart({ data }: { data: any[] }) {
  const mockData = data.length > 0 ? data : [
    { feature: 'Has Hook', importance: 25, category: 'content' },
    { feature: 'Niche Popularity', importance: 22, category: 'platform' },
    { feature: 'Duration', importance: 20, category: 'temporal' },
    { feature: 'Energy Level', importance: 18, category: 'audio' },
    { feature: 'Face Count', importance: 15, category: 'visual' }
  ];

  return (
    <div className="space-y-3">
      {mockData.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded ${
              item.category === 'content' ? 'bg-blue-500' :
              item.category === 'visual' ? 'bg-green-500' :
              item.category === 'audio' ? 'bg-yellow-500' :
              item.category === 'temporal' ? 'bg-purple-500' :
              'bg-gray-500'
            }`} />
            <span className="text-sm font-medium">{item.feature}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${item.importance}%` }}
              />
            </div>
            <span className="text-sm font-bold w-8">{item.importance}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Score Breakdown Chart Component
function ScoreBreakdownChart({ predictions }: { predictions: PredictionResult[] }) {
  const avgBreakdown = predictions.length > 0 ? {
    contentScore: predictions.reduce((sum, p) => sum + p.breakdown.contentScore, 0) / predictions.length,
    visualScore: predictions.reduce((sum, p) => sum + p.breakdown.visualScore, 0) / predictions.length,
    audioScore: predictions.reduce((sum, p) => sum + p.breakdown.audioScore, 0) / predictions.length,
    timingScore: predictions.reduce((sum, p) => sum + p.breakdown.timingScore, 0) / predictions.length,
    platformFitScore: predictions.reduce((sum, p) => sum + p.breakdown.platformFitScore, 0) / predictions.length,
    trendAlignmentScore: predictions.reduce((sum, p) => sum + p.breakdown.trendAlignmentScore, 0) / predictions.length
  } : {
    contentScore: 75,
    visualScore: 68,
    audioScore: 82,
    timingScore: 71,
    platformFitScore: 88,
    trendAlignmentScore: 65
  };

  const chartData = [
    { category: 'Content', score: Math.round(avgBreakdown.contentScore), fullMark: 100 },
    { category: 'Visual', score: Math.round(avgBreakdown.visualScore), fullMark: 100 },
    { category: 'Audio', score: Math.round(avgBreakdown.audioScore), fullMark: 100 },
    { category: 'Timing', score: Math.round(avgBreakdown.timingScore), fullMark: 100 },
    { category: 'Platform Fit', score: Math.round(avgBreakdown.platformFitScore), fullMark: 100 },
    { category: 'Trend Align', score: Math.round(avgBreakdown.trendAlignmentScore), fullMark: 100 }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="category" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Prediction Result Display Component
function PredictionResultDisplay({ result }: { result: PredictionResult }) {
  return (
    <div className="space-y-6">
      {/* Main Score */}
      <div className="text-center">
        <div className="text-4xl font-bold text-purple-600 mb-2">
          {result.predictedScore}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          Viral Score ({result.confidence}% confidence)
        </div>
        <Progress value={result.predictedScore} className="w-full" />
      </div>

      {/* Predictions */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-lg font-semibold">
            {result.predictions.views.realistic.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Expected Views</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">
            {result.predictions.viralProbability}%
          </div>
          <div className="text-xs text-gray-600">Viral Chance</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">
            {result.predictions.timeToViralPeak}h
          </div>
          <div className="text-xs text-gray-600">Time to Peak</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Score Breakdown</h4>
        {Object.entries(result.breakdown).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-sm capitalize">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full bg-purple-600"
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-sm font-medium w-8">{Math.round(value)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Recommendations
        </h4>
        <div className="space-y-1">
          {result.recommendations.map((rec, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {rec}
            </div>
          ))}
        </div>
      </div>

      {/* Risks */}
      {result.risks.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Risk Factors
          </h4>
          <div className="space-y-1">
            {result.risks.map((risk, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-3 w-3" />
                {risk}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Model Accuracy Chart Component
function ModelAccuracyChart({ data }: { data: any[] }) {
  const mockData = data.length > 0 ? data : [
    { date: '2024-01-01', accuracy: 78.5, predictions: 245 },
    { date: '2024-01-02', accuracy: 82.1, predictions: 312 },
    { date: '2024-01-03', accuracy: 85.3, predictions: 289 },
    { date: '2024-01-04', accuracy: 83.7, predictions: 356 },
    { date: '2024-01-05', accuracy: 86.2, predictions: 298 },
    { date: '2024-01-06', accuracy: 88.1, predictions: 445 },
    { date: '2024-01-07', accuracy: 85.9, predictions: 398 }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mockData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[70, 95]} />
        <Tooltip />
        <Line type="monotone" dataKey="accuracy" stroke="#8B5CF6" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Platform Accuracy Chart Component
function PlatformAccuracyChart() {
  const platformData = [
    { platform: 'Instagram', accuracy: 85.2 },
    { platform: 'TikTok', accuracy: 88.1 },
    { platform: 'LinkedIn', accuracy: 76.3 },
    { platform: 'Twitter', accuracy: 81.7 },
    { platform: 'Facebook', accuracy: 79.5 },
    { platform: 'YouTube', accuracy: 83.9 }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={platformData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="platform" />
        <YAxis domain={[70, 95]} />
        <Tooltip />
        <Bar dataKey="accuracy" fill="#8B5CF6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Prediction Distribution Chart Component
function PredictionDistributionChart() {
  const distributionData = [
    { range: '0-20', count: 45, percentage: 3.6 },
    { range: '21-40', count: 123, percentage: 9.8 },
    { range: '41-60', count: 298, percentage: 23.9 },
    { range: '61-80', count: 467, percentage: 37.5 },
    { range: '81-100', count: 314, percentage: 25.2 }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={distributionData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Trend Insights Dashboard Component
function TrendInsightsDashboard({ trendData }: { trendData: any }) {
  const mockTrendData = trendData || {
    trendBoost: 25.5,
    optimalTiming: ['7-9 PM', '11 AM-1 PM'],
    competitorActivity: 0.65,
    recommendations: [
      'Incorporate trending hashtags #productivity #viral',
      'Post during identified peak hours',
      'Consider trending audio tracks'
    ],
    riskFactors: [
      'Moderate competitor activity in this time slot'
    ]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Trend Boost Potential</span>
            <Badge variant="outline" className="text-green-600 border-green-600">
              +{mockTrendData.trendBoost}%
            </Badge>
          </div>
          
          <div>
            <span className="text-sm font-medium">Optimal Posting Times</span>
            <div className="mt-2 space-y-1">
              {mockTrendData.optimalTiming.map((time: string, index: number) => (
                <Badge key={index} variant="secondary" className="mr-2">
                  <Clock className="h-3 w-3 mr-1" />
                  {time}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium">Competitor Activity</span>
            <div className="mt-2">
              <Progress value={mockTrendData.competitorActivity * 100} className="h-2" />
              <div className="text-xs text-gray-600 mt-1">
                {Math.round(mockTrendData.competitorActivity * 100)}% activity level
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Actionable Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-green-500" />
              Recommendations
            </h4>
            <div className="space-y-1">
              {mockTrendData.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                  {rec}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Risk Factors
            </h4>
            <div className="space-y-1">
              {mockTrendData.riskFactors.map((risk: string, index: number) => (
                <div key={index} className="flex items-start gap-2 text-sm text-amber-600">
                  <Info className="h-3 w-3 mt-0.5" />
                  {risk}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}