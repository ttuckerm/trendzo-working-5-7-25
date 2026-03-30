'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDebounce } from './useDebounce';
import type {
  WorkflowRun,
  WorkflowStep,
  WorkflowPhase,
  CreatorData,
  WorkflowPhaseNumber,
} from '@/lib/types/workflow';
import {
  PHASE_NUMBER_MAP,
  NUMBER_PHASE_MAP,
  getEmptyCreatorData,
} from '@/lib/types/workflow';

// Re-export for convenience
export { PHASE_NUMBER_MAP, NUMBER_PHASE_MAP, getEmptyCreatorData };

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseWorkflowPersistenceOptions {
  /** Workflow ID to load (undefined for new workflow) */
  workflowId?: string;
  /** Auto-save debounce delay in ms (default: 2000) */
  debounceMs?: number;
  /** Called when workflow is created */
  onWorkflowCreated?: (workflow: WorkflowRun) => void;
  /** Called on save error */
  onError?: (error: Error) => void;
}

export interface UseWorkflowPersistenceReturn {
  // State
  workflow: WorkflowRun | null;
  steps: WorkflowStep[];
  currentPhase: WorkflowPhase;
  creatorData: CreatorData;
  saveStatus: SaveStatus;
  isLoading: boolean;
  error: Error | null;

  // Actions
  setCreatorData: (data: CreatorData | ((prev: CreatorData) => CreatorData)) => void;
  setCurrentPhase: (phase: WorkflowPhase) => void;
  advancePhase: () => Promise<void>;
  goBackPhase: () => void;
  createWorkflow: () => Promise<WorkflowRun | null>;
  completeWorkflow: () => Promise<void>;
  abandonWorkflow: () => Promise<void>;

  // Manual save (for explicit save buttons)
  saveNow: () => Promise<void>;
}

