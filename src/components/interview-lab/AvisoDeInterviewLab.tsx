import { EnlaceTransicion } from "@/components/navegacion/Transiciones";
import { testDe } from "@/lib/dominio/InterviewLab";

/**
 * El aviso del inicio mientras falta el test obligatorio del Interview Lab
 * (migración 010). Recuerda, no bloquea: postularse sigue igual. Lavanda,
 * como el resto de las invitaciones.
 */
export function AvisoDeInterviewLab() {
  const test = testDe("personalidad");

  return (
    <aside
      aria-label="Interview Lab"
      className="flex flex-wrap items-center justify-between gap-3 rounded-tarjeta border border-acento/40 bg-lavanda px-5 py-4"
    >
      <p className="max-w-[56ch] text-[14.5px] text-tinta">
        <span className="font-semibold">
          Te falta el {test.nombre.toLowerCase()}.
        </span>{" "}
        Es el único obligatorio del Interview Lab y lleva unos {test.minutos}{" "}
        minutos. Podés postularte igual.
      </p>
      <EnlaceTransicion
        href="/interview-lab#test-personalidad"
        className="text-[14.5px] font-semibold text-acento underline-offset-4 hover:underline"
      >
        Ir al Interview Lab
      </EnlaceTransicion>
    </aside>
  );
}
