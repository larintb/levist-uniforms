// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Crea una instancia del cliente de Supabase para el middleware.
  // Esto es crucial para poder leer cookies y manejar la sesión de forma segura.
  const { supabase, response } = await createClient(request)

  // Obtiene la sesión actual del usuario.
  const { data: { session } } = await supabase.auth.getSession()
  
  // Extrae el nombre de la ruta que el usuario está intentando visitar.
  const { pathname } = request.nextUrl;

  // --- LÓGICA DE PROTECCIÓN DE RUTAS ---

  // CASO 1: Proteger todas las rutas de administrador.
  // Si NO hay una sesión activa Y el usuario intenta acceder a CUALQUIER ruta que
  // comience con '/admin', lo redirigimos a la página de login.
  if (!session && pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // CASO 2: Evitar que usuarios logueados vean la página de login.
  // Si SÍ hay una sesión activa Y el usuario intenta acceder a '/login',
  // lo redirigimos a su dashboard, ya que no necesita volver a loguearse.
  if (session && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  // Si ninguno de los casos anteriores se cumple, permite que la solicitud continúe con normalidad.
  return response
}

export const config = {
  // El 'matcher' define en qué rutas se ejecutará este middleware.
  // Esta configuración lo ejecuta en todas las rutas EXCEPTO en las que son
  // para archivos estáticos de Next.js (como JS, CSS, imágenes), lo cual es eficiente.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
