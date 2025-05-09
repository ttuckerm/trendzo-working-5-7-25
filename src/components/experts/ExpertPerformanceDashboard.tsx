'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Expert, ExpertSpecializationArea } from '@/lib/types/expert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/ui-tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/ui-button';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { expertPerformanceService } from '@/lib/services/expertPerformanceService';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, Award, BarChart3, CheckCircle, Clock, Star, TrendingUp, Users } from 'lucide-react';

// Mock data for testing
const MOCK_EXPERT: Expert = {
  id: 'expert-123',
  userId: 'user-123',
  name: 'Jane Expert',
  email: 'jane@expert.com',
  bio: 'Experienced content strategist with 10+ years in digital marketing',
  avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  joinedAt: '2023-01-15T12:00:00Z',
  isActive: true,
  specializations: ['content', 'audience', 'growth'],
  expertiseLevel: 'senior',
  verificationStatus: 'verified',
  metrics: {
    totalAdjustments: 124,
    successfulAdjustments: 98,
    reliabilityScore: 79.03,
    averageImpactScore: 23.5,
    lastActivity: new Date().toISOString(),
    activityFrequency: 8.2,
    categoryPerformance: {
      'content': {
        totalAdjustments: 68,
        successfulAdjustments: 59,
        reliabilityScore: 86.76,
        averageImpactScore: 28.4,
        lastUpdated: new Date().toISOString()
      },
      'audience': {
        totalAdjustments: 42,
        successfulAdjustments: 31,
        reliabilityScore: 73.81,
        averageImpactScore: 19.2,
        lastUpdated: new Date().toISOString()
      },
      'growth': {
        totalAdjustments: 14,
        successfulAdjustments: 8,
        reliabilityScore: 57.14,
        averageImpactScore: 12.7,
        lastUpdated: new Date().toISOString()
      }
    },
    reliabilityTrend: {
      '2023-09-01': 72.5,
      '2023-09-15': 74.8,
      '2023-10-01': 75.1,
      '2023-10-15': 76.4,
      '2023-11-01': 77.8,
      '2023-11-15': 78.3,
      '2023-12-01': 79.03
    },
    updatedAt: new Date().toISOString()
  },
  specializationAreas: [
    {
      id: 'spec-1',
      name: 'Content Strategy',
      description: 'Optimizing content for engagement and conversion',
      reliabilityScore: 86.76,
      adjustmentCount: 68,
      tags: ['content', 'strategy', 'optimization'],
      confidenceLevel: 0.9,
      verifiedBy: 'system',
      verifiedAt: '2023-11-28T10:15:00Z',
      createdAt: '2023-01-20T09:00:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'spec-2',
      name: 'Audience Targeting',
      description: 'Identifying and targeting high-value audience segments',
      reliabilityScore: 73.81,
      adjustmentCount: 42,
      tags: ['audience', 'targeting', 'segments'],
      confidenceLevel: 0.8,
      createdAt: '2023-02-15T11:30:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'spec-3',
      name: 'Growth Metrics',
      description: 'Analyzing growth patterns and velocity',
      reliabilityScore: 57.14,
      adjustmentCount: 14,
      tags: ['growth', 'metrics', 'velocity'],
      confidenceLevel: 0.7,
      createdAt: '2023-04-10T14:20:00Z',
      updatedAt: new Date().toISOString()
    }
  ],
  recentActivity: [
    {
      id: 'activity-1',
      expertId: 'expert-123',
      type: 'adjustment',
      description: 'Adjusted growth rate from 4.2 to 5.7 (content)',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      templateId: 'template-456',
      templateTitle: 'Viral Marketing Template',
      category: 'content',
      impactScore: 18.5,
      metadata: {
        adjustmentId: 'adj-123',
        field: 'growthRate',
        reason: 'Recent performance data suggests higher growth potential',
        confidence: 0.85
      }
    },
    {
      id: 'activity-2',
      expertId: 'expert-123',
      type: 'verification',
      description: 'Adjustment verification: accurate (21% improvement)',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      category: 'audience',
      impactScore: 21.2,
      metadata: {
        verificationId: 'verif-456',
        adjustmentId: 'adj-456',
        templateId: 'template-789',
        isAccurate: true
      }
    },
    {
      id: 'activity-3',
      expertId: 'expert-123',
      type: 'review',
      description: 'Reviewed and approved template prediction model',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      templateId: 'template-101',
      templateTitle: 'B2B Lead Generation Template',
      category: 'content'
    }
  ]
};

