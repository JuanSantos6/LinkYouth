import {
  BotonMarcarAvisoLeido,
  BotonMarcarTodosLeidos,
  EnlaceDeAviso,
} from "@/components/avisos/ControlesDeAviso";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Aviso, Resultado } from "@/lib/data/tipos";
import { TipoDeAviso, type TonoDeAviso } from "@/lib/dominio/TipoDeAviso";
import { tiempoRelativo } from "@/lib/formato";

const ESTILO_ROTULO: Record<TonoDeAviso, string> = {
  logro:
    "rounded-full border border-coincide-borde bg-superficie px-2.5 py-0.5 font-semibold text-turquesa-texto",
  baja: "rounded-full border border-borde-control/70 bg-superficie px-2.5 py-0.5 font-medium text-apagado",
  novedad: "font-semibold text-acento",
  neutro: "font-medium text-apagado",
};

const SIMBOLO_ROTULO: Record<TonoDeAviso, React.ReactNode> = {
  logro: <span aria-hidden="true">✓</span>,
  baja: <span aria-hidden="true">—</span>,
  novedad: (
    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-acento" />
  ),
  neutro: null,
};

const FILA_SIN_LEER: Record<TonoDeAviso, string> = {
  logro:
    "border-l-4 border-turquesa-texto bg-superficie px-3.5 rounded-r-ficha",
  baja: "border-l-4 border-borde-control bg-realce px-3.5 rounded-r-ficha",
  novedad: "border-l-2 border-acento pl-3",
  neutro: "border-l-2 border-acento pl-3",
};

/**
 * RF6.1 y RF6.2 — Bandeja de avisos compartida entre la cuenta del joven y la
 * de la empresa.
 *
 * El tipo, su etiqueta y su tono salen de `TipoDeAviso`. Los avisos sin leer
 * llevan filete a la izquierda y texto «Sin leer» para lectores de pantalla;
 * los de tono `logro` y `baja` suman fondo propio y rótulo en píldora para
 * distinguirse de un vistazo.
 */
export function BandejaDeAvisos({
  avisos,
  descripcion = "Lo que pasó con tus postulaciones, de lo más reciente a lo más viejo.",
  descripcionVacia = "Cuando una empresa mueva alguna de tus postulaciones, te avisamos acá.",
}: {
  avisos: Resultado<Aviso[]>;
  descripcion?: string;
  descripcionVacia?: string;
}) {
  const esEjemplo = avisos.origen === "ejemplo";
  const haySinLeer = avisos.datos.some((aviso) => !aviso.leida);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Avisos"
        descripcion={descripcion}
        acciones={
          haySinLeer ? (
            <BotonMarcarTodosLeidos esEjemplo={esEjemplo} />
          ) : undefined
        }
      />

      <AvisoOrigen resultado={avisos} />

      <section>
        {avisos.datos.length === 0 ? (
          <EstadoVacio
            titulo="No tenés avisos"
            descripcion={descripcionVacia}
          />
        ) : (
          <ul className="divide-y divide-filete border-y border-filete">
            {avisos.datos.map((aviso) => {
              const tipo = new TipoDeAviso(aviso.tipo);

              return (
                <li
                  key={aviso.id}
                  className={`flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3 ${
                    aviso.leida ? "" : FILA_SIN_LEER[tipo.tono]
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[13px] ${ESTILO_ROTULO[tipo.tono]}`}
                      >
                        {SIMBOLO_ROTULO[tipo.tono]}
                        {tipo.etiqueta}
                      </span>
                      {!aviso.leida && (
                        <span className="sr-only">Sin leer</span>
                      )}
                      <span className="text-[13px] text-apagado">
                        {tiempoRelativo(aviso.creada_en)}
                      </span>
                    </div>

                    <p
                      className={`text-[15px] text-tinta ${
                        aviso.leida ? "" : "font-medium"
                      }`}
                    >
                      {aviso.mensaje}
                    </p>
                  </div>

                  <div className="-ml-3 flex flex-wrap items-center gap-1 sm:ml-0 sm:shrink-0 sm:gap-2">
                    {!aviso.leida && (
                      <BotonMarcarAvisoLeido
                        id={aviso.id}
                        esEjemplo={esEjemplo}
                      />
                    )}
                    {aviso.enlace && (
                      <EnlaceDeAviso
                        id={aviso.id}
                        href={aviso.enlace}
                        leida={aviso.leida}
                        esEjemplo={esEjemplo}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
