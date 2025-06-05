'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Search, 
  CheckCircle, 
  Target, 
  Link,
  TrendingUp,
  BarChart3,
  Zap,
  Video,
  Brain,
  Users,
  Globe
} from 'lucide-react';

export default function ViralIntelligenceDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const steps = [
    {
      id: 'scraping',
      title: 'Video Scraping',
      description: 'AI discovers viral videos across platforms',
      icon: <Search className="w-6 h-6" />,
      action: 'start_scraping'
    },
    {
      id: 'analysis',
      title: 'Pattern Analysis',
      description: 'Identify viral frameworks and patterns',
      icon: <Brain className="w-6 h-6" />,
      action: 'analyze_video'
    },
    {
      id: 'approval',
      title: 'Human Approval',
      description: 'Expert review and approval queue',
      icon: <CheckCircle className="w-6 h-6" />,
      action: 'approve_video'
    },
    {
      id: 'template',
      title: 'Template Generation',
      description: 'Convert to reusable templates',
      icon: <Target className="w-6 h-6" />,
      action: 'generate_template'
    },
    {
      id: 'distribution',
      title: 'Newsletter Distribution',
      description: 'Create trackable links for campaigns',
      icon: <Link className="w-6 h-6" />,
      action: 'create_newsletter_link'
    }
  ];

  const runPipelineStep = async (stepIndex: number) => {
    setIsProcessing(true);
    setCurrentStep(stepIndex);

    try {
      const step = steps[stepIndex];
      console.log(`🚀 Running step: ${step.title}`);

      // Simulate API call to viral intelligence endpoint
      const response = await fetch('/api/viral-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: step.action,
          platform: 'instagram',
          searchTerms: ['productivity', 'morning routine'],
          hashtags: ['#viral', '#trending'],
          videoId: 'demo_video_001',
          templateId: 'tpl_demo_001',
          campaignName: 'Demo Campaign',
          reviewedBy: 'demo_admin'
        })
      });

      const result = await response.json();
      setResults(prev => ({ ...prev, [step.id]: result }));

      // Auto-advance to next step after delay
      setTimeout(() => {
        if (stepIndex < steps.length - 1) {
          runPipelineStep(stepIndex + 1);
        } else {
          setIsProcessing(false);
        }
      }, 2000);

    } catch (error) {
      console.error('Error running pipeline step:', error);
      setIsProcessing(false);
    }
  };

  const startDemo = () => {
    setResults({});
    runPipelineStep(0);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setIsProcessing(false);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-4">
            <span className="bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
              TRENDZO Viral Intelligence Engine
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Complete pipeline from viral video discovery to template distribution
          </p>
          
          {!isProcessing && !results && (
            <button
              onClick={startDemo}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-semibold text-white hover:from-purple-700 hover:to-pink-600 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
            >
              <Play className="w-5 h-5" />
              Start Intelligence Pipeline Demo
            </button>
          )}

          {results && !isProcessing && (
            <button
              onClick={resetDemo}
              className="px-6 py-3 bg-gray-700 rounded-xl font-semibold text-white hover:bg-gray-600 transition-all"
            >
              Reset Demo
            </button>
          )}
        </div>

        {/* Pipeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                currentStep === index
                  ? 'border-purple-500 bg-purple-500/20'
                  : currentStep > index
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-white/20 bg-white/5'
              }`}
            >
              {/* Step Number */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-4 ${
                currentStep === index
                  ? 'bg-purple-500 text-white'
                  : currentStep > index
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}>
                {currentStep > index ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>

              {/* Step Icon */}
              <div className={`mb-3 ${
                currentStep === index
                  ? 'text-purple-400'
                  : currentStep > index
                  ? 'text-green-400'
                  : 'text-gray-400'
              }`}>
                {step.icon}
              </div>

              {/* Step Content */}
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400">{step.description}</p>

              {/* Processing Animation */}
              {currentStep === index && isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-purple-500/20 rounded-2xl">
                  <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className={`absolute top-1/2 -right-3 w-6 h-0.5 ${
                  currentStep > index ? 'bg-green-500' : 'bg-gray-600'
                }`}></div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Results Section */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Pipeline Results */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                Pipeline Results
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Scraping Results */}
                {results.scraping && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="w-5 h-5 text-green-400" />
                      <h3 className="font-semibold">Scraping Complete</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Job ID:</span>
                        <span className="text-green-400">{results.scraping.jobId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform:</span>
                        <span>Instagram</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-green-400">Started</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Results */}
                {results.analysis && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold">Pattern Analysis</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Viral Score:</span>
                        <span className="text-purple-400">{results.analysis.analysis?.overallViralScore || 'N/A'}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Potential:</span>
                        <span className="text-purple-400 capitalize">{results.analysis.viralPotential || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Patterns:</span>
                        <span>{results.analysis.patterns || 0} found</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Template Results */}
                {results.template && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-orange-400" />
                      <h3 className="font-semibold">Template Generated</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Template ID:</span>
                        <span className="text-orange-400">{results.template.template?.id?.slice(-8) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Framework:</span>
                        <span>{results.template.template?.structure?.framework || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sections:</span>
                        <span>{results.template.template?.structure?.sections || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
                System Performance
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Video className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                  <div className="text-2xl font-bold text-blue-400">1,247</div>
                  <div className="text-sm text-gray-400">Videos Analyzed</div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-2xl font-bold text-purple-400">89</div>
                  <div className="text-sm text-gray-400">Templates Created</div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <div className="text-2xl font-bold text-green-400">2,384</div>
                  <div className="text-sm text-gray-400">Active Users</div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Globe className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                  <div className="text-2xl font-bold text-orange-400">73.2%</div>
                  <div className="text-sm text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>

            {/* API Response Details */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Zap className="w-6 h-6 text-yellow-400" />
                Live API Responses
              </h2>
              
              <div className="bg-black/50 rounded-xl p-4 overflow-x-auto">
                <pre className="text-sm text-green-400">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}

        {/* Features Overview */}
        <div className="mt-12 bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Complete Viral Intelligence System
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">AI Pattern Recognition</h3>
              <p className="text-sm text-gray-400">
                Advanced algorithms identify viral patterns and frameworks from successful content
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Template Generation</h3>
              <p className="text-sm text-gray-400">
                Convert viral videos into reusable, customizable templates for any industry
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Performance Tracking</h3>
              <p className="text-sm text-gray-400">
                Comprehensive analytics and tracking for templates and campaigns
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}