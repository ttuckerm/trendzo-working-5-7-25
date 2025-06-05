'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ExitIntentModal from './ExitIntentModal';
import { trackEvent } from '@/lib/services/analytics';
import { LandingPageContent, Niche, Platform } from '@/lib/types/database';

interface LandingPageProps {
  niche: Niche;
  platform: Platform;
  content: LandingPageContent;
}

// Platform-specific icons
const PLATFORM_ICONS = {
  linkedin: '💼',
  twitter: '🐦',
  facebook: '👥',
  instagram: '📸'
};

// Live activity items that scroll
const LIVE_ACTIVITIES = [
  { icon: '🔥', text: "Jenny's transformation reveal: 5.7M views" },
  { icon: '🚀', text: 'Alex just went viral - Template working NOW' },
  { icon: '💫', text: "Emma's engagement up 340% this week" },
  { icon: '⚡', text: 'Marcus gained 50K followers with this template' },
  { icon: '🎯', text: 'Sarah hit 2.4M views in Pennsylvania' },
];

// Geographic activity data
const GEO_ACTIVITIES = [
  { location: 'Pennsylvania', count: 3, label: 'went viral today' },
  { location: 'New York', count: 12, label: 'this hour' },
  { location: 'California', count: 7, label: 'now active' },
];

