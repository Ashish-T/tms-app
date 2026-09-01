import { createClient } from '@supabase/supabase-js';

// Ensure the URL starts with https:// and has no brackets
const supabaseUrl = 'https://hsirbelsywximwapqktq.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);