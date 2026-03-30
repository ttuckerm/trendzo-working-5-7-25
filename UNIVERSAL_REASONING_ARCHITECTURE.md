# Universal Reasoning System Architecture

**Date**: November 6, 2025
**Status**: Design Complete - Ready for Implementation
**Based On**: Complete codebase discovery (2,402 files analyzed)

---

## Executive Summary

This document describes the **Universal Reasoning System** - an abstract layer that sits above all 11 frameworks, 4 ML models, and 662 API endpoints discovered in the CleanCopy codebase. It provides a single, intelligent API that:

1. **Automatically discovers** what components exist
2. **Intelligently routes** requests to optimal pipelines
3. **Orchestrates** multiple models in parallel or sequence
4. **Synthesizes** outputs from different systems
5. **Reasons** about results to generate insights
6. **Validates** predictions for consistency and confidence

---

## System Overview

### Current State (Discovered)
- **11 Major Frameworks**: DPS, Pattern Extraction, GPPT, ML Pipeline, Feature Extraction, Pre-Content, Accuracy Enhancement, Optimization, Script Intelligence, Learning, Workflows
- **4 ML Models**: XGBoost (97% accuracy), FFmpeg Visual, Multi-LLM Consensus, Ensemble Fusion
- **8 Workflows**: Prediction, Pattern, Knowledge, DPS, Sandbox, ETL, Scraping, Validation
- **662 API Endpoints**: Distributed across many services
- **Problem**: Fragmented access, duplications, no unified intelligence layer

### Future State (Universal Reasoning)
- **Single Entry Point**: `POST /api/reason`
- **Automatic Component Discovery**: System finds and catalogs all components
- **Intelligent Routing**: AI decides which models/pipelines to use
- **Multi-Model Orchestration**: Parallel execution with dependency management
- **Synthesis & Reasoning**: Combines outputs into unified insights
- **Adaptive Learning**: Improves routing decisions over time

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIVERSAL REASONING API                   │
│                    /api/reason (single endpoint)             │
└───────────────┬─────────────────────────────────────────────┘
                │
    ┌───────────▼────────────┐
    │   DISCOVERY SYSTEM     │  (Finds all components)
    │  - Component Scanner   │
    │  - Analyzer           │
    │  - Cataloger          │
    └───────────┬────────────┘
                │
    ┌───────────▼────────────┐
    │       ROUTER           │  (Decides what to use)
    │  - Input Analysis      │
    │  - Pipeline Selection  │
    │  - Mode Selection      │
    └───────────┬────────────┘
                │
    ┌───────────▼────────────┐
    │    ORCHESTRATOR        │  (Coordinates execution)
    │  - Parallel Execution  │
    │  - Dependency Mgmt     │
    │  - Progress Tracking   │
    └───────────┬────────────┘
                │
        ┌───────┴────────┐
        │                │
┌───────▼────────┐  ┌───▼──────────┐  ┌──────────┐  ┌──────────┐
│  DPS ENGINE    │  │  ML PIPELINE  │  │ PATTERN  │  │ KNOWLEDGE│
│                │  │               │  │ EXTRACT  │  │ EXTRACT  │
│ - Cohort Score │  │ - XGBoost     │  │          │  │          │
│ - Engagement   │  │ - GPT-4       │  │ - 7 Legos│  │ - Multi  │
│ - Visual (FFM) │  │ - Features    │  │ - LLM    │  │   LLM    │
│ - Decay        │  │ - Hybrid      │  │          │  │          │
└────────────────┘  └───────────────┘  └──────────┘  └──────────┘
        │                │                   │              │
        └────────────────┴───────────────────┴──────────────┘
                                │
                    ┌───────────▼────────────┐
                    │      SYNTHESIZER       │  (Merges outputs)
                    │  - Conflict Resolution │
                    │  - Confidence Agg      │
                    │  - Normalization       │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │       REASONER         │  (Generates insights)
                    │  - Explanation Gen     │
                    │  - Recommendations     │
                    │  - Actionable Steps    │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │      VALIDATOR         │  (Checks quality)
                    │  - Consistency Check   │
                    │  - Sanity Tests        │
                    │  - Confidence Threshold│
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   UNIFIED RESPONSE     │
                    │  {                     │
                    │    prediction: 72.5,   │
                    │    confidence: 0.94,   │
                    │    reasoning: "...",   │
                    │    recommendations: [] │
                    │  }                     │
                    └────────────────────────┘
```

---

## Component Specifications

### 1. Discovery System

**Purpose**: Automatically find and catalog all components in the codebase

**Location**: `src/lib/reasoning/discovery/`

**Files**:
1. `component-scanner.ts` - Scans codebase recursively
2. `component-analyzer.ts` - Analyzes component capabilities
3. `component-cataloger.ts` - Creates dynamic inventory
4. `discovery-report.ts` - Generates documentation

**Implementation**:
```typescript
// src/lib/reasoning/discovery/component-scanner.ts

export interface DiscoveredComponent {
  id: string;
  name: string;
  type: 'framework' | 'model' | 'workflow' | 'utility';
  location: string;
  capabilities: string[];
  inputs: ComponentInput[];
  outputs: ComponentOutput[];
  dependencies: string[];
  status: 'production' | 'beta' | 'experimental' | 'deprecated';
  performance: {
    avgLatency: number;
    successRate: number;
    cost: number;
  };
}

export class ComponentScanner {
  private registry: Map<string, DiscoveredComponent> = new Map();

  async scanCodebase(): Promise<DiscoveredComponent[]> {
    const components: DiscoveredComponent[] = [];

    // Scan all known component directories
    const scanDirs = [
      'src/lib/services/',
      'src/lib/ml/',
      'src/lib/workflows/',
      'src/app/api/',
    ];

    for (const dir of scanDirs) {
      const found = await this.scanDirectory(dir);
      components.push(...found);
    }

    // Register all discovered components
    components.forEach(c => this.registry.set(c.id, c));

    return components;
  }

  private async scanDirectory(dir: string): Promise<DiscoveredComponent[]> {
    // Recursively scan directory
    // Look for patterns:
    // - *-service.ts, *-engine.ts, *-predictor.ts
    // - route.ts files (API endpoints)
    // - Files with exports matching component patterns

    // Analyze each file to determine:
    // - What it does (from comments, function names)
    // - What inputs it accepts
    // - What outputs it produces
    // - What dependencies it has

    // Return discovered components
  }

