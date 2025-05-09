'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Scissors,
  XCircle,
  Check
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  XAxis,
} from 'recharts';

interface SoundPlayerProps {
  soundUrl: string;
  soundTitle?: string;
  waveformData?: Array<{ value: number }>;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onError?: (errorMessage: string) => void;
  allowTrimming?: boolean; // Premium feature flag
  className?: string;
  compact?: boolean;
  autoPlay?: boolean;
  demoMode?: boolean; // Skips actual audio loading and just shows UI
}

export default function SoundPlayer({
  soundUrl,
  soundTitle,
  waveformData: initialWaveformData,
  onTimeUpdate,
  onError,
  allowTrimming = false,
  className = '',
  compact = false,
  autoPlay = false,
  demoMode = false
}: SoundPlayerProps) {
  // State for audio controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // State for waveform visualization
  const [waveformData, setWaveformData] = useState<Array<{ value: number }> | undefined>(
    initialWaveformData
  );
  
  // State for trimming features
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [originalDuration, setOriginalDuration] = useState(0);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const trimStartHandleRef = useRef<HTMLDivElement | null>(null);
  const trimEndHandleRef = useRef<HTMLDivElement | null>(null);
  
  // Generate waveform data if not provided
  useEffect(() => {
    if (!initialWaveformData && isLoaded && duration > 0) {
      generateWaveformData();
    }
  }, [initialWaveformData, isLoaded, duration]);
  
  // Generate synthetic waveform data based on audio duration
  const generateWaveformData = () => {
    const bars = 50; // Number of bars in waveform
    const generatedData = [];
    
    for (let i = 0; i < bars; i++) {
      // Create a semi-random waveform with a pattern
      const baseHeight = 20 + Math.sin(i / 3) * 30 + Math.cos(i / 5) * 20;
      const randomFactor = Math.random() * 30;
      generatedData.push({ value: baseHeight + randomFactor });
    }
    
    setWaveformData(generatedData);
  };
  
  // Handle audio loading events
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setOriginalDuration(audioRef.current.duration);
      setTrimEnd(audioRef.current.duration);
      setIsLoaded(true);
      
      // Auto-play if specified
      if (autoPlay) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.error('Auto-play failed:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [autoPlay]);
  
  // Handle audio loading errors
  const handleLoadError = () => {
    const errorMessage = audioRef.current ? 
      `Error loading audio file: ${audioRef.current.error?.message || 'Unknown error'}` : 
      'Error loading audio file';
    
    console.error(`Audio error for ${soundUrl}:`, audioRef.current?.error);
    setLoadError(errorMessage);
    setIsLoaded(false);
    
    // Generate fake waveform data if none exists and we have an error
    if (!waveformData) {
      generateWaveformData();
    }
    
    // Set a fake duration to allow UI interaction even without audio
    if (duration === 0) {
      setDuration(30); // Set a default 30 second duration
      setOriginalDuration(30);
      setTrimEnd(30);
    }
    
    // Call the onError callback if provided
    if (onError) {
      onError(errorMessage);
    }
  };
  
  // Update audio time as it plays
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      // Call the onTimeUpdate callback if provided
      if (onTimeUpdate) {
        onTimeUpdate(time, audioRef.current.duration);
      }
      
      // Handle trim boundaries during playback
      if (isTrimming && time >= trimEnd) {
        if (isLooping) {
          audioRef.current.currentTime = trimStart;
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    }
  }, [isTrimming, trimEnd, trimStart, isLooping, onTimeUpdate]);
  
  // Set up audio event listeners
  useEffect(() => {
    // In demo mode, skip actual audio loading and set up fake data
    if (demoMode) {
      setDuration(30); // 30 seconds demo duration
      setOriginalDuration(30);
      setTrimEnd(30);
      setIsLoaded(true);
      return;
    }
    
    const audio = audioRef.current;
    
    if (audio) {
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleLoadError);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      
      // Add a debugging log
      console.log(`Setting up audio with URL: ${soundUrl}`);
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleLoadError);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [handleLoadedMetadata, handleTimeUpdate, soundUrl, demoMode]);
  
  // Control play/pause state
  useEffect(() => {
    // In demo mode, just update the UI state without actual audio
    if (demoMode) {
      return;
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, demoMode]);
  
  // Control looping state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping && !isTrimming;
    }
  }, [isLooping, isTrimming]);
  
  // Control volume and mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Handle end of audio playback
  const handleEnded = () => {
    // Only auto-stop if not looping or if we're not trimming
    // (trimming with looping is handled in timeUpdate)
    if (!isLooping || isTrimming) {
      setIsPlaying(false);
      if (audioRef.current) {
        // If trimming is active, go back to trim start when ended
        if (isTrimming) {
          audioRef.current.currentTime = trimStart;
        } else {
          audioRef.current.currentTime = 0;
        }
      }
    }
  };
  
  // Simulate playback in demo mode or when audio fails to load
  useEffect(() => {
    let playbackSimulator: NodeJS.Timeout | null = null;
    
    // If in demo mode or we have a load error but the user is trying to play
    if ((demoMode || loadError) && isPlaying) {
      // Simulate playback by incrementing currentTime
      playbackSimulator = setInterval(() => {
        setCurrentTime(prevTime => {
          // Handle looping if enabled
          if (isLooping && prevTime >= trimEnd) {
            return trimStart;
          }
          
          // Handle reaching the end
          if (prevTime >= trimEnd) {
            clearInterval(playbackSimulator!);
            setIsPlaying(false);
            return prevTime;
          }
          
          // Normal increment
          const newTime = prevTime + 0.25; // Update every 250ms, increment by 0.25 seconds
          
          // Call time update callback
          if (onTimeUpdate) {
            onTimeUpdate(newTime, duration);
          }
          
          return newTime;
        });
      }, 250);
    }
    
    return () => {
      if (playbackSimulator) {
        clearInterval(playbackSimulator);
      }
    };
  }, [demoMode, isPlaying, loadError, isLooping, duration, trimStart, trimEnd, onTimeUpdate]);
  
  // Toggle play/pause state
  const togglePlay = () => {
    if (audioRef.current && !demoMode && !loadError) {
      if (!isPlaying) {
        // Apply trim position when starting playback
        if (isTrimming && currentTime < trimStart) {
          audioRef.current.currentTime = trimStart;
          setCurrentTime(trimStart);
        }
        
        // Start playback
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            setLoadError(`Error playing audio: ${error.message}`);
            
            // Even if audio fails to play, we can still simulate playback in demo mode
            setIsPlaying(true);
          });
      } else {
        // Pause playback
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      // In demo mode or if there's an error, just toggle the state
      setIsPlaying(!isPlaying);
    }
  };
  
  // Restart audio playback
  const restartAudio = () => {
    if (audioRef.current && !demoMode && !loadError) {
      // For real audio playback
      audioRef.current.currentTime = isTrimming ? trimStart : 0;
      setCurrentTime(isTrimming ? trimStart : 0);
      
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Error playing audio:', error);
          setLoadError(`Error playing audio: ${error.message}`);
          
          // For simulated playback
          setCurrentTime(isTrimming ? trimStart : 0);
          setIsPlaying(true);
        });
    } else {
      // For simulated playback in demo mode
      setCurrentTime(isTrimming ? trimStart : 0);
      setIsPlaying(true);
    }
  };
  
  // Format time display (mm:ss)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle progress bar interaction
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || isTrimming) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    
    // Ensure the time is within valid range
    const clampedTime = Math.max(0, Math.min(newTime, duration));
    audioRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };
  
  // Start progress bar drag
  const handleProgressBarMouseDown = () => {
    if (isTrimming) return;
    isDraggingRef.current = true;
  };
  
  // Handle progress bar drag
  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !progressBarRef.current || !audioRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const movePosition = (e.clientX - rect.left) / rect.width;
    const newTime = movePosition * duration;
    
    // Ensure the time is within valid range
    const clampedTime = Math.max(0, Math.min(newTime, duration));
    audioRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };
  
  // End progress bar drag
  const handleProgressBarMouseUp = () => {
    isDraggingRef.current = false;
  };
  
  // Register mouse up event globally to handle drag end
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);
  
  // Toggle trim mode
  const toggleTrimMode = () => {
    if (!allowTrimming) return;
    
    if (!isTrimming) {
      // Enter trim mode
      setIsTrimming(true);
      setTrimStart(currentTime);
      setTrimEnd(Math.min(currentTime + 10, duration)); // Default 10 sec slice or end of audio
    } else {
      // Exit trim mode without applying
      setIsTrimming(false);
    }
  };
  
  // Apply trim
  const applyTrim = () => {
    if (!isTrimming || !audioRef.current) return;
    
    // Keep the trim settings active but exit trim edit mode
    setIsTrimming(false);
    
    // Set current time to start of trimmed section
    audioRef.current.currentTime = trimStart;
  };
  
  // Handle trim handles dragging
  const handleTrimHandleMouseDown = (e: React.MouseEvent, isStart: boolean) => {
    e.stopPropagation(); // Prevent progress bar click
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressBarRef.current) return;
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const movePosition = (moveEvent.clientX - rect.left) / rect.width;
      const newTime = movePosition * originalDuration;
      
      // Ensure valid trim range (at least 1 second between handles)
      if (isStart) {
        const maxStart = trimEnd - 1;
        const clampedStart = Math.max(0, Math.min(newTime, maxStart));
        setTrimStart(clampedStart);
        
        if (audioRef.current && audioRef.current.currentTime < clampedStart) {
          audioRef.current.currentTime = clampedStart;
        }
      } else {
        const minEnd = trimStart + 1;
        const clampedEnd = Math.max(minEnd, Math.min(newTime, originalDuration));
        setTrimEnd(clampedEnd);
      }
    };
    
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  if (loadError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600">{loadError}</p>
        <p className="text-gray-600 mt-2 text-sm">Try reloading the page or checking the audio URL: {soundUrl}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Reload Page
        </button>
      </div>
    );
  }
  
  // Calculate positions for progress indicator and trim handles
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trimStartPercentage = originalDuration > 0 ? (trimStart / originalDuration) * 100 : 0;
  const trimEndPercentage = originalDuration > 0 ? (trimEnd / originalDuration) * 100 : 0;
  
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Hidden audio element */}
      {!demoMode && (
        <audio 
          ref={audioRef}
          src={soundUrl}
          preload="metadata"
          onEnded={handleEnded}
        />
      )}
      
      {/* Player header with title */}
      {soundTitle && !compact && (
        <div className="px-4 py-3 border-b">
          <h3 className="text-lg font-medium truncate">{soundTitle}</h3>
        </div>
      )}
      
      {/* Error message display */}
      {loadError && !compact && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-600">{loadError}</p>
          <p className="text-xs text-red-500 mt-1">
            UI controls will still function in demo mode.
          </p>
        </div>
      )}
      
      {/* Waveform visualization */}
      {waveformData && waveformData.length > 0 && !compact && (
        <div className="relative px-4 pt-4">
          <div className="h-20 mb-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waveformData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                {/* Optional X-axis to show trim region */}
                {isTrimming && (
                  <XAxis 
                    dataKey="value" 
                    hide={true}
                    domain={[0, waveformData.length - 1]}
                    type="number"
                  />
                )}
                <Bar 
                  dataKey="value"
                  fill={isPlaying ? '#4f46e5' : '#94a3b8'}
                  isAnimationActive={false}
                  barSize={4}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Progress bar and trim controls */}
      <div className="px-4 pb-2">
        <div 
          ref={progressBarRef}
          className={`relative h-2 bg-gray-200 rounded-full cursor-pointer ${isTrimming ? 'mb-6' : 'mb-2'}`}
          onClick={handleProgressBarClick}
          onMouseDown={handleProgressBarMouseDown}
          onMouseMove={handleProgressBarMouseMove}
          onMouseUp={handleProgressBarMouseUp}
        >
          {/* Trim region highlight */}
          {isTrimming && (
            <div 
              className="absolute top-0 bottom-0 bg-indigo-100"
              style={{
                left: `${trimStartPercentage}%`,
                width: `${trimEndPercentage - trimStartPercentage}%`
              }}
            />
          )}
          
          {/* Progress fill */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-indigo-600 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
          
          {/* Current position indicator */}
          <div 
            className="absolute top-1/2 w-3 h-3 bg-indigo-700 rounded-full -translate-x-1/2 -translate-y-1/2 shadow"
            style={{ left: `${progressPercentage}%` }}
          />
          
          {/* Trim handles */}
          {isTrimming && (
            <>
              <div 
                ref={trimStartHandleRef}
                className="absolute top-1/2 w-4 h-8 bg-white border-2 border-indigo-600 rounded -translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center shadow-md"
                style={{ left: `${trimStartPercentage}%`, top: '150%' }}
                onMouseDown={(e) => handleTrimHandleMouseDown(e, true)}
              >
                <div className="w-0.5 h-3 bg-indigo-600 mx-px" />
              </div>
              <div 
                ref={trimEndHandleRef}
                className="absolute top-1/2 w-4 h-8 bg-white border-2 border-indigo-600 rounded -translate-x-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center shadow-md"
                style={{ left: `${trimEndPercentage}%`, top: '150%' }}
                onMouseDown={(e) => handleTrimHandleMouseDown(e, false)}
              >
                <div className="w-0.5 h-3 bg-indigo-600 mx-px" />
              </div>
            </>
          )}
        </div>
        
        {/* Time indicators */}
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <div>
            {isTrimming ? formatTime(trimStart) : formatTime(currentTime)}
          </div>
          <div>
            {isTrimming 
              ? `Selected: ${formatTime(trimEnd - trimStart)}` 
              : (isLoaded ? formatTime(duration) : '--:--')
            }
          </div>
          <div>
            {isTrimming ? formatTime(trimEnd) : formatTime(duration)}
          </div>
        </div>
      </div>
      
      {/* Player controls */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Restart button */}
          <button
            onClick={restartAudio}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Restart"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          {/* Play/pause button */}
          <button
            onClick={togglePlay}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          {/* Loop toggle */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isLooping ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center">
          {/* Trim controls (premium feature) */}
          {allowTrimming && (
            <div className="flex items-center mr-4">
              {!isTrimming ? (
                <button
                  onClick={toggleTrimMode}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Trim audio"
                >
                  <Scissors className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={toggleTrimMode}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="Cancel trim"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={applyTrim}
                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-label="Apply trim"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Volume controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            {!compact && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                aria-label="Volume"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}