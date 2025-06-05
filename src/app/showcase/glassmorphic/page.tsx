'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Layers, Palette, Zap, MousePointer } from 'lucide-react';

const showcaseItems = [
  {
    niche: 'business',
    platform: 'linkedin',
    title: 'Executive Leadership',
    description: 'Professional content that positions you as an industry leader',
    gradient: 'from-blue-500 to-purple-500'
  },
  {
    niche: 'creator',
    platform: 'instagram',
    title: 'Content Creator',
    description: 'Viral formats that attract brand partnerships',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    niche: 'fitness',
    platform: 'instagram',
    title: 'Fitness Influencer',
    description: 'Transformation content that builds community',
    gradient: 'from-pink-500 to-red-500'
  },
  {
    niche: 'education',
    platform: 'twitter',
    title: 'Thought Leader',
    description: 'Educational threads that establish authority',
    gradient: 'from-green-500 to-blue-500'
  }
];

export default function GlassmorphicShowcase() {
  const router = useRouter();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  
  const features = [
    {
      icon: Layers,
      title: 'Glassmorphic Design',
      description: 'Premium frosted glass effects with depth and dimension'
    },
    {
      icon: Palette,
      title: 'Gradient System',
      description: 'Purple to pink gradients that trigger positive emotions'
    },
    {
      icon: Zap,
      title: 'Micro-interactions',
      description: '60fps animations that respond to every user action'
    },
    {
      icon: MousePointer,
      title: '3D Effects',
      description: 'Cards that tilt and respond to mouse movement'
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white">
      {/* Animated background gradient */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 animate-gradient" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-6 py-3 mb-8 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                Premium Glassmorphic Design System
              </span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
                Experience the Future
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Dopamine-triggering interfaces that make technology disappear. 
              Every pixel designed to evoke positive emotions.
            </p>
          </motion.div>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="relative"
              >
                <motion.div
                  className="p-6 rounded-2xl h-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: hoveredFeature === index 
                      ? '0 20px 60px rgba(123, 97, 255, 0.3)' 
                      : '0 12px 40px rgba(0, 0, 0, 0.6)'
                  }}
                  animate={{
                    y: hoveredFeature === index ? -8 : 0
                  }}
                >
                  <feature.icon className="w-10 h-10 text-purple-400 mb-4" />
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
          
          {/* Landing Page Examples */}
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Try Our Premium Landing Pages
            </span>
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {showcaseItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => router.push(`/l/premium/${item.niche}/${item.platform}`)}
              >
                <div
                  className="relative p-8 rounded-3xl overflow-hidden transition-all duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${item.gradient}`} />
                  
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-400 mb-6">{item.description}</p>
                    
                    <div className="flex items-center gap-2 text-purple-400 group-hover:text-pink-400 transition-colors">
                      <span className="font-semibold">View Example</span>
                      <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                  
                  {/* Floating particles on hover */}
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-24"
          >
            <h3 className="text-2xl font-bold mb-6">
              Ready to Create Your Own Viral Content?
            </h3>
            
            <motion.button
              onClick={() => router.push('/l/premium/creator/instagram')}
              className="px-8 py-4 rounded-xl font-semibold text-lg"
              style={{
                background: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)'
              }}
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(123, 97, 255, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              Start Creating Now
            </motion.button>
          </motion.div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes gradient {
          0%, 100% {
            transform: translateX(0%) translateY(0%) rotate(0deg) scale(1);
          }
          33% {
            transform: translateX(30%) translateY(-30%) rotate(120deg) scale(1.2);
          }
          66% {
            transform: translateX(-20%) translateY(20%) rotate(240deg) scale(0.8);
          }
        }
        
        .animate-gradient {
          animation: gradient 15s ease infinite;
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  );
}