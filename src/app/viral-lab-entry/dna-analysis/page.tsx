'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DNAAnalysis() {
  const router = useRouter();
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');

  // Custom cursor effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Load selected video data and simulate analysis
  useEffect(() => {
    const videoId = localStorage.getItem('selectedVideoId') || '';
    const framework = localStorage.getItem('selectedVideoFramework') || '';
    setSelectedVideo(videoId);
    setSelectedFramework(framework);

    // Simulate analysis progress
    const timer = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsAnalysisComplete(true);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(timer);
  }, []);

  const handleProceedToLaboratory = () => {
    localStorage.setItem('analysisComplete', 'true');
    router.push('/sandbox/viral-lab-v2');
  };

  const handleBackToGallery = () => {
    router.push('/viral-lab-entry/video-gallery');
  };

  return (
    <>
      {/* Custom cursor */}
      <div 
        className="fixed w-5 h-5 pointer-events-none z-[10000] rounded-full transition-transform duration-100 ease-out mix-blend-screen bg-gradient-radial from-purple-400/80 to-transparent"
        style={{
          left: cursor.x - 10,
          top: cursor.y - 10,
        }}
      />

      {/* Floating orbs */}
      <div 
        className="fixed w-[200px] h-[200px] pointer-events-none animate-float-orb rounded-full"
        style={{
          left: '10%',
          top: '20%',
          background: 'radial-gradient(circle, rgba(123, 97, 255, 0.2) 0%, transparent 70%)'
        }}
      />
      <div 
        className="fixed w-[200px] h-[200px] pointer-events-none animate-float-orb-delayed rounded-full"
        style={{
          left: '80%',
          top: '60%',
          background: 'radial-gradient(circle, rgba(255, 97, 166, 0.2) 0%, transparent 70%)'
        }}
      />

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 flex justify-between items-center p-6 bg-gradient-to-b from-black to-transparent backdrop-blur-[20px] z-50">
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base font-medium cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-x-1"
            onClick={handleBackToGallery}
          >
            ← Back to Discovery
          </button>
          <div className="px-6 py-3 bg-pink-400/10 border border-pink-400/30 rounded-xl text-sm font-medium text-pink-400">
            Connected to DNA_Detective + Orchestrator
          </div>
        </header>

        <div className="pt-32 p-10 max-w-7xl mx-auto">
          {/* Phase Indicator */}
          <div className="flex items-center gap-4 mb-10 opacity-0 animate-fade-in-up">
            <span className="text-3xl animate-float">🧬</span>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Phase 2: Analysis - Viral DNA Detection
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mt-10">
            {/* Left Panel: DNA Breakdown */}
            <div className="lg:col-span-2 opacity-0 animate-fade-in-left">
              <div className="flex items-center gap-3 mb-10">
                <span className="text-2xl">🎯</span>
                <h2 className="text-2xl font-semibold text-white">
                  Template: {selectedFramework || 'This Morning Routine Changed My Life'}
                </h2>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-[10px]">
                <h3 className="text-xl font-semibold mb-8 text-white">Viral DNA Analysis</h3>
                
                {/* Metrics */}
                {[
                  { name: 'Hook Strength', score: '92%', timeline: '0-3s', description: 'Authority positioning captures attention', width: '92%', delay: '0.1s' },
                  { name: 'Story Arc', score: '88%', timeline: '3-15s', description: 'Clear problem-solution structure', width: '88%', delay: '0.2s' },
                  { name: 'Visual Impact', score: '85%', timeline: 'Throughout', description: 'High-contrast visual elements', width: '85%', delay: '0.3s' },
                  { name: 'Call to Action', score: '90%', timeline: '25-30s', description: 'Strong engagement trigger', width: '90%', delay: '0.4s' }
                ].map((metric, index) => (
                  <div 
                    key={metric.name} 
                    className="mb-8 opacity-0 animate-fade-in-up"
                    style={{ animationDelay: metric.delay, animationFillMode: 'forwards' }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-lg font-semibold text-white">{metric.name}</h4>
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                        {metric.score}
                      </span>
                    </div>
                    <div className="text-sm text-purple-400 mb-1">{metric.timeline}</div>
                    <div className="text-sm text-white/60 mb-3">{metric.description}</div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1500 ease-out"
                        style={{ 
                          width: isAnalysisComplete ? metric.width : '0%',
                          transitionDelay: metric.delay 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Prediction */}
            <div className="opacity-0 animate-fade-in-right">
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-[10px] mb-8">
                <h3 className="text-xl font-semibold mb-8 flex items-center gap-2">
                  📊 Live Viral Prediction
                </h3>
                
                {/* Viral Score Circle */}
                <div className="relative w-52 h-52 mx-auto mb-8">
                  <svg className="w-full h-full animate-rotate-in" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12"/>
                    <circle 
                      className="transition-all duration-2000 ease-out" 
                      cx="100" cy="100" r="90" fill="none" 
                      stroke="url(#scoreGradient)" strokeWidth="12" strokeLinecap="round" 
                      strokeDasharray="565.48" 
                      strokeDashoffset={isAnalysisComplete ? "50" : "565.48"}
                      transform="rotate(-90 100 100)"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#00ff00', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#00cc00', stopOpacity: 1}} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent animate-score-count">
                      91.7%
                    </span>
                  </div>
                </div>

                {/* Prediction Details */}
                <div className="space-y-4">
                  {[
                    { label: 'Framework:', value: selectedFramework || 'This Morning Routine Changed My Life' },
                    { label: 'Expected Views:', value: '1.8M', highlight: true },
                    { label: 'Confidence:', value: 'High', color: 'text-green-400' },
                    { label: 'Platform:', value: 'TIKTOK', badge: true }
                  ].map((detail, index) => (
                    <div key={detail.label} className="flex justify-between items-center py-3 border-b border-white/5 last:border-b-0">
                      <span className="text-sm text-white/60">{detail.label}</span>
                      <span className={`text-base font-semibold ${
                        detail.highlight ? 'text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent' :
                        detail.color ? detail.color :
                        detail.badge ? 'px-3 py-1 bg-purple-400/20 border border-purple-400/30 rounded-full text-xs uppercase tracking-wider' :
                        'text-white'
                      }`}>
                        {detail.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                className={`w-full p-5 border-none rounded-2xl text-white text-lg font-bold cursor-pointer transition-all duration-300 uppercase tracking-wider animate-pulse ${
                  isAnalysisComplete 
                    ? 'bg-gradient-to-r from-red-400 to-red-500 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(255,68,88,0.4)]' 
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
                onClick={handleProceedToLaboratory}
                disabled={!isAnalysisComplete}
              >
                {isAnalysisComplete ? 'Proceed to Creation Phase →' : 'Analyzing...'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -50px) scale(1.2); }
          66% { transform: translate(-30px, 30px) scale(0.8); }
        }
        
        @keyframes fade-in-up {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes rotate-in {
          from { transform: rotate(-90deg); opacity: 0; }
          to { transform: rotate(0); opacity: 1; }
        }
        
        @keyframes score-count {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float-orb {
          animation: float-orb 20s ease-in-out infinite;
        }
        
        .animate-float-orb-delayed {
          animation: float-orb 25s ease-in-out infinite;
          animation-delay: -5s;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease forwards;
        }
        
        .animate-fade-in-left {
          animation: fade-in-left 0.8s ease;
        }
        
        .animate-fade-in-right {
          animation: fade-in-right 0.8s ease;
        }
        
        .animate-rotate-in {
          animation: rotate-in 1s ease;
        }
        
        .animate-score-count {
          animation: score-count 2s ease forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
} 