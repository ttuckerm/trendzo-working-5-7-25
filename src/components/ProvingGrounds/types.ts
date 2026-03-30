// src/components/ProvingGrounds/types.ts
export interface ModuleData {
  name: string;
  processed: number;
  uptime: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface VideoData {
  id: string;
  title: string;
  creator: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  processing?: boolean;
}

export interface TemplateData {
  id:string;
  name: string;
  score: number;
  description: string;
  tags: string[];
  category: string;
} 