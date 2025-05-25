"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTemplateEditor } from './TemplateEditorContext';
import { Play, Pause, SkipBack, Volume2, VolumeX, Mic } from 'lucide-react';
import { Element, ElementType } from './types';

export const PreviewSystem: React.FC = () => {
  const { state } = useTemplateEditor();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceCommandActive, setIsVoiceCommandActive] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  // References to media elements
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Calculate total duration based on sections
  useEffect(() => {
    let total = 0;
    state.template.sections.forEach(section => {
      total += section.duration || 5; // Default to 5 seconds if not specified
    });
    setDuration(total);
  }, [state.template.sections]);
  
  // Handle play/pause
  const togglePlayback = () => {
    const newPlayState = !isPlaying;
    setIsPlaying(newPlayState);
    
    // Control all media elements
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        if (newPlayState) {
          video.play().catch(err => console.error('Error playing video:', err));
        } else {
          video.pause();
        }
      }
    });
    
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        if (newPlayState) {
          audio.play().catch(err => console.error('Error playing audio:', err));
        } else {
          audio.pause();
        }
      }
    });
  };
  
  // Handle scrubbing
  const handleTimeUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    // Update all media elements to the new time
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.currentTime = newTime;
      }
    });
    
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.currentTime = newTime;
      }
    });
  };
  
  // Handle mute toggle
  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    // Mute/unmute all media elements
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.muted = newMuteState;
      }
    });
    
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.muted = newMuteState;
      }
    });
  };
  
  // Reset to beginning
  const resetPlayback = () => {
    setCurrentTime(0);
    
    // Reset all media elements
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.currentTime = 0;
      }
    });
    
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.currentTime = 0;
      }
    });
    
    // If playing, restart from beginning
    if (isPlaying) {
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.play().catch(err => console.error('Error playing video:', err));
        }
      });
      
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.play().catch(err => console.error('Error playing audio:', err));
        }
      });
    }
  };
  
  // Toggle voice command mode
  const toggleVoiceCommand = () => {
    setIsVoiceCommandActive(prev => !prev);
    setVoiceError(null);
    
    if (!isVoiceCommandActive) {
      // Start voice recognition
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          
          recognition.onresult = (event) => {
            const transcript = event.results[event.resultIndex][0].transcript.toLowerCase();
            processVoiceCommand(transcript);
          };
          
          recognition.onerror = (event) => {
            setVoiceError(`Speech recognition error: ${event.error}`);
          };
          
          recognition.start();
        } else {
          setVoiceError('Speech recognition not supported in this browser');
        }
      } catch (error) {
        setVoiceError('Failed to initialize speech recognition');
        console.error('Voice command error:', error);
      }
    }
  };
  
  // Process voice commands
  const processVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    
    // Basic command processing
    if (command.includes('play')) {
      if (!isPlaying) togglePlayback();
    } else if (command.includes('pause') || command.includes('stop')) {
      if (isPlaying) togglePlayback();
    } else if (command.includes('restart') || command.includes('reset')) {
      resetPlayback();
    } else if (command.includes('mute')) {
      if (!isMuted) toggleMute();
    } else if (command.includes('unmute')) {
      if (isMuted) toggleMute();
    }
    
    // Turn off voice command mode after processing
    setIsVoiceCommandActive(false);
  };
  
  // Get canvas dimensions based on aspect ratio
  const getCanvasDimensions = () => {
    const baseHeight = 500;
    
    switch (state.template.aspectRatio) {
      case "9:16":
        return { width: baseHeight * (9/16), height: baseHeight };
      case "1:1":
        return { width: baseHeight, height: baseHeight };
      case "4:5":
        return { width: baseHeight * (4/5), height: baseHeight };
      default:
        return { width: baseHeight * (9/16), height: baseHeight };
    }
  };
  
  // Render a preview element
  const renderPreviewElement = (element: Element, sectionId: string) => {
    if (!element) return null;
    if (element.hidden) return null;
    
    const elementStyles: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      opacity: element.opacity !== undefined ? element.opacity : 1,
      zIndex: element.zIndex || 1,
    };
    
    switch (element.type) {
      case "text":
        return (
          <div
            key={element.id}
            data-testid={`preview-element-${element.id}`}
            style={{
              ...elementStyles,
              backgroundColor: element.backgroundColor || 'transparent',
              color: element.color || '#000',
              fontSize: `${element.fontSize || 16}px`,
              fontWeight: element.fontWeight || 'normal',
              fontFamily: element.fontFamily || 'sans-serif',
              textAlign: (element.textAlign as any) || 'left',
              overflow: 'hidden',
              padding: '8px',
            }}
          >
            {element.content}
          </div>
        );
        
      case "image":
        return (
          <div
            key={element.id}
            data-testid={`preview-element-${element.id}`}
            style={{
              ...elementStyles,
              backgroundColor: '#f0f0f0',
              backgroundImage: element.src ? `url(${element.src})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!element.src && (
              <div data-testid="asset-error-placeholder" className="text-red-500 text-xs p-2">
                Image failed to load
              </div>
            )}
          </div>
        );
        
      case "video":
        return (
          <div
            key={element.id}
            data-testid={`preview-element-${element.id}`}
            style={elementStyles}
          >
            {element.src ? (
              <video
                ref={el => videoRefs.current[element.id] = el}
                src={element.src}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                muted={isMuted}
                loop
                onError={() => {
                  console.error(`Error loading video: ${element.src}`);
                }}
              />
            ) : (
              <div data-testid="asset-error-placeholder" className="text-red-500 text-xs p-2">
                Video failed to load
              </div>
            )}
          </div>
        );
        
      case "audio":
        return (
          <div
            key={element.id}
            data-testid={`preview-element-${element.id}`}
            style={elementStyles}
          >
            {element.src ? (
              <>
                <audio
                  ref={el => audioRefs.current[element.id] = el}
                  src={element.src}
                  muted={isMuted}
                  loop
                  onError={() => {
                    console.error(`Error loading audio: ${element.src}`);
                  }}
                />
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                  <Volume2 size={24} className="text-gray-400" />
                </div>
              </>
            ) : (
              <div data-testid="asset-error-placeholder" className="text-red-500 text-xs p-2">
                Audio failed to load
              </div>
            )}
          </div>
        );
        
      case "shape":
        return (
          <div
            key={element.id}
            data-testid={`preview-element-${element.id}`}
            style={{
              ...elementStyles,
              backgroundColor: element.backgroundColor || '#4299e1',
              borderRadius: '4px',
            }}
          />
        );
        
      default:
        return null;
    }
  };
  
  const canvasDimensions = getCanvasDimensions();
  const aspectRatio = state.template.aspectRatio.replace(':', '/');
  
  // Get active section
  const activeSection = state.template.sections.find(
    section => section.id === state.ui.selectedSectionId
  ) || state.template.sections[0];
  
  return (
    <div className="flex flex-col h-full" data-testid="preview-system">
      {/* Preview canvas */}
      <div className="flex-1 flex items-center justify-center bg-gray-800 p-4 overflow-hidden">
        <div
          ref={canvasRef}
          data-testid="preview-canvas"
          className="relative bg-white shadow-lg"
          style={{
            width: `${canvasDimensions.width}px`,
            height: `${canvasDimensions.height}px`,
            aspectRatio,
          }}
        >
          {/* Background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: activeSection.backgroundColor || '#ffffff',
              backgroundImage: activeSection.backgroundImage ? `url(${activeSection.backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          
          {/* Elements */}
          {activeSection.elements.map(element => 
            renderPreviewElement(element, activeSection.id)
          )}
          
          {/* Voice command overlay */}
          {isVoiceCommandActive && (
            <div
              data-testid="voice-command-ui"
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <div className="bg-white p-4 rounded-lg text-center">
                <Mic size={32} className="mx-auto mb-2 text-blue-500 animate-pulse" />
                <p className="font-medium">Listening for commands...</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try saying: play, pause, restart, mute, unmute
                </p>
                {voiceError && (
                  <div data-testid="voice-error-message" className="mt-2 text-red-500 text-sm">
                    Error: {voiceError === 'not-allowed' ? 'Microphone access denied' : voiceError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Playback controls */}
      <div className="bg-gray-900 p-4 flex items-center space-x-4">
        <button
          data-testid="play-button"
          onClick={togglePlayback}
          className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        
        <button
          onClick={resetPlayback}
          className="text-white"
        >
          <SkipBack size={20} />
        </button>
        
        <div className="flex-1">
          <input
            data-testid="timeline-scrubber"
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={handleTimeUpdate}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <button
          onClick={toggleMute}
          className="text-white"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        
        <button
          data-testid="preview-voice-command"
          onClick={toggleVoiceCommand}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
            isVoiceCommandActive ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          <Mic size={16} />
        </button>
      </div>
    </div>
  );
};

// Helper function to format time
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Type declaration for the SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
} 