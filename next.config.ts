import type { NextConfig } from "next";

/**
 * Supabase por la red interna. No se publica en internet: el navegador pide
 * las fotos a la app y la app las trae de acá (`rewrites`). Es el mismo
 * servidor, así que va por `127.0.0.1` y no depende de Tailscale.
 */
const STORAGE_INTERNO = "http://127.0.0.1:8000";

/**
 * Cabeceras de seguridad (CN-002 de la auditoría del 2026-09-12, H8 de
 * `docs/publicacion-y-seguridad.md`).
 *
 * Next.js no manda ninguna por su cuenta. Sin `X-Frame-Options`, la
 * aplicación se puede embeber en un iframe ajeno, y tanto `/perfil` como
 * `/postulaciones` hacen mutaciones con un solo clic.
 *
 * `Strict-Transport-Security` solo tiene efecto cuando la página llega por
 * HTTPS (Tailscale Funnel); por `http://` los navegadores la ignoran, así que
 * no afecta el acceso por la IP de la tailnet. Sin `includeSubDomains`: el
 * dominio es de Tailscale, no nuestro.
 *
 * `X-Robots-Tag` y `public/robots.txt`: es una demo con datos de prueba y no
 * tiene que aparecer en buscadores.
 *
 * Falta la `Content-Security-Policy`: Next inyecta estilos y scripts inline,
 * así que una CSP estricta mal calibrada rompe el render. Entra después, y
 * primero como `Report-Only`.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Las acciones de servidor rechazan por defecto cuerpos de más de 1 MB, y
    // la foto de perfil, el logo y la imagen de un evento viajan en una de
    // ellas. Un poco más que `PESO_MAXIMO_IMAGEN` (5 MB) por los otros campos
    // del formulario.
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Es el valor por defecto; queda escrito para que nadie lo active sin ver
  // que publicaría el código fuente original en las DevTools.
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/storage/v1/object/public/:path*",
        destination: `${STORAGE_INTERNO}/storage/v1/object/public/:path*`,
      },
    ];
  },
};

export default nextConfig;
