import type { Metadata } from "next";
import Link from "next/link";

import {
  CREAR_CUENTA,
  CabeceraLanding,
  ENTRAR,
} from "@/components/landing/CabeceraLanding";
import { CarruselEmpresas } from "@/components/landing/CarruselEmpresas";
import { FormularioConsulta } from "@/components/landing/FormularioConsulta";
import { MenuDeAcceso } from "@/components/landing/MenuDeAcceso";
import { PreguntasFrecuentes } from "@/components/landing/PreguntasFrecuentes";
import { PieDeSitio } from "@/components/layout/PieDeSitio";
import { obtenerEmpresas } from "@/lib/data/consultas";

export const metadata: Metadata = {
  title: "LinkYouth — tu primer empleo, sin currículum",
  description:
    "Plataforma de primer empleo, formación y networking para jóvenes. Tu perfil son tus habilidades acreditadas.",
};

/**
 * Se renderiza por request: lee las organizaciones publicadas, que cambian sin
 * que nadie vuelva a compilar.
 */
export const dynamic = "force-dynamic";

/**
 * Los tres pasos son una secuencia real, así que van numerados. Es la única
 * lista de la aplicación que lo está: numerar lo que no es una secuencia es
 * uno de los tics que la dirección de diseño evita.
 */
const PASOS = [
  {
    titulo: "Armás tu ficha",
    texto:
      "Elegís tus habilidades y tus intereses de un catálogo, y cargás tu formación. Sin currículum que redactar ni PDF que subir.",
  },
  {
    titulo: "Ves lo que coincide con vos",
    texto:
      "Las búsquedas abiertas se ordenan por cuánto de lo que piden ya tenés, y siempre se ve qué etiquetas explican ese número.",
  },
  {
    titulo: "Seguís el proceso",
    texto:
      "Te postulás en un paso y mirás en qué etapa está cada postulación: enviada, en revisión y resolución.",
  },
];

function Seccion({
  id,
  titulo,
  bajada,
  children,
}: {
  id: string;
  titulo: string;
  bajada?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-t border-borde py-14 sm:py-16 lg:scroll-mt-20"
    >
      <h2 className="text-[26px] text-tinta sm:text-[30px]">{titulo}</h2>
      {bajada && (
        <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-apagado">
          {bajada}
        </p>
      )}
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default async function Portada() {
  const empresas = await obtenerEmpresas();

  return (
    <div className="flex min-h-dvh flex-col">
      <CabeceraLanding />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 sm:px-6">
        <section
          id="que-es"
          className="scroll-mt-28 py-16 sm:scroll-mt-20 sm:py-24"
        >
          <p className="text-[15px] text-apagado">
            Primer empleo, formación y networking
          </p>

          <h1 className="mt-3 max-w-3xl text-[36px] leading-[1.1] text-tinta sm:text-[52px]">
            Tu perfil son tus habilidades, no un currículum
          </h1>

          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-apagado">
            Casi todas las ofertas piden experiencia previa, y quien busca su
            primera oportunidad todavía no la tiene. LinkYouth parte de otro
            lado: qué sabés hacer y qué estás estudiando, declarado sobre un
            catálogo común que hace comparables dos perfiles junior.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <MenuDeAcceso
              etiqueta="Crear mi cuenta"
              opciones={CREAR_CUENTA}
              destacado
            />
            <MenuDeAcceso etiqueta="Ya tengo cuenta" opciones={ENTRAR} />
            <Link
              href="/como-funciona"
              className="rounded-control px-3 py-1.5 text-[14px] text-apagado transition-[color] duration-150 hover:text-tinta"
            >
              Ver el detalle
            </Link>
          </div>
        </section>

        <Seccion
          id="como-funciona"
          titulo="Cómo funciona"
          bajada="Tres pasos, y ninguno pide un documento que todavía no tenés."
        >
          <ol className="grid gap-6 sm:grid-cols-3">
            {PASOS.map((paso, indice) => (
              <li key={paso.titulo}>
                <span className="cifra block text-[28px] text-acento">
                  {indice + 1}
                </span>
                <h3 className="mt-2 text-[18px] text-tinta">{paso.titulo}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-apagado">
                  {paso.texto}
                </p>
              </li>
            ))}
          </ol>
        </Seccion>

        <Seccion
          id="empresas"
          titulo="Quiénes publican"
          bajada="Organizaciones que buscan perfiles junior y organizan instancias de formación."
        >
          {empresas.origen === "ejemplo" && (
            <p className="mb-4 border-l-2 border-tinta bg-realce px-4 py-3 text-[14px] text-apagado">
              <span className="font-semibold text-tinta">
                Contenido de demostración.
              </span>{" "}
              Todavía no hay base cargada, así que estas organizaciones son de
              ejemplo.
            </p>
          )}

          <CarruselEmpresas empresas={empresas.datos} />

          <p className="mt-6 text-[15px] text-apagado">
            ¿Tu organización busca perfiles junior?{" "}
            <Link
              href="/empresas"
              className="font-medium text-acento hover:underline"
            >
              Qué ofrece LinkYouth del lado de la empresa
            </Link>
            .
          </p>
        </Seccion>

        <Seccion
          id="preguntas"
          titulo="Preguntas frecuentes"
          bajada="Lo que más nos preguntan antes de crear la cuenta."
        >
          <PreguntasFrecuentes />
        </Seccion>

        <Seccion
          id="contacto"
          titulo="Consultas"
          bajada="Si algo no queda claro, escribinos."
        >
          <div className="max-w-2xl">
            <FormularioConsulta />
          </div>
        </Seccion>
      </main>

      <PieDeSitio area="publico" />
    </div>
  );
}
