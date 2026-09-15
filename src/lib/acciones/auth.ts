"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { comoTipoCuenta } from "@/lib/data/tipos";
import { FuerzaDeContrasenia } from "@/lib/dominio/FuerzaDeContrasenia";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";
import {
  leerArchivo,
  subirImagenDePerfil,
} from "@/lib/supabase/almacenamiento";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import { CLAVE_DUPLICADA, SIN_CONFIGURAR, type EstadoAccion } from "./tipos";

/** Código de Postgres para violación de una restricción `check`. */
const CHECK_VIOLADO = "23514";

/**
 * Un solo texto para las dos veces que se detecta el nombre repetido: la
 * verificación previa al `signUp` y el índice único de `perfiles`.
 */
const USUARIO_OCUPADO: EstadoAccion = {
  estado: "error",
  mensaje: "Ese nombre de usuario ya está en uso. Probá con otro.",
};

/**
 * Un solo texto para las dos veces que se detecta la razón social repetida: la
 * verificación previa al `signUp` y el índice único de `empresas`.
 */
const RAZON_SOCIAL_OCUPADA: EstadoAccion = {
  estado: "error",
  mensaje: "Ya hay una empresa registrada con esa razón social.",
};

/**
 * Un solo texto para el RUT repetido: la verificación previa y el índice
 * único de `empresas`.
 */
const RUT_OCUPADO: EstadoAccion = {
  estado: "error",
  mensaje: "Ya hay una empresa registrada con ese RUT.",
};

/**
 * Datos del formulario de registro que no van a `auth.users` sino a
 * `perfiles`. Viajan en `options.data` del `signUp` para que sigan
 * disponibles cuando el alta se complete recién en el primer inicio de
 * sesión (ver `completarAlta`).
 */
type DatosDePerfil = {
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  pais: string;
  nombre_usuario: string;
  /** Ids de `tags`, no nombres: es lo que guarda `perfil_tags` (RF1.1.11). */
  tags: string[];
};

/** Lo mismo que `DatosDePerfil`, para una cuenta de empresa (RF1.2). */
type DatosDeEmpresa = {
  razon_social: string;
  rut: string;
  rubro: string;
  descripcion: string;
  logo_url: string;
};

function leerDatosDePerfil(datos: FormData): DatosDePerfil {
  return {
    nombre: String(datos.get("nombre") ?? "").trim(),
    apellido: String(datos.get("apellido") ?? "").trim(),
    fecha_nacimiento: String(datos.get("fecha_nacimiento") ?? "").trim(),
    pais: String(datos.get("pais") ?? "").trim(),
    nombre_usuario: String(datos.get("nombre_usuario") ?? "").trim(),
    // `getAll` y no `get`: el selector manda un campo oculto por interés.
    tags: datos.getAll("tags").map(String).filter(Boolean),
  };
}

function leerDatosDeEmpresa(datos: FormData): DatosDeEmpresa {
  return {
    razon_social: String(datos.get("razon_social") ?? "").trim(),
    // Se guarda en dígitos pelados: `21.000.123-0011` y `210001230011` son el
    // mismo contribuyente, y el índice único tiene que verlos iguales.
    rut: ReglasDeRegistro.normalizarRut(String(datos.get("rut") ?? "")),
    rubro: String(datos.get("rubro") ?? "").trim(),
    descripcion: String(datos.get("descripcion") ?? "").trim(),
    logo_url: String(datos.get("logo_url") ?? "").trim(),
  };
}

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
async function completarAlta(
  supabase: SupabaseClient<Database>,
  user: User,
  datos: DatosDePerfil,
): Promise<EstadoAccion | null> {
  const { error: errorCuenta } = await supabase
    .from("cuentas")
    .upsert(
      { id: user.id, tipo: "individual" },
      { onConflict: "id", ignoreDuplicates: true },
    );

  if (errorCuenta) {
    return { estado: "error", mensaje: errorCuenta.message };
  }

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
    return {
      estado: "error",
      mensaje: "Tenés que ser mayor de 18 años para registrarte.",
    };
  }

  // El conflicto por `id` ya está ignorado arriba, así que una clave duplicada
  // acá solo puede venir del índice único de `nombre_usuario`.
  if (error.code === CLAVE_DUPLICADA) return USUARIO_OCUPADO;

  return { estado: "error", mensaje: error.message };
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
async function guardarIntereses(
  supabase: SupabaseClient<Database>,
  usuarioId: string,
  tags: string[],
): Promise<EstadoAccion | null> {
  if (tags.length === 0) return null;

  const { error } = await supabase.from("perfil_tags").upsert(
    tags.map((tagId) => ({ perfil_id: usuarioId, tag_id: tagId })),
    { onConflict: "perfil_id,tag_id", ignoreDuplicates: true },
  );

  return error ? { estado: "error", mensaje: error.message } : null;
}

