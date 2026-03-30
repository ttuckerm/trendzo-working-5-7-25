'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Template data for different niches
const NICHE_VIDEOS = {
  'Personal Finance/Investing': [
    { id: 'pf1', title: 'Day in My Business', views: '9.8M', likes: '2.1M', score: '91%', sound: 'Entrepreneur Vibes', framework: 'Authority Hook' },
    { id: 'pf2', title: 'Revenue Reveal', views: '18.5M', likes: '4.2M', score: '97%', sound: 'Success Story Audio', framework: 'Transformation Story' },
    { id: 'pf3', title: 'Investment Tips', views: '7.3M', likes: '1.8M', score: '89%', sound: 'Motivational Speech', framework: 'Quick Tips' },
    { id: 'pf4', title: 'Behind the Scenes', views: '12.6M', likes: '3.1M', score: '93%', sound: 'Hustle Mode', framework: 'POV Format' }
  ],
  'Fitness/Weight Loss': [
    { id: 'f1', title: 'Transformation Reveal', views: '15.2M', likes: '3.1M', score: '96%', sound: 'Gym Motivation Mix', framework: 'Before/After' },
    { id: 'f2', title: '30-Day Challenge', views: '8.7M', likes: '2.2M', score: '92%', sound: 'Eye of the Tiger Remix', framework: 'Challenge Format' },
    { id: 'f3', title: 'Quick Workout', views: '11.3M', likes: '2.8M', score: '94%', sound: 'Pump It Up', framework: 'Tutorial' },
    { id: 'f4', title: 'Before/After Journey', views: '22.1M', likes: '5.4M', score: '98%', sound: 'Transformation Beat', framework: 'Story Arc' }
  ],
  'Beauty/Skincare': [
    { id: 'b1', title: 'Get Ready With Me', views: '24.3M', likes: '5.8M', score: '99%', sound: 'Morning Routine', framework: 'GRWM Format' },
    { id: 'b2', title: 'Skincare Routine', views: '16.2M', likes: '3.9M', score: '95%', sound: 'Glow Up Beat', framework: 'Tutorial' },
    { id: 'b3', title: 'Makeup Transformation', views: '19.7M', likes: '4.5M', score: '97%', sound: 'Beauty Beats', framework: 'Before/After' },
    { id: 'b4', title: 'Product Review', views: '8.9M', likes: '2.1M', score: '90%', sound: 'Review Time', framework: 'Product Demo' }
  ]
};

const ALL_NICHES = [
  'All',
  'Personal Finance/Investing',
  'Fitness/Weight Loss', 
  'Business/Entrepreneurship',
  'Food/Nutrition Comparisons',
  'Beauty/Skincare',
  'Real Estate/Property',
  'Self-Improvement/Productivity',
  'Dating/Relationships',
  'Education/Study Tips',
  'Career/Job Advice',
  'Parenting/Family',
  'Tech Reviews/Tutorials',
  'Fashion/Style',
  'Health/Medical Education',
  'Cooking/Recipes',
  'Psychology/Mental Health',
  'Travel/Lifestyle',
  'DIY/Home Improvement',
  'Language Learning',
  'Side Hustles/Making Money Online'
];

