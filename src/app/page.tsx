import type { Metadata } from "next";
import Link from "next/link";

import { CintaDeOrganizaciones } from "@/components/landing/CintaDeOrganizaciones";
import { PreguntasFrecuentes } from "@/components/landing/PreguntasFrecuentes";
import { CabeceraGlobal } from "@/components/layout/CabeceraGlobal";
import { IconoCamara } from "@/components/layout/Iconos";
import { PieDeSitio } from "@/components/layout/PieDeSitio";
import { AnimacionesDePortada } from "@/components/portada/AnimacionesDePortada";
import { Carrusel } from "@/components/portada/Carrusel";
import { FotoProvisional } from "@/components/portada/FotoProvisional";
import {
  SliderBienvenida,
  type Diapositiva,
} from "@/components/portada/SliderBienvenida";
import { TarjetasPasos, type Paso } from "@/components/portada/TarjetasPasos";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Foto } from "@/components/ui/Foto";
import {
  obtenerEmpresas,
  obtenerTipoCuenta,
  obtenerVacantes,
} from "@/lib/data/consultas";
import { etiquetaTipo, tiempoRelativo } from "@/lib/formato";
import { imagen } from "@/lib/imagenes";
import { areaDe } from "@/lib/navegacion";

export const metadata: Metadata = {
  title: "LinkYouth: tu primer trabajo empieza por lo que ya sabés hacer",
  description:
    "Plataforma de primer empleo, pasantías y eventos para jóvenes en Uruguay. Tu ficha son tus habilidades, no un currículum.",
};

/** Lee las organizaciones y las búsquedas publicadas, que cambian sin recompilar. */
export const dynamic = "force-dynamic";

const SECCIONES = [
  { href: "#nosotros", etiqueta: "Nosotros" },
  { href: "#como-funciona", etiqueta: "Cómo funciona" },
  { href: "#busquedas", etiqueta: "Búsquedas" },
  { href: "#opiniones", etiqueta: "Opiniones" },
  { href: "#preguntas", etiqueta: "Preguntas" },
] as const;

const DIAPOSITIVAS: Diapositiva[] = [
  {
    antetitulo: "Para quienes buscan su primer trabajo",
    titulo: "Tu primer trabajo empieza por lo que ya sabés hacer",
    texto:
      "Sin currículum ni experiencia previa: elegís tus habilidades e intereses, y cada búsqueda te muestra cuánto coincidís.",
    acciones: [
      { href: "/registro", etiqueta: "Crear mi cuenta", primaria: true },
      { href: "#como-funciona", etiqueta: "Ver cómo funciona" },
    ],
    imagen: imagen("portada-estudiantes"),
  },
  {
    antetitulo: "Para empresas",
    titulo: "Empresas que apuestan por gente que recién empieza",
    texto:
      "Publicás tu búsqueda y ves, requisito por requisito, qué tiene cada perfil junior.",
    acciones: [
      {
        href: "/empresas#publicar",
        etiqueta: "Publicar una búsqueda",
        primaria: true,
      },
      { href: "#busquedas", etiqueta: "Ver búsquedas abiertas" },
    ],
    imagen: imagen("portada-pasante"),
  },
  {
    antetitulo: "Eventos para crecer",
    titulo: "Talleres y charlas para dar tus primeros pasos",
    texto:
      "Organizados por empresas e instituciones. La inscripción es gratuita y entrás con tu misma ficha.",
    acciones: [
      { href: "/eventos", etiqueta: "Ver próximos eventos", primaria: true },
      { href: "#nosotros", etiqueta: "Conocernos" },
    ],
    foto: {
      que: "un taller de LinkYouth en la Universidad de Montevideo",
      tono: "mandarina",
      semilla: 3,
    },
  },
];

const BENEFICIOS = [
  {
    titulo: "Tu ficha, no un currículum",
    texto:
      "Elegís habilidades e intereses de un catálogo común y sumás tu formación.",
  },
  {
    titulo: "Búsquedas que coinciden",
    texto:
      "Cada vacante te muestra qué tenés de lo que pide, requisito por requisito.",
  },
  {
    titulo: "Eventos para crecer",
    texto:
      "Talleres y charlas de empresas e instituciones, con inscripción gratuita.",
  },
  {
    titulo: "Seguís tu postulación",
    texto: "Enviada, en revisión, resolución: siempre sabés en qué etapa está.",
  },
];

