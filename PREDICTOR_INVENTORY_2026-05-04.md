# Predictor Surface Inventory — 2026-05-04

**Branch:** `vercel-deploy-test`
**Repo:** `C:\Projects\CleanCopy`
**Mode:** Read-only. No file changes were made during this inventory.

Notes on methodology:
- Line counts are from `Get-Content | Measure-Object -Line` (newline-delimited line count).
- "Last-modified" is `git log -1 --format=%ci -- <path>` (most recent commit touching the file).
- "Imports" = number of files under `src/`, `scripts/`, `tests/`, `supabase/`, `config/` (any of `.ts/.tsx/.js/.mjs/.sql`) that contain the file's module path as a literal substring. Self-references excluded. May overcount if a path substring appears in a comment or string; treat as an upper bound.
- "Top-level exports" = top-level `export` declarations (functions, classes, const/let/var, interfaces, types, enums, default exports, re-export blocks). Names only, no signatures.

---

## Section 1 — Canonical predictor (`src/lib/prediction/`)

| File | Lines | Last modified | Imports |
|------|------:|---------------|--------:|
| src/lib/prediction/runPredictionPipeline.ts | 871 | 2026-04-29 | 13 |
| src/lib/prediction/system-registry.ts | 795 | 2026-03-30 | 18 |
| src/lib/prediction/extract-prediction-features.ts | 661 | 2026-04-17 | 3 |
| src/lib/prediction/prediction-calibrator.ts | 527 | 2026-04-29 | 2 |
| src/lib/prediction/concept-scorer.ts | 890 | 2026-03-30 | 1 |
| src/lib/prediction/ffmpeg-segment-features.ts | 341 | 2026-03-30 | 3 |
| src/lib/prediction/xgboost-inference.ts | 332 | 2026-04-17 | 4 |
| src/lib/prediction/content-strategy-features.ts | 308 | 2026-03-30 | 3 |
| src/lib/prediction/normalize-component-result.ts | 220 | 2026-03-30 | 2 |
| src/lib/prediction/creator-context.ts | 180 | 2026-04-17 | 17 |
| src/lib/prediction/vision-hook-features.ts | 169 | 2026-03-30 | 3 |
| src/lib/prediction/model-router.ts | 100 | 2026-04-10 | 5 |
| src/lib/prediction/contamination-lock.ts | 98 | 2026-03-30 | 2 |
| src/lib/prediction/run-vps-pipeline-v2.ts | 84 | 2026-04-17 | 3 |
| src/lib/prediction/prediction-config.ts | 68 | 2026-03-30 | 1 |
| src/lib/prediction/record.ts | 45 | 2026-03-30 | 3 |
| src/lib/prediction/__tests__/pack-gating.test.ts | 412 | 2026-03-30 | 0 |
| src/lib/prediction/__tests__/system-integrity.test.ts | 304 | 2026-03-30 | 0 |
| src/lib/prediction/__tests__/calibrator.test.ts | 284 | 2026-03-30 | 0 |

### Top-level exports

- **runPredictionPipeline.ts**: `PredictionPipelineOptions`, `QualitativeAnalysis`, `TranscriptionStatus`, `PipelineResult`, `runPredictionPipeline`
- **system-registry.ts**: `ComponentType`, `ComponentDefinition`, `PackDefinition`, `NicheDefinition`, `PathDefinition`, `VpsTier`, `DpsTier`, `WorkflowType`, `PIPELINE_MODES`, `PipelineMode`, `COMPONENT_REGISTRY`, `DISABLED_COMPONENTS`, `PACK_DEFINITIONS`, `NICHE_REGISTRY`, `HOOK_CLUSTERS`, `HOOK_TYPES`, `HookType`, `HOOK_MIGRATION_MAP`, `migrateHookType`, `CALIBRATION_ONLY_NICHES`, `NICHE_HASHTAGS`, `VideoStyleDefinition`, `VIDEO_STYLES_REGISTRY`, `PATH_DEFINITIONS`, `CONTEXT_WEIGHTS`, `VPS_TIERS`, `DPS_PERCENTILE_TIERS`, `LLM_COMPONENT_IDS`, `LLM_SPREAD_THRESHOLD`, `LLM_CONSENSUS_WEIGHT_CAP`, `AGREEMENT_THRESHOLDS`, `CALIBRATION`, `getActiveComponentCount`, `getVpsTier`, `getDpsTier`, `getNicheByKey`, `getTrainedNiches`, `getNicheDifficultyFactor`
- **extract-prediction-features.ts**: `PredictionFeatureInput`, `PredictionFeatureResult`, `extractPredictionFeatures`
- **prediction-calibrator.ts**: `CalibrationInput`, `CalibrationResult`, `CalibrationAdjustment`, `PackVTrainingFeatures`, `calibratePrediction`, `logPackVTrainingFeatures`
- **concept-scorer.ts**: `ConceptScoreInput`, `GeminiConceptAnalysis`, `CreatorFitScore`, `ConceptAdjustment`, `ConceptDiagnosis`, `PatternMatchResult`, `PatternSaturationResult`, `GateClassification`, `QualityGateScore`, `DistributionPotentialScore`, `ConceptScoreResult`, `scoreConcept`
- **ffmpeg-segment-features.ts**: `SegmentFeatures`, `SegmentFeaturesResult`, `extractSegmentFeatures`
- **xgboost-inference.ts**: `XGBoostPredictionResult`, `predictXGBoost`, `predictXGBoostV10`
- **content-strategy-features.ts**: `ContentStrategyFeatures`, `extractContentStrategyFeatures`
- **normalize-component-result.ts**: `ComponentStatus`, `NormalizedComponentResult`, `QCFlag`, `COACH_LANE_COMPONENT_IDS`, `Lane`, `classifyLane`, `normalizeComponentResult`, `QCGateResult`, `qcGate`, `computeRunQCFlags`
- **creator-context.ts**: `CreatorStage`, `CreatorStoryData`, `CreatorCalibrationProfile`, `AudienceEnrichment`, `CreatorChannelData`, `CreatorContext`, `resolveCreatorContext`
- **vision-hook-features.ts**: `VisionHookFeatures`, `extractVisionHookFeatures`
- **model-router.ts**: `ModelRoute`, `resolveModelRoute`, `invalidateRouteCache`
- **contamination-lock.ts**: `IngestMode`, `ContaminationProof`, `CONTAMINATION_LOCK_VERSION`, `deriveIngestMode`, `sanitizeVideoInput`, `generateContaminationProof`
- **run-vps-pipeline-v2.ts**: `VpsPipelineV2Input`, `VpsPipelineV2Result`, `runVpsPipelineV2`
- **prediction-config.ts**: `getPredictionConfig`, `checkComponentInputs`, `createSkippedResult`, `hasValidTranscript`
- **record.ts**: `recordPrediction`

**Total files in Section 1:** 19 (16 source + 3 test)

---

## Section 2 — Legacy engines (`src/lib/services/viral-prediction/`)

| File | Lines | Last modified | Imports |
|------|------:|---------------|--------:|
| src/lib/services/viral-prediction/unified-prediction-engine.ts | 1020 | 2026-03-30 | 11 |
| src/lib/services/viral-prediction/script-intelligence-engine.ts | 953 | 2026-03-30 | 1 |
| src/lib/services/viral-prediction/comprehensive-framework-library.ts | 824 | 2026-03-30 | 0 |
| src/lib/services/viral-prediction/main-prediction-engine.ts | 758 | 2026-03-30 | 8 |
| src/lib/services/viral-prediction/framework-parser.ts | 663 | 2026-03-30 | 2 |
| src/lib/services/viral-prediction/framework-evolution-system.ts | 656 | 2026-03-30 | 3 |
| src/lib/services/viral-prediction/apify-scraper-manager.ts | 551 | 2026-03-30 | 3 |
| src/lib/services/viral-prediction/ai-prediction-engine.ts | 454 | 2026-03-30 | 1 |
| src/lib/services/viral-prediction/accuracy-tracker.ts | 440 | 2026-03-30 | 2 |
| src/lib/services/viral-prediction/niche-framework-definitions.ts | 439 | 2026-03-30 | 1 |
| src/lib/services/viral-prediction/ai-brain-intelligence.ts | 433 | 2026-03-30 | 1 |
| src/lib/services/viral-prediction/scraping-scheduler.ts | 430 | 2026-03-30 | 1 |
| src/lib/services/viral-prediction/cultural-timing-intelligence.ts | 408 | 2026-04-10 | 0 |
| src/lib/services/viral-prediction/apify-integration.ts | 375 | 2026-03-30 | 3 |
| src/lib/services/viral-prediction/studio-integration.ts | 353 | 2026-03-30 | 0 |
| src/lib/services/viral-prediction/production-quality-analyzer.ts | 290 | 2026-03-30 | 0 |
| src/lib/services/viral-prediction/god-mode-psychological-analyzer.ts | 294 | 2026-03-30 | 0 |
| src/lib/services/viral-prediction/test-unified-engine.ts | 287 | 2026-03-30 | 0 |
| src/lib/services/viral-prediction/hook-detector.ts | 267 | 2026-03-30 | 0 |
| src/lib/services/viral-prediction/inception-mode.ts | 263 | 2026-03-30 | 1 |
| src/lib/services/viral-prediction/apify-scraper.ts | 196 | 2026-03-30 | 3 |
| src/lib/services/viral-prediction/engagement-velocity-tracker.ts | 180 | 2026-03-30 | 0 |
| src/lib/services/viral-prediction/dps-baselines.ts | 34 | 2026-03-30 | 3 |
| src/lib/services/viral-prediction/incubation-classifier.ts | 21 | 2026-03-30 | 0 |
| src/lib/services/viral-prediction/__tests__/apify-scraper.test.ts | 223 | 2026-03-30 | 1 |

