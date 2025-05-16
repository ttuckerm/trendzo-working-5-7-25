// src/lib/minimal-supabase.js
import { createClient } from '@supabase/supabase-js';

// Hardcoded values for testing only
const supabaseUrl = 'https://vyeiyccrageckeehyhj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlY2tlZWh5aGoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNjI0NzUyMCwiZXhwIjoxNzE2MzMzOTIwfQ.vfcm9sZ'; // Add the rest of your key

export const supabase = createClient(supabaseUrl, supabaseKey);