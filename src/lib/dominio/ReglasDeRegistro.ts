/**
 * Los límites del registro, en un solo lugar (RF1.1, RF1.2).
 *
 * Existen tres veces en el recorrido: como atributo del `<input>`, como
 * comprobación en la acción de servidor y como restricción de la base. Las
 * tres tienen que decir lo mismo, y la única forma de que lo digan es que
 * salgan de acá.
 *
 * El reparto de responsabilidades no cambia: el navegador es comodidad, la
 * acción de servidor rechaza, y la base es la verdad. Esta clase no reemplaza
 * a ninguna de las tres, les da el mismo número.
 */
export class ReglasDeRegistro {
  /**
   * Edad mínima. La fija el `check` `perfiles_mayor_de_edad` de
   * `db/schema.sql`: acá está repetida para poder poner el `max` del campo de
   * fecha y dar el aviso antes de mandar, no para decidir la regla.
   */
  static readonly EDAD_MINIMA = 18;

  /**
   * Largo máximo de nombre, apellido y razón social. La base los declara
   * `text` sin límite: el tope es de producto, no de esquema. Cincuenta
   * entran en la ficha del perfil y en la fila del listado sin cortarse.
   */
  static readonly LARGO_NOMBRE = 50;

  /** Largo mínimo del nombre de usuario, que además es único en `perfiles`. */
  static readonly LARGO_USUARIO_MINIMO = 3;
  static readonly LARGO_USUARIO_MAXIMO = 30;

  /**
   * Intereses mínimos al registrarse (RF1.1.11). Sin al menos cinco, la
   * compatibilidad de RF3.9 no tiene con qué comparar y el feed abre con todo
   * en 0 %: el perfil está bien pero la pantalla parece rota.
   */
  static readonly TAGS_MINIMOS = 5;

  /** Peso máximo de la foto de perfil o el logo, en bytes. */
  static readonly PESO_MAXIMO_IMAGEN = 2 * 1024 * 1024;

  /** Formatos que acepta la subida. Se repiten en el `accept` del `<input>`. */
  static readonly FORMATOS_IMAGEN = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ] as const;

  /**
   * La fecha de nacimiento más reciente que se puede elegir, en el formato
   * `yyyy-mm-dd` que pide `<input type="date">`.
   *
   * Recibe el día en lugar de leer el reloj para que el resultado no dependa
   * de cuándo se ejecuta: el servidor y el navegador pueden estar en husos
   * distintos, y una fecha calculada dos veces con dos relojes es una
   * diferencia de hidratación.
   */
  static fechaMaximaDeNacimiento(hoy: Date): string {
    const limite = new Date(hoy);
    limite.setFullYear(limite.getFullYear() - this.EDAD_MINIMA);
    return limite.toISOString().slice(0, 10);
  }

  /**
   * Si la fecha alcanza la edad mínima. Es la misma cuenta que hace el `check`
   * de la base, y se hace igual —comparando fechas, no restando años— para que
   * el cumpleaños de hoy cuente.
   */
  static tieneEdadSuficiente(fechaNacimiento: string, hoy: Date): boolean {
    if (!fechaNacimiento) return false;
    return fechaNacimiento <= this.fechaMaximaDeNacimiento(hoy);
  }

  /**
   * Deja el RUT en los dígitos solos. Se guarda normalizado para que el índice
   * único sirva: `21.000.123-0011` y `210001230011` son el mismo contribuyente
   * y la base tiene que verlos iguales.
   */
  static normalizarRut(valor: string): string {
    return valor.replace(/\D/g, "");
  }

  /**
   * El RUT uruguayo tiene doce dígitos. No se verifica el dígito verificador
   * ni se consulta a DGI: eso es una integración, no una validación de
   * formulario, y prometerla sin tenerla sería peor que no validar.
   */
  static rutValido(valor: string): boolean {
    return /^\d{12}$/.test(this.normalizarRut(valor));
  }

  /** Qué está mal en una imagen, o `null` si está bien. Vale para avatar y logo. */
  static problemaDeImagen(archivo: File): string | null {
    if (archivo.size === 0) return null;

    if (archivo.size > this.PESO_MAXIMO_IMAGEN) {
      const mb = (this.PESO_MAXIMO_IMAGEN / 1024 / 1024).toFixed(0);
      return `La imagen supera los ${mb} MB.`;
    }

    if (!(this.FORMATOS_IMAGEN as readonly string[]).includes(archivo.type)) {
      return "La imagen tiene que ser JPG, PNG o WebP.";
    }

    return null;
  }
}
