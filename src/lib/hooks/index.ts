/**
 * Hooks Library
 *
 * Barrel exports for custom React hooks.
 */

// UI Hooks
export { useDebounce } from './useDebounce';
export { useMediaQuery } from './useMediaQuery';
export { useDragDrop } from './useDragDrop';
export { useAnimation } from './useAnimation';
export { useOptimizedAnimation } from './useOptimizedAnimation';
export { useConfetti } from './useConfetti';
export { useFocusManagement } from './useFocusManagement';
export { useHapticFeedback } from './useHapticFeedback';

// Data Fetching Hooks
export { useDataFetch } from './useDataFetching';
export { useInfiniteScroll } from './useDataFetching';
export { useOptimizedDataFetching } from './useOptimizedDataFetching';

// Audio/Sound Hooks
export { useAudio } from './useAudio';
export { useSound } from './useSound';
export { useSoundCollection } from './useSoundCollection';
export { useTemplateSound } from './useTemplateSound';
export { useBeatSyncAnimation } from './useBeatSyncAnimation';

// Auth & Platform Hooks
export { useAuth } from './useAuth';
export { usePlatformDPS } from './usePlatformDPS';
export { useAuditLog } from './useAuditLog';

// AI & ML Hooks
export { useAISuggestions } from './useAISuggestions';
export { useMLSuggestions } from './useMLSuggestions';

// Template Hooks
export { useTemplateIntegration } from './useTemplateIntegration';
export { useTemplatesDiscovery } from './useTemplatesDiscovery';

// Workflow Persistence
export { useWorkflowPersistence } from './useWorkflowPersistence';
export type {
  UseWorkflowPersistenceOptions,
  UseWorkflowPersistenceReturn,
  SaveStatus
} from './useWorkflowPersistence';
