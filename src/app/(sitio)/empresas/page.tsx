import type { Metadata } from "next";

import { BotonEnlace } from "@/components/ui/Boton";

export const metadata: Metadata = { title: "Para empresas" };

const CAPACIDADES = [
  {
    titulo: "Publicás con dos clases de etiquetas",
    texto:
      "Las públicas cuentan qué buscás y ordenan el feed de quienes podrían encajar. Las ocultas son solo tuyas: sirven para puntuar la compatibilidad de cada postulante y ningún candidato las ve, ni desde la pantalla ni desde la API.",
  },
  {
    titulo: "Recibís perfiles, no currículums",
    texto:
      "Cada postulante llega con sus habilidades y su formación declaradas sobre un catálogo común. Eso hace comparables dos perfiles sin leer dos documentos con formatos distintos.",
  },
  {
    titulo: "Movés el estado y la persona se entera",
    texto:
      "En revisión, aceptada o rechazada. El cambio de estado avisa al postulante automáticamente, así el proceso deja de ser una espera a ciegas.",
  },
  {
    titulo: "Organizás eventos",
    texto:
      "Charlas, talleres y ferias para conocer gente antes de que haya una vacante abierta. Quien se inscribe queda vinculado a tu organización.",
  },
];

export default function PaginaEmpresas() {
  return (
    <article>
      <h1 className="text-[34px] leading-tight text-tinta">
        Perfiles junior, comparables entre sí
      </h1>

      <p className="mt-4 text-[17px] leading-relaxed text-apagado">
        Contratar perfiles sin experiencia es difícil justamente porque el
        currículum no dice mucho todavía. LinkYouth reemplaza ese documento por
        habilidades declaradas sobre un catálogo común.
      </p>

      <div className="mt-12 divide-y divide-filete border-y border-filete">
        {CAPACIDADES.map((capacidad) => (
          <section key={capacidad.titulo} className="py-6">
            <h2 className="text-[20px] text-tinta">{capacidad.titulo}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-apagado">
              {capacidad.texto}
            </p>
          </section>
        ))}
      </div>

      <section id="publicar" className="mt-12 scroll-mt-24 space-y-3">
        <h2 className="text-[24px] text-tinta">Publicar búsquedas</h2>
        <p className="text-[16px] leading-relaxed text-apagado">
          Creás una cuenta de empresa y ya podés ver tu panel. El formulario
          para publicar desde ahí todavía no está: mientras tanto, la primera
          búsqueda la cargamos con vos. Escribinos desde Contacto con el puesto,
          lo que pide y cuántas posiciones tenés.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <BotonEnlace href="/registro?tipo=empresa" variante="primario">
            Crear cuenta de empresa
          </BotonEnlace>
          <BotonEnlace href="/contacto#empresas">Escribirnos</BotonEnlace>
        </div>
      </section>

      <section id="planes" className="mt-12 scroll-mt-24 space-y-3">
        <h2 className="text-[24px] text-tinta">Planes y publicidad</h2>
        <p className="text-[16px] leading-relaxed text-apagado">
          Durante el piloto, LinkYouth es gratis para las empresas: publicar,
          recibir postulaciones y organizar eventos no tiene costo. No hay
          planes pagos ni vendemos publicidad. Si te interesa auspiciar un
          taller o una charla para jóvenes, contanos en Contacto.
        </p>
      </section>

      <div className="mt-10">
        <BotonEnlace href="/como-funciona">
          Cómo funciona del lado del postulante
        </BotonEnlace>
      </div>
    </article>
  );
}
