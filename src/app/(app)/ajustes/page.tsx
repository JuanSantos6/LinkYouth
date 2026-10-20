import type { Metadata } from "next";

import { ControlesDeApariencia } from "@/components/ajustes/ControlesDeApariencia";
import { FormularioContrasenia } from "@/components/ajustes/FormularioContrasenia";
import { FormularioCorreo } from "@/components/ajustes/FormularioCorreo";
import { FormularioEliminarCuenta } from "@/components/ajustes/FormularioEliminarCuenta";
import { FormularioNombreDeUsuario } from "@/components/ajustes/FormularioNombreDeUsuario";
import { Encabezado } from "@/components/layout/Encabezado";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { obtenerPerfilActual } from "@/lib/data/consultas";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ajustes" };
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
      <div className="mb-5 border-b border-filete pb-4">
        <h2 className="text-[18px] text-tinta">{titulo}</h2>
        {descripcion && (
          <p className="mt-1 text-[14px] text-apagado">{descripcion}</p>
        )}
      </div>
      {children}
    </Tarjeta>
  );
}

/**
 * RF1.5 y RF1.7 — Ajustes de apariencia y de cuenta del joven.
 */
export default async function PaginaAjustes() {
  const respuesta = await (await createClient())?.auth.getUser();
  const usuario = respuesta?.data.user ?? null;
  const perfil = usuario ? await obtenerPerfilActual(usuario.id) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Encabezado
        titulo="Ajustes"
        descripcion="Cómo se ve LinkYouth para vos y los datos de acceso de tu cuenta."
      />

      <Tarjeta como="section" className="p-6">
        <ControlesDeApariencia />
      </Tarjeta>

      <Seccion
        titulo="Nombre de usuario"
        descripcion="Es el identificador público de tu perfil y con el que también podés iniciar sesión."
      >
        <FormularioNombreDeUsuario actual={perfil?.datos.nombre_usuario} />
      </Seccion>

      <Seccion
        titulo="Contraseña"
        descripcion="Para elegir una nueva tenés que confirmar la que usás hoy."
      >
        <FormularioContrasenia />
      </Seccion>

      <Seccion
        titulo="Correo"
        descripcion="El cambio queda activo cuando abrís el enlace que te enviamos a la dirección nueva."
      >
        <FormularioCorreo correoActual={usuario?.email ?? null} />
      </Seccion>

      <div className="border-t border-filete pt-6">
        <Tarjeta como="section" className="border-alerta/40 p-6">
          <div className="mb-5 border-b border-filete pb-4">
            <h2 className="text-[18px] text-tinta">Eliminar la cuenta</h2>
            <p className="mt-1 text-[14px] text-apagado">
              Da de baja tu cuenta de forma permanente y borra tus datos
              personales.
            </p>
          </div>
          <FormularioEliminarCuenta tipo="individual" />
        </Tarjeta>
      </div>
    </div>
  );
}