### Top-level exports

- **unified-prediction-engine.ts**: `PredictionInput`, `PredictionOutput`, `UnifiedPredictionEngine`, `getPredictionEngine`, `predictViral`
- **script-intelligence-engine.ts**: `ScriptAnalysis`, `SevenIdeaLegos`, `LegoScore`, `DPSOptimization`, `RemixOpportunity`, `DetectedFramework`, `ScriptSegment`, `EmotionalArc`, `EmotionalMoment`, `HookAnalysis`, `NarrativeStructure`, `PersuasionTechnique`, `LinguisticPattern`, `ScriptIntelligenceEngine`
- **comprehensive-framework-library.ts**: `FrameworkPattern`, `TemplateClassification`, `DailyRecipeBook`, `ComprehensiveFrameworkLibrary`, default `ComprehensiveFrameworkLibrary`
- **main-prediction-engine.ts**: `MainPredictionEngine`, default `MainPredictionEngine`
- **framework-parser.ts**: `FrameworkWeights`, `PlatformWeights`, `FrameworkParser`, default `FrameworkParser`
- **framework-evolution-system.ts**: `EmergingPattern`, `PatternExample`, `PerformanceMetrics`, `FrameworkEvolutionConfig`, `FrameworkEvolutionSystem`
- **apify-scraper-manager.ts**: `ApifyScraperConfig`, `ScraperActors`, `ScrapingJob`, `ApifyScraperManager`
- **ai-prediction-engine.ts**: `AIPredictionEngine`
- **accuracy-tracker.ts**: `AccuracyTracker`
- **niche-framework-definitions.ts**: `NicheDefinition`, `VIRAL_NICHES`, `getAllScrapingKeywords`, `getNicheKeywords`, `getAllNicheIds`, `getNicheById`, `getFrameworksForNiche`
- **ai-brain-intelligence.ts**: `AiBrainIntelligenceSystem`
- **scraping-scheduler.ts**: `ScheduleConfig`, `ScheduleJob`, `ScrapingScheduler`
- **cultural-timing-intelligence.ts**: `CulturalTimingIntelligence`
- **apify-integration.ts**: `ApifyTikTokIntegration`
- **studio-integration.ts**: `ViralStudioIntegration`
- **production-quality-analyzer.ts**: `ProductionQualityAnalyzer`
- **god-mode-psychological-analyzer.ts**: `GodModePsychologicalAnalyzer`
- **test-unified-engine.ts**: `{ runTest, runBenchmark, demonstrateEdgeCases }`
- **hook-detector.ts**: `HookDetector`
- **inception-mode.ts**: `InceptionModeSystem`
- **apify-scraper.ts**: `scrapeTikTokBatch`, `cleanupFailedDownloads`
- **engagement-velocity-tracker.ts**: `EngagementVelocityTracker`
- **dps-baselines.ts**: `recomputeCohortStats`
- **incubation-classifier.ts**: `IncubationLabel`, `IncubationFeatures`, `classifyIncubation`

**Total files in Section 2:** 25 (24 source + 1 test)

---

## Section 3 — Adjacent predictor surfaces

Existence check:
- `src/lib/orchestration/` — exists
- `src/lib/autoresearch/` — **does not exist** (autoresearch lives nested at `src/lib/training/autoresearch/`; there is also a top-level `results-autoresearch/` directory at the repo root)
- `src/lib/scoring/` — **does not exist**
- `src/lib/features/` — exists
- `src/lib/training/` — exists
- `src/lib/calibration/` — exists
- `src/lib/drift/` — exists

### 3a. `src/lib/orchestration/`

| File | Lines | Last modified | Imports |
|------|------:|---------------|--------:|
| src/lib/orchestration/kai-orchestrator.ts | 4984 | 2026-04-29 | 13 |
| src/lib/orchestration/validation-gates.ts | 325 | 2026-03-30 | 0 |
| src/lib/orchestration/parallel-execution.ts | 162 | 2026-03-30 | 0 |

Exports:
- **kai-orchestrator.ts**: `ComponentRegistry`, `VideoInput`, `ComponentResult`, `PredictionPath`, `PathResult`, `PredictionResult`, `AgreementAnalysis`, `WorkflowType`, `ComponentWeightMap`, `KaiOrchestrator`, `kai`, default `KaiOrchestrator`
- **validation-gates.ts**: `ProcessingStatus`, `ValidationResult`, `ValidationGateResult`, `ProcessingContext`, `validatePreProcessing`, `validateAllComponents`, `validatePostProcessing`, `validateStorage`, `updateProcessingStatus`, `getProcessingContext`, `clearProcessingContext`, `runValidationGates`
- **parallel-execution.ts**: `ComponentResult`, `ParallelExecutionInput`, `ParallelExecutionOptions`, `executeParallel`, `executeBatchParallel`, `executeWithRetry`

### 3b. `src/lib/features/`

| File | Lines | Last modified | Imports |
|------|------:|---------------|--------:|
| src/lib/features/distribution-signals.ts | 163 | 2026-04-17 | 4 |
| src/lib/features/audience-quality.ts | 142 | 2026-04-17 | 3 |
| src/lib/features/creator-trajectory.ts | 138 | 2026-04-17 | 3 |
| src/lib/features/cultural-momentum.ts | 130 | 2026-04-17 | 3 |
| src/lib/features/feature-matrix-builder.ts | 106 | 2026-04-17 | 2 |
| src/lib/features/distribution-signals-check.ts | 91 | 2026-04-17 | 1 |
| src/lib/features/quality_gate.ts | 49 | 2026-03-30 | 1 |
| src/lib/features/format_features.ts | 48 | 2026-03-30 | 1 |
| src/lib/features/store.ts | 38 | 2026-03-30 | 1 |
| src/lib/features/schema.ts | 22 | 2026-03-30 | 4 |

Exports:
- **distribution-signals.ts**: `DistributionFeatures`, `DISTRIBUTION_FEATURE_NAMES`, `extractDistributionFeatures`
- **audience-quality.ts**: `AudienceQualityFeatures`, `AUDIENCE_FEATURE_NAMES`, `extractAudienceFeatures`
- **creator-trajectory.ts**: `CreatorTrajectoryFeatures`, `CREATOR_FEATURE_NAMES`, `extractCreatorFeatures`
- **cultural-momentum.ts**: `CulturalMomentumFeatures`, `CULTURAL_FEATURE_NAMES`, `extractCulturalFeatures`
- **feature-matrix-builder.ts**: `V10_FEATURES`, `ALL_FEATURES`, `FEATURE_COUNT`, `buildFeatureRow`
- **distribution-signals-check.ts**: `DistributionCoverage`, `checkDistributionCoverage`
- **quality_gate.ts**: `QualityReport`, `runQualityChecks`
- **format_features.ts**: `CarouselFeatures`, `Long3mFeatures`, `FormatFeatures`, `extractCarouselFeatures`, `extractLong3mFeatures`
- **store.ts**: `writeFeatures`, `readFeatures`
- **schema.ts**: `FeatureSchema`, `FEATURE_SCHEMA_V1`, `computeSchemaHash`

### 3c. `src/lib/training/` (TS files only — see Section 5 for model artifacts)

