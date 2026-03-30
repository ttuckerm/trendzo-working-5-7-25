'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Target, Eye, Clock, CheckCircle } from 'lucide-react';
import { Template } from '../../page';

interface AnalysisPhaseProps {
  template: Template | null;
  analysisData: {
    viralDNA: any;
    predictions: any;
  };
  onComplete: () => void;
}

export default function AnalysisPhase({ template, analysisData, onComplete }: AnalysisPhaseProps) {
  if (!template || !analysisData.viralDNA) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/60">Loading analysis...</div>
      </div>
    );
  }

  const { viralDNA, predictions } = analysisData;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Pre-Creation Analysis
          </span>
        </h1>
        <p className="text-white/60 text-lg">
          Deep dive into viral DNA and success predictions
        </p>
      </motion.div>

      {/* Two-Panel Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Panel: Viral DNA */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-[10px] overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <span className="text-3xl">🧬</span>
              Viral DNA™
            </h2>
            <p className="text-white/60">
              Breaking down what makes this template work
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Template Preview */}
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-2xl">
                  {template.icon || '🎯'}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{template.title}</h3>
                  <p className="text-white/60 text-sm">{template.niche}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{template.views}</div>
                  <div className="text-xs text-white/60">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-pink-400">{template.likes}</div>
                  <div className="text-xs text-white/60">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-400">{template.viralScore}%</div>
                  <div className="text-xs text-white/60">Viral Score</div>
                </div>
              </div>
            </div>

            {/* Viral DNA Components */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-purple-400 mb-4">Core Components</h3>
              
              {[
                { label: 'Hook Type', value: viralDNA.hookType, icon: '🎣', color: 'text-green-400' },
                { label: 'Value Proposition', value: viralDNA.valueProposition, icon: '💎', color: 'text-blue-400' },
                { label: 'Call to Action', value: viralDNA.callToAction, icon: '📢', color: 'text-purple-400' },
                { label: 'Visual Style', value: viralDNA.visualStyle, icon: '🎨', color: 'text-pink-400' },
                { label: 'Audio Trend', value: viralDNA.audioTrend, icon: '🎵', color: 'text-orange-400' },
                { label: 'Framework', value: viralDNA.framework, icon: '⚡', color: 'text-yellow-400' }
              ].map((component, index) => (
                <motion.div
                  key={component.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.05] hover:border-white/[0.1] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{component.icon}</span>
                      <div>
                        <div className="font-semibold text-white/80">{component.label}</div>
                        <div className={`font-bold ${component.color}`}>{component.value}</div>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Predictions */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-[10px] overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <span className="text-3xl">📈</span>
              14-Day Trend Predictions
            </h2>
            <p className="text-white/60">
              Success probability and performance forecasts
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Viral Probability Score */}
            <div className="text-center bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
              <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {predictions.viralProbability}%
              </div>
              <div className="text-lg font-semibold text-purple-400 mb-1">Success Probability</div>
              <div className="text-white/60 text-sm">This content will perform exceptionally</div>
            </div>

            {/* Prediction Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] rounded-lg p-4 text-center border border-white/[0.05]">
                <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-blue-400">{predictions.predictedViews}</div>
                <div className="text-xs text-white/60">Predicted Views</div>
              </div>
              
              <div className="bg-white/[0.03] rounded-lg p-4 text-center border border-white/[0.05]">
                <Clock className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-green-400">{predictions.peakEngagement}</div>
                <div className="text-xs text-white/60">Peak Window</div>
              </div>
              
              <div className="bg-white/[0.03] rounded-lg p-4 text-center border border-white/[0.05]">
                <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-purple-400">{predictions.confidence}</div>
                <div className="text-xs text-white/60">Confidence</div>
              </div>
              
              <div className="bg-white/[0.03] rounded-lg p-4 text-center border border-white/[0.05]">
                <TrendingUp className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-orange-400">High</div>
                <div className="text-xs text-white/60">Trend Alignment</div>
              </div>
            </div>

            {/* Success Factors */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-blue-400">Success Factors</h3>
              {predictions.successFactors.map((factor: any, index: number) => (
                <motion.div
                  key={factor.factor}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]"
                >
                  <span className="text-white/80">{factor.factor}</span>
                  <span className="font-bold text-green-400">{factor.score}</span>
                </motion.div>
              ))}
            </div>

            {/* Proceed Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={onComplete}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">PROCEED TO CREATION PHASE</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}