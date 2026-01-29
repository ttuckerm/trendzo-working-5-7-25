'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Award, 
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Share2,
  ThumbsUp
} from 'lucide-react';

/**
 * Demo Mode - Presentation-focused interface
 * Designed for stakeholder presentations and demonstrations
 */
export const DemoMode: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 13 Core Objectives Data
  const objectives = [
    { id: 1, title: 'Viral Content Creation', progress: 95, status: 'active' },
    { id: 2, title: 'Audience Engagement', progress: 88, status: 'active' },
    { id: 3, title: 'Content Optimization', progress: 92, status: 'active' },
    { id: 4, title: 'Analytics Integration', progress: 85, status: 'active' },
    { id: 5, title: 'Template Management', progress: 90, status: 'active' },
    { id: 6, title: 'A/B Testing Framework', progress: 78, status: 'active' },
    { id: 7, title: 'Performance Monitoring', progress: 94, status: 'active' },
    { id: 8, title: 'User Experience', progress: 87, status: 'active' },
    { id: 9, title: 'Content Distribution', progress: 83, status: 'active' },
    { id: 10, title: 'Revenue Optimization', progress: 91, status: 'active' },
    { id: 11, title: 'Market Intelligence', progress: 76, status: 'active' },
    { id: 12, title: 'Community Building', progress: 82, status: 'active' },
    { id: 13, title: 'Platform Integration', progress: 89, status: 'active' }
  ];

  const keyMetrics = [
    {
      label: 'Content Success Rate',
      value: '89.3%',
      change: '+12.5%',
      icon: TrendingUp,
      color: 'text-green-400'
    },
    {
      label: 'Active Users',
      value: '47.2K',
      change: '+2.8K',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      label: 'Engagement Rate',
      value: '94.7%',
      change: '+7.3%',
      icon: ThumbsUp,
      color: 'text-purple-400'
    },
    {
      label: 'Revenue Growth',
      value: '156%',
      change: '+23%',
      icon: Award,
      color: 'text-yellow-400'
    }
  ];

  const demoSlides = [
    {
      title: 'Platform Overview',
      subtitle: 'Complete viral content ecosystem',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {keyMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="text-center">
                  <div className={`inline-flex p-3 rounded-full bg-gray-800 mb-3`}>
                    <Icon size={24} className={metric.color} />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-400 mb-1">{metric.label}</div>
                  <div className="text-xs text-green-400">{metric.change}</div>
                </div>
              );
            })}
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Platform Highlights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-gray-300">AI-powered content optimization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <span className="text-gray-300">Real-time analytics dashboard</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <span className="text-gray-300">Advanced A/B testing framework</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  <span className="text-gray-300">Viral template library</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full" />
                  <span className="text-gray-300">Multi-platform distribution</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full" />
                  <span className="text-gray-300">Revenue optimization tools</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '13 Core Objectives',
      subtitle: 'Comprehensive platform capabilities',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {objectives.map((objective) => (
              <div key={objective.id} className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{objective.title}</span>
                  <span className="text-xs text-green-400">{objective.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${objective.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">89.2%</div>
            <div className="text-gray-400">Overall Completion Rate</div>
          </div>
        </div>
      )
    },
    {
      title: 'Real-Time Performance',
      subtitle: 'Live metrics and achievements',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center space-x-3 mb-4">
                <Eye size={24} className="text-green-400" />
                <span className="text-white font-semibold">Content Views</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">2.4M</div>
              <div className="text-green-400 text-sm">+18% this week</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-center space-x-3 mb-4">
                <Share2 size={24} className="text-blue-400" />
                <span className="text-white font-semibold">Shares</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">142K</div>
              <div className="text-blue-400 text-sm">+24% this week</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center space-x-3 mb-4">
                <Award size={24} className="text-purple-400" />
                <span className="text-white font-semibold">Revenue</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">$89.2K</div>
              <div className="text-purple-400 text-sm">+31% this month</div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Achievements</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-gray-300">🏆 Reached 1M+ views milestone</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-gray-300">🚀 Launched 5 new viral templates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-gray-300">📈 Improved engagement by 15%</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % demoSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + demoSlides.length) % demoSlides.length);
  };

  const currentSlideData = demoSlides[currentSlide];

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Demo Mode</h2>
          <p className="text-gray-400">Presentation & stakeholder view</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-1">
            <PlayCircle size={16} className="text-green-400" />
            <span className="text-sm text-gray-300">Live Demo</span>
          </div>
          <div className="text-sm text-gray-400">
            {currentSlide + 1} / {demoSlides.length}
          </div>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 bg-gray-800/30 rounded-xl border border-gray-700/30 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Slide Header */}
          <div className="p-6 border-b border-gray-700/30">
            <h3 className="text-xl font-bold text-white mb-1">{currentSlideData.title}</h3>
            <p className="text-gray-400">{currentSlideData.subtitle}</p>
          </div>
          
          {/* Slide Body */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentSlideData.content}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg
            ${currentSlide === 0 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
            }
            transition-colors
          `}
        >
          <ChevronLeft size={20} />
          <span>Previous</span>
        </button>

        {/* Slide Indicators */}
        <div className="flex space-x-2">
          {demoSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`
                w-3 h-3 rounded-full transition-colors
                ${index === currentSlide ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}
              `}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === demoSlides.length - 1}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg
            ${currentSlide === demoSlides.length - 1
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
            }
            transition-colors
          `}
        >
          <span>Next</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};