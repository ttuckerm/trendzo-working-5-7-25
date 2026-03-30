'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, CheckCircle, AlertCircle, Users, Video, Eye, TrendingUp, Loader2 } from 'lucide-react';
import type { ChannelVerificationResult } from '@/lib/onboarding/channel-verifier';

interface ChannelConnectPhaseProps {
  onComplete: (channelData: ChannelVerificationResult | null) => void;
  onBack: () => void;
  selectedNiche: string;
  selectedNicheKey: string;
}

type PhaseState = 'input' | 'loading' | 'success' | 'error';

const LOADING_MESSAGES = [
  'Connecting to TikTok...',
  'Analyzing your content...',
  'Calculating stats...',
];

function formatNumber(n: number | null): string {
  if (n == null) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function ChannelConnectPhase({
  onComplete,
  onBack,
  selectedNiche,
  selectedNicheKey,
}: ChannelConnectPhaseProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [phaseState, setPhaseState] = useState<PhaseState>('input');
  const [channelData, setChannelData] = useState<ChannelVerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotate loading messages
  useEffect(() => {
    if (phaseState === 'loading') {
      setLoadingMsgIndex(0);
      intervalRef.current = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phaseState]);

  const handleVerify = useCallback(async () => {
    if (!usernameInput.trim()) return;

    setPhaseState('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/channel/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim() }),
      });

      const data = await res.json();

      if (data.success && data.channel) {
        setChannelData(data.channel);
        setPhaseState('success');
      } else {
        setErrorMessage(data.error || 'Verification failed. Please try again.');
        setPhaseState('error');
      }
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
      setPhaseState('error');
    }
  }, [usernameInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && usernameInput.trim() && phaseState === 'input') {
      handleVerify();
    }
  }, [usernameInput, phaseState, handleVerify]);

  const handleRetry = useCallback(() => {
    setPhaseState('input');
    setErrorMessage('');
    setChannelData(null);
  }, []);

  const nicheMatches = channelData?.inferredNicheKey === selectedNicheKey;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">
            Connect Your TikTok
          </h1>
          <p className="text-white/50 text-sm">
            Optional — helps us personalize your predictions with real channel data
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* INPUT STATE */}
          {phaseState === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  TikTok Username or Profile URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="@username or https://tiktok.com/@username"
                    className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl
                      focus:ring-2 focus:ring-[#e50914] focus:border-transparent text-white
                      placeholder-gray-500 pr-12"
                    autoFocus
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                </div>
              </div>

              <button
                onClick={handleVerify}
                disabled={!usernameInput.trim()}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all
                  bg-[#e50914] text-white hover:bg-[#f6121d] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Verify Channel
              </button>

              <button
                onClick={() => onComplete(null)}
                className="w-full py-3 text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {/* LOADING STATE */}
          {phaseState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6 py-12"
            >
              <Loader2 className="w-10 h-10 text-[#e50914] animate-spin" />
              <p className="text-white/60 text-sm animate-pulse">
                {LOADING_MESSAGES[loadingMsgIndex]}
              </p>
            </motion.div>
          )}

          {/* SUCCESS STATE */}
          {phaseState === 'success' && channelData && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Verification Card */}
              <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-6 space-y-5">
                {/* Profile header */}
                <div className="flex items-center gap-4">
                  {channelData.avatarUrl ? (
                    <img
                      src={channelData.avatarUrl}
                      alt={channelData.displayName || channelData.username}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white/10"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                      <Users size={24} className="text-white/40" />
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {channelData.displayName || `@${channelData.username}`}
                    </p>
                    <p className="text-white/40 text-sm">@{channelData.username}</p>
                  </div>
                  <CheckCircle className="ml-auto text-green-400" size={24} />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <Users size={16} className="mx-auto mb-1 text-white/40" />
                    <p className="text-white font-bold text-lg">{formatNumber(channelData.followerCount)}</p>
                    <p className="text-white/40 text-xs">Followers</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <Video size={16} className="mx-auto mb-1 text-white/40" />
                    <p className="text-white font-bold text-lg">{channelData.recentVideoCount}</p>
                    <p className="text-white/40 text-xs">Recent Videos</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <Eye size={16} className="mx-auto mb-1 text-white/40" />
                    <p className="text-white font-bold text-lg">{formatNumber(channelData.avgViews)}</p>
                    <p className="text-white/40 text-xs">Avg Views</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <TrendingUp size={16} className="mx-auto mb-1 text-white/40" />
                    <p className="text-white font-bold text-lg">
                      {channelData.avgEngagementRate > 0
                        ? `${(channelData.avgEngagementRate * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                    <p className="text-white/40 text-xs">Engagement</p>
                  </div>
                </div>

                {/* Niche match indicator */}
                {channelData.inferredNicheKey && (
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm ${
                    nicheMatches
                      ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                      : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                  }`}>
                    {nicheMatches ? (
                      <>
                        <CheckCircle size={16} />
                        <span>Niche matches: <strong>{selectedNiche}</strong></span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} />
                        <span>
                          Your content looks like <strong>{channelData.inferredNicheLabel}</strong>
                          {' '}(you selected {selectedNiche})
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Account size */}
                <p className="text-white/30 text-xs text-center">
                  Account size: {channelData.accountSizeBand}
                </p>
              </div>

              <button
                onClick={() => onComplete(channelData)}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all
                  bg-[#e50914] text-white hover:bg-[#f6121d]"
              >
                Continue
              </button>

              <button
                onClick={handleRetry}
                className="w-full py-3 text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                Try a different account
              </button>
            </motion.div>
          )}

          {/* ERROR STATE */}
          {phaseState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center">
                <AlertCircle className="mx-auto mb-3 text-red-400" size={32} />
                <p className="text-red-300 text-sm">{errorMessage}</p>
              </div>

              <button
                onClick={handleRetry}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all
                  bg-[#e50914] text-white hover:bg-[#f6121d]"
              >
                Try Again
              </button>

              <button
                onClick={() => onComplete(null)}
                className="w-full py-3 text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                Skip for now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
