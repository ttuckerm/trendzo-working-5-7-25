import { createClient } from '@supabase/supabase-js';
import { DatabaseClient, QueryBuilder, QueryResult } from './types';

// Fallback to hardcoded values if environment variables aren't available
// This ensures we always have values even if env variables fail to load
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vyeiyccrageeckeehyhj.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlZWNrZWVoeWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MjE2MTEsImV4cCI6MjA2MjQ5NzYxMX0.DAEyNYSuqddMrbnoBTsQFjDhJGsgj4f0_Nk2a76ZV2U";

// Log for debugging - this helps identify if the environment variables are loading
console.log("Supabase URL:", supabaseUrl ? "Found" : "Missing");
console.log("Supabase Anon Key:", supabaseAnonKey ? "Found" : "Missing");

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Wrapper to match our common interface
class SupabaseQueryBuilder implements QueryBuilder {
  private query: any;
  
  constructor(table: string) {
    this.query = supabase.from(table);
  }

  async select(columns = '*'): Promise<QueryResult> {
    const { data, error } = await this.query.select(columns);
    return { data, error };
  }

  async insert(data: any): Promise<QueryResult> {
    const { data: result, error } = await this.query.insert(data).select();
    return { data: result, error };
  }

  async update(data: any): Promise<QueryResult> {
    const { data: result, error } = await this.query.update(data).select();
    return { data: result, error };
  }

  async delete(): Promise<QueryResult> {
    const { data, error } = await this.query.delete();
    return { data, error };
  }

  eq(column: string, value: any): QueryBuilder {
    this.query = this.query.eq(column, value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder {
    this.query = this.query.order(column, { ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number): QueryBuilder {
    this.query = this.query.limit(count);
    return this;
  }
}

export function createSupabaseClient(): DatabaseClient {
  return {
    from: (table: string) => new SupabaseQueryBuilder(table),
    auth: {
      signUp: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        return { data, error };
      },
      signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
      },
      getUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
        return { unsubscribe: () => subscription.unsubscribe() };
      }
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File) => {
          const { data, error } = await supabase.storage.from(bucket).upload(path, file);
          return { data, error };
        },
        download: async (path: string) => {
          const { data, error } = await supabase.storage.from(bucket).download(path);
          return { data, error };
        },
        remove: async (paths: string[]) => {
          const { data, error } = await supabase.storage.from(bucket).remove(paths);
          return { data, error };
        },
        getPublicUrl: (path: string) => {
          return supabase.storage.from(bucket).getPublicUrl(path);
        }
      })
    }
  };
}