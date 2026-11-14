# Arquitectura

## Rutas y vistas

| Ruta | Vista | Qué carga |
| --- | --- | --- |
| `/` | redirige a `/moon` (`app/page.tsx`) | nada |
| `/moon`, `/mars` | **Globo** (`app/[body]/page.tsx` → `ExploreLoader` → `Explore`) | three/R3F + el globo; el vehículo ilustrado de la tarjeta (procedural, sin descargas) |
| `/moon/sev`, `/mars/opportunity` | **Viaje al pasado** (`app/[body]/[vehicle]/page.tsx` → `SceneLoader` → `Scene`) | el terreno STL **solo de ese vehículo** (el vehículo es procedural, no hay GLB), sus checkpoints, narración/guía |

- El segmento `[vehicle]` es el `id` de la misión (`missions.ts`). Ambas páginas usan `generateStaticParams` desde `lib/bodies.ts`; un valor no válido
  llama a `notFound()`. **Modo `cacheComponents`:** leer `params` fuera de `<Suspense>` da el error «instant shell»; por eso cada página es un
  componente sin `await` que envuelve en `<Suspense>` a otro que sí hace `await params`.
- `ExploreLoader` / `SceneLoader` (client, `next/dynamic` con `ssr:false`) separan los chunks: el globo no descarga la escena del rover ni al revés.
- **Cambiar de mundo no remonta**: el selector hace `history.pushState` a `/mars` o `/moon` (Next sincroniza `usePathname` con la History API) y el
  `Canvas` sigue vivo. La tarjeta del vehículo se guarda en el **hash** (`/mars#opportunity`, `replaceState`), así que «← Globe» desde la escena
  vuelve con la tarjeta abierta (se lee tras montar: Next actualiza la URL después del primer render). `Esc` cierra la tarjeta.
- Cambiar de vehículo dentro de la escena (selector «Vehicle» o `M`) **navega** a la ruta del otro vehículo.

## Vista del globo (`Explore`)

Es el **menú previo al juego** (hito 31): un globo (por defecto la Luna) a pantalla completa con **un vehículo 3D en miniatura de pie en cada sitio abandonado**, un **selector de mundo en texto** arriba a la izquierda («Mars  Moon», el actual con subrayado rosa), el botón de música arriba a la derecha y una **pista de una línea** abajo («mars · drag to spin · click a vehicle»). **No hay panel lateral ni lista de vehículos**: al hacer clic en un vehículo del globo se abre su tarjeta (`VehicleCard`, con «Travel to the past») **flotando a su lado**; **el globo no se mueve ni se puede girar con el puntero mientras hay una tarjeta abierta**, y esta se cierra con su **X**, con **Esc** o con un **clic fuera**. Todo entra y sale con animaciones de juego (`Pop`, `THEME.pop`, muelles de `lib/motion.ts`).

- **`lib/bodies.ts`**: cuerpos (`blurb`, `facts`) y sus `AbandonedVehicle` (`missionId`, `lat/lon`, `tag`, `status`, `facts`). `latLonDir()` da la
  dirección de un lat/lon sobre la esfera. Añadir un vehículo = añadir su misión y una entrada aquí (la ruta `/<mundo>/<id>` aparece sola).
