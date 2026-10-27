"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { comoTipoCuenta } from "@/lib/data/tipos";
import { FuerzaDeContrasenia } from "@/lib/dominio/FuerzaDeContrasenia";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";
import {
  leerArchivo,
  subirImagenDePerfil,
} from "@/lib/supabase/almacenamiento";
import {
  PARAMETRO_SIGUIENTE,
  avisoPorPestana,
  conAviso,
  correspondeA,
  destinoSeguro,
} from "@/lib/navegacion";
import { correoDeUsuario } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_RECORDAR, esConexionSegura } from "@/lib/supabase/sesion";
import type { Database } from "@/types/database";

import {
  completarAlta,
  completarAltaEmpresa,
  completarAltaPendiente,
  guardarIntereses,
  RAZON_SOCIAL_OCUPADA,
  RUT_OCUPADO,
  USUARIO_OCUPADO,
  type DatosDePerfil,
  type DatosDeEmpresa,
} from "./alta";
import {
  SIN_CONFIGURAR,
  type EstadoAccion,
  type EstadoFormulario,
  valoresDe,
} from "./tipos";

/** Lo que se mandó en el formulario de registro, sin ninguna contraseña. */
function valoresSinContrasenia(
  datos: FormData,
): Record<string, string | string[]> {
  const valores = valoresDe(datos);
  for (const clave of Object.keys(valores)) {
    if (/password|contrasenia/i.test(clave)) {
      delete valores[clave];
    }
  }
  return valores;
}

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
function validarAcceso(datos: FormData): EstadoFormulario | null {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");
  const confirmacion = String(datos.get("password_confirmacion") ?? "");

  if (!email || !password) {
    const mensaje = "El correo y la contraseña son obligatorios.";
    return {
      estado: "error",
      mensaje,
      campos: {
        ...(!email ? { email: mensaje } : {}),
        ...(!password ? { password: mensaje } : {}),
      },
    };
  }

  if (confirmacion !== password) {
    const mensaje = "Las dos contraseñas no coinciden.";
    return {
      estado: "error",
      mensaje,
      campos: { password_confirmacion: mensaje },
    };
  }

  const motivo = new FuerzaDeContrasenia(password).motivoDelRechazo;
  if (motivo) {
    return {
      estado: "error",
      mensaje: motivo,
      campos: { password: motivo },
    };
  }

  // El checkbox es `required` en el formulario; acá se comprueba de nuevo
  // porque un `required` de HTML no llega al servidor.
  if (!datos.get("privacidad")) {
    const mensaje =
      "Tenés que aceptar la política de privacidad para registrarte.";
    return {
      estado: "error",
      mensaje,
      campos: { privacidad: mensaje },
    };
  }

  return null;
}

