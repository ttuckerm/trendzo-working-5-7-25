// Database types for TRENDZO MVP with Smart Template Engine
// Generated based on Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          last_active: string
          conversion_source: 'landing_exit' | 'editor_exit' | 'direct' | null
          entry_niche: string | null
          entry_platform: string | null
          attribution_given: number
          total_templates_created: number
          onboarding_completed: boolean
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          last_active?: string
          conversion_source?: 'landing_exit' | 'editor_exit' | 'direct' | null
          entry_niche?: string | null
          entry_platform?: string | null
          attribution_given?: number
          total_templates_created?: number
          onboarding_completed?: boolean
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          last_active?: string
          conversion_source?: 'landing_exit' | 'editor_exit' | 'direct' | null
          entry_niche?: string | null
          entry_platform?: string | null
          attribution_given?: number
          total_templates_created?: number
          onboarding_completed?: boolean
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          category: string
          niche: 'business' | 'creator' | 'fitness' | 'education' | 'general'
          platform: string[]
          viral_score: number
          usage_count: number
          original_creator: {
            username: string
            platform: string
            videoUrl: string
            profileUrl: string
          } | null
          structure: {
            sections: string[]
            duration: number
            [key: string]: any
          }
          preview_url: string | null
          thumbnail_url: string | null
          duration_seconds: number | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          niche: 'business' | 'creator' | 'fitness' | 'education' | 'general'
          platform: string[]
          viral_score?: number
          usage_count?: number
          original_creator?: {
            username: string
            platform: string
            videoUrl: string
            profileUrl: string
          } | null
          structure: {
            sections: string[]
            duration: number
            [key: string]: any
          }
          preview_url?: string | null
          thumbnail_url?: string | null
          duration_seconds?: number | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          niche?: 'business' | 'creator' | 'fitness' | 'education' | 'general'
          platform?: string[]
          viral_score?: number
          usage_count?: number
          original_creator?: {
            username: string
            platform: string
            videoUrl: string
            profileUrl: string
          } | null
          structure?: {
            sections: string[]
            duration: number
            [key: string]: any
          }
          preview_url?: string | null
          thumbnail_url?: string | null
          duration_seconds?: number | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      landing_pages: {
        Row: {
          id: string
          niche: 'business' | 'creator' | 'fitness' | 'education'
          platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram'
          content: {
            headline: string
            subheadline: string
            painPoints: string[]
            benefits: string[]
            ctaText: string
            socialProof: string
            templateShowcase: string
            urgencyText: string
          }
          performance_data: {
            visitors: number
            conversions: number
            conversionRate: number
          }
          ab_variant: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          niche: 'business' | 'creator' | 'fitness' | 'education'
          platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram'
          content: {
            headline: string
            subheadline: string
            painPoints: string[]
            benefits: string[]
            ctaText: string
            socialProof: string
            templateShowcase: string
            urgencyText: string
          }
          performance_data?: {
            visitors: number
            conversions: number
            conversionRate: number
          }
          ab_variant?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          niche?: 'business' | 'creator' | 'fitness' | 'education'
          platform?: 'linkedin' | 'twitter' | 'facebook' | 'instagram'
          content?: {
            headline: string
            subheadline: string
            painPoints: string[]
            benefits: string[]
            ctaText: string
            socialProof: string
            templateShowcase: string
            urgencyText: string
          }
          performance_data?: {
            visitors: number
            conversions: number
            conversionRate: number
          }
          ab_variant?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      campaign_analytics: {
        Row: {
          id: string
          landing_page_id: string | null
          visitor_id: string
          session_id: string
          event_type: 'page_view' | 'exit_intent_trigger' | 'exit_intent_dismiss' | 'exit_intent_convert' | 'editor_entry' | 'template_select' | 'customization_start' | 'email_capture' | 'magic_link_sent' | 'magic_link_clicked' | 'template_complete' | 'attribution_shown' | 'attribution_given'
          metadata: Json
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          device_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          landing_page_id?: string | null
          visitor_id: string
          session_id: string
          event_type: 'page_view' | 'exit_intent_trigger' | 'exit_intent_dismiss' | 'exit_intent_convert' | 'editor_entry' | 'template_select' | 'customization_start' | 'email_capture' | 'magic_link_sent' | 'magic_link_clicked' | 'template_complete' | 'attribution_shown' | 'attribution_given'
          metadata?: Json
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          device_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          landing_page_id?: string | null
          visitor_id?: string
          session_id?: string
          event_type?: 'page_view' | 'exit_intent_trigger' | 'exit_intent_dismiss' | 'exit_intent_convert' | 'editor_entry' | 'template_select' | 'customization_start' | 'email_capture' | 'magic_link_sent' | 'magic_link_clicked' | 'template_complete' | 'attribution_shown' | 'attribution_given'
          metadata?: Json
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          device_type?: string | null
          created_at?: string
        }
      }
      user_templates: {
        Row: {
          id: string
          user_id: string
          template_id: string
          customization: Json
          completed: boolean
          attribution_given: boolean
          export_count: number
          last_edited: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          customization: Json
          completed?: boolean
          attribution_given?: boolean
          export_count?: number
          last_edited?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          customization?: Json
          completed?: boolean
          attribution_given?: boolean
          export_count?: number
          last_edited?: string
          created_at?: string
        }
      }
      creator_attributions: {
        Row: {
          id: string
          user_id: string
          template_id: string
          creator_username: string
          creator_platform: string
          comment_text: string
          comment_posted: boolean
          engagement_result: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          creator_username: string
          creator_platform: string
          comment_text: string
          comment_posted?: boolean
          engagement_result?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          creator_username?: string
          creator_platform?: string
          comment_text?: string
          comment_posted?: boolean
          engagement_result?: string | null
          created_at?: string
        }
      }
      email_captures: {
        Row: {
          id: string
          email: string
          capture_source: 'landing_exit' | 'editor_exit' | 'save_template'
          niche: string | null
          platform: string | null
          template_id: string | null
          magic_link_token: string
          magic_link_used: boolean
          created_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          email: string
          capture_source: 'landing_exit' | 'editor_exit' | 'save_template'
          niche?: string | null
          platform?: string | null
          template_id?: string | null
          magic_link_token?: string
          magic_link_used?: boolean
          created_at?: string
          used_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          capture_source?: 'landing_exit' | 'editor_exit' | 'save_template'
          niche?: string | null
          platform?: string | null
          template_id?: string | null
          magic_link_token?: string
          magic_link_used?: boolean
          created_at?: string
          used_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type Template = Database['public']['Tables']['templates']['Row']
export type LandingPage = Database['public']['Tables']['landing_pages']['Row']
export type CampaignAnalytics = Database['public']['Tables']['campaign_analytics']['Row']
export type UserTemplate = Database['public']['Tables']['user_templates']['Row']
export type CreatorAttribution = Database['public']['Tables']['creator_attributions']['Row']
export type EmailCapture = Database['public']['Tables']['email_captures']['Row']

// Landing page content type
export interface LandingPageContent {
  headline: string
  subheadline: string
  painPoints: string[]
  benefits: string[]
  ctaText: string
  socialProof: string
  templateShowcase: string
  urgencyText: string
}

// Creator info type
export interface CreatorInfo {
  username: string
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin'
  videoUrl: string
  profileUrl: string
}

// Template structure type
export interface TemplateStructure {
  sections: string[]
  duration: number
  transitions?: string[]
  effects?: string[]
  [key: string]: any
}

// Analytics event metadata types
export interface AnalyticsMetadata {
  templateId?: string
  customizationStep?: string
  exitIntentType?: string
  errorMessage?: string
  [key: string]: any
}

// Niche and Platform types
export type Niche = 'business' | 'creator' | 'fitness' | 'education'
export type Platform = 'linkedin' | 'twitter' | 'facebook' | 'instagram'
export type TemplatePlatform = Platform | 'tiktok' | 'youtube'

// Campaign metrics type
export interface CampaignMetrics {
  landingPageId: string
  niche: Niche
  platform: Platform
  visitors: number
  conversions: number
  conversionRate: number
  exitIntentTriggers: number
  exitIntentConversions: number
  editorEntryRate: number
  templateCompletionRate: number
  socialSource: string
}