| File | Lines | Last modified | Imports |
|------|------:|---------------|--------:|
| src/lib/training/trainer-engine.ts | 1414 | 2026-04-17 | 7 |
| src/lib/training/feature-extractor.ts | 1314 | 2026-04-17 | 5 |
| src/lib/training/dps-v2.ts | 906 | 2026-03-30 | 19 |
| src/lib/training/fresh-video-scanner.ts | 509 | 2026-04-17 | 3 |
| src/lib/training/dataset-prep.ts | 511 | 2026-04-17 | 1 |
| src/lib/training/export-scraped-training-data.ts | 506 | 2026-04-17 | 2 |
| src/lib/training/feature-availability-matrix.ts | 491 | 2026-03-30 | 8 |
| src/lib/training/backfill_fixed_features.ts | 478 | 2026-04-29 | 0 |
| src/lib/training/data-quality-gate.ts | 446 | 2026-04-29 | 1 |
| src/lib/training/spearman-evaluator.ts | 383 | 2026-04-17 | 2 |
| src/lib/training/scraped-video-quality-gate.ts | 371 | 2026-04-17 | 1 |
| src/lib/training/niche-creator-scraper.ts | 312 | 2026-03-30 | 3 |
| src/lib/training/auto-labeler.ts | 317 | 2026-03-30 | 2 |
| src/lib/training/post-promotion-validator.ts | 305 | 2026-04-17 | 2 |
| src/lib/training/designate-scraped-holdout.ts | 264 | 2026-04-17 | 1 |
| src/lib/training/training-executor.ts | 259 | 2026-03-30 | 1 |
| src/lib/training/model-evaluator.ts | 257 | 2026-03-30 | 0 |
| src/lib/training/metric-attacher.ts | 239 | 2026-03-30 | 1 |
| src/lib/training/metric-collector.ts | 234 | 2026-03-30 | 3 |
| src/lib/training/designate-holdout.ts | 234 | 2026-04-17 | 1 |
| src/lib/training/training-features-export-columns.ts | 202 | 2026-04-17 | 1 |
| src/lib/training/scrape-label.ts | 196 | 2026-03-30 | 3 |
| src/lib/training/cross-niche-miner.ts | 187 | 2026-04-17 | 3 |
| src/lib/training/training-eligibility.ts | 187 | 2026-03-30 | 5 |
| src/lib/training/training-ingest-types.ts | 172 | 2026-03-30 | 8 |
| src/lib/training/dps-insights.ts | 180 | 2026-03-30 | 2 |
| src/lib/training/run_export_training_data.ts | 129 | 2026-04-29 | 0 |
| src/lib/training/promote_v15.ts | 126 | 2026-04-17 | 0 |
| src/lib/training/metric-scheduler.ts | 124 | 2026-03-30 | 5 |
| src/lib/training/tiktok-metric-fetcher.ts | 122 | 2026-03-30 | 0 |
| src/lib/training/test_dead_features.ts | 119 | 2026-04-17 | 0 |
| src/lib/training/contamination-validator.ts | 116 | 2026-03-30 | 1 |
| src/lib/training/run-s6-retrain.ts | 116 | 2026-04-17 | 1 |
| src/lib/training/smoke_test_v15.ts | 110 | 2026-04-17 | 0 |
| src/lib/training/schedule-backfill.ts | 106 | 2026-03-30 | 2 |
| src/lib/training/smoke_vector_diff.ts | 97 | 2026-04-17 | 0 |
| src/lib/training/follower-resolver.ts | 59 | 2026-03-30 | 0 |
| src/lib/training/verify_promotion.ts | 36 | 2026-04-17 | 0 |
| src/lib/training/test_audio_classifier.ts | 29 | 2026-04-17 | 0 |
| src/lib/training/check_scraped_cols.ts | 9 | 2026-04-17 | 0 |
| src/lib/training/__tests__/dps-v2.test.ts | 853 | 2026-03-30 | 0 |
| src/lib/training/autoresearch/bridge_results_to_db.ts | 277 | 2026-04-17 | 0 |
| src/lib/training/autoresearch/check_experiments.ts | 17 | 2026-04-17 | 0 |
| src/lib/training/autoresearch/clear_stuck_lock.ts | 30 | 2026-04-17 | 0 |
| src/lib/training/autoresearch/list_all_sandbox.ts | 17 | 2026-04-17 | 0 |

Python and shell scripts under `training/` (not in import-count search above; recorded for completeness):

| File | Lines | Last modified |
|------|------:|---------------|
| src/lib/training/retrain_s7.py | 375 | 2026-04-17 |
| src/lib/training/retrain_s6.py | 306 | 2026-04-17 |
| src/lib/training/validate_s7.py | 296 | 2026-04-17 |
| src/lib/training/investigate_sound_type.py | 287 | 2026-04-17 |
| src/lib/training/generate_v15_artifacts.py | 103 | 2026-04-17 |
| src/lib/training/smoke_vector_diff.py | 91 | 2026-04-17 |
| src/lib/training/smoke_python_preds.py | 76 | 2026-04-17 |
| src/lib/training/smoke_trace_trees.py | 50 | 2026-04-17 |
| src/lib/training/smoke_crosscheck.py | 34 | 2026-04-17 |
| src/lib/training/autoresearch/autoresearch_run.py | 520 | 2026-04-17 |
| src/lib/training/autoresearch/bootstrap_validation.py | 224 | 2026-04-29 |
| src/lib/training/autoresearch/leaderboard_full.py | 127 | 2026-04-29 |
| src/lib/training/autoresearch/leaderboard.py | 59 | 2026-04-17 |
| src/lib/training/autoresearch/_derived_smoke.py | 35 | 2026-04-17 |
| src/lib/training/autoresearch/run_all_cat2to5.sh | 131 | 2026-04-17 |
| src/lib/training/autoresearch/run_category1_tail.sh | 50 | 2026-04-17 |
| src/lib/training/autoresearch/README.md | 68 | 2026-04-17 |

Data assets shipped under `training/data/` and `training/results*/`:
- src/lib/training/data/training_data.csv (5646 rows)
- src/lib/training/data/holdout_data.csv (201 rows)
- src/lib/training/data/feature_metadata.json
- src/lib/training/results/{content_only, metadata_only, full_signal, full_signal_no_timing, full_signal_quality_rows}.model.json
- src/lib/training/results/scaling_params.json, results_summary.json
- src/lib/training/results-s7/{v15-honest-with-res, v15-honest-no-res}.model.json
- src/lib/training/results-s7/{scaling_params_s7, feature_audit_s7, results_summary_s7, smoke_python_preds, smoke_py_scaled_row0, smoke_ts_scaled_row0}.json
- src/lib/training/results-s7/dps_distributions_validation.png

