import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null;

// Create a singleton Supabase client for the browser
export function createClient(): SupabaseClient {
  // Use cached instance if available
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing');
    // Return a mock client for SSR to prevent crashes
    if (typeof window === 'undefined') {
      return {
        from: () => ({
          select: () => ({ data: [], error: new Error('Supabase not initialized') }),
        }),
      } as any;
    }
    
    throw new Error('Supabase credentials are required');
  }
  
  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
} 