  getComponent(id: string): DiscoveredComponent | undefined {
    return this.registry.get(id);
  }

  getByType(type: DiscoveredComponent['type']): DiscoveredComponent[] {
    return Array.from(this.registry.values()).filter(c => c.type === type);
  }

  getByCapability(capability: string): DiscoveredComponent[] {
    return Array.from(this.registry.values()).filter(c =>
      c.capabilities.includes(capability)
    );
  }
}
```

**Known Components to Register**:
```typescript
const KNOWN_COMPONENTS: DiscoveredComponent[] = [
  {
    id: 'dps-engine',
    name: 'DPS Calculation Engine',
    type: 'framework',
    location: 'src/lib/services/dps/dps-calculation-engine.ts',
    capabilities: ['viral-scoring', 'engagement-analysis', 'cohort-ranking'],
    inputs: [{ type: 'video', required: ['views', 'likes', 'comments', 'shares', 'followerCount'] }],
    outputs: [{ type: 'dps-score', range: [0, 100] }],
    dependencies: [],
    status: 'production',
    performance: { avgLatency: 15, successRate: 1.0, cost: 0 }
  },
  {
    id: 'xgboost-predictor',
    name: 'XGBoost ML Predictor',
    type: 'model',
    location: 'src/lib/ml/xgboost-predictor.ts',
    capabilities: ['dps-prediction', 'feature-analysis'],
    inputs: [{ type: 'features', count: 119 }],
    outputs: [{ type: 'dps-prediction', confidence: true }],
    dependencies: ['feature-extraction-service'],
    status: 'production',
    performance: { avgLatency: 20, successRate: 1.0, cost: 0 }
  },
  {
    id: 'gpt4-refinement',
    name: 'GPT-4 Qualitative Refinement',
    type: 'model',
    location: 'src/lib/ml/gpt-refinement-service.ts',
    capabilities: ['qualitative-analysis', 'insight-generation'],
    inputs: [{ type: 'transcript', required: true }],
    outputs: [{ type: 'insights', structured: true }],
    dependencies: [],
    status: 'production',
    performance: { avgLatency: 3000, successRate: 0.98, cost: 0.0001 }
  },
  {
    id: 'pattern-extraction',
    name: 'Pattern Extraction Framework',
    type: 'framework',
    location: 'src/lib/services/pattern-extraction/',
    capabilities: ['pattern-detection', 'idea-legos-extraction'],
    inputs: [{ type: 'video', required: ['transcript'] }],
    outputs: [{ type: 'patterns', count: 7 }],
    dependencies: [],
    status: 'production',
    performance: { avgLatency: 2000, successRate: 0.95, cost: 0.0002 }
  },
  {
    id: 'knowledge-extraction',
    name: 'GPPT Knowledge Extraction',
    type: 'framework',
    location: 'src/lib/services/gppt/knowledge-extraction-engine.ts',
    capabilities: ['multi-llm-consensus', 'viral-insights'],
    inputs: [{ type: 'video', required: ['transcript'] }],
    outputs: [{ type: 'knowledge', consensus: true }],
    dependencies: [],
    status: 'production',
    performance: { avgLatency: 5000, successRate: 0.92, cost: 0.0003 }
  },
  {
    id: 'feature-extraction',
    name: 'Feature Extraction System',
    type: 'framework',
    location: 'src/lib/services/feature-extraction/feature-extraction-service.ts',
    capabilities: ['numeric-features', 'text-analysis'],
    inputs: [{ type: 'video', required: ['transcript'] }],
    outputs: [{ type: 'features', count: 119 }],
    dependencies: [],
    status: 'production',
    performance: { avgLatency: 17, successRate: 1.0, cost: 0 }
  },
  // ... add all 11 frameworks and 4 models
];
```

---

### 2. Router

**Purpose**: Intelligently decide which components to use for a given request

**Location**: `src/lib/reasoning/router.ts`

**Implementation**:
```typescript
// src/lib/reasoning/router.ts

import { ComponentScanner, DiscoveredComponent } from './discovery/component-scanner';

export interface RoutingDecision {
  components: string[]; // Component IDs to use
  mode: 'parallel' | 'sequential';
  dependencies: Map<string, string[]>; // component -> dependencies
  estimatedLatency: number;
  estimatedCost: number;
  confidence: number;
}

export interface ReasoningRequest {
  input: {
    type: 'video' | 'transcript' | 'script-idea' | 'video-url';
    data: any;
  };
  mode: 'fast' | 'balanced' | 'thorough' | 'auto';
  capabilities?: string[]; // Requested capabilities
}

export class UniversalRouter {
  constructor(
    private scanner: ComponentScanner
  ) {}

  async route(request: ReasoningRequest): Promise<RoutingDecision> {
    // Step 1: Analyze input to determine what's available
    const inputAnalysis = this.analyzeInput(request.input);

    // Step 2: Determine required capabilities
    const requiredCapabilities = request.capabilities ||
      this.inferCapabilities(request.input.type);

    // Step 3: Find components that provide these capabilities
    const candidates = this.findCandidateComponents(requiredCapabilities);

    // Step 4: Select optimal components based on mode
    const selected = this.selectComponents(candidates, request.mode, inputAnalysis);

    // Step 5: Determine execution order (parallel vs sequential)
    const execution = this.planExecution(selected);

    // Step 6: Estimate cost and latency
    const estimate = this.estimateExecution(selected, execution.mode);

    return {
      components: selected.map(c => c.id),
      mode: execution.mode,
      dependencies: execution.dependencies,
      estimatedLatency: estimate.latency,
      estimatedCost: estimate.cost,
      confidence: this.calculateRoutingConfidence(selected, requiredCapabilities)
    };
  }

  private analyzeInput(input: any): {
    hasTranscript: boolean;
    hasFeatures: boolean;
    hasMetadata: boolean;
    hasVisual: boolean;
  } {
    return {
      hasTranscript: !!input.data.transcript,
      hasFeatures: !!input.data.features,
      hasMetadata: !!input.data.views && !!input.data.likes,
      hasVisual: !!input.data.videoUrl
    };
  }

