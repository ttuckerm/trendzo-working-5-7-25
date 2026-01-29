/**
 * React hook for accessing platform-wide DPS state
 * 
 * Usage:
 * const { dps, updateWorkflow, resetWorkflow } = usePlatformDPS();
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { platformState, WorkflowData, UserProfile } from '../state/platform-state';

export interface UsePlatformDPSReturn {
  dps: number;
  workflowData: WorkflowData;
  isLoading: boolean;
  updateWorkflow: (data: Partial<WorkflowData>) => void;
  resetWorkflow: () => void;
  getRecommendedWorkflow: () => string;
}

export function usePlatformDPS(): UsePlatformDPSReturn {
  const [dps, setDPS] = useState<number>(0);
  const [workflowData, setWorkflowData] = useState<WorkflowData>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Subscribe to DPS changes
    const dpsSub = platformState.currentDPS.subscribe((value) => {
      setDPS(value);
    });

    // Subscribe to workflow changes
    const workflowSub = platformState.workflowData.subscribe((value) => {
      setWorkflowData(value);
    });

    // Subscribe to loading state
    const loadingSub = platformState.isLoading.subscribe((value) => {
      setIsLoading(value);
    });

    // Cleanup subscriptions on unmount
    return () => {
      dpsSub.unsubscribe();
      workflowSub.unsubscribe();
      loadingSub.unsubscribe();
    };
  }, []);

  const updateWorkflow = useCallback((data: Partial<WorkflowData>) => {
    platformState.updateDPS(data);
  }, []);

  const resetWorkflow = useCallback(() => {
    platformState.resetWorkflow();
  }, []);

  const getRecommendedWorkflow = useCallback(() => {
    return platformState.getRecommendedWorkflow();
  }, []);

  return {
    dps,
    workflowData,
    isLoading,
    updateWorkflow,
    resetWorkflow,
    getRecommendedWorkflow,
  };
}

/**
 * Hook for accessing user profile state
 */
export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'expert'>('beginner');

  useEffect(() => {
    const sub = platformState.userProfile.subscribe((p) => {
      setProfileState(p);
      setExperienceLevel(platformState.getExperienceLevel());
    });
    return () => sub.unsubscribe();
  }, []);

  const setProfile = useCallback((p: UserProfile | null) => {
    platformState.setUserProfile(p);
  }, []);

  return {
    profile,
    setProfile,
    experienceLevel,
  };
}

/**
 * Hook for last prediction result
 */
export function useLastPrediction() {
  const [prediction, setPrediction] = useState(platformState.lastPrediction.getValue());

  useEffect(() => {
    const sub = platformState.lastPrediction.subscribe(setPrediction);
    return () => sub.unsubscribe();
  }, []);

  return prediction;
}

/**
 * Hook for live DPS meter that can be used in navigation
 */
export function useLiveDPS() {
  const [dps, setDPS] = useState(platformState.currentDPS.getValue());
  
  useEffect(() => {
    const sub = platformState.currentDPS.subscribe(setDPS);
    return () => sub.unsubscribe();
  }, []);
  
  return dps;
}
