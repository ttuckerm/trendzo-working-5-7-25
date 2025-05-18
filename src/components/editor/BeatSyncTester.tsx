import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import BeatSyncController from './BeatSyncController';
import { AudioProvider } from '@/lib/contexts/AudioContext';
import { EditorProvider } from '@/lib/contexts/EditorContext';
import { detectBeats, loadAudioBuffer, createSyncPointsFromBeats } from '@/lib/utils/simpleBeatDetection';
import { Music, Play, Pause, Loader2 } from 'lucide-react';

/**
 * A standalone component for testing the Beat Sync functionality
 * without relying on the full template editor
 */
const BeatSyncTester: React.FC = () => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beats, setBeats] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Mock elements for testing beat sync
  const testElements = [
    { id: 'text-heading', type: 'text' },
    { id: 'image-logo', type: 'image' },
    { id: 'text-subtitle', type: 'text' },
    { id: 'background-main', type: 'background' }
  ];
  
  // Test audio sources
  const testSources = [
    { name: 'Online Test Beat', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }
  ];
  
  // Set up audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
      audioRef.current.addEventListener('pause', () => setIsPlaying(false));
      audioRef.current.addEventListener('play', () => setIsPlaying(true));
    }
    
    if (audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.load();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioSrc]);
  
  // Play the selected audio
  const playAudio = () => {
    if (audioRef.current && audioSrc) {
      audioRef.current.play();
    }
  };
  
  // Pause the audio
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };
  
  // Directly analyze audio beats without using the controller
  const analyzeBeats = async () => {
    if (!audioSrc) {
      setError('Please select an audio source first');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Load and analyze the audio
      const audioBuffer = await loadAudioBuffer(audioSrc);
      const detectedBeats = await detectBeats(audioBuffer);
      
      // Update state with detected beats
      setBeats(detectedBeats);
      
      // Create sync points from beats (just for testing)
      const syncPoints = createSyncPointsFromBeats(detectedBeats, testElements);
      console.log('Detected beats:', detectedBeats);
      console.log('Created sync points:', syncPoints);
    } catch (err) {
      setError(`Error analyzing beats: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <AudioProvider>
      <EditorProvider>
        <div className="p-4 border rounded-lg max-w-xl mx-auto my-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Music className="h-5 w-5 mr-2" />
            Beat Sync Test
          </h2>
          
          {/* Audio controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Test Audio</h3>
            <div className="grid grid-cols-1 gap-3 mb-4">
              {testSources.map((source) => (
                <Button
                  key={source.url}
                  variant={audioSrc === source.url ? "default" : "outline"}
                  onClick={() => setAudioSrc(source.url)}
                  className="w-full justify-start"
                >
                  {source.name}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={playAudio} 
                disabled={!audioSrc || isPlaying} 
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Play
              </Button>
              <Button 
                onClick={pauseAudio} 
                disabled={!audioSrc || !isPlaying} 
                variant="outline" 
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            </div>
          </div>
          
          {/* Direct beat analysis */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Direct Beat Analysis</h3>
            <div className="mb-3">
              <Button 
                onClick={analyzeBeats} 
                disabled={!audioSrc || isAnalyzing}
                variant="outline"
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Music className="h-4 w-4 mr-2" />
                    Analyze Beats
                  </>
                )}
              </Button>
            </div>
            
            {error && (
              <div className="p-2 text-red-600 bg-red-50 rounded border border-red-200 text-sm mb-3">
                {error}
              </div>
            )}
            
            {beats.length > 0 && (
              <div className="p-2 text-green-700 bg-green-50 rounded border border-green-200 text-sm">
                <p><strong>Analysis results:</strong></p>
                <p>Detected {beats.length} beats in audio</p>
                <p className="text-xs mt-1">First 5 beats at: {beats.slice(0, 5).map(b => b.toFixed(2)).join(', ')} seconds</p>
              </div>
            )}
          </div>
          
          {/* Beat sync controller */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Beat Sync Controller</h3>
            <BeatSyncController />
          </div>
        </div>
      </EditorProvider>
    </AudioProvider>
  );
};

export default BeatSyncTester; 