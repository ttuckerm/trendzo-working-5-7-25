'use client';

import { useState, useEffect, useRef } from 'react';
import { TikTokSound } from '@/lib/types/tiktok';
import SoundPlayer from './SoundPlayer';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { ArrowUp, ArrowDown, Minus, Volume2 } from 'lucide-react';

interface SoundDetailsProps {
  soundId: string;
  initialData?: TikTokSound;
  showWaveform?: boolean;
  showUsageTrend?: boolean;
  showMetrics?: boolean;
  className?: string;
  demoMode?: boolean; // For testing without actual audio loading
}

export default function SoundDetails({ 
  soundId, 
  initialData, 
  showWaveform = true,
  showUsageTrend = true, 
  showMetrics = true,
  className = '',
  demoMode = false
}: SoundDetailsProps) {
  const [sound, setSound] = useState<TikTokSound | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // Fetch sound details if not provided
  useEffect(() => {
    if (!initialData && soundId) {
      fetchSoundDetails();
    }
  }, [soundId, initialData]);

  // Handler for audio error events from the SoundPlayer
  const handleAudioError = (errorMessage: string) => {
    console.warn('Audio error in SoundDetails:', errorMessage);
    setAudioError(errorMessage);
  };

  const fetchSoundDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sounds/${soundId}`);
      const data = await response.json();
      
      if (data.success) {
        setSound(data.sound);
      } else {
        setError(data.error || 'Failed to fetch sound details');
      }
    } catch (err) {
      setError('Error loading sound details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format large numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  // Generate waveform data using the sound details
  const generateWaveformData = () => {
    const bars = 40; // Number of bars in waveform
    const waveformData = [];
    
    // If we have usage history, use it to shape the waveform
    if (sound?.usageHistory && Object.keys(sound.usageHistory).length > 0) {
      const historyValues = Object.values(sound.usageHistory);
      const maxValue = Math.max(...historyValues);
      
      for (let i = 0; i < bars; i++) {
        const historyIndex = Math.floor(i * historyValues.length / bars);
        const value = historyValues[historyIndex] || 0;
        const normalizedValue = (value / maxValue) * 100;
        waveformData.push({ value: normalizedValue + Math.random() * 10 });
      }
    } else {
      // Otherwise generate a fake waveform
      for (let i = 0; i < bars; i++) {
        // Create a semi-random waveform with a pattern
        const baseHeight = 20 + Math.sin(i / 3) * 30 + Math.cos(i / 7) * 20;
        const randomFactor = Math.random() * 30;
        waveformData.push({ value: baseHeight + randomFactor });
      }
    }
    
    return waveformData;
  };
  
  // Format the usage history data for the chart
  const formatChartData = () => {
    if (!sound?.usageHistory) return [];
    
    return Object.entries(sound.usageHistory)
      .map(([date, count]) => ({
        date: date.slice(5), // Show only MM-DD
        count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };
  
  // Get the lifecycle stage badge color
  const getLifecycleColor = () => {
    if (!sound?.lifecycle) return 'bg-gray-400';
    
    switch (sound.lifecycle.stage) {
      case 'emerging':
        return 'bg-teal-500';
      case 'growing':
        return 'bg-green-500';
      case 'peaking':
        return 'bg-amber-500';
      case 'declining':
        return 'bg-red-500';
      case 'stable':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };
  
  // Get trend icon based on growth
  const getTrendIcon = () => {
    if (!sound?.stats?.trend) return <Minus className="w-4 h-4" />;
    
    switch (sound.stats.trend) {
      case 'rising':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'falling':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !sound) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error || 'Sound not found'}</p>
      </div>
    );
  }
  
  const waveformData = generateWaveformData();
  const chartData = formatChartData();
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Sound header */}
      <div className="flex items-start p-4 border-b">
        {/* Cover image */}
        <div className="relative w-20 h-20 flex-shrink-0 mr-4 rounded-md overflow-hidden">
          {sound.coverThumb ? (
            <img 
              src={sound.coverThumb} 
              alt={sound.title} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Volume2 className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Sound info */}
        <div className="flex-1">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold line-clamp-1">{sound.title}</h2>
            <div className={`ml-3 px-2 py-1 text-xs rounded-full text-white ${getLifecycleColor()}`}>
              {sound.lifecycle?.stage ?? 'Unknown'}
            </div>
          </div>
          <p className="text-gray-600">{sound.authorName}</p>
          
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span className="mr-3">{sound.duration ? `${Math.floor(sound.duration / 60)}:${String(sound.duration % 60).padStart(2, '0')}` : 'N/A'}</span>
            {sound.soundCategory && (
              <span className="mr-3 px-2 py-0.5 bg-gray-100 rounded-full">
                {sound.soundCategory}
              </span>
            )}
            {sound.original && <span className="mr-3 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">Original</span>}
            {sound.isRemix && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">Remix</span>}
          </div>
        </div>
      </div>
      
      {/* Sound Player Component */}
      {sound.playUrl && showWaveform && (
        <div className="border-b">
          {audioError ? (
            <div className="p-4 bg-red-50">
              <p className="text-red-600 mb-2">Failed to load audio</p>
              <p className="text-gray-600 text-sm">{audioError}</p>
              <p className="text-gray-600 text-sm mt-1">URL: {sound.playUrl}</p>
              <div className="mt-3 flex space-x-2">
                <button 
                  onClick={() => setAudioError(null)} 
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          ) : (
            <SoundPlayer 
              soundUrl={sound.playUrl}
              soundTitle={sound.title}
              waveformData={waveformData}
              allowTrimming={false} // Only allow trimming in premium context
              onError={handleAudioError}
              demoMode={demoMode}
            />
          )}
        </div>
      )}
      
      {/* Usage trend chart */}
      {showUsageTrend && chartData.length > 0 && (
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-2">Usage Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [formatNumber(value as number), 'Usage']} />
                <ReferenceLine y={0} stroke="#000" />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 1 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Metrics */}
      {showMetrics && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Usage Count</div>
            <div className="text-xl font-semibold mt-1">{formatNumber(sound.stats.usageCount)}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">7-Day Growth</div>
            <div className="flex items-center mt-1">
              <span className="text-xl font-semibold">{formatNumber(sound.stats.usageChange7d)}</span>
              <span className="ml-2">{getTrendIcon()}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Virality Score</div>
            <div className="text-xl font-semibold mt-1">
              {sound.viralityScore ? Math.round(sound.viralityScore) : 'N/A'}
            </div>
          </div>
          
          {sound.stats.growthVelocity7d !== undefined && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Daily Growth</div>
              <div className="text-xl font-semibold mt-1">
                {formatNumber(sound.stats.growthVelocity7d)}
              </div>
            </div>
          )}
          
          {sound.stats.peakUsage && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Peak Usage</div>
              <div className="text-xl font-semibold mt-1">{formatNumber(sound.stats.peakUsage)}</div>
              {sound.stats.peakDate && (
                <div className="text-xs text-gray-500 mt-1">{sound.stats.peakDate}</div>
              )}
            </div>
          )}
          
          {sound.tempo && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Tempo</div>
              <div className="text-xl font-semibold mt-1 capitalize">{sound.tempo}</div>
            </div>
          )}
        </div>
      )}
      
      {/* Categories */}
      {sound.categories && sound.categories.length > 0 && (
        <div className="p-4 border-t">
          <h3 className="text-sm font-semibold mb-2">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {sound.categories.map((category) => (
              <span key={category} className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                {category}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 