LinkYouth

Plataforma digital de primer empleo, formación y networking para jóvenes

Documento Integrador del Proyecto

Especificación de Requisitos de Software (SRS)

Elaborado como base de trabajo (PMO) para su posterior desarrollo asistido por IA

Versión 2.0 — Setiembre 2026 (requisitos funcionales revisados a nivel atómico; se elimina el módulo de CV)

1. Introducción

1.1 Propósito

Este  documento  establece,  de  manera  ordenada  y  trazable,  los  requisitos  funcionales y no funcionales de
LinkYouth, una plataforma digital orientada a jóvenes que buscan su primer empleo, prácticas profesionales o
instancias  de  formación.  Su  objetivo  es servir como documento base para: (a) alinear al equipo del proyecto
sobre  qué  se  va  a  construir  y  en  qué  orden,  y  (b)  redactar  un  prompt  técnico  preciso  que  permita  a  una
herramienta de IA generar el código de la aplicación con el menor margen de ambigüedad posible.

1.2 Alcance

El  documento  cubre  la  descripción  general  del  sistema,  los  actores  involucrados,  los  requisitos  funcionales
organizados  por  módulo  y  descompuestos  a  nivel  atómico  (evento  por  evento,  campo  por  campo),  los
requisitos  no  funcionales,  las  restricciones  del  proyecto  y  una  propuesta  de  priorización  por  fases  (MVP  y
evolutivas).  Se  incluye  además  una  sección  de opinión profesional (rol PMO) con recomendaciones y riesgos
detectados, y un prompt técnico sugerido para iniciar la construcción asistida por IA.

Este documento reemplaza y organiza las notas de trabajo previas sobre LinkYouth. No debe confundirse con la
consigna  académica  de  Análisis  y  Diseño  de  Aplicaciones  basada  en  "CAPYNET":  LinkYouth  es  un  proyecto
propio, distinto, y este documento usa esa consigna únicamente como modelo de estructura formal (estilo IEEE
830) y como referencia del nivel de atomicidad exigido en los requisitos funcionales.

1.3 Definiciones y Acrónimos

●  Postulante / Usuario individual: persona joven registrada que busca empleo, pasantías o formación.

●  Empresa / Organización: cuenta registrada que publica oportunidades, gestiona postulantes y organiza

eventos institucionales.

●  Tag: etiqueta de interés, habilidad o categoría que el usuario o la empresa asocian a su perfil, vacante o

evento, usada como base del filtrado y el matching.

●  Tag oculto: etiqueta definida por la empresa para una vacante, no visible para el postulante, usada

exclusivamente para calcular el puntaje de compatibilidad.

●  Matching: proceso de puntuación automática entre los tags públicos del postulante y los tags ocultos que

define la empresa para una vacante.

●  Hoja de ruta: secuencia sugerida de cursos, certificaciones o acciones para alcanzar un objetivo laboral

definido por el usuario.

●  MVP: Producto Mínimo Viable, primer recorte funcional del sistema.

●  SRS: Software Requirements Specification (Especificación de Requisitos de Software).

1.4 Público objetivo del documento

●  El equipo del proyecto (para tomar decisiones de alcance y prioridad).

●  La herramienta de IA que codificará la aplicación (a través del prompt de la sección 9).

●  Un eventual tutor, evaluador o lector externo del proyecto.

2. Descripción General del Proyecto

2.1 Problema que se busca resolver

En  el  mercado  laboral  actual,  los  perfiles  junior  —especialmente  en  tecnología—  enfrentan  un  "cuello  de
botella" para conseguir su primera oportunidad: la mayoría de las ofertas exige experiencia previa, los procesos
de  postulación  son  opacos  (el  postulante  no  sabe  en  qué  etapa  está)  y  no  existe  un  espacio  integrado que
combine búsqueda de empleo, preparación para entrevistas y desarrollo de habilidades en un mismo lugar.

2.2 Formulación del problema

