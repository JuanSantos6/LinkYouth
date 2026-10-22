import type { Metadata } from "next";

import { BarraDeProgreso } from "@/components/interview-lab/BarraDeProgreso";
import { CargaDePersonalidad } from "@/components/interview-lab/CargaDePersonalidad";
import { CargaDeResultadoDeTest } from "@/components/interview-lab/CargaDeResultadoDeTest";
import { TarjetaDeTest } from "@/components/interview-lab/TarjetaDeTest";
import { Encabezado } from "@/components/layout/Encabezado";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { obtenerPerfilActual } from "@/lib/data/consultas";
import {
  CLAVES_OPCIONALES,
  ProgresoDeInterviewLab,
  testDe,
} from "@/lib/dominio/InterviewLab";

export const metadata: Metadata = { title: "Interview Lab" };
export const dynamic = "force-dynamic";

/**
 * Interview Lab (migración 010): los cuatro tests del joven, con el
 * obligatorio arriba y destacado, y la barra de progreso.
 *
 * Ningún test está integrado: cada botón abre el sitio del test en otra
 * pestaña y el joven vuelve a cargar acá lo que le dio. Es el único lugar
 * donde se cargan, editan, muestran u ocultan y borran los resultados.
 * «Obligatorio» no bloquea nada: postularse no depende de esto.
 */
export default async function PaginaInterviewLab() {
  const perfil = await obtenerPerfilActual();
  const { personalidad, tests } = perfil.datos;
  const esEjemplo = perfil.origen === "ejemplo";
  const progreso = ProgresoDeInterviewLab.de({ personalidad, tests });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Interview Lab"
        descripcion="Tests para conocerte mejor y llegar con más confianza a las entrevistas. Hacés cada uno en su sitio y cargás acá lo que te dio."
      />

      <AvisoOrigen resultado={perfil} />

      <BarraDeProgreso
        completados={progreso.completados}
        total={progreso.total}
        texto={progreso.texto}
      />

      <p className="rounded-ficha bg-realce px-4 py-3 text-[14px] text-tinta">
        Los resultados los cargás vos. LinkYouth no los valida y no los usa para
        calcular tu compatibilidad. Ninguna empresa los ve, salvo los que vos
        decidas mostrar, y solo las de las búsquedas a las que te postulaste.
      </p>

      <TarjetaDeTest
        test={testDe("personalidad")}
        completadoEl={progreso.completadoEl("personalidad")}
      >
        {!personalidad && (
          <p className="text-[14px] text-apagado">
            Es el único obligatorio: te lo recordamos en el inicio hasta que lo
            cargues. No hace falta para postularte.
          </p>
        )}
        <CargaDePersonalidad
          personalidad={personalidad}
          esEjemplo={esEjemplo}
        />
      </TarjetaDeTest>

      <div className="space-y-1 pt-2">
        <h2 className="text-[22px] font-extrabold text-tinta">Opcionales</h2>
        <p className="text-[14.5px] text-apagado">
          Tres tests de JobCannon, gratis y sin registrarte. Hacé los que
          quieras.
        </p>
      </div>

      {CLAVES_OPCIONALES.map((clave) => (
        <TarjetaDeTest
          key={clave}
          test={testDe(clave)}
          completadoEl={progreso.completadoEl(clave)}
        >
          <CargaDeResultadoDeTest
            test={clave}
            resultado={tests.find((t) => t.test === clave) ?? null}
            esEjemplo={esEjemplo}
          />
        </TarjetaDeTest>
      ))}
    </div>
  );
}
