# Diseño: tema «Ink & Paper» (cómic) + flat design

**Toda la demo usa un único tema, «Ink & Paper»**, y el **estilo plano (flat)**. Es decisión del usuario (hito 30) y manda sobre cualquier otra preferencia estética.
Referencia fijada por el usuario: [ponpon-mania.com/chapter/2](https://ponpon-mania.com/chapter/2) (cómic interactivo), medida con los *computed styles* y capturas de la página.
Los valores viven **solo** en `src/lib/themes.ts` (`THEME`); este documento explica el porqué y las reglas. *(Antes: tema «Primer», referencia primer.io/payment-pioneers; sigue en el historial de Git.)*

## La idea

Una interfaz de **cómic hecho a mano y silenciosa**: un campo plano de color (azul lila) con un grano fino, **hojas de papel crema** con **trazo grueso de tinta negra**, un solo acento rosa, botones en píldora y una única tipografía en negrita y minúscula.
En el original, las páginas del cómic (crema, ligeramente giradas) cuelgan sobre un fondo de manchas planas azul y rosa; aquí el fondo es el azul (cielo del 3D, globo, carga) y las tarjetas son las páginas. La interfaz se queda neutra (tinta y papel); el color de verdad lo ponen el campo azul, el acento y los **vehículos** (3 tonos).

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
| `canvas` | `#7E7EFF` | **El campo azul**: fondo de la página, del globo, cielo y niebla de la escena, pantalla de carga y color al que se funden las vistas |
| `surface` / `onInk` | `#FEECE3` | El **papel**: paneles y tarjetas; y el color del texto/iconos sobre tinta |
| `paperLight` | `#FFF6F0` | Papel claro: fondo plano detrás del vehículo en su tarjeta |
| `ink` / `inkSoft` | `#171717` / `#3A3A3A` | Texto, trazos, botón primario, barra superior, limbo y estrellas del globo, curvas de nivel del terreno |
| `muted` | `#675651` | Texto secundario |
| `line` | `#E8CFC2` | Pistas de barras y divisores sobre papel |
| `accent` / `hover` | `#F892C0` | **El único acento** (rosa): posición actual, gema de las balizas, selección de texto, relleno que barre un botón al pasar el cursor |
| `accentSoft` | `#4747E0` | Enlaces en hover |
| `radius` / `radiusSm` | 6 / 999 px | Papel y paneles / botones, chips y píldoras (totalmente redondos) |
| `stroke` | 3 px | Trazo de tinta de paneles, fotos e ilustraciones (el «recuadro de viñeta») |
| `grain` | 0,08 | Opacidad del grano sobre toda la pantalla (0 = sin grano) |
| `ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | La curva de **todas** las transiciones |
| `dur` | 250 / 600 / 1000 ms | `fast` (hover), `base` (estados), `slow` (entradas y desplazamientos) |
| `ground` | `mars` crema `#EDC4AE → #FFF3EA` (borde `#F5D9C9`), `moon` lila `#D7CDF0 → #F6F2FF` (borde `#E6DEF8`), `lines` tinta | Terreno de cada mundo en 3 tonos de papel con curvas de nivel de tinta |

Paletas de los vehículos (3 tonos, en `missions.ts`; el `bg` es `paperLight`): Opportunity coral `#E65A4F / #F9A66C / #FFE4E0`, SEV azul, Perseverance verde. Los vehículos **no se han tocado** en este hito.

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
- **Globo (menú del juego)**: campo azul, rejilla azul claro, limbo y estrellas en tinta. **Sin paneles**: el mundo se cambia con **texto** (`.ui-world`: «Mars  Moon» en 800; el actual lleva un subrayado rosa que se desliza con rebote, el otro se inclina y crece al pasar el cursor); una pista de tinta abajo; y los **vehículos en miniatura** (tinta + rosa + papel, anillo cuadrado de papel que pulsa, etiqueta de tinta solo al pasar el cursor). La **tarjeta del vehículo flota** junto a él (papel con trazo, +0,6°), se cierra con una **X** (`.ui-fab-sm`, gira 90° al hover), con Esc o con un clic fuera, y el globo se queda quieto y bloqueado mientras está abierta.
- **Carga** (`Loading.tsx`): campo azul, título enorme en 800 abajo a la izquierda, etapa en negrita minúscula y barra de 6 px (tinta sobre papel) pegada al borde inferior.

## Escena 3D

- **Cielo y niebla** = `canvas` (azul): el horizonte se disuelve en el campo, como las páginas sobre el fondo de la referencia.
- **Terreno**: el mismo mapa de alturas de siempre, `MeshToonMaterial` de 3 pasos de tono (`RAMP` 120/190/255, antes 88/172/255 para que las sombras no ensucien el papel) en **crema** (Marte) y **lila claro** (Luna) con **curvas de nivel de tinta** dibujadas por su shader (`withContours`, `lines` = tinta).
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

## Créditos — «Created by» (oculto)

Sin cambios: `Credits.tsx`/`Portrait.tsx` siguen sin montarse (ver [history.md](history.md), hito 25). Sus retratos usan `THEME.portrait` (azules); no se han adaptado al nuevo tema.

## Parte 1 del juego (historieta 2D)

Las viñetas que se hagan para la Parte 1 ([game-design.md](game-design.md)) **deben seguir este lenguaje**: papel crema + recuadros con trazo de tinta grueso + manchas planas de azul/rosa de fondo + grano, y el cómic de la referencia como modelo de composición (varias viñetas por página, globos de texto, onomatopeyas). El ritmo del original —recorrido horizontal de páginas con la rueda— es una opción para la navegación. Las ilustraciones en sí (dibujo, producción) siguen **pendientes**.

## Reglas (lista de comprobación)

1. **Colores sólidos.** Sin degradados, sin sombras (`box-shadow` de profundidad, `drop-shadow`, `text-shadow`), sin brillos ni desenfoques decorativos. Excepciones aceptadas: el contorno de 2 px de `.ui-btn.is-ghost` (un trazo, no una sombra) y el **grano** estático.
2. **Trazo de tinta** (`stroke`) en paneles, fotos e ilustraciones; esquinas casi rectas en papel, **píldoras** en botones y chips.
3. **Profundidad por color y superficie**, no por luz: el papel sobre el campo azul.
4. **Un solo acento** (rosa), usado con cuentagotas; el azul es el campo, no un acento.
5. **Tipografía e iconos**: Libre Franklin (800 títulos, 700 minúscula en etiquetas); sin kickers; iconos solo de `Icon.tsx`.
6. **Imágenes**: fotos de NASA de los checkpoints (16:10, con crédito) dentro de un recuadro de tinta, sin filtros; los vehículos se dibujan; las viñetas de la Parte 1 son ilustradas.
7. **Movimiento**: la curva y las duraciones del tema; nada brusco; respeta `prefers-reduced-motion`.
8. **Tokens, no valores sueltos**: si falta un color o una medida, añádelo a `themes.ts`.

## Cómo aplicarlo en código

- Tokens: `src/lib/themes.ts` (`THEME`). Se publican como variables CSS en `<html>` (`cssVars`) y el canvas/WebGL los lee directamente (`missions.ts` toma cielo, terreno y fondo de la tarjeta de `THEME`).
- Estilos de texto y contenedores: `src/lib/ui.ts` (`ui(theme)` → `label`, `display`, `title`, `text`, `panel`, `value`, `frame`); `ease(theme, props, ms?, delay?)` para `transition`.
- Estados interactivos: clases `.ui-btn`, `.ui-link`, `.ui-row`, `.ui-nav`, `.ui-marker` en `src/app/globals.css`. Iconos: `<Icon name="arrow-right" />`.
- Entradas suaves: `components/Reveal.tsx`.
- Antes de dar por buena una pantalla: ¿hay sombra, degradado o brillo? ¿Algún salto sin transición? ¿Algún color o curva fuera de `themes.ts`?

## Pendiente / abierto

- La tipografía de la referencia es Libre Franklin (libre), así que coincide; el **logotipo y los títulos dibujados a mano** del original no tienen equivalente (se usa Libre Franklin 800).
- Revisar el contraste del texto de tinta sobre el azul `#7E7EFF` en proyector (carga, etiquetas del globo) y la legibilidad del grano.
- Manchas de fondo rosa/azul que cambian por escena (el original usa un canvas WebGL): hoy el campo es azul liso; añadir manchas planas orgánicas es un paso siguiente.
- Probar la escena de la Luna (lila) y los vehículos en pausa con el nuevo tema.
- Revisión de acabado con un revisor independiente (skill de diseño) **no ejecutada**; la verificación fue visual en el navegador.
