"use client";

import "leaflet/dist/leaflet.css";

import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";

import {
  ATRIBUCION,
  CENTRO_POR_DEFECTO,
  URL_DE_TESELAS,
  ZOOM_DE_UN_PUNTO,
  ZOOM_MAXIMO,
  ZOOM_POR_DEFECTO,
} from "@/lib/mapa/teselas";

export type PuntoDeMapa = {
  id: string;
  titulo: string;
  latitud: number;
  longitud: number;
  /** Fecha y hora ya formateadas para el emergente del mapa general. */
  detalle?: string;
  /** Enlace al detalle del evento (`/eventos/<id>`). */
  href?: string;
};

const SVG_MARCADOR =
  '<svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true" focusable="false" class="ly-marcador-svg">' +
  '<path d="M14 34C14 34 26 22.8 26 13A12 12 0 1 0 2 13C2 22.8 14 34 14 34Z" fill="var(--ly-violeta)" stroke="var(--ly-superficie)" stroke-width="2.5"/>' +
  '<circle cx="14" cy="13" r="4.5" fill="var(--ly-superficie)"/>' +
  "</svg>";

/**
 * Ícono del marcador dibujado en SVG con los colores de la marca (`violeta` y
 * borde `superficie`), sin imágenes externas.
 */
export function crearIconoMarcador(L: typeof Leaflet): Leaflet.DivIcon {
  return L.divIcon({
    className: "ly-marcador-mapa",
    html: SVG_MARCADOR,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -32],
  });
}

/** Pone nombre accesible y rol al nodo DOM de un marcador con `divIcon`. */
export function etiquetarMarcador(
  marcador: Leaflet.Marker,
  etiqueta: string,
): void {
  const aplicar = () => {
    const elemento = marcador.getElement();
    if (!elemento) return;
    elemento.setAttribute("aria-label", etiqueta);
    elemento.setAttribute("role", "button");
  };
  aplicar();
  marcador.on("add", aplicar);
}

/**
 * Arma el contenido del emergente con nodos del DOM (`textContent`), nunca
 * concatenando HTML con textos que vienen de la base de datos.
 */
function crearContenidoEmergente(punto: PuntoDeMapa): HTMLElement {
  const contenedor = document.createElement("div");
  contenedor.className = "space-y-1";

  const titulo = document.createElement("p");
  titulo.className = "font-titulo text-[14.5px] font-bold text-tinta";
  titulo.textContent = punto.titulo;
  contenedor.appendChild(titulo);

  if (punto.detalle) {
    const detalle = document.createElement("p");
    detalle.className = "text-[13px] text-apagado";
    detalle.textContent = punto.detalle;
    contenedor.appendChild(detalle);
  }

  if (punto.href) {
    const parrafo = document.createElement("p");
    parrafo.className = "pt-1";

    const enlace = document.createElement("a");
    enlace.href = punto.href;
    enlace.className =
      "inline-flex items-center text-[13.5px] font-semibold text-acento underline underline-offset-4";
    enlace.textContent = "Ver evento";

    parrafo.appendChild(enlace);
    contenedor.appendChild(parrafo);
  }

  return contenedor;
}

/**
 * Inicializa la instancia de Leaflet con las teselas de OpenStreetMap, la
 * atribución obligatoria, respeto por `prefers-reduced-motion` y gestos
 * pensados para no atrapar el scroll vertical en pantallas táctiles.
 */
