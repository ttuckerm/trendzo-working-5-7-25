"use client"

import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Label,
} from 'recharts';
import { Info, Maximize2, SlidersHorizontal, ArrowRight, Calendar, Download, ZoomIn, ZoomOut, TrendingUp, TrendingDown, BarChart } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/design-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

type DataPoint = {
  date: string;
  value: number;
  benchmark?: number;
  // Additional metric properties to support rich data display
  details?: {
    engagementRate?: number;
    clickRate?: number;
    conversionRate?: number;
    [key: string]: number | undefined;
  }
};

export type TimeRange = '7d' | '30d' | '90d' | 'ytd' | 'all';
export type ChartType = 'area' | 'bar' | 'line';

interface PerformanceChartProps {
  data: DataPoint[];
  title: string;
  valueLabel: string;
  color?: string;
  benchmarkLabel?: string;
  benchmarkColor?: string;
  showBenchmark?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
  maxValue?: number;
  includeAverage?: boolean;
  showZoom?: boolean;
  supportedTimeRanges?: TimeRange[];
  insights?: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  title,
  valueLabel,
  color = '#3b82f6', // blue-500
  benchmarkLabel = 'Industry Average',
  benchmarkColor = '#9ca3af', // gray-400
  showBenchmark = true,
  formatValue,
  className = '',
  maxValue,
  includeAverage = false,
  showZoom = false,
  supportedTimeRanges = ['7d', '30d', '90d', 'all'],
  insights,
}) => {
  // Default formatter just returns the value
  const defaultFormatter = (value: number) => value.toString();
  const formatter = formatValue || defaultFormatter;
  
  // Enhanced state management for progressive disclosure and interaction
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRange>('30d');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [chartType, setChartType] = useState<ChartType>('area');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<DataPoint | null>(null);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  const prefersReducedMotion = useReducedMotion();
  
  // Calculate average and performance indicators
  const average = data.length 
    ? data.reduce((sum, item) => sum + item.value, 0) / data.length
    : 0;
    
  const latestValue = data.length ? data[data.length - 1].value : 0;
  const firstValue = data.length ? data[0].value : 0;
  const percentChange = firstValue !== 0 
    ? ((latestValue - firstValue) / firstValue) * 100 
    : 0;
  
  // Determine trend status
  const trend = percentChange > 5 
    ? 'up' 
    : percentChange < -5 
      ? 'down' 
      : 'stable';
  
  // Animate chart in on first render
  useEffect(() => {
    if (!hasAnimatedIn && !prefersReducedMotion) {
      const timeout = setTimeout(() => {
        setHasAnimatedIn(true);
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [hasAnimatedIn, prefersReducedMotion]);

  // Handle time range selection with improved feedback
  const handleTimeRangeChange = (range: TimeRange) => {
    // Save previous range for exit animation direction
    setActiveTimeRange(range);
    
    // Provide haptic feedback for selection
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };
  
  // Format a label for the time range
  const getTimeRangeLabel = (range: TimeRange): string => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case 'ytd': return 'Year to Date';
      case 'all': return 'All Time';
      default: return '';
    }
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    if (zoomLevel < 2) {
      setZoomLevel(zoomLevel + 0.25);
      if ('vibrate' in navigator) navigator.vibrate(10);
    }
  };
  
  const handleZoomOut = () => {
    if (zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.25);
      if ('vibrate' in navigator) navigator.vibrate(10);
    }
  };
  
  // Toggle expanded state with animation
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if ('vibrate' in navigator) navigator.vibrate(isExpanded ? 15 : [10, 30]);
    
    // Scroll to chart if expanding on mobile
    if (!isExpanded && window.innerWidth < 768 && chartRef.current) {
      setTimeout(() => {
        chartRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };
  
  // Download chart data as CSV
  const downloadCSV = () => {
    const csvContent = [
      ['Date', valueLabel, benchmarkLabel].join(','),
      ...data.map(item => [
        item.date,
        item.value,
        item.benchmark || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if ('vibrate' in navigator) navigator.vibrate([10, 20, 30]);
  };
  
  return (
    <motion.div 
      className={cn(
        "rounded-lg border border-gray-200 bg-white transition-all duration-300 relative overflow-hidden",
        isExpanded 
          ? "fixed inset-4 z-50 shadow-2xl overflow-auto" 
          : "shadow-sm hover:shadow-md",
        className
      )}
      layout
      ref={chartRef}
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleExpanded}
          />
        )}
      </AnimatePresence>
      
      <div className={cn(
        "relative z-50 flex flex-col h-full p-4 sm:p-6",
        isExpanded && "max-h-full"
      )}>
        <motion.div 
          className="mb-4 flex flex-wrap items-center justify-between gap-2"
          layout
        >
          <div className="flex items-center gap-2">
            <motion.h2 
              className="text-lg font-semibold text-gray-900 flex items-center gap-2"
              layout
            >
              {title}
              <motion.div 
                className={cn(
                  "flex items-center text-sm font-normal rounded-full px-2 py-0.5",
                  trend === 'up' 
                    ? "bg-green-50 text-green-700" 
                    : trend === 'down' 
                      ? "bg-red-50 text-red-700" 
                      : "bg-gray-50 text-gray-700"
                )}
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                {trend === 'up' ? (
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                ) : trend === 'down' ? (
                  <TrendingDown className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <BarChart className="h-3.5 w-3.5 mr-1" />
                )}
                {Math.abs(percentChange).toFixed(1)}%
              </motion.div>
            </motion.h2>
            
            {insights && (
              <div className="relative group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full text-gray-400 hover:text-gray-500"
                >
                  <Info className="h-4 w-4" />
                </Button>
                <motion.div 
                  className="absolute left-0 top-full mt-2 w-64 p-3 bg-white rounded-md shadow-lg border border-gray-200 text-sm z-10"
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  whileHover={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {insights}
                </motion.div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 ml-auto">
            {/* Chart type selector */}
            <Tabs 
              value={chartType} 
              onValueChange={(value: string) => setChartType(value as ChartType)}
              className="h-8"
            >
              <TabsList className="h-8 p-0.5">
                <TabsTrigger value="area" className="h-7 px-2 text-xs">Area</TabsTrigger>
                <TabsTrigger value="bar" className="h-7 px-2 text-xs">Bar</TabsTrigger>
                <TabsTrigger value="line" className="h-7 px-2 text-xs">Line</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1.5" 
              onClick={downloadCSV}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Export</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={toggleExpanded}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
        
        {/* Time range selector with improved UI */}
        <motion.div 
          className="flex flex-wrap gap-2 mb-4" 
          layout
        >
          {supportedTimeRanges.map(range => (
            <motion.button
              key={range}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1",
                activeTimeRange === range 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              onClick={() => handleTimeRangeChange(range)}
              whileTap={{ scale: 0.97 }}
            >
              <Calendar className="h-3 w-3" />
              {getTimeRangeLabel(range)}
            </motion.button>
          ))}
          
          {/* Optional zoom controls with better interaction */}
          {showZoom && (
            <div className="ml-auto flex items-center gap-1 border rounded-md overflow-hidden shadow-sm">
              <Button 
                variant="ghost"
                size="sm"
                className="h-8 px-2 rounded-none border-r"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs font-medium text-gray-700">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button 
                variant="ghost"
                size="sm"
                className="h-8 px-2 rounded-none"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}
        </motion.div>
        
        {/* Summary metrics with animations */}
        <AnimatePresence>
          {(showDetails || isExpanded) && (
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 rounded-lg bg-gray-50 border border-gray-100"
              initial={{ opacity: 0, height: 0, margin: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, margin: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="flex flex-col"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-xs text-gray-500 mb-1">Current</span>
                <span className="text-lg font-semibold flex items-center gap-1 text-gray-900">
                  {data.length ? formatter(data[data.length - 1].value) : '-'}
                  {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                </span>
              </motion.div>
              
              <motion.div 
                className="flex flex-col"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-xs text-gray-500 mb-1">Average</span>
                <span className="text-lg font-semibold text-gray-900">{formatter(average)}</span>
              </motion.div>
              
              <motion.div 
                className="flex flex-col"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-xs text-gray-500 mb-1">Peak</span>
                <span className="text-lg font-semibold text-gray-900">
                  {data.length ? formatter(Math.max(...data.map(d => d.value))) : '-'}
                </span>
              </motion.div>
              
              <motion.div 
                className="flex flex-col"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-xs text-gray-500 mb-1">{benchmarkLabel}</span>
                <span className="text-lg font-semibold text-gray-600">
                  {data.length && data[0].benchmark !== undefined 
                    ? formatter(data[0].benchmark)
                    : '-'}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Chart visualization with enter animations */}
        <motion.div 
          className={cn(
            "w-full overflow-hidden transition-all duration-300",
            isExpanded ? "flex-1" : "h-64"
          )}
          initial={!hasAnimatedIn && !prefersReducedMotion ? { opacity: 0, y: 20 } : {}}
          animate={hasAnimatedIn || prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 15, right: 20, bottom: 20, left: 20 }}
              onMouseMove={(e) => {
                if (e.activePayload && e.activePayload.length > 0) {
                  setHoveredDataPoint(e.activePayload[0].payload as DataPoint);
                }
              }}
              onMouseLeave={() => setHoveredDataPoint(null)}
            >
              <defs>
                <linearGradient id={`colorValue-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                dy={10}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e2e8f0' }}
                width={40}
                tickFormatter={formatter}
                domain={maxValue ? [0, maxValue] : ['auto', 'auto']}
              />
              
              <Tooltip
                formatter={formatter}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '0.375rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb',
                  padding: '8px 12px',
                }}
                itemStyle={{ padding: '2px 0' }}
              />
              
              {includeAverage && (
                <ReferenceLine 
                  y={average} 
                  label={{ 
                    value: `Avg: ${formatter(average)}`, 
                    position: 'insideTopRight',
                    fill: '#6b7280',
                    fontSize: 11
                  }} 
                  stroke="#6b7280" 
                  strokeDasharray="3 3" 
                />
              )}
              
              {showBenchmark && (
                <Area
                  type="monotone"
                  dataKey="benchmark"
                  stroke={benchmarkColor}
                  strokeWidth={1.5}
                  fillOpacity={0}
                  dot={false}
                  name={benchmarkLabel}
                />
              )}
              
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fillOpacity={chartType === 'area' ? 1 : 0}
                fill={`url(#colorValue-${title})`}
                name={valueLabel}
                activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
        
        {/* Bottom details toggle button */}
        {!isExpanded && (
          <motion.div 
            className="mt-4 text-center" 
            layout
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-500 hover:text-gray-700 gap-1"
            >
              {showDetails ? "Hide details" : "Show details"}
              <ArrowRight className={cn(
                "h-3.5 w-3.5 transition-transform",
                showDetails && "rotate-90"
              )} />
            </Button>
          </motion.div>
        )}
        
        {/* Insight callout for hovered data point */}
        <AnimatePresence>
          {hoveredDataPoint && hoveredDataPoint.details && (
            <motion.div 
              className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 max-w-xs"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-sm font-medium text-gray-900 mb-1">{hoveredDataPoint.date}</div>
              <div className="space-y-1 text-xs">
                {Object.entries(hoveredDataPoint.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium text-gray-900">{typeof value === 'number' ? formatter(value) : value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PerformanceChart; 