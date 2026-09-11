import type { Metadata } from "next";

import { BotonEnlace } from "@/components/ui/Boton";

export const metadata: Metadata = { title: "Cómo funciona" };

const PASOS = [
  {
    titulo: "Armás tu ficha",
    texto:
      "Elegís tus habilidades y tus áreas de interés de un catálogo, y cargás tu formación en curso o terminada. No hay currículum que redactar ni PDF que subir: tu perfil son las cosas que sabés hacer.",
  },
  {
    titulo: "Ves lo que coincide con vos",
    texto:
      "Las búsquedas abiertas se ordenan por cuánto de lo que piden ya tenés. La compatibilidad nunca aparece sola: al lado están las etiquetas que la explican, para que puedas verificar el número.",
  },
  {
    titulo: "Te postulás en un paso",
    texto:
      "Sin formularios repetidos. Una vez enviada, seguís el proceso desde tu cuenta: enviada, en revisión y resolución. Si cambiás de idea, podés cancelar mientras la empresa no haya resuelto.",
  },
  {
    titulo: "Conocés equipos en persona",
    texto:
      "Las empresas y las instituciones educativas publican charlas, talleres y ferias. La inscripción es gratuita y entrás con el mismo perfil.",
  },
];

export default function PaginaComoFunciona() {
  return (
    <article>
      <h1 className="text-[34px] leading-tight text-tinta">
        Tu perfil son tus habilidades, no un currículum
      </h1>

      <p className="mt-4 text-[17px] leading-relaxed text-apagado">
        LinkYouth existe por un problema concreto: casi todas las ofertas piden
        experiencia previa, y quien busca su primera oportunidad no la tiene
        todavía. Acá el punto de partida es otro: qué sabés hacer y qué estás
        estudiando.
      </p>

      <div className="mt-12 divide-y divide-filete border-y border-filete">
        {PASOS.map((paso) => (
          <section key={paso.titulo} className="py-6">
            <h2 className="text-[20px] text-tinta">{paso.titulo}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-apagado">
              {paso.texto}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-[20px] text-tinta">En qué estamos</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-apagado">
          El proyecto está en construcción. Hoy podés recorrer el feed de
          vacantes y eventos, tu ficha y el seguimiento de postulaciones. El
          registro y el inicio de sesión todavía no están, así que lo que se ve
          sin cuenta es contenido de demostración, y la pantalla lo aclara cada
          vez que lo es.
        </p>
      </section>

      <div className="mt-10">
        <BotonEnlace href="/empleos" variante="primario">
          Ver las búsquedas abiertas
        </BotonEnlace>
      </div>
    </article>
  );
}
