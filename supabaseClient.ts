
import { createClient } from '@supabase/supabase-js';

// No Vite, o acesso deve ser estático para substituição em tempo de build
// Fix: Usando process.env para acessar variáveis de ambiente conforme as diretrizes do ambiente e evitar erros de tipagem
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'placeholder') {
  console.error("ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas!");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-error.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
