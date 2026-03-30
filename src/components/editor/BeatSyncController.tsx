"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Music, 
  Vibrate, 
  X, 
  RefreshCw, 
  AlertCircle,
  CheckCircle 
} from 'lucide-react';
import { useBeatSyncAnimation } from '@/lib/hooks/useBeatSyncAnimation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAudio } from '@/lib/contexts/AudioContext';

interface BeatSyncControllerProps {
  className?: string;
  showControls?: boolean;
}

/**
 * A controller component that handles beat detection and animation syncing
 * for the template editor.
 */
const BeatSyncController: React.FC<BeatSyncControllerProps> = ({
  className,
  showControls = true
}) => {
  const { 
    syncPoints, 
    isSyncing, 
    error, 
    generateSyncPoints, 
    clearSyncPoints,
    hasSyncPoints
  } = useBeatSyncAnimation({ autoSync: false });
  
  const { state: audioState } = useAudio();
  const [expanded, setExpanded] = useState(false);
  
  // We'll keep it expanded even without sound for demonstration purposes
  useEffect(() => {
    // Keep it expanded for better visibility in this test
    if (!expanded) {
      setExpanded(true);
    }
  }, [expanded]);
  
  // Show toast when sync completes
  useEffect(() => {
    if (syncPoints.length > 0 && !isSyncing) {
      toast.success(`Detected ${syncPoints.length} beats for animations`, {
        duration: 3000,
      });
    }
  }, [syncPoints.length, isSyncing]);
  
  if (!showControls) {
    return null;
  }
  
  const handleSync = () => {
    if (!audioState.currentSound) {
      toast.error('Please select a sound first', {
        duration: 3000,
      });
      return;
    }
    
    generateSyncPoints();
  };
  
  const handleClear = () => {
    clearSyncPoints();
    toast.success('Beat animations cleared', {
      duration: 2000,
    });
  };
  
  if (!expanded) {
    return (
      <Button
        variant="default"
        size="sm"
        className={cn("flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white", className)}
        onClick={() => setExpanded(true)}
      >
        <Vibrate className="h-4 w-4" />
        <span>Beat Sync</span>
      </Button>
    );
  }
  
  return (
    <div className={cn("rounded-md border bg-background p-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Beat Animation Sync</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={() => setExpanded(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-800 text-xs p-2 rounded mb-2 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
      
      {hasSyncPoints && (
        <div className="bg-green-50 text-green-800 text-xs p-2 rounded mb-2 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>{syncPoints.length} beat-synced animations ready</span>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isSyncing}
          className="w-full"
          onClick={handleSync}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Vibrate className="h-3 w-3 mr-1" />
              {hasSyncPoints ? 'Resync Beats' : 'Detect Beats'}
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          disabled={!hasSyncPoints || isSyncing}
          className="w-full"
          onClick={handleClear}
        >
          <X className="h-3 w-3 mr-1" />
          Clear Sync
        </Button>
      </div>
      
      {!audioState.currentSound && (
        <div className="mt-2 text-xs text-muted-foreground">
          Please select a sound in the template editor to use beat sync
        </div>
      )}
    </div>
  );
};

export default BeatSyncController; 