¿Cómo  puede  una  plataforma  digital  reducir  la  brecha  entre  los  jóvenes  que buscan su primera experiencia
laboral y las organizaciones que necesitan cubrir posiciones junior, ofreciendo además herramientas concretas
de preparación y desarrollo?

2.3 Hipótesis de trabajo

Una  plataforma  que  combine  perfil  profesional,  búsqueda  y  postulación  transparente,  preparación  de
entrevistas  y  eventos  de  networking  institucional,  aumenta  las  probabilidades  de  un  joven  de  conseguir  su
primera oportunidad laboral y mejora la calidad del proceso de selección para las empresas.

2.4 Objetivo general

Desarrollar  una  plataforma  web  (LinkYouth)  que  conecte  a  jóvenes  en  búsqueda  de  su  primer  empleo  con
empresas y organizaciones, integrando perfil profesional, postulaciones, eventos, notificaciones y herramientas
de preparación laboral.

2.5 Actores del sistema

●  Usuario individual (postulante): crea perfil, define tags/intereses, se postula a oportunidades, participa

de eventos y se prepara para entrevistas.

●  Empresa / Organización: publica vacantes, gestiona postulantes, organiza eventos institucionales y

recibe valoraciones. Su vista de la plataforma es distinta a la del usuario individual.

●  Administrador de la plataforma: modera reportes de usuarios/publicaciones y gestiona el

funcionamiento general.

2.6 Alcance por fases

Se formaliza como hoja de ruta de dos fases, retomada en la sección 7.3:

●  Fase 1 — MVP: perfiles, postulaciones, tags básicos, eventos institucionales, notificaciones esenciales.

●  Fase 2 — Evolutiva: matching por algoritmo, entrevistas simuladas con feedback, valoraciones de

empresas, sección de startups/financiamiento.

2.7 Nota de alcance: sin módulo de CV

A diferencia de una versión anterior de este documento, LinkYouth NO incluye un módulo de currículum vitae
(CV). El foco del producto es la primera experiencia laboral de sus usuarios, por lo que se prioriza el perfil con
tags, intereses y formación declarada por sobre un CV tradicional.

3. Requisitos Funcionales

Los requisitos se agrupan por módulo (RFn), y cada módulo se descompone en acciones (RFn.m) y estas, a su
vez,  en  pasos  atómicos  (RFn.m.k):  un  campo  a  ingresar,  una  verificación puntual o un evento del sistema —
siguiendo el mismo criterio de descomposición que la consigna académica de referencia (CAPYNET).

RF1 — Gestión de Usuarios y Autenticación

●  RF1.1. Registrar usuario individual

○  RF1.1.1. Ingresa correo electrónico.
○  RF1.1.2. Verifica correo: comprueba si el correo fue o no registrado antes.
○  RF1.1.3. Ingresa contraseña.
○  RF1.1.4. Verifica contraseña: solicita ingresarla por segunda vez para confirmarla.
○  RF1.1.5. Ingresa nombre de usuario: debe ser único, se trata como nickname.
○  RF1.1.6. Verifica nombre de usuario: comprueba que no esté registrado antes.
○  RF1.1.7. Ingresa fecha de nacimiento.
○  RF1.1.8. Verifica fecha de nacimiento: valida que la edad sea mayor o igual a 18 años.
○  RF1.1.9. Ingresa país.
○  RF1.1.10. Ingresa nombre y apellido reales.
○  RF1.1.11. Selecciona tags/intereses: debe seleccionar un mínimo de 5.
○  RF1.1.12. Acepta política de privacidad y tratamiento de datos personales: casilla obligatoria para

continuar.

○  RF1.1.13. Confirma registro: crea la cuenta y redirige al usuario a su perfil.

●  RF1.2. Registrar empresa/organización

