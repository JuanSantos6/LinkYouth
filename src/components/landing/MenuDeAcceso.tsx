"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Opcion = {
  href: string;
  etiqueta: string;
  ayuda: string;
};

/**
 * Cuál de los menús del grupo está abierto.
 *
 * Existe para que no haya dos: antes cada menú se abría por su cuenta y, con
 * los dos abiertos, los paneles se pisaban uno al otro. Con un solo valor
 * compartido, abrir uno cierra el otro sin que ninguno de los dos tenga que
 * enterarse de que el otro existe.
 */
const Grupo = createContext<{
  abierto: string | null;
  abrir: (id: string | null) => void;
} | null>(null);

/**
 * Envoltorio de un par de menús vecinos.
 *
 * Cualquier `MenuDeAcceso` funciona sin él —cae en su propio estado—, pero dos
 * que comparten fila tienen que compartir grupo.
 */
export function GrupoDeMenus({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [abierto, abrir] = useState<string | null>(null);

  return (
    <Grupo.Provider value={{ abierto, abrir }}>
      {/*
       * El filtro por tipo de puntero no es una precaución: en un teléfono el
       * toque termina con un `pointerleave`, así que sin esto el menú se
       * cerraba solo en el mismo gesto que lo abría.
       */}
      <div
        className={className}
        onPointerLeave={(evento) => {
          if (evento.pointerType === "mouse") abrir(null);
        }}
      >
        {children}
      </div>
    </Grupo.Provider>
  );
}

/**
 * Botón que despliega las dos puertas de entrada: la del postulante y la de
 * la empresa.
 *
 * Se abre al pasar el mouse y se cierra al salir. Eso solo alcanza para quien
 * tiene mouse, así que abajo conviven los otros dos caminos:
 *
 * - **Tacto.** `pointerenter` se ignora cuando no viene de un mouse —en un
 *   teléfono se dispara junto con el toque y el menú se abriría y cerraría en
 *   el mismo gesto—, y el toque queda resuelto por el `click`, que alterna.
 * - **Teclado.** El foco abre y salir del menú cierra, con `Escape` como
 *   salida rápida. Un menú que solo responde al mouse deja afuera a quien
 *   navega con tabulador, y esta es la puerta de entrada al producto.
 *
 * El panel cuelga de un envoltorio con `pt-1.5` en vez de llevar `mt-1.5`
 * propio: con margen queda un hueco de seis píxeles entre el botón y el panel,
 * y el menú se cierra justo cuando el mouse lo está cruzando para llegar.
 */
export function MenuDeAcceso({
  etiqueta,
  opciones,
  destacado = false,
}: {
  etiqueta: string;
  opciones: Opcion[];
  /** El de crear cuenta, que es la acción principal de la portada. */
  destacado?: boolean;
}) {
  const id = useId();
  const grupo = useContext(Grupo);
  const [suelto, setSuelto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);

  // `Escape` cierra el panel y devuelve el foco al botón, y ese foco vuelve a
  // ser foco de teclado: sin esta bandera, el menú se reabría en el mismo
  // instante en que se lo acababa de cerrar.
  const ignorarElProximoFoco = useRef(false);

  const abierto = grupo ? grupo.abierto === id : suelto;

  function cambiar(quiero: boolean) {
    if (grupo) grupo.abrir(quiero ? id : null);
    else setSuelto(quiero);
  }

  const estilo = destacado
    ? "bg-acento text-sobre-acento hover:bg-tinta"
    : "border border-borde-control text-tinta hover:border-tinta";

  return (
    // `z-50` sobre el envoltorio y no solo sobre el panel: el panel se pinta
    // dentro del contexto de apilamiento de su contenedor, así que sin esto
    // el vecino de la derecha queda por encima igual.
    <div
      className={`relative ${abierto ? "z-50" : "z-40"}`}
      onPointerEnter={(evento) => {
        if (evento.pointerType === "mouse") cambiar(true);
      }}
      onPointerLeave={(evento) => {
        if (evento.pointerType === "mouse") cambiar(false);
      }}
      onFocus={(evento) => {
        // Solo el foco del teclado abre. Un toque en el teléfono también
        // enfoca el botón, y entre ese `focus` y el `click` que viene después
        // el menú se abría y se cerraba dentro del mismo gesto. `:focus-visible`
        // es justo la distinción que hace falta: el navegador lo pone cuando el
        // foco llegó por tabulador y no cuando llegó por un toque o un clic.
        if (ignorarElProximoFoco.current) {
          ignorarElProximoFoco.current = false;
          return;
        }

        const destino = evento.target;
        if (destino instanceof Element && destino.matches(":focus-visible")) {
          cambiar(true);
        }
      }}
      onBlur={(evento) => {
        // El foco puede estar viajando entre el botón y una opción del panel,
        // que es movimiento interno y no una salida.
        if (!evento.currentTarget.contains(evento.relatedTarget))
          cambiar(false);
      }}
      onKeyDown={(evento) => {
        if (evento.key !== "Escape") return;

        ignorarElProximoFoco.current = true;
        cambiar(false);
        boton.current?.focus();

        // El `focus` se dispara durante el `.focus()` de arriba y consume la
        // bandera. Si el botón ya tenía el foco no se dispara ninguno, así que
        // acá se limpia igual para no dejarla armada contra el foco siguiente.
        requestAnimationFrame(() => {
          ignorarElProximoFoco.current = false;
        });
      }}
    >
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={`${id}-panel`}
        onClick={(evento) => {
          // Con mouse manda el hover: al llegar al botón el panel ya se abrió,
          // así que alternar acá lo cerraría justo cuando se lo quiso abrir.
          // Queda la apertura por si el panel estaba cerrado con el puntero ya
          // encima —después de un `Escape`, por ejemplo—, donde el navegador no
          // vuelve a disparar `pointerenter` y el menú quedaría trabado.
          const nativo = evento.nativeEvent;
          const puntero =
            nativo instanceof PointerEvent ? nativo.pointerType : "";

          if (puntero === "mouse") {
            if (!abierto) cambiar(true);
            return;
          }

          // Tacto y teclado no tienen hover: acá el clic es todo lo que hay.
          cambiar(!abierto);
        }}
        className={`flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-control px-3 py-1.5 text-[14px] font-medium transition-[color,background-color,border-color] duration-150 ${estilo}`}
      >
        {etiqueta}
        <span
          aria-hidden="true"
          className={`text-[10px] transition-transform duration-150 ${
            abierto ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {abierto && (
        <div
          id={`${id}-panel`}
          className="absolute right-0 top-full z-50 w-64 pt-1.5"
        >
          {/*
           * `bg-superficie` es opaco a propósito. La cabecera es translúcida
           * con desenfoque, y un panel que heredara esa transparencia dejaría
           * leer el texto de la página por debajo.
           */}
          <ul className="rounded-ficha border border-borde bg-superficie p-1 shadow-elevada">
            {opciones.map((opcion) => (
              <li key={opcion.href}>
                <Link
                  href={opcion.href}
                  className="block rounded-control px-3 py-2.5 transition-[background-color] duration-150 hover:bg-realce"
                >
                  <span className="block text-[14px] font-medium text-tinta">
                    {opcion.etiqueta}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-apagado">
                    {opcion.ayuda}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
