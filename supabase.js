import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://teyuifdsxgafamxcgakq.supabase.co'  // Cole sua URL aqui
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleXVpZmRzeGdhZmFteGNnYWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDEzNjQsImV4cCI6MjA3NTQ3NzM2NH0.JeBwdaZy94aTji7hEMlaY3t4kiSP6fgDJMoo8xVOwkg'  // Cole a chave anon aqui

export const supabase = createClient(supabaseUrl, supabaseAnonKey)