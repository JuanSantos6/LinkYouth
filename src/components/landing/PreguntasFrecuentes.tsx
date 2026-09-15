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
      "Podés crear la cuenta y entrar, pero el panel para publicar búsquedas todavía está en construcción. El modelo de datos —vacantes, etiquetas ocultas, postulaciones y eventos— ya está hecho; falta la pantalla que lo opera.",
  },
];

/**
 * Preguntas frecuentes.
 *
 * Cada una es un `<details>`: abre y cierra sin JavaScript, es enfocable con
 * teclado y un lector de pantalla la anuncia como lo que es. El primero viene
 * abierto para que la sección no se vea como una lista de títulos mudos.
 */
export function PreguntasFrecuentes() {
  return (
    <ul className="divide-y divide-filete border-y border-filete">
      {PREGUNTAS.map(({ pregunta, respuesta }, indice) => (
        <li key={pregunta}>
          <details open={indice === 0} className="group py-4">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[16px] font-medium text-tinta [&::-webkit-details-marker]:hidden">
              {pregunta}
              <span
                aria-hidden="true"
                className="mt-1 shrink-0 text-[13px] text-apagado group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-apagado">
              {respuesta}
            </p>
          </details>
        </li>
      ))}
    </ul>
  );
}
