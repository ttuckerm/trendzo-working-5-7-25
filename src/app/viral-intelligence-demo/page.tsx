'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, Target, TrendingUp, BarChart3, Brain, Video, Globe } from 'lucide-react';

export default function ViralIntelligenceDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = [
    {
      id: 'scraping',
      title: 'Video Discovery',
      description: 'AI discovers viral videos across platforms',
      icon: <Video className="w-6 h-6" />,
      status: 'completed'
    },
    {
      id: 'analysis',
      title: 'Pattern Analysis',
      description: 'Identify viral frameworks and patterns',
      icon: <Brain className="w-6 h-6" />,
      status: currentStep >= 1 ? 'completed' : 'pending'
    },
    {
      id: 'approval',
      title: 'Expert Review',
      description: 'Human expert validation',
      icon: <CheckCircle className="w-6 h-6" />,
      status: currentStep >= 2 ? 'completed' : 'pending'
    },
    {
      id: 'template',
      title: 'Template Creation',
      description: 'Generate reusable templates',
      icon: <Target className="w-6 h-6" />,
      status: currentStep >= 3 ? 'completed' : 'pending'
    }
  ];

  const handleProcessNext = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    setIsProcessing(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Viral Intelligence Engine
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Watch how our AI discovers, analyzes, and converts viral content into reusable templates
          </p>
        </div>

        {/* Process Visualization */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`relative p-6 rounded-lg border-2 transition-all ${
                  step.status === 'completed'
                    ? 'border-green-500 bg-green-50'
                    : currentStep === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : currentStep === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-300"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Demo Results */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">47,392</div>
              <div className="text-sm text-gray-600">Videos Analyzed</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">1,284</div>
              <div className="text-sm text-gray-600">Templates Generated</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">89.2%</div>
              <div className="text-sm text-gray-600">Accuracy Rate</div>
            </div>
          </div>

          {/* Sample Viral Video */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Latest Viral Detection</h3>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">
                  "This morning routine changed my life in 30 days"
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span>📸 Instagram</span>
                  <span>👀 2.4M views</span>
                  <span>❤️ 185K likes</span>
                  <span>📊 Viral Score: 94/100</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Morning Routine</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Transformation</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Hook Framework</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="text-center">
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleProcessNext}
              disabled={isProcessing}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isProcessing ? 'Processing...' : `Process ${steps[currentStep + 1]?.title}`}
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Reset Demo
            </button>
          )}
        </div>

        {/* Features List */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Capabilities</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Cross-platform video discovery</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Viral pattern recognition</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Framework extraction</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Template generation</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Human Oversight</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>Expert validation process</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>Quality control checks</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>Brand safety filtering</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>Performance optimization</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}