'use client';

import { useState, useEffect, useRef } from 'react';

export default function ViralTemplateLanding() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [viralScore, setViralScore] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState('business');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();

    const particles: Array<{
      x: number; y: number; vx: number; vy: number; size: number; opacity: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, `rgba(123, 97, 255, ${particle.opacity})`);
        gradient.addColorStop(1, `rgba(255, 97, 166, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationId = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener('resize', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Viral score animation
  useEffect(() => {
    const target = 94;
    const duration = 2000;
    const start = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setViralScore(Math.floor(eased * target));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    const timer = setTimeout(animate, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleCTAClick = () => {
    setShowSuccess(true);
    
    // Create particle explosion
    const button = document.querySelector('.cta-button') as HTMLElement;
    if (button) {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'success-particle';
        particle.style.cssText = `
          position: fixed;
          width: 8px;
          height: 8px;
          background: linear-gradient(135deg, #7b61ff, #ff61a6);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          left: ${centerX}px;
          top: ${centerY}px;
        `;
        
        document.body.appendChild(particle);
        
        const angle = (i / 20) * Math.PI * 2;
        const velocity = 100 + Math.random() * 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        particle.animate([
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
        ], {
          duration: 1000,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }).onfinish = () => particle.remove();
      }
    }
    
    setTimeout(() => {
      window.location.href = '/editor';
    }, 1500);
  };

  const niches = {
    business: { emoji: '💼', title: 'Business Leader', color: '#3B82F6' },
    creator: { emoji: '🎨', title: 'Content Creator', color: '#8B5CF6' },
    fitness: { emoji: '💪', title: 'Fitness Guru', color: '#EF4444' },
    education: { emoji: '🎓', title: 'Educator', color: '#10B981' }
  };

  return (
    <div 
      className="min-h-screen text-white overflow-x-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #000000 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Particle Canvas */}
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Success Overlay */}
      {showSuccess && (
        <div 
          className="fixed inset-0 flex items-center justify-center"
          style={{ 
            zIndex: 9998,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="text-center">
            <div 
              className="text-8xl mb-4"
              style={{ animation: 'successBounce 0.6s ease-out' }}
            >
              🚀
            </div>
            <div 
              className="text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Getting your viral template...
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative" style={{ zIndex: 10 }}>
        {/* Hero Section */}
        <section 
          className="min-h-screen flex items-center justify-center px-4"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
            opacity: Math.max(0, 1 - scrollY / 800)
          }}
        >
          <div className="max-w-6xl mx-auto text-center">
            {/* Viral Badge */}
            <div 
              className="inline-flex items-center gap-3 px-8 py-4 mb-8 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: 'badgePulse 3s ease-in-out infinite'
              }}
              role="status"
              aria-label="Social proof"
            >
              <span 
                className="text-2xl"
                style={{ animation: 'sparkle 2s ease-in-out infinite' }}
              >
                ✨
              </span>
              <span 
                className="font-semibold text-lg"
                style={{
                  background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                2.3M+ Creators Already Viral This Week
              </span>
            </div>

            {/* Headlines */}
            <h1 
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
              style={{
                background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'titleSlide 1s ease-out'
              }}
            >
              Get Your Viral Video Template
            </h1>

            <p 
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
              style={{
                animation: 'subtitleFade 1s ease-out 0.3s both'
              }}
            >
              Scientifically-proven formats that guarantee views. Customize for YOUR niche in 60 seconds.
            </p>

            {/* Preview Window */}
            <div 
              className="max-w-5xl mx-auto mb-12"
              style={{
                animation: 'previewSlide 1s ease-out 0.6s both'
              }}
            >
              <div 
                className="p-8 md:p-12 rounded-3xl group"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
                  transform: `perspective(1000px) rotateX(${(mousePos.y - window.innerHeight / 2) * 0.01}deg) rotateY(${(mousePos.x - window.innerWidth / 2) * 0.01}deg)`,
                  transition: 'transform 0.1s ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(123, 97, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.6)';
                }}
              >
                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-8 mb-12">
                  <div className="text-center">
                    <div 
                      className="text-4xl md:text-5xl font-black mb-2"
                      style={{
                        background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {viralScore}%
                    </div>
                    <p className="text-gray-400 font-medium">Viral Score</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="text-4xl md:text-5xl font-black mb-2"
                      style={{
                        background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      0.3s
                    </div>
                    <p className="text-gray-400 font-medium">Hook Time</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="text-4xl md:text-5xl font-black mb-2"
                      style={{
                        background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      15x
                    </div>
                    <p className="text-gray-400 font-medium">Share Rate</p>
                  </div>
                </div>

                {/* Viral DNA Visualization */}
                <div className="relative h-80 mb-12">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="relative w-64 h-64"
                      style={{ animation: 'dnaFloat 8s ease-in-out infinite' }}
                    >
                      {/* Central glow */}
                      <div 
                        className="absolute inset-0 rounded-full opacity-20"
                        style={{
                          background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                          filter: 'blur(40px)',
                          animation: 'centralPulse 4s ease-in-out infinite'
                        }}
                      />
                      
                      {/* DNA Nodes */}
                      <div 
                        className="absolute inset-0"
                        style={{ animation: 'dnaRotate 20s linear infinite' }}
                      >
                        {['HOOK', 'STORY', 'EMOTION', 'CTA'].map((node, i) => {
                          const angle = (i * 90) * Math.PI / 180;
                          const radius = 100;
                          const x = 50 + (radius * Math.cos(angle)) / 2.56; // Convert to percentage
                          const y = 50 + (radius * Math.sin(angle)) / 2.56;
                          
                          return (
                            <div
                              key={node}
                              className="absolute w-20 h-20 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                                boxShadow: '0 8px 32px rgba(123, 97, 255, 0.5)',
                                animation: `nodePulse 3s ease-in-out infinite ${i * 0.5}s`
                              }}
                            >
                              {node}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  className="cta-button group relative px-12 py-6 rounded-2xl font-bold text-xl overflow-hidden transform transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                    boxShadow: '0 8px 32px rgba(123, 97, 255, 0.4)'
                  }}
                  onClick={handleCTAClick}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 48px rgba(123, 97, 255, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(123, 97, 255, 0.4)';
                  }}
                  aria-label="Get your viral template now"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Get Your Template Now
                    <span 
                      className="transition-transform duration-300 group-hover:translate-x-2"
                    >
                      →
                    </span>
                  </span>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #ff61a6 0%, #7b61ff 100%)'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Trust Signals */}
            <div 
              className="flex flex-wrap justify-center gap-8 text-gray-400"
              style={{
                animation: 'trustFade 1s ease-out 0.9s both'
              }}
            >
              <span className="flex items-center gap-2">
                <span style={{ color: '#7b61ff' }}>⚡</span>
                <span className="font-medium">Instant Access</span>
              </span>
              <span className="flex items-center gap-2">
                <span style={{ color: '#ff61a6' }}>🎯</span>
                <span className="font-medium">Proven Results</span>
              </span>
              <span className="flex items-center gap-2">
                <span style={{ color: '#7b61ff' }}>🔒</span>
                <span className="font-medium">No Sign-up Required</span>
              </span>
            </div>
          </div>
        </section>

        {/* Template Showcase */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 
              className="text-4xl md:text-5xl font-black text-center mb-16"
              style={{
                background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Choose Your Viral Formula
            </h2>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                { title: 'The Hook Master', views: '12.4M', engagement: '94%', description: 'Captures attention in 0.3 seconds with proven psychological triggers' },
                { title: 'Story Arc Pro', views: '8.7M', engagement: '91%', description: 'Perfect narrative flow that keeps viewers watching till the end' },
                { title: 'Emotion Driver', views: '15.2M', engagement: '96%', description: 'Triggers the exact emotions that make people share content' }
              ].map((template, i) => (
                <div
                  key={i}
                  className="group p-8 rounded-2xl transition-all duration-500 cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
                    animation: `cardSlide 0.8s ease-out ${i * 0.2}s both`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(123, 97, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.6)';
                  }}
                  onClick={() => {
                    // Ripple effect
                    const ripple = document.createElement('div');
                    ripple.className = 'ripple';
                    ripple.style.cssText = `
                      position: absolute;
                      border-radius: 50%;
                      background: rgba(123, 97, 255, 0.6);
                      transform: scale(0);
                      animation: ripple 0.6s linear;
                      pointer-events: none;
                    `;
                    e.currentTarget.style.position = 'relative';
                    e.currentTarget.appendChild(ripple);
                    
                    setTimeout(() => ripple.remove(), 600);
                  }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold">{template.title}</h3>
                    <span 
                      className="text-2xl transition-transform duration-300 group-hover:rotate-180"
                      style={{ color: '#ff61a6' }}
                    >
                      ⭐
                    </span>
                  </div>
                  
                  <p className="text-gray-400 mb-8 leading-relaxed">{template.description}</p>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Views</p>
                      <p 
                        className="text-2xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        {template.views}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Engagement</p>
                      <p 
                        className="text-2xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        {template.engagement}
                      </p>
                    </div>
                  </div>

                  <button 
                    className="w-full py-4 rounded-xl font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
                    style={{
                      background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)'
                    }}
                  >
                    Use This Template
                  </button>
                </div>
              ))}
            </div>

            {/* Niche Selector */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8">What's your niche?</h3>
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                {Object.entries(niches).map(([key, niche]) => (
                  <button
                    key={key}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${selectedNiche === key ? 'selected' : ''}`}
                    style={{
                      background: selectedNiche === key 
                        ? 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    onClick={() => setSelectedNiche(key)}
                    onMouseEnter={(e) => {
                      if (selectedNiche !== key) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedNiche !== key) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                  >
                    <span className="text-2xl">{niche.emoji}</span>
                    <span>{niche.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* AI Assistant */}
      <div 
        className="fixed bottom-8 right-8 z-20"
        style={{ animation: 'assistantFloat 6s ease-in-out infinite' }}
      >
        <div className="relative group">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
              boxShadow: '0 8px 32px rgba(123, 97, 255, 0.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 12px 48px rgba(123, 97, 255, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(123, 97, 255, 0.5)';
            }}
          >
            <span className="text-2xl">✨</span>
          </div>
          
          {/* Tooltip */}
          <div 
            className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
              whiteSpace: 'nowrap'
            }}
          >
            <div className="text-sm font-medium">I'll help you go viral! 🚀</div>
            {/* Tooltip arrow */}
            <div 
              className="absolute top-full right-4 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid rgba(255, 255, 255, 0.2)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        
        @keyframes sparkle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
        }
        
        @keyframes titleSlide {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes subtitleFade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes previewSlide {
          0% { opacity: 0; transform: translateY(40px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes trustFade {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes cardSlide {
          0% { opacity: 0; transform: translateY(50px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes dnaFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes dnaRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes centralPulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.4; }
        }
        
        @keyframes nodePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(123, 97, 255, 0.5); }
          50% { transform: scale(1.1); box-shadow: 0 12px 48px rgba(123, 97, 255, 0.8); }
        }
        
        @keyframes assistantFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes successBounce {
          0% { transform: scale(0.3) rotate(-45deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        @keyframes ripple {
          to { transform: scale(4); opacity: 0; }
        }
        
        .selected {
          animation: selectedPulse 2s ease-in-out infinite;
        }
        
        @keyframes selectedPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(123, 97, 255, 0.5); }
          50% { box-shadow: 0 0 30px rgba(255, 97, 166, 0.7); }
        }
      `}</style>
    </div>
  );
}