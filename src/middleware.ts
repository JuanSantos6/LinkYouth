import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { leerCredenciales } from "@/lib/supabase/config";

/** Rutas que se pueden abrir sin sesión iniciada. */
const PUBLICAS = ["/login", "/registro"];

/**
 * Refresca la sesión de Supabase en cada request, reescribe las cookies y
 * manda a `/login` a quien entre sin sesión (RF1.3).
 *
 * Es el único punto por el que pasan las cinco pantallas de `(app)/`, así que
 * el control vive acá y no repetido en cada `page.tsx`.
 *
 * Si el proyecto todavía no tiene credenciales cargadas, deja pasar el
 * request sin tocarlo en vez de romper toda la navegación: sin Supabase no
 * hay sesión posible y la aplicación tiene que poder recorrerse igual con los
 * datos de ejemplo (§2.3 de `docs/arquitectura.md`).
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;

  if (!user && !PUBLICAS.includes(ruta)) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";

    // Las cookies que el refresco acaba de reescribir viajan también en la
    // redirección: si se pierden, el próximo request vuelve a intentar
    // refrescar un token que ya se descartó.
    const redireccion = NextResponse.redirect(destino);
    for (const cookie of response.cookies.getAll()) {
      redireccion.cookies.set(cookie);
    }

    return redireccion;
  }

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