const PASOS: Paso[] = [
  {
    titulo: "Armá tu ficha",
    texto:
      "Elegís tus habilidades e intereses de un catálogo común y sumás lo que estás estudiando. En cinco minutos, desde el teléfono.",
    foto: {
      que: "una captura real de la ficha en el teléfono",
      tono: "turquesa",
      semilla: 11,
    },
  },
  {
    titulo: "Encontrá lo que coincide con vos",
    texto:
      "Cada búsqueda te dice qué tenés de lo que pide, requisito por requisito, y las que más coinciden aparecen primero. No hay números misteriosos: siempre ves qué habilidades explican cada resultado, así sabés qué te conviene aprender para las próximas.",
    imagen: imagen("portada-busqueda"),
  },
  {
    titulo: "Postulate en un paso",
    texto:
      "Un toque y listo. Después seguís en qué etapa está: enviada, en revisión y resolución, sin quedarte esperando a ciegas.",
    imagen: imagen("portada-primer-dia"),
  },
];

/**
 * Opiniones de EJEMPLO. Todavía no hay personas usando LinkYouth, así que no
 * hay opiniones reales: estas muestran el lugar y el formato, y la pantalla
 * lo dice en cada una. Se reemplazan por opiniones verdaderas, con permiso
 * de quien las da. Ver `docs/decisiones.md`, 2026-09-27.
 */
const OPINIONES_DE_EJEMPLO = [
  {
    texto:
      "Nunca había trabajado y no sabía qué poner en un currículum. Acá elegí lo que sé hacer y me aparecieron búsquedas que sí eran para mí.",
    quien: "[Nombre de ejemplo]",
    rol: "Joven que busca su primera pasantía",
  },
  {
    texto:
      "Publicamos una pasantía y en lugar de leer currículums vimos directamente qué tenía cada persona de lo que pedíamos.",
    quien: "[Empresa de ejemplo]",
    rol: "Empresa de tecnología",
  },
  {
    texto:
      "Me anoté a un taller de portfolio por LinkYouth y salí con devoluciones concretas para mejorar.",
    quien: "[Nombre de ejemplo]",
    rol: "Estudiante de diseño",
  },
  {
    texto:
      "Saber en qué etapa estaba cada postulación me sacó la ansiedad de no tener respuesta.",
    quien: "[Nombre de ejemplo]",
    rol: "Joven que se postuló por primera vez",
  },
];

function TituloSeccion({
  id,
  titulo,
  bajada,
}: {
  id: string;
  titulo: string;
  bajada?: string;
}) {
  return (
    <div data-revelar className="mb-8 max-w-[720px] space-y-3">
      <h2
        id={id}
        className="text-[32px] leading-[1.08] font-extrabold text-tinta sm:text-[44px]"
      >
        {titulo}
      </h2>
      {bajada && (
        <p className="text-[17px] text-apagado sm:text-[18px]">{bajada}</p>
      )}
    </div>
  );
}

/**
 * La portada: la página de presentación, y la única con animaciones ligadas
 * al scroll (`AnimacionesDePortada`). Todo el contenido se lee sin
 * JavaScript y con «reducir movimiento» queda quieto y completo.
 */
