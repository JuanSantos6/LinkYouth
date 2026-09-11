import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";

import {
  ACENTO_POR_DEFECTO,
  CLAVE_ACENTO,
  CLAVE_TEMA,
  TEMA_POR_DEFECTO,
  reglasDeAcento,
} from "@/lib/diseno/tokens";

import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--fuente-titulo",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const instrument = Instrument_Sans({
  variable: "--fuente-cuerpo",
  subsets: ["latin"],
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
 * Aplica el tema y el acento guardados antes del primer pintado.
 *
 * Va en línea y sin `defer` a propósito: si esperara a la hidratación, la
 * pantalla arrancaría en claro y saltaría a oscuro a la vista de todos. Si
 * `localStorage` no está disponible —modo privado, permisos—, caen los
 * valores por defecto en lugar de romper el render.
 */
const GUION_DE_TEMA = `(function(){try{var r=document.documentElement,t=localStorage.getItem(${JSON.stringify(
  CLAVE_TEMA,
)}),a=localStorage.getItem(${JSON.stringify(CLAVE_ACENTO)});r.dataset.tema=(t==="claro"||t==="oscuro")?t:${JSON.stringify(
  TEMA_POR_DEFECTO,
)};r.dataset.acento=a||${JSON.stringify(
  ACENTO_POR_DEFECTO,
)}}catch(e){document.documentElement.dataset.tema=${JSON.stringify(
  TEMA_POR_DEFECTO,
)};document.documentElement.dataset.acento=${JSON.stringify(ACENTO_POR_DEFECTO)}}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-tema={TEMA_POR_DEFECTO}
      data-acento={ACENTO_POR_DEFECTO}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: GUION_DE_TEMA }} />
        <style dangerouslySetInnerHTML={{ __html: reglasDeAcento() }} />
      </head>
      <body
        className={`${bricolage.variable} ${instrument.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
