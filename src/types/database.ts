export interface Database {
    public: {
      Tables: {
        feature_flags: {
          Row: {
            id: string;
            name: string;
            description: string | null;
            enabled: boolean;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            name: string;
            description?: string | null;
            enabled: boolean;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            name?: string;
            description?: string | null;
            enabled?: boolean;
            created_at?: string;
            updated_at?: string;
          };
        };
        user_profiles: {
          Row: {
            id: string;
            user_id: string;
            tier: string;
            created_at: string;
            updated_at: string;
            settings: Record<string, any> | null;
          };
          Insert: {
            id?: string;
            user_id: string;
            tier?: string;
            created_at?: string;
            updated_at?: string;
            settings?: Record<string, any> | null;
          };
          Update: {
            id?: string;
            user_id?: string;
            tier?: string;
            created_at?: string;
            updated_at?: string;
            settings?: Record<string, any> | null;
          };
        };
        templates: {
          Row: {
            id: string;
            name: string;
            description: string | null;
            content: string;
            category: string;
            is_public: boolean;
            creator_id: string | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            name: string;
            description?: string | null;
            content: string;
            category?: string;
            is_public?: boolean;
            creator_id?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            name?: string;
            description?: string | null;
            content?: string;
            category?: string;
            is_public?: boolean;
            creator_id?: string | null;
            created_at?: string;
            updated_at?: string;
          };
        };
        template_tags: {
          Row: {
            id: string;
            template_id: string;
            tag: string;
          };
          Insert: {
            id?: string;
            template_id: string;
            tag: string;
          };
          Update: {
            id?: string;
            template_id?: string;
            tag?: string;
          };
        };
        sounds: {
          Row: {
            id: string;
            name: string;
            url: string;
            category: string;
            duration: number;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            name: string;
            url: string;
            category?: string;
            duration?: number;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            name?: string;
            url?: string;
            category?: string;
            duration?: number;
            created_at?: string;
            updated_at?: string;
          };
        };
        sound_template_mappings: {
          Row: {
            id: string;
            template_id: string;
            sound_id: string;
            position: number;
            created_at: string;
          };
          Insert: {
            id?: string;
            template_id: string;
            sound_id: string;
            position?: number;
            created_at?: string;
          };
          Update: {
            id?: string;
            template_id?: string;
            sound_id?: string;
            position?: number;
            created_at?: string;
          };
        };
        user_saved_templates: {
          Row: {
            id: string;
            user_id: string;
            template_id: string;
            saved_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            template_id: string;
            saved_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            template_id?: string;
            saved_at?: string;
          };
        };
        expert_insights: {
          Row: {
            id: string;
            template_id: string;
            insight: string;
            author: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            template_id: string;
            insight: string;
            author: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            template_id?: string;
            insight?: string;
            author?: string;
            created_at?: string;
          };
        };
        audit_trails: {
          Row: {
            id: string;
            user_id: string;
            action: string;
            resource_type: string;
            resource_id: string;
            created_at: string;
            details: Record<string, any> | null;
          };
          Insert: {
            id?: string;
            user_id: string;
            action: string;
            resource_type: string;
            resource_id: string;
            created_at?: string;
            details?: Record<string, any> | null;
          };
          Update: {
            id?: string;
            user_id?: string;
            action?: string;
            resource_type?: string;
            resource_id?: string;
            created_at?: string;
            details?: Record<string, any> | null;
          };
        };
        user_permissions: {
          Row: {
            id: string;
            user_id: string;
            permission: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            permission: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            permission?: string;
            created_at?: string;
          };
        };
      };
    };
  }