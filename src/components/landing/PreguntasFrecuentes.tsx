import { DetallesSuaves } from "@/components/ui/DetallesSuaves";

const PREGUNTAS = [
  {
    pregunta: "¿Necesito currículum para usar LinkYouth?",
    respuesta:
      "No. Tu perfil son tus habilidades y tu formación declaradas sobre un catálogo común. Eso es justamente lo que hace comparables dos perfiles sin experiencia: no hay documento que redactar ni formato que adivinar.",
  },
  {
    pregunta: "¿Qué edad necesito tener?",
    respuesta:
      "18 años cumplidos. La base de datos lo verifica contra tu fecha de nacimiento cuando creás el perfil, así que no es un pedido que se pueda saltear desde la pantalla.",
  },
  {
    pregunta: "¿Cuánto cuesta?",
    respuesta:
      "Nada para quien busca trabajo: crear el perfil, postularse e inscribirse a los eventos es gratis. LinkYouth es un proyecto en desarrollo y todavía no tiene modelo de cobro para las organizaciones.",
  },
  {
    pregunta: "¿Qué ve una empresa de mi perfil?",
    respuesta:
      "Tu nombre, tu foto, tu biografía, tus habilidades, tus intereses y tu formación. Tu correo y tu contraseña no: los guarda el sistema de autenticación y no forman parte del perfil público.",
  },
  {
    pregunta: "¿Cómo sé en qué está mi postulación?",
    respuesta:
      "La sección «Postulaciones» muestra el recorrido de cada proceso: enviada, en revisión y resolución. Cuando la empresa mueve el estado, la base genera un aviso para vos automáticamente.",
  },
  {
    pregunta: "Soy una organización, ¿ya puedo publicar?",
    respuesta:
      "Podés crear la cuenta y ver tu panel con tus búsquedas y eventos. El formulario para publicar desde ahí todavía está en construcción: mientras tanto, la primera búsqueda la cargamos con vos desde Contacto.",
  },
];

/**
 * Preguntas frecuentes.
 *
 * Cada una es un `<details>` (`DetallesSuaves`): abre y cierra sin
 * JavaScript, es enfocable con teclado y un lector de pantalla la anuncia
 * como lo que es. Con JavaScript, se despliega con transición.
 */
export function PreguntasFrecuentes() {
  return (
    <div className="divide-y divide-filete border-y border-filete">
      {PREGUNTAS.map(({ pregunta, respuesta }, indice) => (
        <DetallesSuaves
          key={pregunta}
          resumen={pregunta}
          abiertoAlInicio={indice === 0}
        >
          <p className="max-w-[70ch] pb-5 text-[16px] leading-relaxed text-apagado">
            {respuesta}
          </p>
        </DetallesSuaves>
      ))}
    </div>
  );
}