○  RF1.2.1. Ingresa correo institucional.
○  RF1.2.2. Verifica correo institucional: comprueba si fue registrado antes.
○  RF1.2.3. Ingresa contraseña.
○  RF1.2.4. Verifica contraseña: solicita ingresarla por segunda vez para confirmarla.
○  RF1.2.5. Ingresa razón social.
○  RF1.2.6. Verifica razón social: comprueba que no esté registrada antes.
○  RF1.2.7. Ingresa rubro/industria.
○  RF1.2.8. Ingresa descripción de la empresa.
○  RF1.2.9. Carga logo de la empresa (opcional).
○  RF1.2.10. Acepta política de privacidad y tratamiento de datos personales.
○  RF1.2.11. Confirma registro: crea la cuenta institucional.

●  RF1.3. Iniciar sesión

○  RF1.3.1. Ingresa correo o nombre de usuario.
○  RF1.3.2. Ingresa contraseña.
○  RF1.3.3. Verifica correo o nombre de usuario: comprueba que exista en el sistema.
○  RF1.3.4. Verifica contraseña: comprueba que coincida con la registrada.
○  RF1.3.5. Redirige al usuario según el tipo de cuenta (individual o empresa).

●  RF1.4. Cerrar sesión

○  RF1.4.1. Finaliza la sesión activa y redirige a la pantalla de inicio.

●  RF1.5. Modificar usuario individual: requiere sesión iniciada

○  RF1.5.1. Cambia nombre de usuario.
○  RF1.5.2. Cambia contraseña.

○  RF1.5.3. Cambia correo electrónico.
○  RF1.5.4. Cambia tags/intereses.
○  RF1.5.5. Cambia país.
○  RF1.5.6. Cambia foto de perfil.

●  RF1.6. Modificar empresa: requiere sesión iniciada

○  RF1.6.1. Cambia razón social.
○  RF1.6.2. Cambia descripción.
○  RF1.6.3. Cambia logo.
○  RF1.6.4. Cambia rubro/industria.

●  RF1.7. Eliminar cuenta (usuario o empresa)

○  RF1.7.1. Ingresa contraseña.
○  RF1.7.2. Verifica contraseña.
○  RF1.7.3. Advierte al usuario sobre la pérdida definitiva de sus datos.
○  RF1.7.4. Confirma la eliminación.
○  RF1.7.5. Elimina la cuenta y los datos asociados.

●  RF1.8. Recuperar contraseña

○  RF1.8.1. Ingresa correo electrónico registrado.
○  RF1.8.2. Verifica correo: comprueba que exista en el sistema.
○  RF1.8.3. Envía enlace o código de recuperación al correo.
○  RF1.8.4. Ingresa nueva contraseña.
○  RF1.8.5. Verifica nueva contraseña: solicita confirmarla por segunda vez.

RF2 — Perfil y Preferencias (sin módulo de CV)

●  RF2.1. Ver perfil propio

○  RF2.1.1. Muestra datos públicos: nombre de usuario, foto, tags, biografía.

●  RF2.2. Editar biografía

○  RF2.2.1. Ingresa texto de biografía, con un máximo de caracteres definido.
○  RF2.2.2. Verifica longitud: no permite superar el máximo de caracteres.

●  RF2.3. Gestionar tags/intereses del perfil

○  RF2.3.1. Agrega un tag desde una lista predefinida o de búsqueda.
○  RF2.3.2. Elimina un tag existente del perfil.

●  RF2.4. Gestionar formación y habilidades declaradas

○  RF2.4.1. Agrega un estudio en curso o finalizado (institución, título, estado).
○  RF2.4.2. Elimina un estudio cargado.
○  RF2.4.3. Agrega una habilidad/skill declarada.
○  RF2.4.4. Elimina una habilidad declarada.

●  RF2.5. Ver perfil de otro usuario o de una empresa

○  RF2.5.1. Muestra los datos públicos del perfil consultado.

RF3 — Búsqueda de Empleo, Pasantías y Postulaciones

Vista Empresa

●  RF3.1. Publicar vacante