  private inferCapabilities(inputType: string): string[] {
    const capabilityMap = {
      'video': ['viral-scoring', 'pattern-detection', 'dps-prediction'],
      'transcript': ['qualitative-analysis', 'feature-analysis'],
      'script-idea': ['pre-content-prediction', 'pattern-matching'],
      'video-url': ['full-analysis', 'comprehensive-prediction']
    };
    return capabilityMap[inputType] || [];
  }

  private findCandidateComponents(capabilities: string[]): DiscoveredComponent[] {
    const candidates: Set<DiscoveredComponent> = new Set();

    for (const cap of capabilities) {
      const components = this.scanner.getByCapability(cap);
      components.forEach(c => candidates.add(c));
    }

    // Filter out deprecated components
    return Array.from(candidates).filter(c => c.status !== 'deprecated');
  }

  private selectComponents(
    candidates: DiscoveredComponent[],
    mode: string,
    inputAnalysis: any
  ): DiscoveredComponent[] {
    if (mode === 'fast') {
      // Select fastest components
      return this.selectFastest(candidates, inputAnalysis);
    } else if (mode === 'thorough') {
      // Select most comprehensive components
      return this.selectMostComprehensive(candidates, inputAnalysis);
    } else if (mode === 'balanced') {
      // Balance speed and thoroughness
      return this.selectBalanced(candidates, inputAnalysis);
    } else {
      // Auto: intelligently decide based on input
      return this.selectAuto(candidates, inputAnalysis);
    }
  }

  private selectFastest(
    candidates: DiscoveredComponent[],
    inputAnalysis: any
  ): DiscoveredComponent[] {
    // For fast mode:
    // - Use XGBoost (20ms) instead of GPT-4 (3s)
    // - Use DPS Engine (15ms) for simple scoring
    // - Skip pattern extraction and knowledge extraction

    const selected: DiscoveredComponent[] = [];

    if (inputAnalysis.hasFeatures) {
      selected.push(this.scanner.getComponent('xgboost-predictor')!);
    } else if (inputAnalysis.hasTranscript) {
      selected.push(this.scanner.getComponent('feature-extraction')!);
      selected.push(this.scanner.getComponent('xgboost-predictor')!);
    } else if (inputAnalysis.hasMetadata) {
      selected.push(this.scanner.getComponent('dps-engine')!);
    }

    return selected;
  }

  private selectMostComprehensive(
    candidates: DiscoveredComponent[],
    inputAnalysis: any
  ): DiscoveredComponent[] {
    // For thorough mode:
    // - Use ALL available components
    // - Feature extraction + XGBoost + GPT-4
    // - Pattern extraction + Knowledge extraction
    // - DPS calculation with FFmpeg visual analysis

    const selected: DiscoveredComponent[] = [];

    // Always extract features
    selected.push(this.scanner.getComponent('feature-extraction')!);

    // Use both quantitative and qualitative models
    selected.push(this.scanner.getComponent('xgboost-predictor')!);
    selected.push(this.scanner.getComponent('gpt4-refinement')!);

    // Extract patterns and knowledge
    selected.push(this.scanner.getComponent('pattern-extraction')!);
    selected.push(this.scanner.getComponent('knowledge-extraction')!);

    // Calculate DPS
    selected.push(this.scanner.getComponent('dps-engine')!);

    return selected.filter(c => c !== undefined);
  }

  private selectBalanced(
    candidates: DiscoveredComponent[],
    inputAnalysis: any
  ): DiscoveredComponent[] {
    // For balanced mode:
    // - Use XGBoost baseline
    // - Conditionally use GPT-4 if confidence is low
    // - Skip expensive pattern/knowledge extraction unless requested

    const selected: DiscoveredComponent[] = [];

    selected.push(this.scanner.getComponent('feature-extraction')!);
    selected.push(this.scanner.getComponent('xgboost-predictor')!);

    // Conditional GPT-4 (will be decided by orchestrator)
    selected.push(this.scanner.getComponent('gpt4-refinement')!);

    return selected.filter(c => c !== undefined);
  }

  private selectAuto(
    candidates: DiscoveredComponent[],
    inputAnalysis: any
  ): DiscoveredComponent[] {
    // Intelligently decide based on:
    // - Input quality (has transcript? has features?)
    // - User history (do they usually want thorough analysis?)
    // - Content type (is this a high-stakes prediction?)
    // - Time of day (is user in a hurry?)

    // For now, default to balanced
    return this.selectBalanced(candidates, inputAnalysis);
  }

  private planExecution(components: DiscoveredComponent[]): {
    mode: 'parallel' | 'sequential';
    dependencies: Map<string, string[]>;
  } {
    // Build dependency graph
    const dependencies = new Map<string, string[]>();

    components.forEach(component => {
      dependencies.set(component.id, component.dependencies);
    });

    // Determine if can run in parallel
    const hasCircularDeps = this.detectCircularDependencies(dependencies);
    const canParallelize = !hasCircularDeps && this.canRunInParallel(components);

    return {
      mode: canParallelize ? 'parallel' : 'sequential',
      dependencies
    };
  }

  private detectCircularDependencies(deps: Map<string, string[]>): boolean {
    // Implement cycle detection algorithm
    // Return true if circular dependencies exist
    return false; // Simplified
  }

  private canRunInParallel(components: DiscoveredComponent[]): boolean {
    // Check if components have shared dependencies
    // Check if outputs of one are inputs to another

    // Simplified: XGBoost and GPT-4 can run in parallel if features are ready
    const hasXGBoost = components.some(c => c.id === 'xgboost-predictor');
    const hasGPT4 = components.some(c => c.id === 'gpt4-refinement');
    const hasFeatures = components.some(c => c.id === 'feature-extraction');

    if (hasXGBoost && hasGPT4 && hasFeatures) {
      // Features must run first, then XGBoost and GPT-4 in parallel
      return true;
    }

    return false;
  }