/** Que un texto no pase del largo que la ficha puede mostrar sin cortarlo. */
function validarLargo(
  valor: string,
  etiqueta: string,
  campo: string,
): EstadoFormulario | null {
  if (valor.length <= ReglasDeRegistro.LARGO_NOMBRE) return null;

  const mensaje = `${etiqueta} no puede pasar de ${ReglasDeRegistro.LARGO_NOMBRE} caracteres.`;
  return {
    estado: "error",
    mensaje,
    campos: { [campo]: mensaje },
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
  _estadoPrevio: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");
  const empresa = leerDatosDeEmpresa(datos);
  const logo = leerArchivo(datos, "logo");
  const conValores = (estado: EstadoFormulario): EstadoFormulario => ({
    ...estado,
    valores: valoresSinContrasenia(datos),
  });

  const problemaDeAcceso = validarAcceso(datos);
  if (problemaDeAcceso) return conValores(problemaDeAcceso);

  if (!empresa.razon_social || !empresa.rubro) {
    const mensaje = "La razón social y el rubro son obligatorios.";
    return conValores({
      estado: "error",
      mensaje,
      campos: {
        ...(!empresa.razon_social ? { razon_social: mensaje } : {}),
        ...(!empresa.rubro ? { rubro: mensaje } : {}),
      },
    });
  }

  const problemaDeLargo = validarLargo(
    empresa.razon_social,
    "La razón social",
    "razon_social",
  );
  if (problemaDeLargo) return conValores(problemaDeLargo);

  if (!ReglasDeRegistro.rutValido(empresa.rut)) {
    const mensaje = "El RUT tiene que tener doce dígitos.";
    return conValores({
      estado: "error",
      mensaje,
      campos: { rut: mensaje },
    });
  }

  const supabase = await createClient();
  if (!supabase) return conValores(SIN_CONFIGURAR);

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

  if (yaExiste) return conValores(RAZON_SOCIAL_OCUPADA);

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

  if (rutTomado) return conValores(RUT_OCUPADO);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: empresa },
  });

  if (error) {
    return conValores({ estado: "error", mensaje: error.message });
  }

  if (!data.user) {
    return conValores({
      estado: "error",
      mensaje: "No se pudo crear la cuenta. Probá de nuevo.",
    });
  }

  if (!data.session) {
    return {
      estado: "ok",
      mensaje:
        "Te enviamos un correo para confirmar la cuenta. Cuando toques el enlace, el perfil de la empresa queda creado y ya podés iniciar sesión. El logo lo podés cargar después desde el perfil de la empresa.",
    };
  }

  const fallo = await completarAltaEmpresa(supabase, data.user, empresa);
  if (fallo) return conValores(fallo);

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
  _estadoPrevio: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");
  const perfil = leerDatosDePerfil(datos);
  const avatar = leerArchivo(datos, "avatar");
  const conValores = (estado: EstadoFormulario): EstadoFormulario => ({
    ...estado,
    valores: valoresSinContrasenia(datos),
  });

  const problemaDeAcceso = validarAcceso(datos);
  if (problemaDeAcceso) return conValores(problemaDeAcceso);

  if (
    !perfil.nombre ||
    !perfil.apellido ||
    !perfil.fecha_nacimiento ||
    !perfil.pais ||
    !perfil.nombre_usuario
  ) {
    const mensaje = "Faltan datos del perfil.";
    return conValores({
      estado: "error",
      mensaje,
      campos: {
        ...(!perfil.nombre ? { nombre: mensaje } : {}),
        ...(!perfil.apellido ? { apellido: mensaje } : {}),
        ...(!perfil.nombre_usuario ? { nombre_usuario: mensaje } : {}),
        ...(!perfil.pais ? { pais: mensaje } : {}),
        ...(!perfil.fecha_nacimiento ? { fecha_nacimiento: mensaje } : {}),
      },
    });
  }

  const problemaDeLargo =
    validarLargo(perfil.nombre, "El nombre", "nombre") ??
    validarLargo(perfil.apellido, "El apellido", "apellido");
  if (problemaDeLargo) return conValores(problemaDeLargo);

  // La edad la decide el `check` `perfiles_mayor_de_edad` de la base; acá se
  // adelanta el rechazo para no crear un usuario en `auth.users` que después
  // no va a poder tener perfil. Las dos cuentas usan la misma regla, que vive
  // en `ReglasDeRegistro`.
  if (
    !ReglasDeRegistro.tieneEdadSuficiente(perfil.fecha_nacimiento, new Date())
  ) {
    const mensaje = `Tenés que tener al menos ${ReglasDeRegistro.EDAD_MINIMA} años para registrarte.`;
    return conValores({
      estado: "error",
      mensaje,
      campos: { fecha_nacimiento: mensaje },
    });
  }

  if (perfil.tags.length < ReglasDeRegistro.TAGS_MINIMOS) {
    const mensaje = `Elegí al menos ${ReglasDeRegistro.TAGS_MINIMOS} áreas de interés.`;
    return conValores({
      estado: "error",
      mensaje,
      campos: { tags: mensaje },
    });
  }

  const supabase = await createClient();
  if (!supabase) return conValores(SIN_CONFIGURAR);

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

  if (yaExiste) return conValores(USUARIO_OCUPADO);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: perfil },
  });

  if (error) {
    return conValores({ estado: "error", mensaje: error.message });
  }

  if (!data.user) {
    return conValores({
      estado: "error",
      mensaje: "No se pudo crear la cuenta. Probá de nuevo.",
    });
  }

  if (!data.session) {
    return {
      estado: "ok",
      mensaje:
        "Te enviamos un correo para confirmar la cuenta. Cuando toques el enlace, tu perfil queda creado con los intereses que elegiste y ya podés iniciar sesión. La foto la podés cargar después desde tu perfil.",
    };
  }

  const fallo = await completarAlta(supabase, data.user, perfil);
  if (fallo) return conValores(fallo);

  const falloIntereses = await guardarIntereses(
    supabase,
    data.user.id,
    perfil.tags,
  );
  if (falloIntereses) return conValores(falloIntereses);

  if (avatar) {
    await guardarImagen(supabase, "perfiles", data.user.id, avatar);
  }

  revalidatePath("/", "layout");
  // Si llegó desde «Postularme» o desde una pantalla que pedía sesión, vuelve
  // ahí. `destinoSeguro` descarta cualquier cosa que no sea una ruta interna.
  const siguiente = destinoSeguro(datos.get(PARAMETRO_SIGUIENTE));
  redirect(
    siguiente && correspondeA("postulante", siguiente) ? siguiente : "/inicio",
  );
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
  const identificador = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");

  if (!identificador || !password) {
    return {
      estado: "error",
      mensaje: "Escribí tu correo o tu nombre de usuario, y tu contraseña.",
    };
  }

  // RF1.3.1 — Se entra con el correo o con el nombre de usuario. Sin «@» es un
  // nombre de usuario: el correo lo resuelve el servidor y nunca vuelve a la
  // pantalla. Si no existe, se sigue con un correo imposible para que la
  // respuesta sea la misma que con una contraseña equivocada.
  const email = identificador.includes("@")
    ? identificador
    : ((await correoDeUsuario(identificador)) ??
      "sin-cuenta@linkyouth.invalid");

  // «Mantener la sesión iniciada» (ver `src/lib/supabase/sesion.ts`). Sin la
  // casilla, una cookie de sesión marca que las de Supabase también lo sean.
  const recordar = datos.get("recordar") === "1";
  const cookieStore = await cookies();
  if (recordar) {
    cookieStore.delete(COOKIE_RECORDAR);
  } else {
    // Sin `maxAge`: es una cookie de sesión. `secure` solo por HTTPS, igual
    // que las de Supabase (`opcionesDeCookie`): por HTTP en la tailnet el
    // navegador no la guardaría.
    cookieStore.set(COOKIE_RECORDAR, "0", {
      httpOnly: true,
      sameSite: "lax",
      secure: esConexionSegura((await headers()).get("x-forwarded-proto")),
      path: "/",
    });
  }

  const supabase = await createClient({ recordar });
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
      mensaje: "El usuario o la contraseña no son correctos.",
    };
  }

  // El alta que haya quedado pendiente del registro (confirmación por correo)
  // se completa acá si `/auth/callback` no llegó a hacerlo.
  const pendiente = await completarAltaPendiente(supabase, data.user);
  if (pendiente) return pendiente;

  // Vuelve a la pantalla que se había pedido antes de entrar, si es de la
  // mitad de la aplicación que le toca a esta cuenta. Hay que mirarlo acá: el
  // `redirect()` de una Server Action no pasa por el middleware.
  const inicio = await destinoSegunTipo(supabase, data.user.id);
  const siguiente = destinoSeguro(datos.get(PARAMETRO_SIGUIENTE));
  const destino =
    siguiente &&
    correspondeA(inicio === "/empresa" ? "empresa" : "postulante", siguiente)
      ? siguiente
      : inicio;

  // La pestaña elegida («Busco trabajo» / «Soy empresa») no decide a dónde se
  // entra (RF1.2): si no coincide con la cuenta, se entra igual a la sección
  // que le toca, con un aviso que explica por qué.
  const aviso = avisoPorPestana(
    datos.get("tipo_elegido"),
    inicio === "/empresa" ? "empresa" : "individual",
  );

  revalidatePath("/", "layout");
  redirect(conAviso(destino, aviso));
}

/** RF1.3.5 — Cerrar la sesión. */
export async function cerrarSesion(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  (await cookies()).delete(COOKIE_RECORDAR);

  revalidatePath("/", "layout");
  redirect("/login");
}
