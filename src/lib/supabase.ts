import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
// Publishable/anon key saja. Service role / secret key TIDAK BOLEH ada di frontend.
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as
  | string
  | undefined

export const isSupabaseConfigured = Boolean(url && key)

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, key!, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        // Client otomatis menukar ?code= di /auth/callback; kita tidak mengelola token sendiri.
        detectSessionInUrl: true,
      },
    })
  : null

/** Akses client di area yang sudah dijaga (route privat hanya dirender jika terkonfigurasi). */
export function db(): SupabaseClient<Database> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  return supabase
}
