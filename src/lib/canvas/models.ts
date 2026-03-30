/**
 * Canvas AI Model Configuration
 *
 * Defines available AI providers and models for the Canvas feature.
 * Used by both the DetailPanel (UI dropdown) and the chat API route.
 *
 * Model IDs verified against Anthropic and OpenAI APIs as of Feb 2026.
 */

export type CanvasProvider = 'anthropic' | 'openai';

export interface CanvasModelOption {
  id: string;
  provider: CanvasProvider;
  label: string;
  description: string;
  modelId: string;
  tier: 'pro' | 'standard' | 'fast';
  maxTokens: number;
}

export const CANVAS_MODELS: CanvasModelOption[] = [
  // ── Anthropic ─────────────────────────────────────────
  {
    id: 'claude-opus-4.6',
    provider: 'anthropic',
    label: 'Opus 4.6',
    description: 'Most capable for ambitious work',
    modelId: 'claude-opus-4-6',
    tier: 'pro',
    maxTokens: 16000,
  },
  {
    id: 'claude-sonnet-4.6',
    provider: 'anthropic',
    label: 'Sonnet 4.6',
    description: 'Most efficient for everyday tasks',
    modelId: 'claude-sonnet-4-6',
    tier: 'pro',
    maxTokens: 16000,
  },
  {
    id: 'claude-haiku-4.5',
    provider: 'anthropic',
    label: 'Haiku 4.5',
    description: 'Fastest for quick answers',
    modelId: 'claude-haiku-4-5-20251001',
    tier: 'fast',
    maxTokens: 8192,
  },
  {
    id: 'claude-opus-4.5',
    provider: 'anthropic',
    label: 'Opus 4.5',
    description: 'Previous-gen flagship',
    modelId: 'claude-opus-4-5-20251101',
    tier: 'standard',
    maxTokens: 16000,
  },
  {
    id: 'claude-sonnet-4.5',
    provider: 'anthropic',
    label: 'Sonnet 4.5',
    description: 'Previous-gen balanced model',
    modelId: 'claude-sonnet-4-5-20250929',
    tier: 'standard',
    maxTokens: 16000,
  },
  {
    id: 'claude-sonnet-4',
    provider: 'anthropic',
    label: 'Sonnet 4',
    description: 'Reliable and proven',
    modelId: 'claude-sonnet-4-20250514',
    tier: 'standard',
    maxTokens: 16000,
  },
  // ── OpenAI ────────────────────────────────────────────
  {
    id: 'gpt-4.1',
    provider: 'openai',
    label: 'GPT-4.1',
    description: 'Latest flagship model',
    modelId: 'gpt-4.1',
    tier: 'pro',
    maxTokens: 16000,
  },
  {
    id: 'gpt-4o',
    provider: 'openai',
    label: 'GPT-4o',
    description: 'Fast multimodal reasoning',
    modelId: 'gpt-4o',
    tier: 'pro',
    maxTokens: 16000,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    label: 'GPT-4o Mini',
    description: 'Affordable and fast',
    modelId: 'gpt-4o-mini',
    tier: 'fast',
    maxTokens: 16000,
  },
  {
    id: 'o3',
    provider: 'openai',
    label: 'o3',
    description: 'Advanced reasoning',
    modelId: 'o3',
    tier: 'pro',
    maxTokens: 16000,
  },
  {
    id: 'o3-mini',
    provider: 'openai',
    label: 'o3-mini',
    description: 'Fast reasoning',
    modelId: 'o3-mini',
    tier: 'fast',
    maxTokens: 16000,
  },
  {
    id: 'o4-mini',
    provider: 'openai',
    label: 'o4-mini',
    description: 'Latest compact reasoning',
    modelId: 'o4-mini',
    tier: 'fast',
    maxTokens: 16000,
  },
];

export const DEFAULT_MODEL_ID = 'claude-sonnet-4.6';

export const PROVIDER_LABELS: Record<CanvasProvider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
};

export const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pro: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  standard: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  fast: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

export function getModelById(id: string): CanvasModelOption | undefined {
  return CANVAS_MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: CanvasProvider): CanvasModelOption[] {
  return CANVAS_MODELS.filter((m) => m.provider === provider);
}
