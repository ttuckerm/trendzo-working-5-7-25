export type TemplateStatus = 'HOT' | 'COOLING' | 'NEW';

export type RecipeTemplate = {
  id: string;
  name: string;
  status: TemplateStatus;
  successRate: number; // 0-100
  uses: number; // how many times detected
  trendDelta7d: number; // +/- % change vs last week
  keyPatterns: string[]; // e.g., ["Pattern Interrupt", "Jump Cut", "On-screen Text"]
  exampleLinks: string[]; // urls to example posts (placeholder)
  previewThumb: string; // small image path
};

export type RecipeBookPayload = {
  generatedAt: string; // ISO timestamp; pretend daily at 06:00 local
  templates: RecipeTemplate[];
};

export type RecipeBookQuery = {
  status?: TemplateStatus;
  q?: string;
  sort?: 'success' | 'uses' | 'trend';
};


