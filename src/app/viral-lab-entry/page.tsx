'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ViralLabEntry() {
  const router = useRouter();
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Custom cursor effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handlePathSelection = (path: 'manual' | 'ai-templates') => {
    if (path === 'manual') {
      router.push('/viral-lab-entry/manual-analysis');
    } else {
      router.push('/viral-lab-entry/onboarding/niche');
    }
  };

  return (
    <>
      {/* Custom cursor */}
      <div 
        className={`fixed w-5 h-5 pointer-events-none z-[10000] rounded-full transition-transform duration-100 ease-out mix-blend-screen ${
          isHovered 
            ? 'scale-[2] bg-gradient-radial from-pink-400/80 to-transparent' 
            : 'scale-100 bg-gradient-radial from-purple-400/80 to-transparent'
        }`}
        style={{
          left: cursor.x - 10,
          top: cursor.y - 10,
        }}
      />

      {/* Ambient background */}
      <div 
        className="fixed inset-0 -z-10 animate-ambient-shift"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(123, 97, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255, 97, 166, 0.05) 0%, transparent 50%)'
        }}
      />

      {/* Premium Badge */}
      <div className="fixed top-5 right-5 bg-gradient-to-r from-red-400 to-pink-400 px-3 py-1.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider z-50">
        Recommended
      </div>

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

      {/* Main Content */}
      <div className="min-h-screen bg-black text-white overflow-x-hidden flex items-center justify-center p-10">
        <div className="text-center max-w-4xl w-full">
          <h1 className="text-6xl font-bold mb-5 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-title-glow">
            How would you like to create viral content?
          </h1>
          <p className="text-xl text-white/70 mb-16">
            Choose your path to viral success
          </p>

          <div className="flex gap-10 justify-center items-center max-lg:flex-col max-lg:gap-8">
            {/* Manual Analysis Card */}
            <div 
              className="bg-white/[0.03] backdrop-blur-[20px] border-2 border-white/10 rounded-3xl p-10 cursor-pointer transition-all duration-400 min-w-[320px] text-left relative overflow-hidden hover:transform hover:-translate-y-2.5 hover:shadow-[0_20px_60px_rgba(123,97,255,0.4)] hover:bg-purple-500/10 hover:border-purple-400/50 animate-path-wobble"
              onClick={() => handlePathSelection('manual')}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-8 bg-gradient-to-r from-purple-400 to-pink-400">
                📊
              </div>
              <h3 className="text-3xl font-bold mb-4">Manual Analysis</h3>
              <p className="text-white/70 mb-6 leading-relaxed">
                Upload videos → instant success prediction
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white/10 px-3 py-1.5 rounded-2xl text-xs font-semibold uppercase tracking-wider">
                  Upload & Analyze
                </span>
                <span className="bg-white/10 px-3 py-1.5 rounded-2xl text-xs font-semibold uppercase tracking-wider">
                  Success Prediction
                </span>
                <span className="bg-white/10 px-3 py-1.5 rounded-2xl text-xs font-semibold uppercase tracking-wider">
                  Performance Metrics
                </span>
              </div>
            </div>

            {/* AI Templates Card */}
            <div 
              className="bg-white/[0.03] backdrop-blur-[20px] border-2 border-white/10 rounded-3xl p-10 cursor-pointer transition-all duration-400 min-w-[320px] text-left relative overflow-hidden hover:transform hover:-translate-y-2.5 hover:shadow-[0_20px_60px_rgba(123,97,255,0.4)] hover:bg-green-500/10 hover:border-green-400/50 animate-path-pulsate"
              onClick={() => handlePathSelection('ai-templates')}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="absolute top-4 right-4 bg-gradient-to-r from-red-400 to-pink-400 px-3 py-1.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider">
                Recommended
              </div>
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-8 bg-gradient-to-r from-green-400 to-green-600">
                🤖
              </div>
              <h3 className="text-3xl font-bold mb-4">AI Templates</h3>
              <p className="text-white/70 mb-6 leading-relaxed">
                Access today's proven viral templates
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-green-400/20 text-green-400 px-3 py-1.5 rounded-2xl text-xs font-semibold uppercase tracking-wider">
                  Viral Templates
                </span>
                <span className="bg-green-400/20 text-green-400 px-3 py-1.5 rounded-2xl text-xs font-semibold uppercase tracking-wider">
                  Niche-Specific
                </span>
                <span className="bg-green-400/20 text-green-400 px-3 py-1.5 rounded-2xl text-xs font-semibold uppercase tracking-wider">
                  Instant Results
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ambient-shift {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(180deg); }
        }
        
        @keyframes title-glow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes path-wobble {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        
        @keyframes path-pulsate {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
          }
          50% { 
            transform: scale(1.02);
            box-shadow: 0 0 40px rgba(0, 255, 0, 0.6);
          }
        }
        
        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -50px) scale(1.2); }
          66% { transform: translate(-30px, 30px) scale(0.8); }
        }
        
        .animate-ambient-shift {
          animation: ambient-shift 20s ease-in-out infinite;
        }
        
        .animate-title-glow {
          animation: title-glow 3s ease-in-out infinite;
        }
        
        .animate-path-wobble {
          animation: path-wobble 3s ease-in-out infinite;
        }
        
        .animate-path-pulsate {
          animation: path-pulsate 3s ease-in-out infinite;
        }
        
        .animate-float-orb {
          animation: float-orb 20s ease-in-out infinite;
        }
        
        .animate-float-orb-delayed {
          animation: float-orb 25s ease-in-out infinite;
          animation-delay: -5s;
        }
      `}</style>
    </>
  );
}