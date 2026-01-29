'use client';

/**
 * LOCAL STORAGE WORKFLOW PERSISTENCE
 * Bypasses all database/auth issues. Works immediately.
 * TODO: Migrate to Supabase once auth is fixed.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  WorkflowRun,
  WorkflowStep,
  WorkflowPhase,
  CreatorData,
} from '@/lib/types/workflow';
import {
  PHASE_NUMBER_MAP,
  NUMBER_PHASE_MAP,
  getEmptyCreatorData,
} from '@/lib/types/workflow';

// Re-export for convenience
export { PHASE_NUMBER_MAP, NUMBER_PHASE_MAP, getEmptyCreatorData };

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const STORAGE_KEY = 'trendzo_workflows';

interface StoredWorkflows {
  workflows: WorkflowRun[];
  steps: Record<string, WorkflowStep[]>; // workflowId -> steps
  creatorData: Record<string, CreatorData>; // workflowId -> data
}

function getStoredData(): StoredWorkflows {
  if (typeof window === 'undefined') {
    return { workflows: [], steps: {}, creatorData: {} };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Corrupted data, reset
  }
  return { workflows: [], steps: {}, creatorData: {} };
}

function saveStoredData(data: StoredWorkflows): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

function createEmptySteps(workflowId: string): WorkflowStep[] {
  const phases: WorkflowPhase[] = ['research', 'plan', 'create', 'optimize', 'publish', 'engage'];
  return phases.map((phase, index) => ({
    id: generateId(),
    workflow_run_id: workflowId,
    phase_number: index + 1,
    phase_name: phase,
    status: index === 0 ? 'in_progress' : 'pending',
    input_data: {},
    output_data: null,
    started_at: index === 0 ? new Date().toISOString() : null,
    completed_at: null,
    last_edited_at: null,
  }));
}

export interface UseWorkflowPersistenceOptions {
  workflowId?: string;
  debounceMs?: number;
  onWorkflowCreated?: (workflow: WorkflowRun) => void;
  onError?: (error: Error) => void;
}

export interface UseWorkflowPersistenceReturn {
  workflow: WorkflowRun | null;
  steps: WorkflowStep[];
  currentPhase: WorkflowPhase;
  creatorData: CreatorData;
  saveStatus: SaveStatus;
  isLoading: boolean;
  error: Error | null;
  setCreatorData: (data: CreatorData | ((prev: CreatorData) => CreatorData)) => void;
  setCurrentPhase: (phase: WorkflowPhase) => void;
  advancePhase: () => Promise<void>;
  goBackPhase: () => void;
  createWorkflow: () => Promise<WorkflowRun | null>;
  completeWorkflow: () => Promise<void>;
  abandonWorkflow: () => Promise<void>;
  saveNow: () => Promise<void>;
}

export function useWorkflowPersistenceLocal(
  options: UseWorkflowPersistenceOptions = {}
): UseWorkflowPersistenceReturn {
  const {
    workflowId,
    onWorkflowCreated,
    onError,
  } = options;

  const [workflow, setWorkflow] = useState<WorkflowRun | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [currentPhase, setCurrentPhaseInternal] = useState<WorkflowPhase>('research');
  const [creatorData, setCreatorDataInternal] = useState<CreatorData>(getEmptyCreatorData());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load workflow from localStorage
  const loadWorkflow = useCallback((id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const stored = getStoredData();
      const wf = stored.workflows.find(w => w.id === id);
      
      if (!wf) {
        throw new Error('Workflow not found');
      }

      const wfSteps = stored.steps[id] || [];
      const wfData = stored.creatorData[id] || getEmptyCreatorData();

      setWorkflow(wf);
      setSteps(wfSteps);
      setCreatorDataInternal(wfData);
      
      // Set phase from workflow
      const phase = NUMBER_PHASE_MAP[wf.current_phase as 1|2|3|4|5|6] || 'research';
      setCurrentPhaseInternal(phase);

    } catch (err) {
      const loadError = err instanceof Error ? err : new Error('Failed to load workflow');
      setError(loadError);
      onError?.(loadError);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Load on mount if ID provided
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId, loadWorkflow]);

  // Save to localStorage (debounced)
  const saveToStorage = useCallback(() => {
    if (!workflow) return;

    setSaveStatus('saving');

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const stored = getStoredData();
        
        // Update workflow
        const wfIndex = stored.workflows.findIndex(w => w.id === workflow.id);
        if (wfIndex >= 0) {
          stored.workflows[wfIndex] = workflow;
        }

        // Update steps
        stored.steps[workflow.id] = steps;

        // Update creator data
        stored.creatorData[workflow.id] = creatorData;

        saveStoredData(stored);
        setSaveStatus('saved');

        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (err) {
        console.error('Save error:', err);
        setSaveStatus('error');
      }
    }, 500);
  }, [workflow, steps, creatorData]);

  // Auto-save when data changes
  useEffect(() => {
    if (workflow) {
      saveToStorage();
    }
  }, [creatorData, currentPhase, workflow, saveToStorage]);

  // Create new workflow
  const createWorkflow = useCallback(async (): Promise<WorkflowRun | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const id = generateId();
      const now = new Date().toISOString();

      const newWorkflow: WorkflowRun = {
        id,
        user_id: 'local-user',
        workflow_type: 'viral_content_creator',
        status: 'active',
        current_phase: 1,
        started_at: now,
        completed_at: null,
        metadata: {},
      };

      const newSteps = createEmptySteps(id);
      const newData = getEmptyCreatorData();

      // Save to localStorage
      const stored = getStoredData();
      stored.workflows.unshift(newWorkflow);
      stored.steps[id] = newSteps;
      stored.creatorData[id] = newData;
      saveStoredData(stored);

      // Update state
      setWorkflow(newWorkflow);
      setSteps(newSteps);
      setCreatorDataInternal(newData);
      setCurrentPhaseInternal('research');

      onWorkflowCreated?.(newWorkflow);
      return newWorkflow;

    } catch (err) {
      const createError = err instanceof Error ? err : new Error('Failed to create workflow');
      setError(createError);
      onError?.(createError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onWorkflowCreated, onError]);

  // Set creator data
  const setCreatorData = useCallback((
    dataOrUpdater: CreatorData | ((prev: CreatorData) => CreatorData)
  ) => {
    setCreatorDataInternal(prev => {
      const newData = typeof dataOrUpdater === 'function'
        ? dataOrUpdater(prev)
        : dataOrUpdater;
      return newData;
    });
  }, []);

  // Set current phase
  const setCurrentPhase = useCallback((phase: WorkflowPhase) => {
    setCurrentPhaseInternal(phase);
    
    if (workflow) {
      const phaseNumber = PHASE_NUMBER_MAP[phase];
      setWorkflow(prev => prev ? { ...prev, current_phase: phaseNumber } : null);
    }
  }, [workflow]);

  // Advance phase
  const advancePhase = useCallback(async () => {
    const phaseOrder: WorkflowPhase[] = ['research', 'plan', 'create', 'optimize', 'publish', 'engage'];
    const currentIndex = phaseOrder.indexOf(currentPhase);

    if (currentIndex < phaseOrder.length - 1) {
      // Mark current step as completed
      setSteps(prev => prev.map(step => {
        if (step.phase_number === currentIndex + 1) {
          return { ...step, status: 'completed', completed_at: new Date().toISOString() };
        }
        if (step.phase_number === currentIndex + 2) {
          return { ...step, status: 'in_progress', started_at: new Date().toISOString() };
        }
        return step;
      }));

      const nextPhase = phaseOrder[currentIndex + 1];
      setCurrentPhase(nextPhase);
    }
  }, [currentPhase, setCurrentPhase]);

  // Go back
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

    const now = new Date().toISOString();
    setWorkflow(prev => prev ? { ...prev, status: 'completed', completed_at: now } : null);
  }, [workflow]);

  // Abandon workflow
  const abandonWorkflow = useCallback(async () => {
    if (!workflow) return;
    setWorkflow(prev => prev ? { ...prev, status: 'abandoned' } : null);
  }, [workflow]);

  // Manual save
  const saveNow = useCallback(async () => {
    saveToStorage();
  }, [saveToStorage]);

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