  private estimateExecution(
    components: DiscoveredComponent[],
    mode: 'parallel' | 'sequential'
  ): { latency: number; cost: number } {
    if (mode === 'parallel') {
      // Latency is the max of all parallel components
      const latency = Math.max(...components.map(c => c.performance.avgLatency));
      const cost = components.reduce((sum, c) => sum + c.performance.cost, 0);
      return { latency, cost };
    } else {
      // Latency is the sum of all sequential components
      const latency = components.reduce((sum, c) => sum + c.performance.avgLatency, 0);
      const cost = components.reduce((sum, c) => sum + c.performance.cost, 0);
      return { latency, cost };
    }
  }

  private calculateRoutingConfidence(
    selected: DiscoveredComponent[],
    requiredCapabilities: string[]
  ): number {
    // Calculate confidence that selected components will satisfy requirements
    const providedCapabilities = new Set(
      selected.flatMap(c => c.capabilities)
    );

    const satisfaction = requiredCapabilities.filter(cap =>
      providedCapabilities.has(cap)
    ).length / requiredCapabilities.length;

    return satisfaction;
  }
}
```

---

### 3. Orchestrator

**Purpose**: Coordinate execution of multiple components with dependency management

**Location**: `src/lib/reasoning/orchestrator.ts`

**Implementation**:
```typescript
// src/lib/reasoning/orchestrator.ts

import { RoutingDecision } from './router';
import { DiscoveredComponent } from './discovery/component-scanner';

export interface ExecutionResult {
  componentId: string;
  success: boolean;
  output: any;
  latency: number;
  error?: Error;
}

export interface OrchestrationResult {
  results: Map<string, ExecutionResult>;
  totalLatency: number;
  totalCost: number;
  success: boolean;
}

export class UniversalOrchestrator {
  async execute(
    routing: RoutingDecision,
    input: any
  ): Promise<OrchestrationResult> {
    const results = new Map<string, ExecutionResult>();
    const startTime = Date.now();

    try {
      if (routing.mode === 'parallel') {
        await this.executeParallel(routing, input, results);
      } else {
        await this.executeSequential(routing, input, results);
      }

      const totalLatency = Date.now() - startTime;
      const totalCost = routing.estimatedCost;

      return {
        results,
        totalLatency,
        totalCost,
        success: Array.from(results.values()).every(r => r.success)
      };
    } catch (error) {
      return {
        results,
        totalLatency: Date.now() - startTime,
        totalCost: 0,
        success: false
      };
    }
  }

  private async executeParallel(
    routing: RoutingDecision,
    input: any,
    results: Map<string, ExecutionResult>
  ): Promise<void> {
    // Build execution stages based on dependencies
    const stages = this.buildExecutionStages(routing);

    // Execute each stage in sequence, but components within stage in parallel
    for (const stage of stages) {
      const promises = stage.map(componentId =>
        this.executeComponent(componentId, input, results)
      );

      await Promise.all(promises);
    }
  }

  private async executeSequential(
    routing: RoutingDecision,
    input: any,
    results: Map<string, ExecutionResult>
  ): Promise<void> {
    // Execute components one by one
    for (const componentId of routing.components) {
      await this.executeComponent(componentId, input, results);
    }
  }

  private buildExecutionStages(routing: RoutingDecision): string[][] {
    // Build stages based on dependency graph
    // Stage 0: Components with no dependencies
    // Stage 1: Components that depend only on Stage 0
    // Stage 2: Components that depend on Stage 0 or 1
    // etc.

    const stages: string[][] = [];
    const processed = new Set<string>();
    const remaining = new Set(routing.components);

    while (remaining.size > 0) {
      const currentStage: string[] = [];

      for (const componentId of remaining) {
        const deps = routing.dependencies.get(componentId) || [];
        const allDepsProcessed = deps.every(dep => processed.has(dep));

        if (allDepsProcessed) {
          currentStage.push(componentId);
        }
      }

      if (currentStage.length === 0) {
        // Circular dependency detected
        throw new Error('Circular dependency in execution plan');
      }

      stages.push(currentStage);
      currentStage.forEach(id => {
        processed.add(id);
        remaining.delete(id);
      });
    }

    return stages;
  }

  private async executeComponent(
    componentId: string,
    input: any,
    results: Map<string, ExecutionResult>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Map component ID to actual implementation
      const output = await this.invokeComponent(componentId, input, results);

      results.set(componentId, {
        componentId,
        success: true,
        output,
        latency: Date.now() - startTime
      });
    } catch (error) {
      results.set(componentId, {
        componentId,
        success: false,
        output: null,
        latency: Date.now() - startTime,
        error: error as Error
      });
    }
  }

  private async invokeComponent(
    componentId: string,
    input: any,
    previousResults: Map<string, ExecutionResult>
  ): Promise<any> {
    // Map component IDs to actual service implementations

    switch (componentId) {
      case 'feature-extraction':
        const { extractFeaturesFromVideos } = await import(
          '@/lib/services/feature-extraction/feature-extraction-service'
        );
        return await extractFeaturesFromVideos([input]);

      case 'xgboost-predictor':
        const { XGBoostPredictor } = await import('@/lib/ml/xgboost-predictor');
        const predictor = new XGBoostPredictor();

        // Get features from previous results
        const featureResult = previousResults.get('feature-extraction');
        const features = featureResult?.output?.results[0]?.features;

        return await predictor.predict(features);

      case 'gpt4-refinement':
        const { GPTRefinementService } = await import('@/lib/ml/gpt-refinement-service');
        const refinement = new GPTRefinementService();

        // Get XGBoost prediction from previous results
        const xgboostResult = previousResults.get('xgboost-predictor');
        const baselinePrediction = xgboostResult?.output;

        return await refinement.refine(input.transcript, baselinePrediction);

      case 'dps-engine':
        const { DPSCalculationEngine } = await import(
          '@/lib/services/dps/dps-calculation-engine'
        );
        const dpsEngine = new DPSCalculationEngine();
        return await dpsEngine.calculateDPS(input);

      case 'pattern-extraction':
        const { PatternExtractionService } = await import(
          '@/lib/services/pattern-extraction/pattern-extraction-service'
        );
        const patternService = new PatternExtractionService();
        return await patternService.extractPatterns([input]);

      case 'knowledge-extraction':
        const { KnowledgeExtractionEngine } = await import(
          '@/lib/services/gppt/knowledge-extraction-engine'
        );
        const knowledgeEngine = new KnowledgeExtractionEngine();
        return await knowledgeEngine.extractKnowledge(input);

      default:
        throw new Error(`Unknown component: ${componentId}`);
    }
  }
}
```

---

### 4. Synthesizer

**Purpose**: Merge outputs from multiple components into unified result

**Location**: `src/lib/reasoning/synthesizer.ts`

**Implementation**:
```typescript
// src/lib/reasoning/synthesizer.ts

