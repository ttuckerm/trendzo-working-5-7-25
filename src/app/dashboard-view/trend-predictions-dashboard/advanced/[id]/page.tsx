'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  LineChart, 
  TrendingUp, 
  BarChart2, 
  Users, 
  Calendar, 
  AlertCircle, 
  Bot,
  UserCog,
  History,
  Brain,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useMLSuggestions } from '@/lib/hooks/useMLSuggestions';
import { TrendPrediction, ManualAdjustmentLog } from '@/lib/types/trendingTemplate';
import VelocityScoreIndicator from '@/components/ui/VelocityScoreIndicator';
import CoachPanel from './CoachPanel'

// Define the MLSuggestion interface to match what the component expects
interface MLSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  confidence: number;
  reason: string;
}

// Define the MLSuggestionResponse interface for the hook
interface MLSuggestionResponse {
  templateId: string;
  suggestions: MLSuggestion[];
  patternsApplied: string[];
  patternCount: number;
  generated: string;
  modelVersion: string;
}

export default function AdvancedPredictionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [prediction, setPrediction] = useState<TrendPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<{ impressions: number; ctr: number; completion: number; shares: number; saves: number; comments: number; sim_score: number } | null>(null);
  const [simVariants, setSimVariants] = useState<any[] | null>(null);
  const [bestVariant, setBestVariant] = useState<any | null>(null);
  const [commerce, setCommerce] = useState<{ clicks: number; orders: number; revenue: number; revenue_score?: number; revenue_lift_estimate?: number } | null>(null);
  
  // Get ML suggestions from our custom hook
  const { 
    suggestions = [],
    isLoading: isLoadingSuggestions = false,
    error: suggestionsError = null,
    applySuggestion = async () => true,
    rejectSuggestion = async () => true
  } = useMLSuggestions(params.id as string, {
    enabled: true,
    autoRefresh: false
  });
  
  // Fetch prediction data
  useEffect(() => {
    async function fetchPredictionData() {
      if (!params.id) return;
      
      try {
        setLoading(true);
        
        // In development, use mock data
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            setPrediction(getMockPrediction(params.id as string));
            setLoading(false);
          }, 1000);
          return;
        }
        
        // In production, fetch from API
        const response = await fetch(`/api/templates/predictions/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch prediction data');
        }
        
        const data = await response.json();
        setPrediction(data);
      } catch (error) {
        console.error('Error fetching prediction:', error);
        setError('Failed to load prediction details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPredictionData();
  }, [params.id]);

  async function runSimulator() {
    try {
      setSimLoading(true);
      setSimResult(null);
      setSimVariants(null);
      setBestVariant(null);
      const res = await fetch('/api/simulator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'tiktok',
          video_features: { hookStrength: 0.6, durationSeconds: 22 },
          tokens: []
        })
      });
      const data = await res.json();
      setSimResult(data);
      const vres = await fetch('/api/simulator/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ N: 5, platform: 'tiktok', video_features: { hookStrength: 0.6, durationSeconds: 22 }, tokens: [] })
      });
      const vdata = await vres.json();
      setSimVariants(vdata?.variants || []);
      setBestVariant(vdata?.best || null);
    } catch (e) {
      console.error('Simulator failed', e);
    } finally {
      setSimLoading(false);
    }
  }
  
  // Format confidence score as percentage
  const getConfidencePercentage = (score: number) => Math.round(score * 100);
  
  // Format the prediction time
  const getFormattedTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  // Get color for confidence score
  const getConfidenceClass = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-amber-600';
    return 'text-red-600';
  };
  
  // Get badge class for growth trajectory
  const getGrowthTrajectoryClass = (trajectory: string) => {
    switch (trajectory) {
      case 'exponential': return 'bg-green-100 text-green-800';
      case 'linear': return 'bg-blue-100 text-blue-800';
      case 'plateauing': return 'bg-amber-100 text-amber-800';
      case 'volatile': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle going back to the dashboard
  const handleBackToDashboard = () => {
    router.push('/dashboard-view/trend-predictions-dashboard');
  };
  
  // Display loading state
  if (loading) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-16 w-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-700">Loading prediction details...</h3>
        </div>
      </div>
    );
  }
  
  // Display error state
  if (error || !prediction) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-red-700 mb-2">Error Loading Prediction</h3>
          <p className="text-gray-600 mb-4">{error || 'Prediction not found'}</p>
          <Button onClick={handleBackToDashboard}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Creator Profile Panel */}
      <div className="mb-6 p-4 rounded border border-gray-200 bg-white">
        <div className="font-semibold mb-2">Creator Profile</div>
        <div className="text-sm text-gray-600">Top Tokens: AUTHORITY@{'<'}3s (0.18), CUTS{'>='}3/5s (0.12)</div>
        <div className="text-sm text-gray-600">Baselines: completion 0.35, share 0.06</div>
        <div className="text-sm text-gray-600">Embedding checksum: 00ab12cd</div>
      </div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Advanced Prediction Analysis</h1>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="text-gray-700 border-gray-300 px-3 py-1 bg-gray-100 rounded-full">
            ID: {prediction.templateId}
          </div>
          
          <div className={`${getGrowthTrajectoryClass(prediction.growthTrajectory)} px-3 py-1 rounded-full`}>
            {prediction.growthTrajectory.charAt(0).toUpperCase() + prediction.growthTrajectory.slice(1)} Growth
          </div>
          
          <div className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 rounded-full flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            {getFormattedTime(prediction.predictedAt)}
          </div>
          
          {prediction.expertAdjusted && (
            <div className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1 rounded-full flex items-center">
              <UserCog className="h-3.5 w-3.5 mr-1" />
              Expert Adjusted
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Template Preview */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="relative h-80 w-full">
              <Image
                src={prediction.template.thumbnailUrl}
                alt={prediction.template.title}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{prediction.template.title}</h3>
              <p className="text-gray-500 text-sm">{prediction.template.description}</p>
            </div>
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-medium">{prediction.contentCategory}</p>
                </div>
                <div>
                  <p className="text-gray-500">Target Audience</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {prediction.targetAudience.map((audience) => (
                      <span key={audience} className="inline-flex items-center rounded-full border bg-gray-50 px-2 py-0.5 text-xs">
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 pt-0 border-t border-gray-100">
              <Link href={`/templates/${prediction.templateId}`} className="w-full">
                <Button variant="outline" className="w-full">
                  View Template
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Middle/Right Column - Simple Navigation and Content */}
        <div className="lg:col-span-2">
          {/* Simple Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-4 font-medium text-sm border-b-2 ${
                  activeTab === 'details' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <LineChart className="h-4 w-4 mr-2" />
                  Prediction Details
                </div>
              </button>
              <button
                onClick={() => setActiveTab('ml-suggestions')}
                className={`py-2 px-4 font-medium text-sm border-b-2 ${
                  activeTab === 'ml-suggestions' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Bot className="h-4 w-4 mr-2" />
                  ML Suggestions
                </div>
              </button>
              <button
                onClick={() => setActiveTab('simulator')}
                className={`py-2 px-4 font-medium text-sm border-b-2 ${
                  activeTab === 'simulator' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Simulator
                </div>
              </button>
              <button
                onClick={() => setActiveTab('commerce')}
                className={`py-2 px-4 font-medium text-sm border-b-2 ${
                  activeTab === 'commerce' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Commerce
                </div>
              </button>
            </div>
          </div>
          
          {/* Content based on active tab */}
          {activeTab === 'details' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <LineChart className="h-5 w-5 text-blue-600 mr-2" />
                Growth Prediction
              </h2>
              <p className="text-gray-500 mb-6">
                Detailed metrics about the predicted trend growth for this template
              </p>
              
              <div className="space-y-6">
                {/* Confidence Score */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-700">Confidence Score</h3>
                    <span className={`text-lg font-semibold ${getConfidenceClass(prediction.confidenceScore)}`}>
                      {getConfidencePercentage(prediction.confidenceScore)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        prediction.confidenceScore >= 0.8 
                          ? 'bg-green-600' 
                          : prediction.confidenceScore >= 0.6 
                            ? 'bg-amber-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${getConfidencePercentage(prediction.confidenceScore)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Our prediction system is {getConfidencePercentage(prediction.confidenceScore)}% confident in this trend forecast
                  </p>
                </div>
                
                {/* Velocity Score */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-700">Velocity Score</h3>
                    <div className="inline-flex items-center rounded-full border bg-blue-100 text-blue-800 px-3 py-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="font-medium">
                        {((prediction.velocityPatterns?.confidence || 0.5) * 10).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      The velocity score measures how rapidly this template is trending. Higher scores indicate faster growth with greater viral potential.
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Pattern: <span className="font-medium capitalize">{prediction.velocityPatterns.pattern}</span>
                    </p>
                  </div>
                </div>
                
                {/* Growth Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-700">Growth Trajectory</h3>
                    </div>
                    <p className="text-lg font-semibold">
                      {prediction.growthTrajectory.charAt(0).toUpperCase() + prediction.growthTrajectory.slice(1)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {getGrowthDescription(prediction.growthTrajectory)}
                    </p>
                  </div>
                  
                  <div className="p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-700">Days Until Peak</h3>
                    </div>
                    <p className="text-lg font-semibold">{prediction.daysUntilPeak} days</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Estimated time until this trend reaches its maximum engagement
                    </p>
                  </div>
                </div>

                {/* Telemetry Panel */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-700">Telemetry (Last 60 min)</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      prediction.confidenceScore >= 0.75 ? 'bg-green-100 text-green-800' : prediction.confidenceScore >= 0.55 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Alignment
                    </span>
                  </div>
                  <div className="h-16 w-full bg-gradient-to-r from-blue-200 to-blue-50 rounded"></div>
                  <p className="text-xs text-gray-500 mt-2">Alignment adjusted the score based on first-hour telemetry.</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'commerce' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
                  Commerce
                </h2>
                <Button onClick={async ()=>{
                  try {
                    const res = await fetch('/api/admin/integration/dryrun_commerce')
                    const data = await res.json()
                    setCommerce(data)
                  } catch {}
                }}>Load</Button>
              </div>
              {commerce ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">Clicks</div>
                    <div className="text-lg font-semibold">{commerce.clicks}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">Orders</div>
                    <div className="text-lg font-semibold">{commerce.orders}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">Revenue</div>
                    <div className="text-lg font-semibold">${'{'}commerce.revenue.toFixed(2){'}'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">RevenueScore</div>
                    <div className="text-lg font-semibold">{(commerce.revenue_score ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">Revenue Lift Est.</div>
                    <div className="text-lg font-semibold">{commerce.revenue_lift_estimate ?? 0}</div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Load recent commerce attribution.</p>
              )}
            </div>
          )}
          {activeTab === 'simulator' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
                  Synthetic Audience Simulator
                </h2>
                <Button onClick={runSimulator} disabled={simLoading}>
                  {simLoading ? 'Running…' : 'Run Simulation'}
                </Button>
              </div>
              {!simResult && !simLoading && (
                <p className="text-gray-500">Run a 10k-viewer simulation to estimate completion, sharing velocity, and best variant.</p>
              )}
              {simResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="text-sm text-gray-500">Impressions</div>
                    <div className="text-xl font-semibold">{simResult.impressions}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="text-sm text-gray-500">CTR</div>
                    <div className="text-xl font-semibold">{(simResult.ctr*100).toFixed(1)}%</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="text-sm text-gray-500">Avg Completion</div>
                    <div className="text-xl font-semibold">{(simResult.completion*100).toFixed(1)}%</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="text-sm text-gray-500">Shares</div>
                    <div className="text-xl font-semibold">{simResult.shares}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="text-sm text-gray-500">Saves</div>
                    <div className="text-xl font-semibold">{simResult.saves}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <div className="text-sm text-gray-500">Comments</div>
                    <div className="text-xl font-semibold">{simResult.comments}</div>
                  </div>
                </div>
              )}
              {bestVariant && (
                <div className="p-4 border border-blue-100 bg-blue-50 rounded mb-4">
                  <div className="text-sm text-blue-700">Top Variant</div>
                  <div className="text-lg font-semibold text-blue-900">{bestVariant.id} — sim_score {(bestVariant.sim_score || 0).toFixed(3)}</div>
                  {bestVariant.summary && <div className="text-sm text-blue-800 mt-1">{bestVariant.summary}</div>}
                </div>
              )}
              {Array.isArray(simVariants) && simVariants.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Variants</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {simVariants.map(v => (
                      <div key={v.id} className="p-3 border border-gray-100 rounded">
                        <div className="font-medium">{v.id}</div>
                        <div className="text-sm text-gray-600">sim_score {(v.sim_score || 0).toFixed(3)} {typeof v.delta === 'number' ? `(Δ ${(v.delta).toFixed(2)})` : ''}</div>
                        {Array.isArray(v.edits) && v.edits.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">{v.edits.join(' • ')}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'ml-suggestions' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-2">Coach</h3>
                <CoachPanel predictionId={params.id as string} baseScore={Math.round((prediction as any)?.predictedScore || 71)} />
              </div>
            </div>
          )}
          
          {activeTab === 'ml-suggestions' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold flex items-center">
                    <Brain className="h-5 w-5 text-blue-600 mr-2" />
                    Machine Learning Suggestions
                  </h2>
                  <p className="text-gray-500">
                    AI-generated recommendations based on expert adjustment patterns
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => (window as any).location.reload()}>
                  Refresh
                </Button>
              </div>
              
              {isLoadingSuggestions ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <Bot className="h-10 w-10 text-blue-600 mb-4 animate-pulse" />
                  <h3 className="text-lg font-medium text-blue-800 mb-2">
                    Loading ML Suggestions
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Our machine learning system is analyzing patterns to provide suggestions...
                  </p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <Bot className="h-10 w-10 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    No Suggestions Available
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Our ML system doesn't have any suggestions for this prediction at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center mb-4">
                    <Bot className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-800">
                      ML-Generated Suggestions ({suggestions.length})
                    </h3>
                  </div>
                  
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="mb-4 border border-blue-100 bg-blue-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Bot className="h-5 w-5 text-blue-600 mr-2" />
                          <h4 className="text-md font-medium text-blue-800">
                            ML Suggestion: {formatFieldName(suggestion.field)}
                          </h4>
                        </div>
                        <div className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-sm">
                          {Math.round(suggestion.confidence * 100)}% Confidence
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Current Value:</span>
                          <span className="font-medium">
                            {suggestion.currentValue}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Suggested Value:</span>
                          <span className="font-medium text-blue-700">
                            {suggestion.suggestedValue}
                          </span>
                        </div>
                        
                        <div className="bg-white p-3 rounded-md text-sm mt-2 text-gray-700">
                          <span className="font-medium flex items-center">
                            <Sparkles className="h-4 w-4 text-blue-500 mr-1" />
                            Reasoning
                          </span>
                          <div className="mt-2 text-gray-600">
                            {suggestion.reason}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => rejectSuggestion(suggestion)}
                          className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
                        >
                          Reject
                        </Button>
                        
                        <Button 
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {suggestionsError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-medium text-red-800">Error Loading Suggestions</h3>
                      <p className="text-sm text-red-700 mt-1">{suggestionsError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions

function getGrowthDescription(trajectory: string): string {
  switch (trajectory) {
    case 'exponential':
      return 'Rapid, accelerating growth with hockey-stick pattern';
    case 'linear':
      return 'Steady, consistent growth at a predictable rate';
    case 'plateauing':
      return 'Initial growth that slows and levels off';
    case 'volatile':
      return 'Unpredictable growth with significant variability';
    default:
      return 'Growth pattern with undefined characteristics';
  }
}

function formatFieldName(field: string): string {
  switch (field) {
    case 'confidenceScore':
      return 'Confidence Score';
    case 'daysUntilPeak':
      return 'Days Until Peak';
    case 'growthTrajectory':
      return 'Growth Trajectory';
    default:
      return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
}

// Mock data for development

function getMockPrediction(id: string): TrendPrediction {
  return {
    templateId: id,
    template: {
      id: id,
      title: 'Clean Product Showcase Template',
      description: 'A minimal, elegant display for product reveals with smooth transitions.',
      thumbnailUrl: 'https://placehold.co/600x800/7950f2/ffffff?text=Product+Template',
      category: 'Product',
      authorName: 'Template Creator'
    },
    contentCategory: 'Product',
    confidenceScore: 0.78,
    growthTrajectory: 'exponential',
    daysUntilPeak: 7,
    targetAudience: ['Gen Z', 'Millennials', 'E-commerce', 'Product Enthusiasts'],
    velocityPatterns: {
      pattern: 'accelerating',
      confidence: 0.65,
      timeWindow: '2 weeks'
    },
    predictedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expertAdjusted: true,
    expertInsights: []
  };
} 