export default async function Portada() {
  const [empresas, tipo, vacantes] = await Promise.all([
    obtenerEmpresas(),
    obtenerTipoCuenta(),
    obtenerVacantes({ limite: 8 }),
  ]);
  const area = areaDe(tipo);

  return (
    <div id="arriba" className="flex min-h-dvh flex-col">
      <AnimacionesDePortada />
      <CabeceraGlobal area={area} secciones={SECCIONES} />

      <main className="flex-1">
        <div className="relative">
          <section
            id="bienvenida"
            aria-label="Bienvenida"
            className="sticky top-0 z-0 h-[calc(100svh-64px)] min-h-[600px] overflow-hidden bg-[#15132A]"
          >
            <div
              id="bienvenida-interior"
              className="absolute inset-0 origin-[50%_35%] will-change-transform"
            >
              <SliderBienvenida diapositivas={DIAPOSITIVAS} />
            </div>
          </section>

          <section
            id="nosotros"
            aria-labelledby="t-todo"
            className="relative z-[1] -mt-9 rounded-t-[36px] bg-papel pt-16 pb-20 shadow-[0_-24px_60px_-30px_rgb(0_0_0/0.35)] sm:pt-20"
          >
            <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
              <TituloSeccion
                id="t-todo"
                titulo="Todo lo que necesitás para conseguir tu primer trabajo"
                bajada="Sin currículum y sin experiencia previa. Partís de lo que sabés hacer y de lo que estás estudiando."
              />
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {BENEFICIOS.map((beneficio) => (
                  <li
                    key={beneficio.titulo}
                    data-revelar
                    className="rounded-[20px] border border-borde bg-superficie p-6"
                  >
                    <h3 className="text-[19px] text-tinta">
                      {beneficio.titulo}
                    </h3>
                    <p className="mt-2 text-[15px] text-apagado">
                      {beneficio.texto}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-20 grid items-center gap-8 md:grid-cols-2">
                <div
                  data-revelar
                  className="aspect-[4/3] overflow-hidden rounded-[28px]"
                >
                  <FotoProvisional
                    que="el equipo de LinkYouth"
                    tono="mixto"
                    semilla={7}
                  />
                </div>
                <div data-revelar className="space-y-4">
                  <h2 className="text-[30px] leading-tight font-extrabold text-tinta sm:text-[40px]">
                    Nosotros
                  </h2>
                  <p className="text-[17px] leading-relaxed text-apagado">
                    LinkYouth nace en el Taller de Proyectos TIC de la
                    Universidad de Montevideo, creado por un equipo de
                    estudiantes que vivió de cerca lo difícil que es conseguir
                    el primer trabajo.
                  </p>
                  <p className="text-[17px] leading-relaxed text-apagado">
                    Por eso partimos de otro lado: de lo que ya sabés hacer,
                    declarado sobre un catálogo común que hace comparables dos
                    perfiles junior.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section
          id="como-funciona"
          aria-labelledby="t-pasos"
          className="relative z-[1] bg-papel py-20 sm:py-24"
        >
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
            <TituloSeccion
              id="t-pasos"
              titulo="Así funciona"
              bajada="Tres pasos, en este orden."
            />
            <TarjetasPasos pasos={PASOS} />
          </div>
        </section>

        <section
          id="busquedas"
          aria-labelledby="t-busquedas"
          className="relative z-[1] bg-papel"
        >
          <div
            data-ic-escenario
            className="relative px-4 py-10 md:h-[100svh] md:overflow-hidden md:p-0"
          >
            <div
              data-ic-lienzo
              className="absolute inset-x-4 inset-y-10 overflow-hidden rounded-[28px] md:inset-0 md:rounded-none"
            >
              <Foto imagen={imagen("portada-feria")} sizes="100vw" />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgb(21_19_42/0.85)_0%,rgb(21_19_42/0.72)_55%,rgb(21_19_42/0.88)_100%)]"
              />
            </div>

            <div className="relative md:absolute md:inset-0 md:flex md:items-center md:justify-center">
              <div
                data-ic-contenido
                className="grid grid-cols-[minmax(0,1fr)] gap-6 p-6 text-white sm:p-8 md:h-[min(640px,78%)] md:w-[min(1120px,calc(100%-32px))] md:grid-rows-[1fr_auto]"
              >
                <Carrusel
                  etiqueta="Búsquedas abiertas"
                  claro
                  className="md:h-full md:content-between"
                  controlesArriba={
                    <div className="max-w-xl space-y-2">
                      <h2
                        id="t-busquedas"
                        className="text-[26px] leading-tight font-extrabold text-white sm:text-[40px]"
                      >
                        Búsquedas abiertas ahora
                      </h2>
                      <p className="text-[#E6E3F2]">
                        Publicadas por empresas que apuestan por gente que
                        recién empieza.
                      </p>
                    </div>
                  }
                >
                  {vacantes.datos.map((vacante) => (
                    <Link
                      key={vacante.id}
                      href={`/empleos/${vacante.id}`}
                      className="grid w-[min(320px,80vw)] shrink-0 snap-start content-start gap-2.5 rounded-[20px] border border-borde bg-superficie p-5 text-tinta transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <span className="flex flex-wrap gap-x-3 text-[13px] text-apagado">
                        <span>{vacante.empresa.razon_social}</span>
                        <span>{etiquetaTipo(vacante.tipo)}</span>
                        <span>{tiempoRelativo(vacante.creada_en)}</span>
                      </span>
                      <span className="font-titulo text-[19px] leading-snug font-bold">
                        {vacante.titulo}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        {[...vacante.habilidades, ...vacante.tags]
                          .slice(0, 2)
                          .map((requisito) => (
                            <Etiqueta key={requisito}>{requisito}</Etiqueta>
                          ))}
                      </span>
                      <span className="text-[14px] font-semibold text-acento underline decoration-2 underline-offset-4">
                        Ver la búsqueda
                      </span>
                    </Link>
                  ))}
                </Carrusel>
                {vacantes.origen === "ejemplo" && (
                  <p className="text-[13.5px] text-[#E6E3F2]">
                    Estas búsquedas son de demostración: todavía no hay empresas
                    publicando.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          id="empresas"
          aria-labelledby="t-empresas"
          className="relative z-[1] bg-papel py-20"
        >
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
            <TituloSeccion
              id="t-empresas"
              titulo="Quiénes publican"
              bajada="Organizaciones que buscan perfiles junior y organizan instancias de formación."
            />
            {empresas.origen === "ejemplo" && (
              <p className="mb-4 border-l-2 border-borde-control pl-3 text-[14px] text-apagado">
                <span className="font-semibold text-tinta">
                  Contenido de demostración.
                </span>{" "}
                Todavía no hay base cargada, así que estas organizaciones son de
                ejemplo.
              </p>
            )}
          </div>
          {/* La cinta ocupa todo el ancho de la página, fuera del contenedor. */}
          <div data-revelar>
            <CintaDeOrganizaciones
              empresas={empresas.datos}
              deEjemplo={empresas.origen === "ejemplo"}
            />
          </div>
        </section>

        <section
          id="opiniones"
          aria-labelledby="t-opiniones"
          className="relative z-[1] bg-papel py-20"
        >
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
            <Carrusel
              etiqueta="Opiniones de ejemplo"
              controlesArriba={
                <div className="max-w-[720px] space-y-4">
                  <h2
                    id="t-opiniones"
                    className="text-[32px] leading-[1.08] font-extrabold text-tinta sm:text-[44px]"
                  >
                    Lo que cuentan quienes la usan
                  </h2>
                  <p className="flex items-start gap-2.5 rounded-ficha bg-lavanda p-4 text-[15px] text-tinta">
                    <span aria-hidden="true">✎</span>
                    <span>
                      <b>Opiniones de ejemplo.</b> Todavía no hay personas
                      usando LinkYouth, así que estos textos no son reales:
                      muestran el lugar y el formato. Se reemplazan por
                      opiniones verdaderas, con permiso de quien las da.
                    </span>
                  </p>
                </div>
              }
            >
              {OPINIONES_DE_EJEMPLO.map((opinion) => (
                <figure
                  key={opinion.texto}
                  className="m-0 grid w-[min(420px,86vw)] shrink-0 snap-start content-between gap-4 rounded-[24px] border-[1.5px] border-dashed border-borde-control bg-superficie p-6"
                >
                  <span className="justify-self-start rounded-full border-[1.5px] border-tinta px-2.5 py-0.5 text-[12px] font-bold text-tinta">
                    Ejemplo · no es una opinión real
                  </span>
                  <blockquote className="m-0 font-titulo text-[18px] leading-normal font-medium text-tinta">
                    «{opinion.texto}»
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-borde-control text-apagado"
                    >
                      <IconoCamara className="h-5 w-5" />
                    </span>
                    <span>
                      <b className="block text-tinta">{opinion.quien}</b>
                      <span className="text-[14px] text-apagado">
                        {opinion.rol}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </Carrusel>
          </div>
        </section>

        <section
          id="preguntas"
          aria-labelledby="t-preguntas"
          className="relative z-[1] bg-papel pt-8 pb-20"
        >
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
            <TituloSeccion id="t-preguntas" titulo="Preguntas frecuentes" />
            <div data-revelar>
              <PreguntasFrecuentes />
            </div>
          </div>
        </section>

        <section
          id="empezar"
          aria-labelledby="t-empezar"
          className="relative z-[1] bg-papel pb-8"
        >
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
            <div
              data-revelar
              className="grid gap-6 overflow-hidden rounded-[32px] bg-tinta p-8 text-papel sm:p-12 md:grid-cols-[1.15fr_0.85fr] md:items-center"
            >
              <div className="grid justify-items-start gap-4">
                <h2
                  id="t-empezar"
                  className="text-[30px] leading-tight font-extrabold text-papel sm:text-[42px]"
                >
                  Tu primer trabajo empieza acá
                </h2>
                <p className="max-w-[60ch] text-[17px] text-papel/85">
                  Armá tu ficha en cinco minutos y mirá qué búsquedas coinciden
                  con vos. ¿Tenés una consulta?{" "}
                  <Link
                    href="/contacto"
                    className="font-semibold text-papel underline underline-offset-4"
                  >
                    Escribinos
                  </Link>
                  .
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/registro"
                    className="rounded-control bg-mandarina px-5 py-3 text-[15px] font-semibold text-sobre-mandarina transition-[filter] duration-150 hover:brightness-[0.94]"
                  >
                    Crear mi cuenta
                  </Link>
                  <a
                    href="#arriba"
                    className="rounded-control border-[1.5px] border-papel/50 px-5 py-3 text-[15px] font-semibold text-papel transition-colors duration-150 hover:bg-papel/10"
                  >
                    Volver arriba
                  </a>
                </div>
              </div>
              <div className="aspect-[16/10] overflow-hidden rounded-[20px]">
                <Foto
                  imagen={imagen("portada-cierre")}
                  sizes="(min-width: 768px) 440px, 100vw"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <PieDeSitio area={area} />
    </div>
  );
}
