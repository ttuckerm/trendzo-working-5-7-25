'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Clock, Target, TrendingUp, ArrowRight, Lightbulb, CheckCircle } from 'lucide-react';
import { ViralStudioState } from '../../page';

interface LabPhase2Props {
  state: ViralStudioState;
  updateState: (updates: Partial<ViralStudioState>) => void;
  onComplete: () => void;
}

export default function LabPhase2({ state, updateState, onComplete }: LabPhase2Props) {
  const [hookPower, setHookPower] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Animate hook power meter on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimating(true);
      let power = 0;
      const targetPower = 85;
      
      const interval = setInterval(() => {
        power += 2;
        setHookPower(power);
        
        if (power >= targetPower) {
          clearInterval(interval);
          setAnimating(false);
          updateState({
            labPhase2: {
              ...state.labPhase2,
              hookPower: targetPower
            }
          });
        }
      }, 50);

      return () => clearInterval(interval);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Framework recommendations based on selected niche
  const frameworkRecommendations = {
    'Personal Finance/Investing': {
      framework: 'Authority Hook',
      reason: 'Perfect for building trust with financial advice',
      confidence: '94%'
    },
    'Fitness/Weight Loss': {
      framework: 'Transform Story',
      reason: 'Showcases visible results and journeys',
      confidence: '91%'
    },
    default: {
      framework: 'Quick Tips',
      reason: 'Universal appeal across all niches',
      confidence: '89%'
    }
  };

  const currentRecommendation = frameworkRecommendations[state.selectedNiche as keyof typeof frameworkRecommendations] || frameworkRecommendations.default;

  // Retention data points
  const retentionData = [
    { time: '0-3s', retention: 95, critical: true },
    { time: '3-5s', retention: 78, critical: true },
    { time: '5-10s', retention: 65, critical: false },
    { time: '10-15s', retention: 52, critical: false },
    { time: '15-20s', retention: 41, critical: false },
    { time: '20-30s', retention: 33, critical: false }
  ];

  // AI insights
  const aiInsights = [
    'Hook strength is optimal for your niche audience',
    'Consider adding a surprising statistic in first 3 seconds',
    'Your selected framework has 94% success rate in similar content',
    'Optimal posting time identified for maximum reach'
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Three-Panel Grid Layout */}
      <div className="h-screen grid grid-cols-[420px_1fr_460px] gap-6 p-6 overflow-hidden">
        
        {/* Left Panel: Performance Analysis */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/[0.04] border border-white/[0.1] rounded-xl backdrop-blur-[10px] flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="text-lg font-bold mb-1">Performance Analysis</h3>
            <p className="text-sm text-white/60">First 3 seconds + retention breakdown</p>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Hook Power Meter */}
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 text-orange-400 font-bold text-xl mb-5">
                <span>🔥</span>
                <span>First 3 Seconds Power</span>
              </div>
              
              {/* Power Meter Bar */}
              <div className="relative w-full h-15 bg-white/[0.05] rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full relative"
                  initial={{ width: '0%' }}
                  animate={{ width: `${hookPower}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-lg">
                  {hookPower}% Scroll-Stop Power
                </div>
              </div>
              
              <div className="text-sm text-white/60 text-center">
                This hook has 85% probability of stopping scrollers in YOUR niche
              </div>
            </div>

            {/* Retention Breakdown */}
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span>Retention Analysis</span>
              </h4>
              
              <div className="space-y-3">
                {retentionData.map((point, index) => (
                  <motion.div
                    key={point.time}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      point.critical ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{point.time}</span>
                      {point.critical && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">CRITICAL</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            point.retention > 70 ? 'bg-green-400' : 
                            point.retention > 50 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${point.retention}%` }}
                        />
                      </div>
                      <span className="font-bold text-sm w-10">{point.retention}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Analysis Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] rounded-lg p-4 text-center">
                <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-lg font-bold">{state.videosAnalyzed.toLocaleString()}</div>
                <div className="text-xs text-white/60">Videos Analyzed</div>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-4 text-center">
                <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-lg font-bold">94%</div>
                <div className="text-xs text-white/60">Pattern Confidence</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center Panel: Creator Fingerprint */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.04] border border-white/[0.1] rounded-xl backdrop-blur-[10px] flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="text-lg font-bold mb-1">Creator Fingerprint</h3>
            <p className="text-sm text-white/60">Personalized framework & AI guidance</p>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Best Framework Recommendation */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 text-purple-400 font-bold text-xl mb-5">
                <span>🎯</span>
                <span>Best Framework for YOU</span>
              </div>
              
              <div className="bg-white/[0.05] rounded-lg p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">{currentRecommendation.framework}</h4>
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {currentRecommendation.confidence} match
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-4">{currentRecommendation.reason}</p>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-semibold">Optimized for {state.selectedNiche}</span>
                </div>
              </div>
              
              <motion.button
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Apply This Framework
              </motion.button>
            </div>

            {/* Real-Time AI Guidance */}
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
              <div className="flex items-center gap-3 font-bold text-lg mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <span>Real-Time AI Guidance</span>
              </div>
              
              <div className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.2 }}
                    className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-lg"
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0"></div>
                    <span className="text-sm text-white/80">{insight}</span>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>AI Confidence: 94% success prediction</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Success Validation */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.04] border border-white/[0.1] rounded-xl backdrop-blur-[10px] flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="text-lg font-bold mb-1">Success Validation</h3>
            <p className="text-sm text-white/60">Final confirmation before creation</p>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Success Rate Display */}
            <div className="text-center mb-6">
              <div className="text-sm text-white/60 uppercase tracking-wider mb-2">
                Success Rate
              </div>
              <div className="text-5xl font-black bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                {currentRecommendation.confidence}
              </div>
              <div className="text-lg font-bold text-green-400 mt-2">
                High confidence prediction
              </div>
            </div>

            {/* Optimal Post Time */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-3 text-purple-400 font-bold text-lg mb-4">
                <Clock className="w-5 h-5" />
                <span>Optimal Post Time</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { time: 'Today 7:00 PM', optimal: true },
                  { time: 'Tomorrow 12:00 PM', optimal: false },
                  { time: 'Tomorrow 7:00 PM', optimal: false },
                  { time: 'Thursday 5:00 PM', optimal: false }
                ].map((slot, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-center text-sm transition-all ${
                      slot.optimal
                        ? 'bg-green-500/20 border border-green-500/40 text-green-400 font-bold scale-105'
                        : 'bg-white/[0.05] text-white/60'
                    }`}
                  >
                    {slot.time}
                  </div>
                ))}
              </div>
            </div>

            {/* System Insights */}
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 mb-6">
              <h4 className="font-bold text-lg mb-3">System Insights</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Audience Alignment</span>
                  <span className="text-green-400 font-bold">Excellent</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Trending Compatibility</span>
                  <span className="text-blue-400 font-bold">High</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Competition Level</span>
                  <span className="text-yellow-400 font-bold">Medium</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Viral Potential</span>
                  <span className="text-purple-400 font-bold">Very High</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="p-6 border-t border-white/10 bg-white/[0.02] shrink-0">
            <motion.button
              onClick={onComplete}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:from-green-600 hover:to-blue-600 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">START CREATING</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}