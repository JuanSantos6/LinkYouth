import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { BUCKET_IMAGENES } from "@/lib/supabase/almacenamiento";
import { rutaDeImagen } from "@/lib/supabase/rutaDeImagen";
import { aplicarImagenPendiente } from "./imagenPendiente";
import type { Database } from "@/types/database";

import {
  CLAVE_DUPLICADA,
  type EstadoAccion,
  type EstadoFormulario,
} from "./tipos";

/**
 * Qué pasa cuando el alta falla por un motivo que la persona no puede
 * arreglar. El texto de Postgres («new row violates row-level security
 * policy…») no le dice nada y asusta; queda en el registro del servidor, que
 * es donde lo va a buscar quien lo tenga que arreglar.
 */
const ALTA_NO_COMPLETADA =
  "No pudimos terminar de crear tu cuenta. Probá de nuevo en unos minutos; si sigue pasando, escribinos y lo resolvemos.";

function fallaDelAlta(paso: string, detalle: string): EstadoFormulario {
  console.error(`Alta pendiente: falló «${paso}»: ${detalle}`);
  return { estado: "error", mensaje: ALTA_NO_COMPLETADA };
}

/** Código de Postgres para violación de una restricción `check`. */
const CHECK_VIOLADO = "23514";

/**
 * Un solo texto para las dos veces que se detecta el nombre repetido: la
 * verificación previa al `signUp` y el índice único de `perfiles`.
 */
export const USUARIO_OCUPADO: EstadoFormulario = {
  estado: "error",
  mensaje: "Ese nombre de usuario ya está en uso. Probá con otro.",
  campos: {
    nombre_usuario: "Ese nombre de usuario ya está en uso. Probá con otro.",
  },
};

/**
 * Un solo texto para las dos veces que se detecta la razón social repetida: la
 * verificación previa al `signUp` y el índice único de `empresas`.
 */
export const RAZON_SOCIAL_OCUPADA: EstadoFormulario = {
  estado: "error",
  mensaje: "Ya hay una empresa registrada con esa razón social.",
  campos: {
    razon_social: "Ya hay una empresa registrada con esa razón social.",
  },
};

/**
 * Un solo texto para el RUT repetido: la verificación previa y el índice
 * único de `empresas`.
 */
export const RUT_OCUPADO: EstadoFormulario = {
  estado: "error",
  mensaje: "Ya hay una empresa registrada con ese RUT.",
  campos: {
    rut: "Ya hay una empresa registrada con ese RUT.",
  },
};

/**
 * Datos del formulario de registro que no van a `auth.users` sino a
 * `perfiles`. Viajan en `options.data` del `signUp` para que sigan
 * disponibles cuando el alta se complete recién en el primer inicio de
 * sesión (ver `completarAlta`).
 */
export type DatosDePerfil = {
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  pais: string;
  nombre_usuario: string;
  /** Ids de `tags`, no nombres: es lo que guarda `perfil_tags` (RF1.1.11). */
  tags: string[];
};

/** Lo mismo que `DatosDePerfil`, para una cuenta de empresa (RF1.2). */
export type DatosDeEmpresa = {
  razon_social: string;
  rut: string;
  rubro: string;
  descripcion: string;
  logo_url: string;
};

/** Lo mismo, pero recuperado de `user_metadata` en un inicio de sesión. */
function leerDatosDeMetadata(user: User): DatosDePerfil | null {
  const meta = user.user_metadata as Partial<DatosDePerfil> | undefined;
  if (
    !meta?.nombre ||
    !meta.apellido ||
    !meta.fecha_nacimiento ||
    !meta.pais ||
    !meta.nombre_usuario
  ) {
    return null;
  }

  return {
    nombre: meta.nombre,
    apellido: meta.apellido,
    fecha_nacimiento: meta.fecha_nacimiento,
    pais: meta.pais,
    nombre_usuario: meta.nombre_usuario,
    // Los intereses pueden faltar en una cuenta creada antes de RF1.1.11.
    tags: Array.isArray(meta.tags) ? meta.tags : [],
  };
}