○  RF3.1.1. Ingresa título de la vacante.
○  RF3.1.2. Verifica título: no se repite dentro de las vacantes activas de la misma empresa.
○  RF3.1.3. Ingresa descripción de la vacante.
○  RF3.1.4. Selecciona tipo de oportunidad: empleo o pasantía.
○  RF3.1.5. Selecciona tags públicos requeridos.
○  RF3.1.6. Ingresa tags ocultos, usados exclusivamente para el cálculo de matching (RF3.9).
○  RF3.1.7. Ingresa cantidad de posiciones necesarias.
○  RF3.1.8. Publica la vacante: queda visible para los usuarios individuales.

●  RF3.2. Modificar vacante

○  RF3.2.1. Modifica descripción.
○  RF3.2.2. Modifica tags públicos u ocultos.
○  RF3.2.3. Modifica cantidad de posiciones.

●  RF3.3. Cerrar vacante

○  RF3.3.1. Cierra la vacante manualmente.
○  RF3.3.2. Cierra la vacante automáticamente al alcanzar la cantidad de posiciones requeridas.
○  RF3.3.3. Marca como "rechazada" toda postulación pendiente asociada a la vacante cerrada.

●  RF3.4. Gestionar postulaciones recibidas

○  RF3.4.1. Ver listado de postulantes por vacante.
○  RF3.4.2. Ver puntaje de compatibilidad (matching) de cada postulante (fase avanzada, RF10.2).
○  RF3.4.3. Cambia el estado de una postulación: en revisión, rechazada o aceptada.

Vista Usuario individual

●  RF3.5. Ver feed de oportunidades

○  RF3.5.1. Muestra listado resumido de vacantes activas.
○  RF3.5.2. Filtra el listado por tags/intereses del usuario.
○  RF3.5.3. Accede al detalle completo de una oportunidad mediante el botón "ver más".

●  RF3.6. Postularse a una vacante

○  RF3.6.1. Selecciona la vacante de interés.
○  RF3.6.2. Verifica que el usuario no esté ya postulado a esa misma vacante.
○  RF3.6.3. Confirma la postulación.
○  RF3.6.4. Registra la postulación con estado inicial "pendiente".

●  RF3.7. Ver estado de las postulaciones propias

○  RF3.7.1. Muestra listado de postulaciones realizadas.
○  RF3.7.2. Muestra el estado individual de cada una: pendiente, en revisión, rechazada o aceptada.

●  RF3.8. Cancelar una postulación propia
○  RF3.8.1. Confirma la cancelación.
○  RF3.8.2. Elimina la postulación del listado de la empresa.

Matching (transversal a RF3)

●  RF3.9. Calcular puntaje de compatibilidad: fase avanzada, ver RF10.2

○  RF3.9.1. Compara los tags ocultos de la vacante con los tags públicos del postulante.

○  RF3.9.2. Genera un puntaje numérico visible únicamente para la empresa.

RF4 — Eventos Institucionales y Networking

Vista Empresa

●  RF4.1. Crear evento institucional

○  RF4.1.1. Ingresa título del evento.
○  RF4.1.2. Ingresa descripción del evento.
○  RF4.1.3. Ingresa fecha y hora.
○  RF4.1.4. Carga imagen del evento.
○  RF4.1.5. Selecciona tags relacionados al evento.
○  RF4.1.6. Publica el evento.

●  RF4.2. Modificar evento

○  RF4.2.1. Modifica fecha, hora o descripción.

●  RF4.3. Cancelar evento

○  RF4.3.1. Confirma la cancelación.
○  RF4.3.2. Notifica a los usuarios inscriptos (ver RF6.5).

Vista Usuario individual

●  RF4.4. Ver eventos recomendados

○  RF4.4.1. Filtra eventos por tags/intereses del usuario.

●  RF4.5. Inscribirse a un evento

○  RF4.5.1. Confirma la inscripción.
○  RF4.5.2. Se une automáticamente al chat grupal asociado al evento (ver RF9.5).

●  RF4.6. Cancelar inscripción a un evento
○  RF4.6.1. Confirma la cancelación.
○  RF4.6.2. Sale automáticamente del chat grupal del evento.

