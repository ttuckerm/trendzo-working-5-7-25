export type Template = {
  id: string;
  title: string;
  niche: string;
  goal: string;
  previewUrl?: string;
  successRate?: number; // 0..1
  delta7d?: number; // percentage points
  uses?: number;
  recommended?: boolean;
};

export type Hook = {
  id: string;
  text: string;
};

export type ScriptDoc = {
  hooks: Hook[];
  beats: string[];
  tone?: number; // 0..100
  cta?: string;
  shots?: string[];
  body?: string;
};

export type AnalysisFix = {
  text: string;
  impact: number; // 0..1
  timestamp?: string;
};

export type AnalysisResult = {
  score: number; // 0..1
  confidenceBands: [number, number];
  fixes: AnalysisFix[];
  passed?: boolean;
};

export type Prediction = {
  id: string;
  score: number; // 0..1
  platformPlan: { platform: string; dayOffset: number }[];
  madeAtISO: string;
};

export type SchedulePlan = {
  items: { platform: "tiktok" | "instagram" | "youtube"; dayOffset: number }[];
  captions?: Record<string, string>; // platform -> caption/hashtags
};

export type ValidationMetrics = {
  accuracyKPI: { value: number; num: number; denom: number };
  cohorts: { label: string; accuracy: number }[];
  calibration: { bin: string; expected: number; actual: number }[];
  confusion: { tp: number; fp: number; tn: number; fn: number };
};

export type LearningVersion = {
  version: string;
  changed: string[]; // list of deltas
  notes?: string;
};

export type JourneyStep = {
  id: string;
  label: string;
  entrants: number;
  dropOff: number; // 0..1
};