Selected exports (top by importance / size):
- **trainer-engine.ts**: `TrainerProgram`, `ProgramRules`, `FeedbackRow`, `ExperimentMode`, `ExperimentResult`, `LaunchExperimentOptions`, `TrainerRunResult`, `parseProgramRules`, `runTrainerEngine`, `launchExperiment`, `PromotionResult`, `promoteModelVariant`, `rollbackModelVariant`, `promoteSandboxExperiment`, `parseHyperparameterOverrides`, `loadActiveFeatureList`, `FeatureDiscoveryExperimentInput`, `FeatureDiscoveryExperimentResult`, `runFeatureDiscoveryExperiment`, `loadFeedbackForDiscovery`
- **feature-extractor.ts**: `ScrapedVideo`, `TrainingFeatureRow`, `ExtractionProgress`, `ExtractionResult`, `runFeatureExtraction`, `ExtractFeaturesOptions`, `extractFeaturesForVideo`, `getExtractionSummary`
- **dps-v2.ts**: `DPS_V2_FORMULA_VERSION`, `selectWeightTier`, `DpsV2RawMetrics`, `DpsV2SignalInputs`, `DpsV2CohortContext`, `DpsV2CohortStats`, `DpsV2PopulationStats`, `DpsV2Tier`, `DpsV2ThresholdSet`, `DpsV2Breakdown`, `DpsV2ConfidenceLevel`, `DpsV2Confidence`, `DpsV2LabelWriteInput`, `DpsV2LabelWriteResult`, `calculateReachScore`, `computePercentileRank`, `deriveDpsV2Signals`, `computeEffectiveWeights`, `computeCompositeEngagement`, `computeCohortStatsFromValues`, `computeMedian`, `computeMAD`, `computeShrinkageWeight`, `applyShrinkage`, `computeViralScore`, `applyTimeDecay`, `DEFAULT_THRESHOLDS`, `classifyDpsV2`, `classifyLegacyDpsTier`, `zScoreToDisplayDps`, `computeFollowerTierBounds`, `ComputeDpsV2Input`, `ComputeDpsV2Result`, `computeDpsV2`, `buildDpsV2LabelPayload`, `labelPredictionRunWithDpsV2`, `ScrapedVideoRow`, `BOOTSTRAP_POPULATION_STATS`, `buildCohortStatsFromRows`, `computeDpsV2FromRows`
- **feature-availability-matrix.ts**: `ContaminationReason`, `FeatureClassification`, `FeatureAvailability`, `TRAINING_V2_ENABLED`, `TRAINING_INGEST_ENABLED`, `METRIC_COLLECTOR_ENABLED`, `PRE_FEATURE_PREFIXES`, `POST_FEATURE_PREFIXES`, `CONTAMINATED_FEATURES`, `FEATURE_MATRIX`, `classifyFeature`, `isFeatureAllowedForPOP`, `getContaminatedFromKeys`
- **training-ingest-types.ts**: `TrainingIngestRequest`, `TrainingIngestResponse`, `MetricCheckType`, `MetricScheduleStatus`, `MetricScheduleRow`, `AttachPlatformIdRequest`, `AttachPlatformIdResponse`, `TrainingRunSummary`, `MetricCollectorRequest`, `MetricCollectorResult`, `MetricCollectorItemResult`, `TikTokMetricsPayload`, `MetricAttachResult`, `MetricAttachItemResult`, `MetricScheduleSummary`
- **training-eligibility.ts**: `LabelCategory`, `LabelCategoryBreakdown`, `EligibilityRow`, `classifyLabelCategory`, `isTrainingLabelEligible`, `isTrustedV2Label`, `isLegacyLabel`, `computeLabelBreakdown`, `V2_ELIGIBLE_SQL`, `V2_TRUSTED_SQL`, `applyV2EligibleFilter`, `DPS_V2_EXPORT_COLUMNS`, `DPS_V2_EXPORT_SELECT`
- **dataset-prep.ts**: `FilterParams`, `DEFAULT_FILTER_PARAMS`, `FilteredSet`, `RowFloorAction`, `RowFloorResult`, `DPSDistributionResult`, `ScalingParamEntry`, `ScalingParams`, `filterTrainingRows`, `MINIMUM_ROWS`, `checkRowFloor`, `checkDPSDistribution`, `computeScalingParams`, `applyScaling`, `PrepRunRecord`, `recordPrepRun`
- **data-quality-gate.ts**: `EXCLUDED_FEATURES`, `QualityGateReport`, `QualityGateDiagnosis`, `diagnoseDataQualityGate`, `runDataQualityGate`
- **spearman-evaluator.ts**: `SpearmanEvalResult`, `runSpearmanEvaluation`, `spearmanRankCorrelation`
- **auto-labeler.ts**: `AutoLabelItemResult`, `AutoLabelResult`, `runAutoLabeler`
- **fresh-video-scanner.ts**: `DiscoveryScanResult`, `runDiscoveryScan`
- **niche-creator-scraper.ts**: `NICHE_HASHTAGS`, `NicheCreatorScrapeOpts`, `NicheCreatorScrapeResult`, `scrapeNicheCreators`
- **export-scraped-training-data.ts**: `ExportResult`, `exportScrapedTrainingData`
- **post-promotion-validator.ts**: `PostPromotionValidationResult`, `runPostPromotionValidation`
- **scraped-video-quality-gate.ts**: `ColumnCoverage`, `GroupCoverage`, `ScrapedQualityGateReport`, `RunScrapedVideoQualityGateOptions`, `runScrapedVideoQualityGate`
- **designate-scraped-holdout.ts**: `ScrapedHoldoutReport`, `DesignateScrapedHoldoutOptions`, `designateScrapedHoldout`
- **designate-holdout.ts**: `HoldoutReport`, `designateHoldout`
- **model-evaluator.ts**: `TrainingFeatureVector`, `ModelPrediction`, `predictDPS`, `isV9ModelAvailable`, `getV9ModelInfo`
- **metric-collector.ts**: `runMetricCollector`
- **metric-attacher.ts**: `attachMetricsForRun`, `attachMetricsBatch`
- **metric-scheduler.ts**: `extractTikTokUrl`, `createMetricSchedules`
- **schedule-backfill.ts**: `BackfillResult`, `backfillMetricSchedules`
- **scrape-label.ts**: `ScrapedMetrics`, `ScrapeLabeResult`, `extractApifyMetrics`, `extractApifyCreateTime`, `isVideoMature`, `labelOnScrape`
- **cross-niche-miner.ts**: `TopFeatureRow`, `TransferCandidate`, `mineTopFeaturesForNiche`, `findTransferCandidates`, `countFeedbackRowsForNiche`
- **dps-insights.ts**: `DpsInsightsInput`, `DpsInsights`, `generateDpsInsights`
- **training-executor.ts**: `TrainingExecutionResult`, `TrainingMetrics`, `executeTrainingJob`
- **training-features-export-columns.ts**: `CONTENT_FEATURE_COLUMNS`, `ContentFeatureColumn`, `CONTENT_BINARY_COLUMNS`, `CONTENT_CATEGORICAL_COLUMNS`, `contentFeatureGroup`, `ContentFeatureSanityChecks`, `sanityCheckContentColumns`
- **contamination-validator.ts**: `ContaminationDetail`, `ValidationResult`, `validateTrainingFeatures`
- **tiktok-metric-fetcher.ts**: `parsePlatformVideoId`, `fetchTikTokMetrics`
- **follower-resolver.ts**: `resolveFollowerCount`
- **run-s6-retrain.ts**: `VariantResult`, `RetrainResult`, `runS6Retrain`

### 3d. `src/lib/calibration/`

| File | Lines | Last modified | Imports |
|------|------:|---------------|--------:|
| src/lib/calibration/negative-signals.ts | 347 | 2026-03-30 | 1 |
| src/lib/calibration/calibration.ts | 242 | 2026-03-30 | 9 |
| src/lib/calibration/auto-calibrator.ts | 202 | 2026-03-30 | 0 |
| src/lib/calibration/score-calibrator.ts | 196 | 2026-03-30 | 2 |
| src/lib/calibration/calibrated-prompts.ts | 175 | 2026-03-30 | 0 |
| src/lib/calibration/index.ts | 46 | 2026-03-30 | 15 |
| src/lib/calibration/isotonic.ts | 43 | 2026-03-30 | 0 |
| src/lib/calibration/binning.ts | 31 | 2026-03-30 | 1 |
| src/lib/calibration/metrics.ts | 27 | 2026-03-30 | 1 |
| src/lib/calibration/thresholds.ts | 7 | 2026-03-30 | 3 |
| src/lib/calibration/__tests__/metrics.test.ts | 16 | 2026-03-30 | 0 |
| src/lib/calibration/__tests__/thresholds.test.ts | 9 | 2026-03-30 | 0 |

Exports:
- **negative-signals.ts**: `NegativeSignal`, `PositiveSignal`, `detectNegativeSignals`, `detectPositiveSignals`, `calculatePenalty`, `calculateBonus`, `applySignals`, `applyNegativeSignals`, `getSignalSummary`
- **calibration.ts**: `CalibrationModelRecord`, `ensureCalibrationTables`, `trainCalibrationModelsForLast30d`, `getCalibrationVersion`, `applyCalibration`, `getDecisionThreshold`
- **auto-calibrator.ts**: `CalibrationUpdate`, `CalibrationAnalysis`, `analyzeCalibration`, `applyCalibrationUpdates`, `createCalibrationHistoryEntry`, `calculateCalibrationConfidence`, `getCalibrationReport`
- **score-calibrator.ts**: `CalibrationConfig`, `DEFAULT_CALIBRATIONS`, `calibrateScore`, `calibrateAllScores`, `calculateWeightedScore`, `learnCalibration`, `calculateMeanError`, `formatCalibration`
- **calibrated-prompts.ts**: `CALIBRATED_GPT4_PROMPT`, `CALIBRATED_GEMINI_PROMPT`, `CALIBRATED_PATTERN_PROMPT`, `CALIBRATED_XGBOOST_FEATURES_PROMPT`, `CALIBRATION_SYSTEM_PROMPT`
- **isotonic.ts**: `IsoPoint`, `fitIsotonic`
- **binning.ts**: `ReliabilityBin`, `buildBins`, `aggregateIntoBins`
- **metrics.ts**: `expectedCalibrationError`, `areaUnderRoc`
- **thresholds.ts**: `thresholdFor`
- **index.ts**: barrel file (15 callers — single highest re-export entry point in this dir)

### 3e. `src/lib/drift/`

| File | Lines | Last modified | Imports |
|------|------:|---------------|--------:|
| src/lib/drift/feature-importance.ts | 204 | 2026-03-30 | 2 |

Exports:
- **feature-importance.ts**: `computeFeatureImportance`

**Section 3 totals:** orchestration: 3 files; features: 10 files; training: 60 files (44 TS + 9 PY + 2 SH + 1 MD + 4 data); calibration: 12 files; drift: 1 file. **Section 3 grand total: 86 files.**

---

## Section 4 — Predictor-related API routes

Selection rule: routes whose URL path contains `prediction|predict|viral|score|xgboost|training|model` **OR** whose imports reference `lib/prediction`, `lib/services/viral-prediction`, `lib/orchestration/kai-orchestrator`, `lib/training/`, `lib/calibration`, `lib/drift`, `lib/features/`, `lib/scoring`. Path-only keyword match used for the URL gate (URL segments only — applied to the route URL, not arbitrary file content).