RF5 — Preparación de Entrevistas y Entrenamiento

●  RF5.1. Ver módulo de consejos y buenas prácticas

○  RF5.1.1. Muestra contenido organizado por categoría (presentación personal en la entrevista,

comunicación, negociación salarial).

●  RF5.2. Realizar test psicotécnico / de personalidad
○  RF5.2.1. Presenta preguntas de alternativas.
○  RF5.2.2. Registra las respuestas seleccionadas.
○  RF5.2.3. Muestra el resultado del test al finalizar.

●  RF5.3. Practicar banco de preguntas conductuales y situacionales

○  RF5.3.1. Selecciona una categoría de preguntas.
○  RF5.3.2. Responde una pregunta del banco.
○  RF5.3.3. Muestra feedback sobre la respuesta ingresada.

RF6 — Notificaciones

●  RF6.1. Ver listado de notificaciones

○  RF6.1.1. Muestra notificaciones ordenadas por fecha, con indicador de leídas/no leídas.

●  RF6.2. Recibir notificación de cambio de estado de postulación

○  RF6.2.1. Genera la notificación cuando la empresa cambia el estado (RF3.4.3).

●  RF6.3. Recibir notificación de match

○  RF6.3.1. Notifica a la empresa cuando un postulante alcanza un puntaje relevante (RF3.9.2).

●  RF6.4. Activar o silenciar notificaciones

○  RF6.4.1. Activa todas las notificaciones.
○  RF6.4.2. Silencia todas las notificaciones.

●  RF6.5. Configurar notificaciones por categoría

○  RF6.5.1. Activa o desactiva notificaciones de postulaciones.
○  RF6.5.2. Activa o desactiva notificaciones de eventos.
○  RF6.5.3. Activa o desactiva notificaciones de chats.

RF7 — Panel de Empresa

●  RF7.1. Ver perfil institucional propio

○  RF7.1.1. Muestra vacantes activas y su estado agregado de postulaciones.

●  RF7.2. Ver listado de postulantes/trabajadores

○  RF7.2.1. Muestra postulantes agrupados por vacante y estado.

●  RF7.3. Buscar postulantes por tags

○  RF7.3.1. Ingresa uno o más tags de búsqueda.
○  RF7.3.2. Muestra los usuarios individuales que coinciden.

●  RF7.4. Ver reseñas recibidas

○  RF7.4.1. Muestra el listado de valoraciones publicadas sobre la empresa (ver RF8).

RF8 — Opiniones y Valoraciones

●  RF8.1. Publicar reseña de una empresa: trabajador o extrabajador

○  RF8.1.1. Ingresa una calificación numérica.
○  RF8.1.2. Ingresa un comentario.
○  RF8.1.3. Publica la reseña.

●  RF8.2. Ver reseñas de una empresa

○  RF8.2.1. Muestra el listado de reseñas y el promedio de calificación.

●  RF8.3. Reportar reseña o publicación

○  RF8.3.1. Selecciona el motivo del reporte.
○  RF8.3.2. Envía el reporte a los administradores.

RF9 — Comunicación

●  RF9.1. Crear chat individual

○  RF9.1.1. Selecciona el usuario o empresa destinataria.

●  RF9.2. Enviar mensaje

○  RF9.2.1. Redacta y envía el mensaje al chat individual o grupal.

●  RF9.3. Editar mensaje propio

○  RF9.3.1. Modifica el contenido de un mensaje ya enviado.

●  RF9.4. Eliminar mensaje propio

○  RF9.4.1. Elimina el mensaje del chat individual o grupal.

●  RF9.5. Chat grupal de evento: creado automáticamente, ver RF4.5.2

○  RF9.5.1. Agrega automáticamente a todo usuario que se inscribe al evento.

●  RF9.6. Salir de un chat grupal

○  RF9.6.1. Confirma la salida del chat grupal.

RF10 — Funcionalidades de Fase Avanzada