/**
 * Sube la foto de perfil o el logo y la deja apuntada en la fila.
 *
 * **No corta el alta si falla.** Para cuando esta función corre, la cuenta ya
 * existe: devolver un error dejaría el formulario diciendo que el registro no
 * anduvo, y el segundo intento chocaría con un correo ya registrado. La foto
 * se puede cargar después desde el perfil; la cuenta no se puede crear dos
 * veces. El motivo queda en el registro del servidor.
 */
async function guardarImagen(
  supabase: SupabaseClient<Database>,
  tabla: "perfiles" | "empresas",
  usuarioId: string,
  archivo: File,
): Promise<void> {
  const { url, problema } = await subirImagenDePerfil(
    supabase,
    usuarioId,
    archivo,
  );

  if (!url) {
    console.warn(`No se pudo subir la imagen de ${usuarioId}: ${problema}`);
    return;
  }

  // Las dos ramas escritas enteras, en vez de una columna calculada: los tipos
  // generados de Supabase son literales por tabla, y un `{ [columna]: url }`
  // los deja en `never`. Escribirlas por separado es lo que hace que un
  // cambio de nombre de columna lo marque el compilador.
  const { error } =
    tabla === "perfiles"
      ? await supabase
          .from("perfiles")
          .update({ foto_url: url })
          .eq("id", usuarioId)
      : await supabase
          .from("empresas")
          .update({ logo_url: url })
          .eq("id", usuarioId);

  if (error) {
    console.warn(
      `No se pudo guardar la imagen de ${usuarioId}: ${error.message}`,
    );
  }
}

/**
 * El equivalente de `completarAlta` para una cuenta de empresa (RF1.2).
 *
 * Mismo contrato: idempotente, requiere sesión activa, devuelve `null` si salió
 * bien. El orden importa y no es intercambiable — el disparador
 * `validar_tipo_cuenta` de `db/schema.sql` exige que la fila de `cuentas` ya
 * exista con `tipo = 'empresa'` antes de aceptar la de `empresas`.
 */
