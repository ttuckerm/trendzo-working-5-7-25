'use client';

/**
 * Workflow 1 - Publish Phase Components (Step 5.1)
 * 
 * Step 5.1: Platform Selection & Publish
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, ChevronLeft, ChevronRight, Check, 
  Calendar, Clock, Copy, ExternalLink, Share2,
  Instagram, Youtube, Twitter
} from 'lucide-react';
import type { CreateData } from './CreatePhase';
import type { OptimizeData } from './OptimizePhase';

// Publish phase data structure
export interface PublishData {
  platform?: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
  scheduledFor?: string;
  publishedAt?: string;
  postUrl?: string;
  status: 'draft' | 'scheduled' | 'published';
  copiedCaption?: boolean;
  copiedHashtags?: boolean;
}

// Platform configurations
const PLATFORMS = [
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: '🎵',
    color: 'from-black to-gray-800',
    borderColor: 'border-white/30',
    description: 'Best for viral short-form content',
    maxDuration: '10 minutes',
    bestTimes: ['7-9am', '12-3pm', '7-11pm'],
  },
  { 
    id: 'instagram', 
    name: 'Instagram Reels', 
    icon: <Instagram className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-500/30',
    description: 'Great for lifestyle and visual content',
    maxDuration: '90 seconds',
    bestTimes: ['11am-1pm', '7-9pm'],
  },
  { 
    id: 'youtube', 
    name: 'YouTube Shorts', 
    icon: <Youtube className="w-6 h-6" />,
    color: 'from-red-500 to-red-600',
    borderColor: 'border-red-500/30',
    description: 'Best for educational content',
    maxDuration: '60 seconds',
    bestTimes: ['2-4pm', '6-9pm'],
  },
  { 
    id: 'twitter', 
    name: 'X / Twitter', 
    icon: <Twitter className="w-6 h-6" />,
    color: 'from-gray-800 to-black',
    borderColor: 'border-gray-500/30',
    description: 'Great for news and commentary',
    maxDuration: '2:20 minutes',
    bestTimes: ['8-10am', '12-1pm'],
  },
];

// Shared props interface
interface StepProps {
  data: PublishData;
  createData: CreateData;
  optimizeData: OptimizeData;
  onUpdate: (updates: Partial<PublishData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

// ============================================
// Step 5.1: Platform Selection & Publish
// ============================================
export function PublishStep({ data, createData, optimizeData, onUpdate, onNext, onBack }: StepProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const [copied, setCopied] = useState<'caption' | 'hashtags' | null>(null);

  const selectedPlatform = PLATFORMS.find(p => p.id === data.platform);

  const handleCopyCaption = () => {
    if (createData.caption) {
      navigator.clipboard.writeText(createData.caption);
      setCopied('caption');
      onUpdate({ copiedCaption: true });
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleCopyHashtags = () => {
    if (createData.hashtags?.length) {
      navigator.clipboard.writeText(createData.hashtags.join(' '));
      setCopied('hashtags');
      onUpdate({ copiedHashtags: true });
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handlePublish = () => {
    onUpdate({ 
      status: 'published',
      publishedAt: new Date().toISOString(),
    });
    onNext();
  };

  const handleSchedule = (date: string) => {
    onUpdate({
      status: 'scheduled',
      scheduledFor: date,
    });
    setShowScheduler(false);
  };

  const dpsScore = optimizeData.prediction?.predicted_dps_7d;
  const dpsTier = optimizeData.prediction?.predicted_tier_7d;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 mb-4">
          <Send className="w-8 h-8 text-pink-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Ready to Publish</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Choose your platform and share your content with the world
        </p>
      </div>

      {/* DPS Score Badge */}
      {dpsScore && (
        <div className="max-w-md mx-auto">
          <div className={`
            p-4 rounded-xl border text-center
            ${dpsTier === 'viral' || dpsTier === 'excellent' ? 'bg-green-500/10 border-green-500/30' :
              dpsTier === 'good' ? 'bg-blue-500/10 border-blue-500/30' :
              'bg-yellow-500/10 border-yellow-500/30'}
          `}>
            <p className="text-sm text-white/60 mb-1">Predicted Performance</p>
            <p className="text-2xl font-bold text-white">
              {dpsScore} DPS 
              <span className={`ml-2 text-sm capitalize ${
                dpsTier === 'viral' || dpsTier === 'excellent' ? 'text-green-400' :
                dpsTier === 'good' ? 'text-blue-400' : 'text-yellow-400'
              }`}>
                ({dpsTier})
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Platform Selection */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-4">Select Platform</h3>
        <div className="grid grid-cols-2 gap-4">
          {PLATFORMS.map((platform) => (
            <motion.button
              key={platform.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdate({ platform: platform.id as PublishData['platform'] })}
              className={`
                relative p-5 rounded-xl border text-left transition-all overflow-hidden
                ${data.platform === platform.id
                  ? `bg-gradient-to-br ${platform.color} ${platform.borderColor} ring-2 ring-white/20`
                  : 'bg-white/5 border-white/10 hover:border-white/30'}
              `}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">
                  {typeof platform.icon === 'string' ? platform.icon : platform.icon}
                </div>
                <div>
                  <p className="font-medium text-white">{platform.name}</p>
                  <p className="text-xs text-white/50">{platform.maxDuration} max</p>
                </div>
                {data.platform === platform.id && (
                  <Check className="w-5 h-5 text-white ml-auto" />
                )}
              </div>
              <p className="text-sm text-white/60">{platform.description}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-white/40">
                <Clock className="w-3 h-3" />
                Best: {platform.bestTimes.join(', ')}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content Preview & Copy */}
      {data.platform && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-4"
        >
          <h3 className="text-sm font-medium text-white/60">Your Content</h3>
          
          {/* Caption */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">Caption</span>
              <button
                onClick={handleCopyCaption}
                className={`
                  flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all
                  ${copied === 'caption' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'}
                `}
              >
                {copied === 'caption' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === 'caption' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-white text-sm whitespace-pre-wrap">
              {createData.caption || 'No caption created'}
            </p>
          </div>

          {/* Hashtags */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">Hashtags ({createData.hashtags?.length || 0})</span>
              <button
                onClick={handleCopyHashtags}
                className={`
                  flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all
                  ${copied === 'hashtags' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'}
                `}
              >
                {copied === 'hashtags' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === 'hashtags' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {createData.hashtags?.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-white/10 rounded text-sm text-white/80">
                  {tag}
                </span>
              )) || <span className="text-white/40">No hashtags</span>}
            </div>
          </div>

          {/* Sound */}
          {createData.trendingSound && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <span className="text-sm text-white/60">Selected Sound</span>
              <p className="text-white mt-1">{createData.trendingSound}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Publish Actions */}
      {data.platform && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-xl p-6">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-pink-400" />
              Publish to {selectedPlatform?.name}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handlePublish}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white font-medium hover:opacity-90 transition-all"
              >
                <Send className="w-5 h-5" />
                Mark as Published
              </button>
              
              <button
                onClick={() => setShowScheduler(!showScheduler)}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
              >
                <Calendar className="w-5 h-5" />
                Schedule for Later
              </button>
            </div>

            {/* Scheduler */}
            <AnimatePresence>
              {showScheduler && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="datetime-local"
                      onChange={(e) => handleSchedule(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50"
                    />
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    Best times for {selectedPlatform?.name}: {selectedPlatform?.bestTimes.join(', ')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status */}
            {data.status === 'scheduled' && data.scheduledFor && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Scheduled for {new Date(data.scheduledFor).toLocaleString()}
                </p>
              </div>
            )}

            {data.status === 'published' && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Published successfully!
                </p>
              </div>
            )}

            {/* Open Platform Link */}
            <div className="mt-4 text-center">
              <a
                href={
                  data.platform === 'tiktok' ? 'https://www.tiktok.com/upload' :
                  data.platform === 'instagram' ? 'https://www.instagram.com/' :
                  data.platform === 'youtube' ? 'https://studio.youtube.com/' :
                  'https://twitter.com/compose/tweet'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open {selectedPlatform?.name} to upload
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between max-w-2xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!data.platform || data.status === 'draft'}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto
            ${data.platform && data.status !== 'draft'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'}
          `}
        >
          Complete Publish Phase
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Phase Component
// ============================================
interface PublishPhaseProps {
  step: number;
  data: PublishData;
  createData: CreateData;
  optimizeData: OptimizeData;
  onUpdate: (updates: Partial<PublishData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PublishPhase({ step, data, createData, optimizeData, onUpdate, onNext, onBack }: PublishPhaseProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <PublishStep 
          data={data} 
          createData={createData} 
          optimizeData={optimizeData} 
          onUpdate={onUpdate} 
          onNext={onNext} 
          onBack={onBack} 
        />
      </motion.div>
    </AnimatePresence>
  );
}
