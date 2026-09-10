import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { leerCredenciales } from "@/lib/supabase/config";

/**
 * Refresca la sesión de Supabase en cada request y reescribe las cookies.
 * Si el proyecto todavía no tiene credenciales cargadas, deja pasar el
 * request sin tocarlo en vez de romper toda la navegación.
 */
export async function middleware(request: NextRequest) {
  const credenciales = leerCredenciales();
  if (!credenciales) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(credenciales.url, credenciales.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Revalida el token y dispara el refresco de la sesión.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Se aplica a todas las rutas salvo:
     * - _next/static y _next/image (assets internos de Next.js)
     * - favicon.ico y los archivos de imagen
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
