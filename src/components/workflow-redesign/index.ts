// Workflow Redesign Components
// Paul's 3-Step Model: Strategy → Create → Ship

// Step 1: Strategy
export { StrategyPanel } from './StrategyPanel';
export { StrategyCreator } from './StrategyCreator';

// Step 2: Create (4x4 Beat Editor)
export { FourByFourBeatEditor } from './FourByFourBeatEditor';
export type { BeatContent } from './FourByFourBeatEditor';
export { DynamicCTASuggester, getCTASuggestions } from './DynamicCTASuggester';
export { SEOHealthIndicator } from './SEOHealthIndicator';
export { CaptionEditor } from './CaptionEditor';
export { GenerateCompleteScript } from './GenerateCompleteScript';
export { ViralReadinessMeter } from './ViralReadinessMeter';
export { CreatorScore } from './CreatorScore';
export { PersonalizationToast } from './PersonalizationToast';

// Step 3: Ship
export { ShipPanel } from './ShipPanel';
export { ResultsTracker } from './ResultsTracker';
export type { VideoResults } from './ResultsTracker';

// Re-export types for convenience
export type { ContentStrategy, ContentStrategyInsert, ContentPurpose } from '@/types/database';
