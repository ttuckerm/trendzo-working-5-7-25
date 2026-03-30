/**
 * System Registry Integrity Tests (D12)
 *
 * Verifies the registry is the single source of truth and nothing drifts.
 * Run with: npm run test:integrity
 */

import {
  COMPONENT_REGISTRY,
  DISABLED_COMPONENTS,
  PATH_DEFINITIONS,
  NICHE_REGISTRY,
  VPS_TIERS,
  DPS_PERCENTILE_TIERS,
  LLM_COMPONENT_IDS,
  LLM_SPREAD_THRESHOLD,
  LLM_CONSENSUS_WEIGHT_CAP,
  CALIBRATION,
  CONTEXT_WEIGHTS,
  PACK_DEFINITIONS,
  PIPELINE_MODES,
  getActiveComponentCount,
  getVpsTier,
  getDpsTier,
  getNicheByKey,
  getTrainedNiches,
  getNicheDifficultyFactor,
} from '../system-registry';

describe('System Registry Integrity', () => {

  // =========================================================================
  // Component Registry
  // =========================================================================

  describe('Component Registry', () => {
    it('should have at least 20 active components', () => {
      expect(Object.keys(COMPONENT_REGISTRY).length).toBeGreaterThanOrEqual(20);
    });

    it('should have unique component IDs', () => {
      const ids = Object.keys(COMPONENT_REGISTRY);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have valid component types', () => {
      const validTypes = ['quantitative', 'qualitative', 'pattern', 'historical'];
      for (const comp of Object.values(COMPONENT_REGISTRY)) {
        expect(validTypes).toContain(comp.type);
      }
    });

    it('should have reliability between 0 and 1', () => {
      for (const comp of Object.values(COMPONENT_REGISTRY)) {
        expect(comp.defaultReliability).toBeGreaterThanOrEqual(0);
        expect(comp.defaultReliability).toBeLessThanOrEqual(1);
      }
    });

    it('should have positive avgLatency', () => {
      for (const comp of Object.values(COMPONENT_REGISTRY)) {
        expect(comp.defaultAvgLatency).toBeGreaterThan(0);
      }
    });

    it('getActiveComponentCount should return registry size minus always-disabled', () => {
      // niche-keywords is always disabled at runtime
      expect(getActiveComponentCount()).toBe(Object.keys(COMPONENT_REGISTRY).length - 1);
    });
  });

  // =========================================================================
  // Path Definitions
  // =========================================================================

  describe('Path Definitions', () => {
    it('should have exactly 4 paths', () => {
      expect(PATH_DEFINITIONS).toHaveLength(4);
    });

    it('should have base weights that sum to 1.0', () => {
      const totalWeight = PATH_DEFINITIONS.reduce((sum, p) => sum + p.baseWeight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should have unique path IDs', () => {
      const ids = PATH_DEFINITIONS.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('active path components should reference registered or documented-disabled components', () => {
      const allKnown = new Set([
        ...Object.keys(COMPONENT_REGISTRY),
        ...Object.keys(DISABLED_COMPONENTS),
      ]);
      for (const path of PATH_DEFINITIONS) {
        for (const compId of path.componentIds) {
          expect(allKnown.has(compId)).toBe(true);
        }
      }
    });
  });

  // =========================================================================
  // Niche Registry
  // =========================================================================

  describe('Niche Registry', () => {
    it('should have unique keys', () => {
      const keys = NICHE_REGISTRY.map(n => n.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('should use hyphenated keys only (no underscores)', () => {
      for (const niche of NICHE_REGISTRY) {
        expect(niche.key).not.toContain('_');
        expect(niche.key).toMatch(/^[a-z][a-z-]*[a-z]$/);
      }
    });

    it('should have difficultyFactor between 0.5 and 1.5', () => {
      for (const niche of NICHE_REGISTRY) {
        expect(niche.difficultyFactor).toBeGreaterThan(0.5);
        expect(niche.difficultyFactor).toBeLessThan(1.5);
      }
    });

    it('trained niches must have xgboostNicheKey', () => {
      for (const niche of NICHE_REGISTRY.filter(n => n.hasTrainedModel)) {
        expect(niche.xgboostNicheKey).toBeDefined();
        expect(niche.xgboostNicheKey!.length).toBeGreaterThan(0);
      }
    });

    it('getNicheByKey should normalize underscores to hyphens', () => {
      const result = getNicheByKey('side_hustles');
      expect(result).toBeDefined();
      expect(result!.key).toBe('side-hustles');
    });

    it('getTrainedNiches should return only niches with hasTrainedModel', () => {
      const trained = getTrainedNiches();
      expect(trained.length).toBeGreaterThan(0);
      for (const n of trained) {
        expect(n.hasTrainedModel).toBe(true);
      }
    });

    it('getNicheDifficultyFactor should return a value for all registry niches', () => {
      for (const niche of NICHE_REGISTRY) {
        const factor = getNicheDifficultyFactor(niche.key);
        expect(factor).toBe(niche.difficultyFactor);
      }
    });

    it('getNicheDifficultyFactor should return 0.95 for unknown niches', () => {
      expect(getNicheDifficultyFactor('unknown-niche-xyz')).toBe(0.95);
    });
  });

  // =========================================================================
  // Tier Systems
  // =========================================================================

  describe('VPS Tier System (System 1)', () => {
    it('should be sorted descending by minScore', () => {
      for (let i = 1; i < VPS_TIERS.length; i++) {
        expect(VPS_TIERS[i - 1].minScore).toBeGreaterThan(VPS_TIERS[i].minScore);
      }
    });

    it('lowest tier should have minScore 0', () => {
      expect(VPS_TIERS[VPS_TIERS.length - 1].minScore).toBe(0);
    });

    it('getVpsTier should return correct tiers for boundary scores', () => {
      expect(getVpsTier(95).label).toBe('Viral Potential');
      expect(getVpsTier(90).label).toBe('Viral Potential');
      expect(getVpsTier(89).label).toBe('Excellent - Top 10%');
      expect(getVpsTier(75).label).toBe('Excellent - Top 10%');
      expect(getVpsTier(74).label).toBe('Good - Top 25%');
      expect(getVpsTier(60).label).toBe('Good - Top 25%');
      expect(getVpsTier(59).label).toBe('Average');
      expect(getVpsTier(40).label).toBe('Average');
      expect(getVpsTier(39).label).toBe('Needs Work');
      expect(getVpsTier(0).label).toBe('Needs Work');
    });

    it('each tier should have a colorClass and gradient', () => {
      for (const tier of VPS_TIERS) {
        expect(tier.colorClass).toBeDefined();
        expect(tier.gradient).toBeDefined();
        expect(tier.gradient.start).toMatch(/^#[0-9a-f]{6}$/);
        expect(tier.gradient.end).toMatch(/^#[0-9a-f]{6}$/);
      }
    });
  });

  describe('DPS Percentile Tier System (System 3)', () => {
    it('should be sorted descending by minPercentile', () => {
      for (let i = 1; i < DPS_PERCENTILE_TIERS.length; i++) {
        expect(DPS_PERCENTILE_TIERS[i - 1].minPercentile).toBeGreaterThan(DPS_PERCENTILE_TIERS[i].minPercentile);
      }
    });

    it('getDpsTier should return correct categories', () => {
      expect(getDpsTier(99.95).category).toBe('mega-viral');
      expect(getDpsTier(99.5).category).toBe('hyper-viral');
      expect(getDpsTier(97).category).toBe('viral');
      expect(getDpsTier(92).category).toBe('trending');
      expect(getDpsTier(50).category).toBe('normal');
    });
  });

  // =========================================================================
  // LLM Consensus Gate
  // =========================================================================

  describe('LLM Consensus Gate', () => {
    it('all LLM component IDs should be in the component registry', () => {
      for (const id of LLM_COMPONENT_IDS) {
        expect(COMPONENT_REGISTRY[id]).toBeDefined();
      }
    });

    it('should have valid threshold and cap', () => {
      expect(LLM_SPREAD_THRESHOLD).toBeGreaterThan(0);
      expect(LLM_CONSENSUS_WEIGHT_CAP).toBeGreaterThan(0);
      expect(LLM_CONSENSUS_WEIGHT_CAP).toBeLessThanOrEqual(1);
    });
  });

  // =========================================================================
  // Context Weights
  // =========================================================================

  describe('Context Weights', () => {
    it('each workflow should have weights summing to ~1.0', () => {
      for (const [workflow, weights] of Object.entries(CONTEXT_WEIGHTS)) {
        const total = Object.values(weights).reduce((s, w) => s + w, 0);
        expect(total).toBeCloseTo(1.0, 2);
      }
    });

    it('should cover all expected workflow types', () => {
      const expected = ['content-planning', 'template-selection', 'quick-win', 'immediate-analysis', 'trending-library'];
      for (const wf of expected) {
        expect(CONTEXT_WEIGHTS[wf as keyof typeof CONTEXT_WEIGHTS]).toBeDefined();
      }
    });
  });

  // =========================================================================
  // Pack Definitions
  // =========================================================================

  describe('Pack Definitions', () => {
    it('each pack componentId should be in the registry', () => {
      for (const pack of PACK_DEFINITIONS) {
        expect(COMPONENT_REGISTRY[pack.componentId]).toBeDefined();
      }
    });

    it('should have exactly 4 packs', () => {
      expect(PACK_DEFINITIONS).toHaveLength(4);
    });

    it('should have unique pack IDs', () => {
      const ids = PACK_DEFINITIONS.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  // =========================================================================
  // Calibration Constants
  // =========================================================================

  describe('Calibration Constants', () => {
    it('should have valid confidence penalty', () => {
      expect(CALIBRATION.CONFIDENCE_PENALTY_NO_SPEECH).toBeGreaterThan(0);
      expect(CALIBRATION.CONFIDENCE_PENALTY_NO_SPEECH).toBeLessThan(1);
    });

    it('should have valid VPS caps', () => {
      expect(CALIBRATION.SILENT_VIDEO_VPS_CAP).toBeLessThan(CALIBRATION.SILENT_VIDEO_VPS_CAP_VISUAL_FIRST);
      expect(CALIBRATION.SILENT_VIDEO_VPS_CAP).toBeGreaterThan(0);
      expect(CALIBRATION.SILENT_VIDEO_VPS_CAP).toBeLessThanOrEqual(100);
    });

    it('should have valid high VPS scaling factors', () => {
      expect(CALIBRATION.HIGH_VPS_SCALING.above80).toBeLessThan(CALIBRATION.HIGH_VPS_SCALING.above70);
      expect(CALIBRATION.HIGH_VPS_SCALING.above70).toBeLessThan(CALIBRATION.HIGH_VPS_SCALING.above60);
      expect(CALIBRATION.HIGH_VPS_SCALING.above60).toBeLessThan(1);
    });

    it('should have visual-first styles and niches', () => {
      expect(CALIBRATION.VISUAL_FIRST_STYLES.length).toBeGreaterThan(0);
      expect(CALIBRATION.VISUAL_FIRST_NICHES_FALLBACK.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Pipeline Modes
  // =========================================================================

  describe('Pipeline Modes', () => {
    it('should include standard and validation', () => {
      expect(PIPELINE_MODES).toContain('standard');
      expect(PIPELINE_MODES).toContain('validation');
    });

    it('should NOT include fast or admin (retired per D8)', () => {
      expect(PIPELINE_MODES).not.toContain('fast');
      expect(PIPELINE_MODES).not.toContain('admin');
    });
  });

  // =========================================================================
  // Calibration Video Pool Coverage
  // =========================================================================

  describe('Calibration Video Pool Coverage', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getCalibrationVideos } = require('../../onboarding/calibration-video-pool');

    it('every niche should have exactly 8 videos in the pool', () => {
      for (const niche of NICHE_REGISTRY) {
        const videos = getCalibrationVideos(niche.key);
        expect(videos).toHaveLength(8);
      }
    });

    it('all returned videos must match the requested niche (no cross-niche)', () => {
      for (const niche of NICHE_REGISTRY) {
        const videos = getCalibrationVideos(niche.key);
        for (const v of videos) {
          expect(v.attribute_tags.niche_signal).toBe(niche.key);
        }
      }
    });

    it('each niche should have diverse hook_style coverage (4+ unique)', () => {
      for (const niche of NICHE_REGISTRY) {
        const videos = getCalibrationVideos(niche.key);
        const hookStyles = new Set(videos.map((v: { attribute_tags: { hook_style: string } }) => v.attribute_tags.hook_style));
        expect(hookStyles.size).toBeGreaterThanOrEqual(4);
      }
    });

    it('each niche should have diverse tone coverage (3+ unique)', () => {
      for (const niche of NICHE_REGISTRY) {
        const videos = getCalibrationVideos(niche.key);
        const tones = new Set(videos.map((v: { attribute_tags: { tone: string } }) => v.attribute_tags.tone));
        expect(tones.size).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
