import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Build sırasında environment variable'lar yoksa dummy değerler kullan
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseKey || 'placeholder-key'

// Gerçek değerler yoksa uyarı ver
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are not set. Using placeholder values.')
}

export const supabase = createClient(url, key)
