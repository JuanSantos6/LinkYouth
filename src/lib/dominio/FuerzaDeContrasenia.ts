/** Los tres niveles del medidor, de menor a mayor. */
export const NIVELES = ["debil", "media", "fuerte"] as const;
export type Nivel = (typeof NIVELES)[number];

/**
 * Largo mínimo. Ocho es el piso de NIST SP 800-63B para una contraseña
 * elegida por la persona.
 */
export const LARGO_MINIMO = 8;

/**
 * Largo máximo. No es una restricción de seguridad —bcrypt hashea cualquier
 * cosa— sino de la implementación: bcrypt trunca en 72 bytes, así que más allá
 * de ahí los caracteres extra no cuentan y la interfaz estaría mintiendo.
 * Sesenta y cuatro deja margen para acentos y emojis, que ocupan más de un
 * byte.
 */
export const LARGO_MAXIMO = 64;

/** Un requisito con su texto, tal como se le muestra a la persona. */
type Requisito = { cumple: boolean; texto: string };

/**
 * Qué tan buena es una contraseña y por qué (RF1.1, RNF5).
 *
 * Vive acá y no en el componente por la regla de `CLAUDE.md`: el medidor
 * pinta barras, no decide qué es una contraseña aceptable. Además la misma
 * clase la usan las dos capas —el formulario para el aviso en vivo y la
 * acción de servidor para aceptar o rechazar—, y eso es justamente lo que
 * evita que se desincronicen. El navegador es comodidad; la acción de
 * servidor es la que decide.
 *
 * El puntaje no pretende ser una medida de entropía: es la cuenta de
 * requisitos cumplidos. Una barra verde no promete que la contraseña sea
 * buena, promete que cumple lo que la plataforma pide.
 */
export class FuerzaDeContrasenia {
  constructor(private readonly valor: string) {}

  /** Los tres requisitos obligatorios, con el texto que ve la persona. */
  get requisitos(): Requisito[] {
    return [
      {
        cumple:
          this.valor.length >= LARGO_MINIMO &&
          this.valor.length <= LARGO_MAXIMO,
        texto: `Entre ${LARGO_MINIMO} y ${LARGO_MAXIMO} caracteres`,
      },
      {
        cumple: /[A-ZÁÉÍÓÚÑÜ]/.test(this.valor),
        texto: "Al menos una mayúscula",
      },
      { cumple: /\d/.test(this.valor), texto: "Al menos un número" },
    ];
  }

  /** Cuántos de los tres requisitos cumple. */
  get puntaje(): number {
    return this.requisitos.filter((requisito) => requisito.cumple).length;
  }

  /**
   * Los requisitos son la condición de entrada; lo que separa «media» de
   * «fuerte» es el margen de más: doce caracteres o un símbolo. Sin eso, una
   * contraseña que cumple lo mínimo se vería verde y nadie la mejoraría.
   */
  get nivel(): Nivel {
    if (this.puntaje < 3) return this.puntaje <= 1 ? "debil" : "media";

    const conMargen =
      this.valor.length >= 12 || /[^\p{L}\p{N}]/u.test(this.valor);
    return conMargen ? "fuerte" : "media";
  }

  /** Cuántos de los tres segmentos del medidor se pintan. */
  get segmentos(): number {
    return { debil: 1, media: 2, fuerte: 3 }[this.nivel];
  }

  /** El texto que acompaña a la barra. El color nunca va solo (WCAG 1.4.1). */
  get etiqueta(): string {
    return { debil: "Débil", media: "Media", fuerte: "Fuerte" }[this.nivel];
  }

  /**
   * Si la acción de servidor la acepta. No alcanza con verse amarilla: los
   * tres requisitos son obligatorios, el nivel es solo cómo se comunica.
   */
  get esAceptable(): boolean {
    return this.puntaje === 3;
  }

  /**
   * El motivo del rechazo, para la acción de servidor. Nombra lo que falta en
   * lugar de repetir la regla entera: quien puso siete caracteres no necesita
   * que le recuerden que también hacen falta mayúsculas si ya tiene una.
   */
  get motivoDelRechazo(): string | null {
    if (this.esAceptable) return null;

    const faltan = this.requisitos
      .filter((requisito) => !requisito.cumple)
      .map((requisito) => requisito.texto.toLowerCase());

    return `La contraseña no cumple: ${faltan.join(", ")}.`;
  }
}
