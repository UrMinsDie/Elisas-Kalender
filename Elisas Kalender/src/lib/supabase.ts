import { createClient } from '@supabase/supabase-js';
import { env } from './env';

const fallbackSupabaseUrl = 'https://example.supabase.co';
const fallbackSupabaseKey = 'missing-local-development-key';

export const supabase = createClient(env.supabaseUrl || fallbackSupabaseUrl, env.supabasePublishableKey || fallbackSupabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
