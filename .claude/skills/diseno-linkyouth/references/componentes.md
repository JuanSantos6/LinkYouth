# Componentes

Qué resuelve cada uno y qué decisión ya está tomada adentro, para no volver a
discutirla en cada pantalla.

## Estructura

### `layout/CabeceraGlobal`

Barra superior fija, en todas las pantallas: marca, navegación de sitio
(Empleos, Eventos, Empresas, Cómo funciona), campana de avisos y avatar.

Se reparte el trabajo con la barra lateral: la cabecera es **a dónde se puede
ir en LinkYouth**, incluido lo que mira alguien sin cuenta; la lateral son
**las secciones de tu cuenta**. Por eso «Empleos» y «Eventos» aparecen en los
dos lugares sin ser una repetición.

En pantallas chicas la fila se desplaza en horizontal en vez de esconderse:
escondida, «Empresas» y «Cómo funciona» quedaban fuera de alcance desde el
teléfono.

### `layout/PieDeSitio`

Cuatro columnas —marca, Plataforma, LinkYouth, Legales—, el copyright y un
enlace al repositorio. **La única red que figura es el repositorio, porque es
la única que existe de verdad**: sumar íconos de redes que no llevan a ninguna
cuenta es decorar el pie con enlaces muertos.

### `layout/BarraLateral`

Las seis secciones de la cuenta. La activa se marca con un **filete
vertical**, no con una píldora rellena: el relleno pesa más que el propio
texto y compite con la acción principal de la pantalla.

Lleva `min-w-0`: es un ítem de grilla, y sin eso su fila desplazable ensancha
el documento entero en el teléfono.

### `layout/Marca`

Cuadro con las iniciales en el color de la plataforma. **Sin ámbar**: el
ámbar significa «esto está acreditado» y un logo no acredita nada.

## Primitivas

| Componente              | Props                                 | Qué resuelve                                                                                                                                                                                              |
| ----------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tarjeta`               | `como?`, `elevada?`                   | Superficie con borde. Ya **no** es el envoltorio de todo: las vacantes son filas con filetes. `elevada` solo para lo que está realmente por encima del plano                                              |
| `Etiqueta`              | `children`, `coincide?`               | Un tag o una habilidad. `coincide` marca con ✓ y más peso lo que el perfil ya declara, nunca con relleno de color: en una vacante que pide seis cosas, seis etiquetas pintadas son un fondo, no una señal |
| `Insignia`              | `children`, `tono?`                   | Estado. `tono="acreditado"` es el único que usa ámbar, y solo para una postulación aceptada                                                                                                               |
| `Avatar`                | `nombre`, `url`, `tamano?`, `forma?`  | Foto o iniciales. Reserva el espacio siempre, así la grilla no salta. Usa `<img>` y no `next/image` porque los archivos viven en Supabase Storage, con dominios variables                                 |
| `Boton` · `BotonEnlace` | `variante?`                           | `primario`, `secundario`, `fantasma`. El enlace navega: separado del botón porque para un lector de pantalla no son lo mismo                                                                              |
| `MensajeDeAccion`       | `estado`                              | El resultado de una acción, al lado del control. El error se distingue por peso, filete y la palabra «No se pudo», no por color: la paleta no tiene rojo a propósito                                      |
| `EstadoVacio`           | `titulo`, `descripcion`, `accion?`    | Borde punteado: dice «acá va a haber algo» sin fingir que hay contenido                                                                                                                                   |
| `AvisoOrigen`           | `resultado`                           | Avisa que lo que se ve es demostración, y por qué. **Nunca lo saques para que la pantalla quede más limpia**                                                                                              |
| `Encabezado`            | `titulo`, `descripcion?`, `acciones?` | Sin rótulo en versalitas encima: el título ya dice dónde estás                                                                                                                                            |

## Dominio

| Componente                      | Qué muestra                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `empleos/ListadoDeVacantes`     | La destacada suelta arriba y elevada; el resto, filas separadas por filetes. Meterla dentro del listado dividido obligaría a cortar los filetes alrededor de su sombra          |
| `empleos/FilaVacante`           | Una vacante. El porcentaje va en `.cifra` y nunca solo: al lado están las etiquetas que lo explican                                                                             |
| `eventos/TarjetaEvento`         | Sí es tarjeta. Sin imagen no se inventa una banda de color: el bloque de fecha pasa a ser el ancla                                                                              |
| `perfil/TarjetaUsuario`         | Tu ficha en la columna derecha, con las métricas como lista de definiciones                                                                                                     |
| `perfil/NubeTags`               | Dos grupos separados: «lo que sabés hacer» y «hacia dónde querés ir». El esquema los guarda en catálogos distintos                                                              |
| `ajustes/ControlesDeApariencia` | Switch de tema y selector de acento. Lee el estado del elemento raíz al montarse: si arrancara con su propio valor por defecto, diría «claro» mientras la pantalla se ve oscura |

## Formularios

- Rótulo visible siempre, nunca solo `placeholder`.
- Ayuda debajo del campo, en `text-[13px] text-apagado`.
- El botón se deshabilita mientras corre y cambia el texto («Guardando…»).
- El resultado va en `MensajeDeAccion`.
- La validación corre **también** en el servidor, en la acción. El `maxLength`
  del campo es comodidad, no control.