export default function VideoGallery() {
  const router = useRouter();
  const [selectedNiche, setSelectedNiche] = useState<string>('All');
  const [userNiche, setUserNiche] = useState<string>('');
  const [userGoal, setUserGoal] = useState<string>('');
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);

  // Custom cursor effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Get user's selected niche and goal from localStorage
    const niche = localStorage.getItem('selectedNiche') || '';
    const goal = localStorage.getItem('selectedGoal') || '';
    setUserNiche(niche);
    setUserGoal(goal);
    
    // Default to user's niche if available
    if (niche && niche !== 'All') {
      setSelectedNiche(niche);
    }
  }, []);

  const getAllVideos = () => {
    const allVideos = Object.values(NICHE_VIDEOS).flat();
    return allVideos;
  };

  const getFilteredVideos = () => {
    if (selectedNiche === 'All') {
      return getAllVideos();
    }
    return NICHE_VIDEOS[selectedNiche as keyof typeof NICHE_VIDEOS] || getAllVideos();
  };

  const handleVideoSelect = (videoId: string) => {
    // Store selected video and redirect to viral DNA analysis
    localStorage.setItem('selectedVideoId', videoId);
    localStorage.setItem('selectedVideoFramework', getFilteredVideos().find(v => v.id === videoId)?.framework || '');
    router.push('/viral-lab-entry/dna-analysis');
  };

  const handleCategorySelect = (category: string) => {
    setSelectedNiche(category);
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    const container = document.getElementById('categoryScroll');
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  const createTemplateCard = (video: any, index: number) => {
    const randomGradient = `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)}, #${Math.floor(Math.random()*16777215).toString(16)})`;
    
    return (
      <article 
        key={video.id}
        className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden transition-all duration-400 cursor-pointer group hover:-translate-y-2 hover:scale-[1.02] hover:border-purple-400/30 hover:shadow-[0_20px_40px_rgba(123,97,255,0.3)]"
        onClick={() => handleVideoSelect(video.id)}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        {/* Viral DNA indicator */}
        <div className="absolute top-5 right-5 flex gap-2 z-10">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-dna-pulse opacity-60"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        <div className="relative w-full h-96 bg-black overflow-hidden">
          <div 
            className="w-full h-full flex items-center justify-center text-white text-2xl font-bold transition-transform duration-600 group-hover:scale-110"
            style={{ background: randomGradient }}
          >
            {video.title}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-100 transition-opacity duration-300 group-hover:opacity-0">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-[10px] border-2 border-white/20 rounded-full flex items-center justify-center text-3xl transition-all duration-300 hover:scale-110 hover:bg-purple-400/30">
              ▶️
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="text-lg">👁️</span>
              <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {video.views}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="text-lg">❤️</span>
              <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {video.likes}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="text-lg">🔥</span>
              <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {video.score}
              </span>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-2 group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
            {video.title}
          </h3>
          <p className="text-sm text-white/60 line-height-1.5 mb-4">
            AI-optimized template for {userNiche || 'viral content'}
          </p>
          
          <div className="flex items-center gap-2 mb-5 p-2 bg-purple-400/10 border border-purple-400/20 rounded-full text-sm transition-all duration-300 hover:bg-purple-400/20 hover:border-purple-400/40">
            <span className="text-base animate-sound-wave">🎵</span>
            <span>Trending Sound: "{video.sound}"</span>
          </div>
          
          <button className="w-full p-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-base font-semibold rounded-xl opacity-0 transform translate-y-2.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(123,97,255,0.4)]">
            Create with this template ✨
          </button>
        </div>
      </article>
    );
  };

  const filteredVideos = getFilteredVideos();

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
        <header className="fixed top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent backdrop-blur-[20px] z-50 p-6 pb-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between mb-5">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-logo-pulse">
              Viral DNA™
            </div>
            <div className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm animate-badge-glow">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-live-pulse"></div>
              <span>247 Templates Trending Now</span>
            </div>
          </div>
          
          {/* Category Navigation */}
          <div className="max-w-6xl mx-auto relative">
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-[10px]">
              <div 
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/80 border border-white/10 rounded-full flex items-center justify-center cursor-pointer z-10 text-lg text-white transition-all duration-300 backdrop-blur-[10px] hover:bg-purple-400/60 hover:border-purple-400/50 hover:scale-110"
                onClick={() => scrollCategories('left')}
              >
                ‹
              </div>
              <div 
                id="categoryScroll"
                className="flex overflow-x-auto scroll-smooth gap-2 p-2 hide-scrollbar"
              >
                {ALL_NICHES.map((niche) => (
                  <div
                    key={niche}
                    className={`flex-shrink-0 px-5 py-3 rounded-3xl font-medium text-sm cursor-pointer transition-all duration-300 select-none whitespace-nowrap hover:bg-purple-400/20 hover:border-purple-400/30 hover:text-white hover:-translate-y-0.5 ${
                      selectedNiche === niche 
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold -translate-y-0.5 shadow-[0_8px_20px_rgba(123,97,255,0.4)]' 
                        : 'bg-white/5 border border-white/10 text-white/80'
                    }`}
                    onClick={() => handleCategorySelect(niche)}
                  >
                    {niche}
                  </div>
                ))}
              </div>
              <div 
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/80 border border-white/10 rounded-full flex items-center justify-center cursor-pointer z-10 text-lg text-white transition-all duration-300 backdrop-blur-[10px] hover:bg-purple-400/60 hover:border-purple-400/50 hover:scale-110"
                onClick={() => scrollCategories('right')}
              >
                ›
              </div>
            </div>
          </div>
        </header>

        {/* Template feed */}
        <main className="pt-52 pb-10 px-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-feed-load">
            {filteredVideos.map((video, index) => createTemplateCard(video, index))}
          </div>

          {/* Loading more indicator */}
          <div className="text-center pt-16 opacity-0 animate-fade-in">
            <div className="inline-flex gap-2">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i} 
                  className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-loading-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -50px) scale(1.2); }
          66% { transform: translate(-30px, 30px) scale(0.8); }
        }
        
        @keyframes logo-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes badge-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(123, 97, 255, 0.3); }
          50% { box-shadow: 0 0 30px rgba(255, 97, 166, 0.4); }
        }
        
        @keyframes live-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes feed-load {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes dna-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 1; }
        }
        
        @keyframes sound-wave {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        @keyframes loading-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fade-in {
          to { opacity: 1; }
        }
        
        .animate-float-orb {
          animation: float-orb 20s ease-in-out infinite;
        }
        
        .animate-float-orb-delayed {
          animation: float-orb 25s ease-in-out infinite;
          animation-delay: -5s;
        }
        
        .animate-logo-pulse {
          animation: logo-pulse 3s ease-in-out infinite;
        }
        
        .animate-badge-glow {
          animation: badge-glow 2s ease-in-out infinite;
        }
        
        .animate-live-pulse {
          animation: live-pulse 1s ease-out infinite;
        }
        
        .animate-feed-load {
          animation: feed-load 0.8s ease-out;
        }
        
        .animate-dna-pulse {
          animation: dna-pulse 2s ease-in-out infinite;
        }
        
        .animate-sound-wave {
          animation: sound-wave 1s ease-in-out infinite;
        }
        
        .animate-loading-bounce {
          animation: loading-bounce 1.5s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}