- **`Globe.tsx`**: R3F propio (no comparte estado con `game`). **Cámara ortográfica** (sin perspectiva: la esfera es un círculo perfecto y la rejilla no se tuerce aunque el globo esté a un lado) con una elevación fija `TILT` (~29°, aspecto isométrico) y el eje siempre vertical en pantalla; `frame()` calcula el zoom y centra el globo (un clic nunca lo mueve ni le hace zoom); `Limb` dibuja el contorno. **Sin texturas:** rejilla alámbrica cada 15° (`ShaderMaterial` que **descarta** el
  lado lejano: solo se ve lo de delante), colores de `theme.globe`. El globo **solo gira en el eje vertical** (inclinación fija `TILT`) y **gira solo** (`IDLE` rad/s):
  el arrastre horizontal le da inercia que se relaja hasta ese giro automático; con un vehículo seleccionado se queda quieto hasta que el usuario lo toque.
  `faceAngle(lon)` da el giro que pone una longitud de cara a la cámara y se usa al cambiar de mundo o elegir un vehículo (`settle`).
  **`Orbiters`**: ~640 cuadrados negros (3 tamaños) en cascarones alrededor del globo, **dentro del grupo que gira** (giran con él y con el arrastre); el vertex
  shader los descarta si quedan detrás del plano del centro del globo (solo se ve lo de delante en ese instante, igual que las líneas de la rejilla). **`Marker`** = un vehículo 3D **de muy bajo detalle** (`lib/vehicles/mini.ts`: unas 5–10 primitivas con el `Kit`, 1 malla y 1 material; tinta + rosa + papel, `theme.globe.vehicle`, para contrastar con el azul sea cual sea el color de su misión) de ~24 px, **ligeramente enterrado** (hay una esfera de suelo invisible, `colorWrite={false}`, `renderOrder={-1}`, que solo escribe profundidad y oculta lo que queda bajo la superficie y lo de la cara lejana), sobre un anillo cuadrado que pulsa, con escala compensada para no crecer con el zoom. Crece al pasar el cursor/seleccionarlo y **el giro automático se pausa mientras hay un vehículo bajo el cursor** (`hot`) para poder hacer clic en un objetivo móvil. Su etiqueta DOM (nombre + tag) aparece **solo al pasar el cursor**. Al seleccionarlo, `placeFloating` (`GlobeLabels.tsx`) coloca cada frame, de forma imperativa, la tarjeta flotante junto a su posición en pantalla (a la derecha, o a la izquierda cerca del borde; en pantallas estrechas, anclada abajo al centro) y la oculta mientras el vehículo está en la cara lejana.
- **`VehicleCard.tsx`**: tarjeta con el vehículo **ilustrado en 3 tonos** (`VehicleView.tsx`: mini `<Canvas>` ortográfico, fondo gris liso `palette.bg`, giro lento), su historia, 4 datos y «Travel to the past». Sin GLB ni fotos.
- **`lib/ui.ts`**: `ui(theme)` devuelve los estilos DOM compartidos (`small`, `title`, `text`, `panel`, `pill`, `radius`) que usan `Explore` y `VehicleCard`. Regla de diseño: [design.md](design.md).
- **`GlobeLabels.tsx`**: etiquetas DOM (nombre del vehículo con ticks + tag de estado) que `Globe` mueve cada frame proyectando la posición 3D (`labelEls`).
  **No usar `Html` de drei:** en dev con StrictMode lanza «Attempted to synchronously unmount a root» y pierde etiquetas.