export function inicializarMapaBase(
  L: typeof Leaflet,
  contenedor: HTMLElement,
  alIntentarArrastrarInactivo: () => void,
): { mapa: Leaflet.Map; limpiar: () => void } {
  const reducirMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const esTactil =
    window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

  const mapa = L.map(contenedor, {
    scrollWheelZoom: false,
    touchZoom: true,
    dragging: !esTactil,
    zoomAnimation: !reducirMovimiento,
    fadeAnimation: !reducirMovimiento,
    markerZoomAnimation: !reducirMovimiento,
    attributionControl: false,
    zoomControl: false,
  });

  contenedor.dataset.activo = esTactil ? "false" : "true";

  L.tileLayer(URL_DE_TESELAS, {
    maxZoom: ZOOM_MAXIMO,
  }).addTo(mapa);

  L.control
    .attribution({ position: "bottomright", prefix: false })
    .addAttribution(ATRIBUCION)
    .addTo(mapa);

  L.control
    .zoom({
      position: "topright",
      zoomInTitle: "Acercar el mapa",
      zoomOutTitle: "Alejar el mapa",
    })
    .addTo(mapa);

  let activo = !esTactil;
  let inicioToque: { x: number; y: number } | null = null;
  let movioConUnDedo = false;

  const activar = () => {
    if (activo) return;
    activo = true;
    contenedor.dataset.activo = "true";
    mapa.dragging.enable();
  };

  const alTocarInicio = (evento: TouchEvent) => {
    if (evento.touches.length >= 2) {
      inicioToque = null;
      activar();
      return;
    }
    if (!activo && evento.touches.length === 1) {
      const toque = evento.touches[0];
      inicioToque = { x: toque.clientX, y: toque.clientY };
      movioConUnDedo = false;
    }
  };

  const alTocarMover = (evento: TouchEvent) => {
    if (evento.touches.length >= 2) {
      activar();
      return;
    }
    if (!activo && inicioToque && evento.touches.length === 1) {
      const toque = evento.touches[0];
      const dx = Math.abs(toque.clientX - inicioToque.x);
      const dy = Math.abs(toque.clientY - inicioToque.y);
      if (dx > 8 || dy > 8) {
        movioConUnDedo = true;
        alIntentarArrastrarInactivo();
      }
    }
  };

  const alTocarFin = () => {
    if (!activo && inicioToque && !movioConUnDedo) {
      activar();
    }
    inicioToque = null;
    movioConUnDedo = false;
  };

  const alApuntarMouse = (evento: PointerEvent) => {
    if (evento.pointerType === "mouse") {
      activar();
    }
  };

  const alRueda = (evento: WheelEvent) => {
    if (evento.ctrlKey || evento.metaKey) {
      evento.preventDefault();
      if (evento.deltaY < 0) {
        mapa.zoomIn();
      } else if (evento.deltaY > 0) {
        mapa.zoomOut();
      }
    }
  };

  contenedor.addEventListener("touchstart", alTocarInicio, { passive: true });
  contenedor.addEventListener("touchmove", alTocarMover, { passive: true });
  contenedor.addEventListener("touchend", alTocarFin, { passive: true });
  contenedor.addEventListener("pointerdown", alApuntarMouse, { passive: true });
  contenedor.addEventListener("wheel", alRueda, { passive: false });
  mapa.on("click", activar);

  const limpiar = () => {
    contenedor.removeEventListener("touchstart", alTocarInicio);
    contenedor.removeEventListener("touchmove", alTocarMover);
    contenedor.removeEventListener("touchend", alTocarFin);
    contenedor.removeEventListener("pointerdown", alApuntarMouse);
    contenedor.removeEventListener("wheel", alRueda);
    mapa.remove();
  };

  return { mapa, limpiar };
}

/**
 * Hook que observa cuándo el contenedor entra en pantalla para diferir la
 * descarga e inicialización de Leaflet.
 */
export function useVisibleEnPantalla(
  referencia: React.RefObject<HTMLElement | null>,
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const nodo = referencia.current;
    if (!nodo) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { rootMargin: "120px" },
    );

    observador.observe(nodo);
    return () => observador.disconnect();
  }, [referencia, visible]);

  return visible;
}

/**
 * RF4.1 y RF4.4 — Mapa embebido con Leaflet y teselas de OpenStreetMap.
 *
 * Carga diferida con `IntersectionObserver` + `import("leaflet")`. Mientras no
 * cargó (o sin JavaScript), muestra un recuadro del mismo alto con el
 * esqueleto del proyecto y el texto de respaldo con la dirección, de modo que
 * la página no salta y el contenido se sigue leyendo sin JS.
 */
