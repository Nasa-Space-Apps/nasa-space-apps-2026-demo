# Tema y vehículos

## El tema — `src/lib/themes.ts`

La demo tiene **un único tema, «Ink & Paper»** (cómic; referencia: ponpon-mania.com/chapter/2; antes «Primer»). Ya no hay selector de estilos ni atajos `1…9`: los temas anteriores
(Light, Flat, Paper, Navy, Mind) se eliminaron (siguen en el historial de Git). Reglas y valores: [design.md](design.md).

`THEME` (tipo `Theme`) es la **única fuente de verdad** de los tokens: `app/layout.tsx` los publica como variables CSS (`cssVars(THEME)` → `--canvas`, `--surface`, `--ink`,
`--ink-soft`, `--muted`, `--line`, `--accent`, `--radius`, `--radius-sm`, `--ease`, `--dur-*`) para las clases `.ui-*` de `globals.css`, y el código de canvas/WebGL (minimapa, globo,
balizas) lee el objeto directamente. **Para cambiar un color o un radio, edita solo `themes.ts`.**

Campos de `Theme`:

- **Fuentes:** `font` (texto) y `mono` (etiquetas, botones, números); se cargan con `next/font/google` en `layout.tsx` (`--font-sans`, `--font-mono`).
- **Color:** `canvas` (fondo), `surface` (tarjetas), `ink`/`inkSoft` (texto y botón primario / su hover), `muted` (texto secundario), `line` (líneas finas), `accent` (el único color) y `accentInk`.
- **Forma y movimiento:** `radius` (paneles), `radiusSm` (botones, chips), `ease` (la curva de **todas** las transiciones) y `dur { fast, base, slow }` en ms.
- **Minimapa:** `map { bg, minor, major, minorW, majorW, every }` (curvas de nivel), `trail`, `marker { dot, ring, arrow }`, `checkpoint { pin, done, ring }` (cuadrados numerados).
- **Balizas 3D:** `beacon { pending, active, done }` (poste y anillo en `pending`/`done`; la gema en `active`).
- **Globo:** `globe { bg, line, star, ink, tag, tagText, pin }`.

Estilos DOM compartidos: `lib/ui.ts` (`ui(theme)` → `label`, `display`, `title`, `text`, `panel`, `value`; `ease(theme, props, ms?, delay?)` para `transition`) y `components/Reveal.tsx`
(entrada suave). Las piezas con estados (botones, enlaces, filas del desplegable) son las clases `.ui-btn` (`.is-ghost`, `.is-active`), `.ui-link` (`.is-back`), `.ui-row` y `.ui-nav` de `globals.css`.

Si quieres una fuente nueva: cárgala con `next/font/google` en `layout.tsx`, expónla como variable CSS y úsala en `font`/`mono`.

## Vehículos + terreno (misiones) — `src/lib/missions.ts`

Una misión es un objeto `Mission` del array `MISSIONS`. Su ruta es `/<mundo>/<id>` (hay que añadir también el vehículo al mundo donde quedó abandonado en `lib/bodies.ts`); en la escena aparece en el selector «Vehicle» y la tecla `M` rota entre ellas (navegando).

```ts
{
  id: "sev",                       // clave estable (localStorage)
  name: "SEV · Moon (Apollo 14)",   // texto del selector
  title: "SEV · Apollo 14",        // título del minimapa
  swatch: ["#0C0D11", "#8C8A86", "#C9C6BF"],
  terrainUrl: "/models/moon-terrain.stl",
  terrain: {
    fade: 30,          // ancho (unidades) de la franja de borde que se aplana
    lo: "#3b3b40",     // color del suelo más bajo
    hi: "#b4b1aa",     // color del suelo más alto
    edge: "#77756f",   // color del borde aplanado y del plano de suelo infinito
  },
  rover: {
    model: "sev",      // modelo procedural de lib/vehicles/ ("opportunity" | "sev" | "perseverance" | "spirit" | "ingenuity" | "insight" | "beagle2")
    palette: { dark: "#1650B0", mid: "#7FB0E3", light: "#F2F7FC", bg: "#D9D9D9" },  // 3 tonos de un color + fondo liso de su tarjeta
    maxSpeed: 18, boostSpeed: 32,   // maxSpeed = Espacio mantenido; boostSpeed = viaje automático (línea de tiempo)
    heading: -Math.PI * 0.75,   // (sin uso: el rumbo sale de la ruta)
  },
  env: {
    sky: "#0c0d11", fogNear: 50, fogFar: 210,         // color de fondo/niebla y distancias
    hemi: ["#9aa3b5", "#2a2a2e", 0.5],                 // luz ambiente (cielo, suelo, intensidad)
    sun: { color: "#fffaf0", intensity: 2.8, offset: [80, 38, 30] },  // offset respecto al rover
  },
  dust:   { color: "#bdbab3", drag: 0.5, lift: -4, up: 0.8, life: 0.8, size: 0.75, alpha: 0.4 },
  tracks: { color: "#1c1c1f", opacity: 0.35 },
  checkpoints: storyOf("…")!.checkpoints, // salen del story.json de la misión (src/lib/story.ts); `[]` = «coming soon»
  checkpointRadius: 14,            // radio de activación (y tamaño de la baliza); ~1,5× el ancho del vehículo
}
```