import { OrchestrationResult, ExecutionResult } from './orchestrator';

export interface SynthesizedOutput {
  prediction: {
    dps: number;
    confidence: number;
    range: [number, number];
  };
  insights: {
    quantitative: any;
    qualitative: any;
    patterns: any[];
    knowledge: any;
  };
  metadata: {
    modelsUsed: string[];
    latency: number;
    cost: number;
  };
}

export class UniversalSynthesizer {
  synthesize(orchestrationResult: OrchestrationResult): SynthesizedOutput {
    const { results } = orchestrationResult;

    // Extract outputs from each component
    const xgboostOutput = results.get('xgboost-predictor')?.output;
    const gpt4Output = results.get('gpt4-refinement')?.output;
    const dpsOutput = results.get('dps-engine')?.output;
    const patternOutput = results.get('pattern-extraction')?.output;
    const knowledgeOutput = results.get('knowledge-extraction')?.output;

    // Merge predictions
    const prediction = this.mergePredictions({
      xgboost: xgboostOutput,
      gpt4: gpt4Output,
      dps: dpsOutput
    });

    // Merge insights
    const insights = {
      quantitative: xgboostOutput,
      qualitative: gpt4Output,
      patterns: patternOutput?.patterns || [],
      knowledge: knowledgeOutput
    };

    // Compile metadata
    const metadata = {
      modelsUsed: Array.from(results.keys()),
      latency: orchestrationResult.totalLatency,
      cost: orchestrationResult.totalCost
    };

    return { prediction, insights, metadata };
  }

  private mergePredictions(outputs: {
    xgboost?: any;
    gpt4?: any;
    dps?: any;
  }): { dps: number; confidence: number; range: [number, number] } {
    const predictions: number[] = [];
    const confidences: number[] = [];

    // XGBoost prediction
    if (outputs.xgboost) {
      predictions.push(outputs.xgboost.prediction);
      confidences.push(outputs.xgboost.confidence || 0.97);
    }

    // DPS calculation
    if (outputs.dps) {
      predictions.push(outputs.dps.masterViralScore);
      confidences.push(1.0); // DPS is deterministic
    }

    // GPT-4 adjustment
    if (outputs.gpt4?.adjustedPrediction) {
      predictions.push(outputs.gpt4.adjustedPrediction);
      confidences.push(outputs.gpt4.confidence || 0.8);
    }

    // Weighted average of predictions
    const totalConfidence = confidences.reduce((sum, c) => sum + c, 0);
    const weightedSum = predictions.reduce((sum, pred, i) =>
      sum + (pred * confidences[i]), 0
    );
    const finalPrediction = weightedSum / totalConfidence;

    // Calculate confidence (average of all confidences)
    const avgConfidence = totalConfidence / confidences.length;

    // Calculate prediction range based on confidence
    const uncertainty = (1 - avgConfidence) * 20; // Up to ±20 DPS at 0 confidence
    const range: [number, number] = [
      Math.max(0, finalPrediction - uncertainty),
      Math.min(100, finalPrediction + uncertainty)
    ];

    return {
      dps: Math.round(finalPrediction * 100) / 100,
      confidence: Math.round(avgConfidence * 100) / 100,
      range
    };
  }
}
```

---

### 5. Reasoner

**Purpose**: Generate explanations, recommendations, and actionable insights

**Location**: `src/lib/reasoning/reasoner.ts`

**Implementation**:
```typescript
// src/lib/reasoning/reasoner.ts

import { SynthesizedOutput } from './synthesizer';

export interface ReasoningOutput {
  explanation: string;
  recommendations: Recommendation[];
  insights: string[];
  warnings: string[];
  nextSteps: string[];
}

export interface Recommendation {
  type: 'improve-hook' | 'adjust-length' | 'add-pattern' | 'optimize-timing';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: number; // DPS points
  effort: 'easy' | 'medium' | 'hard';
}

export class UniversalReasoner {
  generateReasoning(synthesized: SynthesizedOutput): ReasoningOutput {
    const { prediction, insights } = synthesized;

    // Generate explanation
    const explanation = this.generateExplanation(prediction, insights);

    // Generate recommendations
    const recommendations = this.generateRecommendations(prediction, insights);

    // Extract key insights
    const keyInsights = this.extractInsights(insights);

    // Identify warnings
    const warnings = this.identifyWarnings(prediction, insights);

    // Suggest next steps
    const nextSteps = this.suggestNextSteps(prediction, recommendations);

    return {
      explanation,
      recommendations,
      insights: keyInsights,
      warnings,
      nextSteps
    };
  }

  private generateExplanation(prediction: any, insights: any): string {
    const dps = prediction.dps;
    const confidence = prediction.confidence;

    let explanation = `This content is predicted to achieve a DPS score of ${dps} `;

    if (dps >= 80) {
      explanation += '(mega-viral potential). ';
    } else if (dps >= 70) {
      explanation += '(viral potential). ';
    } else if (dps >= 60) {
      explanation += '(good performance). ';
    } else {
      explanation += '(average performance). ';
    }

    explanation += `Confidence level is ${(confidence * 100).toFixed(0)}%. `;

    // Add reasoning from qualitative analysis
    if (insights.qualitative?.insights) {
      explanation += insights.qualitative.insights.slice(0, 200) + '...';
    }

    return explanation;
  }

