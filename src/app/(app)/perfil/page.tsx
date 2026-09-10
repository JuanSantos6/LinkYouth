import type { Metadata } from "next";

import { Encabezado } from "@/components/layout/Encabezado";
import { IconoVerificado } from "@/components/layout/Iconos";
import { AvatarEditable } from "@/components/perfil/AvatarEditable";
import { FormularioPerfil } from "@/components/perfil/FormularioPerfil";
import { ListaFormacion } from "@/components/perfil/ListaFormacion";
import { NubeTags } from "@/components/perfil/NubeTags";
import { AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { Insignia } from "@/components/ui/Insignia";
import { Tarjeta } from "@/components/ui/Tarjeta";
// TODO: reconectar contra db/schema.sql
import { obtenerPerfilActual } from "@/lib/data/consultas";

export const metadata: Metadata = { title: "Mi perfil" };
export const dynamic = "force-dynamic";

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <Tarjeta como="section" className="p-6">
      <div className="mb-5 border-b border-borde pb-4">
        <h2 className="text-base font-bold text-tinta">{titulo}</h2>
        {descripcion && (
          <p className="mt-1 text-sm text-tinta-suave">{descripcion}</p>
        )}
      </div>
      {children}
    </Tarjeta>
  );
}

/**
 * Vista de perfil.
 *
 * A diferencia del feed, esta pantalla ocupa el ancho completo: no hay
 * columna derecha que repita los datos que se están editando acá.
 */
export default async function PaginaPerfil() {
  const perfil = await obtenerPerfilActual();
  const datos = perfil.datos;
  const nombreCompleto = `${datos.nombre} ${datos.apellido}`;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Encabezado
        titulo="Mi perfil"
        descripcion="Esto es lo que ve una empresa cuando entra a tu perfil. LinkYouth no usa currículum: lo que cuenta son tus habilidades y tu formación."
        acciones={
          datos.verificado ? (
            <Insignia tono="exito">
              <IconoVerificado className="h-3.5 w-3.5" />
              Verificado
            </Insignia>
          ) : undefined
        }
      />

      <AvisoOrigen resultado={perfil} />

      <Seccion
        titulo="Datos personales"
        descripcion="Tu nombre, dónde estás y cómo te presentás."
      >
        <div className="space-y-6">
          <AvatarEditable nombre={nombreCompleto} url={datos.avatar_url} />
          <FormularioPerfil perfil={datos} />
        </div>
      </Seccion>

      <Seccion
        titulo="Habilidades"
        descripcion="Las etiquetas con las que la plataforma te acerca vacantes y eventos."
      >
        <NubeTags tags={datos.tags} />
      </Seccion>

      <Seccion
        titulo="Formación"
        descripcion="Estudios en curso y finalizados. Las instituciones acreditadas aparecen marcadas."
      >
        <ListaFormacion formaciones={datos.formaciones} />
      </Seccion>
    </div>
  );
}