| Route URL | File | Lines | Imports from `@/lib/...` |
|-----------|------|------:|--------------------------|
| /api/admin/active-label-queue | src/app/api/admin/active-label-queue/route.ts | 23 | lib/calibration/calibration, lib/env |
| /api/admin/apify-scrapers | src/app/api/admin/apify-scrapers/route.ts | 253 | lib/services/viral-prediction/apify-scraper-manager |
| /api/admin/apify-scrapers/scheduler | src/app/api/admin/apify-scrapers/scheduler/route.ts | 212 | lib/services/viral-prediction/scraping-scheduler |
| /api/admin/baselines/summary | src/app/api/admin/baselines/summary/route.ts | 78 | lib/calibration/calibration, lib/env, lib/security/auth-middleware, lib/security/rate-limiter |
| /api/admin/drift/run-now | src/app/api/admin/drift/run-now/route.ts | 12 | lib/drift/feature-importance, lib/utils/adminAuth |
| /api/admin/featurestore/health | src/app/api/admin/featurestore/health/route.ts | 36 | lib/env, lib/features/schema, lib/security/auth-middleware, lib/storage/object_store |
| /api/admin/framework-evolution/patterns | src/app/api/admin/framework-evolution/patterns/route.ts | 281 | (none) |
| /api/admin/framework-evolution/run | src/app/api/admin/framework-evolution/run/route.ts | 228 | lib/services/viral-prediction/framework-evolution-system |
| /api/admin/holdout/designate | src/app/api/admin/holdout/designate/route.ts | 49 | lib/auth/api-guard, lib/training/designate-holdout |
| /api/admin/integration/dryrun | src/app/api/admin/integration/dryrun/route.ts | 103 | (none) |
| /api/admin/integration/dryrun_calibration | src/app/api/admin/integration/dryrun_calibration/route.ts | 42 | lib/calibration/calibration, lib/env |
| /api/admin/integration/dryrun_formats | src/app/api/admin/integration/dryrun_formats/route.ts | 26 | lib/services/viral-prediction/unified-prediction-engine, lib/utils/adminAuth |
| /api/admin/integration/dryrun_hourly | src/app/api/admin/integration/dryrun_hourly/route.ts | 15 | lib/services/viral-prediction/unified-prediction-engine, lib/video/hourly |
| /api/admin/integration/dryrun_replay_81225 | src/app/api/admin/integration/dryrun_replay_81225/route.ts | 30 | lib/env, lib/services/viral-prediction/unified-prediction-engine |
| /api/admin/integration/replay_apify | src/app/api/admin/integration/replay_apify/route.ts | 36 | lib/env, lib/services/viral-prediction/unified-prediction-engine |
| /api/admin/integration/status | src/app/api/admin/integration/status/route.ts | 847 | lib/calibration/calibration, lib/cron/scheduler, lib/env, lib/frameworks/mapping_guide, lib/runtime/demo_mode, lib/services/viral-prediction/dps-baselines, lib/services/viral-prediction/unified-prediction-engine |
| /api/admin/metric-attach | src/app/api/admin/metric-attach/route.ts | 62 | lib/training/feature-availability-matrix, lib/training/metric-attacher, lib/training/training-ingest-types, lib/utils/adminAuth |
| /api/admin/metric-collector/run | src/app/api/admin/metric-collector/run/route.ts | 51 | lib/training/feature-availability-matrix, lib/training/metric-collector, lib/training/training-ingest-types, lib/utils/adminAuth |
| /api/admin/metric-schedule | src/app/api/admin/metric-schedule/route.ts | 183 | lib/training/feature-availability-matrix, lib/training/metric-scheduler, lib/training/training-ingest-types, lib/utils/adminAuth |
| /api/admin/model/promote_if_better | src/app/api/admin/model/promote_if_better/route.ts | 8 | lib/services/canary/promote |
| /api/admin/model/set_shadow | src/app/api/admin/model/set_shadow/route.ts | 15 | lib/env |
| /api/admin/model-evaluation | src/app/api/admin/model-evaluation/route.ts | 151 | lib/evaluation/benchmark-runner, lib/supabase-server |
| /api/admin/operations/accuracy | src/app/api/admin/operations/accuracy/route.ts | 237 | lib/supabase-server, lib/training/training-eligibility |
| /api/admin/operations/system-health | src/app/api/admin/operations/system-health/route.ts | 274 | lib/prediction/system-registry, lib/supabase-server |
| /api/admin/phase2-test | src/app/api/admin/phase2-test/route.ts | 109 | (none) |
| /api/admin/predict | src/app/api/admin/predict/route.ts | 204 | lib/prediction/runPredictionPipeline, lib/services/prediction-hash |
| /api/admin/prediction/[id]/evidence | src/app/api/admin/prediction/[id]/evidence/route.ts | 30 | lib/audit/audit_utils, lib/env |
| /api/admin/prediction/analyze-video | src/app/api/admin/prediction/analyze-video/route.ts | 76 | lib/services/viral-prediction/main-prediction-engine |
| /api/admin/prediction/baselines/recompute | src/app/api/admin/prediction/baselines/recompute/route.ts | 8 | lib/services/viral-prediction/dps-baselines |
| /api/admin/prediction/test-engine | src/app/api/admin/prediction/test-engine/route.ts | 32 | (none) |
| /api/admin/prediction/unified-predict | src/app/api/admin/prediction/unified-predict/route.ts | 221 | lib/env, lib/services/dual_runner, lib/services/viral-prediction/unified-prediction-engine |
| /api/admin/prediction-runs/[id]/attach-platform-id | src/app/api/admin/prediction-runs/[id]/attach-platform-id/route.ts | 150 | lib/training/training-ingest-types, lib/utils/adminAuth |
| /api/admin/prediction-runs | src/app/api/admin/prediction-runs/route.ts | 125 | lib/training/training-ingest-types, lib/utils/adminAuth |
| /api/admin/prediction-validation/accuracy | src/app/api/admin/prediction-validation/accuracy/route.ts | 38 | lib/supabase/client |
| /api/admin/prediction-validation/metrics | src/app/api/admin/prediction-validation/metrics/route.ts | 93 | lib/supabase-server |
| /api/admin/prediction-validation/start-test | src/app/api/admin/prediction-validation/start-test/route.ts | 179 | lib/env |
| /api/admin/prediction-validation/trigger | src/app/api/admin/prediction-validation/trigger/route.ts | 86 | lib/supabase-server, lib/validation/actuals_join |
| /api/admin/prediction-validation/validations | src/app/api/admin/prediction-validation/validations/route.ts | 75 | lib/supabase/client |
| /api/admin/reprocess-queue | src/app/api/admin/reprocess-queue/route.ts | 280 | lib/prediction/runPredictionPipeline |
| /api/admin/run-viral-filter | src/app/api/admin/run-viral-filter/route.ts | 111 | lib/services/viralFilter |
| /api/admin/script-intelligence/analyze | src/app/api/admin/script-intelligence/analyze/route.ts | 219 | lib/env, lib/services/viral-prediction/script-intelligence-engine |
| /api/admin/super-admin/prediction-validations | src/app/api/admin/super-admin/prediction-validations/route.ts | 87 | lib/env |
| /api/admin/super-admin/quick-predict | src/app/api/admin/super-admin/quick-predict/route.ts | 484 | lib/env, lib/orchestration/kai-orchestrator, lib/services/master-viral-algorithm, lib/services/tiktok-downloader, lib/services/tiktok-specific-analyzer, lib/services/whisper-service |
| /api/admin/test-viral-filter | src/app/api/admin/test-viral-filter/route.ts | 40 | lib/services/viralFilter |
| /api/admin/trainer | src/app/api/admin/trainer/route.ts | 341 | lib/prediction/model-router, lib/training/post-promotion-validator, lib/training/trainer-engine |
| /api/admin/training/designate-holdout | src/app/api/admin/training/designate-holdout/route.ts | 26 | lib/auth/api-guard, lib/training/designate-scraped-holdout |
| /api/admin/training/export-data | src/app/api/admin/training/export-data/route.ts | 27 | lib/auth/api-guard, lib/training/export-scraped-training-data |
| /api/admin/training/prepare | src/app/api/admin/training/prepare/route.ts | 112 | lib/auth/api-guard, lib/training/dataset-prep |
| /api/admin/training/quality-gate | src/app/api/admin/training/quality-gate/route.ts | 76 | lib/auth/api-guard, lib/training/data-quality-gate |
| /api/admin/training/retrain/promote | src/app/api/admin/training/retrain/promote/route.ts | 46 | lib/auth/api-guard |
| /api/admin/training/retrain | src/app/api/admin/training/retrain/route.ts | 27 | lib/auth/api-guard, lib/training/run-s6-retrain |
| /api/admin/training/scraped-quality-gate | src/app/api/admin/training/scraped-quality-gate/route.ts | 25 | lib/auth/api-guard, lib/training/scraped-video-quality-gate |
| /api/admin/training-command/config | src/app/api/admin/training-command/config/route.ts | 101 | lib/prediction/system-registry |
| /api/admin/training-command | src/app/api/admin/training-command/route.ts | 155 | (none) |
| /api/admin/training-command/trigger | src/app/api/admin/training-command/trigger/route.ts | 78 | (none) |
| /api/admin/training-command/video/[id] | src/app/api/admin/training-command/video/[id]/route.ts | 71 | (none) |
| /api/admin/training-ingest | src/app/api/admin/training-ingest/route.ts | 149 | lib/prediction/runPredictionPipeline, lib/training/feature-availability-matrix, lib/training/metric-scheduler, lib/training/training-ingest-types, lib/utils/adminAuth |
| /api/admin/validation/stream | src/app/api/admin/validation/stream/route.ts | 32 | lib/calibration/calibration, lib/env |
| /api/admin/validation/summary | src/app/api/admin/validation/summary/route.ts | 37 | lib/calibration/calibration, lib/env, lib/security/auth-middleware, lib/security/rate-limiter |
| /api/admin/viral-genomes/stats | src/app/api/admin/viral-genomes/stats/route.ts | 178 | (none) |
| /api/admin/viral-prediction/accuracy-validation | src/app/api/admin/viral-prediction/accuracy-validation/route.ts | 358 | lib/services/viral-prediction/main-prediction-engine |
| /api/admin/viral-prediction/accuracy-validation-real | src/app/api/admin/viral-prediction/accuracy-validation-real/route.ts | 104 | (none) |
| /api/admin/viral-prediction/daily-recipe-book | src/app/api/admin/viral-prediction/daily-recipe-book/route.ts | 453 | lib/services/viral-prediction/main-prediction-engine |
| /api/admin/viral-prediction/pipeline-status | src/app/api/admin/viral-prediction/pipeline-status/route.ts | 519 | (none) |
| /api/admin/viral-prediction/real-time-analysis | src/app/api/admin/viral-prediction/real-time-analysis/route.ts | 193 | lib/services/viral-prediction/main-prediction-engine, lib/types/viral-prediction |
| /api/admin/viral-prediction-hub | src/app/api/admin/viral-prediction-hub/route.ts | 429 | lib/services/abTestingSystem, lib/services/multiModuleIntelligenceHarvester, lib/services/omniscientDatabase, lib/services/omniscientIntegration, lib/services/realTimeScriptOptimizer, lib/services/scriptDNASequencer, lib/services/scriptSingularity, lib/services/templateAnalysisBackend, lib/services/unifiedTestingFramework, lib/services/validationSystem, lib/services/viral-prediction/main-prediction-engine |
| /api/algorithm/explain | src/app/api/algorithm/explain/route.ts | 366 | lib/orchestration/kai-orchestrator |
| /api/analytics/unified-scores | src/app/api/analytics/unified-scores/route.ts | 150 | lib/services/soundAnalysisService, lib/services/templateAnalysisService |
| /api/analyze/apply-fixes | src/app/api/analyze/apply-fixes/route.ts | 9 | lib/services/scoring-service |
| /api/analyze | src/app/api/analyze/route.ts | 21 | lib/analysis/sla, lib/services/scoring-service |
| /api/bulk-download/calculate-dps | src/app/api/bulk-download/calculate-dps/route.ts | 253 | lib/training/dps-insights, lib/training/dps-v2 |
| /api/bulk-download/predict | src/app/api/bulk-download/predict/route.ts | 275 | lib/prediction/run-vps-pipeline-v2 |
| /api/bulk-download | src/app/api/bulk-download/route.ts | 401 | lib/services/immediate-video-analyzer, lib/services/tiktok-downloader, lib/training/dps-insights, lib/training/dps-v2 |
| /api/calibration/configs | src/app/api/calibration/configs/route.ts | 136 | lib/calibration/score-calibrator |
| /api/calibration/diagnose | src/app/api/calibration/diagnose/route.ts | 269 | lib/calibration/negative-signals, lib/calibration/score-calibrator, lib/orchestration/kai-orchestrator |
| /api/channel/me | src/app/api/channel/me/route.ts | 47 | lib/onboarding/channel-verifier, lib/prediction/system-registry, lib/supabase/server |
| /api/content-calendar | src/app/api/content-calendar/route.ts | 219 | lib/content/content-calendar, lib/patterns/pattern-metrics, lib/prediction/creator-context, lib/supabase/server |
| /api/creator/concept-score/expand | src/app/api/creator/concept-score/expand/route.ts | 232 | lib/prediction/creator-context, lib/prediction/runPredictionPipeline, lib/supabase/server |
| /api/creator/concept-score | src/app/api/creator/concept-score/route.ts | 172 | lib/prediction/concept-scorer, lib/prediction/creator-context, lib/supabase/server |
| /api/creator/predict | src/app/api/creator/predict/route.ts | 278 | lib/context/assemble-context, lib/prediction/creator-context, lib/prediction/runPredictionPipeline, lib/supabase/server, lib/training/metric-scheduler |
| /api/creator/predictions | src/app/api/creator/predictions/route.ts | 116 | (none) |
| /api/creator-workflow/predict | src/app/api/creator-workflow/predict/route.ts | 37 | (none) |
| /api/cron/training-pipeline | src/app/api/cron/training-pipeline/route.ts | 117 | (none) |
| /api/cross/predict | src/app/api/cross/predict/route.ts | 25 | lib/cross/service, lib/data, lib/data/init-fixtures |
| /api/debug/seed-p1-demo | src/app/api/debug/seed-p1-demo/route.ts | 150 | lib/calibration/thresholds, lib/db/ensure, lib/dev/accuracyStore, lib/env, lib/prediction/record |
| /api/dna-detective/predict | src/app/api/dna-detective/predict/route.ts | 179 | lib/prediction/record |
| /api/fresh-scraper/predict | src/app/api/fresh-scraper/predict/route.ts | 224 | lib/services/tiktok-downloader |
| /api/impact/score | src/app/api/impact/score/route.ts | 117 | lib/services/feature-extractor, lib/services/viral-prediction-model |
| /api/jobs/calibrate | src/app/api/jobs/calibrate/route.ts | 116 | lib/calibration/binning, lib/calibration/metrics, lib/dev/accuracyStore |
| /api/kai/predict | src/app/api/kai/predict/route.ts | 379 | lib/prediction/run-vps-pipeline-v2 |
| /api/learning/model | src/app/api/learning/model/route.ts | 18 | lib/learning/store |
| /api/learning/update | src/app/api/learning/update/route.ts | 391 | lib/training/dps-v2 |
| /api/marketing/viral-analysis | src/app/api/marketing/viral-analysis/route.ts | 68 | lib/services/viralVideoAnalysisService |
| /api/ml/update-model | src/app/api/ml/update-model/route.ts | 43 | lib/types/prediction |
| /api/models/active | src/app/api/models/active/route.ts | 12 | lib/env |
| /api/models/promote | src/app/api/models/promote/route.ts | 12 | lib/env |
| /api/models/register | src/app/api/models/register/route.ts | 30 | lib/env |
| /api/operations/training/export | src/app/api/operations/training/export/route.ts | 169 | (none) |
| /api/operations/training/label | src/app/api/operations/training/label/route.ts | 156 | lib/training/dps-v2 |
| /api/operations/training/reprocess | src/app/api/operations/training/reprocess/route.ts | 300 | lib/prediction/runPredictionPipeline |
| /api/operations/training/train | src/app/api/operations/training/train/route.ts | 177 | (none) |
| /api/orchestrator/predict | src/app/api/orchestrator/predict/route.ts | 85 | (none) |
| /api/outcomes/ingest | src/app/api/outcomes/ingest/route.ts | 71 | lib/calibration/thresholds, lib/db/ensure, lib/dev/accuracyStore, lib/env, lib/training/dps-v2 |
| /api/predict/legacy | src/app/api/predict/legacy/route.ts | 103 | (none) |
| /api/predict/log | src/app/api/predict/log/route.ts | 17 | lib/validation/store |
| /api/predict/pre-content | src/app/api/predict/pre-content/route.ts | 256 | lib/prediction/runPredictionPipeline |
| /api/predict | src/app/api/predict/route.ts | 109 | lib/prediction/runPredictionPipeline |
| /api/predict/v2 | src/app/api/predict/v2/route.ts | 196 | lib/prediction/run-vps-pipeline-v2 |
| /api/predict/viral | src/app/api/predict/viral/route.ts | 371 | lib/services/gppt/knowledge-extraction-engine |
| /api/prediction | src/app/api/prediction/route.ts | 16 | lib/services/prediction-service |
| /api/public/score | src/app/api/public/score/route.ts | 11 | lib/flags |
| /api/quick-win/analyze | src/app/api/quick-win/analyze/route.ts | 94 | lib/prediction/creator-context, lib/prediction/runPredictionPipeline, lib/supabase/server |
| /api/quick-win/context | src/app/api/quick-win/context/route.ts | 137 | lib/patterns/pattern-metrics, lib/prediction/creator-context, lib/supabase/server |
| /api/quick-win/generate-script | src/app/api/quick-win/generate-script/route.ts | 262 | lib/prediction/creator-context, lib/prediction/runPredictionPipeline, lib/prediction/system-registry, lib/supabase/server |
| /api/sandbox/predict | src/app/api/sandbox/predict/route.ts | 151 | (none) |
| /api/scraping/start | src/app/api/scraping/start/route.ts | 574 | lib/orchestration/kai-orchestrator, lib/services/immediate-video-analyzer |
| /api/studio/predictions | src/app/api/studio/predictions/route.ts | 61 | lib/env |
| /api/studio/quick-predict | src/app/api/studio/quick-predict/route.ts | 165 | lib/services/alertService, lib/services/videoIntelligenceService, lib/services/videoScraperService |
| /api/templates/evolution | src/app/api/templates/evolution/route.ts | 17 | lib/services/viral-prediction/framework-evolution-system |
| /api/templates/predictions/notifications/[id]/read | src/app/api/templates/predictions/notifications/[id]/read/route.ts | 111 | lib/supabase-client |
| /api/templates/predictions/notifications/[id] | src/app/api/templates/predictions/notifications/[id]/route.ts | 108 | lib/supabase-client |
| /api/templates/predictions/notifications | src/app/api/templates/predictions/notifications/route.ts | 162 | lib/supabase-client, lib/types/trendingTemplate, lib/utils/demoData |
| /api/templates/predictions | src/app/api/templates/predictions/route.ts | 349 | lib/services/trendPredictionService, lib/supabase-client, lib/types/trendingTemplate, lib/utils/demoData |
| /api/test/components | src/app/api/test/components/route.ts | 181 | lib/orchestration/kai-orchestrator |
| /api/training/dps-percentile | src/app/api/training/dps-percentile/route.ts | 91 | lib/training/dps-v2 |
| /api/training/export | src/app/api/training/export/route.ts | 355 | lib/training/training-eligibility |
| /api/training/extract-features | src/app/api/training/extract-features/route.ts | 76 | lib/training/feature-extractor |
| /api/training/history | src/app/api/training/history/route.ts | 441 | lib/training/dps-v2, lib/training/training-eligibility |
| /api/training/jobs | src/app/api/training/jobs/route.ts | 134 | lib/training/feature-availability-matrix, lib/training/training-executor |
| /api/training/models/[id]/archive | src/app/api/training/models/[id]/archive/route.ts | 45 | (none) |
| /api/training/models/[id]/deploy | src/app/api/training/models/[id]/deploy/route.ts | 67 | lib/training/feature-availability-matrix |
| /api/training/models | src/app/api/training/models/route.ts | 75 | (none) |
| /api/training/niche-creators | src/app/api/training/niche-creators/route.ts | 131 | (none) |
| /api/training/pipeline-status | src/app/api/training/pipeline-status/route.ts | 185 | (none) |
| /api/training/populate | src/app/api/training/populate/route.ts | 83 | lib/services/training |
| /api/training/readiness-summary/not-ready | src/app/api/training/readiness-summary/not-ready/route.ts | 59 | (none) |
| /api/training/readiness-summary | src/app/api/training/readiness-summary/route.ts | 49 | (none) |
| /api/training/scrape-hashtags | src/app/api/training/scrape-hashtags/route.ts | 348 | lib/services/apify-tiktok-client, lib/training/dps-v2, lib/training/scrape-label |
| /api/training/scrape-profiles | src/app/api/training/scrape-profiles/route.ts | 251 | lib/services/apify-tiktok-client, lib/training/dps-v2, lib/training/scrape-label |
| /api/training/stats | src/app/api/training/stats/route.ts | 95 | lib/services/training |
| /api/training/validate-features | src/app/api/training/validate-features/route.ts | 101 | lib/training/contamination-validator, lib/training/feature-availability-matrix |
| /api/validation/lock-predictions | src/app/api/validation/lock-predictions/route.ts | 28 | (none) |
| /api/validation/metrics | src/app/api/validation/metrics/route.ts | 20 | lib/services/viral-prediction/accuracy-tracker |
| /api/validation/predict-with-visual | src/app/api/validation/predict-with-visual/route.ts | 175 | (none) |
| /api/value-template-editor/predict | src/app/api/value-template-editor/predict/route.ts | 548 | lib/env, lib/services/viral-pattern-analyzer |
| /api/value-template-editor/viral-videos | src/app/api/value-template-editor/viral-videos/route.ts | 153 | lib/env |
| /api/video/predict | src/app/api/video/predict/route.ts | 134 | lib/database/supabase-viral-prediction, lib/services/feature-extractor, lib/services/viral-prediction-model |
| /api/viral-dna-report | src/app/api/viral-dna-report/route.ts | 175 | (none) |
| /api/viral-prediction/accuracy-enhanced | src/app/api/viral-prediction/accuracy-enhanced/route.ts | 373 | lib/monitoring/real-time-monitor, lib/services/accuracy-enhancement/accuracy-orchestrator |
| /api/viral-prediction/analytics | src/app/api/viral-prediction/analytics/route.ts | 164 | (none) |
| /api/viral-prediction/analyze | src/app/api/viral-prediction/analyze/route.ts | 203 | lib/prediction/runPredictionPipeline |
| /api/viral-prediction/analyze-complete | src/app/api/viral-prediction/analyze-complete/route.ts | 245 | lib/services/viral-prediction/ai-brain-intelligence, lib/services/viral-prediction/framework-parser, lib/services/viral-prediction/main-prediction-engine |
| /api/viral-prediction/batch-process | src/app/api/viral-prediction/batch-process/route.ts | 380 | lib/env, lib/services/viral-prediction/apify-integration |
| /api/viral-prediction/dashboard | src/app/api/viral-prediction/dashboard/route.ts | 376 | lib/env |
| /api/viral-prediction/fast | src/app/api/viral-prediction/fast/route.ts | 306 | lib/dev/accuracyStore, lib/monitoring/real-time-monitor |
| /api/viral-prediction/inception | src/app/api/viral-prediction/inception/route.ts | 224 | lib/services/viral-prediction/inception-mode |
| /api/viral-prediction/optimized | src/app/api/viral-prediction/optimized/route.ts | 428 | lib/monitoring/real-time-monitor, lib/services/optimization/optimization-orchestrator |
| /api/viral-prediction/validate-system | src/app/api/viral-prediction/validate-system/route.ts | 464 | lib/env, lib/services/viral-prediction/accuracy-tracker, lib/services/viral-prediction/ai-prediction-engine, lib/services/viral-prediction/apify-integration |
| /api/viral-scraping | src/app/api/viral-scraping/route.ts | 193 | lib/services/viral-scraping/viral-content-scraper |

