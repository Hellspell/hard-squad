import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? 'http://localhost'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? 'placeholder'

export const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})