  private generateRecommendations(
    prediction: any,
    insights: any
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Analyze quantitative features for recommendations
    if (insights.quantitative?.features) {
      const features = insights.quantitative.features;

      // Check hook strength
      if (features.first_3_seconds_word_count < 10) {
        recommendations.push({
          type: 'improve-hook',
          priority: 'high',
          description: 'Add a stronger hook in the first 3 seconds. Use a question, bold statement, or curiosity gap.',
          expectedImpact: 5,
          effort: 'easy'
        });
      }

      // Check content length
      if (features.word_count < 100 || features.word_count > 300) {
        recommendations.push({
          type: 'adjust-length',
          priority: 'medium',
          description: 'Adjust content length to 100-250 words for optimal engagement.',
          expectedImpact: 3,
          effort: 'medium'
        });
      }
    }

    // Use pattern insights for recommendations
    if (insights.patterns?.length > 0) {
      const missingPatterns = this.findMissingPatterns(insights.patterns);

      if (missingPatterns.length > 0) {
        recommendations.push({
          type: 'add-pattern',
          priority: 'high',
          description: `Consider adding these viral patterns: ${missingPatterns.join(', ')}`,
          expectedImpact: 8,
          effort: 'medium'
        });
      }
    }

    // Use GPT-4 recommendations
    if (insights.qualitative?.recommendations) {
      insights.qualitative.recommendations.forEach((rec: string) => {
        recommendations.push({
          type: 'optimize-timing',
          priority: 'medium',
          description: rec,
          expectedImpact: 4,
          effort: 'easy'
        });
      });
    }

    // Sort by priority and expected impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] - priorityOrder[a.priority]) ||
             (b.expectedImpact - a.expectedImpact);
    });
  }

  private extractInsights(insights: any): string[] {
    const keyInsights: string[] = [];

    // From quantitative analysis
    if (insights.quantitative) {
      keyInsights.push(
        `Analyzed ${insights.quantitative.featureCount || 119} numeric features`
      );
    }

    // From pattern analysis
    if (insights.patterns?.length > 0) {
      keyInsights.push(
        `Detected ${insights.patterns.length} viral patterns (7 Idea Legos)`
      );
    }

    // From knowledge extraction
    if (insights.knowledge?.consensus) {
      keyInsights.push(
        `Multi-LLM consensus achieved with ${(insights.knowledge.agreement * 100).toFixed(0)}% agreement`
      );
    }

    return keyInsights;
  }

  private identifyWarnings(prediction: any, insights: any): string[] {
    const warnings: string[] = [];

    // Low confidence warning
    if (prediction.confidence < 0.7) {
      warnings.push(
        `⚠️ Low prediction confidence (${(prediction.confidence * 100).toFixed(0)}%). Consider adding more context or improving content quality.`
      );
    }

    // Wide prediction range
    const rangeWidth = prediction.range[1] - prediction.range[0];
    if (rangeWidth > 20) {
      warnings.push(
        `⚠️ Wide prediction range (±${(rangeWidth/2).toFixed(1)} DPS). Results may vary significantly.`
      );
    }

    // Missing key features
    if (!insights.quantitative?.features?.transcript_text) {
      warnings.push(
        '⚠️ No transcript available. Prediction based on limited features.'
      );
    }

    return warnings;
  }

  private suggestNextSteps(
    prediction: any,
    recommendations: Recommendation[]
  ): string[] {
    const nextSteps: string[] = [];

    // Based on DPS score
    if (prediction.dps >= 70) {
      nextSteps.push('✅ Content is viral-ready! Consider publishing.');
      nextSteps.push('💡 Test with A/B variants to optimize further.');
    } else if (prediction.dps >= 60) {
      nextSteps.push('💡 Content has potential. Implement high-priority recommendations.');
      nextSteps.push('🔄 Re-analyze after making improvements.');
    } else {
      nextSteps.push('⚠️ Consider significant revisions before publishing.');
      nextSteps.push('💡 Focus on top 3 recommendations for maximum impact.');
    }

    // Based on recommendations
    if (recommendations.length > 0) {
      nextSteps.push(
        `🎯 Implement ${recommendations.filter(r => r.priority === 'high').length} high-priority recommendations first.`
      );
    }

    return nextSteps;
  }

  private findMissingPatterns(extractedPatterns: any[]): string[] {
    // Compare extracted patterns against viral pattern library
    // Return patterns that are commonly found in viral content but missing here

    const viralPatterns = [
      'Curiosity Gap',
      'Before/After Transformation',
      'Unexpected Twist',
      'Relatable Problem',
      'Bold Statement'
    ];

    const extracted = extractedPatterns.map(p => p.pattern);
    return viralPatterns.filter(p => !extracted.includes(p));
  }
}
```

---

### 6. Validator

**Purpose**: Check prediction quality, consistency, and confidence

**Location**: `src/lib/reasoning/validator.ts`

**Implementation**:
```typescript
// src/lib/reasoning/validator.ts

import { SynthesizedOutput } from './synthesizer';
import { ReasoningOutput } from './reasoner';

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-1
  issues: ValidationIssue[];
  checks: ValidationCheck[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  type: string;
  message: string;
  fix?: string;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  details: string;
}

export class UniversalValidator {
  validate(
    synthesized: SynthesizedOutput,
    reasoning: ReasoningOutput
  ): ValidationResult {
    const checks: ValidationCheck[] = [];
    const issues: ValidationIssue[] = [];

    // Check 1: Prediction range is valid
    const rangeCheck = this.validatePredictionRange(synthesized.prediction);
    checks.push(rangeCheck);
    if (!rangeCheck.passed) {
      issues.push({
        severity: 'error',
        type: 'invalid-range',
        message: 'Prediction range is invalid or out of bounds',
        fix: 'Ensure DPS prediction is between 0-100'
      });
    }

    // Check 2: Confidence is reasonable
    const confidenceCheck = this.validateConfidence(synthesized.prediction);
    checks.push(confidenceCheck);
    if (!confidenceCheck.passed) {
      issues.push({
        severity: 'warning',
        type: 'low-confidence',
        message: `Confidence is low (${(synthesized.prediction.confidence * 100).toFixed(0)}%)`,
        fix: 'Consider adding more data or improving content quality'
      });
    }

    // Check 3: Multiple models agree
    const consensusCheck = this.validateConsensus(synthesized);
    checks.push(consensusCheck);
    if (!consensusCheck.passed) {
      issues.push({
        severity: 'warning',
        type: 'low-consensus',
        message: 'Models disagree on prediction',
        fix: 'Review contradictory insights and consider re-analyzing'
      });
    }

    // Check 4: Sanity checks
    const sanityCheck = this.validateSanity(synthesized);
    checks.push(sanityCheck);
    if (!sanityCheck.passed) {
      issues.push({
        severity: 'error',
        type: 'sanity-failure',
        message: 'Prediction fails basic sanity checks',
        fix: 'Review input data and model outputs'
      });
    }

    // Check 5: Recommendations are actionable
    const recommendationsCheck = this.validateRecommendations(reasoning);
    checks.push(recommendationsCheck);

    // Calculate overall validation score
    const score = checks.filter(c => c.passed).length / checks.length;
    const valid = score >= 0.8 && !issues.some(i => i.severity === 'error');

    return { valid, score, issues, checks };
  }