async function completarAltaEmpresa(
  supabase: SupabaseClient<Database>,
  user: User,
  datos: DatosDeEmpresa,
): Promise<EstadoAccion | null> {
  const { error: errorCuenta } = await supabase
    .from("cuentas")
    .upsert(
      { id: user.id, tipo: "empresa" },
      { onConflict: "id", ignoreDuplicates: true },
    );

  if (errorCuenta) {
    return { estado: "error", mensaje: errorCuenta.message };
  }

  const { error } = await supabase.from("empresas").upsert(
    {
      id: user.id,
      razon_social: datos.razon_social,
      rut: datos.rut || null,
      rubro: datos.rubro,
      descripcion: datos.descripcion || null,
      logo_url: datos.logo_url || null,
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

  return { estado: "error", mensaje: error.message };
}

/**
 * Las comprobaciones que comparten los dos registros: correo, contraseña,
 * confirmación y fuerza.
 *
 * Es la segunda de las tres capas. El navegador ya hizo estas mismas
 * comprobaciones, y eso no las vuelve redundantes: un formulario se puede
 * mandar sin pasar por el navegador, así que lo que el cliente valida es
 * comodidad y lo que se valida acá es lo que de verdad decide.
 *
 * Lo que **no** se comprueba es si el correo ya está registrado. Responder
 * «ese correo ya existe» convierte al formulario en un buscador de cuentas:
 * cualquiera podría averiguar quién está en la plataforma probando
 * direcciones. La respuesta la da Supabase, que trata todos los correos igual.
 *
 * Devuelve `null` si está todo bien.
 */
function validarAcceso(datos: FormData): EstadoAccion | null {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");
  const confirmacion = String(datos.get("password_confirmacion") ?? "");

  if (!email || !password) {
    return {
      estado: "error",
      mensaje: "El correo y la contraseña son obligatorios.",
    };
  }

  if (confirmacion !== password) {
    return {
      estado: "error",
      mensaje: "Las dos contraseñas no coinciden.",
    };
  }

  const motivo = new FuerzaDeContrasenia(password).motivoDelRechazo;
  if (motivo) return { estado: "error", mensaje: motivo };

  // El checkbox es `required` en el formulario; acá se comprueba de nuevo
  // porque un `required` de HTML no llega al servidor.
  if (!datos.get("privacidad")) {
    return {
      estado: "error",
      mensaje: "Tenés que aceptar la política de privacidad para registrarte.",
    };
  }

  return null;
}

/** Que un texto no pase del largo que la ficha puede mostrar sin cortarlo. */
function validarLargo(valor: string, campo: string): EstadoAccion | null {
  if (valor.length <= ReglasDeRegistro.LARGO_NOMBRE) return null;

  return {
    estado: "error",
    mensaje: `${campo} no puede pasar de ${ReglasDeRegistro.LARGO_NOMBRE} caracteres.`,
  };
}

/**
 * Adónde mandar a alguien recién autenticado, según `cuentas.tipo`.
 *
 * La fuente de verdad es la base y no `user_metadata`: el propio usuario puede
 * reescribir su metadata con `auth.updateUser`, así que usarla para decidir
 * permisos sería dejarle elegir su propio tipo de cuenta. `cuentas.tipo` está
 * protegido por `validar_cambio_tipo_cuenta` y por RLS.
 *
 * Sin fila en `cuentas` —alta a medio terminar— cae en la ruta de individual,
 * que es la que puede convivir con un perfil todavía inexistente.
 */
async function destinoSegunTipo(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("cuentas")
    .select("tipo")
    .eq("id", userId)
    .maybeSingle();

  return comoTipoCuenta(data?.tipo ?? "") === "empresa"
    ? "/empresa"
    : "/inicio";
}

/**
 * RF1.2 — Registro de una cuenta de empresa.
 *
 * Mismo recorrido que `registrarse()`: `signUp`, y con la sesión que devuelve,
 * las filas de `cuentas` y `empresas`. Si la confirmación por correo está
 * activada, los datos quedan en `user_metadata` y el alta se completa en el
 * primer inicio de sesión.
 */
export async function registrarEmpresa(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");
  const empresa = leerDatosDeEmpresa(datos);
  const logo = leerArchivo(datos, "logo");

  const problemaDeAcceso = validarAcceso(datos);
  if (problemaDeAcceso) return problemaDeAcceso;

  if (!empresa.razon_social || !empresa.rubro) {
    return {
      estado: "error",
      mensaje: "La razón social y el rubro son obligatorios.",
    };
  }

  const problemaDeLargo = validarLargo(empresa.razon_social, "La razón social");
  if (problemaDeLargo) return problemaDeLargo;

  if (!ReglasDeRegistro.rutValido(empresa.rut)) {
    return {
      estado: "error",
      mensaje: "El RUT tiene que tener doce dígitos.",
    };
  }

  const supabase = await createClient();
  if (!supabase) return SIN_CONFIGURAR;

  // Mismo propósito que el chequeo de `nombre_usuario` en `registrarse()`:
  // cortar el caso común antes de crear nada en `auth.users`. Tampoco elimina
  // la carrera, y el índice único de `empresas` sigue siendo la defensa final.
  //
  // Acá se lee la tabla y no una vista, al revés que con `perfiles`:
  // `empresas_lectura_publica` no lleva cláusula `to`, así que `anon` la puede
  // leer, y `empresas` no tiene ninguna columna sensible que esconder —fue
  // `fecha_nacimiento` lo que obligó a la vista en CN-001.
  const { data: yaExiste } = await supabase
    .from("empresas")
    .select("id")
    .eq("razon_social", empresa.razon_social)
    .maybeSingle();

  if (yaExiste) return RAZON_SOCIAL_OCUPADA;

  // Mismo criterio y misma limitación que el chequeo de arriba: corta el caso
  // común antes de crear nada, no elimina la carrera, y el índice único sigue
  // siendo la defensa final. No abre ninguna filtración nueva: `empresas` ya
  // es legible por cualquiera, y el RUT es un dato registral público —a
  // diferencia del correo, que por eso no se pre-verifica.
  const { data: rutTomado } = await supabase
    .from("empresas")
    .select("id")
    .eq("rut", empresa.rut)
    .maybeSingle();

  if (rutTomado) return RUT_OCUPADO;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: empresa },
  });

  if (error) {
    return { estado: "error", mensaje: error.message };
  }

  if (!data.user) {
    return {
      estado: "error",
      mensaje: "No se pudo crear la cuenta. Probá de nuevo.",
    };
  }

  if (!data.session) {
    return {
      estado: "ok",
      mensaje:
        "Te enviamos un correo para confirmar la cuenta. Al iniciar sesión por primera vez terminamos de crear el perfil de la empresa. El logo lo vas a poder cargar desde el panel.",
    };
  }

  const fallo = await completarAltaEmpresa(supabase, data.user, empresa);
  if (fallo) return fallo;

  if (logo) {
    await guardarImagen(supabase, "empresas", data.user.id, logo);
  }

  revalidatePath("/", "layout");
  redirect("/empresa");
}

