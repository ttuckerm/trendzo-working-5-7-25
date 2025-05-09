'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, BarChart2, FilterIcon, Plus, Sliders, TrendingUp, UserCog, CheckCircle, ChevronDown, ChevronUp, Info, Brain, LineChart, X, HelpCircle, Music, Volume2 } from 'lucide-react';
import { TrendPredictionCard } from '@/components/templates/TrendPredictionCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/ui-compatibility';
import { Card, CardContent } from '@/components/ui/unified-card';
import { Label } from '@/components/ui/ui-compatibility';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem, 
  Tooltip, 
  TooltipContent, 
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/ui-compatibility';
import LoadingFallback from '@/components/ui/LoadingFallback';
import { useAuth } from '@/lib/hooks/useAuth';
import { TrendPrediction } from '@/lib/types/trendingTemplate';
import { useToast } from '@/components/ui/use-toast';
import { resolveComponents, initializeComponentResolution } from '@/lib/utils/import-resolver';
import { useComponentFix } from '@/lib/utils/component-fix';
import ImportedExpertDashboard from '@/components/experts/SimpleExpertPerformanceDashboard';
import { useAudio } from '@/lib/contexts/AudioContext';
import SoundCard from '@/components/audio/SoundCard';

// Initialize component resolution
if (typeof window !== 'undefined') {
  initializeComponentResolution();
}

// Resolve UI components to ensure they work correctly
const UIComponents = resolveComponents({
  Badge, 
  Button, 
  Card, 
  Label, 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem,
  Switch, 
  Tooltip, 
  TooltipContent, 
  TooltipProvider,
  TooltipTrigger 
});

