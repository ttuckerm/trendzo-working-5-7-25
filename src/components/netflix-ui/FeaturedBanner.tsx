'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, Plus } from 'lucide-react';

export default function FeaturedBanner() {
  const [isHoveredWatch, setIsHoveredWatch] = useState(false);
  const [isHoveredAdd, setIsHoveredAdd] = useState(false);

  return (
    <div className="relative w-full h-[450px] mb-10 overflow-hidden rounded-md transition-all duration-500 hover:shadow-2xl">
      {/* Background Image with improved gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>
      <div className="absolute inset-0">
        <Image
          src="/images/peaky-blinders-banner.jpg"
          alt="Peaky Blinders"
          fill
          className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
          priority
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.style.backgroundImage = 'linear-gradient(to right, #0f0f0f, #111)';
              parent.style.backgroundSize = 'cover';
            }
          }}
        />
      </div>

      {/* Content with animation */}
      <div className="relative z-20 h-full flex flex-col justify-end p-10 animate-fade-in">
        <div className="max-w-xl">
          {/* Logo with subtle entrance animation */}
          <div className="transform transition-all duration-500 ease-in-out translate-y-0 opacity-100">
            <Image
              src="/images/peaky-blinders-logo.png"
              alt="Peaky Blinders"
              width={400}
              height={120}
              className="mb-6 sm:w-[300px] md:w-[350px] lg:w-[400px]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const titleElement = document.createElement('h1');
                  titleElement.className = 'text-5xl font-bold text-white mb-6';
                  titleElement.innerText = 'PEAKY BLINDERS';
                  parent.prepend(titleElement);
                }
              }}
            />
          </div>

          {/* Metadata with improved responsive design */}
          <div className="text-white/80 text-sm mb-4 md:text-base">
            2013 • Drama • 5 Seasons
          </div>

          {/* Action Buttons with enhanced hover effects and accessibility */}
          <div className="flex gap-3">
            <button 
              className={`group flex items-center gap-2 px-6 py-2 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black ${
                isHoveredWatch 
                  ? 'bg-red-700 scale-105' 
                  : 'bg-red-600'
              }`}
              onMouseEnter={() => setIsHoveredWatch(true)}
              onMouseLeave={() => setIsHoveredWatch(false)}
              onFocus={() => setIsHoveredWatch(true)}
              onBlur={() => setIsHoveredWatch(false)}
              aria-label="Watch Peaky Blinders"
            >
              <Play size={16} className={`transition-transform duration-300 ${isHoveredWatch ? 'scale-110' : ''}`} /> 
              <span className="text-white">Watch</span>
            </button>
            
            <button 
              className={`rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-black ${
                isHoveredAdd 
                  ? 'bg-gray-500/50 scale-105' 
                  : 'bg-gray-600/40'
              }`}
              onMouseEnter={() => setIsHoveredAdd(true)}
              onMouseLeave={() => setIsHoveredAdd(false)}
              onFocus={() => setIsHoveredAdd(true)}
              onBlur={() => setIsHoveredAdd(false)}
              aria-label="Add Peaky Blinders to My List"
            >
              <Plus size={18} className={`text-white transition-transform duration-300 ${isHoveredAdd ? 'scale-110 rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 