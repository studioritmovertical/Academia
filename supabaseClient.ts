
import { createClient } from '@supabase/supabase-js';

/**
 * Tenta obter uma variável de ambiente de forma segura, 
 * verificando tanto o padrão Vite (import.meta.env) quanto o padrão Node/Shims (process.env).
 */
const getSafeEnv = (key: string): string | undefined => {
  try {
    // Tenta acessar via import.meta.env (Vite)
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch (e) {
    // Silencia erros de acesso ao import.meta
  }

  try {
    // Tenta acessar via process.env (Fallbacks/Shims)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Silencia erros de acesso ao process.env
  }

  return undefined;
};

// URL e Key fornecidas pelo usuário
const DEFAULT_URL = 'https://tipehypcanvwyhcelbsw.supabase.co';
const DEFAULT_KEY = 'sb_publishable_Prcm8GajRLmx1aHmQ4_e2A_XXAr_yJj';

const supabaseUrl = getSafeEnv('VITE_SUPABASE_URL') || DEFAULT_URL;
const supabaseAnonKey = getSafeEnv('VITE_SUPABASE_ANON_KEY') || DEFAULT_KEY;

// Verificação de segurança no console para auxílio no debug
if (supabaseUrl === DEFAULT_URL && !getSafeEnv('VITE_SUPABASE_URL')) {
  console.warn("Aviso: VITE_SUPABASE_URL não encontrada no ambiente. Usando URL padrão.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
