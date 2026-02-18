
import { createClient } from '@supabase/supabase-js';

/**
 * Safely retrieves environment variables from common locations.
 */
const getEnv = (key: string): string | undefined => {
  try {
    // Check Vite/ESM environment
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const metaEnv = (import.meta as any).env;
      if (metaEnv[key]) return metaEnv[key];
    }
    
    // Check Node/Global environment (for SSR or local testing if needed)
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[key]) return process.env[key];
    }
  } catch (e) {
    // Fallback
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || '';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key missing. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.");
}

// Se não houver URL/Key, o cliente ainda é criado mas as chamadas falharão graciosamente ou gerarão erro 401
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
