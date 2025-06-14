// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request)

  // Refresca la sesión del usuario si ha expirado.
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl;

  // Si el usuario no está autenticado y está tratando de acceder a una ruta protegida
  // del panel de administración (que no sea la página de login)...
  if (!session && (pathname.startsWith('/dashboard') || pathname.startsWith('/products') || pathname.startsWith('/catalog') || pathname.startsWith('/orders'))) {
    // ...lo redirigimos a la página de login.
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si el usuario está autenticado y trata de ir a la página de login...
  if (session && pathname === '/login') {
    // ...lo redirigimos al dashboard.
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Si no se cumple ninguna de las condiciones anteriores, permite que la petición continúe.
  return response
}

// Configuración para que el middleware solo se ejecute en las rutas necesarias.
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de petición excepto las de archivos estáticos.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
