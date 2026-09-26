import { CLAVE_TEMA, TEMA_POR_DEFECTO, esTema, type Tema } from "./tokens";

/**
 * El tema elegido por quien está usando la aplicación.
 *
 * Por defecto es «sistema»: no se escribe nada en el elemento raíz y el CSS
 * sigue a `prefers-color-scheme`. Si la persona elige «claro» u «oscuro», se
 * guarda en `localStorage` y se aplica como `data-tema` en `<html>`, que es de
 * donde lo lee el CSS.
 *
 * Está acá y no dentro del componente porque el guion que corre antes del
 * primer pintado (`src/app/layout.tsx`) escribe ese mismo atributo: si cada
 * uno tuviera su propia idea de dónde vive la preferencia, la pantalla
 * arrancaría con un valor y seguiría con otro.
 *
 * Nada de esto lanza: en una ventana privada o con el almacenamiento
 * bloqueado, la elección no persiste entre visitas pero la sesión en curso
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

  /** Si la pantalla se ve oscura ahora, sea por elección o por el sistema. */
  get seVeOscuro(): boolean {
    if (this.tema === "oscuro") return true;
    if (this.tema === "claro") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  cambiarTema(tema: Tema): void {
    if (tema === "sistema") {
      delete this.raiz.dataset.tema;
    } else {
      this.raiz.dataset.tema = tema;
    }

    try {
      if (tema === "sistema") localStorage.removeItem(CLAVE_TEMA);
      else localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      // Sin almacenamiento, la elección vale para esta visita.
    }
  }
}
