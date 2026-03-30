'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Phase, UserSelection, TemplateData } from '../../page';

interface LabPhaseProps {
  userSelection: UserSelection;
  templateData: TemplateData;
  onTransition: (nextPhase: Phase, data?: any) => void;
}

export default function LabPhase({ userSelection, templateData, onTransition }: LabPhaseProps) {
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
  const [viralScore, setViralScore] = useState(85.2);

  const structureItems = [
    { label: 'Hook (0-3s) - Authority statement', completed: true },
    { label: 'Problem Introduction (3-8s)', completed: true },
    { label: 'Visual proof at 0:15', completed: false },
    { label: 'Solution reveal (15-25s)', completed: false },
    { label: 'Call to action (25-30s)', completed: false },
  ];

  return (
    <motion.div
      className="min-h-screen px-5 py-10"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="max-w-[1400px] mx-auto mb-12">
        <motion.div 
          className="flex items-center gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <span className="text-4xl">🔬</span>
          <h1 className="text-5xl font-bold bg-gradient-to-br from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
            The Creation Lab
          </h1>
        </motion.div>
      </div>

      {/* Three-panel layout */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Panel - Structure Checklist */}
        <motion.div
          className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-[10px]"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <h3 className="text-2xl font-semibold mb-2 text-white">
            Structure Checklist
          </h3>
          <p className="text-white/60 mb-8 text-sm">
            Essential elements for viral success
          </p>

          <div className="space-y-4">
            {structureItems.map((item, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + (index * 0.1), duration: 0.6 }}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  item.completed 
                    ? 'bg-[#00ff00] border-[#00ff00]' 
                    : 'border-white/30'
                }`}>
                  {item.completed && (
                    <span className="text-black text-xs font-bold">✓</span>
                  )}
                </div>
                <span className={`text-sm ${
                  item.completed ? 'text-white' : 'text-white/60'
                }`}>
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Center Panel - AI-Guided Creation */}
        <motion.div
          className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-[10px]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <h3 className="text-2xl font-semibold mb-2 text-white">
            AI-Guided Creation
          </h3>
          <p className="text-white/60 mb-8 text-sm">
            Real-time coaching and optimization
          </p>

          {/* Phase tabs */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((phase) => (
              <button
                key={phase}
                onClick={() => setActivePhase(phase as 1 | 2 | 3)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  activePhase === phase
                    ? 'bg-[#7b61ff] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Phase {phase}
              </button>
            ))}
          </div>

          {/* Live AI Coach */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-6">
            <h4 className="text-lg font-semibold mb-3 text-[#00ff00]">
              🤖 Live AI Coach
            </h4>
            <p className="text-sm text-white/70 leading-relaxed">
              {activePhase === 1 && "Focus on creating a strong hook that positions you as an authority. Use specific numbers or surprising statements."}
              {activePhase === 2 && "Build emotional connection by describing the problem your audience faces. Make it relatable and urgent."}
              {activePhase === 3 && "Present your solution clearly and provide proof. Include a strong call-to-action that drives engagement."}
            </p>
          </div>

          {/* Content input areas */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                {activePhase === 1 && "Hook (0-3s)"}
                {activePhase === 2 && "Problem Description (3-15s)"}
                {activePhase === 3 && "Solution & CTA (15-30s)"}
              </label>
              <textarea 
                className="w-full h-24 bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white placeholder-white/40 resize-none focus:outline-none focus:border-[#7b61ff] transition-colors"
                placeholder={
                  activePhase === 1 ? "Write your attention-grabbing hook..." :
                  activePhase === 2 ? "Describe the problem or challenge..." :
                  "Present your solution and call-to-action..."
                }
                onChange={() => {
                  // Simulate viral score update
                  setViralScore(prev => Math.min(99.9, prev + Math.random() * 2));
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Live Prediction */}
        <motion.div
          className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-[10px]"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <h3 className="text-2xl font-semibold mb-2 text-white">
            Live Prediction
          </h3>
          <p className="text-white/60 mb-8 text-sm">
            Real-time viral score updates
          </p>

          {/* Dynamic Viral Score */}
          <div className="text-center mb-8">
            <motion.div
              className="text-6xl font-bold bg-gradient-to-r from-[#00ff00] to-[#00cc00] bg-clip-text text-transparent mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {viralScore.toFixed(1)}%
            </motion.div>
            <div className="text-sm text-white/60">Virality Score</div>
          </div>

          {/* Analytics */}
          <div className="space-y-6 mb-8">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Engagement Rate</span>
                <span className="text-white">8.4%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#7b61ff] to-[#ff61a6]"
                  initial={{ width: 0 }}
                  animate={{ width: "84%" }}
                  transition={{ delay: 1.2, duration: 1.5 }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Retention Score</span>
                <span className="text-white">7.2/10</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#00ff00] to-[#00cc00]"
                  initial={{ width: 0 }}
                  animate={{ width: "72%" }}
                  transition={{ delay: 1.4, duration: 1.5 }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Platform Fit</span>
                <span className="text-white">92%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#ff4458] to-[#ff1744]"
                  initial={{ width: 0 }}
                  animate={{ width: "92%" }}
                  transition={{ delay: 1.6, duration: 1.5 }}
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            className="w-full py-4 bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] text-white font-bold rounded-2xl"
            whileHover={{
              y: -2,
              boxShadow: "0 15px 35px rgba(123, 97, 255, 0.4)"
            }}
            onClick={() => {
              // Demo completion
              alert('🎉 Content created successfully! This completes the sandbox demo.');
            }}
          >
            Generate Final Content ✨
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}