/**
 * RF1.1 — Registro de una cuenta individual.
 *
 * Crea el usuario en `auth.users` y, con la sesión que devuelve el `signUp`,
 * las filas de `cuentas` y `perfiles`.
 *
 * Si el proyecto de Supabase tiene activada la confirmación por correo, el
 * `signUp` devuelve usuario pero **no** sesión. Sin sesión, `auth.uid()` es
 * nulo y las políticas de RLS rechazan las dos inserciones. En ese caso los
 * datos quedan guardados en `user_metadata` y el alta se completa en el
 * primer inicio de sesión, que es cuando existe la sesión que RLS pide.
 */
export async function registrarse(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");
  const perfil = leerDatosDePerfil(datos);
  const avatar = leerArchivo(datos, "avatar");

  const problemaDeAcceso = validarAcceso(datos);
  if (problemaDeAcceso) return problemaDeAcceso;

  if (
    !perfil.nombre ||
    !perfil.apellido ||
    !perfil.fecha_nacimiento ||
    !perfil.pais ||
    !perfil.nombre_usuario
  ) {
    return { estado: "error", mensaje: "Faltan datos del perfil." };
  }

  const problemaDeLargo =
    validarLargo(perfil.nombre, "El nombre") ??
    validarLargo(perfil.apellido, "El apellido");
  if (problemaDeLargo) return problemaDeLargo;

  // La edad la decide el `check` `perfiles_mayor_de_edad` de la base; acá se
  // adelanta el rechazo para no crear un usuario en `auth.users` que después
  // no va a poder tener perfil. Las dos cuentas usan la misma regla, que vive
  // en `ReglasDeRegistro`.
  if (
    !ReglasDeRegistro.tieneEdadSuficiente(perfil.fecha_nacimiento, new Date())
  ) {
    return {
      estado: "error",
      mensaje: `Tenés que tener al menos ${ReglasDeRegistro.EDAD_MINIMA} años para registrarte.`,
    };
  }

  if (perfil.tags.length < ReglasDeRegistro.TAGS_MINIMOS) {
    return {
      estado: "error",
      mensaje: `Elegí al menos ${ReglasDeRegistro.TAGS_MINIMOS} áreas de interés.`,
    };
  }

  const supabase = await createClient();
  if (!supabase) return SIN_CONFIGURAR;

  // Corta el caso común del nombre repetido antes de crear nada en
  // `auth.users`: sin esto el choque aparece recién al insertar en
  // `perfiles`, que con la confirmación por correo activada ocurre en el
  // primer inicio de sesión. No elimina la carrera —dos registros
  // simultáneos la pasan los dos— y por eso el índice único de `perfiles`
  // sigue siendo la defensa final.
  //
  // Lee de `perfiles_publicos` y no de `perfiles`: quien se está registrando
  // todavía no tiene sesión, y desde CN-001 la tabla solo es legible por
  // `authenticated` y limitada a la fila propia. Contra la tabla, esta
  // consulta devolvería `null` siempre —sin error— y el chequeo quedaría
  // apagado en silencio. La vista es legible por `anon` y expone
  // `nombre_usuario`.
  const { data: yaExiste } = await supabase
    .from("perfiles_publicos")
    .select("id")
    .eq("nombre_usuario", perfil.nombre_usuario)
    .maybeSingle();

  if (yaExiste) return USUARIO_OCUPADO;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: perfil },
  });

  if (error) {
    return { estado: "error", mensaje: error.message };
  }

  if (!data.user) {
    return {
      estado: "error",
      mensaje: "No se pudo crear la cuenta. Probá de nuevo.",
    };
  }

  if (!data.session) {
    return {
      estado: "ok",
      mensaje:
        "Te enviamos un correo para confirmar la cuenta. Al iniciar sesión por primera vez terminamos de crear tu perfil con los intereses que elegiste. La foto la vas a poder cargar desde tu perfil.",
    };
  }

  const fallo = await completarAlta(supabase, data.user, perfil);
  if (fallo) return fallo;

  const falloIntereses = await guardarIntereses(
    supabase,
    data.user.id,
    perfil.tags,
  );
  if (falloIntereses) return falloIntereses;

  if (avatar) {
    await guardarImagen(supabase, "perfiles", data.user.id, avatar);
  }

  revalidatePath("/", "layout");
  redirect("/inicio");
}

