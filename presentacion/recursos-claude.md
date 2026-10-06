# Cómo trabajamos con Claude en LinkYouth

Este documento explica, en lenguaje sencillo, qué herramientas de
inteligencia artificial usamos para construir LinkYouth, qué reglas le dimos
y cómo fue el ida y vuelta entre el equipo y la herramienta.

## Las herramientas

**Claude** es un asistente de inteligencia artificial de Anthropic. Lo usamos
como compañero de conversación para pensar: ordenar ideas del proyecto,
redactar y revisar textos, comparar alternativas de diseño y entender
conceptos técnicos antes de aplicarlos.

**Claude Code** es la versión de Claude que trabaja directamente sobre el
proyecto, desde la terminal. Puede leer los archivos, proponer cambios,
escribir código, ejecutar comprobaciones y preparar los cambios para que el
equipo los revise. Lo usamos para:

- Construir las pantallas a partir de lo que diseñábamos y pedíamos.
- Armar y documentar la base de datos.
- Revisar el código en busca de errores y problemas de seguridad.
- Sacar capturas de pantalla para comparar versiones del diseño.
- Mantener la documentación al día después de cada cambio.

**Tecnologías.** La página que presentamos está hecha con **HTML y CSS**.
Para las próximas etapas, el equipo está evaluando otros lenguajes.

## Las directrices: cómo le decimos a Claude qué esperamos

Claude no «sabe» nada del proyecto por su cuenta. Cada vez que empieza a
trabajar lee unos archivos que escribimos nosotros, con las reglas y
decisiones del equipo. Son como el reglamento interno del proyecto.

### `CLAUDE.md` (en la raíz del proyecto)

**Qué es:** el documento principal de instrucciones. Claude lo lee
automáticamente al empezar.

**Qué aporta:**

- Un **mapa del proyecto**: dónde está cada cosa y qué documento consultar
  para cada tema.
- **Reglas que no se negocian**, por ejemplo: los datos de ejemplo siempre se
  anuncian en pantalla como ejemplo; la información privada de una búsqueda
  nunca le llega a quien se postula; todo se escribe en español rioplatense.
- Una **lista de control al terminar cada cambio**: anotar qué cambió y por
  qué en el registro de cambios, actualizar la documentación de arquitectura
  y dejar asentadas las decisiones que tuvieron alternativas.
- Los **pasos de verificación** antes de dar algo por terminado: revisar el
  código, compilar y mirar la pantalla en el navegador.

### `.claude/CLAUDE.md`

**Qué es:** un índice corto de las «skills» del proyecto.

**Qué aporta:** le dice a Claude qué skill usar en cada situación (por
ejemplo, «antes de tocar cualquier pantalla, usá la de diseño»).

### Skill `diseno-linkyouth` (`.claude/skills/diseno-linkyouth/`)

**Qué es:** una *skill* es un paquete de instrucciones especializadas que
Claude carga cuando la tarea lo requiere. Esta contiene nuestro sistema de
diseño, al que llamamos **«Recreo»**.

**Qué aporta:**

- La **paleta de colores** que nace del logo (violeta, turquesa y mandarina,
  con reglas de dónde va cada uno: la mandarina, solo en el botón principal).
- La **tipografía** (Red Hat), los espaciados, los bordes y las sombras.
- Las reglas de **movimiento**: cuánto dura cada animación y que, si la
  persona pidió «reducir movimiento» en su equipo, todo quede quieto.
- Las reglas de **accesibilidad**: contraste suficiente, foco visible con el
  teclado, nada que se entienda solo por el color.
- El **tono de los textos**: cercano con los jóvenes, serio con las empresas.
- Una **lista de revisión** para chequear cada pantalla antes de darla por
  terminada.

Gracias a esta skill, cada pantalla nueva sale con el mismo estilo, aunque
la pidan personas distintas del equipo en días distintos.

### Skill `graphify` (`.claude/skills/graphify/`)

**Qué es:** una herramienta que arma un «mapa de conocimiento» del proyecto:
qué archivos hay, cómo se relacionan y qué conceptos aparecen.

**Qué aporta:** le permite a Claude responder preguntas sobre el proyecto
(«¿dónde se usa esto?», «¿qué se rompe si cambio aquello?») sin leer todos
los archivos uno por uno.

### Configuración `.claude/settings.json`

**Qué es:** la configuración de Claude Code para este proyecto.

**Qué aporta:** activa unos controles automáticos (*hooks*) que se ejecutan
antes de que Claude busque o lea archivos, para que primero consulte el mapa
de `graphify` cuando existe.

### Documentos de apoyo (`docs/`)

No son instrucciones para Claude, pero el `CLAUDE.md` le pide consultarlos y
mantenerlos al día:

- **Especificación de requisitos**: qué tiene que hacer el sistema, con cada
  requisito numerado (RF1, RF3.6…). El código cita esos números.
- **Decisiones**: cada decisión técnica importante, con fecha, las
  alternativas que se consideraron y por qué se eligió una.
- **Registro de cambios**: una línea por cambio con el qué y el porqué.
- **Arquitectura**: cómo está armado el proyecto.

## El flujo de trabajo

1. **Pedido.** Una persona del equipo le explica a Claude Code qué quiere
   lograr, en lenguaje natural («la cinta de logos tiene que poder
   pausarse», «revisá si un usuario sin sesión puede ver datos ajenos»).
   Para pedidos grandes, le pedimos primero un **plan** y lo aprobamos antes
   de que empiece.
2. **Trabajo en una rama.** Cada cambio se hace en una **rama** propia de
   Git, separada de la versión principal (`main`). Las ramas llevan un
   nombre que dice qué son: `feat/…` para funcionalidades nuevas, `fix/…`
   para correcciones, `docs/…` para documentación.
3. **Verificación.** Antes de entregar, Claude revisa el código, compila el
   proyecto y mira la pantalla en el navegador, en computadora y en
   teléfono, en modo claro y oscuro.
4. **Pull request.** Los cambios se proponen como un *pull request* en
   GitHub: un pedido para sumar la rama a la versión principal, con la
   descripción de qué cambió y por qué.
5. **Revisión humana.** Una persona del equipo revisa el pull request, prueba
   los cambios y decide si se aceptan, si hay que corregir algo o si se
   descartan. **Nada llega a la versión principal sin esa aprobación.**
6. **Registro.** Cada cambio aceptado queda anotado en el registro de cambios
   y, si hubo una decisión importante, en el documento de decisiones.

Hasta la primera entrega se integraron así **ocho pull requests**: desde el
esqueleto inicial del proyecto hasta el rediseño «Recreo» de la portada.

## Lo que aprendimos

- **Las reglas escritas valen más que repetir pedidos.** Cuando algo salía
  mal dos veces, lo agregábamos al `CLAUDE.md` o a la skill de diseño, y
  dejaba de pasar.
- **Claude propone; el equipo decide.** Las decisiones de producto y de
  diseño las tomamos nosotros. Claude acelera el trabajo y señala problemas,
  pero cada cambio pasa por una revisión humana.
- **Pedir que muestre evidencia.** Le pedimos capturas, resultados de las
  comprobaciones y el razonamiento detrás de cada cambio, en lugar de
  aceptar un «ya está».