●  RF10.1. Entrevista simulada con IA

○  RF10.1.1. Genera preguntas dinámicas a partir de la vacante y el perfil del postulante.
○  RF10.1.2. Genera feedback automatizado sobre las respuestas.

●  RF10.2. Motor de recomendación con algoritmos

○  RF10.2.1. Incorpora historial de interacción del usuario (postulaciones previas, eventos) al cálculo de

matching.

●  RF10.3. Hoja de ruta personalizada

○  RF10.3.1. Sugiere cursos o certificaciones según el rol objetivo declarado por el usuario.

●  RF10.4. Sección de startups y búsqueda de financiamiento

○  RF10.4.1. Muestra listado de oportunidades de financiamiento para emprendedores jóvenes.

4. Requisitos No Funcionales

Como  PMO  del  proyecto,  propongo  el  siguiente  conjunto  —adaptado  del  estándar  IEEE  830  usado  en  la
consigna de referencia— como punto de partida a validar con el equipo.

RNF1 — Rendimiento

●  Tiempo de respuesta: las operaciones principales (login, feed, postulación) deben resolverse en menos de

2 segundos bajo condiciones normales.

●  Escalabilidad razonable para un volumen inicial de cientos de usuarios, sin sobre-diseñar infraestructura

para un proyecto académico.

RNF2 — Usabilidad

●  Interfaz intuitiva y moderna, priorizando flujos cortos para completar el perfil, postularse y ver el estado

de una postulación.

●  Diseño responsive (web y adaptado a dispositivos móviles).

RNF3 — Fiabilidad y Disponibilidad

●  El sistema debe conservar la información ante fallos (persistencia transaccional en operaciones críticas

como postulaciones).

●  Disponibilidad objetivo razonable para el contexto (no se exige un SLA de nivel productivo).

RNF4 — Mantenibilidad

●  Arquitectura modular que permita incorporar las funcionalidades de fase avanzada (RF10) sin reescribir el

núcleo del sistema.

●  Código documentado, con convenciones claras, pensando en que buena parte se generará con asistencia

de IA y debe seguir siendo legible por el equipo.

RNF5 — Seguridad

●  Contraseñas con requisitos mínimos de robustez y almacenamiento con hash seguro (nunca texto plano).

●  Separación estricta de datos entre usuarios bloqueados entre sí (perfiles, chats, publicaciones).

●  Control de acceso por rol (usuario individual, empresa, administrador) a nivel de API, no solo de interfaz.

●  Los tags ocultos de una vacante nunca deben exponerse al usuario individual, ni siquiera a través de la API

(ver RF3.1.6).

RNF6 — Legalidad y Cumplimiento

●  Cumplimiento de normativa de protección de datos personales aplicable (en Uruguay, Ley N.º 18.331 y su
decreto reglamentario), en particular por tratarse de datos de menores de edad a partir de los 14 años.

●  Política de privacidad y consentimiento explícito en el registro (ver RF1.1.12 y RF1.2.10).

RNF7 — Compatibilidad

●  Soporte a los navegadores modernos más usados (Chrome, Edge, Safari) en sus últimas versiones estables.

5. Restricciones

●  Presupuestarias: proyecto de carácter académico, sin presupuesto para infraestructura productiva a gran

escala; se prioriza el uso de servicios con capa gratuita.

●  Tecnológicas: el código se generará con asistencia de IA, por lo que conviene un stack ampliamente

documentado y con buen soporte de esa asistencia (ver sección 8).

●  De tiempo: cronograma acotado al calendario académico del curso.

●  De recursos humanos: equipo reducido; conviene evitar funcionalidades de alto costo de mantenimiento

en la fase inicial.

●  Legales: tratamiento de datos personales de usuarios que pueden ser menores de edad (a partir de 14

años según lo definido en RF1.1.8).

6. Opinión y Recomendaciones (rol PMO)

