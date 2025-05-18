"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useEditor } from "@/lib/contexts/EditorContext";
import { Clock, ChevronRight, ChevronLeft, Plus, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import BeatSyncController from "./BeatSyncController";
import { useAudio } from "@/lib/contexts/AudioContext";

/**
 * EditorTimeline Component
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Shows timeline controls in context
 * - Emotional Design: Visual feedback for playhead movement
 * - Contextual Intelligence: Section colors and indicators adapt based on type
 * - Progressive Disclosure: Shows details when sections are wide enough
 * - Sensory Harmony: Visual and functional elements work together
 */

interface EditorTimelineProps {
  className?: string;
}

export const EditorTimeline: React.FC<EditorTimelineProps> = ({ 
  className = "" 
}) => {
  const { 
    state, 
    addSection, 
    selectSection, 
    setCurrentTime,
    togglePlayback
  } = useEditor();
  
  const { state: audioState } = useAudio();
  const [isDragging, setIsDragging] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);

  // Set timeline width on resize
  useEffect(() => {
    if (!timelineRef.current) return;

    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Calculate total template duration
  const totalDuration = state.template.sections.reduce(
    (total, section) => total + section.duration,
    0
  );

  // Update playhead position based on current time
  useEffect(() => {
    if (totalDuration <= 0) return;
    setPlayheadPosition(state.ui.currentTime / totalDuration);
  }, [state.ui.currentTime, totalDuration]);

  // Handle timeline click to set playhead position
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || totalDuration === 0) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const clickPercentage = clickPosition / rect.width;
    
    // Calculate time from percentage
    const clickTime = totalDuration * clickPercentage;
    
    // Update current time
    setCurrentTime(clickTime);
  };

  // Function to add a new section
  const handleAddSection = () => {
    addSection('body'); // Pass section type directly
  };

  // Get section color based on type
  const getSectionColor = (type: string): string => {
    switch (type) {
      case 'intro':
        return 'bg-blue-500';
      case 'hook':
        return 'bg-purple-500';
      case 'body':
        return 'bg-green-500';
      case 'callToAction':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate section width as percentage of total duration
  const getSectionWidth = (duration: number): number => {
    if (totalDuration === 0) return 0;
    return (duration / totalDuration) * 100;
  };

  return (
    <div className={cn("bg-white border-t h-20 flex flex-col", className)}>
      {/* Timeline section tabs and controls */}
      <div className="flex items-center px-4 h-8 border-b border-gray-100">
        {state.template.sections.map((section, index) => (
          <button
            key={section.id}
            className={cn(
              "flex items-center px-3 h-7 text-xs rounded-t-md mr-1 transition-colors duration-150",
              state.ui.selectedSectionId === section.id
                ? "bg-gray-100 font-medium"
                : "hover:bg-gray-50"
            )}
            onClick={() => selectSection(section.id)}
          >
            <span className={cn("w-2 h-2 rounded-full mr-2", getSectionColor(section.type))}></span>
            <span>
              {section.name || `${section.type.charAt(0).toUpperCase() + section.type.slice(1)} ${index + 1}`}
            </span>
            <span className="ml-2 text-gray-400 flex items-center">
              <Clock size={10} className="mr-1" />
              {section.duration}s
            </span>
          </button>
        ))}
        
        <button
          className="flex items-center px-2 h-7 text-xs text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-150"
          onClick={handleAddSection}
        >
          <Plus size={14} className="mr-1" />
          Add Section
        </button>
        
        {/* Control elements in the right side of the timeline header */}
        <div className="ml-auto flex items-center gap-2">
          {/* Beat sync controller - Make it visible all the time for now */}
          <BeatSyncController className="mr-2" />
          
          {/* Playback control */}
          <button
            className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-150"
            onClick={togglePlayback}
            title={state.ui.playing ? "Pause" : "Play"}
          >
            {state.ui.playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>
      
      {/* Timeline visualization */}
      <div className="flex-1 px-4 py-2 flex items-center">
        <button
          className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-150 mr-2"
          title="Previous Section"
          onClick={() => {
            const currentIndex = state.template.sections.findIndex(
              (s) => s.id === state.ui.selectedSectionId
            );
            
            if (currentIndex > 0) {
              selectSection(state.template.sections[currentIndex - 1].id);
            }
          }}
        >
          <ChevronLeft size={18} />
        </button>
        
        <div
          ref={timelineRef}
          className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Empty state */}
          {state.template.sections.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
              No sections added yet. Add a section to get started.
            </div>
          )}
          
          {/* Timeline sections */}
          <div className="flex h-full">
            {state.template.sections.map((section) => (
              <div
                key={section.id}
                className={cn(
                  "h-full relative", 
                  getSectionColor(section.type),
                  state.ui.selectedSectionId === section.id ? "opacity-100" : "opacity-80"
                )}
                style={{ width: `${getSectionWidth(section.duration)}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectSection(section.id);
                }}
              >
                {/* Section divider */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-white"></div>
                
                {/* Section label (only shown if wide enough) */}
                {getSectionWidth(section.duration) > 10 && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                    {section.duration}s
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Playhead */}
          {state.template.sections.length > 0 && (
            <motion.div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none"
              style={{ left: `${playheadPosition * 100}%` }}
              initial={{ height: "50%" }}
              animate={{ height: "100%" }}
              transition={{ duration: 0.2 }}
            />
          )}
        </div>
        
        <button
          className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-150 ml-2"
          title="Next Section"
          onClick={() => {
            const currentIndex = state.template.sections.findIndex(
              (s) => s.id === state.ui.selectedSectionId
            );
            
            if (
              currentIndex >= 0 &&
              currentIndex < state.template.sections.length - 1
            ) {
              selectSection(state.template.sections[currentIndex + 1].id);
            }
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default EditorTimeline; 