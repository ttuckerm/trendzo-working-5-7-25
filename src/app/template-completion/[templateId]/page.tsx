'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Download, 
  Share, 
  Heart,
  MessageCircle,
  Upload,
  Star,
  Crown,
  Zap,
  ArrowRight,
  Gift
} from 'lucide-react';
import { CreatorAttributionModal } from '@/components/creator/CreatorAttributionModal';

interface TemplateCompletion {
  templateId: string;
  templateName: string;
  framework: string;
  viralScore: number;
  platform: string;
  niche: string;
  
  // Original creator info
  originalCreator: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    platform: string;
    followerCount: number;
    verificationLevel: 'none' | 'verified' | 'blue' | 'business';
    originalVideoUrl: string;
    engagementRate: number;
  };
  
  // User's completed content
  userContent: {
    finalVideo?: string;
    thumbnail?: string;
    caption: string;
    hashtags: string[];
    duration: number;
  };
  
  // Performance predictions
  predictions: {
    estimatedViews: number;
    estimatedEngagement: number;
    viralPotential: 'low' | 'medium' | 'high' | 'extremely_high';
    confidenceScore: number;
  };
}

export default function TemplateCompletionPage() {
  const params = useParams();
  const templateId = params.templateId as string;
  
  const [completion, setCompletion] = useState<TemplateCompletion | null>(null);
  const [showAttributionModal, setShowAttributionModal] = useState(false);
  const [attributionComplete, setAttributionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'complete' | 'attribution' | 'publish'>('complete');

  useEffect(() => {
    loadTemplateCompletion();
  }, [templateId]);

  const loadTemplateCompletion = async () => {
    try {
      setIsLoading(true);
      
      // In production, fetch actual completion data
      // For demo, create mock completion data
      const mockCompletion: TemplateCompletion = {
        templateId,
        templateName: 'Morning Routine Viral Framework',
        framework: 'Curiosity Gap Hook',
        viralScore: 87,
        platform: 'instagram',
        niche: 'productivity',
        originalCreator: {
          id: 'creator_001',
          username: 'morning_guru',
          displayName: 'Morning Productivity Guru',
          avatar: 'https://via.placeholder.com/150/7b61ff/white?text=MG',
          platform: 'instagram',
          followerCount: 125000,
          verificationLevel: 'verified',
          originalVideoUrl: 'https://instagram.com/p/ABC123',
          engagementRate: 4.7
        },
        userContent: {
          caption: 'This simple morning routine changed everything! Here\'s what I learned after 30 days...',
          hashtags: ['#morningroutine', '#productivity', '#selfcare', '#wellness', '#viral'],
          duration: 28
        },
        predictions: {
          estimatedViews: 180000,
          estimatedEngagement: 8400,
          viralPotential: 'high',
          confidenceScore: 0.87
        }
      };

      setCompletion(mockCompletion);
    } catch (error) {
      console.error('Error loading template completion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttributionComplete = async (attributionData: any) => {
    try {
      console.log('🙌 Attribution completed:', attributionData);
      
      // Send attribution to API
      const response = await fetch('/api/creator-attribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_attribution',
          templateId: completion?.templateId,
          creatorId: completion?.originalCreator.id,
          userId: 'current_user_id', // Would be actual user ID
          attributionType: attributionData.attributionType,
          customMessage: attributionData.customMessage,
          autoSend: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setAttributionComplete(true);
        setCurrentStep('publish');
        
        // Show success feedback
        console.log('✅ Attribution sent successfully');
      }
    } catch (error) {
      console.error('Error completing attribution:', error);
    }
  };

  const handleDownload = () => {
    console.log('⬇️ Downloading template content');
    // Implement download functionality
  };

  const handleShare = (platform: string) => {
    console.log(`📤 Sharing to ${platform}`);
    // Implement platform-specific sharing
  };

  const getViralPotentialColor = (potential: string) => {
    switch (potential) {
      case 'extremely_high': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPlatformEmoji = (platform: string) => {
    const emojis = {
      instagram: '📸',
      tiktok: '🎵',
      youtube: '📺',
      linkedin: '💼',
      twitter: '🐦',
      facebook: '👥'
    };
    return emojis[platform as keyof typeof emojis] || '📱';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your viral template...</p>
        </div>
      </div>
    );
  }

  if (!completion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Template Not Found</h2>
          <p className="text-gray-400">The template completion could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-black mb-4">
            <span className="bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
              Template Complete! 🎉
            </span>
          </h1>
          
          <p className="text-xl text-gray-300">
            Your viral content is ready to launch
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            {/* Step 1: Complete */}
            <div className={`flex items-center ${currentStep === 'complete' ? 'text-green-400' : 'text-green-400'}`}>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 font-medium">Complete</span>
            </div>

            <ArrowRight className="w-5 h-5 text-gray-600" />

            {/* Step 2: Attribution */}
            <div className={`flex items-center ${attributionComplete ? 'text-green-400' : currentStep === 'attribution' ? 'text-purple-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 ${attributionComplete ? 'bg-green-500' : currentStep === 'attribution' ? 'bg-purple-500' : 'bg-gray-600'} rounded-full flex items-center justify-center`}>
                {attributionComplete ? <CheckCircle className="w-5 h-5 text-white" /> : <Heart className="w-5 h-5 text-white" />}
              </div>
              <span className="ml-2 font-medium">Attribution</span>
            </div>

            <ArrowRight className="w-5 h-5 text-gray-600" />

            {/* Step 3: Publish */}
            <div className={`flex items-center ${currentStep === 'publish' ? 'text-purple-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 ${currentStep === 'publish' ? 'bg-purple-500' : 'bg-gray-600'} rounded-full flex items-center justify-center`}>
                <Upload className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 font-medium">Publish</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{completion.templateName}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      {getPlatformEmoji(completion.platform)}
                      <span className="capitalize">{completion.platform}</span>
                    </span>
                    <span>•</span>
                    <span className="capitalize">{completion.niche}</span>
                    <span>•</span>
                    <span>{completion.framework}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-400">{completion.viralScore}</div>
                  <div className="text-sm text-gray-400">Viral Score</div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <h3 className="font-semibold mb-3">Your Content</h3>
                <p className="text-gray-300 mb-3">{completion.userContent.caption}</p>
                <div className="flex flex-wrap gap-2">
                  {completion.userContent.hashtags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Performance Predictions */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{formatNumber(completion.predictions.estimatedViews)}</div>
                  <div className="text-sm text-gray-400">Est. Views</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{formatNumber(completion.predictions.estimatedEngagement)}</div>
                  <div className="text-sm text-gray-400">Est. Engagement</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getViralPotentialColor(completion.predictions.viralPotential)}`}>
                    {completion.predictions.viralPotential.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Viral Potential</div>
                </div>
              </div>
            </motion.div>

            {/* Creator Attribution Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-red-400" />
                    Give Credit to Original Creator
                  </h3>
                  <p className="text-gray-300">
                    Support the creator who inspired your content and build positive relationships in the community.
                  </p>
                </div>
                {attributionComplete && (
                  <div className="text-green-400">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Creator Profile */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl">
                <img
                  src={completion.originalCreator.avatar}
                  alt={completion.originalCreator.displayName}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{completion.originalCreator.displayName}</h4>
                    {completion.originalCreator.verificationLevel !== 'none' && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    @{completion.originalCreator.username} • {formatNumber(completion.originalCreator.followerCount)} followers
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">{completion.originalCreator.engagementRate}%</div>
                  <div className="text-xs text-gray-400">Engagement</div>
                </div>
              </div>

              {!attributionComplete ? (
                <button
                  onClick={() => setShowAttributionModal(true)}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-semibold text-white hover:from-purple-700 hover:to-pink-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5" />
                  Give Credit & Build Relationships
                </button>
              ) : (
                <div className="w-full py-4 bg-green-500/20 border border-green-500/50 rounded-xl font-semibold text-green-400 flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Attribution Sent Successfully!
                </div>
              )}
            </motion.div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center gap-3 p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-xl text-blue-300 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Content
                </button>
                
                <button
                  onClick={() => handleShare('instagram')}
                  className="w-full flex items-center gap-3 p-3 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/50 rounded-xl text-pink-300 transition-colors"
                >
                  <Share className="w-5 h-5" />
                  Share to Instagram
                </button>
                
                <button
                  onClick={() => handleShare('tiktok')}
                  className="w-full flex items-center gap-3 p-3 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 rounded-xl text-gray-300 transition-colors"
                >
                  <Share className="w-5 h-5" />
                  Share to TikTok
                </button>
              </div>
            </motion.div>

            {/* Success Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Success Tips
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Post during peak hours (6-8 PM) for maximum reach</span>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Engage with comments in the first hour to boost algorithm</span>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Cross-post to multiple platforms for maximum exposure</span>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Thank the original creator publicly for community goodwill</span>
                </div>
              </div>
            </motion.div>

            {/* Viral Confidence */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/30"
            >
              <h3 className="text-lg font-bold mb-4 text-green-400">Viral Confidence</h3>
              <div className="text-center">
                <div className="text-4xl font-black text-green-400 mb-2">
                  {Math.round(completion.predictions.confidenceScore * 100)}%
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  This template has a high probability of viral success based on proven patterns.
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${completion.predictions.confidenceScore * 100}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Attribution Modal */}
        <CreatorAttributionModal
          isOpen={showAttributionModal}
          onClose={() => setShowAttributionModal(false)}
          creator={completion.originalCreator}
          templateTitle={completion.templateName}
          onAttributionComplete={handleAttributionComplete}
        />
      </div>
    </div>
  );
}