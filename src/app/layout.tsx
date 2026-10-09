import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import { headers } from "next/headers";

import { ProveedorDeTransiciones } from "@/components/navegacion/Transiciones";
import { CLAVE_TEMA } from "@/lib/diseno/tokens";
import { CABECERA_NONCE } from "@/lib/seguridad/csp";

import "./globals.css";

/*
 * Red Hat Display para títulos y cifras, Red Hat Text para leer: una misma
 * familia en dos cortes. Formas amables con origen corporativo, que es el
 * registro que busca LinkYouth: cercano con los jóvenes, serio con las
 * empresas. Ver `docs/decisiones.md`, 2026-09-27.
 */
const display = Red_Hat_Display({
  variable: "--fuente-titulo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const texto = Red_Hat_Text({
  variable: "--fuente-cuerpo",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LinkYouth",
    template: "%s · LinkYouth",
  },
  description:
    "Plataforma de primer empleo, formación y networking para jóvenes.",
};

/**
 * Aplica el tema elegido antes del primer pintado.
 *
 * Sin elección guardada no escribe nada y el CSS sigue al sistema. Va en línea
 * y sin `defer` a propósito: si esperara a la hidratación, la pantalla
 * arrancaría en un tema y saltaría al otro a la vista de todos.
 *
 * Lleva el nonce de la Content-Security-Policy (`src/lib/seguridad/csp.ts`):
 * sin él, el navegador no ejecuta ningún script en línea.
 */
const GUION_DE_TEMA = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  CLAVE_TEMA,
)});if(t==="claro"||t==="oscuro"){document.documentElement.dataset.tema=t;}}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get(CABECERA_NONCE) ?? undefined;

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${display.variable} ${texto.variable}`}
    >
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: GUION_DE_TEMA }}
        />
      </head>
      {/*
        Las variables de las fuentes van en <html>: los tokens de `@theme` se
        resuelven en `:root`, y si la variable viviera en <body> el token
        quedaría inválido y se vería la fuente de respaldo.
      */}
      <body className="antialiased">
        <ProveedorDeTransiciones>{children}</ProveedorDeTransiciones>
      </body>
    </html>
  );
}