export default function LandingPageComponent({ niche, platform, content }: LandingPageProps) {
  const router = useRouter();
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [handleInput, setHandleInput] = useState('');
  const [showViralScore, setShowViralScore] = useState(false);
  const [viralScore, setViralScore] = useState('94%');
  const [prediction, setPrediction] = useState('Perfect for transformation content');
  const [timeLeft, setTimeLeft] = useState(23 * 60 + 15); // 23:15 in seconds
  const countdownRef = useRef<NodeJS.Timeout>();

  // Exit intent detection
  useEffect(() => {
    let exitIntentTimer: NodeJS.Timeout;
    
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasInteracted && !showExitIntent) {
        setShowExitIntent(true);
        trackEvent('exit_intent_trigger', { niche, platform });
      }
    };

    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercentage > 70 && !hasInteracted && !showExitIntent) {
        setShowExitIntent(true);
        trackEvent('exit_intent_trigger', { niche, platform, trigger: 'scroll' });
      }
    };

    exitIntentTimer = setTimeout(() => {
      if (!hasInteracted && !showExitIntent) {
        setShowExitIntent(true);
        trackEvent('exit_intent_trigger', { niche, platform, trigger: 'time' });
      }
    }, 30000);

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(exitIntentTimer);
    };
  }, [hasInteracted, showExitIntent, niche, platform]);

  // Countdown timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) return 23 * 60 + 15;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setHandleInput(value);
    
    if (value.length > 2) {
      const scores = ['94%', '96%', '92%', '98%', '89%'];
      const predictions = [
        'Perfect for transformation content',
        'Ideal for before/after reveals',
        'Strong match for personal stories',
        'Excellent for educational content',
        'Great for entertainment format'
      ];
      
      const randomIndex = Math.floor(Math.random() * scores.length);
      setViralScore(scores[randomIndex]);
      setPrediction(predictions[randomIndex]);
      setShowViralScore(true);
      trackEvent('handle_entered', { niche, platform });
    } else {
      setShowViralScore(false);
    }
  };

  const handleGetTemplate = () => {
    setHasInteracted(true);
    trackEvent('cta_click', { niche, platform, location: 'primary' });
    router.push('/editor?ref=landing');
  };

  const handlePreview = () => {
    trackEvent('preview_click', { niche, platform });
    // Could open a modal or navigate to preview
  };

  const handleExitConvert = (email: string) => {
    trackEvent('exit_intent_convert', { niche, platform, email });
    setShowExitIntent(false);
    router.push(`/editor?email=${encodeURIComponent(email)}&ref=exit_intent`);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0c0c0c] via-[#1a1a2e] to-[#16213e] text-white overflow-x-hidden">
        {/* Live Activity Banner */}
        <div className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-[15px] border-b border-purple-500/30 py-2 z-50 overflow-hidden">
          <div className="flex animate-scroll whitespace-nowrap">
            {[...LIVE_ACTIVITIES, ...LIVE_ACTIVITIES].map((activity, index) => (
              <div key={index} className="inline-flex items-center gap-2 mx-8 text-sm text-green-500 font-medium">
                <span>{activity.icon}</span>
                <span>{activity.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Geographic Badges */}
        <div className="fixed top-20 right-5 flex flex-col gap-3 z-10 hidden lg:flex">
          {['🔥 3 creators viral in PA', '⚡ 12 using now in NY', '🚀 7 going viral in CA'].map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 0.7, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-green-500/15 backdrop-blur-[15px] border border-green-500/40 rounded-full px-4 py-2 text-xs text-green-500 font-semibold"
              style={{
                animation: `float-badge 4s ease-in-out infinite`,
                animationDelay: `${index * 1.3}s`
              }}
            >
              {badge}
            </motion.div>
          ))}
        </div>

        {/* Main Container */}
        <div className="pt-16 min-h-screen max-w-[1400px] mx-auto px-5 lg:px-8">
          {/* Header */}
          <div className="text-center mt-10 mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[clamp(3rem,8vw,5rem)] font-black leading-tight mb-5 bg-gradient-to-r from-white via-purple-500 to-cyan-500 bg-clip-text text-transparent"
            >
              {content.headline}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-white/85 font-medium leading-relaxed max-w-4xl mx-auto"
            >
              {content.subheadline}
            </motion.p>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-[450px_1fr] gap-20 items-start">
            {/* Left Side - Phone Mockup */}
            <div className="flex justify-center items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative w-[375px] h-[812px] bg-[#1a1a1a] rounded-[40px] overflow-hidden"
                style={{
                  boxShadow: `
                    0 0 0 12px #222,
                    0 0 0 14px #333,
                    0 20px 100px rgba(0, 0, 0, 0.5),
                    0 0 200px rgba(123, 97, 255, 0.2)
                  `,
                  animation: 'phone-float 6s ease-in-out infinite'
                }}
              >
                {/* Lighting Effect */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, 
                      transparent 0%, 
                      rgba(255, 255, 255, 0.05) 20%,
                      rgba(255, 255, 255, 0.1) 40%,
                      rgba(255, 255, 255, 0.05) 60%,
                      transparent 100%)`,
                    animation: 'light-sweep 8s ease-in-out infinite'
                  }}
                />

                {/* Video Container */}
                <div className="relative w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] overflow-hidden">
                  {/* Video Preview */}
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500">
                    <div className="text-[120px] opacity-30 animate-pulse">
                      {PLATFORM_ICONS[platform]}
                    </div>
                  </div>

                  {/* Template Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/90 via-transparent to-transparent">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full text-sm font-semibold mb-3 shadow-lg">
                        <span>🔥</span>
                        <span>Trending Now</span>
                      </div>
                      
                      <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">
                        {content.templateShowcase.split(' - ')[0]}
                      </h2>
                      
                      <p className="text-base text-white/90 leading-relaxed mb-5 drop-shadow">
                        {content.templateShowcase.split(' - ')[1] || 'The template that\'s breaking the internet'}
                      </p>

                      {/* Template Metrics */}
                      <div className="flex gap-6 mb-5">
                        <div className="text-center">
                          <span className="block text-2xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">12.4M</span>
                          <span className="text-xs text-white/60 uppercase tracking-wider">Views</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">2.1M</span>
                          <span className="text-xs text-white/60 uppercase tracking-wider">Likes</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">94%</span>
                          <span className="text-xs text-white/60 uppercase tracking-wider">Viral Score</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <button
                          onClick={handleGetTemplate}
                          className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl font-semibold transition-all hover:scale-105 hover:shadow-xl"
                        >
                          Get Template ✨
                        </button>
                        <button
                          onClick={handlePreview}
                          className="flex-1 py-4 px-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl font-semibold transition-all hover:bg-white/20"
                        >
                          Preview
                        </button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Side Actions */}
                  <div className="absolute right-5 bottom-24 flex flex-col gap-5">
                    {['❤️', '🎵', '📊', '🔗'].map((icon, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-2xl cursor-pointer transition-all hover:scale-110 hover:bg-purple-500/20 hover:border-purple-500/50"
                      >
                        {icon}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Side - Interactive Elements */}
            <div className="flex flex-col gap-8">
              {/* Input Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8"
              >
                <div className="text-base font-semibold text-purple-400 mb-4 flex items-center gap-2">
                  <span>🎯</span>
                  <span>What's your {platform === 'tiktok' ? 'TikTok' : platform.charAt(0).toUpperCase() + platform.slice(1)} handle? (Get instant viral prediction)</span>
                </div>
                <input
                  type="text"
                  value={handleInput}
                  onChange={handleInputChange}
                  placeholder="@yourusername"
                  className="w-full bg-white/10 border-2 border-purple-500/30 rounded-2xl px-6 py-4 text-lg text-center font-medium transition-all focus:outline-none focus:border-purple-500 focus:bg-white/15 focus:scale-[1.02]"
                />
                
                <AnimatePresence>
                  {showViralScore && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="mt-5 bg-gradient-to-r from-green-500/15 to-emerald-500/15 border-2 border-green-500/40 rounded-2xl p-6 text-center"
                    >
                      <span className="text-6xl font-black text-green-500 block mb-2">{viralScore}</span>
                      <div className="text-base text-green-500 font-semibold">Viral Match Score</div>
                      <div className="mt-3 text-sm text-green-500/90">{prediction}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Live Activity Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/3 border border-white/10 rounded-2xl p-6"
              >
                <div className="text-lg font-bold text-green-500 mb-5 text-center flex items-center justify-center gap-2">
                  <span>🌍</span>
                  <span>Live Viral Activity</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {GEO_ACTIVITIES.map((geo, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="bg-green-500/10 border border-green-500/25 rounded-2xl p-5 text-center"
                      style={{
                        animation: `geo-pulse 3s ease-in-out infinite`,
                        animationDelay: `${index * 0.5}s`
                      }}
                    >
                      <div className="text-xs text-green-500 font-semibold mb-2 flex items-center justify-center gap-1">
                        <span>📍</span>
                        <span>{geo.location}</span>
                      </div>
                      <span className="text-3xl font-black text-green-500 block mb-1">{geo.count}</span>
                      <div className="text-[11px] text-white/60 font-medium">{geo.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Urgency Timer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-red-500/15 to-red-600/15 border-2 border-red-500/40 rounded-2xl p-6 text-center"
                style={{ animation: 'urgentPulse 2s infinite' }}
              >
                <div className="text-base font-semibold text-red-300 mb-2">
                  🔥 {content.urgencyText}
                </div>
                <div className="text-5xl font-black text-red-500 font-mono mb-2">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xs text-white/60">
                  Algorithm favoring this format for limited time
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <button
                  onClick={handleGetTemplate}
                  className="relative w-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full py-5 px-12 text-white text-lg font-bold uppercase tracking-wide transition-all hover:scale-105 hover:shadow-2xl overflow-hidden group mb-4"
                >
                  <span className="relative z-10">{content.ctaText}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                </button>
                <div className="flex items-center justify-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1">✅ No credit card required</span>
                  <span className="flex items-center gap-1">✅ Instant access</span>
                  <span className="flex items-center gap-1">✅ 60-second setup</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Intent Modal */}
      {showExitIntent && (
        <ExitIntentModal
          niche={niche}
          platform={platform}
          onClose={() => {
            setShowExitIntent(false);
            trackEvent('exit_intent_dismiss', { niche, platform });
          }}
          onConvert={handleExitConvert}
        />
      )}

      {/* Styles */}
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        @keyframes float-badge {
          0%, 100% { opacity: 0.7; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(-5px) scale(1.05); }
        }
        
        @keyframes phone-float {
          0%, 100% { transform: translateY(0) rotateY(-5deg) rotateX(2deg); }
          50% { transform: translateY(-20px) rotateY(5deg) rotateX(-2deg); }
        }
        
        @keyframes light-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes geo-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        
        @keyframes urgentPulse {
          0%, 100% { opacity: 0.8; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { opacity: 1; box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </>
  );
}