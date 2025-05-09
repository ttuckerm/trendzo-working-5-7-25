'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart2, Filter, RefreshCw, Save, Sliders } from 'lucide-react';
import { 
  Button, 
  Card,
  Label,
  Switch,
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem,
  Slider,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/ui-compatibility';
import { useToast } from '@/components/ui/use-toast';
import { TrendPrediction } from '@/lib/types/trendingTemplate';

export default function AdvancedTrendPredictionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Filter states
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.8);
  const [timeWindow, setTimeWindow] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [growthPatterns, setGrowthPatterns] = useState<string[]>(['exponential', 'linear', 'plateauing', 'volatile']);
  const [selectedGrowthPatterns, setSelectedGrowthPatterns] = useState<string[]>([]);
  const [audienceFilters, setAudienceFilters] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  
  // Analytics states
  const [isLoading, setIsLoading] = useState(true);
  const [predictions, setPredictions] = useState<TrendPrediction[]>([]);
  const [analyticsView, setAnalyticsView] = useState<'summary' | 'detailed'>('summary');
  
  useEffect(() => {
    // Fetch initial data
    fetchCategories();
    fetchAudienceTypes();
    fetchPredictions();
  }, []);
  
  // Fetch available categories
  const fetchCategories = async () => {
    // Mock data for development
    const mockCategories = [
      'Product', 'Dance', 'Music', 'Fashion', 'Beauty', 
      'Tech', 'Food', 'Fitness', 'Education', 'Entertainment'
    ];
    setCategories(mockCategories);
  };
  
  // Fetch audience types
  const fetchAudienceTypes = async () => {
    // Mock data for development
    const mockAudiences = [
      'Gen Z', 'Millennials', 'Gen X', 'Boomers',
      'Students', 'Professionals', 'Creators', 'Businesses'
    ];
    setAudienceFilters(mockAudiences);
  };
  
  // Fetch predictions with current filters
  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const mockPredictions = getMockTrendPredictions();
      setPredictions(mockPredictions);
      
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch predictions. Please try again.',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply filters
  const applyFilters = async () => {
    setIsLoading(true);
    try {
      // Mock API call with filters
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Filters Applied',
        description: 'Predictions have been updated with your filters.',
        duration: 3000
      });
      
      // Refetch predictions
      await fetchPredictions();
      
    } catch (error) {
      console.error('Error applying filters:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply filters. Please try again.',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setConfidenceThreshold(0.8);
    setTimeWindow('all');
    setSelectedCategories([]);
    setSelectedGrowthPatterns([]);
    setSelectedAudiences([]);
    
    toast({
      title: 'Filters Reset',
      description: 'All filters have been reset to default values.',
      duration: 3000
    });
  };

  const handleAnalyticsViewChange = (value: string) => {
    setAnalyticsView(value as 'summary' | 'detailed');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Advanced Trend Analysis</h1>
            <p className="text-gray-500">Configure detailed filters and view in-depth analytics</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={resetFilters}
            className="border-gray-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={applyFilters}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Filters Panel */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-gray-500" />
                  Filter Controls
                </h2>
                
                {/* Confidence Threshold */}
                <div className="space-y-4">
                  <Label>Confidence Threshold</Label>
                  <Slider
                    value={[confidenceThreshold]}
                    onValueChange={([value]) => setConfidenceThreshold(value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500">
                    Minimum confidence score: {confidenceThreshold}
                  </div>
                </div>
                
                {/* Time Window */}
                <div className="space-y-2 mt-6">
                  <Label>Time Window</Label>
                  <Select value={timeWindow} onValueChange={setTimeWindow}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time window" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Categories */}
                <div className="space-y-2 mt-6">
                  <Label>Content Categories</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Switch
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, category]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== category));
                            }
                          }}
                        />
                        <span className="text-sm">{category}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Growth Patterns */}
                <div className="space-y-2 mt-6">
                  <Label>Growth Patterns</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {growthPatterns.map((pattern) => (
                      <div key={pattern} className="flex items-center space-x-2">
                        <Switch
                          checked={selectedGrowthPatterns.includes(pattern)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedGrowthPatterns([...selectedGrowthPatterns, pattern]);
                            } else {
                              setSelectedGrowthPatterns(selectedGrowthPatterns.filter(p => p !== pattern));
                            }
                          }}
                        />
                        <span className="text-sm capitalize">{pattern}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Target Audience */}
                <div className="space-y-2 mt-6">
                  <Label>Target Audience</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {audienceFilters.map((audience) => (
                      <div key={audience} className="flex items-center space-x-2">
                        <Switch
                          checked={selectedAudiences.includes(audience)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAudiences([...selectedAudiences, audience]);
                            } else {
                              setSelectedAudiences(selectedAudiences.filter(a => a !== audience));
                            }
                          }}
                        />
                        <span className="text-sm">{audience}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Analytics Panel */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-gray-500" />
                  Analytics Overview
                </h2>
                
                <Tabs value={analyticsView} onValueChange={handleAnalyticsViewChange}>
                  <TabsList>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Analytics Cards */}
                <Card className="p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500">Filtered Predictions</h3>
                  <p className="text-2xl font-bold mt-1">{predictions.length}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    From {timeWindow === 'all' ? 'all time' : `last ${timeWindow}`}
                  </div>
                </Card>
                
                <Card className="p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500">Average Confidence</h3>
                  <p className="text-2xl font-bold mt-1">
                    {predictions.length > 0
                      ? Math.round(predictions.reduce((acc, curr) => acc + curr.confidenceScore, 0) / predictions.length * 100)
                      : 0}%
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    Threshold: {Math.round(confidenceThreshold * 100)}%
                  </div>
                </Card>
                
                <Card className="p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500">Top Category</h3>
                  <p className="text-2xl font-bold mt-1">
                    {predictions.length > 0
                      ? predictions.reduce((acc, curr) => {
                          const count = predictions.filter(p => p.contentCategory === curr.contentCategory).length;
                          return count > acc.count ? { category: curr.contentCategory, count } : acc;
                        }, { category: '', count: 0 }).category
                      : 'N/A'}
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    Based on current filters
                  </div>
                </Card>
                
                <Card className="p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500">Avg. Time to Peak</h3>
                  <p className="text-2xl font-bold mt-1">
                    {predictions.length > 0
                      ? Math.round(predictions.reduce((acc, curr) => acc + curr.daysUntilPeak, 0) / predictions.length)
                      : 0} days
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    Across all predictions
                  </div>
                </Card>
              </div>
              
              {/* Detailed Analytics */}
              <TabsContent value="detailed">
                <div className="mt-6 space-y-6">
                  <Card className="p-4 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Category Distribution</h3>
                    <div className="space-y-2">
                      {categories.map(category => {
                        const count = predictions.filter(p => p.contentCategory === category).length;
                        const percentage = predictions.length > 0 ? (count / predictions.length) * 100 : 0;
                        
                        return (
                          <div key={category} className="flex items-center space-x-2">
                            <div className="w-32 text-sm">{category}</div>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-16 text-sm text-right">{Math.round(percentage)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                  
                  <Card className="p-4 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Growth Pattern Analysis</h3>
                    <div className="space-y-2">
                      {growthPatterns.map(pattern => {
                        const count = predictions.filter(p => p.growthTrajectory === pattern).length;
                        const percentage = predictions.length > 0 ? (count / predictions.length) * 100 : 0;
                        
                        return (
                          <div key={pattern} className="flex items-center space-x-2">
                            <div className="w-32 text-sm capitalize">{pattern}</div>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-16 text-sm text-right">{Math.round(percentage)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                  
                  <Card className="p-4 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Audience Insights</h3>
                    <div className="space-y-2">
                      {audienceFilters.map(audience => {
                        const count = predictions.filter(p => p.targetAudience.includes(audience)).length;
                        const percentage = predictions.length > 0 ? (count / predictions.length) * 100 : 0;
                        
                        return (
                          <div key={audience} className="flex items-center space-x-2">
                            <div className="w-32 text-sm">{audience}</div>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-16 text-sm text-right">{Math.round(percentage)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Mock data for development
function getMockTrendPredictions(): TrendPrediction[] {
  return [
    {
      templateId: '1',
      template: {
        id: '1',
        title: 'Product Showcase with Zoom Transitions',
        description: 'Highlight product features with smooth zoom transitions and text overlays.',
        thumbnailUrl: 'https://placehold.co/600x800/7950f2/ffffff?text=Product+Template'
      },
      contentCategory: 'Product',
      confidenceScore: 0.87,
      growthTrajectory: 'exponential',
      daysUntilPeak: 14,
      targetAudience: ['Gen Z', 'Millennials', 'E-commerce'],
      velocityPatterns: {
        pattern: 'rapid',
        timeWindow: '2 weeks'
      },
      predictedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      expertAdjusted: false
    },
    {
      templateId: '2',
      template: {
        id: '2',
        title: 'Dancing Tutorial Template',
        description: 'Step-by-step dance tutorial with synchronized music and visual cues.',
        thumbnailUrl: 'https://placehold.co/600x800/ff6b6b/ffffff?text=Dance+Template'
      },
      contentCategory: 'Dance',
      confidenceScore: 0.92,
      growthTrajectory: 'linear',
      daysUntilPeak: 21,
      targetAudience: ['Dance Enthusiasts', 'Gen Z', 'Fitness'],
      velocityPatterns: {
        pattern: 'steady',
        timeWindow: '3 weeks'
      },
      predictedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      expertAdjusted: true
    }
  ];
} 