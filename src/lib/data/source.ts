import { VIT } from '@/lib/vit/vit';

export const isMock = () => process.env.MOCK === '1';

export interface ListQuery {
  cursor?: string;
  limit?: number;
  platform?: string;
  niche?: string;
  order?: 'recent' | 'top';
}

export interface Source {
  list(q: ListQuery): Promise<{ items: VIT[]; nextCursor?: string }>;
  get(id: string): Promise<VIT | null>;
  metrics(): Promise<{
    accuracy?: { correct: number; total: number };
    calibration?: Array<{ bin: number; meanPred: number; empRate: number }>;
    weather?: { status: string; lastChange?: string };
  }>;
}


