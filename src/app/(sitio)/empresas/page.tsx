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

      <section className="mt-12">
        <h2 className="text-[20px] text-tinta">Qué está disponible hoy</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-apagado">
          El modelo de datos de la empresa —vacantes, etiquetas ocultas,
          postulaciones y eventos— ya está construido, con sus reglas de acceso
          escritas en la base. El panel para operarlo todavía no: es el próximo
          tramo del proyecto. Si querés seguirlo o proponer algo, el código está
          abierto.
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