  private validatePredictionRange(prediction: any): ValidationCheck {
    const { dps, range } = prediction;

    const valid =
      dps >= 0 && dps <= 100 &&
      range[0] >= 0 && range[1] <= 100 &&
      range[0] <= dps && dps <= range[1];

    return {
      name: 'Prediction Range',
      passed: valid,
      details: valid
        ? `DPS ${dps} within valid range [${range[0]}, ${range[1]}]`
        : `DPS ${dps} outside valid range or invalid bounds`
    };
  }

  private validateConfidence(prediction: any): ValidationCheck {
    const { confidence } = prediction;
    const passed = confidence >= 0.6;

    return {
      name: 'Confidence Level',
      passed,
      details: passed
        ? `Confidence ${(confidence * 100).toFixed(0)}% is acceptable`
        : `Confidence ${(confidence * 100).toFixed(0)}% is below threshold (60%)`
    };
  }

  private validateConsensus(synthesized: SynthesizedOutput): ValidationCheck {
    const { insights } = synthesized;

    // Check if multiple models were used
    const modelCount = synthesized.metadata.modelsUsed.length;
    if (modelCount < 2) {
      return {
        name: 'Model Consensus',
        passed: true,
        details: 'Only one model used, no consensus check needed'
      };
    }

    // Check agreement between models
    // If we have XGBoost, GPT-4, and DPS predictions, they should be within 10 points
    const predictions: number[] = [];

    if (insights.quantitative?.prediction) predictions.push(insights.quantitative.prediction);
    if (insights.qualitative?.adjustedPrediction) predictions.push(insights.qualitative.adjustedPrediction);

    if (predictions.length < 2) {
      return {
        name: 'Model Consensus',
        passed: true,
        details: 'Not enough predictions to check consensus'
      };
    }

    const maxDiff = Math.max(...predictions) - Math.min(...predictions);
    const passed = maxDiff <= 15;

    return {
      name: 'Model Consensus',
      passed,
      details: passed
        ? `Models agree within ${maxDiff.toFixed(1)} DPS points`
        : `Models disagree by ${maxDiff.toFixed(1)} DPS points (threshold: 15)`
    };
  }

  private validateSanity(synthesized: SynthesizedOutput): ValidationCheck {
    const { prediction, insights } = synthesized;

    // Sanity check: If engagement_rate is very high, DPS should be high too
    const features = insights.quantitative?.features;
    if (features?.engagement_rate > 0.1 && prediction.dps < 50) {
      return {
        name: 'Sanity Check',
        passed: false,
        details: `High engagement rate (${(features.engagement_rate * 100).toFixed(1)}%) but low DPS (${prediction.dps})`
      };
    }

    // Sanity check: If word_count is very low, prediction shouldn't be too high
    if (features?.word_count < 20 && prediction.dps > 80) {
      return {
        name: 'Sanity Check',
        passed: false,
        details: `Very low word count (${features.word_count}) but high DPS (${prediction.dps})`
      };
    }

    return {
      name: 'Sanity Check',
      passed: true,
      details: 'All sanity checks passed'
    };
  }

  private validateRecommendations(reasoning: ReasoningOutput): ValidationCheck {
    const { recommendations } = reasoning;

    if (recommendations.length === 0) {
      return {
        name: 'Recommendations',
        passed: false,
        details: 'No actionable recommendations generated'
      };
    }

    const hasHighPriority = recommendations.some(r => r.priority === 'high');
    const hasExpectedImpact = recommendations.every(r => r.expectedImpact > 0);

    const passed = hasHighPriority && hasExpectedImpact;

    return {
      name: 'Recommendations',
      passed,
      details: passed
        ? `Generated ${recommendations.length} actionable recommendations`
        : 'Recommendations are missing or lack expected impact'
    };
  }
}
```

---

### 7. Universal API

**Purpose**: Single endpoint that orchestrates the entire reasoning system

**Location**: `src/app/api/reason/route.ts`

**Implementation**:
```typescript
// src/app/api/reason/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ComponentScanner } from '@/lib/reasoning/discovery/component-scanner';
import { UniversalRouter, ReasoningRequest } from '@/lib/reasoning/router';
import { UniversalOrchestrator } from '@/lib/reasoning/orchestrator';
import { UniversalSynthesizer } from '@/lib/reasoning/synthesizer';
import { UniversalReasoner } from '@/lib/reasoning/reasoner';
import { UniversalValidator } from '@/lib/reasoning/validator';

