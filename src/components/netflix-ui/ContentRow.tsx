'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import Image from 'next/image';
import { MoreVertical, Play, Info, ChevronRight, ChevronLeft } from 'lucide-react';

interface ContentItemProps {
  title: string;
  image: string;
  year?: string;
  rating?: string;
  duration?: string;
  genre?: string;
}

function ContentItem({ title, image, year, rating, duration, genre }: ContentItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Show hover state when either hovered or focused
  const showDetails = isHovered || isFocused;
  
  return (
    <div 
      className={`relative group min-w-[200px] mr-2 cursor-pointer transition-all duration-300 ease-out ${
        showDetails ? 'transform scale-110 z-10 shadow-lg' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
      role="button"
      aria-label={`Play ${title}`}
    >
      <div className="relative rounded-md overflow-hidden aspect-video bg-gray-900">
        <Image
          src={image}
          alt={title}
          fill
          className={`object-cover transition-all duration-500 ${showDetails ? 'brightness-50' : ''}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.classList.add('flex', 'items-center', 'justify-center');
              parent.innerHTML = `<div class="text-center p-2 text-sm text-gray-400">${title}</div>`;
            }
          }}
        />
        
        {/* Hover Info with animation */}
        {showDetails && (
          <div className="absolute inset-0 bg-black/80 flex flex-col p-3 animate-fade-in">
            <div className="flex justify-between items-start">
              <button 
                className="bg-white rounded-full p-1.5 text-black hover:bg-white/90 transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label={`Play ${title}`}
              >
                <Play size={14} className="fill-black" />
              </button>
              <button 
                className="text-white hover:text-white/80 transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white rounded-full"
                aria-label={`More options for ${title}`}
              >
                <MoreVertical size={18} />
              </button>
            </div>
            <div className="mt-auto">
              <h4 className="text-xs font-semibold text-white mt-2">{title}</h4>
              {(year || rating || duration) && (
                <div className="flex gap-2 text-[10px] text-white/70 mt-1">
                  {year && <span>{year}</span>}
                  {rating && <span>{rating}</span>}
                  {duration && <span>{duration}</span>}
                </div>
              )}
              {genre && <p className="text-[10px] text-white/70 mt-1">{genre}</p>}
            </div>
          </div>
        )}
      </div>
      
      {/* Title (shown when not hovered) */}
      {!showDetails && (
        <h4 className="text-xs text-white/90 mt-1.5 transition-opacity duration-300">{title}</h4>
      )}
    </div>
  );
}

interface ContentRowProps {
  title: string;
  items: ContentItemProps[];
}

export default function ContentRow({ title, items }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollRow = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollRow('right');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollRow('left');
    }
  };

  return (
    <div className="mb-8 relative group" onKeyDown={handleKeyDown} tabIndex={-1}>
      <h2 className="text-xl font-medium text-white mb-4">{title}</h2>
      
      {/* Navigation Arrows */}
      {showLeftArrow && (
        <button 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black/70 p-2 rounded-full z-20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={() => scrollRow('left')}
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      
      {showRightArrow && (
        <button 
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black/70 p-2 rounded-full z-20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={() => scrollRow('right')}
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>
      )}
      
      <div 
        ref={rowRef}
        className="flex overflow-x-auto scrollbar-hide pb-4 pt-1"
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <ContentItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
} 