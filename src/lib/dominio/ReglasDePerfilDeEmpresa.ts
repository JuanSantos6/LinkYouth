import type { ErroresDeCampo } from "@/lib/dominio/ReglasDeBusqueda";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";

/** Lo que manda el formulario del perfil de empresa. */
export type DatosDePerfilDeEmpresa = {
  razonSocial: string;
  rut: string;
  rubro: string;
  descripcion: string;
  sitioWeb: string;
};

/**
 * Las reglas del perfil de empresa (RF1.2, RF7.1).
 *
 * El RUT y la razón social repiten los límites del registro a propósito: se
 * cargan en el alta y se corrigen acá, y sería raro que un dato que se aceptó
 * al registrarse se rechace al editarlo.
 */
export class ReglasDePerfilDeEmpresa {
  static readonly RUBRO_MAX = ReglasDeRegistro.LARGO_NOMBRE;
  static readonly DESCRIPCION_MAX = 600;
  static readonly SITIO_MAX = 200;

  /**
   * La misma forma que exige la base (`empresas_sitio_web_check`): http o
   * https, y un host con al menos un punto.
   */
  private static readonly FORMA_SITIO = /^https?:\/\/[^\s]+\.[^\s]+$/i;

  /**
   * Completa `https://` si falta: casi nadie escribe el esquema, y rechazar
   * «nubeuy.com» por no decir «https://» sería pedirle a la empresa que sepa
   * algo que no le importa.
   */
  static normalizarSitio(texto: string): string | null {
    const limpio = texto.trim();
    if (!limpio) return null;
    return /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
  }

  static validar(datos: DatosDePerfilDeEmpresa): ErroresDeCampo {
    const errores: ErroresDeCampo = {};
    const razon = datos.razonSocial.trim();

    if (razon.length < 2) {
      errores.razonSocial = "Poné la razón social.";
    } else if (razon.length > ReglasDeRegistro.LARGO_NOMBRE) {
      errores.razonSocial = `La razón social no puede pasar de ${ReglasDeRegistro.LARGO_NOMBRE} caracteres.`;
    }

    if (!ReglasDeRegistro.rutValido(datos.rut)) {
      errores.rut = "El RUT tiene que tener doce dígitos.";
    }

    const rubro = datos.rubro.trim();
    if (rubro.length < 2) {
      errores.rubro = "Poné el rubro.";
    } else if (rubro.length > this.RUBRO_MAX) {
      errores.rubro = `El rubro no puede pasar de ${this.RUBRO_MAX} caracteres.`;
    }

    if (datos.descripcion.trim().length > this.DESCRIPCION_MAX) {
      errores.descripcion = `La descripción no puede pasar de ${this.DESCRIPCION_MAX} caracteres.`;
    }

    const sitio = this.normalizarSitio(datos.sitioWeb);
    if (
      sitio &&
      (sitio.length > this.SITIO_MAX || !this.FORMA_SITIO.test(sitio))
    ) {
      errores.sitioWeb = "Revisá el sitio web: por ejemplo, nubeuy.com.";
    }

    return errores;
  }
}
