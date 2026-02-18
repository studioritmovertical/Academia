
import { createClient } from '@supabase/supabase-js';

/**
 * Sistema robusto de detecção de credenciais.
 * Prioriza variáveis de ambiente, mas utiliza os valores fornecidos como garantia de funcionamento.
 */
const getSafeEnv = (key: string): string | undefined => {
  try {
    const meta = (import.meta as any);
    if (meta && meta.env && typeof meta.env === 'object' && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {}
  
  try {
    if (typeof process !== 'undefined' && process.env && typeof process.env === 'object' && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}
  
  return undefined;
};

// Seus dados reais fornecidos
const FALLBACK_URL = 'https://tipehypcanvwyhcelbsw.supabase.co';
const FALLBACK_KEY = 'sb_publishable_Prcm8GajRLmx1aHmQ4_e2A_XXAr_yJj';

const supabaseUrl = getSafeEnv('VITE_SUPABASE_URL') || FALLBACK_URL;
const supabaseAnonKey = getSafeEnv('VITE_SUPABASE_ANON_KEY') || FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
