// /lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'

/**
 * Crea un cliente de Supabase para ser usado en COMPONENTES DE CLIENTE.
 * Este cliente puede ejecutarse de forma segura en el navegador.
 */
export function createClient() {
  // Asegúrate de que las variables de entorno estén definidas.
  // Si no lo están, lanza un error para evitar problemas en producción.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
