'use client';

import React, { useRef, useEffect } from 'react';

interface VideoPreviewProps {
  src: string;
  isSelected?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  startTime?: number;
  endTime?: number;
  width?: number;
  height?: number;
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadedData?: () => void;
  onError?: (error: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  'data-testid'?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  src,
  isSelected = false,
  autoplay = false,
  loop = false,
  muted = true,
  controls = false,
  startTime = 0,
  endTime,
  width,
  height,
  className = '',
  onTimeUpdate,
  onLoadedData,
  onError,
  'data-testid': dataTestId = 'video-preview',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Handle time updates to implement start/end time functionality
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const handleTimeUpdate = () => {
      // Call onTimeUpdate callback if provided
      if (onTimeUpdate) {
        onTimeUpdate(videoElement.currentTime);
      }
      
      // If current time exceeds end time, go back to start time
      if (endTime !== undefined && videoElement.currentTime >= endTime) {
        videoElement.pause();
        videoElement.currentTime = startTime;
        if (loop) {
          videoElement.play().catch(() => {
            console.log('Failed to auto-play after loop');
          });
        }
      }
    };
    
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    
    // Set initial time when metadata is loaded
    const handleLoadedMetadata = () => {
      if (startTime !== undefined) {
        videoElement.currentTime = startTime;
      }
    };
    
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [startTime, endTime, loop, onTimeUpdate]);
  
  // Handle autoplay when selected changes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    if (isSelected && autoplay) {
      videoElement.play().catch(() => {
        // Autoplay might fail due to browser restrictions
        console.log('Autoplay prevented by browser');
      });
    } else if (!isSelected) {
      videoElement.pause();
    }
  }, [isSelected, autoplay]);
  
  // Handle loaded data event
  const handleLoadedData = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (onLoadedData) {
      onLoadedData();
    }
  };
  
  // Handle error event
  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (onError) {
      onError(e);
    }
  };
  
  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400" data-testid={dataTestId}>
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <span className="text-xs">No video</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full overflow-hidden" data-testid={dataTestId}>
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-full object-contain block object-cover ${isSelected ? 'border border-blue-500' : ''} ${className}`}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        controls={controls || isSelected}
        playsInline
        width={width}
        height={height}
        onLoadedData={handleLoadedData}
        onError={handleError}
        role="img"
      />
    </div>
  );
}; 