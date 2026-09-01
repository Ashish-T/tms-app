import { createClient } from '@supabase/supabase-js';

// Ensure the URL starts with https:// and has no brackets
const supabaseUrl = 'https://dadfvklxxuvdqyiobxfe.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZGZ2a2x4eHV2ZHF5aW9ieGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDcwODgsImV4cCI6MjEwMzgyMzA4OH0.nmegf21NphvQKd8ci1YRCVwW9N4sa1qW5pUc-5IDuvM'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);