'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const GOALS = [
  'Drive Sales',
  'Build Brand Awareness',
  'Grow Followers',
  'Generate Leads',
  'Educate Audience'
];

export default function GoalSelection() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isCompleted, setIsCompleted] = useState(false);
  const [userNiche, setUserNiche] = useState('');

  // Custom cursor effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Load user's niche and close dropdown when clicking outside
  useEffect(() => {
    const niche = localStorage.getItem('selectedNiche') || '';
    setUserNiche(niche);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.input-field') && !target.closest('.dropdown-options')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleGoalSelect = (goal: string) => {
    setSelectedGoal(goal);
    setIsDropdownOpen(false);
    setIsCompleted(true);
    
    // Store selected goal
    localStorage.setItem('selectedGoal', goal);
  };

  const handleContinue = () => {
    if (selectedGoal) {
      router.push('/viral-lab-entry/video-gallery');
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
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

      {/* Ambient background */}
      <div 
        className="fixed inset-0 -z-10 animate-ambient-shift"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(123, 97, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255, 97, 166, 0.05) 0%, transparent 50%)'
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

      {/* Main Content */}
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-10">
        <div className="text-center max-w-2xl w-full">
          <div className="mb-16">
            <h2 className="text-6xl font-bold mb-5 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Your Context
            </h2>
            <p className="text-xl text-white/70">
              Let's customize this viral formula for your brand
            </p>
          </div>

          {/* Show selected niche */}
          {userNiche && (
            <div className="mb-8 opacity-0 translate-y-5 animate-fade-in-up">
              <div className="bg-white/5 border border-green-400 rounded-2xl p-5">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-lg">
                    🎯
                  </span>
                  <span className="text-lg font-semibold">Selected Niche</span>
                </div>
                <p className="text-purple-400 font-semibold">{userNiche}</p>
              </div>
            </div>
          )}

          {/* Goal Input Group */}
          <div className={`mb-8 relative opacity-0 translate-y-5 animate-fade-in-up ${isCompleted ? 'completed' : ''}`} style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <label className="flex items-center justify-center gap-3 mb-3 text-lg font-semibold">
              <span className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-xl">
                👥
              </span>
              What's your main goal?
            </label>
            <div className="relative">
              <input
                type="text"
                className={`w-full p-5 bg-white/5 border-2 ${isCompleted ? 'border-green-400' : 'border-white/10'} rounded-2xl text-white text-base transition-all duration-300 cursor-pointer focus:outline-none focus:border-purple-400 focus:bg-white/8`}
                placeholder="Select your goal"
                value={selectedGoal}
                readOnly
                onClick={toggleDropdown}
              />
              {isCompleted && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center text-black font-bold animate-check-pop">
                  ✓
                </div>
              )}
              
              {/* Dropdown Options */}
              <div className={`absolute top-full left-0 right-0 bg-black/95 border-2 border-white/10 rounded-xl mt-1 overflow-hidden transition-all duration-300 z-10 ${isDropdownOpen ? 'opacity-100 translate-y-0 pointer-events-all' : 'opacity-0 -translate-y-2.5 pointer-events-none'}`}>
                {GOALS.map((goal) => (
                  <div
                    key={goal}
                    className="p-4 cursor-pointer transition-all duration-200 hover:bg-purple-400/20 hover:text-purple-400 hover:pl-5"
                    onClick={() => handleGoalSelect(goal)}
                  >
                    {goal}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Continue Button */}
          {selectedGoal && (
            <button
              onClick={handleContinue}
              className="w-full p-6 bg-gradient-to-r from-green-400 to-green-600 text-black text-xl font-bold cursor-pointer transition-all duration-300 uppercase tracking-[2px] mt-10 rounded-2xl opacity-0 translate-y-5 animate-fade-in-up hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,255,0,0.4)]"
              style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
            >
              VIEW VIRAL TEMPLATES
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes ambient-shift {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(180deg); }
        }
        
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
        
        @keyframes check-pop {
          from { 
            transform: translateY(-50%) scale(0) rotate(-180deg); 
          }
          to { 
            transform: translateY(-50%) scale(1) rotate(0deg); 
          }
        }
        
        .animate-ambient-shift {
          animation: ambient-shift 20s ease-in-out infinite;
        }
        
        .animate-float-orb {
          animation: float-orb 20s ease-in-out infinite;
        }
        
        .animate-float-orb-delayed {
          animation: float-orb 25s ease-in-out infinite;
          animation-delay: -5s;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease forwards;
        }
        
        .animate-check-pop {
          animation: check-pop 0.5s ease;
        }
        
        input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </>
  );
}