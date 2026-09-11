import type { Metadata } from "next";

export const metadata: Metadata = { title: "Legales" };

/**
 * Términos, privacidad y accesibilidad.
 *
 * El texto describe lo que el proyecto hace hoy y lo que todavía no, sin
 * prometer garantías que nadie revisó: LinkYouth es un proyecto académico en
 * construcción y decirlo es parte de tratar bien los datos de quien lo usa.
 */
export default function PaginaLegales() {
  return (
    <article className="space-y-12">
      <header>
        <h1 className="text-[34px] leading-tight text-tinta">Legales</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-apagado">
          LinkYouth es un proyecto en desarrollo. Este documento cuenta cómo se
          usa la plataforma y qué pasa con tus datos, en el estado en el que
          está hoy.
        </p>
      </header>

      <section id="terminos" className="scroll-mt-20">
        <h2 className="text-[22px] text-tinta">Términos de uso</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-apagado">
          <p>
            La plataforma conecta a personas que buscan su primera experiencia
            laboral con organizaciones que publican oportunidades y eventos.
            LinkYouth no es parte de la relación laboral que pueda surgir: no
            interviene en la contratación ni garantiza el resultado de ninguna
            postulación.
          </p>
          <p>
            Para tener una cuenta individual hay que ser mayor de 18 años. La
            base de datos lo verifica contra la fecha de nacimiento al crear el
            perfil.
          </p>
          <p>
            El contenido que publica cada organización es responsabilidad de esa
            organización. Si algo te parece incorrecto o abusivo, escribinos por
            el repositorio del proyecto.
          </p>
        </div>
      </section>

      <section id="privacidad" className="scroll-mt-20">
        <h2 className="text-[22px] text-tinta">Privacidad de tus datos</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-apagado">
          <p>
            Guardamos lo que cargás en tu ficha: nombre, apellido, fecha de
            nacimiento, país, biografía, foto, tus habilidades e intereses, tu
            formación declarada y tus postulaciones. Tu perfil es público dentro
            de la plataforma, porque es lo que mira una empresa; tu correo y tu
            contraseña no lo son.
          </p>
          <p>
            El control de acceso está escrito como reglas en la propia base de
            datos, no solo en la pantalla: cada fila declara quién puede leerla
            y quién puede modificarla.
          </p>
          <p>
            Los datos se alojan en un proyecto de Supabase en la región
            us-east-2 (Ohio, Estados Unidos). Es información que tiene que estar
            dicha: implica una transferencia internacional de datos personales
            que hay que revisar contra la Ley N.º 18.331 antes de que la
            plataforma salga a producción. Esa revisión está pendiente, y hasta
            que ocurra conviene no cargar datos que no quieras compartir.
          </p>
          <p>
            Si borrás tu cuenta, se eliminan los datos asociados a ella. Las
            postulaciones cambian de estado pero no se borran, porque forman
            parte del historial del proceso de la empresa.
          </p>
        </div>
      </section>

      <section id="accesibilidad" className="scroll-mt-20">
        <h2 className="text-[22px] text-tinta">Accesibilidad</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-apagado">
          <p>
            La interfaz se puede recorrer entera con teclado y el foco es
            siempre visible. Ningún estado se comunica solo con color: lo
            acreditado lleva además una marca y una palabra, y los errores se
            distinguen por peso y por texto.
          </p>
          <p>
            Respetamos la preferencia de movimiento reducido del sistema: si la
            tenés activada, no vas a ver ninguna transición.
          </p>
          <p>
            Si encontrás algo que no podés usar, contalo en el repositorio.
            Arreglarlo entra antes que cualquier función nueva.
          </p>
        </div>
      </section>
    </article>
  );
}
