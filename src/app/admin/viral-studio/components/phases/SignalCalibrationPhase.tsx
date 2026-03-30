'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Play, Heart, MessageCircle, Bookmark, Share2, ArrowLeft } from 'lucide-react';
import {
  CalibrationScorer,
  inferProfile,
  type SwipeDirection,
  type InferredProfile,
  type CalibrationProfile,
  type CalibrationVideo,
} from '@/lib/onboarding/calibration-scorer';
import { getCalibrationVideos } from '@/lib/onboarding/calibration-video-pool';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

// ─── Action Buttons (decorative) ──────────────────────────────────────────────

const ACTION_BUTTONS = [
  { icon: Heart, label: '48K' },
  { icon: MessageCircle, label: '1.2K' },
  { icon: Bookmark, label: '890' },
  { icon: Share2, label: '2.4K' },
];

// ─── Swipeable Card ───────────────────────────────────────────────────────────

interface VideoCardProps {
  video: CalibrationVideo;
  onSwipe: (direction: SwipeDirection) => void;
  y: ReturnType<typeof useMotionValue<number>>;
}

function VideoCard({ video, onSwipe, y }: VideoCardProps) {
  const scale = useTransform(y, [-200, 0, 200], [0.95, 1, 0.95]);
  const cardOpacity = useTransform(y, [-300, -150, 0, 150, 300], [0.5, 0.85, 1, 0.85, 0.5]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offsetY = info.offset.y;
    if (Math.abs(offsetY) > 100) {
      onSwipe(offsetY < 0 ? 'up' : 'down');
    }
  }, [onSwipe]);

  return (
    <motion.div
      style={{ y, scale, opacity: cardOpacity }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ y: 300, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -800, opacity: 0, transition: { duration: 0.3 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="w-[70vw] max-w-[420px] h-[75vh] max-h-[680px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 cursor-grab active:cursor-grabbing"
    >
      <div
        className="relative w-full h-full flex flex-col justify-between"
        style={{ backgroundColor: video.thumbnail_color }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70 pointer-events-none" />

        {/* Top — niche tags */}
        <div className="relative z-10 p-5 flex flex-wrap gap-1.5">
          {video.niche_tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-white/15 backdrop-blur rounded-full text-[10px] text-white/80 uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Center — play icon */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <Play className="w-7 h-7 text-white/80 ml-1" />
          </div>
        </div>

        {/* Bottom — title, creator, stats */}
        <div className="relative z-10 p-6">
          <h3 className="text-xl md:text-2xl font-bold text-white leading-snug mb-2 drop-shadow-lg">
            {video.title}
          </h3>
          <p className="text-white/70 text-sm font-medium mb-1">
            @{video.creator.replace('@', '')}
          </p>
          <div className="flex items-center gap-3 text-white/50 text-xs">
            <span>{formatNumber(video.views)} views</span>
            <span>{formatNumber(video.likes)} likes</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SignalCalibrationPhaseProps {
  niche: string;
  onComplete: (profile: InferredProfile, rawScores: CalibrationProfile) => void;
  onBack?: () => void;
}

export default function SignalCalibrationPhase({ niche, onComplete, onBack }: SignalCalibrationPhaseProps) {
  const scorerRef = useRef(new CalibrationScorer());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'up' | 'down'>('up');
  const [swipeCount, setSwipeCount] = useState(0);
  const y = useMotionValue(0);

  const videos = useMemo(() => getCalibrationVideos(niche), [niche]);
  const total = videos.length;
  const progress = total > 0 ? currentIndex / total : 0;

  // Screen-edge glows driven by drag Y
  const greenGlowOpacity = useTransform(y, [-100, -50, 0], [0.6, 0, 0]);
  const redGlowOpacity = useTransform(y, [0, 50, 100], [0, 0, 0.6]);

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    const video = videos[currentIndex];
    if (!video) return;

    setExitDirection(direction === 'up' ? 'up' : 'down');
    scorerRef.current.recordSwipe(video, direction);
    setSwipeCount(c => c + 1);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= total) {
      const rawScores = scorerRef.current.getProfile();
      const creators = scorerRef.current.getAcceptedCreators();
      const inferred = inferProfile(rawScores, creators);
      setTimeout(() => onComplete(inferred, rawScores), 400);
    }

    // Reset motion value for next card
    y.set(0);
    setCurrentIndex(nextIndex);
  }, [currentIndex, videos, total, onComplete, y]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentIndex >= total) return;
      if (e.key === 'ArrowUp') { e.preventDefault(); handleSwipe('up'); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); handleSwipe('down'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, total, handleSwipe]);

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden flex items-center justify-center">
      {/* ── Screen-edge glow: green (top, swipe up = accept) ── */}
      <motion.div
        className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-green-500 to-transparent pointer-events-none z-10"
        style={{ opacity: greenGlowOpacity }}
      />

      {/* ── Screen-edge glow: red (bottom, swipe down = reject) ── */}
      <motion.div
        className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-red-500 to-transparent pointer-events-none z-10"
        style={{ opacity: redGlowOpacity }}
      />

      {/* ── Top bar ── */}
      <div className="absolute top-0 inset-x-0 z-30 px-6 pt-5 pb-3">
        {onBack && currentIndex === 0 && (
          <motion.button
            onClick={onBack}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-5 left-6 z-40 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        )}
        <p className={`font-mono text-xs uppercase tracking-widest text-white/40 mb-3${onBack && currentIndex === 0 ? ' ml-12' : ''}`}>
          PHASE 01 : SIGNAL CALIBRATION
        </p>

        {/* Progress bar */}
        <motion.div
          className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2"
          key={swipeCount}
          animate={{ scaleY: [1, 1.5, 1] }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ originY: 0.5 }}
        >
          <motion.div
            className="h-full bg-[#7b61ff] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
        </motion.div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-white/50 text-sm">
            Video {currentIndex < total ? currentIndex + 1 : total} / {total}
          </span>
          <motion.span
            className="font-mono text-white/30 text-xs"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            Your DNA is building...
          </motion.span>
        </div>
      </div>

      {/* ── Card area ── */}
      <AnimatePresence mode="wait" custom={exitDirection}>
        {currentIndex < total ? (
          <VideoCard
            key={videos[currentIndex].id}
            video={videos[currentIndex]}
            onSwipe={handleSwipe}
            y={y}
          />
        ) : (
          /* ── Done state ── */
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-[#7b61ff]/20 border border-[#7b61ff]/40 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-[#7b61ff] text-2xl"
              >
                ✓
              </motion.div>
            </div>
            <p className="text-white/70 text-lg">Calibration complete</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right-side TikTok action buttons (decorative) ── */}
      {currentIndex < total && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-20">
          {ACTION_BUTTONS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] text-white/50">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