interface ExpertPerformanceDashboardProps {
  expertId?: string; // Optional: if not provided, use the current logged-in expert
}

export default function ExpertPerformanceDashboard({ expertId }: ExpertPerformanceDashboardProps) {
  const { user } = useAuth();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function loadExpertData() {
      try {
        setLoading(true);
        
        // For demonstration purposes, use mock data instead of making a real API call
        // In a real environment, we would use the service to fetch data
        setTimeout(() => {
          setExpert(MOCK_EXPERT);
          setLoading(false);
        }, 1000);
        
        // The original code would be:
        // let targetExpertId = expertId;
        // if (!targetExpertId && user?.uid) {
        //   targetExpertId = user.uid;
        // }
        // if (!targetExpertId) {
        //   setError('No expert ID available');
        //   return;
        // }
        // const expertData = await expertPerformanceService.getExpertProfile(targetExpertId);
        // if (expertData) {
        //   setExpert(expertData);
        // } else {
        //   setError('Expert not found');
        // }
      } catch (err) {
        setError('Failed to load expert data');
        console.error('Error loading expert data:', err);
        setLoading(false);
      }
    }
    
    loadExpertData();
  }, [expertId, user]);

  // Generate chart data from reliability trend
  const getReliabilityTrendData = () => {
    if (!expert?.metrics?.reliabilityTrend) return [];
    
    return Object.entries(expert.metrics.reliabilityTrend)
      .map(([date, score]) => ({ date, score }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10); // Get only the last 10 entries
  };
  
  // Generate category performance data
  const getCategoryPerformanceData = () => {
    if (!expert?.metrics?.categoryPerformance) return [];
    
    return Object.entries(expert.metrics.categoryPerformance)
      .map(([category, performance]) => ({
        category,
        reliability: performance.reliabilityScore,
        impact: performance.averageImpactScore,
        adjustments: performance.totalAdjustments
      }))
      .sort((a, b) => b.reliability - a.reliability);
  };
  
  // Calculate specialization distribution for pie chart
  const getSpecializationDistribution = () => {
    if (!expert?.specializationAreas) return [];
    
    return expert.specializationAreas
      .filter(spec => spec.adjustmentCount > 0)
      .map(spec => ({
        name: spec.name,
        value: spec.adjustmentCount,
        reliability: spec.reliabilityScore
      }));
  };
  
  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a163f7'];
  
  if (loading) return <div className="p-8 text-center">Loading expert performance data...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!expert) return <div className="p-8 text-center">No expert data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">{expert.name}</h1>
          <p className="text-muted-foreground">{expert.expertiseLevel.charAt(0).toUpperCase() + expert.expertiseLevel.slice(1)} Expert</p>
        </div>
        <Badge 
          variant={expert.metrics.reliabilityScore >= 80 ? "default" : expert.metrics.reliabilityScore >= 60 ? "default" : "outline"} 
          className={`text-sm ${expert.metrics.reliabilityScore >= 80 ? 'bg-green-500' : expert.metrics.reliabilityScore >= 60 ? 'bg-amber-500' : ''}`}
        >
          Reliability Score: {expert.metrics.reliabilityScore.toFixed(1)}%
        </Badge>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="specializations">Specializations</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Reliability Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  <div className="text-2xl font-bold">{expert.metrics.reliabilityScore.toFixed(1)}%</div>
                  <Progress value={expert.metrics.reliabilityScore} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Based on {expert.metrics.totalAdjustments} total adjustments
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {expert.metrics.averageImpactScore.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Improvement over baseline predictions
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Positive impact</span>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Specialization</CardTitle>
              </CardHeader>
              <CardContent>
                {expert.specializationAreas.length > 0 ? (
                  <div>
                    <div className="text-xl font-bold">
                      {expert.specializationAreas.sort((a, b) => b.reliabilityScore - a.reliabilityScore)[0].name}
                    </div>
                    <div className="text-sm mt-1">
                      {expert.specializationAreas.sort((a, b) => b.reliabilityScore - a.reliabilityScore)[0].reliabilityScore.toFixed(1)}% reliability
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No specializations yet</div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Badge variant="outline" className="text-xs">
                  {expert.specializationAreas.length} specialization areas
                </Badge>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>
                Expert performance metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getCategoryPerformanceData().slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="reliability" name="Reliability Score" fill="#8884d8" />
                    <Bar dataKey="impact" name="Avg. Impact" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest expert adjustments and verifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expert.recentActivity && expert.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {expert.recentActivity.slice(0, 5).map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {activity.type === 'adjustment' && <ArrowUpRight className="h-4 w-4 text-blue-500" />}
                          {activity.type === 'verification' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {activity.type === 'review' && <Star className="h-4 w-4 text-amber-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {activity.category || 'General'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent activity recorded
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Specialization Distribution</CardTitle>
                <CardDescription>
                  Areas of expertise based on successful adjustments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getSpecializationDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getSpecializationDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [`${value} adjustments`, props.payload.name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="specializations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Expert Specialization Areas</CardTitle>
              <CardDescription>
                Performance metrics by area of expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expert.specializationAreas.length > 0 ? (
                <div className="space-y-6">
                  {expert.specializationAreas.map((spec, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{spec.name}</h3>
                          <p className="text-sm text-muted-foreground">{spec.description || 'No description available'}</p>
                        </div>
                        <Badge 
                          variant={spec.reliabilityScore >= 80 ? "default" : spec.reliabilityScore >= 60 ? "default" : "outline"}
                          className={spec.reliabilityScore >= 80 ? 'bg-green-500' : spec.reliabilityScore >= 60 ? 'bg-amber-500' : ''}
                        >
                          {spec.reliabilityScore.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="flex gap-1 flex-wrap">
                        {spec.tags.map((tag, tagIdx) => (
                          <Badge key={tagIdx} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Adjustments</div>
                          <div className="font-medium">{spec.adjustmentCount}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Confidence</div>
                          <div className="font-medium">{(spec.confidenceLevel * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Last Updated</div>
                          <div className="font-medium">{formatDistanceToNow(new Date(spec.updatedAt), { addSuffix: true })}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Status</div>
                          <div className="font-medium">{spec.verifiedBy ? 'Verified' : 'Pending'}</div>
                        </div>
                      </div>
                      
                      <Progress value={spec.reliabilityScore} className="h-2" />
                      
                      {idx < expert.specializationAreas.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No specialization areas defined yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="adjustments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Adjustment Performance by Category</CardTitle>
              <CardDescription>
                Reliability scores across different content categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(expert.metrics.categoryPerformance).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(expert.metrics.categoryPerformance)
                    .sort(([, a], [, b]) => b.totalAdjustments - a.totalAdjustments)
                    .map(([category, performance], idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium capitalize">{category}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{performance.totalAdjustments} adjustments</Badge>
                            <Badge 
                              variant={performance.reliabilityScore >= 80 ? "default" : performance.reliabilityScore >= 60 ? "default" : "outline"}
                              className={performance.reliabilityScore >= 80 ? 'bg-green-500' : performance.reliabilityScore >= 60 ? 'bg-amber-500' : ''}
                            >
                              {performance.reliabilityScore.toFixed(1)}% reliable
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Reliability Score</div>
                            <div className="mt-1">
                              <Progress value={performance.reliabilityScore} className="h-2" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Average Impact</div>
                            <div className="mt-1">
                              <Progress value={performance.averageImpactScore} max={100} className="h-2" />
                              <div className="text-xs mt-1">{performance.averageImpactScore.toFixed(1)}% improvement</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Last updated: {formatDistanceToNow(new Date(performance.lastUpdated), { addSuffix: true })}
                        </div>
                        
                        {idx < Object.keys(expert.metrics.categoryPerformance).length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No category performance data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Reliability Score Trends</CardTitle>
              <CardDescription>
                How your reliability has changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {expert.metrics.reliabilityTrend && Object.keys(expert.metrics.reliabilityTrend).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getReliabilityTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Reliability Score']} />
                      <Bar dataKey="score" fill="#8884d8" name="Reliability Score" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Not enough data to display reliability trends
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Expert Activity Frequency</CardTitle>
              <CardDescription>
                Summary of your adjustment frequency and impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Total Adjustments</div>
                  <div className="text-3xl font-bold">{expert.metrics.totalAdjustments}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Success Rate</div>
                  <div className="text-3xl font-bold">
                    {expert.metrics.totalAdjustments > 0 
                      ? ((expert.metrics.successfulAdjustments / expert.metrics.totalAdjustments) * 100).toFixed(1) 
                      : '0'}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Last Activity</div>
                  <div className="text-xl font-bold">
                    {expert.metrics.lastActivity 
                      ? formatDistanceToNow(new Date(expert.metrics.lastActivity), { addSuffix: true })
                      : 'Never'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Average: {expert.metrics.activityFrequency 
                    ? `${expert.metrics.activityFrequency.toFixed(1)} adjustments per week`
                    : 'Calculating...'}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Detailed Analytics
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 