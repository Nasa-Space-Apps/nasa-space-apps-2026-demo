# Diseño: tema «Primer» + flat design

**Toda la demo usa un único tema, «Primer»**, y el **estilo plano (flat)**. Es decisión del usuario y manda sobre cualquier otra preferencia estética.
Referencia fijada por el usuario: [primer.io/payment-pioneers](https://primer.io/payment-pioneers) (medida con los *computed styles* de la página).
Los valores viven **solo** en `src/lib/themes.ts` (`THEME`); este documento explica el porqué y las reglas.

## La idea

Una interfaz **limpia, editorial y silenciosa**: un lienzo cálido casi blanco, tinta casi negra, superficies gris claro, **un solo color (naranja)** y tipografía grande y apretada.
El color de verdad lo ponen las **ilustraciones de 3 tonos** (los vehículos); la interfaz se queda neutra para no competir con ellos. Todo se mueve despacio y sin saltos.

## Tokens

| Token | Valor | Uso |
| --- | --- | --- |
| `canvas` | `#F9FAF7` | Fondo de la página, del globo y color del que se funde la escena al viajar |
| `surface` | `#EDEEEB` | Paneles y tarjetas (sin borde, sin sombra) |
| `ink` / `inkSoft` | `#0D0D0D` / `#2E2E2C` | Texto, botón primario (y su hover), barra superior, limbo y estrellas del globo |
| `muted` | `#616161` | Texto secundario y etiquetas |
| `line` | `#DADADA` | Hilos, pistas de barras, divisores |
| `accent` | `#FF540A` | **El color principal**: posición actual, marcador del globo, gema de las balizas, selección de texto |
| `hover` / `accentSoft` | `#D7F94F` / `#FF916B` | Relleno lima que barre un botón al pasar el cursor / enlaces en hover (ambos medidos en la referencia) |
| `radius` / `radiusSm` | 4 px / 2 px | Paneles / botones y chips |
| `ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | La curva de **todas** las transiciones |
| `dur` | 250 / 600 / 1000 ms | `fast` (hover), `base` (estados), `slow` (entradas y desplazamientos) |

Paletas de los vehículos (3 tonos + fondo `#D9D9D9`, en `missions.ts`): **Marte coral** `#E65A4F / #F9A66C / #FFE4E0`, **Luna azul** `#1650B0 / #7FB0E3 / #F2F7FC`.

## Tipografía

- **Texto:** Hanken Grotesk (sustituto libre de la grotesca propietaria de la referencia, Onsite Standard), peso **450**, tracking apretado: títulos −0,04 em, cuerpo −0,01 em.
- **Etiquetas, botones y números:** JetBrains Mono 500, **mayúsculas**, 11–12 px, tracking +0,02 em (es la mono que usa la referencia). Mono solo para etiquetas y datos, no como decoración.
- Escala: `display` 30, `title` 22, texto 14, etiquetas 11 (`lib/ui.ts`).
- **Sin kickers** (etiquetas sobre un título): el título habla solo; los metadatos van debajo, en mono (`START 1/5 · SOL 0 · MERIDIANI PLANUM`).

## Hover (copiado de primer.io)

Medido en la referencia con el puntero encima: el **botón primario se rellena de lima** (`#D7F94F`, token `hover`) con un **barrido** de izquierda a derecha (`background-size` 0 → 100 %) y el texto pasa a tinta; el **enlace** pasa a naranja suave (`#FF916B`, token `accentSoft`);
las flechas se deslizan. En la demo: `.ui-btn` (primario y `.is-ghost`), `.ui-row` (filas del desplegable), `.ui-nav` (celdas de la barra superior) y `.ui-marker` (marcadores de la línea de tiempo) hacen el barrido lima en 600 ms con la curva del tema;
`.ui-link` cambia a `accentSoft`; `.ui-arrow` se desplaza 4 px (la de «volver», hacia atrás). La opción seleccionada (`.is-active`) se queda en tinta. Los botones desactivados no reaccionan.

## Iconos (`components/Icon.tsx`)

Un único set, **dibujado**: rejilla 16×16, **trazo de 1,5 px**, extremos y uniones redondeados, sin relleno, heredan `currentColor`. La flecha es la de la referencia (asta recta + punta abierta). Iconos: `arrow-right`, `arrow-left`, `chevron-down`, `play`, `stop`, `pause`, `close`.
**Nunca glifos sueltos** (→ ← ▶ ■ ▾): si falta un icono, se añade a `Icon.tsx` con el mismo trazo.

## Componentes

- **Panel** (`ui().panel`): fondo `surface`, esquinas 4 px, sin borde ni sombra, aire generoso (12–16 px).
- **Botón primario** (`.ui-btn`): rectángulo de tinta, texto del lienzo en mono mayúsculas, flecha `→` que se desliza 4 px al pasar el cursor. Secundario `.is-ghost` (contorno de 1 px que se rellena de tinta) y `.is-active`.
- **Enlace** (`.ui-link`): mono mayúsculas sin caja; `.is-back` mueve la flecha hacia atrás.
- **Barra superior** (`TopBar`): barra de tinta con «← Globe» y el selector Vehicle, como la navegación de la referencia.
- **Subtítulos** (`Captions`): una burbuja de tinta sobre el dock con **todo lo que dice una voz**: la narración del checkpoint (etiqueta lima «Narrator») y la guía (etiqueta naranja «Guide»), frase a frase y sin solaparse.
- **Chips de teclas** (`Hints`): la tecla en un bloque de tinta y su acción al lado; apagados pasan a gris.
- **Línea de tiempo**: hilo de 2 px, relleno de tinta y **cuadrados** de 12 px por checkpoint: tinta = alcanzado, **color del vehículo = el vehículo está parado ahí** (el cuadrado se rellena; no hay punto). Solo entre dos checkpoints aparece un punto de ese color que recorre el hilo. El color es `palette.dark` del vehículo (prop `accent` de `Timeline` y `Minimap`, desde `Scene`): coral, azul o verde según la misión. Etiquetas en mono.
- **Minimapa**: curvas de nivel grises, ruta en tinta (discontinua la pendiente), checkpoints cuadrados numerados. **Mismo lenguaje que la línea de tiempo:** parado en un checkpoint, su cuadrado se pinta del color del vehículo (número en claro) y desaparecen el punto, la flecha de rumbo y cualquier aro; al avanzar, vuelven el punto (también del color del vehículo) y la flecha de dirección (con fundido).
- **Globo**: rejilla `#B7B8B4` muy fina, limbo y estrellas en tinta, marcador naranja con anillo que pulsa, etiqueta oscura en mono.

## Escena 3D

- **Vehículos**: 3 tonos de un color por el ángulo con una luz fija (cel-shading, `lib/vehicles/kit.ts`), sin contornos ni texturas. Detalle en la sección siguiente.
- **Terreno**: es **el mismo mapa de alturas** de siempre (los STL de NASA; no se genera otra malla «poly») con `MeshToonMaterial` de 3 pasos de tono y **curvas de nivel dibujadas por su shader** (`withContours` en `lib/terrain.ts`: línea fina de ancho constante en pantalla, una de cada 4 más marcada, atenuadas a lo lejos; `lines`/`step` por misión). Antes: `MeshToonMaterial` con 3 pasos de tono (`RAMP` en `lib/terrain.ts`: 88 / 172 / 255), arena (`#A5967F → #DDD0BC`) en Marte y gris azulado (`#98A0AD → #D6DBE3`) en la Luna; suave y sin relieve «realista», pero con contraste suficiente para leer las formas.
- **Cielo y niebla** del color del lienzo (el horizonte se disuelve en la página); `Canvas flat` (sin *tone mapping*: los colores salen tal cual están definidos).
- **Balizas**: poste y anillo finos en tinta (grises al alcanzarlas) y una gema naranja.
- La escena conserva luz y sombras (terreno y vehículo); lo que se dibuja encima (UI, globo, balizas) es plano.

## Vehículos

Siguen la estética de las ilustraciones de la referencia: **limpia y plana**.

- **3 tonos de un solo color** (`dark`/`mid`/`light`) por vehículo, en `missions.ts` (`rover.palette`), sobre un gris liso (`palette.bg`).
- **Sin contornos, texturas, degradados ni brillos.** El tono de cada cara lo decide el ángulo con una luz fija (cel-shading de 3 bandas); los bordes redondeados dan los límites curvos de las ilustraciones.
- **Formas limpias, pero con el detalle del vehículo real**: la silueta y las piezas reconocibles (paneles solares con sus filas de celdas, suspensión rocker-bogie, mástil con sus cámaras, brazo, antenas, escotillas, radiador) se modelan; lo que solo sería ruido (tuberías, cables, tornillos) no. El detalle se lee por **tono fijo**: como una cara que no mira a la luz es toda oscura, lo pequeño se marca fijándole un tono distinto del de su fondo (lente oscura sobre bisel claro, celdas oscuras sobre la cubierta clara, radios claros sobre la rueda oscura).
- **Proporciones medidas, no inventadas**: cada vehículo se mide sobre su GLB de referencia (`public/models`), con las ruedas algo más grandes que las reales para conservar el aire de juguete.
- **Tonos fijos** donde aporta lectura: neumáticos, ventanas, lentes y celdas solares en el oscuro; llantas, articulaciones y actuadores en el medio; radios, biseles y aletas en el claro (los radios dejan ver que la rueda gira).
- **Paletas actuales**: Opportunity coral, SEV azul, Perseverance verde (`#0F7A5C / #5FC29A / #E6F7EE`), para que cada vehículo se reconozca por su color.
- Se construyen en código (no hay GLB): `src/lib/vehicles/kit.ts` + un archivo por vehículo; receta en [themes-and-missions.md](themes-and-missions.md).
- **En la tarjeta del globo** se ven **quietos, en vista isométrica** (cámara ortográfica a elevación fija, el vehículo girado 72° para verlo de 3/4 frontal), renderizados una sola vez (`frameloop="demand"`). Solo se mueven en la escena.

## Movimiento (todo suave)

- **Una sola curva** (`THEME.ease`) y tres duraciones. Nada de `ease`/`linear` sueltos ni duraciones inventadas.
- **Entradas**: fundido + ascenso de 14 px (`Reveal`), escalonadas entre hermanos; las tarjetas del checkpoint y el minimapa suben 18 px y se funden en 600–1000 ms.
- **Hover**: ver arriba (barrido lima, enlaces naranja suave).
- **Cambios de estado**: color, opacidad y tamaño siempre por transición; en 3D se interpolan (`lerp` con `1 − e^(−k·dt)`) en vez de saltar (balizas, cámara, globo).
- **Transiciones de vista**: al viajar, el globo se funde al color del lienzo y la escena entra desde ese mismo color (y al volver igual): sin cortes.
- **`prefers-reduced-motion`**: `globals.css` reduce todas las transiciones a ~0 conservando el diseño.
- Los `@keyframes` nuevos no los recoge el servidor de desarrollo: usa transiciones (`ease()` de `lib/ui.ts`, `Reveal`).

## Carga (precarga) — `components/Loading.tsx`

Una sola pantalla de carga para toda la demo, en el lenguaje del tema: lienzo `#F9FAF7`, **título grande abajo a la izquierda** (el nombre del vehículo, tipografía de títulos), una línea mono en mayúsculas con la etapa y el porcentaje (`MARS · DOWNLOADING TERRAIN` … `MARS · BUILDING TERRAIN`) y una **barra de 2 px** pegada al borde inferior (tinta sobre `line`, igual que la línea de tiempo).

- **Continuidad:** todas las etapas de un viaje dibujan lo mismo en el mismo sitio, así que pasar de una a otra no cambia de pantalla: el fallback de la ruta y la descarga del chunk solo muestran la barra (que «respira»); la escena añade el título, la etapa y el progreso real.
- **Escena** (`Scene`): la pantalla se queda **hasta que el terreno está descargado y construido** (`game.terrain` publicado; progreso real con `useProgress` mientras baja el STL) y **al menos 0,9 s** para no parpadear; `<Preload all />` compila shaders y sube la geometría detrás de ella. Entonces se disuelve (1,4 s) en la escena. Antes se desvanecía a ciegas y el terreno aparecía de golpe.
- **Salir** (`← Globe`, cambio de vehículo, `M`): la escena se funde al color del lienzo (≈ 750 ms) **antes** de navegar; el globo entra con otro fundido. Cero cortes en ambos sentidos. En el globo, «Travel to the past» hace lo mismo (`Explore`).
- **Globo:** su canvas aparece con un fundido cuando está creado (`Globe`); su pantalla de carga («Left behind · Loading the globe») cubre la descarga del chunk y el `Suspense` de la ruta.
- **Tarjeta del vehículo:** el vehículo se funde sobre el gris liso cuando se dibuja (`VehicleView`). **Fotos de los checkpoints:** `FadeImg` las funde cuando cargan (ya precargadas, aparecen al instante); mientras tanto se ve el color `line`.
- Los `Suspense` de las páginas ya no usan colores viejos (`#07080d`, `#E7E6E2`): usan `Loading`.

## Créditos — «Created by» (`components/Credits.tsx`, `Portrait.tsx`)

> **Oculto por ahora** (decisión del usuario: no le gustó ni el primer retrato, dibujado a mano, ni el segundo, calcado de la foto). El código sigue en el repo pero no se monta en ninguna vista. Para volver a mostrarlo: `import Credits from "./Credits"` y `<Credits />` junto a `<AmbientButton />` en `Explore.tsx`.

Botón pequeño «Credits» (ghost, con el icono `user`) arriba a la derecha del globo, junto a «Music». Abre una **tarjeta flotante** («Created by») con **una tarjeta por persona**, copiada de las tarjetas de entrevista de Primer: retrato en un cuadrado gris, **nombre** (tipografía de títulos), **rol** y un botón de tinta «LinkedIn →» (`.ui-btn`, con el barrido lima). Se abre y cierra con fundido; Escape o clic fuera la cierra.

- **Datos:** `src/lib/team.ts` (`TEAM`: nombre, rol, enlace). Para añadir a alguien: una entrada ahí y su retrato en `Portrait.tsx`.
- **Retratos:** ilustraciones 2D planas en SVG (sin degradados ni contornos), al estilo de la referencia: **una sola familia de azules en pocos tonos** sobre gris claro. Los colores son `THEME.portrait` (los únicos azules de la demo; no se usan en ningún otro sitio). Cada persona es una pila de formas planas (`src/lib/portraits/<id>.ts`, cuadrícula de 400×400, pintadas de atrás hacia delante) que `Portrait.tsx` colorea con la paleta.
- **Cómo se hace un retrato (calcado de la foto, no a ojo):** el primer intento, dibujado a mano con pocos polígonos, quedó pobre y sin parecido. Ahora `scripts/portrait/build.py <foto> <dir>` recorta la foto y saca las capas: silueta del pelo y de la chaqueta y **planos de luz y sombra de la piel por umbrales de luminancia** (siguen la luz real de la foto; se redondean con desenfoque + umbral), y encima **ojos, cejas y labios dibujados con puntos medidos sobre la foto** (los umbrales los dejan sucios, y son lo que da el parecido). `node scripts/portrait/trace.mjs <dir> <id>` vectoriza cada capa con potrace y escribe `src/lib/portraits/<id>.ts`. Necesita Python con pillow/numpy/scipy y `npm i --no-save potrace`. **Las coordenadas del script son de una foto concreta**: para otra persona hay que ajustar el recorte y volver a medir contornos y rasgos (mira `side.png`, foto | resultado, antes de vectorizar). La foto no se guarda en el repo.
- Jackson Merma — «AI & Software Engineer» — es el primero; falta la tarjeta del compañero.

## Superficies del navegador

Selección de texto naranja, cursor naranja, scrollbars finas del color de las líneas, anillo de foco de 2 px de tinta (solo con teclado) y la pantalla de carga propia (`Loading`, sustituye al `Loader` de drei).

## Reglas (lista de comprobación)

1. **Colores sólidos.** Sin degradados, sin sombras (`box-shadow` de profundidad, `drop-shadow`, `text-shadow`), sin brillos ni desenfoques decorativos. Excepciones aceptadas: el contorno de 1 px de `.ui-btn.is-ghost` (un hilo, no una sombra). No hay más.
2. **Formas simples**: rectángulos de esquinas casi rectas, cuadrados, círculos; sin píldoras ni diamantes.
3. **Profundidad por color y superficie**, no por luz.
4. **Un solo acento** (naranja), usado con cuentagotas.
5. **Tipografía e iconos**: grotesca 450 + mono en mayúsculas para etiquetas; sin kickers ni números de sección decorativos; iconos solo de `Icon.tsx`.
6. **Imágenes**: fotos de NASA de los checkpoints (16:10, con crédito), sin filtros ni marcos; los vehículos se dibujan.
7. **Movimiento**: la curva y las duraciones del tema; nada brusco; respeta `prefers-reduced-motion`.
8. **Tokens, no valores sueltos**: si falta un color o una medida, añádelo a `themes.ts`.

## Cómo aplicarlo en código

- Tokens: `src/lib/themes.ts` (`THEME`). Se publican como variables CSS en `<html>` (`cssVars`) y el canvas/WebGL los lee directamente.
- Estilos de texto y contenedores: `src/lib/ui.ts` (`ui(theme)`); `ease(theme, props, ms?, delay?)` para `transition`.
- Estados interactivos: clases `.ui-btn`, `.ui-link`, `.ui-row`, `.ui-nav`, `.ui-marker` en `src/app/globals.css`. Iconos: `<Icon name="arrow-right" />`.
- Entradas suaves: `components/Reveal.tsx`.
- Antes de dar por buena una pantalla: ¿hay sombra, degradado o brillo? ¿Algún salto sin transición? ¿Algún color o curva fuera de `themes.ts`?

## Pendiente / abierto

- La tipografía es un sustituto libre de la de la referencia (Onsite Standard es propietaria); si se consigue la licencia, cambiar `--font-sans` en `layout.tsx` y ajustar el tracking.
- El texto de los cuerpos largos (tarjetas) usa 13–14 px; revisarlo en proyector.
- La escena no tiene relieve «dibujado»: si se quiere más carácter, añadir contornos de nivel al terreno en los mismos 3 tonos.
- Revisión de acabado con un revisor independiente (skill de diseño) **no ejecutada**; la verificación fue visual en el navegador (ver `docs/history.md`, hito 19).
