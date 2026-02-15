
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tipehypcanvwyhcelbsw.supabase.co';
const supabaseAnonKey = 'sb_publishable_Prcm8GajRLmx1aHmQ4_e2A_XXAr_yJj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