**Total predictor-related routes: 159**

---

## Section 5 — XGBoost artifacts

No `*.xgb` files found anywhere in the repo. The XGBoost models in this repo are stored as JSON model dumps (XGBoost's `.model.json` / scaler `.json`) plus `.pkl` for some scalers.

### Top-level `models/` directory (production)

| File | Notes |
|------|-------|
| models/feature-names.json | Active feature list |
| models/feature-scaler.pkl | Active scaler (pickle) |
| models/holdout-video-ids.json | Holdout split |
| models/training-metrics.json | Latest training metrics |
| models/xgboost-dps-model.json | DPS model |
| models/xgboost-enhanced.json | Enhanced model |
| models/xgboost-v6-features.json | v6 feature names |
| models/xgboost-v6-metadata.json | v6 metadata |
| models/xgboost-v6-metadata-baseline.json | v6 baseline metadata |
| models/xgboost-v6-model.json | **v6 model artifact (still on disk)** |
| models/xgboost-v6-scaler.pkl | v6 scaler (pickle) |
| models/xgboost-v7-{features,metadata,model,scaler}.json | v7 set |
| models/xgboost-v7-scaler.pkl | v7 scaler (pickle) |
| models/xgboost-v8-{features,metadata,model,scaler}.json | v8 set |
| models/xgboost-v9-{features,metadata,model,scaler}.json | v9 set |
| models/xgboost-v10-{features,metadata,model,scaler}.json | v10 set |
| models/xgboost-v15-{features,metadata,model,scaler}.json | v15 set |
| models/visualizations/feature_importance.png | viz |
| models/visualizations/predictions_vs_actual.png | viz |
| models/visualizations/residuals.png | viz |

### `model-backups/` (versioned snapshots)

- model-backups/v10-production-backup-2026-04-17/BACKUP_README.md
- model-backups/v10-production-backup-2026-04-17/xgboost-v10-{features,metadata,model,scaler}.json

### `data/sandbox/` (sandbox training experiments)

- data/sandbox/xgboost-v11-sandbox.model
- data/sandbox/xgboost-v11-sandbox-{scaler,features,metadata}.json
- data/sandbox/xgboost-v12-sandbox-{features,metadata}.json
- data/sandbox/xgboost-v13-sandbox-{model,features,metadata}.json
- data/sandbox/xgboost-v14a-sandbox-{model,features,metadata}.json
- data/sandbox/xgboost-v14b-sandbox-{model,features,metadata}.json
- data/sandbox/xgboost-v14c-sandbox-{model,features,metadata}.json
- data/sandbox/xgboost-v14d-sandbox-{model,features,metadata}.json
- data/sandbox/xgboost-v14-clean-sandbox-{model,features,metadata,holdout-ids}.json
- data/xgboost-retrain-input.json

### `fixtures/learning/` (per-version model fixtures)

- fixtures/learning/model_v1.json … model_v17.json (sequence: v1, v2, v3, v4, v5, v6, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17 — **v7 is missing from this directory**)

### Training-side model artifacts (under `src/lib/training/`)

- src/lib/training/results/{content_only, metadata_only, full_signal, full_signal_no_timing, full_signal_quality_rows}.model.json
- src/lib/training/results/scaling_params.json, results_summary.json
- src/lib/training/results-s7/{v15-honest-with-res, v15-honest-no-res}.model.json
- src/lib/training/results-s7/{scaling_params_s7, feature_audit_s7, results_summary_s7, smoke_python_preds, smoke_py_scaled_row0, smoke_ts_scaled_row0}.json
- src/lib/training/results-s7/dps_distributions_validation.png

### Code that still references `v6` (or `xgb_v6`)

Live code paths gated on `MODEL_VERSION=xgb_v6`:
- src/lib/services/virality-indicator/xgboost-virality-service.ts:58 — `// Set MODEL_VERSION=xgb_v6 in .env.local to use the trained v6 model`
- src/lib/services/virality-indicator/xgboost-virality-service.ts:61 — `const ACTIVE_MODEL_VERSION = process.env.MODEL_VERSION === 'xgb_v6' ? 'v6' : 'v5-simplified';`
- xgboost-virality-service.ts lines 71, 72, 81, 86, 93, 94, 100, 102, 129, 139, 242, 245 — entire v6 inference branch (loads `models/xgboost-v6-features.json`, calls Python subprocess, falls back to v5 on error)

CLAUDE.md states "XGBoost v6 disabled" in policy notes, but the v6 code path remains in `xgboost-virality-service.ts` and the v6 model artifacts (`models/xgboost-v6-*`) are still on disk. **Flagged for awareness — no action recommended.**

---

## Section 6 — Anything obviously dead (per strict criteria)

Strict criteria reminder (all must hold): zero importers across `src/`, `scripts/`, `tests/`, `supabase/`, `config/` AND filename contains one of `old`, `deprecated`, `legacy_v`, `v1_`, `v2_`, `backup`, `_unused` AND not a `*.xgb` artifact.

**Result: NO predictor files meet all three criteria.**

Files whose filenames matched the substrings but failed at least one other criterion:
- `src/lib/calibration/thresholds.ts` — substring "old" matched inside "thresh-**old**s". Not a real marker; 3 importers.
- `src/lib/calibration/__tests__/thresholds.test.ts` — same false-positive substring.
- `src/lib/services/training/training-quality-thresholds.ts` — same false-positive substring (this file is under `services/training/`, not in the listed adjacent dirs, but inspected because the glob hit it).
- `src/lib/training/designate-holdout.ts` — substring "old" matched inside "h**old**out". Not a real marker; 1 importer.
- `src/lib/training/designate-scraped-holdout.ts` — same false-positive substring; 1 importer.
- `src/app/api/freedom-agent/chat/route.deprecated.ts` — explicitly named `.deprecated.ts` and outside the predictor surface (freedom-agent chat). Not in scope of this inventory.

Ambiguous candidates (zero importers but no dead-marker in filename — therefore NOT classified as dead per the strict criteria, but recorded here for visibility):
- src/lib/orchestration/parallel-execution.ts — 0 importers
- src/lib/orchestration/validation-gates.ts — 0 importers
- src/lib/calibration/auto-calibrator.ts — 0 importers
- src/lib/calibration/calibrated-prompts.ts — 0 importers
- src/lib/calibration/isotonic.ts — 0 importers
- src/lib/services/viral-prediction/comprehensive-framework-library.ts — 0 importers
- src/lib/services/viral-prediction/cultural-timing-intelligence.ts — 0 importers
- src/lib/services/viral-prediction/engagement-velocity-tracker.ts — 0 importers
- src/lib/services/viral-prediction/god-mode-psychological-analyzer.ts — 0 importers
- src/lib/services/viral-prediction/hook-detector.ts — 0 importers
- src/lib/services/viral-prediction/incubation-classifier.ts — 0 importers
- src/lib/services/viral-prediction/production-quality-analyzer.ts — 0 importers
- src/lib/services/viral-prediction/studio-integration.ts — 0 importers
- src/lib/services/viral-prediction/test-unified-engine.ts — 0 importers
- src/lib/training/{backfill_fixed_features, check_scraped_cols, follower-resolver, model-evaluator, promote_v15, run_export_training_data, smoke_test_v15, smoke_vector_diff, test_audio_classifier, test_dead_features, tiktok-metric-fetcher, verify_promotion}.ts — 0 importers (most appear to be standalone scripts/CLIs, not library modules)
- src/lib/training/autoresearch/{bridge_results_to_db, check_experiments, clear_stuck_lock, list_all_sandbox}.ts — 0 importers (autoresearch CLIs)

Marked **ambiguous**: many of these are scripts intended to be invoked directly (CLI tools, smoke tests, one-shot migrations) rather than imported modules. Zero importers does not imply dead in those cases.

---

## Totals

| Section | File count |
|---------|-----------:|
| Section 1 — `src/lib/prediction/` | 19 |
| Section 2 — `src/lib/services/viral-prediction/` | 25 |
| Section 3 — Adjacent surfaces (orchestration + features + training + calibration + drift) | 86 |
| Section 4 — Predictor-related API routes | 159 |
| Section 5 — XGBoost artifacts (top-level, sandbox, backups, fixtures, training results) | ~100+ files across `models/`, `model-backups/`, `data/sandbox/`, `fixtures/learning/`, `src/lib/training/results*/` (exact count varies by what one counts as an "artifact") |
| Section 6 — Obviously dead (strict definition) | 0 |

---

## Top 10 most-imported predictor files (by import count)

| Rank | File | Imports |
|-----:|------|--------:|
| 1 | src/lib/training/dps-v2.ts | 19 |
| 2 | src/lib/prediction/system-registry.ts | 18 |
| 3 | src/lib/prediction/creator-context.ts | 17 |
| 4 | src/lib/calibration/index.ts | 15 |
| 5 | src/lib/orchestration/kai-orchestrator.ts | 13 |
| 5 | src/lib/prediction/runPredictionPipeline.ts | 13 |
| 7 | src/lib/services/viral-prediction/unified-prediction-engine.ts | 11 |
| 8 | src/lib/calibration/calibration.ts | 9 |
| 9 | src/lib/training/feature-availability-matrix.ts | 8 |
| 9 | src/lib/training/training-ingest-types.ts | 8 |
| 9 | src/lib/services/viral-prediction/main-prediction-engine.ts | 8 |

---

## Read-only observations (things that surprised me)

1. **`viral-prediction/` is not entirely "legacy"**. `unified-prediction-engine.ts` (1020 lines) has 11 callers and `main-prediction-engine.ts` (758 lines) has 8 callers — including production-shaped routes like `/api/admin/viral-prediction/{daily-recipe-book, real-time-analysis, accuracy-validation}`, `/api/admin/integration/status`, `/api/admin/prediction/unified-predict`, and `/api/admin/viral-prediction-hub`. Whatever the long-term plan is for this directory, it's still wired into multiple admin surfaces today.
2. **`kai-orchestrator.ts` is 4984 lines in a single file** — the largest TypeScript file in the predictor surface by a wide margin (next: trainer-engine.ts at 1414, feature-extractor.ts at 1314, unified-prediction-engine.ts at 1020).
3. **XGBoost model versions on disk: v6, v7, v8, v9, v10, v15** in `models/`, plus sandbox versions **v11, v12, v13, v14a, v14b, v14c, v14d, v14-clean** in `data/sandbox/`, plus fixture versions **v1–v17 (no v7)** in `fixtures/learning/`. v15 is the latest in production `models/`.
4. **`v6` code path is still live**, gated on env var `MODEL_VERSION=xgb_v6` in `xgboost-virality-service.ts`. Memory note in CLAUDE.md says "v6 disabled" — that may have meant disabled-by-default (env not set), not removed.
5. **`src/lib/autoresearch/` does not exist**, but autoresearch lives at `src/lib/training/autoresearch/` (TS + Python + shell + README) and there is also a top-level `results-autoresearch/` directory at the repo root. The README inside `training/autoresearch/` may be useful context, though not read for this inventory.
6. **`src/lib/scoring/` does not exist**. References to "scoring" in the API surface route through `lib/services/scoring-service` and `lib/calibration/score-calibrator`, not a dedicated `scoring/` lib.
7. **Two parallel "dps" code paths**: `src/lib/training/dps-v2.ts` (906 lines, 19 importers — clearly the active path) and `src/lib/services/viral-prediction/dps-baselines.ts` (34 lines, 3 importers — appears narrow but still wired into `/api/admin/integration/status` and `/api/admin/prediction/baselines/recompute`).
8. **`creator-context.ts` is the second-highest-imported prediction file** (17 callers) despite being only 180 lines — confirms its role as a widely-shared lightweight type/loader for the personalization path.
9. **Two "VPS pipeline" entry points**: `runPredictionPipeline.ts` (871 lines, 13 importers — used by `/api/predict`, `/api/admin/predict`, `/api/creator/predict`, `/api/quick-win/*`, `/api/viral-prediction/analyze`, etc.) and `run-vps-pipeline-v2.ts` (84 lines, 3 importers — used by `/api/kai/predict`, `/api/predict/v2`, `/api/bulk-download/predict`). Both are alive and called by different routes.
10. **The training dir holds 9 Python scripts** (retrain_s6/s7, validate_s7, smoke_*, generate_v15_artifacts, investigate_sound_type) plus its own `autoresearch/` subdir with more Python + shell scripts. This is a real, working Python training pipeline living inside the Next.js src tree.
11. **`src/lib/calibration/index.ts`** (46 lines, 15 importers) is the most-imported file in the calibration dir — it's a barrel re-export. Most consumers use the barrel rather than reaching into specific files.
12. **8 of 25 `viral-prediction/` files have 0 importers** (hook-detector, comprehensive-framework-library, cultural-timing-intelligence, engagement-velocity-tracker, god-mode-psychological-analyzer, incubation-classifier, production-quality-analyzer, studio-integration, test-unified-engine). They are not classified as dead per the strict criteria (no dead-marker in filename), but they appear to be unreferenced from anywhere in `src/`, `scripts/`, `tests/`, `supabase/`, or `config/` as of this inventory.

— end of inventory —
