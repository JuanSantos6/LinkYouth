"use client";

import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";

import { Boton } from "@/components/ui/Boton";
import { CAMPO } from "@/components/ui/Campo";
import {
  buscarDireccion,
  direccionDePunto,
  type LugarEncontrado,
} from "@/lib/acciones/geocodificacion";
import { ReglasDeEvento } from "@/lib/dominio/ReglasDeEvento";
import {
  CENTRO_POR_DEFECTO,
  ZOOM_DE_UN_PUNTO,
  ZOOM_POR_DEFECTO,
} from "@/lib/mapa/teselas";

import {
  crearIconoMarcador,
  etiquetarMarcador,
  inicializarMapaBase,
  useVisibleEnPantalla,
} from "./MapaInteractivo";

type Coordenadas = {
  latitud: number;
  longitud: number;
};

const redondearSeisDecimales = (valor: number) => Math.round(valor * 1e6) / 1e6;

function leerPuntoInicial(
  latitudTexto: string,
  longitudTexto: string,
): Coordenadas | null {
  const lat = ReglasDeEvento.leerCoordenada(latitudTexto);
  const lng = ReglasDeEvento.leerCoordenada(longitudTexto);
  const candidato = {
    latitud: lat !== null && Number.isFinite(lat) ? lat : null,
    longitud: lng !== null && Number.isFinite(lng) ? lng : null,
  };
  return ReglasDeEvento.tieneUbicacion(candidato) ? candidato : null;
}

/**
 * RF4.1 y RF4.2 — Selector de ubicación en el mapa para el formulario de
 * eventos de la empresa.
 *
 * Permite buscar una dirección con Nominatim (vía la acción de servidor
 * `buscarDireccion`) o marcar/arrastrar el punto en el mapa (que consulta
 * `direccionDePunto` y completa el campo Dirección si estaba vacío). Guarda el
 * resultado en dos `<input type="hidden">` (`latitud` y `longitud`) con punto
 * decimal.
 */