- `components/Loading.tsx` (pantalla de carga única: `LoadingContent` dentro de la escena, `Loading` para fallbacks de ruta y chunks) y `components/FadeImg.tsx` (foto con fundido); flujo de carga y salidas suaves en [design.md](design.md#carga-precarga--componentsloadingtsx).
- `components/Credits.tsx` (**oculto, no montado**; botón «Credits» + tarjeta flotante «Created by»), `components/Portrait.tsx` (retratos 2D planos en SVG; formas en `lib/portraits/<id>.ts`, generadas con `scripts/portrait`) y `lib/team.ts` (personas); ver [design.md](design.md#créditos--created-by-componentscreditstsx-portraittsx).
- `components/Icon.tsx` (set único de iconos de trazo 1,5 px) y `lib/transcript.ts` (frases + tiempos de la narración, ver [narration.md](narration.md)).
- **El tema** es un único objeto, `THEME` (`lib/themes.ts`): variables CSS en `<html>` + lectura directa desde canvas/WebGL (ver [design.md](design.md)). `lib/ui.ts` + `components/Reveal.tsx` dan estilos y entrada suave. **Los `@keyframes` nuevos en
  `globals.css` no los recogió el servidor de desarrollo** al probarlo; el fundido «Travel to the past» (`Scene.tsx`, `veil`) usa una transición inline.

## Vista general (escena del rover)

```
/<body>/<vehicle> → SceneLoader → Scene (prop: missionId)
                                                                   ├─ <Canvas> (R3F)
                                                                   │    └─ <Experience key={mission.id} mission>
                                                                   │         ├─ terreno (mesh) + plano de suelo infinito
                                                                   │         ├─ Sun · fog · hemisphereLight
                                                                   │         ├─ Tracks · Rover (sigue la ruta) · Dust
                                                                   │         ├─ Checkpoints (balizas + proximidad)
                                                                   │         ├─ Guide (director de la guía de voz, sin render)
                                                                   │         └─ CameraRig
                                                                   ├─ TopBar («← Globe» + selector Vehicle) ← DOM
                                                                   ├─ Minimap                        ← DOM + <canvas> 2D
                                                                   ├─ CheckpointCard (abajo-izq.)    ← DOM
                                                                   ├─ dock abajo-centro              ← DOM
                                                                   │    ├─ GuideCaption (subtítulo, flota encima)
                                                                   │    ├─ Hints (chips: Space / N / G)
                                                                   │    └─ Timeline (línea de tiempo de la ruta)
                                                                   └─ <Loader/> de drei
```

`SceneLoader` / `ExploreLoader` existen porque `ssr: false` solo se permite dentro de un Client Component. Three/R3F necesitan `window`.

**Teclado:** hay dos sitios. `bindKeyboard()` (`lib/game.ts`, lo monta `Rover`) lee **solo `Espacio`** hacia `input.go` (no hay
conducción libre); el `useEffect` de `Scene.tsx` atiende `M` (siguiente vehículo: navega a su ruta) y `N`
(narración), `G` (guía de voz). Este último ignora Ctrl/Meta/Alt y las repeticiones.

**Archivos de datos:** `lib/missions.ts` (vehículo + terreno + entorno), `lib/themes.ts` (el tema único), `lib/checkpoints.ts`
(storytelling **y ruta**: el orden de la lista es el orden del recorrido y `via` son los puntos intermedios de cada tramo). **Solo en mantenimiento:** `scripts/generate-narration.mjs` y `scripts/generate-guide.mjs` (graban los mp3 de `public/narration` y
`public/guide`; comparten `scripts/lib/tts.mjs`).

## Estado compartido: `src/lib/game.ts`

Objeto **mutable** `game` (no es estado de React) que lee/escribe todo el mundo cada frame:

| Campo | Significado |
| --- | --- |
| `terrain` | `TerrainData` de la misión activa (o `null` mientras carga / al cambiar). |
| `route`, `s` | `Route` de la misión (`lib/route.ts`) y distancia recorrida sobre ella. `route.stops[i]` = `s` del checkpoint `i`. |
| `travel` | Índice del checkpoint al que viaja el piloto automático (clic en la línea de tiempo) o `null`. Lo pone `travelTo(i)`. |
| `x, y, z, heading` | Posición del rover (sale de `route.at(s)`) y rumbo. Dirección de avance = `(sin h, 0, cos h)`. |
| `speed`, `boost`, `topSpeed` | Velocidad con signo a lo largo de la ruta (negativa = marcha atrás en un viaje hacia atrás), «viaje automático en curso» (más polvo y vibración de cámara) y velocidad tope (barras/FOV). |
| `quaternion`, `wheels[]` | Orientación del cuerpo y posición en mundo de cada rueda (para polvo y huellas). |
| `checkpoints[]`, `checkpointRadius` | Checkpoints de la misión activa (de `lib/checkpoints.ts`) y su radio de activación. |
| `visited`, `active` | `Set` de ids ya alcanzados y id del checkpoint en el que está el rover ahora (o `null`). |
| `mission` | Id de la misión activa (`opportunity`/`sev`) — lo lee la guía de voz. |

`input.go` (Espacio pulsado) se rellena desde `bindKeyboard()` (listeners en `window`). `Experience` construye la ruta
(`buildRoute`) y reinicia `game` en un `useEffect` al montarse (cada vez que cambia la misión): el rover sale en `s = 0`.

## Ruta: `src/lib/route.ts`

`buildRoute(checkpoints)` devuelve la trayectoria del vehículo: **una curva Catmull-Rom (centrípeta) por tramo**
(checkpoint → siguiente, pasando por los `via` del segundo), muestreada cada 0,5 unidades en una tabla. Los tramos son curvas
independientes: el vehículo siempre se detiene en cada checkpoint, así que el rumbo puede cambiar de golpe ahí (gira sobre sí
mismo al arrancar). `route.at(s)` da posición y rumbo (en un checkpoint, el rumbo del tramo **siguiente**); `route.stops` las `s`
de los checkpoints (el vehículo se para exactamente en ellos); `route.points` es una polilínea gruesa (~4 u) para el minimapa.
Los `via` se calcularon con un A\* sobre el mapa de alturas penalizando la pendiente (ver [themes-and-missions.md](themes-and-missions.md)).

## Terreno: `src/lib/terrain.ts`

`buildTerrain(stlGeometry, style)` devuelve `{ mesh, data }`:

1. Clona la geometría, quita normales y fusiona vértices (`mergeVertices`, para normales suaves).
2. `rotateX(-90°)` — los STL vienen en **Z-up** (Blender); three usa Y-up. Centra en X/Z.
3. **Aplana los bordes** con `smoothstep` en una franja de `style.fade` unidades hacia el punto más bajo.
4. Colores de vértice por altura original (`lo → hi`) mezclados hacia `style.edge` en el borde.
5. `buildHeightField`: rasteriza cada triángulo a una rejilla de `RES = 0.5` (guarda el máximo), rellena huecos con vecinos
   y expone `heightAt(x, z)` bilineal.

`findSpawn(data, radius)` busca el punto más plano dentro de un radio (radio 0 = centro exacto).

## Rover: `src/components/Rover.tsx`

**`buildVehicle(model, palette)`** (`lib/vehicles.ts`, una vez por misión): construye el vehículo con primitivas (sin GLB), con las ruedas como pivotes
independientes (`spinners`) y devuelve `wheels` (puntos de contacto), `halfLen`/`halfWid` (huella para inclinar el cuerpo), el tamaño y el centro de su caja (`center`, para encuadrarlo en la tarjeta). Avanza por **+z** con las ruedas en y=0.
El material es un `ShaderMaterial` de **3 tonos** (oscuro/medio/claro según el ángulo con una luz fija): ver [design.md](design.md#vehículos). `Rover` gira las ruedas cada frame
(`game.speed · dt / radio`).

**Cómo se construye** (`lib/vehicles/`): `kit.ts` tiene la clase `Kit` con las primitivas (`box`, `cyl`, `tube` entre dos puntos, `ball`, `ring`, `prism`/`slab`/`panel` = polígonos extruidos en cada plano, `lathe`, `loft` = piel sobre anillos con ventanas pintadas, `wheel` + `tyre`, `at()` para sub-conjuntos girados) y cada vehículo es una función en su archivo (`opportunity.ts` —con `mer()`, que reutiliza `spirit.ts`—, `sev.ts`, `perseverance.ts`, y los demo `ingenuity.ts`, `insight.ts`, `beagle2.ts`). `Kit.rotor()` añade piezas que giran sobre y (`rig.rotors`) y `finish({ hover })` hace flotar al vehículo (Ingenuity): `Rover.tsx` los anima.
Cada primitiva se **hornea** (posición + rotación) en una lista y `finish()` las funde: **una sola malla para el cuerpo y una por rueda**, con **un único material**. El tono de cada triángulo viaja en un atributo de vértice (`tone`: −1 = según la luz, 0/1/2 = fijo oscuro/medio/claro),
así que un modelo de ~16–28 mil triángulos y cientos de piezas cuesta 7 draw calls (antes, ~50 mallas de una caja cada una). El material es de doble cara y da la vuelta a la normal en las caras traseras (`gl_FrontFacing`), para que superficies abiertas (antenas, `loft`) se sombreen bien.

**`useFrame`** (cada frame, `dt` limitado a 0.05 s):

1. **Avance por la ruta** (sin dirección libre): con `Espacio` pulsado el vehículo acelera (26 u/s²) hasta `maxSpeed` hacia el
   **siguiente** checkpoint y frena con una rampa `v = √(2·28·distancia)` para **detenerse exactamente en él**; no sigue hasta que se
   suelta y se vuelve a pulsar `Espacio` (`st.locked`). La meta (`st.goal`) se fija al empezar el tramo (si se recalculara mientras
   frena saltaría al checkpoint siguiente). Si se suelta a medias, frena (40 u/s²) y se queda entre dos checkpoints. Con `game.travel`
   (clic en la línea de tiempo) conduce solo a `boostSpeed`, **hacia delante o hacia atrás**, y para en el destino. El rumbo
   sigue la tangente de la ruta suavizada con `damp`. `s` → `route.at(s)` → `game.x/z`.
2. **Seguir el terreno**: alturas en las 4 esquinas de la huella → altura media, cabeceo y alabeo (suavizados con `damp`).
3. **Animación del cuerpo**: inclinación por aceleración/giro y vibración que crece con la velocidad (Euler orden `YXZ`).
4. Posición de cada rueda en mundo → `game.wheels`; y recorrido para el minimapa (cada ≥5 unidades).

## Efectos

- **`Dust.tsx`** — pool de 1600 partículas en un `THREE.Points` con `ShaderMaterial` (tamaño y alfa por partícula, tamaño en
  pantalla compensado por la distancia). Cada rueda emite según la velocidad (más en un viaje automático). Los parámetros físicos
  (`drag`, `lift`, `life`, `size`, `alpha`, `color`) vienen de `mission.dust`.
- **`Tracks.tsx`** — `InstancedMesh` (máx. 2600 marcas) en anillo; suelta una marca por rueda cada 1.3 unidades recorridas,
  orientada con el cuaternión del cuerpo. Color/opacidad de `mission.tracks`.
- **`CameraRig`** (en `Scene.tsx`) — offset fijo (22, 16, 24) respecto al rover, suavizado, mirando ligeramente por delante
  según la velocidad; FOV 35 → 44 con la velocidad; vibración leve durante un viaje automático.
- **`Sun`** — luz direccional con sombras (mapa 2048, frustum ±45) que **sigue al rover** (offset en `mission.env.sun`).

## Checkpoints (storytelling)

Datos en `src/lib/checkpoints.ts` (tipo `Checkpoint` + una lista por misión); `missions.ts` los referencia y define
`checkpointRadius`. `Experience` los publica en `game` al (re)iniciar la misión y limpia `visited`/`active`.

- La lista de una misión es **salida → paradas → final** (5 o 6 checkpoints; el primero es donde arranca el vehículo, ya activo al cargar).
- **`Checkpoints.tsx`** (dentro del `<Canvas>`): por cada checkpoint dibuja una **baliza** — poste fino (alto = 1.6× radio), gema
  octaédrica que gira y flota, y un **anillo pegado al terreno** (cinta de 72 segmentos con `heightAt`) que marca el área.
  Todo con `MeshBasicMaterial` plano (sin iluminación ni brillos), color `theme.accent`; al alcanzarlo pasa a
  `theme.checkpoint.done` al 40 % de opacidad. En su `useFrame` hace la **detección**: entra al radio → `game.active = id` y
  `game.visited.add(id)`; sale al superar 1.15× el radio. No hace nada hasta que `game.terrain` está publicado. **Durante un viaje
  automático** (`game.travel`) los checkpoints intermedios solo se marcan como visitados (sin tarjeta ni narración); se activa el destino.
- **`CheckpointCard.tsx`** (DOM, abajo a la izquierda): un bucle `requestAnimationFrame` compara `game.active` / `game.visited`
  con lo último visto y solo llama a `setState` cuando cambian (sin renders por frame). Muestra etiqueta «Checkpoint n/N» +
  rombos de progreso (la etiqueta dice «Start 1/N», «Checkpoint n/N» o «End N/N» (N = 5 o 6)), foto 16:10 (`<img>` normal; precarga las imágenes de la misión), crédito, título, lugar, **botón
  «▶ Listen / ■ Stop»** (con el estado de la narración y los mensajes de error), `text` y 3 datos. Aparece con fundido +
  desplazamiento; usa los tokens del tema (tarjeta, tipografías, `tag`, `caps`). Es `pointer-events: none` salvo el botón.
  Se coloca `bottom-5 left-5` (en desarrollo `bottom-14`, por el indicador «N» de Next).
- **Línea de tiempo** (`Timeline.tsx`, DOM, abajo en el centro): barra con un marcador (rombo) por checkpoint **equiespaciados**; el
  relleno y el punto del vehículo avanzan proporcionalmente dentro de cada tramo. Muestra «Next: …» / «Traveling to …» / «End of the
  route» y «n/N visited». Con 6 o más paradas las etiquetas son más estrechas y los nombres largos ocupan 3 líneas: la fila de etiquetas reserva 44 px (26 con 5 paradas) para que el texto no toque el borde de la tarjeta. **Solo los marcadores son clicables** (`travelTo(i)`, desactivado en el checkpoint donde estás): no se puede
  parar en un punto cualquiera. Sondea `game` con rAF y solo hace `setState` al cambiar la lista, los visitados, el checkpoint actual o el texto.
- **Minimapa**: rombos numerados (relleno `pin`/`done`, contorno `ring`); el activo dibuja además un círculo discontinuo con el
  radio de activación.
- **Narración** ([narration.md](narration.md)): la detección de `Checkpoints.tsx` también llama a `playNarration(cp)` al
  entrar y `stopNarration` al salir (y al desmontar), y precarga los clips de la misión al montarla. `lib/narration.ts` es un
  store externo con un `<audio>` por checkpoint; la tarjeta (botón Listen/Stop) y los chips (`N Narration on/off`) se suscriben
  con `useSyncExternalStore`. El audio son mp3 **pregrabados** en `public/narration/` (campo `audio` del checkpoint): no hay
  llamadas a ElevenLabs en ejecución.

## Guía de voz

Detalle y catálogo en [guide.md](guide.md). Resumen técnico:

- **`lib/guide-lines.ts`** — datos (sin imports, los carga también Node): ~50 frases con `kind`, `vehicle?` y `cp?`; helpers
  `checkpointLines()` / `checkpointLineText()` para las frases por checkpoint (`next/remind-<id>`, sin la salida).
- **`lib/guide.ts`** — store externo (`enabled`, `caption`; `subscribeGuide/getGuide`) + **director** `updateGuide()`: cada ~0,2 s lee
  `game` (ruta `s`, velocidad, checkpoints, `visited/active`, `travel`) y decide si toca hablar: objetivo = primer checkpoint sin visitar;
  bandas de distancia 25/50/75 % medidas **a lo largo de la ruta**; secuencia «progreso + siguiente objetivo» al salir de un checkpoint
  (al salir de la salida solo el siguiente); `ready`/`done` dentro del checkpoint tras la narración; `idle`/`remind` si se para. Callada
  durante un viaje automático. Un solo `<audio>` a la vez, silencio de 6 s, enfriamientos por categoría, cola para secuencias.
- **`components/Guide.tsx`** (dentro del `<Canvas>`) monta/desmonta el director con cada expedición y lo llama en `useFrame`.
- **`components/Captions.tsx`** muestra el subtítulo de **la narración y de la guía** (flota encima del dock inferior); el chip `G Guide on/off`
  está en `Hints`.
- Convive con la narración: `Checkpoints.tsx` llama a `stopGuide()` al entrar en un checkpoint y el director no habla mientras
  `getNarration().status` sea `loading/playing`.

## Minimapa: `src/components/Minimap.tsx`

- **Bake** (al cargar terreno o cambiar de estilo): rejilla de alturas del tamaño del canvas, suavizada con desenfoque de caja.
  - Estilo `bands`: 5 franjas de color por **cuantiles** de la altura interior.
  - Estilo `contours`: **marching squares** sobre una rejilla gruesa; 16 niveles, uno de cada `every` es «principal». Se recorta
    por `ter.fade` para ocultar la franja aplanada del borde.
- **Cada frame**: dibuja el fondo cacheado + cruz (si el tema la tiene) + **ruta** (entera tenue y discontinua, la parte ya recorrida sólida; usa los tokens `trail`) + checkpoints + flecha + punto. Los textos (posición,
  rumbo, velocidad, barra) se actualizan por referencia a DOM cada 80 ms, sin pasar por React.
- Se vuelve a hornear si `game.terrain` cambia (cambio de misión) o si cambia el `theme`.
- Ejes: mapa con X a la derecha y Z hacia abajo; flecha de rumbo = `atan2(cos h, sin h)`.

## UI: `Hud.tsx`

`TopBar` (barra de tinta con «← Globe» y el selector Vehicle; hace `blur()` tras el clic para que Espacio no lo active) y `Hints` (chips: `Space Hold to drive`, `N Narration on/off`, `G Guide on/off` y `S Music on/off`; el globo tiene además `AmbientButton` arriba a la derecha, suscritos a los stores de `lib/narration.ts` y `lib/guide.ts`).

## Datos configurables

- **`missions.ts`** — vehículo + terreno + entorno + polvo + huellas + checkpoints y su radio. Ver [themes-and-missions.md](themes-and-missions.md).
- **`themes.ts`** — el tema «Ink & Paper»: color (campo azul, papel, tinta, acento rosa), tipografía, radios, trazo, grano, curva y duraciones del movimiento, minimapa, balizas, terreno (`ground`) y globo.
- **`checkpoints.ts`** — storytelling: posición, texto de la tarjeta, guion de la narración, ruta del audio, foto y datos.
- **`guide-lines.ts`** — frases de la guía de voz (y su vehículo/categoría).

## Fuentes (`app/layout.tsx`)

`Jost` (Flat), `Instrument Sans` (Papel/Marino), `Outfit` (Mind), más Geist (por defecto de Next). Se exponen como variables CSS
`--font-sans` y `--font-mono` (`THEME.font`/`THEME.mono`).