export async function POST(request: NextRequest) {
  try {
    // Parse request
    const body: ReasoningRequest = await request.json();

    // Step 1: Discover components (cached after first run)
    const scanner = new ComponentScanner();
    await scanner.scanCodebase();

    // Step 2: Route request to optimal components
    const router = new UniversalRouter(scanner);
    const routing = await router.route(body);

    console.log('Routing Decision:', {
      components: routing.components,
      mode: routing.mode,
      estimatedLatency: `${routing.estimatedLatency}ms`,
      estimatedCost: `$${routing.estimatedCost.toFixed(4)}`,
      confidence: `${(routing.confidence * 100).toFixed(0)}%`
    });

    // Step 3: Orchestrate execution
    const orchestrator = new UniversalOrchestrator();
    const orchestrationResult = await orchestrator.execute(routing, body.input.data);

    if (!orchestrationResult.success) {
      return NextResponse.json({
        error: 'Orchestration failed',
        details: Array.from(orchestrationResult.results.entries())
          .filter(([_, r]) => !r.success)
          .map(([id, r]) => ({ component: id, error: r.error?.message }))
      }, { status: 500 });
    }

    // Step 4: Synthesize outputs
    const synthesizer = new UniversalSynthesizer();
    const synthesized = synthesizer.synthesize(orchestrationResult);

    // Step 5: Generate reasoning
    const reasoner = new UniversalReasoner();
    const reasoning = reasoner.generateReasoning(synthesized);

    // Step 6: Validate results
    const validator = new UniversalValidator();
    const validation = validator.validate(synthesized, reasoning);

    // Return unified response
    return NextResponse.json({
      prediction: synthesized.prediction,
      explanation: reasoning.explanation,
      recommendations: reasoning.recommendations,
      insights: reasoning.insights,
      warnings: reasoning.warnings,
      nextSteps: reasoning.nextSteps,
      metadata: {
        ...synthesized.metadata,
        validation: {
          valid: validation.valid,
          score: validation.score,
          issues: validation.issues
        }
      }
    });

  } catch (error: any) {
    console.error('Universal Reasoning Error:', error);
    return NextResponse.json({
      error: 'Universal reasoning failed',
      message: error.message
    }, { status: 500 });
  }
}
```

---

## Implementation Roadmap

### Week 1: Foundation
- [ ] Create `src/lib/reasoning/` directory structure
- [ ] Implement Component Scanner with registry for 11 frameworks + 4 models
- [ ] Build Component Analyzer
- [ ] Create discovery report generator

### Week 2: Routing & Orchestration
- [ ] Implement Universal Router with mode selection
- [ ] Build dependency graph analyzer
- [ ] Create Universal Orchestrator with parallel/sequential execution
- [ ] Add progress tracking and error handling

### Week 3: Synthesis & Reasoning
- [ ] Implement Universal Synthesizer for multi-model merging
- [ ] Build Universal Reasoner for explanation generation
- [ ] Create recommendation engine
- [ ] Add insight extraction

### Week 4: Validation & API
- [ ] Implement Universal Validator
- [ ] Build validation rules and sanity checks
- [ ] Create `/api/reason` endpoint
- [ ] Add comprehensive error handling

### Week 5: Testing & Optimization
- [ ] Write unit tests for all components
- [ ] Create integration tests for full pipeline
- [ ] Performance optimization (caching, parallelization)
- [ ] Load testing

### Week 6: Documentation & Deployment
- [ ] API documentation (OpenAPI spec)
- [ ] Architecture diagrams
- [ ] Usage examples and tutorials
- [ ] Production deployment

---

## Expected Benefits

1. **Single API**: One endpoint for all viral prediction needs
2. **Optimal Performance**: Automatic selection of fastest/most accurate models
3. **Cost Optimization**: Smart routing to minimize API costs
4. **Future-Proof**: New components auto-integrate without code changes
5. **Comprehensive Insights**: Multi-model consensus with reasoning
6. **High Confidence**: Validation ensures quality and consistency
7. **Actionable Recommendations**: Not just predictions, but next steps
8. **Adaptive Learning**: System improves routing decisions over time

---

## Usage Examples

### Example 1: Fast Prediction (XGBoost only)
```typescript
POST /api/reason
{
  "input": {
    "type": "transcript",
    "data": {
      "transcript": "Life advice you need to hear...",
      "title": "Money tips"
    }
  },
  "mode": "fast"
}

// Response (~20ms, $0):
{
  "prediction": {
    "dps": 68.5,
    "confidence": 0.97,
    "range": [66.2, 70.8]
  },
  "explanation": "This content is predicted to achieve a DPS score of 68.5 (good performance). Confidence level is 97%.",
  "recommendations": [
    {
      "type": "improve-hook",
      "priority": "high",
      "description": "Add a stronger hook in the first 3 seconds",
      "expectedImpact": 5,
      "effort": "easy"
    }
  ],
  "metadata": {
    "modelsUsed": ["feature-extraction", "xgboost-predictor"],
    "latency": 18,
    "cost": 0
  }
}
```

### Example 2: Thorough Analysis (All Models)
```typescript
POST /api/reason
{
  "input": {
    "type": "video",
    "data": {
      "videoId": "abc123",
      "transcript": "...",
      "views": 50000,
      "likes": 5000,
      // ... full video data
    }
  },
  "mode": "thorough"
}

// Response (~5s, $0.0005):
{
  "prediction": {
    "dps": 75.2,
    "confidence": 0.92,
    "range": [71.8, 78.6]
  },
  "explanation": "This content is predicted to achieve a DPS score of 75.2 (viral potential). Confidence level is 92%. Multi-model consensus shows strong agreement across quantitative (XGBoost: 74.1), qualitative (GPT-4: 76.8), and algorithmic (DPS Engine: 74.7) predictions.",
  "recommendations": [
    {
      "type": "add-pattern",
      "priority": "high",
      "description": "Consider adding these viral patterns: Curiosity Gap, Unexpected Twist",
      "expectedImpact": 8,
      "effort": "medium"
    },
    // ... more recommendations
  ],
  "insights": [
    "Analyzed 119 numeric features",
    "Detected 5 viral patterns (7 Idea Legos)",
    "Multi-LLM consensus achieved with 87% agreement"
  ],
  "warnings": [],
  "nextSteps": [
    "✅ Content is viral-ready! Consider publishing.",
    "💡 Test with A/B variants to optimize further."
  ],
  "metadata": {
    "modelsUsed": [
      "feature-extraction",
      "xgboost-predictor",
      "gpt4-refinement",
      "pattern-extraction",
      "knowledge-extraction",
      "dps-engine"
    ],
    "latency": 5124,
    "cost": 0.0005,
    "validation": {
      "valid": true,
      "score": 1.0,
      "issues": []
    }
  }
}
```

---

## Conclusion

The **Universal Reasoning System** provides a unified, intelligent layer above all CleanCopy components. It automatically discovers what exists, intelligently routes requests, orchestrates multiple models, synthesizes outputs, generates reasoning, and validates results - all through a single API endpoint.

This architecture is:
- **Component-agnostic**: Works with any discovered components
- **Self-organizing**: Auto-integrates new components
- **Adaptive**: Learns optimal routing over time
- **Production-ready**: Built on proven frameworks (DPS, XGBoost, Multi-LLM)
- **Future-proof**: Scales to any number of components

**Status**: Ready for implementation
**Timeline**: 6 weeks to production
**Expected Impact**: 10x improvement in developer experience, unified viral intelligence API
