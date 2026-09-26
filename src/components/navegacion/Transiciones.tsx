"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type MouseEvent,
} from "react";

type Navegar = (href: string) => void;

const Contexto = createContext<Navegar | null>(null);

/**
 * Transición breve al cambiar de pantalla, con la View Transitions API.
 *
 * Next navega del lado del cliente, así que la transición entre documentos de
 * CSS (`@view-transition`) no aplica. Se envuelve la navegación en
 * `document.startViewTransition`: la pantalla vieja se desvanece y la nueva
 * entra subiendo (`globals.css`). La promesa se resuelve cuando cambia la
 * ruta, o a los 800 ms como tope, para que nunca quede la pantalla congelada.
 *
 * Sin soporte del navegador, o con «reducir movimiento», navega normal.
 * Se eligió esto y no la opción `experimental.viewTransition` de Next porque
 * esa todavía es experimental: ver `docs/decisiones.md`, 2026-09-27.
 */
export function ProveedorDeTransiciones({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const pendiente = useRef<(() => void) | null>(null);

  useEffect(() => {
    pendiente.current?.();
    pendiente.current = null;
  }, [ruta]);

  const navegar = useCallback<Navegar>(
    (href) => {
      const reducido = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const documento = document as Document & {
        startViewTransition?: (cb: () => Promise<void>) => unknown;
      };

      if (reducido || !documento.startViewTransition) {
        router.push(href);
        return;
      }

      documento.startViewTransition(
        () =>
          new Promise<void>((resolver) => {
            pendiente.current = resolver;
            router.push(href);
            window.setTimeout(resolver, 800);
          }),
      );
    },
    [router],
  );

  return <Contexto.Provider value={navegar}>{children}</Contexto.Provider>;
}

/**
 * Un `Link` que cambia de pantalla con transición. Clic con modificadores
 * (abrir en otra pestaña) y anclas de la misma página quedan como siempre.
 */
export function EnlaceTransicion({
  href,
  onClick,
  ...resto
}: Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string }) {
  const navegar = useContext(Contexto);
  const ruta = usePathname();

  return (
    <Link
      href={href}
      onClick={(evento: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(evento);
        const conModificador =
          evento.metaKey ||
          evento.ctrlKey ||
          evento.shiftKey ||
          evento.altKey ||
          evento.button !== 0;
        const mismaRuta = href.split("#")[0] === ruta || href.startsWith("#");
        if (evento.defaultPrevented || conModificador || mismaRuta || !navegar)
          return;
        evento.preventDefault();
        navegar(href);
      }}
      {...resto}
    />
  );
}
