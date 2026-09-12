import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad (CN-002 de la auditoría del 2026-09-12).
 *
 * Next.js no manda ninguna por su cuenta. Sin `X-Frame-Options`, la
 * aplicación se puede embeber en un iframe ajeno, y tanto `/perfil` como
 * `/postulaciones` hacen mutaciones con un solo clic.
 *
 * Falta la `Content-Security-Policy`: Next inyecta estilos y scripts inline,
 * así que una CSP estricta mal calibrada rompe el render. Entra después, y
 * primero como `Report-Only`.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
