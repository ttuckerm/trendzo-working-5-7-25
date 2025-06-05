'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GlassmorphicDemo() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [viralScore, setViralScore] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Animate viral score
  useEffect(() => {
    const targetScore = 94;
    const timer = setInterval(() => {
      setViralScore(prev => {
        if (prev >= targetScore) {
          clearInterval(timer);
          return targetScore;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setMousePosition({ x, y });
  };

  const handleGetTemplate = () => {
    setShowSuccess(true);
    setTimeout(() => {
      router.push('/editor');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white overflow-hidden relative">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-50 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-6xl animate-bounce">🚀</div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          {/* Viral badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 mb-8 rounded-full backdrop-blur-xl bg-white/5 border border-white/10">
            <span className="animate-pulse text-purple-400">✨</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold">
              5,000+ Creators Already Viral
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7b61ff] to-[#ff61a6]">
              Get Your Viral Video Template
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Scientifically-proven formats that guarantee views. Customize for YOUR niche in 60 seconds.
          </p>

          {/* Preview card with 3D effect */}
          <div 
            className="max-w-4xl mx-auto mb-12"
            onMouseMove={handleMouseMove}
            style={{
              transform: `perspective(1000px) rotateX(${mousePosition.y}deg) rotateY(${mousePosition.x}deg)`
            }}
          >
            <div className="p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-8 mb-12">
                <div>
                  <div className="text-4xl font-bold mb-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      {viralScore}%
                    </span>
                  </div>
                  <p className="text-gray-400">Viral Score</p>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      0.3s
                    </span>
                  </div>
                  <p className="text-gray-400">Hook Time</p>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      10x
                    </span>
                  </div>
                  <p className="text-gray-400">Share Rate</p>
                </div>
              </div>

              {/* Viral DNA visualization */}
              <div className="relative h-64 mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    {/* Central glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur-3xl opacity-30 animate-pulse" />
                    
                    {/* Rotating nodes */}
                    <div className="absolute inset-0 animate-spin-slow">
                      {['HOOK', 'STORY', 'EMOTION', 'CTA'].map((node, i) => {
                        const angle = (i * 90) * Math.PI / 180;
                        const x = 50 + 40 * Math.cos(angle);
                        const y = 50 + 40 * Math.sin(angle);
                        return (
                          <div
                            key={node}
                            className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 animate-pulse"
                            style={{ left: `${x}%`, top: `${y}%` }}
                          >
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shadow-lg">
                              {node}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleGetTemplate}
                className="group relative px-8 py-4 rounded-xl font-semibold text-lg overflow-hidden transition-all transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#7b61ff] to-[#ff61a6]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff61a6] to-[#7b61ff] opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-2">
                  Get Your Template Now
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </button>
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex justify-center gap-8 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <span className="text-purple-400">⚡</span>
              Instant Access
            </span>
            <span className="flex items-center gap-2">
              <span className="text-purple-400">🎯</span>
              Proven Results
            </span>
            <span className="flex items-center gap-2">
              <span className="text-purple-400">🔒</span>
              No Sign-up Required
            </span>
          </div>
        </div>

        {/* Template showcase */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Choose Your Viral Formula
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'The Hook Master', views: '12.4M', engagement: '94%' },
              { title: 'Story Arc Pro', views: '8.7M', engagement: '91%' },
              { title: 'Emotion Driver', views: '15.2M', engagement: '96%' }
            ].map((template, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{template.title}</h3>
                  <span className="text-purple-400 group-hover:animate-spin">⭐</span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Views</span>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      {template.views}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Engagement</span>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      {template.engagement}
                    </span>
                  </div>
                </div>

                <button className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Email capture */}
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-6">Want Weekly Viral Templates?</h3>
          <div className="flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Floating AI assistant */}
      <div className="fixed bottom-8 right-8 z-20">
        <div className="relative group">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center cursor-pointer shadow-lg hover:shadow-purple-500/50 transition-all animate-float">
            <span className="text-2xl">✨</span>
          </div>
          <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="px-4 py-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 whitespace-nowrap">
              I'll help you go viral! 🚀
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}