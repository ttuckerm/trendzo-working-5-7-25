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

function AlgorithmWeather({ niche }: { niche: string }) {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    fetch(`/api/algorithm_weather?niche=${encodeURIComponent(niche)}`).then(r=>r.json()).then(setData).catch(()=>{})
  }, [niche])
  if (!data) return null
  return (
    <div className="mb-6 p-4 rounded border border-gray-200 bg-white">
      <div className="font-semibold mb-2">Algorithm Weather — {niche}</div>
      <div className="text-sm">Timing Index: {data.timing_index} — {data.narrative}</div>
      <div className="mt-2 text-xs flex flex-wrap gap-2">
        {data.top_sounds?.map((s:string)=> (<span key={s} className="px-2 py-1 rounded-full bg-blue-50 text-blue-700">{s}</span>))}
        {data.top_hashtags?.map((h:string)=> (<span key={h} className="px-2 py-1 rounded-full bg-green-50 text-green-700">{h}</span>))}
      </div>
    </div>
  )
}

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
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<TrendPrediction[]>([]);
  const [filteredPredictions, setFilteredPredictions] = useState<TrendPrediction[]>([]);

  useEffect(() => {
    setPredictions([]); setFilteredPredictions([]); setIsLoading(false);
  }, []);

  function resetFilters() {}
  function applyFilters() {}

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <AlgorithmWeather niche="general" />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => router.push('/dashboard-view/trend-predictions-dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Trend Predictions Dashboard</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-gray-300"><Filter className="h-4 w-4 mr-2" /> Filters</Button>
          <Button variant="outline" className="border-gray-300"><Sliders className="h-4 w-4 mr-2" /> Advanced</Button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white rounded-lg border p-4 mb-4">
        <div className="flex items-center space-x-3">
          <BarChart2 className="h-5 w-5 text-blue-600" />
          <div>
            <div className="font-semibold">Prediction Filters</div>
            <div className="text-sm text-gray-500">Adjust parameters to refine the prediction list</div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={resetFilters} className="border-gray-300"><RefreshCw className="h-4 w-4 mr-2" />Reset</Button>
          <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700"><Save className="h-4 w-4 mr-2" />Apply Filters</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          {/* Content omitted for brevity */}
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