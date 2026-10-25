import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve config from Vite env vars or local storage override
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const localUrl = typeof window !== 'undefined' ? localStorage.getItem('ironman_supabase_url') : null;
const localKey = typeof window !== 'undefined' ? localStorage.getItem('ironman_supabase_anon_key') : null;

const effectiveUrl = envUrl || localUrl || '';
const effectiveKey = envKey || localKey || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    effectiveUrl &&
    effectiveKey &&
    effectiveUrl.startsWith('https://') &&
    !effectiveUrl.includes('your-project-id')
  );
};

export const getSupabaseConfig = () => {
  return {
    url: effectiveUrl,
    hasKey: Boolean(effectiveKey),
    isEnvConfigured: Boolean(envUrl && envKey),
  };
};

export const saveCustomSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ironman_supabase_url', url.trim());
    localStorage.setItem('ironman_supabase_anon_key', key.trim());
    window.location.reload();
  }
};

export const clearCustomSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ironman_supabase_url');
    localStorage.removeItem('ironman_supabase_anon_key');
    window.location.reload();
  }
};

// Create the singleton client if configured
let client: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  client = createClient(effectiveUrl, effectiveKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = client;
