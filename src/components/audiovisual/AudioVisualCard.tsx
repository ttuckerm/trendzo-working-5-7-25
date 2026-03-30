"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Import Lucide icons one by one
import { Music } from "lucide-react";
import { Play } from "lucide-react";
import { Pause } from "lucide-react";
import { BarChart2 } from "lucide-react";
import { TrendingUp } from "lucide-react";

/**
 * AudioVisualCard component for displaying audio-visual analysis and controls
 */
export default function AudioVisualCard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPlaying, setIsPlaying] = useState(false);

  // Toggle play state
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Simple waveform visualization
  const WaveformVisualization = () => (
    <div className="h-24 w-full bg-blue-50 rounded flex items-center px-2">
      {[...Array(30)].map((_, i) => {
        const height = Math.sin((i / 30) * Math.PI * 4) * 0.5 + 0.5;
        return (
          <div 
            key={i}
            className="w-1 mx-0.5 bg-blue-500"
            style={{ 
              height: `${height * 100}%`,
              opacity: isPlaying ? 1 : 0.5
            }}
          />
        );
      })}
    </div>
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Music className="h-5 w-5 text-blue-500" />
          Audio-Visual Experience
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between border rounded p-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Music className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Summer Vibes</h3>
                    <p className="text-sm text-gray-500">TrendMusic</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </Button>
              </div>
              
              <WaveformVisualization />
              
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="border rounded p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Engagement Impact</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">+18.7%</p>
                </div>
                <div className="border rounded p-3">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Trend Match</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">92%</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Recommended Audio-Visual Pairings</h3>
              <div className="space-y-3">
                {[
                  { title: 'Energetic Product Showcase', badge: 'High Match' },
                  { title: 'Summer Collection Reveal', badge: 'Trending' },
                  { title: 'Brand Story Narration', badge: 'Classic' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{item.title}</span>
                    <Badge variant="outline">{item.badge}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="editor" className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Audio-Visual Synchronization</h3>
              <p className="text-sm text-gray-500 mb-3">
                Create harmonious audio-visual experiences by syncing your content with sound
              </p>
              <div className="bg-blue-50 p-3 rounded-md">
                <span className="text-sm text-blue-800">
                  Unlock audio-visual editing with premium subscription
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 