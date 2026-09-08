import { createClient } from "@/lib/supabase/server";

// La verificación consulta Supabase en cada visita, sin caché.
export const dynamic = "force-dynamic";

type EstadoConexion = {
  ok: boolean;
  detalle: string;
};

async function verificarConexion(): Promise<EstadoConexion> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      ok: false,
      detalle:
        "Faltan las variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local",
    };
  }

  try {
    const supabase = await createClient();
    // Llamada trivial: le pide el usuario actual al servicio de auth.
    // No necesita ninguna tabla y devuelve error si las credenciales no sirven.
    const { error } = await supabase.auth.getUser();

    // Sin sesión iniciada la respuesta es un usuario nulo, no un fallo de conexión.
    if (error && error.name !== "AuthSessionMissingError") {
      return { ok: false, detalle: error.message };
    }

    return { ok: true, detalle: `Respuesta correcta de ${url}` };
  } catch (error) {
    return {
      ok: false,
      detalle: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export default async function Home() {
  const estado = await verificarConexion();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 p-8 text-slate-900">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">LinkYouth</h1>
        <p className="mt-3 text-slate-600">
          Plataforma de primer empleo, formación y networking para jóvenes.
        </p>
      </div>

      <section
        className={`w-full max-w-xl rounded-xl border p-6 ${
          estado.ok
            ? "border-emerald-300 bg-emerald-50"
            : "border-red-300 bg-red-50"
        }`}
      >
        <h2 className="text-lg font-semibold">Estado de la conexión</h2>
        <p
          className={`mt-2 text-2xl font-bold ${
            estado.ok ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {estado.ok ? "Conexión con Supabase correcta" : "Conexión fallida"}
        </p>
        <p className="mt-2 break-words text-sm text-slate-700">
          {estado.detalle}
        </p>
      </section>

      <p className="text-sm text-slate-500">
        Pantalla de verificación. Todavía no hay funcionalidad de negocio.
      </p>
    </main>
  );
}
