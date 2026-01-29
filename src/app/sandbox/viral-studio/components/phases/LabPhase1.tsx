'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Target, Save, ArrowRight, Zap, Copy } from 'lucide-react';
import { ViralStudioState } from '../../page';

interface LabPhase1Props {
  state: ViralStudioState;
  updateState: (updates: Partial<ViralStudioState>) => void;
  onComplete: () => void;
}

export default function LabPhase1({ state, updateState, onComplete }: LabPhase1Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(283); // 4:43 countdown

  // Templates data
  const templates = [
    { 
      id: 'authority', 
      icon: '🎯', 
      name: 'Authority Hook', 
      rate: '94% success rate for YOU', 
      time: '15 second setup' 
    },
    { 
      id: 'pov', 
      icon: '📱', 
      name: 'POV Trending', 
      rate: '89% success rate for YOU', 
      time: '20 second setup' 
    },
    { 
      id: 'quick-tips', 
      icon: '💡', 
      name: 'Quick Tips', 
      rate: '92% success rate for YOU', 
      time: '10 second setup' 
    },
    { 
      id: 'transformation', 
      icon: '✨', 
      name: 'Transform Story', 
      rate: '87% success rate for YOU', 
      time: '25 second setup' 
    }
  ];

  // Success factors data
  const successFactors = [
    { factor: 'YOUR Audience Match', score: '94%' },
    { factor: 'Trending Audio Sync', score: '91%' },
    { factor: 'Optimal Timing', score: '87%' },
    { factor: 'Hook Strength', score: '92%' }
  ];

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 283);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    updateState({
      selectedFramework: templateId,
      viralScore: templateId === 'authority' ? 94 : templateId === 'pov' ? 89 : templateId === 'quick-tips' ? 92 : 87
    });
  };

  const handleQuickClone = () => {
    // Simulate quick clone with 3-second delay
    setTimeout(() => {
      onComplete();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Three-Panel Grid Layout */}
      <div className="h-screen grid grid-cols-[420px_1fr_460px] gap-6 p-6 overflow-hidden">
        
        {/* Left Panel: Future Viral Vault */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/[0.04] border border-white/[0.1] rounded-xl backdrop-blur-[10px] flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="text-lg font-bold mb-1">Future Viral Vault</h3>
            <p className="text-sm text-white/60">14-day predictions proving system intelligence</p>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {/* 14-Day Predictions */}
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 text-purple-400 font-bold text-xl">
                  <span>🔮</span>
                  <span>Next 14 Days</span>
                </div>
                <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                  Updating in {formatTime(timeRemaining)}
                </div>
              </div>
              
              <div className="bg-white/[0.05] border border-white/[0.1] rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold">POV: Workout Routines</div>
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    ↗ +340%
                  </div>
                </div>
                <div className="text-sm text-white/60 mb-4">
                  Algorithm shift detected. POV format exploding in fitness niche within 72 hours.
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Predicted Views', value: '2.4M' },
                    { label: 'Confidence', value: '94%' },
                    { label: 'Peak Window', value: '72h' }
                  ].map((metric, index) => (
                    <div key={metric.label} className="text-center">
                      <div className="text-2xl font-black bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
                        {metric.value}
                      </div>
                      <div className="text-xs text-white/40 uppercase tracking-wider">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trend Alerts Toggle */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-5 flex items-center justify-between">
              <div>
                <div className="font-bold">Trend Alerts for YOUR niche</div>
                <div className="text-sm text-white/60">Get notified 24h before trends spike</div>
              </div>
              <div className="w-14 h-7 bg-purple-500 rounded-full relative cursor-pointer">
                <div className="absolute w-6 h-6 bg-white rounded-full top-0.5 right-0.5 transition-all duration-200"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center Panel: Proven Templates */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.04] border border-white/[0.1] rounded-xl backdrop-blur-[10px] flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="text-lg font-bold mb-1">Proven Templates</h3>
            <p className="text-sm text-white/60">Streamlined templates that work for YOUR audience</p>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {/* One-Click Success Section */}
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 font-bold text-xl">
                  <span>⚡</span>
                  <span>One-Click Success</span>
                </div>
                <div className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                  Expires in 4:23
                </div>
              </div>
              
              {/* Templates Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`relative bg-white/[0.05] border rounded-lg p-5 cursor-pointer text-center transition-all duration-200 ${
                      selectedTemplate === template.id 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-white/[0.1] hover:border-purple-500 hover:bg-white/[0.08]'
                    }`}
                    whileHover={{ 
                      scale: selectedTemplate !== template.id ? 1.05 : 1,
                      y: selectedTemplate !== template.id ? -3 : 0 
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-4xl mb-3">{template.icon}</div>
                    <div className="font-bold mb-2">{template.name}</div>
                    <div className="text-sm text-green-400 font-bold mb-1">{template.rate}</div>
                    <div className="text-xs text-white/60">{template.time}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Clone Section */}
            <div className="bg-gradient-to-br from-green-500/10 to-purple-500/10 border-2 border-green-500/30 rounded-xl p-5 text-center">
              <div className="font-bold text-lg text-green-400 mb-3 flex items-center justify-center gap-2">
                <span>🚀</span>
                <span>Quick Clone Selected Video</span>
              </div>
              <div className="text-sm text-white/60 mb-5">
                Our AI has analyzed this video's viral DNA. One click to adapt it perfectly for YOUR niche.
              </div>
              <motion.button
                onClick={handleQuickClone}
                disabled={!selectedTemplate}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                  selectedTemplate
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
                whileHover={selectedTemplate ? { scale: 1.02 } : {}}
                whileTap={selectedTemplate ? { scale: 0.98 } : {}}
              >
                <Copy className="w-5 h-5" />
                <span>Clone & Customize (30 seconds)</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Success Predictions */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.04] border border-white/[0.1] rounded-xl backdrop-blur-[10px] flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="text-lg font-bold mb-1">YOUR Success Predictions</h3>
            <p className="text-sm text-white/60">Concrete forecasts based on YOUR patterns</p>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Viral Probability Score */}
            <div className="text-center mb-8">
              <div className="mb-6">
                <div className="text-sm text-white/60 uppercase tracking-wider mb-2">
                  Viral Probability
                </div>
                <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {state.viralScore}%
                </div>
                <div className="text-lg font-bold text-purple-400 mt-3">
                  This will go viral
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/[0.03] rounded-lg p-6 text-center">
                  <div className="text-2xl font-black text-purple-400">1.25M</div>
                  <div className="text-xs text-white/60 uppercase tracking-wider">Predicted Views</div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-6 text-center">
                  <div className="text-2xl font-black text-purple-400">{state.viralScore}%</div>
                  <div className="text-xs text-white/60 uppercase tracking-wider">Success Chance</div>
                </div>
              </div>
            </div>

            {/* Success Factors */}
            <div className="bg-white/[0.03] rounded-lg p-5 mb-6">
              {successFactors.map((item, index) => (
                <div
                  key={item.factor}
                  className={`flex justify-between items-center py-3 ${
                    index < successFactors.length - 1 ? 'border-b border-white/[0.05]' : ''
                  }`}
                >
                  <span className="font-semibold text-sm">{item.factor}</span>
                  <span className="font-bold text-green-400">{item.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="p-6 border-t border-white/10 bg-white/[0.02] flex gap-4 shrink-0">
            <button className="flex-1 py-4 px-6 border border-white/10 bg-white/10 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-white/15 transition-all">
              <Save className="w-4 h-4" />
              <span>Save Prediction</span>
            </button>
            <button
              onClick={onComplete}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:from-red-600 hover:to-orange-600 transition-all"
            >
              <Target className="w-4 h-4" />
              <span>Validate Strategy</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}