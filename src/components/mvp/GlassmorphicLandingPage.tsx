'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, TrendingUp, Play, ChevronRight, Star } from 'lucide-react';
import { trackEvent } from '@/lib/services/analytics';
import { LandingPageContent, Niche, Platform } from '@/lib/types/database';

interface GlassmorphicLandingPageProps {
  niche: Niche;
  platform: Platform;
  content: LandingPageContent;
}

// Particle system for background
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];
    
    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
    
    let animationId: number;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(123, 97, 255, ${particle.opacity})`;
        ctx.fill();
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-50"
      style={{ zIndex: 1 }}
    />
  );
}

// Viral DNA Visualization
function ViralDNA() {
  const nodes = ['HOOK', 'STORY', 'EMOTION', 'CTA'];
  
  return (
    <div className="relative w-64 h-64 mx-auto">
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {nodes.map((node, index) => {
          const angle = (index * 360) / nodes.length;
          const x = 50 + 40 * Math.cos((angle * Math.PI) / 180);
          const y = 50 + 40 * Math.sin((angle * Math.PI) / 180);
          
          return (
            <motion.div
              key={node}
              className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.5
              }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple-500/50">
                {node}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      
      {/* Center glow */}
      <div className="absolute inset-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-pink-600 opacity-20 blur-xl animate-pulse" />
      </div>
    </div>
  );
}

// Success celebration
function SuccessParticles({ trigger }: { trigger: boolean }) {
  if (!trigger) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"
          initial={{
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            scale: 0
          }}
          animate={{
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
            y: window.innerHeight / 2 + (Math.random() - 0.5) * 400,
            scale: [0, 1, 0],
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
            delay: i * 0.05
          }}
        />
      ))}
    </div>
  );
}

export default function GlassmorphicLandingPage({ niche, platform, content }: GlassmorphicLandingPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [viralScore, setViralScore] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  
  // Track mouse for 3D card effects
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * -20
    });
  }, []);
  
  // Animate viral score on mount
  useEffect(() => {
    const targetScore = 87 + Math.floor(Math.random() * 10);
    const interval = setInterval(() => {
      setViralScore(prev => {
        if (prev >= targetScore) {
          clearInterval(interval);
          return targetScore;
        }
        return prev + 1;
      });
    }, 20);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleGetTemplate = async () => {
    trackEvent('cta_click', { niche, platform, location: 'hero' });
    setShowSuccess(true);
    
    // Navigate after celebration
    setTimeout(() => {
      router.push(`/editor?niche=${niche}&platform=${platform}`);
    }, 1500);
  };
  
  const templates = [
    {
      title: "The Hook Master",
      views: "12.4M",
      engagement: "94%",
      description: "Captures attention in 0.3 seconds with proven psychological triggers"
    },
    {
      title: "Story Arc Pro",
      views: "8.7M", 
      engagement: "91%",
      description: "Perfect narrative flow that keeps viewers watching till the end"
    },
    {
      title: "Emotion Driver",
      views: "15.2M",
      engagement: "96%",
      description: "Triggers the exact emotions that make people share content"
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white overflow-hidden">
      <ParticleField />
      <SuccessParticles trigger={showSuccess} />
      
      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center px-4 z-10"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* Viral Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-3 mb-8"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '100px'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
            </motion.div>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
              {content.socialProof}
            </span>
          </motion.div>
          
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
              {content.headline}
            </span>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto"
          >
            {content.subheadline}
          </motion.p>
          
          {/* Preview Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-4xl mx-auto mb-12"
            onMouseMove={handleMouseMove}
            style={{
              transform: `perspective(1000px) rotateX(${mousePosition.y}deg) rotateY(${mousePosition.x}deg)`
            }}
          >
            <div
              className="relative p-8 rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
              }}
            >
              {/* Metrics Row */}
              <div className="flex justify-around mb-8">
                <div className="text-center">
                  <motion.div
                    className="text-4xl font-bold mb-2"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {viralScore}%
                    </span>
                  </motion.div>
                  <p className="text-sm text-gray-400">Viral Score</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      0.3s
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Hook Time</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      10x
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Share Rate</p>
                </div>
              </div>
              
              {/* Viral DNA */}
              <ViralDNA />
            </div>
          </motion.div>
          
          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              onClick={handleGetTemplate}
              className="relative px-8 py-4 rounded-xl font-semibold text-lg overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Your Template
                <ChevronRight className="w-5 h-5" />
              </span>
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, #ff61a6 0%, #7b61ff 100%)',
                  transition: 'opacity 0.3s ease'
                }}
              />
            </motion.button>
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-purple-400" />
                Instant Access
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Proven Results
              </span>
            </div>
          </motion.div>
        </div>
      </motion.section>
      
      {/* Template Showcase */}
      <section className="relative py-24 px-4 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Choose Your Viral Formula
            </span>
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {templates.map((template, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className="relative group"
              >
                <motion.div
                  className="p-6 rounded-2xl h-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: hoveredCard === index 
                      ? '0 20px 60px rgba(123, 97, 255, 0.3)' 
                      : '0 12px 40px rgba(0, 0, 0, 0.6)'
                  }}
                  animate={{
                    y: hoveredCard === index ? -8 : 0,
                    scale: hoveredCard === index ? 1.02 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{template.title}</h3>
                    <motion.div
                      animate={{ rotate: hoveredCard === index ? 360 : 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Star className="w-6 h-6 text-purple-400" />
                    </motion.div>
                  </div>
                  
                  <p className="text-gray-400 mb-6">{template.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Views</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {template.views}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Engagement</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {template.engagement}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    className="mt-6 w-full py-3 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Use This Template
                  </motion.button>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* AI Assistant */}
      <motion.div
        className="fixed bottom-8 right-8 z-20"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.div
          className="relative"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
              boxShadow: '0 8px 32px rgba(123, 97, 255, 0.5)'
            }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          {/* Tooltip */}
          <motion.div
            className="absolute bottom-full right-0 mb-4 whitespace-nowrap"
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
          >
            <div
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              I'll help you go viral! 🚀
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}