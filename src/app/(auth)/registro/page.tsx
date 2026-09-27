import type { Metadata } from "next";
import Link from "next/link";

import { FormularioRegistro } from "@/components/auth/FormularioRegistro";
import { FormularioRegistroEmpresa } from "@/components/auth/FormularioRegistroEmpresa";
import { PestanasDeCuenta } from "@/components/auth/PestanasDeCuenta";
import { TarjetaDeAcceso } from "@/components/auth/TarjetaDeAcceso";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { obtenerCatalogos } from "@/lib/data/consultas";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";
import { conSiguiente, destinoSeguro } from "@/lib/navegacion";

export const metadata: Metadata = { title: "Crear cuenta" };

type Tipo = "individual" | "empresa";

const BAJADA: Record<Tipo, string> = {
  individual: "Tu primer empleo, prácticas y eventos, en un solo lugar.",
  empresa: "Publicá búsquedas y encontrá gente que recién empieza.",
};

export default async function PaginaRegistro({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; next?: string }>;
}) {
  const { tipo, next } = await searchParams;
  const activo: Tipo = tipo === "empresa" ? "empresa" : "individual";
  // A dónde se vuelve con la cuenta creada: la vacante desde la que se tocó
  // «Postularme», por ejemplo. Solo aplica a la cuenta individual —una
  // empresa no se postula— y solo si es una ruta interna.
  const siguiente = activo === "individual" ? destinoSeguro(next) : null;

  // El catálogo de intereses lo lee el servidor: `tags_lectura_publica` no
  // pide sesión, así que se puede leer antes de que la cuenta exista.
  const catalogos = await obtenerCatalogos();

  // La fecha límite se calcula acá, con el reloj del servidor, y viaja como
  // dato. Si la calculara el formulario, el servidor y el navegador podrían
  // estar en husos distintos y el atributo no coincidiría al hidratar.
  const fechaMaxima = ReglasDeRegistro.fechaMaximaDeNacimiento(new Date());

  return (
    <TarjetaDeAcceso
      ancha
      titulo="Creá tu cuenta"
      bajada={
        <>
          <p>{BAJADA[activo]}</p>
          {siguiente && (
            <p className="mt-2 text-tinta">
              Con tu cuenta creada, volvés a donde estabas para terminar lo que
              empezaste.
            </p>
          )}
        </>
      }
      alternativa={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link
            href={conSiguiente("/login", siguiente)}
            className="font-semibold text-acento underline-offset-4 hover:underline"
          >
            Iniciá sesión
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <PestanasDeCuenta
          activo={activo}
          destinos={{
            individual: conSiguiente("/registro", siguiente),
            empresa: "/registro?tipo=empresa",
          }}
        />

        {activo === "individual" && <AvisoOrigen resultado={catalogos} />}

        {activo === "empresa" ? (
          <FormularioRegistroEmpresa />
        ) : (
          <FormularioRegistro
            intereses={catalogos.datos.tags}
            interesesDeEjemplo={catalogos.origen === "ejemplo"}
            fechaMaximaDeNacimiento={fechaMaxima}
            siguiente={siguiente}
          />
        )}
      </div>
    </TarjetaDeAcceso>
  );
}
