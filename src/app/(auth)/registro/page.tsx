import type { Metadata } from "next";
import Link from "next/link";

import { FormularioRegistro } from "@/components/auth/FormularioRegistro";
import { FormularioRegistroEmpresa } from "@/components/auth/FormularioRegistroEmpresa";
import { Tarjeta } from "@/components/ui/Tarjeta";

export const metadata: Metadata = { title: "Crear cuenta" };

type Tipo = "individual" | "empresa";

const OPCIONES: { tipo: Tipo; etiqueta: string; destino: string }[] = [
  { tipo: "individual", etiqueta: "Busco trabajo", destino: "/registro" },
  {
    tipo: "empresa",
    etiqueta: "Ofrezco trabajo",
    destino: "/registro?tipo=empresa",
  },
];

const BAJADA: Record<Tipo, string> = {
  individual: "Tu primer empleo, prácticas y eventos, en un solo lugar.",
  empresa: "Publicá búsquedas y encontrá gente que recién empieza.",
};

/**
 * Elegir entre los dos registros son dos enlaces, no estado del cliente: cada
 * variante tiene su URL, se puede compartir y volver atrás funciona. Mismo
 * criterio que las pestañas del feed.
 */
function Selector({ activo }: { activo: Tipo }) {
  return (
    <div role="group" aria-label="Tipo de cuenta" className="flex gap-1.5">
      {OPCIONES.map(({ tipo, etiqueta, destino }) => {
        const seleccionado = tipo === activo;

        return (
          <Link
            key={tipo}
            href={destino}
            aria-current={seleccionado ? "page" : undefined}
            className={`flex-1 rounded-control border px-3 py-2 text-center text-[14px] font-semibold transition-colors duration-150 ${
              seleccionado
                ? "border-acento bg-acento-tenue text-acento"
                : "border-borde bg-superficie text-apagado hover:border-borde-control"
            }`}
          >
            {etiqueta}
          </Link>
        );
      })}
    </div>
  );
}

export default async function PaginaRegistro({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const activo: Tipo = tipo === "empresa" ? "empresa" : "individual";

  return (
    <>
      <div>
        <h1 className="text-[26px] text-tinta">Creá tu cuenta</h1>
        <p className="mt-1 text-[14px] text-apagado">{BAJADA[activo]}</p>
      </div>

      <Selector activo={activo} />

      <Tarjeta className="p-6">
        {activo === "empresa" ? (
          <FormularioRegistroEmpresa />
        ) : (
          <FormularioRegistro />
        )}
      </Tarjeta>

      <p className="text-center text-[14px] text-apagado">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-acento">
          Iniciá sesión
        </Link>
      </p>
    </>
  );
}