export function MapaInteractivo({
  puntos,
  respaldoSinJs,
  etiqueta = "Mapa de ubicación",
}: {
  puntos: PuntoDeMapa[];
  /** Dirección o resumen que se lee mientras carga o sin JavaScript. */
  respaldoSinJs?: string | null;
  etiqueta?: string;
}) {
  const envoltorioRef = useRef<HTMLDivElement>(null);
  const lienzoRef = useRef<HTMLDivElement>(null);
  const visible = useVisibleEnPantalla(envoltorioRef);
  const [listo, setListo] = useState(false);
  const [avisoTactil, setAvisoTactil] = useState(false);
  const temporizadorAvisoRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (!visible) return;
    const contenedor = lienzoRef.current;
    if (!contenedor) return;

    let cancelado = false;
    let limpiarMapa: (() => void) | null = null;

    const mostrarAviso = () => {
      setAvisoTactil(true);
      if (temporizadorAvisoRef.current) {
        clearTimeout(temporizadorAvisoRef.current);
      }
      temporizadorAvisoRef.current = setTimeout(() => {
        setAvisoTactil(false);
      }, 2200);
    };

    void import("leaflet").then((modulo) => {
      if (cancelado || !lienzoRef.current) return;
      const L = modulo.default ?? modulo;

      const { mapa, limpiar } = inicializarMapaBase(
        L,
        lienzoRef.current,
        mostrarAviso,
      );
      limpiarMapa = limpiar;

      const icono = crearIconoMarcador(L);

      if (puntos.length === 0) {
        mapa.setView(
          [CENTRO_POR_DEFECTO.latitud, CENTRO_POR_DEFECTO.longitud],
          ZOOM_POR_DEFECTO,
        );
      } else if (puntos.length === 1) {
        const unico = puntos[0];
        mapa.setView([unico.latitud, unico.longitud], ZOOM_DE_UN_PUNTO);
      } else {
        const limites = L.latLngBounds(
          puntos.map(
            (punto) => [punto.latitud, punto.longitud] as [number, number],
          ),
        );
        mapa.fitBounds(limites, {
          padding: [36, 36],
          maxZoom: ZOOM_DE_UN_PUNTO,
        });
      }

      for (const punto of puntos) {
        const marcador = L.marker([punto.latitud, punto.longitud], {
          icon: icono,
          title: punto.titulo,
        }).addTo(mapa);
        etiquetarMarcador(marcador, punto.titulo);

        if (punto.detalle || punto.href) {
          // Ancho fijo: Leaflet mide el contenido antes de que carguen las
          // fuentes y, sin mínimo, parte el título palabra por palabra.
          marcador.bindPopup(crearContenidoEmergente(punto), {
            minWidth: 200,
            maxWidth: 260,
          });
        }
      }

      setListo(true);
    });

    return () => {
      cancelado = true;
      if (temporizadorAvisoRef.current) {
        clearTimeout(temporizadorAvisoRef.current);
      }
      limpiarMapa?.();
    };
  }, [visible, puntos]);

  return (
    <div
      ref={envoltorioRef}
      role="region"
      aria-label={etiqueta}
      className="relative isolate h-[240px] w-full overflow-hidden rounded-tarjeta border border-borde bg-superficie md:h-[340px]"
    >
      <div ref={lienzoRef} className="h-full w-full" />

      {!listo && (
        <div className="esqueleto absolute inset-0 flex items-center justify-center p-4 text-center text-[14px] text-apagado">
          <span>
            {respaldoSinJs?.trim() || "Cargando el mapa de ubicación…"}
          </span>
        </div>
      )}

      {avisoTactil && (
        <div
          role="status"
          aria-live="polite"
          className="vidrio pointer-events-none absolute inset-x-3 bottom-10 z-[500] mx-auto w-fit max-w-full rounded-control px-3.5 py-2 text-center text-[13px] font-medium text-tinta"
        >
          Tocá el mapa o usá dos dedos para moverlo
        </div>
      )}
    </div>
  );
}