// Mock session hook for development mode
const useMockSession = () => {
  return {
    data: {
      user: {
        id: 'dev-user-id',
        name: 'Developer',
        email: 'dev@example.com'
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    status: 'authenticated'
  };
};

export default function TrendPredictionsDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Start with loading false to show content immediately
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<TrendPrediction[]>(getMockTrendPredictions()); // Initialize with mock data immediately
  const [filter, setFilter] = useState('all');
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'enterprise'>('enterprise'); // Default to enterprise to show all features
  
  // Use mock session in development
  const session = useMockSession();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Add state for expert mode and verification status
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [expertVerificationInProgress, setExpertVerificationInProgress] = useState<string | null>(null);
  
  // Add state for expert dashboard
  const [showExpertDashboard, setShowExpertDashboard] = useState(false);
  
  // Add state for ML feature banner
  const [showMLFeatureBanner, setShowMLFeatureBanner] = useState(true);
  
  // Add state for sound filter and trending sounds
  const [soundFilter, setSoundFilter] = useState('all');
  const [trendingSounds, setTrendingSounds] = useState<any[]>([]);
  const { toggle } = useAudio();
  
  // Destructure UI components for usage
  const { 
    Badge, 
    Button, 
    Card, 
    Tooltip, 
    TooltipProvider, 
    TooltipContent,
    TooltipTrigger 
  } = UIComponents;
  
  useEffect(() => {
    // Add component fix for error handling
    const componentFixCleanup = useComponentFix();
    
    // Fetch the user's subscription tier
    fetchUserTier();
    
    // Fetch trending sounds
    fetchTrendingSounds();
    
    // Return cleanup function
    return () => {
      if (typeof componentFixCleanup === 'function') {
        componentFixCleanup();
      }
    };
  }, []);

  // Fetch user's subscription tier
  const fetchUserTier = async () => {
    try {
      // For development, we'll skip API call and use a mock response
      // We'll just set it to enterprise to show all features
      setUserTier('enterprise');
    } catch (error) {
      console.error("Error fetching user tier:", error);
      setUserTier('enterprise'); // Default to enterprise on error to ensure UI loads
    }
  };

  // Fetch trending sounds
  const fetchTrendingSounds = async () => {
    try {
      // For development, we'll use mock sound data
      setTrendingSounds(getMockTrendingSounds());
    } catch (error) {
      console.error("Error fetching trending sounds:", error);
    }
  };

  // Handle expert verification
  const handleExpertVerification = async (predictionId: string, isAccurate: boolean) => {
    try {
      setExpertVerificationInProgress(predictionId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: isAccurate ? "Prediction Verified" : "Prediction Marked as Inaccurate",
        description: `Thank you for your expert input. This helps improve our prediction algorithm.`,
        duration: 3000
      });
      
    } catch (error) {
      console.error("Error during expert verification:", error);
      toast({
        title: "Verification Failed",
        description: "There was an error processing your verification. Please try again.",
        duration: 3000
      });
    } finally {
      setExpertVerificationInProgress(null);
    }
  };

  // Skip the loading spinner to avoid flash
  // Filter predictions based on selected filter
  const filteredPredictions = predictions.filter(prediction => {
    if (filter === 'all') return true;
    return prediction.contentCategory.toLowerCase() === filter.toLowerCase();
  });

  // Main UI render
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ML Features Banner */}
      {showMLFeatureBanner && userTier === 'enterprise' && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4 relative">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-4">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">New: Machine Learning Insights</h3>
              <p className="text-gray-600 mb-2">
                Our ML system now analyzes expert adjustments to provide better predictions. 
                See patterns across content categories and get suggestions for improvement.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => setShowMLFeatureBanner(false)}
                >
                  Dismiss
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => router.push('/dashboard-view/trend-predictions-dashboard/advanced/intro')}
                >
                  Learn More
                </Button>
              </div>
            </div>
            <button 
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowMLFeatureBanner(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Expert Dashboard Promotion */}
      {userTier === 'enterprise' && (
        <div className="mb-6 bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-full p-2 mr-4">
                <UserCog className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Enhanced Expert Dashboard</h3>
                <p className="text-gray-600">
                  See how your expert adjustments are improving ML prediction accuracy.
                  Configure ML feedback settings to optimize suggestions.
                </p>
              </div>
            </div>
            <Button
              variant="default"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => router.push('/dashboard-view/trend-predictions-dashboard/expert-simple')}
            >
              Open Expert Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trend Predictions</h1>
          <p className="text-gray-500 mt-1">
            Discover emerging content trends before they peak
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">Filter by:</span>
            <Select 
              value={filter} 
              onValueChange={setFilter}
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="dance">Dance</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            {userTier === 'enterprise' && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="expert-mode" 
                  checked={isExpertMode}
                  onCheckedChange={setIsExpertMode}
                />
                <Label htmlFor="expert-mode" className="text-sm text-gray-600 cursor-pointer">
                  Expert Mode
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Expert mode allows you to verify and adjust predictions, helping improve our ML system.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Dashboard Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button 
          variant="default" 
          className="bg-blue-600 hover:bg-blue-700" 
          onClick={() => router.push('/dashboard-view/trend-predictions-dashboard/export')}
        >
          <BarChart2 className="h-4 w-4 mr-2" />
          Export Predictions
        </Button>
        
        {userTier === 'enterprise' && (
          <Button 
            variant="outline" 
            className="border-purple-200 text-purple-700 hover:bg-purple-50" 
            onClick={() => setShowExpertDashboard(!showExpertDashboard)}
          >
            <UserCog className="h-4 w-4 mr-2" />
            {showExpertDashboard ? 'Hide Expert Dashboard' : 'Show Expert Dashboard'}
          </Button>
        )}
        
        <Button 
          variant="outline" 
          className="border-green-200 text-green-700 hover:bg-green-50" 
          onClick={() => router.push('/dashboard-view/trend-predictions-dashboard/create')}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Prediction
        </Button>
        
        {/* Additional buttons for Step 6 completion */}
        {userTier === 'enterprise' && (
          <>
            <Button 
              variant="outline" 
              className="border-blue-200 text-blue-700 hover:bg-blue-50" 
              onClick={() => router.push('/dashboard-view/trend-predictions-dashboard/detection-settings')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Detection Settings
            </Button>
            
            <Button 
              variant="outline" 
              className="border-amber-200 text-amber-700 hover:bg-amber-50" 
              onClick={() => router.push('/dashboard-view/trend-predictions-dashboard/notifications')}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Notification Settings
            </Button>
            
            <Button 
              variant="outline" 
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" 
              onClick={() => router.push('/dashboard-view/trend-predictions-dashboard/accuracy')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Prediction Accuracy
            </Button>
            
            <Button 
              variant="outline" 
              className="border-teal-200 text-teal-700 hover:bg-teal-50" 
              onClick={() => router.push('/dashboard-view/trend-predictions-dashboard/growth-patterns')}
            >
              <LineChart className="h-4 w-4 mr-2" />
              Growth Patterns
            </Button>
            
            <Button 
              variant="outline" 
              className="border-blue-200 text-blue-700 hover:bg-blue-50" 
              onClick={() => router.push('/dashboard-view/trend-predictions-dashboard/advanced')}
            >
              <Sliders className="h-4 w-4 mr-2" />
              Advanced Analytics
            </Button>
          </>
        )}
      </div>
      
      {/* Expert Dashboard - Only shown when toggle is on */}
      {showExpertDashboard && userTier === 'enterprise' && (
        <div className="mb-8">
          <Card className="border-purple-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <UserCog className="h-5 w-5 mr-2 text-purple-600" />
                Expert Performance Dashboard
              </h3>
              <ImportedExpertDashboard />
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* ML Analytics Dashboard - Only shown for enterprise users */}
      {userTier === 'enterprise' && (
        <div className="mb-8">
          <Card className="border-blue-100">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-600" />
                  ML-Enhanced Analytics
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Info className="h-4 w-4 text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        This analytics section is powered by our machine learning system, 
                        which analyzes expert adjustments and content performance patterns.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-blue-100 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-500">ML Pattern Confidence</div>
                    <Badge className="bg-green-100 text-green-800">High</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">92%</div>
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    <span>+7% from last month</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-blue-100 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-500">Expert-ML Agreement</div>
                    <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">84%</div>
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    <span>+12% from last month</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-blue-100 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-500">Active ML Suggestions</div>
                    <Badge className="bg-amber-100 text-amber-800">8 New</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">23</div>
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    <span>Across all predictions</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <BarChart2 className="h-4 w-4 mr-1 text-blue-600" />
                  ML Adjustment Impact by Category
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Product</span>
                      <span className="text-sm font-medium">+18%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Fashion</span>
                      <span className="text-sm font-medium">+23%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '93%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Dance</span>
                      <span className="text-sm font-medium">+12%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Display when no predictions match filter */}
      {filteredPredictions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <FilterIcon className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No matching predictions</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            There are no predictions that match your current filter. Try selecting a different category or check back later.
          </p>
          <Button variant="outline" onClick={() => setFilter('all')}>
            Clear Filter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPredictions.map((prediction) => (
            <div key={prediction.templateId} className="flex flex-col">
              <TrendPredictionCard 
                prediction={prediction} 
              />
              
              {/* Expert Verification Controls */}
              {isExpertMode && userTier === 'enterprise' && (
                <div className="mt-2 flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300"
                    onClick={() => handleExpertVerification(prediction.templateId, true)}
                    disabled={expertVerificationInProgress === prediction.templateId}
                  >
                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                    Verify Accurate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300"
                    onClick={() => handleExpertVerification(prediction.templateId, false)}
                    disabled={expertVerificationInProgress === prediction.templateId}
                  >
                    <AlertCircle className="h-4 w-4 mr-1 text-red-600" />
                    Mark Inaccurate
                  </Button>
                </div>
              )}
              
              {/* ML Suggestions Button - Only for enterprise users */}
              {userTier === 'enterprise' && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-blue-700"
                    onClick={() => router.push(`/dashboard-view/trend-predictions-dashboard/advanced/${prediction.templateId}`)}
                  >
                    <Brain className="h-4 w-4 mr-1 text-blue-600" />
                    ML Insights & Suggestions
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADDED: Velocity Score Legend */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Understanding Velocity Scores
        </h3>
        <p className="text-sm text-blue-700 mb-4">
          Velocity scores (0-10) measure how rapidly a template is trending relative to others. Higher scores indicate faster growth and viral potential.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              0-3
            </div>
            <span className="ml-2 text-sm text-blue-700">Low Growth</span>
          </div>
          <div className="flex items-center">
            <div className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              3-5
            </div>
            <span className="ml-2 text-sm text-green-700">Moderate Growth</span>
          </div>
          <div className="flex items-center">
            <div className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              5-7
            </div>
            <span className="ml-2 text-sm text-amber-700">High Growth</span>
          </div>
          <div className="flex items-center">
            <div className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              7-10
            </div>
            <span className="ml-2 text-sm text-red-700">Viral Growth</span>
          </div>
        </div>
      </div>

      {/* Sound Trends Section - NEW */}
      <section className="mt-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <Music className="h-5 w-5 mr-2 text-purple-600" />
              Sound Trend Predictions
            </h2>
            <p className="text-sm text-muted-foreground">
              Early adoption of trending sounds can increase engagement by up to 35%
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mt-2 md:mt-0">
            <Select 
              value={soundFilter}
              onValueChange={setSoundFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="emerging">Emerging</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="declining">Declining</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard-view/sound-predictions">
                View All <ChevronUp className="ml-1 h-4 w-4 rotate-90" />
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingSounds.map((sound) => (
            <Card key={sound.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className={
                        sound.predictionStatus === 'emerging' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                        sound.predictionStatus === 'trending' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' :
                        sound.predictionStatus === 'stable' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                        'bg-orange-100 text-orange-800 hover:bg-orange-100'
                      }>
                        {sound.predictionStatus}
                      </Badge>
                      <h3 className="text-lg font-medium mt-2">{sound.title}</h3>
                      <p className="text-sm text-muted-foreground">{sound.artist}</p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"
                              onClick={() => toggle(sound)}>
                        <Volume2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        <span>
                          Growth: <span className="font-medium">{sound.growthRate}%</span>
                        </span>
                      </div>
                      <div className="text-sm">
                        Confidence: <span className="font-medium">{sound.confidence}%</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Predicted to {sound.predictionStatus === 'declining' ? 'decline' : 'peak'} in {sound.peakTimeframe}</p>
                    </div>
                  </div>
                </div>
                
                {isExpertMode && (
                  <div className="bg-gray-50 p-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Expert Verification:</span>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => handleExpertVerification(sound.id, true)}
                          disabled={!!expertVerificationInProgress}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Accurate
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleExpertVerification(sound.id, false)}
                          disabled={!!expertVerificationInProgress}
                        >
                          <X className="h-3 w-3 mr-1" /> Inaccurate
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
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

// Mock Trending Sounds Data
function getMockTrendingSounds() {
  return [
    {
      id: 'sound-1',
      title: 'Summer Beach Vibes',
      artist: 'Coastal Dreams',
      growthRate: 42,
      confidence: 87,
      predictionStatus: 'emerging',
      peakTimeframe: '2-3 weeks',
      playUrl: '/sounds/sample-1.mp3'
    },
    {
      id: 'sound-2',
      title: 'Lo-Fi Study Beat',
      artist: 'Chill Hop Master',
      growthRate: 28,
      confidence: 92,
      predictionStatus: 'trending',
      peakTimeframe: '4-6 weeks',
      playUrl: '/sounds/sample-2.mp3'
    },
    {
      id: 'sound-3',
      title: 'Epic Cinematic Rise',
      artist: 'Film Score Studios',
      growthRate: 15,
      confidence: 76,
      predictionStatus: 'stable',
      peakTimeframe: '8-10 weeks',
      playUrl: '/sounds/sample-3.mp3'
    },
    {
      id: 'sound-4',
      title: 'Electric Dance Pop',
      artist: 'Beat Factory',
      growthRate: -8,
      confidence: 81,
      predictionStatus: 'declining',
      peakTimeframe: '1-2 weeks',
      playUrl: '/sounds/sample-4.mp3'
    },
    {
      id: 'sound-5',
      title: 'Viral TikTok Sound 2023',
      artist: 'Social Media Stars',
      growthRate: 65,
      confidence: 94,
      predictionStatus: 'emerging',
      peakTimeframe: '1-2 weeks',
      playUrl: '/sounds/sample-5.mp3'
    },
    {
      id: 'sound-6',
      title: 'Motivational Speech Background',
      artist: 'Inspire Productions',
      growthRate: 32,
      confidence: 88,
      predictionStatus: 'trending',
      peakTimeframe: '3-4 weeks',
      playUrl: '/sounds/sample-6.mp3'
    }
  ];
} 