### Receta

1. Copia el terreno (STL) a `public/models/` y documéntalo en [assets.md](assets.md). Los STL de Blender vienen **Z-up** y se rotan solos.
2. **Crea el vehículo** en `src/lib/vehicles/<id>.ts`: una función que dibuja con el `Kit` (`lib/vehicles/kit.ts`: `box`, `cyl`, `tube`, `ball`, `ring`, `prism`/`slab`/`panel`, `lathe`, `loft`, `wheel` + `tyre`, `at`), avanza por **+z**, con las ruedas en y=0
   y centradas en x/z; añádela a `buildVehicle` y al tipo `VehicleModel` (`lib/vehicles.ts`). Estilo y reglas: [design.md](design.md#vehículos).
   **Mide antes de dibujar**: saca del GLB de referencia la posición y el radio de las ruedas, la caja del cuerpo y dónde va cada pieza (los GLB vienen comprimidos con Draco: se decodifican con `@gltf-transform/core` + `draco3dgltf` en Node), elige un factor de escala para que la huella
   sea parecida a la de los demás (≈ 9–12 de ancho) y deja las ruedas un poco más grandes que las reales. Los detalles pequeños llevan tono fijo (`DARK`/`MID`/`LIGHT`) para que se lean.
3. Añade el objeto a `MISSIONS` con su `model` y su `palette` (3 tonos de un color + fondo). Las ruedas, la huella (`halfLen/halfWid`) y el tamaño salen del modelo.
4. Define su historia (y con ella los checkpoints y la **ruta**): receta en [story.md](story.md) (hito 44: ya no se escriben checkpoints a mano; sin historia, `checkpoints: []` y la tarjeta del globo dice «coming soon»).
5. **Añádelo al globo** (`src/lib/bodies.ts`): en el `Body` donde quedó abandonado (`mars`/`moon`; crea uno nuevo si hace falta) agrega un `AbandonedVehicle` con
   `missionId` (= el `id` de la misión; será el segmento de la ruta `/<mundo>/<id>`), `name`, `place`, `lat`/`lon`, `tag` (frase corta del marcador), `status`, y hasta 4 `facts`. La tarjeta dibuja el vehículo con el `model`/`palette` de la misión (`VehicleView`).
   El marcador, la etiqueta, la tarjeta y las rutas aparecen solos (`generateStaticParams` sale de `BODIES`).
6. **Audios**: `npm run story-audio -- <misión>` (ver story.md). La guía de voz es genérica (no hace falta tocarla). La música (`ambient-tracks.ts`) es opcional: sin pista propia suena la de `timeline`.
   y a `vehicleOf`/`startIds` de `scripts/generate-guide.mjs`; después `npm run guide -- --docs` para el catálogo. La música (`ambient-tracks.ts`) es opcional: sin pista propia suena la de `timeline`.
7. Prueba: carga el mapa, avanza con `Espacio`, comprueba la orientación (¿el frente es el frente?), la niebla y el polvo; y en `/<mundo>` que el marcador y la tarjeta (vehículo girando sobre fondo liso) funcionan.

### Checkpoints (storytelling) — `src/lib/checkpoints.ts`

> **Hito 44:** los checkpoints ya no se escriben a mano: `lib/story.ts` los genera de los beats del `story.json` de cada misión. Lo de abajo describe el **formato del tipo `Checkpoint`** y el comportamiento en la escena; para añadir una historia, mira [story.md](story.md). Las imágenes y audios de ejemplo (`/images/checkpoints/…`, `/narration/…`) ya no existen.

Cada misión tiene una lista de **checkpoints** que es también **su ruta**, en orden: el **primero es la salida** (donde el vehículo
empieza su recorrido o misión) y el **último, el final** (donde se paró o apagó); entre medias, las paradas de la historia. Cada
uno abre una tarjeta informativa (abajo a la izquierda) y reproduce una narración al entrar en su radio. Todo el texto va **en inglés**; es ficticio pero verosímil,
inspirado en las misiones reales.

```ts
{
  id: "sur031",                     // clave estable (se usa en game.visited)
  name: "The radar loses its way",   // título de la tarjeta
  place: "Apr 20, 1967 · Oceanus Procellarum",   // línea pequeña bajo el título
  x: 70, z: 50,                     // coordenadas de MUNDO (terreno centrado en 0,0; ver abajo)
  via: [[30, -28], [66, 8]],        // opcional: puntos intermedios del tramo ANTERIOR → ESTE (para no cruzar pendientes fuertes)
  image: "/models/surveyor3/images/sur031.jpg",  // ilustración 4:5 de la historia
  credit: "AI-generated illustration",
  text: "…",                        // resumen escrito de la tarjeta (~35 palabras)
  narration: "…",                   // guion hablado (~45 palabras, números con letras); ver docs/narration.md
  audio: "/models/surveyor3/audio/sur031.mp3",  // mp3 pregrabado con `npm run story-audio -- surveyor3` (metadato)
  facts: [["Diameter", "~340 m"], ["Material", "…"], ["Terrain", "…"]],   // 3 pares etiqueta/valor
}
```

**Receta para añadir uno (o para una misión nueva):**

1. Elige el punto con `x, z` dentro del terreno y fuera de la franja aplanada (`fade`) con margen (aprox. `fade` + 10 unidades al borde) y
   **en terreno llano** (la salida y el final, sobre todo: el vehículo se queda ahí). Para ver el relieve y comprobar
   alturas/pendientes, usa un script que lea el STL (los ejes se transforman como en `buildTerrain`: `X = x − cx`, `Z = −(y − cy)`);
   las zonas bajas suelen ser cráteres y las altas, bordes.
2. **El primero es la salida**: el rover aparece ahí (ya no hay «punto de salida más plano»); su tarjeta se abre al cargar. No tiene
   frases de guía (las historias no las tienen).
3. **Traza la ruta con `via`**: entre dos checkpoints el camino es una curva suave por los `via`. Una línea recta suele cruzar
   cráteres (en Marte llegaba a 56° de pendiente); lo que se hizo fue un **A\* sobre el mapa de alturas** (rejilla de 2 u, coste =
   longitud·(1 + K·pendiente²·4), sin acercarse al borde), simplificado con Douglas-Peucker (ε 10–16 u) y comprobado con la propia
   curva (pendiente máxima por tramo ≤ ~20°, giro ≤ ~35°/10 u). Evita que un tramo llegue a un checkpoint por un lado y salga por el
   mismo (el rumbo se invierte al arrancar). Los `via` actuales son el resultado de ese proceso.
4. Separación razonable: 100–400 unidades entre checkpoints (Marte es grande: 762 × 559). Los marcadores de la línea de tiempo van
   equiespaciados, no hace falta que los tramos midan lo mismo.
5. La imagen es la ilustración del beat (`npm run story-images -- <misión>`, 4:5), en `public/models/<misión>/images/`; documéntala en [assets.md](assets.md).
6. Graba el audio: `npm run story-audio -- <misión>` (solo genera el clip nuevo) y commitea `public/models/<misión>/`.
7. Prueba: mantén `Espacio` hasta él, comprueba que se detiene en el centro, que la baliza se ve, que la tarjeta aparece/desaparece y
   que el marcador de la línea de tiempo y el cuadrado del minimapa se rellenan.

Comportamiento: se activa al entrar en `checkpointRadius` y se desactiva al superar `1.15×` el radio (histéresis, evita
parpadeos). Al alcanzarlo queda en `game.visited` hasta que se cambie de vehículo (no se persiste). Si dos radios se solapan,
gana el primero de la lista. El vehículo **se detiene en el centro de cada checkpoint** (Espacio) y, en un viaje automático, los
intermedios solo cuentan como visitados.

### Cosas que dependen de la escala del terreno

- `fade`: terrenos pequeños o muy empinados necesitan que la ruta se aleje más del borde (en la Luna el borde aplanado baja ~25
  unidades en 30 → pendiente de ~40°).
- `fogNear/fogFar`: deben ocultar el borde del plano de suelo; en un terreno de 255 unidades se usa 50–210.
- Velocidades: un terreno pequeño pide un rover más lento (`maxSpeed` al conducir, `boostSpeed` en viaje automático).
- Escala física: los `scale` actuales **no** son reales (los vehículos son 200–2000× más grandes que en el terreno). Ver
  «Por resolver: escala real» en [roadmap.md](roadmap.md).
