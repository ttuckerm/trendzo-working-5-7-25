'use client';

import { useState, useEffect } from 'react';
import { useAudio } from '@/lib/hooks/useAudio';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AudioButton from '@/components/audio/AudioButton';
import { Sound } from '@/lib/types/sounds';

export default function TestAudioButtonPage() {
  const [testSound, setTestSound] = useState<Sound | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { currentSound, isPlaying, toggle, setSound } = useAudio();

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [`${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`, ...prev]);
  };

  // Custom console.log override for this page
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      originalConsoleLog(...args);
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('audio') || args[0].includes('sound') || args[0].includes('AudioButton'))) {
        setLogs(prev => [`${new Date().toISOString().split('T')[1].split('.')[0]} - ${args.join(' ')}`, ...prev]);
      }
    };
    
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  const fetchTestSound = async () => {
    try {
      setLoading(true);
      addLog('Fetching test sound...');
      
      const response = await fetch('/api/test-audio-button');
      const data = await response.json();
      
      if (data.success && data.sound) {
        // Convert to Sound type
        const sound: Sound = {
          id: data.sound.id,
          title: data.sound.title,
          artist: data.sound.authorName,
          url: data.sound.playUrl,
          duration: data.sound.duration,
          coverImage: data.sound.coverMedium,
          // Add other required properties
          waveform: null,
          templates: [],
          tags: [],
          stats: data.sound.stats,
          likes: 0,
          hasLiked: false,
          createdAt: new Date(data.sound.creationDate),
        };
        
        setTestSound(sound);
        addLog(`Test sound loaded: ${sound.title} by ${sound.artist}`);
      }
    } catch (error) {
      addLog(`Error fetching test sound: ${error}`);
      console.error('Error fetching test sound:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetSound = () => {
    if (testSound) {
      setSound(testSound);
      addLog(`Manually set current sound to: ${testSound.title}`);
    }
  };

  const handleToggleSound = () => {
    toggle();
    addLog(`Manually toggled sound: isPlaying was ${isPlaying}`);
  };

  const clearCurrentSound = () => {
    setSound(null);
    addLog('Cleared current sound');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Audio Button Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle>Audio Controls</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col space-y-3">
              <Button 
                variant="outline" 
                onClick={fetchTestSound} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Loading...' : 'Fetch Test Sound'}
              </Button>
              
              <Button 
                variant="default" 
                onClick={handleSetSound}
                disabled={!testSound}
                className="w-full"
              >
                Set Current Sound
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={handleToggleSound}
                className="w-full"
              >
                Toggle Play/Pause
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={clearCurrentSound}
                className="w-full"
              >
                Clear Current Sound
              </Button>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Current State</h3>
              <div className="p-4 rounded-md bg-muted/50 font-mono text-sm">
                <p><strong>Current Sound:</strong> {currentSound ? currentSound.title : 'None'}</p>
                <p><strong>Is Playing:</strong> {isPlaying ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Testing the AudioButton</h3>
              <div className="relative h-24 bg-muted/50 rounded-lg flex items-center justify-center">
                <div className="absolute bottom-4 right-4">
                  <AudioButton />
                </div>
                <p className="text-muted-foreground">The AudioButton should appear in the bottom right</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto font-mono text-xs p-4">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="py-1 border-b border-border/30">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground py-2">No logs yet. Interact with the audio button to see logs.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 