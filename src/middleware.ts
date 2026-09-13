import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { comoTipoCuenta } from "@/lib/data/tipos";
import { leerCredenciales } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

/** Rutas que se pueden abrir sin sesión iniciada. */
const PUBLICAS = ["/login", "/registro"];

/** Prefijo del panel de empresa. Todo lo demás es territorio del postulante. */
const AREA_EMPRESA = "/empresa";

/**
 * En qué mitad de la aplicación vive esta sesión, según `cuentas.tipo`.
 *
 * Lee la base y no `user_metadata`: el propio usuario puede reescribir su
 * metadata con `auth.updateUser`, así que decidir permisos con ella sería
 * dejarle elegir a qué panel entra. `cuentas.tipo` lo protegen RLS y el
 * disparador `validar_cambio_tipo_cuenta`.
 *
 * Sin fila en `cuentas` —alta a medio terminar, porque la confirmación por
 * correo todavía no ocurrió— devuelve el área del postulante, que es la que
 * tolera un perfil inexistente.
 *
 * ponytail: una consulta por request. Alcanza para el tamaño actual; si el
 * middleware se vuelve caliente, el tipo va como claim del JWT con un auth
 * hook de Supabase y esta función desaparece.
 */
async function areaDe(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("cuentas")
    .select("tipo")
    .eq("id", userId)
    .maybeSingle();

  return comoTipoCuenta(data?.tipo ?? "") === "empresa"
    ? AREA_EMPRESA
    : "/inicio";
}

/**
 * Refresca la sesión de Supabase en cada request, reescribe las cookies y
 * resuelve quién puede estar dónde:
 *
 * - Sin sesión, solo `PUBLICAS` (RF1.3). El resto va a `/login`.
 * - Con sesión, cada tipo de cuenta se queda en su mitad: una cuenta
 *   individual que pida `/empresa` cae en `/inicio`, y una de empresa que pida
 *   cualquier pantalla del postulante cae en `/empresa` (RF1.2).
 *
 * Es el único punto por el que pasan todas las rutas, así que el control vive
 * acá y no repetido en cada `page.tsx`.
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

  const supabase = createServerClient<Database>(
    credenciales.url,
    credenciales.anonKey,
    {
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
    },
  );

  // Revalida el token y dispara el refresco de la sesión.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;

  /** Redirige conservando las cookies que el refresco acaba de reescribir. */
  const redirigirA = (pathname: string) => {
    const destino = request.nextUrl.clone();
    destino.pathname = pathname;

    // Si esas cookies se pierden, el próximo request vuelve a intentar
    // refrescar un token que ya se descartó.
    const redireccion = NextResponse.redirect(destino);
    for (const cookie of response.cookies.getAll()) {
      redireccion.cookies.set(cookie);
    }

    return redireccion;
  };

  if (!user) {
    return PUBLICAS.includes(ruta) ? response : redirigirA("/login");
  }

  // Con sesión, `/login` y `/registro` ya no tienen sentido.
  if (PUBLICAS.includes(ruta)) {
    return redirigirA(await areaDe(supabase, user.id));
  }

  const area = await areaDe(supabase, user.id);
  const pideEmpresa =
    ruta === AREA_EMPRESA || ruta.startsWith(`${AREA_EMPRESA}/`);

  // Cada tipo de cuenta se queda en su mitad de la aplicación.
  if (pideEmpresa && area !== AREA_EMPRESA) return redirigirA("/inicio");
  if (!pideEmpresa && area === AREA_EMPRESA) return redirigirA(AREA_EMPRESA);

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
