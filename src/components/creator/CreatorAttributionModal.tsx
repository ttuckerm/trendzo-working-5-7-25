'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Share, ExternalLink, Copy, Check } from 'lucide-react';
import { Platform } from '@/lib/types/database';

interface CreatorInfo {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  platform: Platform;
  followerCount: number;
  verificationLevel: 'none' | 'verified' | 'blue' | 'business';
  originalVideoUrl: string;
  engagementRate: number;
}

interface CreatorAttributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: CreatorInfo;
  templateTitle: string;
  onAttributionComplete: (attributionData: AttributionData) => void;
}

interface AttributionData {
  creatorId: string;
  attributionType: 'comment' | 'story' | 'post' | 'dm';
  customMessage?: string;
  scheduledTime?: string;
}

const ATTRIBUTION_TEMPLATES = {
  instagram: {
    comment: "Inspired by @{username}'s amazing content! 🔥 Created my own version with #TrendzoTemplates",
    story: "Shoutout to @{username} for the inspiration! ✨ Made this with @trendzo",
    post: "Credit to @{username} for the original idea! 🙌 My take using #TrendzoTemplates #CreatorCredit",
    dm: "Hey! I created a video inspired by your content and wanted to make sure you got proper credit! Here's the link: {link}"
  },
  linkedin: {
    comment: "Inspired by {displayName}'s excellent content. Created my professional version to engage my network.",
    post: "Building on the great work by {displayName}. My take on this concept for the professional space.",
    dm: "Hi {displayName}, I created content inspired by your post and wanted to ensure proper attribution."
  },
  twitter: {
    comment: "Inspired by @{username}'s thread! 🧵 My take: {link} #CreatorCredit",
    post: "Building on @{username}'s insight. My perspective: {link} (Credit where credit is due! 🙌)",
    dm: "Hi! Created content inspired by your tweet and wanted to make sure you got credit: {link}"
  },
  facebook: {
    comment: "Love this content by {displayName}! Created my own version inspired by this post.",
    post: "Inspired by {displayName}'s post. Here's my take on this concept with full credit to the original creator!",
    dm: "Hi {displayName}! I created content inspired by your post and wanted to ensure you get proper credit."
  }
};

export default function CreatorAttributionModal({
  isOpen,
  onClose,
  creator,
  templateTitle,
  onAttributionComplete
}: CreatorAttributionModalProps) {
  const [selectedType, setSelectedType] = useState<AttributionData['attributionType']>('comment');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Pre-fill with template message
      const template = ATTRIBUTION_TEMPLATES[creator.platform][selectedType];
      setCustomMessage(
        template
          .replace('{username}', creator.username)
          .replace('{displayName}', creator.displayName)
          .replace('{link}', window.location.href)
      );
    }
  }, [isOpen, selectedType, creator]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleAttributionSubmit = () => {
    const attributionData: AttributionData = {
      creatorId: creator.id,
      attributionType: selectedType,
      customMessage,
      scheduledTime: scheduledTime || undefined
    };

    onAttributionComplete(attributionData);
    onClose();
  };

  const getPlatformIcon = (platform: Platform) => {
    const icons = {
      instagram: '📸',
      linkedin: '💼',
      twitter: '🐦',
      facebook: '👥'
    };
    return icons[platform];
  };

  const getVerificationBadge = () => {
    switch (creator.verificationLevel) {
      case 'verified': return '✓';
      case 'blue': return '🔵';
      case 'business': return '🏢';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Creator Attribution</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Creator Profile */}
          <div className="flex items-center gap-4 mb-8 p-6 bg-white/5 rounded-2xl">
            <img
              src={creator.avatar}
              alt={creator.displayName}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{getPlatformIcon(creator.platform)}</span>
                <h3 className="text-lg font-semibold text-white">
                  {creator.displayName}
                </h3>
                {getVerificationBadge() && (
                  <span className="text-sm">{getVerificationBadge()}</span>
                )}
              </div>
              <p className="text-gray-400">@{creator.username}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                <span>{creator.followerCount.toLocaleString()} followers</span>
                <span>{creator.engagementRate}% engagement</span>
              </div>
            </div>
            <a
              href={creator.originalVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-white" />
            </a>
          </div>

          {/* Attribution Method */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">How would you like to give credit?</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['comment', 'story', 'post', 'dm'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedType === type
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {type === 'comment' && '💬'}
                    {type === 'story' && '📱'}
                    {type === 'post' && '📝'}
                    {type === 'dm' && '📨'}
                  </div>
                  <div className="text-sm font-medium text-white capitalize">{type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Customization */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">Attribution Message</h4>
              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm text-white"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full h-32 p-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-500"
              placeholder="Write your attribution message..."
            />
            <p className="text-sm text-gray-400 mt-2">
              This message will give proper credit to the original creator while promoting ethical content creation.
            </p>
          </div>

          {/* Scheduling (Optional) */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-white mb-3">Schedule Attribution (Optional)</h4>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
            />
            <p className="text-sm text-gray-400 mt-2">
              Leave empty to post immediately, or schedule for optimal engagement times.
            </p>
          </div>

          {/* Impact Preview */}
          <div className="mb-8 p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl border border-green-500/30">
            <h4 className="text-lg font-semibold text-white mb-3">Expected Impact</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <div className="text-sm text-white font-medium">Creator Goodwill</div>
                <div className="text-xs text-gray-300">Build relationships</div>
              </div>
              <div>
                <MessageCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-sm text-white font-medium">Community Respect</div>
                <div className="text-xs text-gray-300">Ethical practices</div>
              </div>
              <div>
                <Share className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-sm text-white font-medium">Network Growth</div>
                <div className="text-xs text-gray-300">Mutual promotion</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all"
            >
              Skip Attribution
            </button>
            <button
              onClick={handleAttributionSubmit}
              className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold transition-all transform hover:scale-105"
            >
              Give Credit 🙌
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}