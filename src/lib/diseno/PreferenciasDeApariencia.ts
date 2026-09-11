import {
  ACENTO_POR_DEFECTO,
  CLAVE_ACENTO,
  CLAVE_TEMA,
  TEMA_POR_DEFECTO,
  esNombreDeAcento,
  esTema,
  type NombreDeAcento,
  type Tema,
} from "./tokens";

/**
 * El tema y el acento elegidos por quien está usando la aplicación.
 *
 * Los guarda en `localStorage` y los aplica como atributos del elemento raíz,
 * que es de donde los lee el CSS. Está acá y no dentro del componente porque
 * el guion que corre antes del primer pintado escribe esos mismos atributos:
 * si cada uno tuviera su propia idea de dónde vive la preferencia, la pantalla
 * arrancaría con un valor y seguiría con otro.
 *
 * Nada de esto lanza: en una ventana privada o con el almacenamiento
 * bloqueado, la preferencia no persiste entre visitas pero la sesión en curso
 * sigue funcionando.
 */
export class PreferenciasDeApariencia {
  private constructor(private readonly raiz: HTMLElement) {}

  static delDocumento(): PreferenciasDeApariencia {
    return new PreferenciasDeApariencia(document.documentElement);
  }

  get tema(): Tema {
    const valor = this.raiz.dataset.tema;
    return esTema(valor) ? valor : TEMA_POR_DEFECTO;
  }

  get acento(): NombreDeAcento {
    const valor = this.raiz.dataset.acento;
    return esNombreDeAcento(valor) ? valor : ACENTO_POR_DEFECTO;
  }

  get enOscuro(): boolean {
    return this.tema === "oscuro";
  }

  cambiarTema(tema: Tema): void {
    this.raiz.dataset.tema = tema;
    this.recordar(CLAVE_TEMA, tema);
  }

  alternarTema(): Tema {
    const siguiente: Tema = this.enOscuro ? "claro" : "oscuro";
    this.cambiarTema(siguiente);

    return siguiente;
  }

  cambiarAcento(acento: NombreDeAcento): void {
    this.raiz.dataset.acento = acento;
    this.recordar(CLAVE_ACENTO, acento);
  }

  private recordar(clave: string, valor: string): void {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      // Almacenamiento bloqueado: la elección vale para esta sesión y nada más.
    }
  }
}
