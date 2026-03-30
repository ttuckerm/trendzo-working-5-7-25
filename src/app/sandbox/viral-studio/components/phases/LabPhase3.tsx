'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Save, Rocket, Lightbulb, Target, TrendingUp } from 'lucide-react';
import { ViralStudioState } from '../../page';

interface LabPhase3Props {
  state: ViralStudioState;
  updateState: (updates: Partial<ViralStudioState>) => void;
}

export default function LabPhase3({ state, updateState }: LabPhase3Props) {
  const [contentInputs, setContentInputs] = useState({
    hook: '',
    authority: '',
    valuePoints: ['', '', '']
  });
  const [liveScore, setLiveScore] = useState(60);
  const [strokeDashoffset, setStrokeDashoffset] = useState(377);

  // Success pattern checklist
  const checklist = [
    { 
      id: 'hook', 
      label: 'Hook (0-3s)', 
      description: 'Authority statement or shocking statistic',
      completed: contentInputs.hook.length > 10,
      critical: true
    },
    { 
      id: 'authority', 
      label: 'Credibility Signal (3-5s)', 
      description: 'Establish expertise and trust',
      completed: contentInputs.authority.length > 5,
      critical: true
    },
    { 
      id: 'value1', 
      label: 'Value Point 1 (5-10s)', 
      description: 'First game-changing insight',
      completed: contentInputs.valuePoints[0].length > 5,
      critical: false
    },
    { 
      id: 'value2', 
      label: 'Value Point 2 (10-15s)', 
      description: 'Second powerful method',
      completed: contentInputs.valuePoints[1].length > 5,
      critical: false
    },
    { 
      id: 'value3', 
      label: 'Value Point 3 (15-20s)', 
      description: 'Third proven technique',
      completed: contentInputs.valuePoints[2].length > 5,
      critical: false
    },
    { 
      id: 'cta', 
      label: 'Call-to-Action (20-25s)', 
      description: 'Clear next step for viewers',
      completed: true, // Always completed for demo
      critical: false
    }
  ];

  // Live viral scoring algorithm
  const calculateViralScore = useCallback(() => {
    let score = 60; // Base score

    // Hook analysis (up to +15 points)
    if (contentInputs.hook.length > 10) score += 5;
    if (contentInputs.hook.length > 20) score += 5;
    if (contentInputs.hook.includes('?')) score += 3; // Questions are engaging
    if (/\d/.test(contentInputs.hook)) score += 2; // Numbers add authority

    // Authority analysis (up to +10 points)
    if (contentInputs.authority.length > 5) score += 3;
    if (contentInputs.authority.toLowerCase().includes('expert') || 
        contentInputs.authority.toLowerCase().includes('certified') ||
        contentInputs.authority.toLowerCase().includes('years')) score += 4;
    if (contentInputs.authority.length > 15) score += 3;

    // Value points analysis (up to +15 points)
    const filledValuePoints = contentInputs.valuePoints.filter(point => point.length > 5).length;
    score += filledValuePoints * 5;

    // Bonus for completion
    const completedItems = checklist.filter(item => item.completed).length;
    if (completedItems >= 5) score += 5; // Completion bonus

    return Math.min(score, 95); // Cap at 95%
  }, [contentInputs, checklist]);

  // Update live score when inputs change
  useEffect(() => {
    const newScore = calculateViralScore();
    setLiveScore(newScore);

    // Update SVG circle animation
    const circumference = 2 * Math.PI * 80; // r=80
    const offset = circumference - (newScore / 100 * circumference);
    setStrokeDashoffset(offset);

    // Update global state
    updateState({
      labPhase3: {
        ...state.labPhase3,
        contentInputs,
        liveScore: newScore
      }
    });
  }, [contentInputs, calculateViralScore, updateState, state.labPhase3]);

  const handleInputChange = (field: string, value: string, index?: number) => {
    if (field === 'valuePoints' && index !== undefined) {
      const newValuePoints = [...contentInputs.valuePoints];
      newValuePoints[index] = value;
      setContentInputs(prev => ({ ...prev, valuePoints: newValuePoints }));
    } else {
      setContentInputs(prev => ({ ...prev, [field]: value }));
    }
  };

  // AI suggestions based on input
  const getAISuggestion = (field: string) => {
    const suggestions = {
      hook: "Try starting with a shocking statistic or contrarian viewpoint",
      authority: "Mention your credentials, years of experience, or notable achievements",
      value1: "Share your most powerful and counterintuitive insight",
      value2: "Provide a specific technique or method that gets results",
      value3: "Include a lesser-known tip that experts use"
    };
    return suggestions[field as keyof typeof suggestions];
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Three-Panel Grid Layout */}
      <div className="h-screen grid grid-cols-[420px_1fr_460px] gap-6 p-6 overflow-hidden">
        
        {/* Left Panel: Structure Checklist */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/[0.04] border border-white/[0.1] rounded-xl backdrop-blur-[10px] flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="text-lg font-bold mb-1">Structure Checklist</h3>
            <p className="text-sm text-white/60">Success pattern framework</p>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Progress Overview */}
            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-green-400">Creation Progress</h4>
                <div className="text-2xl font-black text-green-400">
                  {checklist.filter(item => item.completed).length}/{checklist.length}
                </div>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${(checklist.filter(item => item.completed).length / checklist.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border transition-all ${
                    item.completed 
                      ? 'bg-green-500/20 border-green-500/50' 
                      : item.critical 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-white/[0.03] border-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      item.completed ? 'bg-green-500' : 'bg-white/10'
                    }`}>
                      {item.completed ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-2 h-2 bg-white/40 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-1 flex items-center gap-2">
                        {item.label}
                        {item.critical && !item.completed && (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">CRITICAL</span>
                        )}
                      </div>
                      <div className="text-sm text-white/60">{item.description}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Progress Timer */}
            <div className="mt-6 p-4 bg-white/[0.03] rounded-lg border border-white/[0.05]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold">Creation Time</span>
                </div>
                <div className="text-sm text-blue-400 font-bold">3:42</div>
              </div>
              <div className="text-xs text-white/60 mt-1">
                2x faster than typical content creation
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center Panel: AI-Guided Creation */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.04] border border-white/[0.1] rounded-xl backdrop-blur-[10px] flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="text-lg font-bold mb-1">AI-Guided Creation</h3>
            <p className="text-sm text-white/60">Smart input fields with real-time optimization</p>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Live AI Coach */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-3 text-blue-400 font-bold text-lg mb-3">
                <Lightbulb className="w-5 h-5" />
                <span>Live AI Coach</span>
              </div>
              <div className="text-sm text-white/80">
                💡 <strong>Real-time tip:</strong> Your hook is strong! Consider adding a specific number or statistic to increase authority and scroll-stopping power.
              </div>
            </div>

            {/* Hook Section */}
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">1</span>
                  <span className="font-bold text-lg">Hook</span>
                </div>
                <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                  AI: Stop the scroll
                </div>
              </div>
              
              <label className="block text-sm font-bold text-blue-400 mb-2 uppercase tracking-wide">
                Opening Hook (0-3 seconds)
              </label>
              <input
                type="text"
                value={contentInputs.hook}
                onChange={(e) => handleInputChange('hook', e.target.value)}
                placeholder="Start with a shocking statistic or question..."
                className="w-full p-4 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
              <div className="text-xs text-white/50 mt-2">
                💡 {getAISuggestion('hook')}
              </div>
            </div>

            {/* Authority Section */}
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6">
              <label className="block text-sm font-bold text-blue-400 mb-2 uppercase tracking-wide">
                Credibility Signal
              </label>
              <input
                type="text"
                value={contentInputs.authority}
                onChange={(e) => handleInputChange('authority', e.target.value)}
                placeholder="As a certified expert with..."
                className="w-full p-4 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
              <div className="text-xs text-white/50 mt-2">
                💡 {getAISuggestion('authority')}
              </div>
            </div>

            {/* Value Points Section */}
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">2</span>
                  <span className="font-bold text-lg">Value Points</span>
                </div>
                <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                  AI: Maximize retention
                </div>
              </div>
              
              {[1, 2, 3].map((num, index) => (
                <div key={num} className="mb-4">
                  <label className="block text-sm font-bold text-blue-400 mb-2 uppercase tracking-wide">
                    Value Point {num}
                  </label>
                  <input
                    type="text"
                    value={contentInputs.valuePoints[index]}
                    onChange={(e) => handleInputChange('valuePoints', e.target.value, index)}
                    placeholder={
                      num === 1 ? "First game-changing tip..." : 
                      num === 2 ? "Second powerful insight..." : 
                      "Third proven method..."
                    }
                    className="w-full p-4 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Live Predictions */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.04] border border-white/[0.1] rounded-xl backdrop-blur-[10px] flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="text-lg font-bold mb-1">Live Success Prediction</h3>
            <p className="text-sm text-white/60">Real-time viral scoring</p>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Live Viral Score Circle */}
            <div className="text-center bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-xl p-8 mb-6">
              <div className="w-48 h-48 mx-auto mb-6 relative">
                <svg width="192" height="192" className="transform -rotate-90">
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={502.655}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl font-black bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
                    {liveScore}
                  </div>
                </div>
              </div>
              
              <div className="text-lg text-white/60 mb-2">Viral Score</div>
              <div className="text-lg font-bold text-green-400">
                This will succeed with {Math.min(liveScore + 4, 95)}% confidence
              </div>
            </div>

            {/* Launch Window */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-5 mb-6">
              <div className="flex items-center gap-3 text-purple-400 font-bold text-lg mb-4">
                <Rocket className="w-5 h-5" />
                <span>Launch Window</span>
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

            {/* Final Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/[0.03] rounded-lg p-5 text-center">
                <div className="text-2xl font-black text-purple-400 mb-2">1.25M</div>
                <div className="text-xs text-white/60 uppercase tracking-wider">Predicted Views</div>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-5 text-center">
                <div className="text-2xl font-black text-purple-400 mb-2">13.2%</div>
                <div className="text-xs text-white/60 uppercase tracking-wider">Engagement Rate</div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="p-6 border-t border-white/10 bg-white/[0.02] flex gap-4 shrink-0">
            <button className="flex-1 py-4 px-6 border border-white/10 bg-white/10 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-white/15 transition-all">
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>
            <button className="flex-1 py-4 px-6 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:from-red-600 hover:to-orange-600 transition-all">
              <Rocket className="w-4 h-4" />
              <span>Publish Now</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}