# Diseño: tema «Ink & Paper» (cómic) + flat design

**Toda la demo usa un único tema, «Ink & Paper»**, y el **estilo plano (flat)**. Es decisión del usuario (hito 30) y manda sobre cualquier otra preferencia estética.
Referencia fijada por el usuario: [ponpon-mania.com/chapter/2](https://ponpon-mania.com/chapter/2) (cómic interactivo), medida con los *computed styles* y capturas de la página.
Los valores viven **solo** en `src/lib/themes.ts` (`THEME`); este documento explica el porqué y las reglas. *(Antes: tema «Primer», referencia primer.io/payment-pioneers; sigue en el historial de Git.)*

## La idea

Una interfaz de **cómic hecho a mano y silenciosa**: un campo plano de color con un grano fino (**terracota en Marte, azul acero en la Luna**; el azul lila de la referencia ya no se usa), **hojas de papel crema** con **trazo grueso de tinta negra**, un solo acento por mundo, botones en píldora y una única tipografía en negrita y minúscula.
En el original, las páginas del cómic (crema, ligeramente giradas) cuelgan sobre un fondo de manchas planas azul y rosa; aquí el fondo es el azul (cielo del 3D, globo, carga) y las tarjetas son las páginas. La interfaz se queda neutra (tinta y papel); el color de verdad lo ponen el campo del mundo, el acento y los **vehículos** (3 tonos).

## Qué se midió en la referencia

| Dato | Valor |
| --- | --- |
| Fondo (canvas WebGL) | azul lila plano `≈ #7E7EFF` y rosa `≈ #F892C0` en manchas orgánicas que cambian por escena; **grano** fino sobre el azul |
| Papel de las páginas | `#FEECE3` (`rgb(254,236,227)`), esquinas casi rectas, giro de ~0,5° |
| Tinta | `#171717`; trazo de los recuadros del cómic muy grueso e irregular |
| Pantalla de carga | `#FFF6F0`, mascota en círculo de tinta, barra fina |
| Píldora de progreso | tinta `#191819`, radio 60, texto blanco 700 |
| Tipografía | **Libre Franklin** (variable 100–900); navegación 15 px, **700, minúscula**; logotipo dibujado a mano |
| Hover de la navegación | **contorno de 1 px en píldora** que aparece alrededor del texto |
| Interacción | recorrido horizontal con la rueda, cursor «grab», página que se desliza |

## Tokens

| Token | Valor | Uso |
| --- | --- | --- |
| `canvas` | por mundo: Marte `#E2603A`, Luna `#4B7DB8` (el azul lila `#7E7EFF` de la referencia ya no se usa) | **El campo**: fondo de la página, del globo, cielo y niebla de la escena, pantalla de carga y color al que se funden las vistas |
| `surface` / `onInk` | `#FEECE3` | El **papel**: paneles y tarjetas; y el color del texto/iconos sobre tinta |
| `paperLight` | `#FFF6F0` | Papel claro: fondo plano detrás del vehículo en su tarjeta |
| `ink` / `inkSoft` | `#171717` / `#3A3A3A` | Texto, trazos, botón primario, barra superior, limbo y estrellas del globo, curvas de nivel del terreno |
| `muted` | `#675651` | Texto secundario |
| `line` | `#E8CFC2` | Pistas de barras y divisores sobre papel |
| `accent` / `hover` | por mundo: Marte `#FFC247`, Luna `#6BE3C3` (antes rosa `#F892C0`) | **El único acento**: posición actual, gema de las balizas, selección de texto, relleno que barre un botón al pasar el cursor, botón `.is-accent` |
| `accentSoft` | por mundo: Marte `#B33A16`, Luna `#1F5C8E` | Enlaces en hover |
| `radius` / `radiusSm` | 6 / 999 px | Papel y paneles / botones, chips y píldoras (totalmente redondos) |
| `stroke` | 3 px | Trazo de tinta de paneles, fotos e ilustraciones (el «recuadro de viñeta») |
| `grain` | 0,08 | Opacidad del grano sobre toda la pantalla (0 = sin grano) |
| `ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | La curva de **todas** las transiciones |
| `dur` | 250 / 600 / 1000 ms | `fast` (hover), `base` (estados), `slow` (entradas y desplazamientos) |
| `ground` | `mars` arena `#EEBE95 → #FFF1DF` (borde `#F7D8BC`), `moon` plata `#CDD3DA → #F5F6F8` (borde `#E2E6EA`), `lines` tinta | Terreno de cada mundo en 3 tonos de papel con curvas de nivel de tinta |

Paletas de los vehículos (3 tonos, en `missions.ts`; el `bg` es `paperLight`): Opportunity coral `#E65A4F / #F9A66C / #FFE4E0`, Spirit violeta, Ingenuity ámbar, Surveyor 3 oliva, SEV azul, Perseverance verde. Cada vehículo conserva su color y **no** sigue la paleta del mundo (posible mejora: alinearlos).

## Paleta por mundo (hito 46)

Tinta y papel (el cómic) son iguales en todas partes; lo que cambia con el mundo es **el campo, el acento y lo que cuelga de ellos**. Se define en `WORLDS` de `src/lib/themes.ts` y `themeFor(mundo)` devuelve el tema completo:

| | campo (`canvas`) | tinte claro (`canvasAlt`: rejilla del globo, manchas del cómic) | acento | acento suave (enlaces) | baliza activa | suelo 3D (`ground`) |
| --- | --- | --- | --- | --- | --- | --- |
| **Marte** | `#E2603A` terracota | `#F49A6D` | `#FFC247` mantequilla | `#B33A16` | `#F08A00` | arena cálida `#EEBE95 / #FFF1DF` |
| **Luna** | `#4B7DB8` azul acero | `#86AFDA` | `#6BE3C3` menta | `#1F5C8E` | `#16B38F` | plata fría `#CDD3DA / #F5F6F8` |

- **Cómo se aplica:** `useTheme()` (`lib/use-theme.ts`) da el tema del mundo de la ruta (`/mars…` = Marte, el resto = Luna) y sigue el `pushState` del selector del globo; los componentes lo usan en vez de importar `THEME`. Dentro del `<Canvas>` de R3F no llega el contexto de React: `Experience` saca el mundo de la misión (`bodyOfMission`). Las variables CSS las publica `components/WorldVars.tsx` y un script en el `<head>` de `app/layout.tsx` las pone antes del primer pintado (sin parpadeo). El cielo y la niebla de cada misión (`missions.ts`) son el campo de su mundo.
- Para retocar un color: cámbialo en `WORLDS` (o en `BASE.ground`); no escribas colores sueltos. Los vehículos conservan su color propio (`missions.ts`), que ya no es el acento.

## Tipografía

- **Una sola familia: Libre Franklin** (la de la referencia; `next/font/google` en `layout.tsx`). No hay mono: `THEME.mono` apunta a la misma familia y se usa para etiquetas, botones y números.
- **Títulos** (`display`/`title`, `ui.ts`): peso **800**, tracking −0,04 em, interlineado ~1. **Texto**: 14 px, peso 500. **Etiquetas, botones, chips y enlaces**: peso **700, minúscula** (`text-transform: lowercase`), 12–14 px, tracking +0,01 em. Los nombres propios en títulos conservan la capitalización; en etiquetas salen en minúscula, como en la referencia.
- Escala: `display` 32, `title` 22, texto 14, etiquetas 12 (`lib/ui.ts`). **Sin kickers**: el título habla solo; los metadatos van debajo, en minúscula.

## Hover

En la referencia, el hover de la navegación es un **contorno en píldora**. En la demo: `.ui-btn` (primario = píldora de tinta; `.is-ghost` = contorno de 2 px) y las filas/celdas (`.ui-row`, `.ui-nav`) se **rellenan de rosa con un barrido** de izquierda a derecha (`background-size` 0 → 100 %) en 600 ms y el texto pasa a tinta; `.ui-marker` (línea de tiempo) se rellena de rosa y crece; `.ui-link` pasa a azul (`accentSoft`); las flechas se deslizan 4 px (la de «volver», hacia atrás). La opción seleccionada (`.is-active`) se queda en tinta. Los botones desactivados no reaccionan.

## Iconos (`components/Icon.tsx`)

Un único set, **dibujado**: rejilla 16×16, **trazo de 2 px** (antes 1,5: más cercano al trazo del cómic), extremos y uniones redondeados, sin relleno, heredan `currentColor`. Iconos: `arrow-right`, `arrow-left`, `chevron-down`, `play`, `stop`, `pause`, `close`. **Nunca glifos sueltos**.

## Componentes

- **Panel** (`ui().panel`): papel con **trazo de tinta de 3 px** (`stroke`) y esquinas de 6 px. Sin sombra. `ui().frame` es el mismo trazo para fotos e ilustraciones dentro de un panel (la «viñeta»).
- **Páginas giradas**: la tarjeta del checkpoint (−0,7°) y el minimapa (+0,7°) llevan una rotación mínima (`rotate`, independiente de `transform`) para que parezcan hojas sobre la mesa, no cajas de UI. No giran los demás paneles (se apilan).
- **Botón primario** (`.ui-btn`): píldora de tinta, texto de papel en negrita minúscula, flecha que se desliza; secundario `.is-ghost` (contorno 2 px).
- **Barra superior** (`TopBar`): píldora de tinta con «← globe» y el selector vehicle; el desplegable es papel con trazo.
- **Chips de teclas** (`Hints`): píldoras de tinta; la tecla en un círculo rosa (apagados: píldora al 60 % y tecla de papel).
- **Subtítulos** (`Captions`): burbuja de tinta; etiqueta «narrator» (papel) o «guide» (rosa).
- **Línea de tiempo**: pista de 5 px redondeada, relleno de tinta y **círculos** de 16 px con trazo de tinta por checkpoint (tinta = alcanzado, color del vehículo = el vehículo está parado ahí). Solo entre dos checkpoints aparece un punto del color del vehículo que recorre la pista.
- **Minimapa**: dentro de un panel, con su viñeta (trazo de tinta); curvas de nivel suaves sobre papel, ruta en tinta (discontinua la pendiente), checkpoints cuadrados numerados.
- **Tarjeta del 3D (hito 48)**: la ilustración a todo el ancho de la tarjeta (4:5, tan alta como deje la pantalla) y debajo título, lugar, progreso + `listen`, resumen, datos y fuentes; ver [story.md](story.md).
- **Botón «skip the 3D»** (`.ui-btn.is-accent`): relleno del acento del mundo con contorno de tinta de 2,5 px; el barrido del hover es de tinta. «continue the story» es el botón primario (tinta).
- **Botón de música del globo** (`AmbientButton`): disco redondo `.ui-fab .ui-fab-md` solo con el icono (`sound` / `sound-off`), atenuado (`--line`) cuando está apagado; `aria-label` y `title` dicen el estado.
- **Píldora de página del cómic**: «05. Six minutes of fall» (número, punto, espacio y el título tal como viene del `story.json`, sin pasar a minúscula).
- **Globo (menú del juego)**: campo del mundo, rejilla en el tinte claro del mundo, limbo y estrellas en tinta; **gira libre en X e Y** y se acerca con la rueda (solo el globo y los vehículos). **Sin paneles**: el mundo se cambia con **texto** (`.ui-world`: «Mars  Moon» en 800; el actual lleva un subrayado rosa que se desliza con rebote, el otro se inclina y crece al pasar el cursor); una pista de tinta abajo; y los **vehículos hundidos en una masa que los pega al suelo** (efecto simbionte: tinta + rosa + papel, una sola malla, forma reconocible —ruedas, panel, mástil— que gira para mirarte y respira y se estira como gelatina; anillo cuadrado de papel que pulsa, etiqueta de tinta solo al pasar el cursor). La **tarjeta del vehículo flota** junto a él (papel con trazo, +0,6°), se cierra con una **X** (`.ui-fab-sm`, gira 90° al hover), con Esc o con un clic fuera, y el globo se queda quieto y bloqueado mientras está abierta.
- **Carga** (`Loading.tsx`): campo azul, título enorme en 800 abajo a la izquierda, etapa en negrita minúscula y barra de 6 px (tinta sobre papel) pegada al borde inferior.

## Escena 3D

- **Cielo y niebla** = `canvas` del mundo: el horizonte se disuelve en el campo, como las páginas sobre el fondo de la referencia.
- **Terreno**: el mismo mapa de alturas de siempre, `MeshToonMaterial` de 3 pasos de tono (`RAMP` 120/190/255, antes 88/172/255 para que las sombras no ensucien el papel) en **arena** (Marte) y **plata** (Luna) con **curvas de nivel de tinta** dibujadas por su shader (`withContours`, `lines` = tinta).
- **Polvo** crema/lila (`#F4DDD0` / `#E9E2F8`), **huellas** de tinta suave. **Balizas**: poste y anillo de tinta (grises al alcanzarlas) y gema rosa.
- Luz y sombras se conservan; lo que se dibuja encima (UI, globo, balizas) es plano. `Canvas flat` (sin *tone mapping*).

## El grano

`body::after` en `globals.css`: una capa fija y estática con un tile de ruido (SVG `feTurbulence`) a la opacidad `THEME.grain`. Es **textura, no degradado ni brillo**: la referencia lo tiene sobre su azul. Ojo: es una capa a pantalla completa sobre los canvas WebGL; **no se ha medido su coste** en la laptop del usuario (ver [performance.md](performance.md)); si pesa, `grain: 0` en `themes.ts` la quita.

## Vehículos

Siguen la estética de **3 tonos de un solo color** sin contornos ni degradados (ver `lib/vehicles/kit.ts`, medidas sobre el GLB de referencia, receta en [themes-and-missions.md](themes-and-missions.md)). Se ven bien sobre el papel crema y contra el campo azul. En la tarjeta del globo van **quietos, en vista isométrica**, dentro de una viñeta con trazo de tinta, sobre `paperLight`.
**Pendiente (decisión de arte):** la referencia dibuja sus personajes en tinta negra y crema, sin colores; los vehículos conservan sus colores. Si se quiere ir más allá, habría que rehacerlos a tinta (negro + crema).

## Movimiento (suave, y juguetón donde es un juego)

- **Dos curvas** y tres duraciones: `THEME.ease` (suave, para todo lo funcional) y **`THEME.pop`** (`cubic-bezier(0.34, 1.7, 0.5, 1)`: rebota y se asienta) para los elementos **de juego** del menú y de los botones. Nada de `ease`/`linear` sueltos ni duraciones inventadas.
- **Pops de juego** (hito 32): `components/Pop.tsx` hace entrar/salir con escala + giro + rebote (selector de mundo, música, pista inferior, tarjeta del vehículo que sale desde su vehículo); `.ui-btn` sube y se inclina al hover y se aplasta al pulsar; `.ui-fab-sm` (la X) gira 90°. En el 3D (`lib/motion.ts`, muelles desde `useFrame`): el globo y cada vehículo aparecen con rebote escalonado, cada vehículo da un saltito cada pocos segundos, se agranda y se menea al hover y rebota al estar seleccionado. Los bucles van con la Web Animations API (flecha de «travel to the past»). `prefers-reduced-motion` quita saltitos y meneos.
- **Entradas**: fundido + ascenso de 14 px (`Reveal`), escalonadas; las tarjetas del checkpoint y el minimapa suben 18 px y se funden en 600–1000 ms.
- **Cambios de estado**: color, opacidad y tamaño por transición; en 3D se interpolan (`lerp` con `1 − e^(−k·dt)`).
- **Transiciones de vista**: al viajar, el globo se funde al azul y la escena entra desde ese mismo azul (y al volver igual): sin cortes.
- **`prefers-reduced-motion`**: `globals.css` reduce todas las transiciones a ~0.
- Los `@keyframes` nuevos no los recoge el servidor de desarrollo: usa transiciones (`ease()` de `lib/ui.ts`, `Reveal`).

## Cómic de la historia (`components/Comic.tsx`, hito 36)

Las páginas de la historia de Opportunity siguen el lenguaje de ponpon-mania.com/chapter/3: **papel crema sobre el campo azul**, con **manchas rosa** detrás (aquí flotan y se mueven con cada página) y una **píldora de tinta** abajo (título + progreso rosa + botones redondos `.ui-fab-sm`). Cada página: marco de tinta (`stroke`) con la **ilustración de IA** a página completa (4:5), un **sello de fecha** girado −3° (entra con rebote), el contador `n/N` y un **recuadro de título + resumen** girado +0,5° que sube con rebote. Las páginas vecinas se ven más pequeñas y pálidas (0,8 / opacidad 0,6) y giradas; la activa se endereza. La ilustración hace un zoom lento al llegar. Todo con `THEME.pop`; `prefers-reduced-motion` lo reduce. Las ilustraciones se rotulan **«AI-generated illustration»** (no son fotos).

## Créditos — «Created by» (oculto)

Sin cambios: `Credits.tsx`/`Portrait.tsx` siguen sin montarse (ver [history.md](history.md), hito 25). Sus retratos usan `THEME.portrait` (azules); no se han adaptado al nuevo tema.

## Parte 1 del juego (historieta 2D)

Las viñetas que se hagan para la Parte 1 ([game-design.md](game-design.md)) **deben seguir este lenguaje**: papel crema + recuadros con trazo de tinta grueso + manchas planas de azul/rosa de fondo + grano, y el cómic de la referencia como modelo de composición (varias viñetas por página, globos de texto, onomatopeyas). El ritmo del original —recorrido horizontal de páginas con la rueda— es una opción para la navegación. Las ilustraciones en sí (dibujo, producción) siguen **pendientes**.

## Reglas (lista de comprobación)

1. **Colores sólidos.** Sin degradados, sin sombras (`box-shadow` de profundidad, `drop-shadow`, `text-shadow`), sin brillos ni desenfoques decorativos. Excepciones aceptadas: el contorno de 2 px de `.ui-btn.is-ghost` (un trazo, no una sombra) y el **grano** estático.
2. **Trazo de tinta** (`stroke`) en paneles, fotos e ilustraciones; esquinas casi rectas en papel, **píldoras** en botones y chips.
3. **Profundidad por color y superficie**, no por luz: el papel sobre el campo azul.
4. **Un solo acento por mundo** (mantequilla en Marte, menta en la Luna), usado con cuentagotas; el campo (terracota / azul acero) no es un acento.
5. **Tipografía e iconos**: Libre Franklin (800 títulos, 700 minúscula en etiquetas); sin kickers; iconos solo de `Icon.tsx`.
6. **Imágenes**: fotos de NASA de los checkpoints (16:10, con crédito) dentro de un recuadro de tinta, sin filtros; los vehículos se dibujan; las viñetas de la Parte 1 son ilustradas.
7. **Movimiento**: la curva y las duraciones del tema; nada brusco; respeta `prefers-reduced-motion`.
8. **Tokens, no valores sueltos**: si falta un color o una medida, añádelo a `themes.ts`.

## Cómo aplicarlo en código

- Tokens: `src/lib/themes.ts` (`BASE` + `WORLDS`; `themeFor`, `useTheme`). Se publican como variables CSS en `<html>` (`cssVars`, `WorldVars`) y el canvas/WebGL los lee directamente (`missions.ts` toma cielo y terreno de `themeFor(<mundo>)` / `THEME.ground` y el fondo de la tarjeta de `THEME.paperLight`).
- Estilos de texto y contenedores: `src/lib/ui.ts` (`ui(theme)` → `label`, `display`, `title`, `text`, `panel`, `value`, `frame`); `ease(theme, props, ms?, delay?)` para `transition`.
- Estados interactivos: clases `.ui-btn`, `.ui-link`, `.ui-row`, `.ui-nav`, `.ui-marker` en `src/app/globals.css`. Iconos: `<Icon name="arrow-right" />`.
- Entradas suaves: `components/Reveal.tsx`.
- Antes de dar por buena una pantalla: ¿hay sombra, degradado o brillo? ¿Algún salto sin transición? ¿Algún color o curva fuera de `themes.ts`?

## Pendiente / abierto

- La tipografía de la referencia es Libre Franklin (libre), así que coincide; el **logotipo y los títulos dibujados a mano** del original no tienen equivalente (se usa Libre Franklin 800).
- Revisar el contraste del texto de tinta sobre el azul `#7E7EFF` en proyector (carga, etiquetas del globo) y la legibilidad del grano.
- Manchas de fondo rosa/azul que cambian por escena (el original usa un canvas WebGL): hoy el campo es azul liso; añadir manchas planas orgánicas es un paso siguiente.
- Revisar el contraste del acento de Marte (mantequilla) sobre la arena del suelo (la baliza activa usa un tono más oscuro, `beacon`) y de la menta sobre la plata en la Luna.
- Alinear (o no) el color de cada vehículo con la paleta de su mundo.
- Revisión de acabado con un revisor independiente (skill de diseño) **no ejecutada**; la verificación fue visual en el navegador.
