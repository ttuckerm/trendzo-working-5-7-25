'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, MousePointer, Mail, Video, 
  CheckCircle, BarChart, Clock, Globe 
} from 'lucide-react';

interface FunnelMetrics {
  pageViews: number;
  exitIntentTriggers: number;
  exitIntentConversions: number;
  editorEntries: number;
  templateSelections: number;
  templateCompletions: number;
}

interface TopPage {
  niche: string;
  platform: string;
  pageViews: number;
  conversions: number;
  conversionRate: number;
}

export default function AdminMVPDashboard() {
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockMetrics: FunnelMetrics = {
        pageViews: 12847,
        exitIntentTriggers: 3891,
        exitIntentConversions: 1456,
        editorEntries: 2134,
        templateSelections: 1789,
        templateCompletions: 1234
      };

      const mockTopPages: TopPage[] = [
        {
          niche: 'business',
          platform: 'linkedin',
          pageViews: 2847,
          conversions: 456,
          conversionRate: 16.02
        },
        {
          niche: 'fitness',
          platform: 'instagram',
          pageViews: 2134,
          conversions: 298,
          conversionRate: 13.97
        },
        {
          niche: 'education',
          platform: 'tiktok',
          pageViews: 1892,
          conversions: 234,
          conversionRate: 12.37
        },
        {
          niche: 'creator',
          platform: 'youtube',
          pageViews: 1567,
          conversions: 189,
          conversionRate: 12.06
        },
        {
          niche: 'wellness',
          platform: 'instagram',
          pageViews: 1345,
          conversions: 145,
          conversionRate: 10.78
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setMetrics(mockMetrics);
      setTopPages(mockTopPages);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateConversionRate = (conversions: number, views: number) => {
    if (views === 0) return '0%';
    return `${((conversions / views) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading MVP dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">MVP Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your funnel performance and optimize conversions</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Conversion Funnel
          </h2>
          
          <div className="space-y-4">
            {metrics && [
              { 
                label: 'Page Views', 
                value: metrics.pageViews, 
                icon: Globe,
                color: 'bg-blue-500'
              },
              { 
                label: 'Exit Intent Shown', 
                value: metrics.exitIntentTriggers,
                rate: calculateConversionRate(metrics.exitIntentTriggers, metrics.pageViews),
                icon: MousePointer,
                color: 'bg-yellow-500'
              },
              { 
                label: 'Emails Captured', 
                value: metrics.exitIntentConversions,
                rate: calculateConversionRate(metrics.exitIntentConversions, metrics.exitIntentTriggers),
                icon: Mail,
                color: 'bg-green-500'
              },
              { 
                label: 'Editor Sessions', 
                value: metrics.editorEntries,
                rate: calculateConversionRate(metrics.editorEntries, metrics.pageViews),
                icon: Video,
                color: 'bg-blue-500'
              },
              { 
                label: 'Templates Started', 
                value: metrics.templateSelections,
                rate: calculateConversionRate(metrics.templateSelections, metrics.editorEntries),
                icon: TrendingUp,
                color: 'bg-purple-500'
              },
              { 
                label: 'Templates Completed', 
                value: metrics.templateCompletions,
                rate: calculateConversionRate(metrics.templateCompletions, metrics.templateSelections),
                icon: CheckCircle,
                color: 'bg-emerald-500'
              }
            ].map((step, index) => (
              <div key={step.label} className="relative">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${step.color} rounded-lg flex items-center justify-center text-white`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{step.label}</p>
                      <p className="text-sm text-gray-600">{step.value.toLocaleString()} total</p>
                    </div>
                  </div>
                  {step.rate && (
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{step.rate}</p>
                      <p className="text-xs text-gray-600">conversion</p>
                    </div>
                  )}
                </div>
                {index < 5 && (
                  <div className="absolute left-6 top-full h-4 w-0.5 bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Pages */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Performing Landing Pages
          </h2>
          
          <div className="space-y-3">
            {topPages.map((page, index) => (
              <motion.div
                key={`${page.niche}-${page.platform}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {page.niche} / {page.platform}
                    </p>
                    <p className="text-sm text-gray-600">
                      {page.pageViews.toLocaleString()} views • {page.conversions} conversions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{page.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">conversion rate</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Avg. Time to Complete</p>
                <p className="text-2xl font-bold text-gray-900">2m 34s</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.exitIntentConversions || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Overall Conversion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics ? calculateConversionRate(metrics.templateCompletions, metrics.pageViews) : '0%'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}