/** Lo mismo, para una cuenta de empresa. */
function leerEmpresaDeMetadata(user: User): DatosDeEmpresa | null {
  const meta = user.user_metadata as Partial<DatosDeEmpresa> | undefined;
  if (!meta?.razon_social || !meta.rubro) return null;

  return {
    razon_social: meta.razon_social,
    rut: meta.rut ?? "",
    rubro: meta.rubro,
    descripcion: meta.descripcion ?? "",
    logo_url: meta.logo_url ?? "",
  };
}

/**
 * Crea las dos filas que acompañan a un usuario de `auth.users`: la cuenta y
 * el perfil. Requiere sesión activa, porque las políticas
 * `cuentas_creo_la_mia` y `perfiles_creo_el_mio` exigen `auth.uid() = id`.
 *
 * Es idempotente: las dos escrituras ignoran el conflicto por clave primaria,
 * así que volver a llamarla sobre una cuenta ya creada no hace nada. Eso es
 * lo que permite invocarla tanto al registrarse como al iniciar sesión.
 *
 * Devuelve `null` si salió bien, o el `EstadoAccion` del error si no.
 */
export async function completarAlta(
  supabase: SupabaseClient<Database>,
  user: User,
  datos: DatosDePerfil,
): Promise<EstadoFormulario | null> {
  const { error: errorCuenta } = await supabase
    .from("cuentas")
    .upsert(
      { id: user.id, tipo: "individual" },
      { onConflict: "id", ignoreDuplicates: true },
    );

  if (errorCuenta) return fallaDelAlta("cuentas", errorCuenta.message);

  const { error } = await supabase.from("perfiles").upsert(
    {
      id: user.id,
      nombre: datos.nombre,
      apellido: datos.apellido,
      fecha_nacimiento: datos.fecha_nacimiento,
      pais: datos.pais,
      nombre_usuario: datos.nombre_usuario,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (!error) return null;

  // La edad la exige el constraint `perfiles_mayor_de_edad` de db/schema.sql
  // (RF1.1.8). No se repite la comprobación acá: la base es la única fuente
  // de la regla y el código solo traduce su respuesta.
  if (error.code === CHECK_VIOLADO) {
    const mensaje = "Tenés que ser mayor de 18 años para registrarte.";
    return {
      estado: "error",
      mensaje,
      campos: { fecha_nacimiento: mensaje },
    };
  }

  // El conflicto por `id` ya está ignorado arriba, así que una clave duplicada
  // acá solo puede venir del índice único de `nombre_usuario`.
  if (error.code === CLAVE_DUPLICADA) return USUARIO_OCUPADO;

  return fallaDelAlta("alta", error.message);
}

/**
 * Guarda los intereses elegidos al registrarse (RF1.1.11).
 *
 * Va después de `perfiles` y no junto con ella: `perfil_tags.perfil_id`
 * referencia al perfil, así que sin la fila la inserción no tiene a qué
 * apuntar.
 *
 * Ignora el conflicto porque la clave primaria es `(perfil_id, tag_id)`: si el
 * alta se reintenta —lo que pasa cada vez que se inicia sesión con el alta a
 * medio terminar— los intereses ya guardados no vuelven a insertarse.
 */
export async function guardarIntereses(
  supabase: SupabaseClient<Database>,
  usuarioId: string,
  tags: string[],
): Promise<EstadoAccion | null> {
  if (tags.length === 0) return null;

  const { error } = await supabase.from("perfil_tags").upsert(
    tags.map((tagId) => ({ perfil_id: usuarioId, tag_id: tagId })),
    { onConflict: "perfil_id,tag_id", ignoreDuplicates: true },
  );

  return error ? fallaDelAlta("perfil_tags", error.message) : null;
}

/**
 * El equivalente de `completarAlta` para una cuenta de empresa (RF1.2).
 *
 * Mismo contrato: idempotente, requiere sesión activa, devuelve `null` si salió
 * bien. El orden importa y no es intercambiable — el disparador
 * `validar_tipo_cuenta` de `db/schema.sql` exige que la fila de `cuentas` ya
 * exista con `tipo = 'empresa'` antes de aceptar la de `empresas`.
 */
/**
 * El logo que se guarda al dar de alta una empresa.
 *
 * `logo_url` llega del formulario o de `user_metadata`, y las dos cosas las
 * controla quien se registra (la metadata se reescribe con
 * `auth.updateUser`). Sin este filtro, una empresa podía guardar como logo
 * una URL de otro sitio, y la portada —pública— se la pedía a ese sitio en
 * nombre de cada visitante. Solo se acepta un archivo de Storage dentro de la
 * carpeta de esta misma cuenta, que es lo que deja `subirImagenDePerfil`.
 * Ver `docs/seguridad.md`.
 */
function logoDeLaCuenta(url: string, usuarioId: string): string | null {
  const ruta = rutaDeImagen(url);
  return ruta?.startsWith(
    `/storage/v1/object/public/${BUCKET_IMAGENES}/${usuarioId}/`,
  )
    ? ruta
    : null;
}

export async function completarAltaEmpresa(
  supabase: SupabaseClient<Database>,
  user: User,
  datos: DatosDeEmpresa,
): Promise<EstadoFormulario | null> {
  const { error: errorCuenta } = await supabase
    .from("cuentas")
    .upsert(
      { id: user.id, tipo: "empresa" },
      { onConflict: "id", ignoreDuplicates: true },
    );

  if (errorCuenta) return fallaDelAlta("cuentas", errorCuenta.message);

  const { error } = await supabase.from("empresas").upsert(
    {
      id: user.id,
      razon_social: datos.razon_social,
      rut: datos.rut || null,
      rubro: datos.rubro,
      descripcion: datos.descripcion || null,
      logo_url: logoDeLaCuenta(datos.logo_url, user.id),
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (!error) return null;

  // El conflicto por `id` ya está ignorado arriba, así que una clave duplicada
  // acá solo puede venir de uno de los dos índices únicos de `empresas`. Cuál
  // de los dos lo dice el nombre de la restricción, que Postgres pone en el
  // mensaje: sin mirarlo, quien repitió el RUT leería que le rechazaron la
  // razón social y no encontraría nunca el campo que tiene mal.
  if (error.code === CLAVE_DUPLICADA) {
    return /rut/i.test(error.message) ? RUT_OCUPADO : RAZON_SOCIAL_OCUPADA;
  }

  return fallaDelAlta("alta", error.message);
}

/**
 * Completa lo que haya quedado pendiente del alta de una cuenta recién
 * confirmada: cuenta, perfil o empresa, e intereses.
 *
 * Lo llaman `iniciarSesion` y `/auth/callback`. Cuál de las dos altas quedó
 * pendiente lo dice qué guardó el registro en `user_metadata`:
 * `nombre_usuario` para individual, `razon_social` para empresa. Las dos son
 * idempotentes, así que en un login de una cuenta ya completa no hacen nada.
 *
 * Requiere la sesión de esa cuenta: las políticas `cuentas_creo_la_mia` y
 * `perfiles_creo_el_mio` exigen `auth.uid() = id`.
 */
export async function completarAltaPendiente(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<EstadoAccion | null> {
  const perfil = leerDatosDeMetadata(user);
  if (perfil) {
    const fallo = await completarAlta(supabase, user, perfil);
    if (fallo) return fallo;

    // Los intereses también quedaron pendientes: sin sesión, la política
    // `perfil_tags_agrego_los_mios` no los dejaba entrar al registrarse.
    const falloIntereses = await guardarIntereses(
      supabase,
      user.id,
      perfil.tags,
    );
    if (falloIntereses) return falloIntereses;
  }

  const empresa = leerEmpresaDeMetadata(user);
  if (empresa) {
    const fallo = await completarAltaEmpresa(supabase, user, empresa);
    if (fallo) return fallo;
  }

  // La foto o el logo que se eligió al registrarse, ya con sesión. Un fallo
  // acá no deshace el alta: queda el aviso para subirla desde el perfil.
  await aplicarImagenPendiente(supabase, user);

  return null;
}
