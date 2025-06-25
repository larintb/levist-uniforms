// middleware.ts (versión corregida y actualizada)

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request)
  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl;

  // Si no hay sesión y se intenta acceder al admin, redirigir a /login
  if (!session && pathname === '/admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/login' // <-- CAMBIO AQUÍ
    return NextResponse.redirect(url)
  }

  // Si hay sesión y se intenta acceder a /login, redirigir al dashboard
  if (session && pathname === '/login') { // <-- CAMBIO AQUÍ
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}