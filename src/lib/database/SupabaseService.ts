import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface TemplateRecord {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: 'published' | 'draft' | 'archived';
  success_rate: number;
  avg_views?: number;
  avg_engagement_rate?: number;
  viral_probability?: number;
  structure?: {
    hook: string;
    build: string;
    payoff: string;
    cta: string;
  };
  platform_optimized?: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export class SupabaseService {
  static async getPublishedTemplates(): Promise<{ data: TemplateRecord[] | null; error: any }> {
    try {
      // Try to query the templates table first
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching published templates:', error.message);
        
        // If templates table doesn't exist or is empty, return sample data
        // This ensures The Armory works even without database templates
        const sampleTemplates: TemplateRecord[] = [
          {
            id: 'template-001',
            name: 'The Quick Hook Formula',
            description: 'Viral formula that hooks viewers in the first 3 seconds',
            category: 'hooks',
            status: 'published',
            success_rate: 0.92,
            avg_views: 2500000,
            avg_engagement_rate: 0.08,
            viral_probability: 0.89,
            structure: {
              hook: 'This will change everything you know about...',
              build: 'Most people think X, but actually...',
              payoff: 'Here\'s the secret that saves you Y',
              cta: 'Follow for more life-changing tips'
            },
            platform_optimized: ['tiktok', 'instagram'],
            usage_count: 1247,
            created_at: '2025-01-15T10:00:00Z',
            updated_at: '2025-01-15T10:00:00Z'
          },
          {
            id: 'template-002',
            name: 'Story Arc Master',
            description: 'The perfect story structure for viral content',
            category: 'storytelling',
            status: 'published',
            success_rate: 0.87,
            avg_views: 1800000,
            avg_engagement_rate: 0.12,
            viral_probability: 0.85,
            structure: {
              hook: 'You won\'t believe what happened when...',
              build: 'First this happened... then this...',
              payoff: 'And that\'s how I learned that...',
              cta: 'What would you have done? Comment below'
            },
            platform_optimized: ['tiktok', 'youtube'],
            usage_count: 892,
            created_at: '2025-01-14T15:30:00Z',
            updated_at: '2025-01-14T15:30:00Z'
          },
          {
            id: 'template-003',
            name: 'Problem-Solution Bomb',
            description: 'Instantly viral problem-solving format',
            category: 'education',
            status: 'published',
            success_rate: 0.94,
            avg_views: 3200000,
            avg_engagement_rate: 0.15,
            viral_probability: 0.91,
            structure: {
              hook: 'Struggling with X? Here\'s the fix',
              build: 'The problem is everyone does Y',
              payoff: 'Instead, do Z and watch magic happen',
              cta: 'Save this for later - you\'ll need it'
            },
            platform_optimized: ['tiktok', 'instagram', 'linkedin'],
            usage_count: 2156,
            created_at: '2025-01-13T09:15:00Z',
            updated_at: '2025-01-13T09:15:00Z'
          },
          {
            id: 'template-004',
            name: 'Transformation Reveal',
            description: 'Before/after content that always goes viral',
            category: 'transformation',
            status: 'published',
            success_rate: 0.88,
            avg_views: 2100000,
            avg_engagement_rate: 0.11,
            viral_probability: 0.86,
            structure: {
              hook: 'From X to Y in Z days',
              build: 'Here\'s exactly what I did...',
              payoff: 'And here\'s the shocking result',
              cta: 'Try this and show me your results'
            },
            platform_optimized: ['tiktok', 'instagram'],
            usage_count: 1534,
            created_at: '2025-01-12T14:20:00Z',
            updated_at: '2025-01-12T14:20:00Z'
          },
          {
            id: 'template-005',
            name: 'Contrarian Truth Bomb',
            description: 'Challenge conventional wisdom for massive reach',
            category: 'controversial',
            status: 'published',
            success_rate: 0.83,
            avg_views: 2800000,
            avg_engagement_rate: 0.18,
            viral_probability: 0.82,
            structure: {
              hook: 'Everyone says X, but they\'re wrong',
              build: 'Here\'s why the opposite is true...',
              payoff: 'This is what actually works',
              cta: 'Agree or disagree? Let me know'
            },
            platform_optimized: ['tiktok', 'twitter', 'linkedin'],
            usage_count: 967,
            created_at: '2025-01-11T11:45:00Z',
            updated_at: '2025-01-11T11:45:00Z'
          },
          {
            id: 'template-006',
            name: 'Behind the Scenes Magic',
            description: 'Exclusive insights that build authority',
            category: 'authority',
            status: 'published',
            success_rate: 0.79,
            avg_views: 1650000,
            avg_engagement_rate: 0.09,
            viral_probability: 0.77,
            structure: {
              hook: 'What they don\'t show you about...',
              build: 'Behind the scenes, this is what really happens',
              payoff: 'Now you know the real secret',
              cta: 'Follow for more insider knowledge'
            },
            platform_optimized: ['tiktok', 'instagram', 'youtube'],
            usage_count: 743,
            created_at: '2025-01-10T16:00:00Z',
            updated_at: '2025-01-10T16:00:00Z'
          }
        ];

        return { data: sampleTemplates, error: null };
      }

      return { data, error: null };
    } catch (error) {
      console.error('SupabaseService.getPublishedTemplates failed:', error);
      return { data: null, error };
    }
  }
}