/**
 * RF1.3 — Inicio de sesión.
 *
 * Después de autenticar, completa el alta si quedó pendiente: es el caso de
 * quien se registró con la confirmación por correo activada y todavía no
 * tiene fila en `perfiles`.
 */
export async function iniciarSesion(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");

  if (!email || !password) {
    return {
      estado: "error",
      mensaje: "El correo y la contraseña son obligatorios.",
    };
  }

  const supabase = await createClient();
  if (!supabase) return SIN_CONFIGURAR;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Un mensaje único para credenciales incorrectas y para correo inexistente:
  // distinguirlos le diría a cualquiera qué direcciones están registradas.
  if (error || !data.user) {
    return {
      estado: "error",
      mensaje: "El correo o la contraseña no son correctos.",
    };
  }

  // Cuál de las dos altas quedó pendiente lo dice qué guardó el registro en
  // `user_metadata`: `nombre_usuario` para individual, `razon_social` para
  // empresa. Las dos son idempotentes, así que en un login normal no hacen
  // nada.
  const perfil = leerDatosDeMetadata(data.user);
  if (perfil) {
    const fallo = await completarAlta(supabase, data.user, perfil);
    if (fallo) return fallo;

    // Los intereses también quedaron pendientes: sin sesión, la política
    // `perfil_tags_agrego_los_mios` no los dejaba entrar al registrarse.
    const falloIntereses = await guardarIntereses(
      supabase,
      data.user.id,
      perfil.tags,
    );
    if (falloIntereses) return falloIntereses;
  }

  const empresa = leerEmpresaDeMetadata(data.user);
  if (empresa) {
    const fallo = await completarAltaEmpresa(supabase, data.user, empresa);
    if (fallo) return fallo;
  }

  const destino = await destinoSegunTipo(supabase, data.user.id);

  revalidatePath("/", "layout");
  redirect(destino);
}

/** RF1.3.5 — Cerrar la sesión. */
export async function cerrarSesion(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
