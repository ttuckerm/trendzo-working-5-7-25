'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Play, Square, Video, Mic, MicOff, Camera, CameraOff,
  RotateCcw, Check, ChevronUp, ChevronDown, Pause, Settings
} from 'lucide-react';

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: string;
  onComplete: (videoBlob: Blob | null) => void;
}

type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'review';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function TeleprompterModal({ isOpen, onClose, script, onComplete }: TeleprompterModalProps) {
  // Camera and recording refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);

  // Script scrolling refs
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Split script into lines for highlighting
  const scriptLines = script.split(/[.!?]+/).filter(line => line.trim().length > 0);

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setHasPermission(true);
    } catch (error) {
      console.error('Camera access error:', error);
      setHasPermission(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    if (isOpen) {
      initCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isOpen, initCamera]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (recordingState === 'recording') {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingState]);

  // Auto-scroll script
  useEffect(() => {
    if (recordingState === 'recording') {
      const scrollContainer = scriptContainerRef.current;
      if (!scrollContainer) return;

      const scrollAmount = 1 * scrollSpeed; // pixels per interval
      const intervalMs = 50;

      scrollIntervalRef.current = setInterval(() => {
        scrollContainer.scrollTop += scrollAmount;

        // Update current line based on scroll position
        const scrollTop = scrollContainer.scrollTop;
        const lineHeight = 60; // approximate line height
        const newLineIndex = Math.floor(scrollTop / lineHeight);
        if (newLineIndex !== currentLineIndex && newLineIndex < scriptLines.length) {
          setCurrentLineIndex(newLineIndex);
        }
      }, intervalMs);
    } else if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [recordingState, scrollSpeed, currentLineIndex, scriptLines.length]);

  // Start recording
  const startRecording = () => {
    setRecordingState('countdown');
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          beginActualRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginActualRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      recordedBlobRef.current = blob;
      setRecordingState('review');
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setRecordingState('recording');
    setRecordingTime(0);
    setCurrentLineIndex(0);

    // Reset scroll position
    if (scriptContainerRef.current) {
      scriptContainerRef.current.scrollTop = 0;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const retakeRecording = () => {
    recordedBlobRef.current = null;
    setRecordingState('idle');
    setRecordingTime(0);
    setCurrentLineIndex(0);

    if (scriptContainerRef.current) {
      scriptContainerRef.current.scrollTop = 0;
    }
  };

  const completeRecording = () => {
    onComplete(recordedBlobRef.current);
    onClose();
  };

  const skipRecording = () => {
    onComplete(null);
    onClose();
  };

  // Toggle camera/mic
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">Step 4: Record Video</h2>
          <p className="text-sm text-gray-400">TRENDZO VIRAL PREDICTOR</p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Camera Preview - 60% */}
        <div className="w-3/5 flex flex-col items-center justify-center p-8 relative">
          {/* Phone mockup frame */}
          <div className="relative w-full max-w-md aspect-[9/16] bg-gray-900 rounded-[3rem] border-4 border-gray-700 overflow-hidden shadow-2xl">
            {hasPermission === false ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <CameraOff className="w-16 h-16 mb-4" />
                <p className="text-center px-4">Camera access denied. Please enable camera permissions.</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            )}

            {/* Countdown overlay */}
            {recordingState === 'countdown' && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="text-8xl font-bold text-white animate-pulse">{countdown}</span>
              </div>
            )}

            {/* Recording indicator */}
            {recordingState === 'recording' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 px-3 py-1 rounded-full">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="text-white font-medium text-sm">
                  RECORDING {formatTime(recordingTime)}
                </span>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full transition-colors ${micEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500/20 text-red-400'}`}
            >
              {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleCamera}
              className={`p-3 rounded-full transition-colors ${cameraEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500/20 text-red-400'}`}
            >
              {cameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Script Panel - 40% */}
        <div className="w-2/5 bg-gray-900/50 border-l border-gray-800 flex flex-col">
          {/* Script Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h3 className="font-semibold text-white">Your Script</h3>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const idx = SPEED_OPTIONS.indexOf(scrollSpeed);
                  if (idx > 0) setScrollSpeed(SPEED_OPTIONS[idx - 1]);
                }}
                className="p-1 rounded hover:bg-gray-700"
                disabled={scrollSpeed === SPEED_OPTIONS[0]}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 min-w-[3rem] text-center">{scrollSpeed}x</span>
              <button
                onClick={() => {
                  const idx = SPEED_OPTIONS.indexOf(scrollSpeed);
                  if (idx < SPEED_OPTIONS.length - 1) setScrollSpeed(SPEED_OPTIONS[idx + 1]);
                }}
                className="p-1 rounded hover:bg-gray-700"
                disabled={scrollSpeed === SPEED_OPTIONS[SPEED_OPTIONS.length - 1]}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Script Content */}
          <div
            ref={scriptContainerRef}
            className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth"
          >
            <div className="space-y-4">
              {scriptLines.map((line, index) => (
                <p
                  key={index}
                  className={`text-lg leading-relaxed transition-all duration-300 p-3 rounded-lg ${
                    index === currentLineIndex
                      ? 'bg-pink-500/20 text-white border-l-4 border-pink-500'
                      : index < currentLineIndex
                        ? 'text-gray-600'
                        : 'text-gray-400'
                  }`}
                >
                  {line.trim()}.
                </p>
              ))}
              {/* Extra space at bottom for scrolling */}
              <div className="h-64" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="border-t border-gray-800 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          {recordingState === 'idle' && (
            <>
              <button
                onClick={skipRecording}
                className="px-6 py-3 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-800 transition-colors"
              >
                Skip Recording
              </button>
              <button
                onClick={startRecording}
                disabled={!hasPermission}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              >
                <Video className="w-5 h-5" />
                Start Recording
              </button>
            </>
          )}

          {recordingState === 'countdown' && (
            <div className="text-gray-400 text-lg">Get ready...</div>
          )}

          {recordingState === 'recording' && (
            <button
              onClick={stopRecording}
              className="px-8 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <Square className="w-5 h-5 fill-current" />
              Stop Recording
            </button>
          )}

          {recordingState === 'review' && (
            <>
              <button
                onClick={retakeRecording}
                className="px-6 py-3 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </button>
              <button
                onClick={completeRecording}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:scale-105 transition-all flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Use This Video
              </button>
            </>
          )}
        </div>

        {/* AI Coach hint */}
        <p className="text-center text-gray-500 text-sm mt-4">
          {recordingState === 'idle' && "Read naturally and look at the camera. You've got this!"}
          {recordingState === 'recording' && "Great! Keep going, the script will scroll automatically."}
          {recordingState === 'review' && "Nice take! Review your recording and decide if you want to keep it."}
        </p>
      </div>
    </div>
  );
}

export default TeleprompterModal;
