'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleStatus {
  id: string;
  name: string;
  status: 'active' | 'processing' | 'error' | 'idle';
  accuracy?: number;
  processed: number;
  lastUpdate: string;
}

interface PredictionMetrics {
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  videosAnalyzed: number;
  systemUptime: number;
}

export default function ViralPredictionDashboard() {
  const [metrics, setMetrics] = useState<PredictionMetrics>({
    accuracy: 92.3,
    totalPredictions: 1847,
    correctPredictions: 1704,
    videosAnalyzed: 24891,
    systemUptime: 99.7
  });

  const [modules, setModules] = useState<ModuleStatus[]>([
    { id: 'tiktok-scraper', name: 'TikTok Scraper', status: 'active', processed: 5247, lastUpdate: '2 min ago' },
    { id: 'viral-analyzer', name: 'Viral Pattern Analyzer', status: 'active', accuracy: 94.1, processed: 1892, lastUpdate: '1 min ago' },
    { id: 'template-discovery', name: 'Template Discovery Engine', status: 'processing', processed: 847, lastUpdate: '30 sec ago' },
    { id: 'draft-analyzer', name: 'Draft Video Analyzer', status: 'active', accuracy: 89.7, processed: 234, lastUpdate: '15 sec ago' },
    { id: 'script-intelligence', name: 'Script Intelligence Module', status: 'active', accuracy: 91.2, processed: 1456, lastUpdate: '45 sec ago' },
    { id: 'recipe-generator', name: 'Recipe Book Generator', status: 'active', processed: 45, lastUpdate: '3 min ago' },
    { id: 'prediction-engine', name: 'Prediction Engine', status: 'active', accuracy: 92.8, processed: 2847, lastUpdate: '20 sec ago' },
    { id: 'performance-validator', name: 'Performance Validator', status: 'active', accuracy: 95.1, processed: 1204, lastUpdate: '1 min ago' },
    { id: 'marketing-creator', name: 'Marketing Content Creator', status: 'processing', processed: 12, lastUpdate: '4 min ago' },
    { id: 'dashboard-aggregator', name: 'Dashboard Aggregator', status: 'active', processed: 847, lastUpdate: 'live' },
    { id: 'health-monitor', name: 'System Health Monitor', status: 'active', processed: 99, lastUpdate: 'live' },
    { id: 'process-intelligence', name: 'Process Intelligence Layer', status: 'active', processed: 1547, lastUpdate: '30 sec ago' }
  ]);

  const [recipeBook, setRecipeBook] = useState({
    hot: [
      { name: 'Authority Hook Framework', successRate: 87.3, uses: 234 },
      { name: 'POV Trending Format', successRate: 84.1, uses: 189 },
      { name: 'Transform Story Arc', successRate: 82.9, uses: 156 }
    ],
    cooling: [
      { name: 'Quick Tips Carousel', successRate: 67.4, uses: 89 },
      { name: 'Behind Scenes Reveal', successRate: 64.2, uses: 67 }
    ],
    new: [
      { name: 'AI Prediction Showcase', successRate: 0, uses: 3 },
      { name: 'Algorithm Beat Pattern', successRate: 0, uses: 1 }
    ]
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        videosAnalyzed: prev.videosAnalyzed + Math.floor(Math.random() * 5) + 1,
        totalPredictions: prev.totalPredictions + Math.floor(Math.random() * 3),
        correctPredictions: prev.correctPredictions + Math.floor(Math.random() * 3)
      }));

      setModules(prev => prev.map(module => ({
        ...module,
        processed: module.processed + Math.floor(Math.random() * 10) + 1
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 overflow-auto">
      {/* Header with Live Accuracy */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent">
            TRENDZO VIRAL PREDICTION SYSTEM
          </h1>
          <div className="text-right">
            <div className="text-sm text-gray-400">SYSTEM STATUS</div>
            <div className="text-2xl font-bold text-green-400">OPERATIONAL</div>
          </div>
        </div>

        {/* Live Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div 
            className="bg-gradient-to-r from-green-600 to-green-400 p-4 rounded-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-3xl font-bold">{metrics.accuracy.toFixed(1)}%</div>
            <div className="text-sm opacity-90">PREDICTION ACCURACY</div>
            <div className="text-xs mt-1">{metrics.correctPredictions}/{metrics.totalPredictions} correct</div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-r from-blue-600 to-blue-400 p-4 rounded-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            <div className="text-3xl font-bold">{metrics.videosAnalyzed.toLocaleString()}+</div>
            <div className="text-sm opacity-90">VIDEOS ANALYZED</div>
            <div className="text-xs mt-1">24/7 Processing</div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-r from-purple-600 to-purple-400 p-4 rounded-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            <div className="text-3xl font-bold">{metrics.systemUptime}%</div>
            <div className="text-sm opacity-90">SYSTEM UPTIME</div>
            <div className="text-xs mt-1">Last 30 days</div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-r from-pink-600 to-pink-400 p-4 rounded-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          >
            <div className="text-3xl font-bold">{recipeBook.hot.length + recipeBook.cooling.length + recipeBook.new.length}</div>
            <div className="text-sm opacity-90">ACTIVE TEMPLATES</div>
            <div className="text-xs mt-1">Recipe Book</div>
          </motion.div>
        </div>
      </motion.div>

      {/* 12 Module Status Grid */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></span>
          12-MODULE AUTOMATED PIPELINE
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(module.status)}`}></div>
                <span className="text-xs text-gray-400">{module.lastUpdate}</span>
              </div>
              
              <h3 className="font-semibold text-sm mb-2">{module.name}</h3>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Processed:</span>
                  <span className="text-blue-400">{module.processed.toLocaleString()}</span>
                </div>
                {module.accuracy && (
                  <div className="flex justify-between text-xs">
                    <span>Accuracy:</span>
                    <span className="text-green-400">{module.accuracy}%</span>
                  </div>
                )}
                <div className="text-xs capitalize text-gray-400">
                  Status: <span className={`${module.status === 'active' ? 'text-green-400' : module.status === 'processing' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {module.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recipe Book Section */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="w-3 h-3 bg-orange-400 rounded-full mr-3 animate-pulse"></span>
          DAILY VIRAL RECIPE BOOK
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* HOT Templates */}
          <div className="bg-gradient-to-b from-red-900/30 to-red-900/10 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-red-400 font-bold mb-3 flex items-center">
              🔥 HOT (&gt;80% Success)
            </h3>
            {recipeBook.hot.map((template, index) => (
              <div key={index} className="mb-3 p-3 bg-black/30 rounded border border-red-500/20">
                <div className="font-medium text-sm">{template.name}</div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-red-400">{template.successRate}% success</span>
                  <span className="text-gray-400">{template.uses} uses</span>
                </div>
              </div>
            ))}
          </div>

          {/* COOLING Templates */}
          <div className="bg-gradient-to-b from-yellow-900/30 to-yellow-900/10 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-yellow-400 font-bold mb-3 flex items-center">
              🔶 COOLING (50-80% Success)
            </h3>
            {recipeBook.cooling.map((template, index) => (
              <div key={index} className="mb-3 p-3 bg-black/30 rounded border border-yellow-500/20">
                <div className="font-medium text-sm">{template.name}</div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-yellow-400">{template.successRate}% success</span>
                  <span className="text-gray-400">{template.uses} uses</span>
                </div>
              </div>
            ))}
          </div>

          {/* NEW Templates */}
          <div className="bg-gradient-to-b from-blue-900/30 to-blue-900/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-bold mb-3 flex items-center">
              ✨ NEW (&lt;10 Uses)
            </h3>
            {recipeBook.new.map((template, index) => (
              <div key={index} className="mb-3 p-3 bg-black/30 rounded border border-blue-500/20">
                <div className="font-medium text-sm">{template.name}</div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-blue-400">Emerging</span>
                  <span className="text-gray-400">{template.uses} uses</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bottom Actions */}
      <motion.div 
        className="flex gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
          Launch Viral Studio
        </button>
        <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all">
          View Full Analytics
        </button>
        <button className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all">
          System Health Report
        </button>
      </motion.div>
    </div>
  );
}