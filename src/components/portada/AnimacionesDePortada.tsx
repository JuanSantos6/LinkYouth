"use client";

import { useEffect } from "react";

/**
 * Las animaciones ligadas al scroll de la portada, y solo de la portada.
 *
 * GSAP con ScrollTrigger y Lenis se cargan con `import()` dinámico: el resto
 * de la app no los descarga (unos 51 KB comprimidos en total). Se eligieron
 * porque las animaciones de CSS ligadas al scroll todavía no andan en
 * Firefox ni en Safari que sigue en uso, y porque fijar una sección mientras
 * se transforma necesita JavaScript. Ver `docs/decisiones.md`, 2026-09-27.
 *
 * Reglas que se cumplen acá:
 * - Solo se animan `transform`, `opacity` y el recorte (`clip-path`). Nada
 *   que obligue a recalcular la página mientras se desplaza.
 * - La inercia de Lenis solo con mouse o trackpad. En el teléfono, scroll
 *   nativo y versiones simples de los efectos.
 * - Con «reducir movimiento» no se carga nada: todo queda quieto y en su
 *   estado final, que es el que dibuja el CSS sin JavaScript.
 *
 * Marcadores que usa (en `src/app/page.tsx`):
 * `#bienvenida-interior`, `#nosotros`, `[data-parallax-tarjeta]`,
 * `[data-ic-escenario]`, `[data-ic-lienzo]`, `[data-ic-contenido]` y
 * `[data-revelar]`.
 */
export function AnimacionesDePortada() {
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.add("desplazamiento-suave");

    const reducido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducido) {
      return () => raiz.classList.remove("desplazamiento-suave");
    }

    let cancelado = false;
    let limpiar = () => {};

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelado) return;
      gsap.registerPlugin(ScrollTrigger);

      // Inercia solo con mouse o trackpad.
      let detenerLenis = () => {};
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const { default: Lenis } = await import("lenis");
        if (cancelado) return;
        const lenis = new Lenis({
          lerp: 0.1,
          smoothWheel: true,
          anchors: { offset: -88 },
        });
        lenis.on("scroll", ScrollTrigger.update);
        const cuadro = (tiempo: number) => lenis.raf(tiempo * 1000);
        gsap.ticker.add(cuadro);
        gsap.ticker.lagSmoothing(0);
        detenerLenis = () => {
          gsap.ticker.remove(cuadro);
          lenis.destroy();
        };
      }

      const mm = gsap.matchMedia();

      mm.add(
        { ancho: "(min-width: 768px)", angosto: "(max-width: 767px)" },
        (contexto) => {
          const { ancho } = contexto.conditions as { ancho: boolean };

          // La bienvenida se opaca y se achica mientras el panel sube y la cubre.
          gsap.to("#bienvenida-interior", {
            scale: ancho ? 0.88 : 0.95,
            opacity: 0.35,
            ease: "none",
            scrollTrigger: {
              trigger: "#nosotros",
              start: "top bottom",
              end: "top top",
              scrub: true,
            },
          });

          // Tres tarjetas: arrancan a distinta altura y llegan alineadas al mismo tiempo.
          const tarjetas = gsap.utils.toArray<HTMLElement>(
            "[data-parallax-tarjeta]",
          );
          if (ancho && tarjetas.length) {
            const linea = gsap.timeline({
              scrollTrigger: {
                trigger: tarjetas[0].parentElement,
                start: "top 92%",
                end: "top 30%",
                scrub: 0.6,
              },
            });
            tarjetas.forEach((tarjeta, indice) => {
              linea.fromTo(
                tarjeta,
                { y: 80 + indice * 140 },
                { y: 0, ease: "none", duration: 1 },
                0,
              );
              linea.fromTo(
                tarjeta,
                { opacity: 0 },
                { opacity: 1, ease: "none", duration: 0.3 },
                0.18 * indice,
              );
            });
          } else {
            tarjetas.forEach((tarjeta) =>
              gsap.from(tarjeta, {
                y: 24,
                opacity: 0,
                duration: 0.5,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: tarjeta,
                  start: "top 88%",
                  once: true,
                },
              }),
            );
          }

          // La imagen a pantalla completa se recorta hasta el bloque de búsquedas.
          // Se anima el recorte, no la escala: ni la foto ni los textos se deforman.
          const escenario = document.querySelector<HTMLElement>(
            "[data-ic-escenario]",
          );
          const lienzo =
            document.querySelector<HTMLElement>("[data-ic-lienzo]");
          if (ancho && escenario && lienzo) {
            const recorteFinal = () => {
              const ancho = escenario.clientWidth;
              const alto = escenario.clientHeight;
              const x = Math.max(16, (ancho - Math.min(1120, ancho - 32)) / 2);
              const y = Math.max(16, (alto - Math.min(640, alto * 0.78)) / 2);
              return `inset(${y}px ${x}px ${y}px ${x}px round 32px)`;
            };
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: escenario,
                  start: "top top",
                  end: "+=110%",
                  scrub: 0.6,
                  pin: true,
                  invalidateOnRefresh: true,
                },
              })
              .fromTo(
                lienzo,
                { clipPath: "inset(0px 0px 0px 0px round 0px)" },
                { clipPath: recorteFinal, ease: "power1.inOut", duration: 1 },
                0,
              )
              .fromTo(
                "[data-ic-contenido] > *",
                { opacity: 0, y: 24 },
                {
                  opacity: 1,
                  y: 0,
                  stagger: 0.12,
                  duration: 0.45,
                  ease: "power2.out",
                },
                0.6,
              );
          }

          // Bloques que aparecen una sola vez al entrar en pantalla.
          gsap.utils
            .toArray<HTMLElement>("[data-revelar]")
            .forEach((bloque) =>
              gsap.from(bloque, {
                y: 22,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: bloque,
                  start: "top 90%",
                  once: true,
                },
              }),
            );
        },
      );

      limpiar = () => {
        mm.revert();
        detenerLenis();
      };
    })();

    return () => {
      cancelado = true;
      limpiar();
      raiz.classList.remove("desplazamiento-suave");
    };
  }, []);

  return null;
}
