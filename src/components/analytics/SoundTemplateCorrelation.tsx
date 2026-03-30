import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { AlertCircle, Music, TrendingUp, File, Info } from 'lucide-react';
import { TikTokSound } from '@/lib/types/tiktok';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface SoundTemplateCorrelationProps {
  className?: string;
  soundId?: string;
  templateId?: string;
}

interface CorrelationDataPoint {
  soundId: string;
  soundName: string;
  templateId: string;
  templateName: string;
  correlationScore: number;
  engagementLift: number;
  category: string;
  x: number;
  y: number;
  z: number;
}

export default function SoundTemplateCorrelation({ 
  className = "", 
  soundId,
  templateId 
}: SoundTemplateCorrelationProps) {
  // State for the dashboard
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [correlationData, setCorrelationData] = useState<CorrelationDataPoint[]>([]);
  const [selectedItem, setSelectedItem] = useState<CorrelationDataPoint | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Construct the URL with the query parameters
        const params = new URLSearchParams();
        if (soundId) params.append('soundId', soundId);
        if (templateId) params.append('templateId', templateId);
        
        const response = await fetch(`/api/sounds/template-pairings?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch correlation data');
        }
        
        const data = await response.json();
        
        // Transform the data for visualization
        const transformedData = data.correlations.map((item: any, index: number) => ({
          soundId: item.soundId,
          soundName: item.soundName,
          templateId: item.templateId,
          templateName: item.templateName,
          correlationScore: item.correlationScore,
          engagementLift: item.engagementLift || 0,
          category: item.category || 'unknown',
          // For scatter plot positioning
          x: item.engagementLift || index % 10,
          y: item.correlationScore,
          z: Math.min(Math.max(item.correlationScore / 10, 10), 100)
        }));
        
        setCorrelationData(transformedData);
      } catch (err) {
        console.error('Error fetching correlation data:', err);
        setError((err as Error).message);
        
        // Use mock data for development/demo
        const mockData = Array.from({ length: 20 }).map((_, index) => {
          const categories = ['music', 'dance', 'tutorial', 'comedy', 'lifestyle'];
          const category = categories[Math.floor(Math.random() * categories.length)];
          const correlationScore = Math.floor(Math.random() * 70) + 30; // 30-100
          const engagementLift = Math.floor(Math.random() * 40) - 10; // -10 to 30
          
          return {
            soundId: `sound-${index + 1}`,
            soundName: `Sound ${index + 1}`,
            templateId: `template-${index + 1}`,
            templateName: `Template ${index + 1}`,
            correlationScore,
            engagementLift,
            category,
            x: engagementLift,
            y: correlationScore,
            z: Math.min(Math.max(correlationScore / 10, 10), 100)
          };
        });
        
        setCorrelationData(mockData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [soundId, templateId]);

  // Render the correlation matrix chart
  const renderCorrelationMatrix = () => {
    if (correlationData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No correlation data available</p>
        </div>
      );
    }

    return (
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Engagement Lift (%)" 
              domain={['dataMin - 5', 'dataMax + 5']}
              label={{ value: 'Engagement Lift (%)', position: 'bottom', offset: 0 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Correlation Score" 
              domain={[0, 100]}
              label={{ value: 'Correlation Score', angle: -90, position: 'left' }}
            />
            <ZAxis 
              type="number" 
              dataKey="z" 
              range={[50, 400]} 
              name="Impact" 
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border rounded-md shadow-sm">
                      <p className="font-medium">{data.soundName}</p>
                      <p className="text-sm text-gray-600">with {data.templateName}</p>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm">
                        <p>Correlation: <span className="font-medium">{data.correlationScore}%</span></p>
                        <p>Engagement: <span className={`font-medium ${data.engagementLift >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.engagementLift >= 0 ? '+' : ''}{data.engagementLift}%
                        </span></p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Category: {data.category}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Scatter 
              name="Sound-Template Correlations" 
              data={correlationData} 
              fill="#8884d8"
              onClick={(data) => setSelectedItem(data)}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {selectedItem && (
          <div className="mt-6 border rounded-lg p-4 bg-indigo-50">
            <h3 className="text-lg font-semibold mb-2">Selected Correlation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Sound</p>
                <p className="font-medium">{selectedItem.soundName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Template</p>
                <p className="font-medium">{selectedItem.templateName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Correlation Score</p>
                <p className="font-medium">{selectedItem.correlationScore}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Engagement Lift</p>
                <p className={`font-medium ${selectedItem.engagementLift >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedItem.engagementLift >= 0 ? '+' : ''}{selectedItem.engagementLift}%
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Button size="sm" variant="outline" className="text-xs">
                View Details
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render the correlation list view
  const renderCorrelationList = () => {
    if (correlationData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No correlation data available</p>
        </div>
      );
    }

    // Sort by correlation score
    const sortedData = [...correlationData].sort((a, b) => b.correlationScore - a.correlationScore);

    return (
      <div className="mt-4 space-y-4">
        {sortedData.map((item, index) => (
          <Card 
            key={index} 
            className={`overflow-hidden transition-all ${selectedItem?.soundId === item.soundId && selectedItem?.templateId === item.templateId ? 'ring-2 ring-indigo-500' : ''}`}
            onClick={() => setSelectedItem(item)}
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <Music className="h-4 w-4 text-indigo-500 mr-2" />
                    <h3 className="font-medium">{item.soundName}</h3>
                  </div>
                  <div className="flex items-center mt-1">
                    <File className="h-4 w-4 text-gray-500 mr-2" />
                    <p className="text-sm text-gray-600">{item.templateName}</p>
                  </div>
                </div>
                <Badge 
                  className={`${
                    item.correlationScore >= 80 ? 'bg-green-100 text-green-800 border-green-200' : 
                    item.correlationScore >= 60 ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }`}
                >
                  {item.correlationScore}% Match
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Engagement Lift</p>
                  <p className={`font-medium ${item.engagementLift >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.engagementLift >= 0 ? '+' : ''}{item.engagementLift}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="font-medium capitalize">{item.category}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sound-Template Correlations</h2>
          <p className="text-gray-500 mt-1">
            {soundId ? 'Templates that work well with this sound' : 
             templateId ? 'Sounds that work well with this template' : 
             'Discover optimal sound and template pairings'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as 'matrix' | 'list')}
            className="w-[200px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="matrix">Matrix</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : error ? (
        <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      ) : (
        <div>
          {viewMode === 'matrix' && renderCorrelationMatrix()}
          {viewMode === 'list' && renderCorrelationList()}
        </div>
      )}
      
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-700">How correlations work</h3>
          <p className="text-sm text-blue-600 mt-1">
            Sound-template correlations measure how well a sound performs when paired with a particular template. 
            High correlation scores suggest that this combination delivers better engagement and viewer retention.
          </p>
        </div>
      </div>
    </Card>
  );
} 