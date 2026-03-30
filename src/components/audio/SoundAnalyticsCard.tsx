"use client";

import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, BarChart3, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sound } from '@/lib/types/audio';
import InlinePlayer from './InlinePlayer';

interface SoundPerformanceData {
  date: string;
  plays: number;
  retention: number;
  engagement: number;
}

interface SoundAnalyticsCardProps {
  sound: Sound;
  title?: string;
  description?: string;
  metric?: 'plays' | 'retention' | 'engagement';
  performanceData?: SoundPerformanceData[];
  trendPercentage?: number;
  className?: string;
  onOpenDetails?: () => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

/**
 * SoundAnalyticsCard - A component for displaying sound performance metrics
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Presents complex data in a simple, digestible format
 * - Contextual Intelligence: Highlights relevant metrics and trends
 * - Emotional Design: Uses visual cues to convey performance sentiment
 */
const SoundAnalyticsCard: React.FC<SoundAnalyticsCardProps> = ({
  sound,
  title,
  description,
  metric = 'plays',
  performanceData = [],
  trendPercentage = 0,
  className,
  onOpenDetails,
  size = 'md',
  interactive = true
}) => {
  // Generate mock data if no performance data is provided
  const data = performanceData.length > 0 ? performanceData : [
    { date: '2023-01', plays: 1200, retention: 72, engagement: 23 },
    { date: '2023-02', plays: 1800, retention: 78, engagement: 31 },
    { date: '2023-03', plays: 1600, retention: 74, engagement: 28 },
    { date: '2023-04', plays: 2400, retention: 81, engagement: 35 },
    { date: '2023-05', plays: 2200, retention: 79, engagement: 36 },
    { date: '2023-06', plays: 2800, retention: 83, engagement: 42 },
    { date: '2023-07', plays: 3600, retention: 85, engagement: 51 },
  ];

  // Determine trend direction
  const isTrendPositive = trendPercentage >= 0;
  
  // Set defaults based on metric
  const metricDefaults = {
    plays: {
      title: 'Sound Plays',
      description: 'Total number of times this sound has been played',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      formatter: (value: number) => value.toLocaleString(),
      icon: BarChart3
    },
    retention: {
      title: 'Listening Retention',
      description: 'Average percentage of the sound that users listen to',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      formatter: (value: number) => `${value}%`,
      icon: TrendingUp
    },
    engagement: {
      title: 'Engagement Score',
      description: 'Engagement rating based on user interactions',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      formatter: (value: number) => value.toLocaleString(),
      icon: TrendingUp
    }
  };

  // Use provided title or default
  const cardTitle = title || metricDefaults[metric].title;
  const cardDescription = description || metricDefaults[metric].description;
  const metricColor = metricDefaults[metric].color;
  const metricBgColor = metricDefaults[metric].bgColor;
  const formatMetric = metricDefaults[metric].formatter;
  const Icon = metricDefaults[metric].icon;

  // Get the most recent value
  const currentValue = data[data.length - 1][metric];
  
  // Size classes
  const sizeClasses = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md'
  };

  // Chart height based on size
  const chartHeight = size === 'sm' ? 80 : size === 'md' ? 120 : 160;

  return (
    <Card className={cn("overflow-hidden", sizeClasses[size], className)}>
      <CardHeader className={cn("pb-2", size === 'sm' ? 'p-3' : '')}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={size === 'sm' ? 'text-sm' : ''}>{cardTitle}</CardTitle>
            {size !== 'sm' && <CardDescription>{cardDescription}</CardDescription>}
          </div>
          <Badge variant="outline" className={cn(metricColor, "font-medium")}>
            {isTrendPositive ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
            {Math.abs(trendPercentage)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={cn("py-2", size === 'sm' ? 'px-3' : '')}>
        {/* Current metric value */}
        <div className="flex items-baseline gap-2">
          <div className={cn("text-3xl font-bold", metricColor)}>
            {formatMetric(currentValue)}
          </div>
          <div className={size === 'sm' ? 'hidden' : ''}>
            <Badge variant="secondary" className={cn("font-normal", isTrendPositive ? "text-green-500" : "text-red-500")}>
              {isTrendPositive ? "↑" : "↓"} {Math.abs(trendPercentage)}% from last month
            </Badge>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[80px] mt-4">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data}>
              <XAxis 
                dataKey="date" 
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                padding={{ left: 10, right: 10 }}
                tickFormatter={() => ''} // Hide labels in small chart
              />
              <YAxis
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={() => ''} // Hide labels in small chart
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={metricColor.replace('text-', 'rgb(') + ')'}
                strokeWidth={2.5}
                dot={false}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                        <div className="font-bold">{payload[0].payload.date}</div>
                        <div>{formatMetric(payload[0].value as number)}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      
      {interactive && (
        <CardFooter className={cn("border-t flex justify-between", size === 'sm' ? 'px-3 py-2' : '')}>
          <div className="flex-grow">
            <InlinePlayer 
              sound={sound}
              size={size === 'sm' ? 'xs' : 'sm'}
              showTitle={size !== 'sm'}
              showArtist={size === 'lg'}
              showControls={size !== 'sm'}
            />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onOpenDetails}
            className="flex-shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="ml-1">Details</span>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default SoundAnalyticsCard; 