export function useWorkflowPersistence(
  options: UseWorkflowPersistenceOptions = {}
): UseWorkflowPersistenceReturn {
  const {
    workflowId,
    debounceMs = 2000,
    onWorkflowCreated,
    onError,
  } = options;

  // State
  const [workflow, setWorkflow] = useState<WorkflowRun | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [currentPhase, setCurrentPhaseInternal] = useState<WorkflowPhase>('research');
  const [creatorData, setCreatorDataInternal] = useState<CreatorData>(getEmptyCreatorData());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debounced data for auto-save
  const debouncedCreatorData = useDebounce(creatorData, debounceMs);

  // Track if we have pending changes
  const hasPendingChanges = useRef(false);
  const lastSavedData = useRef<string>('');

  const supabase = createClient();

  // Helper: Extract phase-specific data from CreatorData
  const extractPhaseData = useCallback((data: CreatorData, phase: WorkflowPhase): Record<string, unknown> => {
    switch (phase) {
      case 'research':
        return {
          niche: data.niche,
          targetAudience: data.targetAudience,
          goals: data.goals,
          exemplarSwoop: data.exemplarSwoop,
          topicShortlist: data.topicShortlist,
        };
      case 'plan':
        return {
          seoStrategy: data.seoStrategy,
          goldenPillars: data.goldenPillars,
          contentGoals: data.contentGoals,
          beatSheet: data.beatSheet,
        };
      case 'create':
        return {
          videoDetails: data.videoDetails,
          recordingSetup: data.recordingSetup,
          proofAssets: data.proofAssets,
        };
      case 'optimize':
        return {
          optimizationScore: data.optimizationScore,
          gateAChecks: data.gateAChecks,
          aiRecommendations: data.aiRecommendations,
        };
      case 'publish':
        return {
          scheduledTime: data.scheduledTime,
          platforms: data.platforms,
          publishingChecklist: data.publishingChecklist,
        };
      case 'engage':
        return {
          performanceMetrics: data.performanceMetrics,
          abTestResults: data.abTestResults,
          contentInsights: data.contentInsights,
        };
      default:
        return {};
    }
  }, []);

  // Helper: Load CreatorData from steps
  const loadCreatorDataFromSteps = useCallback((stepsData: WorkflowStep[]): CreatorData => {
    const data = getEmptyCreatorData();

    for (const step of stepsData) {
      const inputData = step.input_data || {};

      switch (step.phase_number) {
        case 1: // Research
          Object.assign(data, {
            niche: inputData.niche ?? data.niche,
            targetAudience: inputData.targetAudience ?? data.targetAudience,
            goals: inputData.goals ?? data.goals,
            exemplarSwoop: inputData.exemplarSwoop ?? data.exemplarSwoop,
            topicShortlist: inputData.topicShortlist ?? data.topicShortlist,
          });
          break;
        case 2: // Plan
          Object.assign(data, {
            seoStrategy: inputData.seoStrategy ?? data.seoStrategy,
            goldenPillars: inputData.goldenPillars ?? data.goldenPillars,
            contentGoals: inputData.contentGoals ?? data.contentGoals,
            beatSheet: inputData.beatSheet ?? data.beatSheet,
          });
          break;
        case 3: // Create
          Object.assign(data, {
            videoDetails: inputData.videoDetails ?? data.videoDetails,
            recordingSetup: inputData.recordingSetup ?? data.recordingSetup,
            proofAssets: inputData.proofAssets ?? data.proofAssets,
          });
          break;
        case 4: // Optimize
          Object.assign(data, {
            optimizationScore: inputData.optimizationScore ?? data.optimizationScore,
            gateAChecks: inputData.gateAChecks ?? data.gateAChecks,
            aiRecommendations: inputData.aiRecommendations ?? data.aiRecommendations,
          });
          break;
        case 5: // Publish
          Object.assign(data, {
            scheduledTime: inputData.scheduledTime ?? data.scheduledTime,
            platforms: inputData.platforms ?? data.platforms,
            publishingChecklist: inputData.publishingChecklist ?? data.publishingChecklist,
          });
          break;
        case 6: // Engage
          Object.assign(data, {
            performanceMetrics: inputData.performanceMetrics ?? data.performanceMetrics,
            abTestResults: inputData.abTestResults ?? data.abTestResults,
            contentInsights: inputData.contentInsights ?? data.contentInsights,
          });
          break;
      }
    }

    return data;
  }, []);

  // Save current step data
  const saveStepData = useCallback(async () => {
    if (!workflow) return;

    setSaveStatus('saving');

    try {
      const phaseNumber = PHASE_NUMBER_MAP[currentPhase];
      const stepData = extractPhaseData(creatorData, currentPhase);

      const { error: updateError } = await supabase
        .from('workflow_run_steps')
        .update({
          input_data: stepData,
          last_edited_at: new Date().toISOString(),
          status: 'in_progress',
        })
        .eq('workflow_run_id', workflow.id)
        .eq('phase_number', phaseNumber);

      if (updateError) throw updateError;

      lastSavedData.current = JSON.stringify(creatorData);
      setSaveStatus('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);

    } catch (err) {
      const saveError = err instanceof Error ? err : new Error('Failed to save');
      setError(saveError);
      setSaveStatus('error');
      onError?.(saveError);
    }
  }, [workflow, currentPhase, creatorData, extractPhaseData, onError, supabase]);

  // Load existing workflow
  const loadWorkflow = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch workflow
      const { data: workflowData, error: workflowError } = await supabase
        .from('workflow_runs')
        .select('*')
        .eq('id', id)
        .single();

      if (workflowError) throw workflowError;

      // Fetch steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('workflow_run_steps')
        .select('*')
        .eq('workflow_run_id', id)
        .order('phase_number', { ascending: true });

      if (stepsError) throw stepsError;

      setWorkflow(workflowData);
      setSteps(stepsData || []);

      // Set current phase from workflow
      const phase = NUMBER_PHASE_MAP[workflowData.current_phase as WorkflowPhaseNumber];
      setCurrentPhaseInternal(phase);

      // Load creator data from steps
      const loadedData = loadCreatorDataFromSteps(stepsData || []);
      setCreatorDataInternal(loadedData);
      lastSavedData.current = JSON.stringify(loadedData);

    } catch (err) {
      const loadError = err instanceof Error ? err : new Error('Failed to load workflow');
      setError(loadError);
      onError?.(loadError);
    } finally {
      setIsLoading(false);
    }
  }, [loadCreatorDataFromSteps, onError, supabase]);

  // Load workflow on mount or when ID changes
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId, loadWorkflow]);

  // Auto-save when debounced data changes
  useEffect(() => {
    if (!workflow) return;

    const currentDataStr = JSON.stringify(debouncedCreatorData);
    if (currentDataStr === lastSavedData.current) return;

    saveStepData();
  }, [debouncedCreatorData, workflow, saveStepData]);

  // Create new workflow via API (bypasses client-side auth issues)
  const createWorkflow = useCallback(async (): Promise<WorkflowRun | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use API route which has auth bypass for dev
      const res = await fetch('/api/creator-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: {} }),
      });

      const { data, error: apiError } = await res.json();

      if (apiError || !data?.workflow) {
        throw new Error(apiError || 'Failed to create workflow');
      }

      const workflowData = data.workflow;
      const stepsData = data.steps || [];

      setWorkflow(workflowData);
      setSteps(stepsData);
      setCurrentPhaseInternal('research');
      setCreatorDataInternal(getEmptyCreatorData());
      lastSavedData.current = JSON.stringify(getEmptyCreatorData());

      onWorkflowCreated?.(workflowData);
      return workflowData;

    } catch (err) {
      const createError = err instanceof Error ? err : new Error('Failed to create workflow');
      setError(createError);
      onError?.(createError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onWorkflowCreated, onError]);

  // Manual save
  const saveNow = useCallback(async () => {
    await saveStepData();
  }, [saveStepData]);

  // Set creator data with change tracking
  const setCreatorData = useCallback((
    dataOrUpdater: CreatorData | ((prev: CreatorData) => CreatorData)
  ) => {
    setCreatorDataInternal(prev => {
      const newData = typeof dataOrUpdater === 'function'
        ? dataOrUpdater(prev)
        : dataOrUpdater;
      hasPendingChanges.current = true;
      setSaveStatus('saving'); // Show immediate feedback
      return newData;
    });
  }, []);

  // Set current phase
  const setCurrentPhase = useCallback((phase: WorkflowPhase) => {
    setCurrentPhaseInternal(phase);

    // Update workflow current_phase in DB
    if (workflow) {
      const phaseNumber = PHASE_NUMBER_MAP[phase];
      supabase
        .from('workflow_runs')
        .update({ current_phase: phaseNumber })
        .eq('id', workflow.id)
        .then();
    }
  }, [workflow, supabase]);

  // Advance to next phase
  const advancePhase = useCallback(async () => {
    const phaseOrder: WorkflowPhase[] = ['research', 'plan', 'create', 'optimize', 'publish', 'engage'];
    const currentIndex = phaseOrder.indexOf(currentPhase);

    if (currentIndex < phaseOrder.length - 1) {
      // Mark current phase as completed
      if (workflow) {
        const currentPhaseNumber = PHASE_NUMBER_MAP[currentPhase];
        await supabase
          .from('workflow_run_steps')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('workflow_run_id', workflow.id)
          .eq('phase_number', currentPhaseNumber);
      }

      const nextPhase = phaseOrder[currentIndex + 1];
      setCurrentPhase(nextPhase);
    }
  }, [currentPhase, workflow, setCurrentPhase, supabase]);

  // Go back to previous phase
  const goBackPhase = useCallback(() => {
    const phaseOrder: WorkflowPhase[] = ['research', 'plan', 'create', 'optimize', 'publish', 'engage'];
    const currentIndex = phaseOrder.indexOf(currentPhase);

    if (currentIndex > 0) {
      setCurrentPhase(phaseOrder[currentIndex - 1]);
    }
  }, [currentPhase, setCurrentPhase]);

  // Complete workflow
  const completeWorkflow = useCallback(async () => {
    if (!workflow) return;

    await supabase
      .from('workflow_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', workflow.id);

    setWorkflow(prev => prev ? { ...prev, status: 'completed', completed_at: new Date().toISOString() } : null);
  }, [workflow, supabase]);

  // Abandon workflow
  const abandonWorkflow = useCallback(async () => {
    if (!workflow) return;

    await supabase
      .from('workflow_runs')
      .update({ status: 'abandoned' })
      .eq('id', workflow.id);

    setWorkflow(prev => prev ? { ...prev, status: 'abandoned' } : null);
  }, [workflow, supabase]);

  return {
    workflow,
    steps,
    currentPhase,
    creatorData,
    saveStatus,
    isLoading,
    error,
    setCreatorData,
    setCurrentPhase,
    advancePhase,
    goBackPhase,
    createWorkflow,
    completeWorkflow,
    abandonWorkflow,
    saveNow,
  };
}
