// app/login/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const { error } = await supabase.auth.signInWithPassword(data)
  if (error) {
    return { error: `No se pudo autenticar: ${error.message}` };
  }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const { error } = await supabase.auth.signUp(data)
  if (error) {
    return { error: `No se pudo registrar: ${error.message}` };
  }
  return { error: null };
}

// NUEVA ACCIÓN PARA CERRAR SESIÓN
export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect('/login');
}
