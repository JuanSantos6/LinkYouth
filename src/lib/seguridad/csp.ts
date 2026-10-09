/**
 * Content-Security-Policy con nonce (CN-002 de la auditoría del 2026-09-12;
 * Fase 3 del incidente del 2026-10-08, ver `docs/seguridad.md`).
 *
 * Next.js inyecta scripts inline para hidratar la página. En vez de abrir la
 * puerta con `'unsafe-inline'`, el middleware genera un nonce por request y se
 * lo pasa a Next en el header `Content-Security-Policy` del request: Next lo
 * lee y se lo pone a sus propios `<script>`. Un script inyectado por un XSS no
 * conoce el nonce y el navegador no lo ejecuta.
 *
 * `'strict-dynamic'` deja que esos scripts confiables carguen los chunks de
 * `/_next/static` sin listarlos uno por uno.
 *
 * Estilos: `'unsafe-inline'` a propósito. React y Next escriben atributos
 * `style` que no admiten nonce, y un estilo inyectado no ejecuta código.
 *
 * Imágenes: las fotos de Storage llegan por el `rewrite` del mismo origen;
 * `blob:` es la vista previa del avatar antes de subirlo; `data:` lo usan
 * algunos íconos.
 *
 * Sin `upgrade-insecure-requests`: la aplicación también se abre por
 * `http://` desde la tailnet, y esa directiva rompería esos accesos.
 */
export function generarNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function politicaDeContenido(nonce: string): string {
  const desarrollo = process.env.NODE_ENV === "development";

  const directivas: Record<string, string[]> = {
    "default-src": ["'self'"],
    // `next dev` evalúa código para el refresco en caliente.
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(desarrollo ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    // El navegador no habla con Supabase: todo pasa por el servidor de Next.
    "connect-src": ["'self'", ...(desarrollo ? ["ws:"] : [])],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directivas)
    .map(([clave, valores]) => `${clave} ${valores.join(" ")}`)
    .join("; ");
}
