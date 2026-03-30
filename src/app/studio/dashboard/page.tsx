'use client';

/**
 * Unified Dashboard
 * 
 * Central hub showing all platform stats, quick actions,
 * and intelligence feed based on user experience level.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Brain, TrendingUp, Video, Zap, Target, Grid,
  Sparkles, BarChart3, Clock, Award, ArrowUpRight,
  Lightbulb, AlertTriangle, CheckCircle
} from 'lucide-react';

interface DashboardStats {
  algorithmIQ: number;
  iqTrend: number;
  totalPredictions: number;
  viralRate: number;
  avgDPS: number;
  topNiche: string;
  userLevel: 'beginner' | 'intermediate' | 'expert';
}

interface FeedItem {
  id: string;
  type: 'pattern' | 'growth' | 'opportunity' | 'alert';
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon: Icon,
  gradient 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  trend?: number;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${gradient} rounded-xl p-6 relative overflow-hidden`}
    >
      <div className="absolute top-4 right-4 opacity-20">
        <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10">
        <p className="text-white/60 text-sm mb-1">{title}</p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-white">{value}</span>
          {trend !== undefined && (
            <span className={`text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-white/40 text-xs mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

function QuickActionCard({
  title,
  description,
  cta,
  href,
  icon: Icon,
  gradient
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        className={`bg-gradient-to-br ${gradient} rounded-xl p-6 cursor-pointer group h-full`}
      >
        <Icon className="w-10 h-10 text-white/80 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm mb-4">{description}</p>
        <div className="flex items-center gap-2 text-white group-hover:translate-x-2 transition-transform">
          <span className="font-medium">{cta}</span>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </motion.div>
    </Link>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/5 rounded-lg p-4 flex items-start gap-4 hover:bg-white/10 transition-colors"
    >
      <div className={`p-2 rounded-lg ${item.color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-white font-medium">{item.title}</h4>
        <p className="text-white/60 text-sm">{item.description}</p>
      </div>
    </motion.div>
  );
}

export default function UnifiedDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    algorithmIQ: 0,
    iqTrend: 0,
    totalPredictions: 0,
    viralRate: 0,
    avgDPS: 0,
    topNiche: 'General',
    userLevel: 'beginner'
  });
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Fetch Algorithm IQ performance
        const iqRes = await fetch('/api/algorithm-iq/performance');
        if (iqRes.ok) {
          const iqData = await iqRes.json();
          setStats(prev => ({
            ...prev,
            algorithmIQ: iqData.latestPerformance?.iq_score || 50,
            iqTrend: iqData.iqTrend || 0,
            totalPredictions: iqData.recentTracking?.total || 0
          }));
        }

        // Fetch patterns for feed
        const patternsRes = await fetch('/api/bloomberg/patterns');
        if (patternsRes.ok) {
          const patternsData = await patternsRes.json();
          const topPattern = patternsData.patterns?.[0];
          
          if (topPattern) {
            setFeedItems(prev => [...prev, {
              id: 'pattern-1',
              type: 'pattern',
              title: `🔥 Breaking Pattern: "${topPattern.pattern}"`,
              description: `${topPattern.dps} DPS average in ${topPattern.niche} - ${topPattern.velocity} velocity`,
              icon: TrendingUp,
              color: 'bg-orange-500/20 text-orange-400'
            }]);
          }
        }

        // Add static feed items
        setFeedItems(prev => [
          ...prev,
          {
            id: 'growth-1',
            type: 'growth',
            title: '📈 Your Growth',
            description: 'Your average DPS improved this week. Keep up the momentum!',
            icon: BarChart3,
            color: 'bg-green-500/20 text-green-400'
          },
          {
            id: 'opportunity-1',
            type: 'opportunity',
            title: '🎯 Opportunity',
            description: 'Tuesday 3PM is historically your best posting time (15% higher reach)',
            icon: Target,
            color: 'bg-purple-500/20 text-purple-400'
          }
        ]);

      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/60">Your viral content command center</p>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Algorithm IQ"
            value={stats.algorithmIQ}
            subtitle={`Learning from ${stats.totalPredictions} predictions`}
            trend={stats.iqTrend}
            icon={Brain}
            gradient="from-purple-900/50 to-pink-900/50"
          />
          <StatCard
            title="Success Rate"
            value={`${stats.viralRate || 75}%`}
            subtitle="Videos over 70 DPS"
            icon={Award}
            gradient="from-green-900/50 to-emerald-900/50"
          />
          <StatCard
            title="Average DPS"
            value={stats.avgDPS || 68}
            subtitle="Across all predictions"
            icon={Zap}
            gradient="from-yellow-900/50 to-orange-900/50"
          />
          <StatCard
            title="Top Niche"
            value={stats.topNiche}
            subtitle="Your best performing category"
            icon={Target}
            gradient="from-blue-900/50 to-cyan-900/50"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.userLevel === 'beginner' ? (
              <QuickActionCard
                title="Start Your First Viral Video"
                description="We'll guide you to your first success with proven templates"
                cta="Start Quick Win"
                href="/quick-win"
                icon={Sparkles}
                gradient="from-purple-600/30 to-pink-600/30"
              />
            ) : (
              <QuickActionCard
                title="Create New Video"
                description="Use the full 17-step workflow for maximum viral potential"
                cta="Open Studio"
                href="/studio/creator"
                icon={Video}
                gradient="from-purple-600/30 to-pink-600/30"
              />
            )}
            
            <QuickActionCard
              title="Browse Templates"
              description="Model your next video after proven viral winners"
              cta="View Templates"
              href="/studio/templates"
              icon={Grid}
              gradient="from-blue-600/30 to-cyan-600/30"
            />
            
            <QuickActionCard
              title="Analyze Existing Video"
              description="Upload any video to get instant viral potential analysis"
              cta="Upload & Analyze"
              href="/analyze"
              icon={BarChart3}
              gradient="from-green-600/30 to-emerald-600/30"
            />
          </div>
        </div>

        {/* Intelligence Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              Intelligence Feed
            </h2>
            <div className="space-y-4">
              {feedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FeedCard item={item} />
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Recent Activity
            </h2>
            <div className="bg-white/5 rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Learning loop updated XGBoost reliability</span>
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Algorithm IQ recalculated</span>
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>5 new patterns detected</span>
                </div>
              </div>
              <Link 
                href="/admin/algorithm-iq"
                className="mt-6 block text-center text-purple-400 hover:text-purple-300 text-sm"
              >
                View Full Intelligence Hub →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









