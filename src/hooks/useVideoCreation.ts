'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { StrategyVideo, StrategyVideoData } from '@/types/database';

interface UseVideoCreationReturn {
  videos: StrategyVideo[];
  activeVideo: StrategyVideo | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchVideos: (strategyId: string) => Promise<void>;
  createVideo: (strategyId: string, initialData?: StrategyVideoData) => Promise<StrategyVideo>;
  updateVideo: (strategyId: string, videoId: string, data: StrategyVideoData) => Promise<StrategyVideo>;
  deleteVideo: (strategyId: string, videoId: string) => Promise<void>;
  selectVideo: (video: StrategyVideo | null) => void;
  // Convenience method for auto-save
  debouncedUpdate: (strategyId: string, videoId: string, data: StrategyVideoData) => void;
}

export function useVideoCreation(): UseVideoCreationReturn {
  const [videos, setVideos] = useState<StrategyVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<StrategyVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce timer for auto-save
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchVideos = useCallback(async (strategyId: string) => {
    if (!strategyId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/strategies/${strategyId}/videos`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch videos');
      }

      setVideos(data.videos);

      // If we have videos but no active one, select the most recent
      if (data.videos.length > 0 && !activeVideo) {
        setActiveVideo(data.videos[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching videos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeVideo]);

  const createVideo = useCallback(async (
    strategyId: string, 
    initialData?: StrategyVideoData
  ): Promise<StrategyVideo> => {
    setError(null);

    try {
      const response = await fetch(`/api/strategies/${strategyId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_data: initialData || {} }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create video');
      }

      const newVideo = result.video;
      setVideos(prev => [newVideo, ...prev]);
      setActiveVideo(newVideo);

      return newVideo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create video';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateVideo = useCallback(async (
    strategyId: string,
    videoId: string, 
    data: StrategyVideoData
  ): Promise<StrategyVideo> => {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/strategies/${strategyId}/videos/${videoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_data: data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update video');
      }

      const updatedVideo = result.video;
      setVideos(prev =>
        prev.map(v => (v.id === videoId ? updatedVideo : v))
      );

      if (activeVideo?.id === videoId) {
        setActiveVideo(updatedVideo);
      }

      return updatedVideo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update video';
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [activeVideo]);

  const deleteVideo = useCallback(async (strategyId: string, videoId: string): Promise<void> => {
    setError(null);

    try {
      const response = await fetch(`/api/strategies/${strategyId}/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete video');
      }

      setVideos(prev => prev.filter(v => v.id !== videoId));

      if (activeVideo?.id === videoId) {
        setActiveVideo(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete video';
      setError(message);
      throw new Error(message);
    }
  }, [activeVideo]);

  const selectVideo = useCallback((video: StrategyVideo | null) => {
    setActiveVideo(video);
  }, []);

  // Debounced update for auto-save (1 second delay)
  const debouncedUpdate = useCallback((
    strategyId: string,
    videoId: string,
    data: StrategyVideoData
  ) => {
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer
    saveTimerRef.current = setTimeout(() => {
      updateVideo(strategyId, videoId, data).catch(err => {
        console.error('Auto-save failed:', err);
      });
    }, 1000);
  }, [updateVideo]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    videos,
    activeVideo,
    isLoading,
    isSaving,
    error,
    fetchVideos,
    createVideo,
    updateVideo,
    deleteVideo,
    selectVideo,
    debouncedUpdate,
  };
}

export default useVideoCreation;
