import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

export const createClient = () => {
  // Using explicit configuration to ensure API key is properly passed
  return createClientComponentClient({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
  })
} 