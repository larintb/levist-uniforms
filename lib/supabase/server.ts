// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// La función ahora es async para poder usar 'await'
export async function createClient() {
  // ¡CORRECCIÓN! Usamos await para obtener el objeto de cookies,
  // tal como lo sugiere el error.
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error(`Failed to set cookie "${name}":`, error)
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.error(`Failed to remove cookie "${name}":`, error)
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