export function SelectorDeUbicacion({
  latitudInicial = "",
  longitudInicial = "",
  errorLatitud,
  errorLongitud,
}: {
  latitudInicial?: string;
  longitudInicial?: string;
  errorLatitud?: string;
  errorLongitud?: string;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const envoltorioMapaRef = useRef<HTMLDivElement>(null);
  const lienzoRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const marcadorRef = useRef<Leaflet.Marker | null>(null);
  const temporizadorAvisoRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const visible = useVisibleEnPantalla(envoltorioMapaRef);

  const [punto, setPunto] = useState<Coordenadas | null>(() =>
    leerPuntoInicial(latitudInicial, longitudInicial),
  );
  const puntoInicialRef = useRef<Coordenadas | null>(punto);
  const previoInicialRef = useRef(`${latitudInicial}|${longitudInicial}`);

  useEffect(() => {
    const actual = `${latitudInicial}|${longitudInicial}`;
    if (previoInicialRef.current !== actual) {
      previoInicialRef.current = actual;
      const leido = leerPuntoInicial(latitudInicial, longitudInicial);
      puntoInicialRef.current = leido;
      setPunto(leido);
    }
  }, [latitudInicial, longitudInicial]);

  const [consulta, setConsulta] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [lugares, setLugares] = useState<LugarEncontrado[]>([]);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [avisoTactil, setAvisoTactil] = useState(false);

  const completarDireccionSiVacia = (etiqueta: string) => {
    const campoDireccion = contenedorRef.current
      ?.closest("form")
      ?.querySelector<HTMLInputElement>('input[name="direccion"]');
    if (campoDireccion && campoDireccion.value.trim() === "") {
      campoDireccion.value = etiqueta.slice(0, ReglasDeEvento.DIRECCION_MAX);
    }
  };

  const marcarYConsultarDireccion = (latitud: number, longitud: number) => {
    const lat = redondearSeisDecimales(latitud);
    const lng = redondearSeisDecimales(longitud);
    setPunto({ latitud: lat, longitud: lng });
    setErrorBusqueda(null);

    void direccionDePunto(lat, lng).then((resultado) => {
      if (resultado.estado === "ok" && resultado.lugares[0]) {
        completarDireccionSiVacia(resultado.lugares[0].etiqueta);
      }
    });
  };

  const marcarRef = useRef(marcarYConsultarDireccion);
  marcarRef.current = marcarYConsultarDireccion;

  useEffect(() => {
    if (!visible) return;
    const nodo = lienzoRef.current;
    if (!nodo) return;

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
      leafletRef.current = L;

      const { mapa, limpiar } = inicializarMapaBase(
        L,
        lienzoRef.current,
        mostrarAviso,
      );
      limpiarMapa = limpiar;
      mapaRef.current = mapa;

      const inicial = puntoInicialRef.current;
      if (inicial) {
        mapa.setView([inicial.latitud, inicial.longitud], ZOOM_DE_UN_PUNTO);
      } else {
        mapa.setView(
          [CENTRO_POR_DEFECTO.latitud, CENTRO_POR_DEFECTO.longitud],
          ZOOM_POR_DEFECTO,
        );
      }

      mapa.on("click", (evento: Leaflet.LeafletMouseEvent) => {
        marcarRef.current(evento.latlng.lat, evento.latlng.lng);
      });

      setListo(true);
    });

    return () => {
      cancelado = true;
      if (temporizadorAvisoRef.current) {
        clearTimeout(temporizadorAvisoRef.current);
      }
      marcadorRef.current = null;
      mapaRef.current = null;
      leafletRef.current = null;
      limpiarMapa?.();
    };
  }, [visible]);

  useEffect(() => {
    const mapa = mapaRef.current;
    const L = leafletRef.current;
    if (!listo || !mapa || !L) return;

    if (!punto) {
      if (marcadorRef.current) {
        marcadorRef.current.remove();
        marcadorRef.current = null;
      }
      return;
    }

    if (!marcadorRef.current) {
      const marcador = L.marker([punto.latitud, punto.longitud], {
        icon: crearIconoMarcador(L),
        draggable: true,
        title: "Ubicación del evento",
      }).addTo(mapa);
      etiquetarMarcador(marcador, "Ubicación del evento");

      marcador.on("dragend", () => {
        const posicion = marcador.getLatLng();
        marcarRef.current(posicion.lat, posicion.lng);
      });

      marcadorRef.current = marcador;
    } else {
      marcadorRef.current.setLatLng([punto.latitud, punto.longitud]);
    }
  }, [listo, punto]);

  const ejecutarBusqueda = async () => {
    let texto = consulta.trim();
    if (!texto) {
      const campoDireccion = contenedorRef.current
        ?.closest("form")
        ?.querySelector<HTMLInputElement>('input[name="direccion"]');
      if (campoDireccion?.value.trim()) {
        texto = campoDireccion.value.trim();
        setConsulta(texto);
      }
    }

    setBuscando(true);
    setErrorBusqueda(null);
    try {
      const resultado = await buscarDireccion(texto);
      if (resultado.estado === "error") {
        setLugares([]);
        setErrorBusqueda(resultado.mensaje);
      } else {
        setLugares(resultado.lugares);
      }
    } finally {
      setBuscando(false);
    }
  };

  const elegirLugar = (lugar: LugarEncontrado) => {
    const nuevo = {
      latitud: redondearSeisDecimales(lugar.latitud),
      longitud: redondearSeisDecimales(lugar.longitud),
    };
    setPunto(nuevo);
    setLugares([]);
    setErrorBusqueda(null);
    completarDireccionSiVacia(lugar.etiqueta);
    mapaRef.current?.setView([nuevo.latitud, nuevo.longitud], ZOOM_DE_UN_PUNTO);
  };

  const quitarUbicacion = () => {
    setPunto(null);
    setErrorBusqueda(null);
  };

  const tieneErrorCampo = Boolean(errorLatitud || errorLongitud);

  return (
    <div ref={contenedorRef} className="space-y-3">
      <input
        type="hidden"
        name="latitud"
        value={punto ? String(punto.latitud) : ""}
      />
      <input
        type="hidden"
        name="longitud"
        value={punto ? String(punto.longitud) : ""}
      />

      <div className="space-y-1.5">
        <label
          htmlFor="buscador-ubicacion-mapa"
          className="block text-[14px] font-medium text-tinta"
        >
          Ubicación en el mapa (opcional)
        </label>
        <p className="text-[13px] text-apagado">
          Buscá la dirección o tocá el mapa para marcar el punto exacto.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="buscador-ubicacion-mapa"
            type="search"
            value={consulta}
            onChange={(evento) => setConsulta(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key === "Enter") {
                evento.preventDefault();
                void ejecutarBusqueda();
              }
            }}
            placeholder="Ej.: Av. 18 de Julio 1824, Montevideo"
            aria-invalid={tieneErrorCampo ? true : undefined}
            className={`flex-1 ${CAMPO}`}
          />
          <Boton
            type="button"
            variante="secundario"
            onClick={() => void ejecutarBusqueda()}
            disabled={buscando}
            className="shrink-0"
          >
            {buscando ? "Buscando…" : "Buscar"}
          </Boton>
        </div>
      </div>

      {errorBusqueda && (
        <p role="alert" className="text-[13px] font-medium text-alerta">
          {errorBusqueda}
        </p>
      )}

      {lugares.length > 0 && (
        <ul
          aria-label="Resultados de la búsqueda"
          className="divide-y divide-filete overflow-hidden rounded-ficha border border-borde bg-superficie"
        >
          {lugares.map((lugar, indice) => (
            <li key={`${lugar.latitud},${lugar.longitud}-${indice}`}>
              <button
                type="button"
                onClick={() => elegirLugar(lugar)}
                className="w-full px-3.5 py-2.5 text-left text-[13.5px] leading-snug text-tinta transition-colors duration-150 hover:bg-realce"
              >
                {lugar.etiqueta}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        ref={envoltorioMapaRef}
        role="region"
        aria-label="Selector de ubicación en el mapa"
        className="relative isolate h-[240px] w-full overflow-hidden rounded-tarjeta border border-borde bg-superficie md:h-[340px]"
      >
        <div ref={lienzoRef} className="h-full w-full" />

        {!listo && (
          <div className="esqueleto absolute inset-0 flex items-center justify-center p-4 text-center text-[14px] text-apagado">
            <span>Cargando el mapa para elegir la ubicación…</span>
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

      {punto && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-apagado">
          <p>
            <span className="font-medium text-tinta">Ubicación marcada:</span>{" "}
            <span className="tabular-nums">
              {punto.latitud.toFixed(6)}, {punto.longitud.toFixed(6)}
            </span>
          </p>
          <button
            type="button"
            onClick={quitarUbicacion}
            className="font-medium text-acento underline-offset-4 hover:underline"
          >
            Quitar ubicación
          </button>
        </div>
      )}

      {tieneErrorCampo && (
        <div
          role="alert"
          className="space-y-1 text-[13px] font-medium text-alerta"
        >
          {errorLatitud && <p>{errorLatitud}</p>}
          {errorLongitud && <p>{errorLongitud}</p>}
        </div>
      )}
    </div>
  );
}
