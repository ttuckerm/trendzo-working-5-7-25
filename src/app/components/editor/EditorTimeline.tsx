"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useEditor } from "@/lib/contexts/EditorContext";
import { Clock, ChevronRight, ChevronLeft, Plus } from "lucide-react";

interface EditorTimelineProps {
  className?: string;
}

export const EditorTimeline: React.FC<EditorTimelineProps> = ({ 
  className = "" 
}) => {
  const { state, dispatch, addSection } = useEditor();
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

  // Get playhead position when clicking timeline
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || totalDuration === 0) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    
    setPlayheadPosition(percentage);
    
    // Calculate which section this time corresponds to and select it
    let accumTime = 0;
    for (const section of state.template.sections) {
      accumTime += section.duration;
      
      if (percentage * totalDuration <= accumTime) {
        dispatch({ type: "SET_SELECTED_SECTION", payload: section.id });
        break;
      }
    }
  };

  // Set colors for different section types
  const getSectionColor = (type: string) => {
    switch (type) {
      case "intro":
        return "bg-blue-500";
      case "hook":
        return "bg-purple-500";
      case "body":
        return "bg-green-500";
      case "callToAction":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get width percentage for a section
  const getSectionWidth = (duration: number) => {
    if (totalDuration === 0) return 0;
    return (duration / totalDuration) * 100;
  };

  return (
    <div className={`bg-white border-t h-20 flex flex-col ${className}`}>
      {/* Timeline section tabs */}
      <div className="flex items-center px-4 h-8 border-b border-gray-100">
        {state.template.sections.map((section, index) => (
          <button
            key={section.id}
            className={`flex items-center px-3 h-7 text-xs rounded-t-md mr-1 transition-colors duration-150 ${
              state.ui.selectedSectionId === section.id
                ? "bg-gray-100 font-medium"
                : "hover:bg-gray-50"
            }`}
            onClick={() => dispatch({ type: "SET_SELECTED_SECTION", payload: section.id })}
          >
            <span className={`w-2 h-2 rounded-full ${getSectionColor(section.type)} mr-2`}></span>
            <span>
              {section.type.charAt(0).toUpperCase() + section.type.slice(1)} {index + 1}
            </span>
            <span className="ml-2 text-gray-400 flex items-center">
              <Clock size={10} className="mr-1" />
              {section.duration}s
            </span>
          </button>
        ))}
        
        <button
          className="flex items-center px-2 h-7 text-xs text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-150"
          onClick={() => {
            const nextType = state.template.sections.length === 0
              ? "intro"
              : state.template.sections.length === 1
                ? "hook"
                : state.template.sections.length === 2
                  ? "body"
                  : "callToAction";
            
            addSection(nextType as any);
          }}
        >
          <Plus size={14} className="mr-1" />
          Add Section
        </button>
      </div>
      
      {/* Timeline visualization */}
      <div className="flex-1 flex items-center px-4">
        <button
          className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-150 mr-2"
          title="Previous Section"
          onClick={() => {
            const currentIndex = state.template.sections.findIndex(
              (s) => s.id === state.ui.selectedSectionId
            );
            
            if (currentIndex > 0) {
              dispatch({
                type: "SET_SELECTED_SECTION",
                payload: state.template.sections[currentIndex - 1].id,
              });
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
                className={`h-full relative ${getSectionColor(section.type)} ${
                  state.ui.selectedSectionId === section.id ? "opacity-100" : "opacity-80"
                }`}
                style={{ width: `${getSectionWidth(section.duration)}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: "SET_SELECTED_SECTION", payload: section.id });
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
              dispatch({
                type: "SET_SELECTED_SECTION",
                payload: state.template.sections[currentIndex + 1].id,
              });
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