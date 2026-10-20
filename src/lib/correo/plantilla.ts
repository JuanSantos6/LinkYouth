/**
 * El correo de un aviso (RF6.3): asunto, texto plano y HTML con la misma
 * forma que las plantillas de GoTrue (`correo/plantillas/`), para que todo lo
 * que manda LinkYouth se vea igual.
 *
 * Sin dependencias de servidor: se prueba sola en `plantilla.test.ts`.
 */

export type CorreoDeAviso = {
  asunto: string;
  mensaje: string;
  /** Ruta relativa del aviso (`/postulaciones#…`), o `null`. */
  enlace: string | null;
};

const escapar = (texto: string) =>
  texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/**
 * La dirección completa del enlace, o `null` si no es una ruta interna. Un
 * aviso solo enlaza a pantallas propias: lo que no empiece con una sola `/` no
 * se pone en un correo.
 */
export function enlaceAbsoluto(
  enlace: string | null,
  urlPublica: string,
): string | null {
  if (!enlace || !enlace.startsWith("/") || enlace.startsWith("//")) {
    return null;
  }
  return new URL(enlace, urlPublica).toString();
}

/**
 * Direcciones que no hay que intentar: los dominios reservados para ejemplos
 * y pruebas (RFC 2606 y 6761). Las cuentas de la demo y de los e2e los usan, y
 * un correo a ellos solo rebota.
 */
export function esDireccionDePrueba(correo: string): boolean {
  const dominio = correo.split("@").pop()?.toLowerCase() ?? "";
  return (
    /(^|\.)example\.(com|net|org)$/.test(dominio) ||
    /\.(invalid|example|test|localhost)$/.test(dominio)
  );
}

export function armarCorreo(aviso: CorreoDeAviso, urlPublica: string) {
  const href = enlaceAbsoluto(aviso.enlace, urlPublica);
  const pie =
    "Te llega este correo porque tenés una cuenta en LinkYouth. Los demás avisos los ves en la campana, dentro de la página.";

  const texto = [
    aviso.mensaje,
    href ? `\nVer en LinkYouth: ${href}` : "",
    `\n—\n${pie}`,
  ]
    .join("\n")
    .trim();

  const boton = href
    ? `<p style="margin: 0 0 24px"><a href="${escapar(href)}" style="display: inline-block; padding: 12px 22px; border-radius: 999px; background: #f25c1a; color: #1e1a38; font-weight: 700; text-decoration: none">Ver en LinkYouth</a></p>`
    : "";

  const html = `<!doctype html>
<html lang="es">
  <body style="margin: 0; padding: 24px; background: #f7f6fb; font-family: 'Red Hat Text', Arial, sans-serif; color: #1e1a38">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e1ee">
      <tr>
        <td style="padding: 32px">
          <p style="margin: 0 0 24px; font-size: 20px; font-weight: 700; color: #6541e0">LinkYouth</p>
          <h1 style="margin: 0 0 12px; font-size: 22px; line-height: 1.3">${escapar(aviso.asunto)}</h1>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.55">${escapar(aviso.mensaje)}</p>
          ${boton}
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #5b5770">${escapar(pie)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { asunto: aviso.asunto, texto, html };
}
