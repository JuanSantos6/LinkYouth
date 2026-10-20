import "server-only";

import nodemailer from "nodemailer";

import { crearClienteDeServicio } from "@/lib/supabase/admin";

import { armarCorreo, esDireccionDePrueba } from "./plantilla";

/**
 * Despacho de la cola `correos_pendientes` por SMTP (RF6.3).
 *
 * La cola la llenan los disparadores de la base (migración 007) solo para lo
 * importante: al joven, cuando lo seleccionan o lo descartan; a la empresa,
 * cuando recibe una postulación. Acá se toma lo pendiente con
 * `reclamar_correos_pendientes` —que reparte la cola entre despachos
 * simultáneos—, se busca el correo de cada cuenta en GoTrue y se manda.
 *
 * Lo llaman las acciones que pueden generar un correo, con `after()`: la
 * respuesta a quien tocó el botón no espera a Gmail. Lo que falla queda en la
 * cola y se reintenta en el próximo despacho (hasta 5 veces).
 *
 * Sin configuración SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) no hace nada:
 * los avisos siguen en la página, y en desarrollo no sale ningún correo.
 */

type Configuracion = {
  transporte: ReturnType<typeof nodemailer.createTransport>;
  remitente: string;
  urlPublica: string;
};

let configuracion: Configuracion | null | undefined;

function leerConfiguracion(): Configuracion | null {
  if (configuracion !== undefined) return configuracion;
  const {
    SMTP_HOST: host,
    SMTP_PORT: puerto,
    SMTP_USER: usuario,
    SMTP_PASS: clave,
    CORREO_REMITENTE: remitente,
    URL_PUBLICA: urlPublica,
  } = process.env;

  if (!host || !usuario || !clave || !urlPublica) {
    configuracion = null;
    return null;
  }

  const port = Number(puerto ?? 587);
  configuracion = {
    transporte: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: usuario, pass: clave },
    }),
    remitente: remitente ?? `LinkYouth <${usuario}>`,
    urlPublica,
  };
  return configuracion;
}

/** Manda lo que haya en la cola. Nunca lanza: lo que falla queda anotado. */
export async function despacharCorreos(limite = 20): Promise<void> {
  const config = leerConfiguracion();
  const servicio = crearClienteDeServicio();
  if (!config || !servicio) return;

  const { data: pendientes, error } = await servicio.rpc(
    "reclamar_correos_pendientes",
    { limite },
  );
  if (error || !pendientes) return;

  for (const pendiente of pendientes) {
    const cerrar = (cambios: { enviado_en?: string; ultimo_error?: string }) =>
      servicio
        .from("correos_pendientes")
        .update(cambios)
        .eq("id", pendiente.id);

    try {
      const [{ data: usuario }, { data: cuenta }] = await Promise.all([
        servicio.auth.admin.getUserById(pendiente.cuenta_id),
        servicio
          .from("cuentas")
          .select("eliminada")
          .eq("id", pendiente.cuenta_id)
          .maybeSingle(),
      ]);
      const destino = usuario.user?.email;

      // Sin dirección, cuenta dada de baja o dominio de prueba: no se manda,
      // y se cierra para no reintentarlo.
      if (!destino || cuenta?.eliminada || esDireccionDePrueba(destino)) {
        await cerrar({
          enviado_en: new Date().toISOString(),
          ultimo_error: "omitido: sin dirección válida",
        });
        continue;
      }

      const correo = armarCorreo(pendiente, config.urlPublica);
      await config.transporte.sendMail({
        from: config.remitente,
        to: destino,
        subject: correo.asunto,
        text: correo.texto,
        html: correo.html,
      });
      await cerrar({ enviado_en: new Date().toISOString() });
    } catch (e) {
      await cerrar({
        ultimo_error: e instanceof Error ? e.message.slice(0, 500) : "error",
      });
    }
  }
}