LinkYouth  ataca  un  problema  real,  concreto  y  bien  delimitado.  El  trabajo  de  esta  revisión  fue  llevar  los
requisitos  al mismo nivel de atomicidad que exige la consigna de referencia y sacar del alcance el módulo de
CV, que no aplica al perfil de la audiencia (primera experiencia laboral).

6.1 Riesgo principal: alcance disperso (scope creep)

Separar explícitamente RF1–RF9 (núcleo) de RF10 (fase avanzada) sigue siendo la decisión más importante del
documento:  si  se  intenta  construir  matching  por  algoritmo,  entrevistas  con  IA  y  sección  de  financiamiento
desde el día uno, el riesgo de no terminar nada funcional es alto.

6.2 Qué agregaría en la próxima iteración

●  Un modelo de datos claro (entidades: Usuario, Empresa, Vacante, Postulación, Evento, Tag, Reseña) antes

de escribirle el prompt a la IA.

●  Criterios de aceptación medibles por requisito (por ejemplo: "una postulación cambia de estado en menos

de 1 segundo tras la acción de la empresa").

●  Una matriz de trazabilidad simple: cada RF vinculado a la(s) pantalla(s) que lo implementan.

●  Definición explícita del rol Administrador y de las acciones de moderación (reportes de RF8.3).

●  Un plan de pruebas mínimo, aunque sea manual, para las funcionalidades críticas: registro, postulación y

cambio de estado.

6.3 Priorización sugerida (hoja de ruta)

●  Sprint 1 — Fundacional: RF1 (usuarios/roles) + modelo de datos + autenticación.

●  Sprint 2 — Núcleo de valor: RF2 (perfil) + RF3.1–RF3.8 (publicar y postularse, con estado visible).

●  Sprint 3 — Comunidad: RF4 (eventos) + RF9 (chat) + RF6 (notificaciones básicas).

●  Sprint 4 — Diferenciación: RF5 (preparación de entrevistas, versión básica) + RF7 (panel empresa) + RF8

(opiniones).

●  Fase avanzada (posterior al MVP funcionando): RF10 completo (matching por algoritmo, entrevistas con

IA, hoja de ruta personalizada, sección startups).

Quedo  a  la  espera  de  la  ficha  de  entrega  y  de  la  cantidad  de integrantes del equipo para transformar estos
sprints en un reparto de tareas concreto por persona.

7. Stack Tecnológico Propuesto

Como no hay stack definido aún y el código se generará con asistencia de IA, propongo priorizar herramientas
muy documentadas, con fuerte soporte de la comunidad y que reduzcan la cantidad de infraestructura que la
IA tiene que escribir desde cero (menos superficie = menos errores).

●  Frontend: Next.js (React) + TypeScript + Tailwind CSS — ecosistema muy conocido por los modelos de IA,

con buen soporte para diseño responsive.

●  Backend, base de datos, autenticación y almacenamiento: Supabase (PostgreSQL + Auth + Storage +

Realtime) — resuelve de fábrica autenticación, permisos por fila (Row Level Security) y almacenamiento de
imágenes, que son justamente los puntos más sensibles en seguridad (RNF5).

●  Notificaciones: Supabase Realtime para las notificaciones dentro de la app; correo electrónico

transaccional con Resend o similar para avisos de estado de postulación.

●  Hosting: Vercel para el frontend, Supabase Cloud para backend/datos (ambos con capa gratuita adecuada

para un proyecto académico).

●  Chat (RF9): Supabase Realtime también puede resolver mensajería simple sin sumar un servicio adicional.

8. Prompt Sugerido para la Generación de Código por IA

Prompt de arranque acotado al MVP (Sprints 1–2), redactado para pegarse directamente en la herramienta de
IA que se use para codificar, remitiendo explícitamente a los RF de este documento.

Una  vez  validado  y  funcionando  este  primer  recorte,  se puede continuar con un prompt equivalente para el
Sprint  3  (eventos,  chat  y  notificaciones)  y  así  sucesivamente,  siempre  citando  el  número  de  RF
correspondiente.