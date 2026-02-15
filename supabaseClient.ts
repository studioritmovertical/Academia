
import { createClient } from '@supabase/supabase-js';

/**
 * Safely retrieves environment variables from common locations (Vite's import.meta.env or Node/Vercel's process.env).
 * This prevents "Cannot read properties of undefined" errors in environments where one or both might be missing.
 */
const getEnv = (key: string): string | undefined => {
  try {
    // Check Vite/ESM environment
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
    
    // Check Node/Global environment
    const procEnv = (globalThis as any).process?.env;
    if (procEnv && procEnv[key]) return procEnv[key];
  } catch (e) {
    // Fallback if access is restricted
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://tipehypcanvwyhcelbsw.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_Prcm8GajRLmx1aHmQ4_e2A_XXAr_yJj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
