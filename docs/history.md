# Historia del proyecto

Registro de lo que se construyó, en orden, con las decisiones y el porqué. Pensado para recuperar contexto rápido.

## Contexto y preferencias del usuario

- Quiere una escena 3D a pantalla completa, con el look de [bruno-simon.com](https://bruno-simon.com/) (cámara en 3/4 elevada,
  terreno estilizado, vehículo pequeño). Desde el hito 14, **sin conducción libre**: ruta fija, `Espacio` y línea de tiempo.
- **UI:** diseño **plano (flat)**, simple, sin brillos, degradados ni elementos "producidos"/"de IA". Le gustan las paletas
  atrevidas con bordes definidos (ShellWatch) y también la sobriedad topográfica (Abatable). Quiere poder **tener varios
  estilos/temas y cambiar entre ellos**.
- **Globo / tema:** no le gusta lo «realista» (probó texturas y las descartó): quiere un estilo **simple y fácil de ver**, claro, tipo carta estelar (rejilla azul, cuadrados negros, tags amarillos; referencia
  la sección del globo de portalsystems.space). Quiere que **toda la demo tenga tema claro**, que el globo **gire solo y solo en horizontal**, y que **solo se vea lo de delante** del globo. Prefiere
  **rutas por vista** (`/moon`, `/mars/opportunity`) para cargar únicamente lo necesario. Pidió commit explícitamente tras cada bloque aprobado.
- Habla español y prefiere respuestas concisas. La **interfaz y los audios del juego van en inglés**; la documentación, en español.
- Arranca él mismo el servidor de desarrollo (pidió no dejar ninguno corriendo) y decide cuándo se hace commit.
- Prefiere **generar contenido costoso una sola vez** (audio) y guardarlo como activo/metadato en lugar de depender de una API
  en ejecución.
- Los activos (STL/GLB) los aporta él desde `Downloads`. El segundo vehículo (SEV) no tiene relación histórica con Apollo 14:
  es solo una prueba de otro vehículo en otro terreno.

## Hitos

### 1. Proyecto base
`create-next-app` en `poc/` con TypeScript, Tailwind, ESLint, App Router, carpeta `src/`, alias `@/*`, npm. Se inicializó el
repo git (commit inicial de Create Next App).

### 2. Primer render (terreno + rover)
- Se añadieron `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`.
- Los modelos se copiaron a `public/models/` (`terrain.stl`, `opportunity.glb`).
- Escena a pantalla completa (`fixed inset-0`), terreno con color por altura, niebla del color del cielo, sombras, rover apoyado
  sobre el terreno con *raycast*.
- Sin controles en esta fase (el usuario lo pidió así).

### 3. Movimiento, efectos y primer minimapa
- **Conducción** (WASD/flechas, Shift turbo, Espacio freno) con aceleración, giro dependiente de la velocidad y límites del mapa.
- **Mapa de alturas**: en vez de hacer *raycast* cada frame (110k triángulos), el STL se rasteriza una vez a una rejilla de
  0,5 unidades; `heightAt(x, z)` es una interpolación bilineal (barato, se usa para física, huellas y minimapa).
- **Rover conforme al terreno**: 4 muestras en las esquinas → cabeceo y alabeo; inclinación al acelerar/girar y vibración.
- **Polvo** (partículas `Points` con shader propio) desde las ruedas, **huellas** (`InstancedMesh`) y **cámara** con
  seguimiento suave, adelantamiento según la velocidad y FOV/vibración con turbo.
- **Bordes del mapa**: el terreno se aplana hacia los bordes y se añade un plano de suelo infinito para que el límite se
  pierda en la niebla.
- Primer minimapa: relieve sombreado, curvas, radar cian… (**descartado** por el usuario: "muy producido/estético").

### 4. Orientación del rover
El detector automático de ejes del modelo falló (rover de lado). Se verificó visualmente y se fijó: el modelo avanza hacia
**+z** (`flip: false`); el brazo y el mástil quedan al frente. Ver `docs/assets.md`.

### 5. Rediseño plano — referencia ShellWatch
Paleta amarillo `#FFEB6D` / azul `#225DFF`, borde de 4px, esquinas de 15px, tipografía tipo Futura (se usa **Jost**).
Relieve en 5 franjas planas, rover como punto azul con flecha negra, sin radar ni efectos. Chips de controles en píldora.

### 6. Rediseño — referencia Abatable
Paleta papel `#F5F6F3`, tinta `#0A0A0A`, marino `#002642`, naranja `#FF5C29`, verde musgo; tipografía **Instrument Sans**
(alternativa libre a PP Mori). Mapa topográfico con **curvas de nivel** (marching squares), cruz sobre el rover y recorrido
discontinuo. Dos variantes: **Papel** y **Marino**.

### 7. Sistema de estilos (temas)
Los tres estilos conviven. Un selector arriba a la izquierda (y las teclas `1…9`) cambia entre ellos; se persiste en
`localStorage`. Todo el aspecto del minimapa, selectores y chips sale de tokens en `src/lib/themes.ts`.
Detalle: se ocultan las curvas del borde aplanado (se amontonaban en un anillo).

### 8. Segundo vehículo y terreno (misiones)
Se añadieron `moon-terrain.stl` y `sev.glb`. Se creó el concepto de **misión** (`src/lib/missions.ts`): cada una define terreno,
vehículo, entorno (cielo/niebla/luz), polvo y huellas. Selector **Vehículo** (y tecla `M`). Cambiar de vehículo reinicia el
rover y regenera el terreno y el minimapa. Ajustes: materiales metálicos limitados (el SEV salía negro), margen de borde por
misión (en la Luna el borde aplanado es una pendiente empinada), punto de salida en la zona más plana.

### 9. Cuarto estilo — referencia Mind Robotics
Tema `mind` (tecla `4`): crema `#E8E5E0`, tinta `#061A1E`, verde azulado `#299093`, coral `#EF6156`, esquinas muy redondeadas y
sin bordes, tipografía **Outfit** (alternativa libre a Centra No2). Se añadió el campo `caps` a los temas para poder usar texto
en capitalización normal en vez de mayúsculas.

### 10. Escala de los vehículos (revisión) y checkpoints de storytelling
- **Revisión de escala:** se comprobó que los vehículos **no** tienen escala real (200–2000× más grandes que lo que
  corresponde al terreno; los STL son maquetas de ≈ 118 m/u en la Luna y ≈ 470 m/u en Marte). El usuario decidió **dejarlo así
  por ahora** y documentarlo como pendiente: ver «Por resolver: escala real» en [roadmap.md](roadmap.md).
- **Storytelling:** cada expedición (Opportunity · Mars, SEV · Moon) tiene **3 checkpoints** sobre el terreno. Al entrar en su
  radio aparece una **tarjeta abajo a la izquierda** con foto, texto y 3 datos (el usuario la probó arriba a la derecha y la
  devolvió a abajo a la izquierda); el minimapa muestra rombos numerados que se rellenan al alcanzarlos y hay balizas 3D
  (poste + gema + anillo sobre el terreno). El texto es inventado pero verosímil
  (Eagle → Endurance → Victoria en Marte; Antares → Cone → muestreo en la Luna) y las fotos son de NASA (dominio público).
- Decisiones de diseño: datos en `lib/checkpoints.ts` (no en componentes); tarjeta y rombos con tokens de tema (`checkpoint`
  en `themes.ts`), plana y sin efectos; el estado va en `game` (`checkpoints`, `visited`, `active`) y la tarjeta lo consulta
  con un bucle rAF para no re-renderizar por frame. Los puntos se eligieron mirando el mapa de alturas del STL (cráteres y
  zonas altas) y evitando el punto de salida.

### 11. Narración de checkpoints con ElevenLabs
El usuario quiso experimentar con ElevenLabs: al llegar a un checkpoint se narra su texto. Primera versión: un Route Handler
(`/api/narrate`) que generaba el audio **en tiempo real** con caché en disco (clave solo en el servidor, el cliente enviaba
ids). Tras probarla con la clave real, el usuario prefirió **generar el audio antes, una sola vez**, y guardar la grabación
como metadato → ver hito 12. Narración automática al entrar, corte al salir, tecla `N` y botón en la tarjeta se mantienen.

### 12. Audio pregrabado, voz narrativa e interfaz 100 % en inglés
- **Pregrabado:** se eliminó el Route Handler y la caché. `scripts/generate-narration.mjs` (`npm run narration`) graba cada
  checkpoint con ElevenLabs **una vez** (solo lo nuevo o cambiado, por hash) en `public/narration/<id>.mp3` +
  `manifest.json`; cada `Checkpoint` guarda su `audio` (ruta) y su `narration` (guion hablado) como metadatos. La app solo
  reproduce los mp3 estáticos: cero llamadas a la API en ejecución y la clave solo se usa en el script.
- **Voz más narrativa:** voz **Bill** (madura, pausada: ritmo de documental) con el modelo **`eleven_v4`**. Se compararon
  Brian, Bill, Daniel y George; la clave está restringida (sin `voices_read`) y no se pueden listar voces por API.
- **Inglés:** toda la interfaz (selectores, chips, minimapa, tarjeta, nombres de vehículos y estilos) y los textos/audios de
  los checkpoints pasaron a inglés. La documentación del repo sigue en español.

### 13. Guía de voz «mission control»
El usuario propuso dar retroalimentación auditiva corta mientras el jugador está en la experiencia («debes ir al primer punto»,
«aún te queda mucho», «casi lo terminas», «a la derecha/izquierda»…), sin sobrecargar, y pidió unas 100 frases genéricas,
documentadas y asignadas a cada vehículo. Se valoró que es buena idea **si es escasa y contextual** y se implementó:
- **102 frases** (70 genéricas, 16 solo Marte, 16 solo Luna) en `src/lib/guide-lines.ts`, grabadas una vez con `npm run guide`
  (voz Daniel, `eleven_flash_v2_5`, 723 créditos) en `public/guide/`; catálogo autogenerado en [guide.md](guide.md).
- **Motor** (`lib/guide.ts`): objetivo = primer checkpoint sin visitar; dirección **relativa al vehículo** (A/D) con histéresis de
  2,5 s; bandas de distancia 25/50/75 %; secuencia «progreso + siguiente objetivo» al salir de un checkpoint; avisos al estar parado,
  cerca del borde, en pendiente o con turbo prolongado. **Anti-saturación:** una voz a la vez, nunca sobre la narración ni dentro de un
  checkpoint, 6 s de silencio, enfriamientos por categoría, variantes sin repetir, nada antes del primer gesto.
- **Subtítulo** de cada frase y tecla `G` (chip «Guide on/off»). Voz distinta de la del narrador (Bill) para separar historia e
  instrucciones.
- Refactor: `scripts/lib/tts.mjs` compartido por `generate-narration.mjs` y `generate-guide.mjs` (mismo hash: la narración no se regrabó).
- Probado en el navegador con el audio real: bienvenida, primer objetivo, cambio de canal a la narración al entrar, secuencia de salida,
  borde, dirección y parado. Hallazgo corregido: girar en el sitio no cuenta como «parado».

### 14. Cambio de enfoque: ruta definida, solo `Espacio` y línea de tiempo
El usuario cambió el planteamiento de la PoC: **ya no se conduce libremente** (se quitó WASD/flechas/Shift) y cada vehículo sigue una
**ruta definida** que pasa por sus checkpoints. Lo implementado:
- **Salida y final como checkpoints** (con foto, datos y narración como los demás; ahora 5 por expedición): Marte `landing`
  (Sol 0, aterrizaje con airbags) → Eagle → Endurance → Victoria → `perseverance` (Sol 5111, última señal en la tormenta de polvo de
  2018: **real**); Luna `landing-zone` (Fra Mauro) → Antares → Cone → Sampling → `last-light` (el SEV se apaga al caer el sol:
  **inventado**, el SEV es solo una prueba). 4 clips de narración nuevos (Bill, `eleven_v4`, 430 créditos) y 4 fotos NASA nuevas.
- **Ruta** (`lib/route.ts`): una curva suave por tramo a través de los `via` de cada checkpoint, calculados con un A\* sobre el mapa
  de alturas para esquivar pendientes (la recta en Marte llegaba a 56°; ahora ≤ ~20°). El vehículo se detiene en el centro de
  cada checkpoint.
- **`Espacio` mantenido** = avanzar hasta el siguiente checkpoint (hay que soltar y volver a pulsar para seguir). Se eligió
  «mantener» y no «alternar» por ser lo más parecido a conducir; se puede cambiar en `Rover.tsx`.
- **Línea de tiempo** horizontal (`Timeline.tsx`): marcadores equiespaciados por checkpoint, progreso proporcional dentro del
  tramo, **solo se puede viajar a los checkpoints** (clic → piloto automático hacia delante o hacia atrás; los intermedios solo
  cuentan como visitados, sin tarjeta ni narración).
- **Limpieza**: fuera `findSpawn`, `margin`, `spawnRadius`, `trail` y `slope` del estado; el minimapa dibuja la ruta. **Guía de voz**
  recortada de 102 a 49 frases: se eliminaron bienvenida, dirección, rumbo, borde, pendiente, turbo, ánimo, fuera de ruta y las de
  «quedan N»; se mantuvieron distancia, siguiente objetivo, progreso, final, parado y `ready`, y se añadieron 3 que mencionan
  `Space`. Se borraron los 60 mp3 sobrantes y sus entradas del manifiesto.

### 15. Vista de entrada: globos de Marte y la Luna («abandonados») y «viajar al pasado»
Tras revisar Eyes on Curiosity y science.nasa.gov/eyes (ver ideas en [roadmap.md](roadmap.md)), el usuario y su compañero de hackathon cambiaron el
enfoque: ver **cómo se movieron los vehículos hasta quedar abandonados**. Al cargar ahora hay una vista previa (`Explore`, ver [architecture.md](architecture.md)):
globos (Marte, Luna) que se pueden girar, con un marcador donde quedó cada vehículo (Opportunity: Perseverance Valley ≈ 2,3°S 5,5°O;
SEV: Fra Mauro, ficticio) → la lista de vehículos del mundo → tarjeta con el modelo 3D **empolvado** (no manipulable) y el botón **«Travel to the past»**,
que abre la escena de siempre en el checkpoint de salida (`← Globe` vuelve). Decisiones: el polvo es un shader sobre el GLB real, sin assets nuevos.

**Giro de estilo (mismo hito):** el primer globo usaba texturas realistas; al usuario no le gustó lo «realista». Pasó a un **globo alámbrico claro** (referencia: carta estelar con rejilla azul, estrellas como cuadrados
negros, etiquetas con ticks y tag amarillo), sin assets, y se pidió que **toda la demo tenga tema claro**: nuevo tema `light` («Light · Blue», por defecto, tecla `1`) y tokens `globe` en los 5 temas. La escena 3D del rover sigue con el cielo de cada misión.

### 16. Una sola vista de globo + rutas por vehículo
Se simplificaron las dos vistas iniciales en una: **globo único** (Luna por defecto) con selector Luna/Marte a la izquierda y, en la misma vista, la lista y la tarjeta del
vehículo. El globo **solo gira en el eje vertical** (sin inclinar) y **se quitaron las líneas traseras** (solo se ve lo que da la cara). **Rutas**: `/moon`, `/mars` (globo; el selector
cambia con `pushState`, sin remontar), `/moon/sev` y `/mars/opportunity` (la escena); `/` redirige a `/moon`. Cada ruta carga solo sus recursos (el globo no descarga la escena del rover; el viaje carga únicamente el terreno y el GLB
de ese vehículo). Se eliminó `App.tsx` y `poc-mission` (el vehículo lo decide la URL). Detalles en [architecture.md](architecture.md).

**Ajuste posterior:** el globo vuelve a **girar solo** y conserva la inercia del arrastre; los cuadrados negros ahora **orbitan con la esfera** (referencia: portalsystems.space, sección del globo) y los que quedan
detrás no se dibujan.

### 17. Globo ortográfico, foto en la tarjeta y regla de diseño flat
- **Globo «chueco»**: con perspectiva (fov 35) y el globo desplazado a la derecha de la cámara, la esfera se deformaba y la rejilla se inclinaba. Ahora la cámara es **ortográfica**
  (círculo perfecto, rejilla simétrica), con elevación fija `TILT` ≈ 29° (aspecto isométrico), eje vertical en pantalla, contorno del limbo y el globo **centrado en el área libre** a la derecha del panel (`frame()`).
- **Tarjeta del vehículo**: el modelo 3D «empolvado» se sustituyó por una **foto de NASA** (`public/images/vehicles`: Opportunity = autorretrato polvoriento PIA17759; SEV = Lunar Electric Rover, su antecesor). Se eliminó el mini `Canvas`, el shader de polvo y las motas.
- **Diseño**: el usuario fijó **flat design** como regla de toda la demo → [design.md](design.md). La paleta/tipografía definitivas llegarán después (los 5 temas son provisionales). Refactor menor: estilos DOM compartidos en `lib/ui.ts`.
- La línea de tiempo (`Timeline.tsx`) **no se tocó**: queda pendiente de revisar con el diseño definitivo.

### 18. Vehículos nuevos en el estilo de las ilustraciones de referencia
El usuario quiso vehículos **nuevos** (no una capa de estilo sobre los GLB) con la estética de las ilustraciones de [primer.io/payment-pioneers](https://primer.io/payment-pioneers): 3 tonos de un color,
fondo gris liso, sin contornos ni degradados. Se eligió **3D en código** (frente a ilustración 2D) y paleta por mundo: **Marte coral** (`#E65A4F/#F9A66C/#FFE4E0`), **Luna azul** (`#1650B0/#7FB0E3/#F2F7FC`), fondo `#D9D9D9`.
- `lib/vehicles.ts`: Opportunity y SEV construidos con primitivas (cajas redondeadas, cilindros), `ShaderMaterial` de 3 bandas por el ángulo con una luz fija. Reemplazan a los GLB en la escena y en la tarjeta del globo
  (`VehicleView`, giro lento sobre fondo liso). Las ruedas son pivotes independientes y **giran** con la velocidad.
- `Rover.tsx` perdió `prepareRover` (clonado, `metalness`, detección de ruedas por flood-fill): el modelo declara sus ruedas. `RoverConfig` cambió `url/scale/flip` por `model/palette`.
- Las fotos de NASA de la tarjeta (hito 17) quedaron **sin uso** (y los GLB también); se conservan. Terreno, cielo y UI siguen con el aspecto anterior: son los siguientes pasos del rediseño.

### 19. Rediseño completo: tema «Primer» único y movimiento suave
El usuario fijó la referencia **primer.io/payment-pioneers** para **toda** la demo («que todo sea suave, nada brusco») y pidió un único tema por defecto. Se midió la página (computed styles): lienzo `#F9FAF7`, tinta `#0D0D0D`,
superficie `#EDEEEB`, gris `#616161`, línea `#DADADA`, naranja `#FF540A`; grotesca propietaria (Onsite Standard, peso 450, tracking −0,04 em en títulos) + JetBrains Mono en mayúsculas para botones y etiquetas; radios 2–4 px; curvas `cubic-bezier(0.22,1,0.36,1)`.
- **Un solo tema**: `themes.ts` exporta `THEME`; se eliminaron los 5 temas, el selector «Style», las teclas `1…9`, `use-theme.ts` y `prefs.ts`. Los tokens se publican como variables CSS (`cssVars`) y los usa tanto `globals.css` (clases `.ui-btn`, `.ui-link`, `.ui-row`, `.ui-nav`) como el canvas/WebGL.
- **Tipografía**: Hanken Grotesk (sustituto libre de la grotesca de la referencia) + JetBrains Mono. Sin kickers sobre los títulos; metadatos en mono bajo el título.
- **UI**: paneles planos `#EDEEEB`, botón primario de tinta con flecha que se desliza, barra superior de tinta (como la navegación de la referencia), línea de tiempo con cuadrados y punto naranja, minimapa de curvas de nivel con ruta en tinta y el vehículo en naranja.
- **Globo**: rejilla gris fina sobre el lienzo, contorno y estrellas en tinta, marcador naranja, etiqueta oscura en mono.
- **Escena 3D**: terreno con `MeshToonMaterial` de 3 tonos (mismo lenguaje que los vehículos) en arena (Marte) y gris azulado (Luna), cielo y niebla del color del lienzo, `Canvas flat` (sin tone mapping, colores exactos); balizas de tinta con una gema naranja.
- **Movimiento**: todo con la misma curva y duraciones 250/600/1000 ms; entrada escalonada (`Reveal`), fundido al color del lienzo al viajar (Explore → escena y al revés), balizas y tarjetas que cambian de color/opacidad por interpolación, `prefers-reduced-motion` respetado.
- **Superficies del navegador** tematizadas: selección naranja, cursor, scrollbars finas, anillo de foco de tinta, `Loader` de drei.
- Nota de proceso: el skill de diseño pide un revisor de acabado en un subagente; no se lanzó (se prefirió no gastar subagentes sin que el usuario los pidiera): la revisión fue visual en el navegador.

### 20. Pulido del tema: hover de Primer, iconos propios, vehículo quieto, terreno con contraste y transcripción
- **Hover** medido en la referencia con el puntero encima: el botón primario se rellena de lima (`#D7F94F`) con un barrido y el texto pasa a tinta; los enlaces pasan a `#FF916B`; las flechas se deslizan. Replicado en `.ui-btn`, `.ui-row`, `.ui-nav`, `.ui-marker`, `.ui-link` (ver [design.md](design.md)).
- **Iconos**: `Icon.tsx` con trazo de 1,5 px (flecha de la referencia, chevron, play, stop, pause, close); desaparecen los glifos →, ←, ▶, ■, ▾.
- **Vehículo en la tarjeta del globo**: quieto, vista isométrica, render a demanda (antes giraba).
- **Terreno**: más oscuro y con 3 tonos más separados (arena en Marte, gris azulado en la Luna); cielo algo más claro para separar el horizonte.
- **Transcripción de la narración**: `Captions` muestra frase a frase lo que dice el narrador (y la guía). **Solo se pide el audio a ElevenLabs; los tiempos se calculan en el cliente** (duración real del clip repartida por caracteres y pausas). El usuario comprobó que queda perfectamente sincronizado y lo fijó como método para cualquier audio nuevo (receta en [narration.md](narration.md)). ElevenLabs ofrece timestamps con `/with-timestamps`, pero se descartó: obliga a regrabar y gasta créditos.

### 21. Marcador sin punto, terreno con curvas de nivel, bug de «volver» y auditoría del hover
- **Línea de tiempo y minimapa**: el vehículo parado en un checkpoint **rellena su cuadrado de naranja** (sin punto, sin aro discontinuo, sin flecha); el punto y la flecha de rumbo solo aparecen al desplazarse, con fundido. Ver [design.md](design.md).
- **Terreno**: sigue siendo el mismo mapa de alturas de NASA (no se genera otro «poly»); ahora el shader dibuja **curvas de nivel** (`lines`, `step` por misión) para darle bordes y legibilidad.
- **Bug de volver al globo**: página en blanco al volver con «← Globe» o Atrás tras «Travel to the past». Causa: Next conserva `Explore` montado con su estado (`leaving = true`, el velo del viaje) y re-ejecuta sus efectos al volver; se reinicia ahora en el efecto de montaje (ver [gotchas.md](gotchas.md)).
- **Hover**: el botón «Globe» se veía negro (texto de tinta sobre la barra de tinta) porque un `background` en línea anulaba el barrido lima. Auditados todos los botones: primarios, ghost, pestañas, enlaces, desplegable, barra superior, marcadores de la línea de tiempo.

### 22. Rendimiento: perfil `light` y liberación de vistas ocultas
La laptop del usuario iba «casi al full». Se midió (GPU por proceso, memoria compartida de GPU, canvases, bucles `requestAnimationFrame`, y experimentos A/B con interruptores temporales): el JS es despreciable; el coste es la **GPU integrada** (escena 26 %, globo 17–21 %) por canvas de 4,8 Mpx (`dpr` 2 + MSAA) y,
sobre todo, porque Next **conserva montadas las rutas visitadas** (cada escena retenía ~350–400 MB de memoria de GPU). Sombras y curvas de nivel no pesan. Cambios (todo tras un interruptor, `lib/perf.ts`): `dpr` ≤ 1,5, sin antialiasing en la escena, escena a 30 fps con el vehículo parado (`FrameGovernor`; ver el truco de `useFrame` en
[gotchas.md](gotchas.md)), y `Scene`/`Explore` liberan su canvas cuando no son la ruta actual. Resultado: escena parada 26 → ~10 % GPU, globo → ~13 %, canvases tras dos visitas 8 → 3. Detalle y método en [performance.md](performance.md). Volver atrás: `PERF_PROFILE = "full"`.

### 23. Precarga y transiciones sin cortes
El usuario pidió componentes de precarga, sobre todo una pantalla de carga al cargar el modelo para que la escena no aparezca de golpe. Hallazgos: el velo de la escena se desvanecía **aunque el terreno aún no hubiera cargado** (luego aparecía de golpe), el `Loader` de drei era distinto al resto, los `Suspense` de las rutas
usaban colores antiguos (negro `#07080d`) y el globo y la tarjeta del vehículo aparecían de golpe. Ahora: pantalla de carga única (`Loading`) con progreso real del STL y etapa («Downloading / Building terrain») que se mantiene hasta que el terreno está construido y compilado (`Preload all`), fundidos de salida antes de navegar (escena y globo), fundido de entrada del canvas del globo,
del vehículo y de las fotos (`FadeImg`). Ver [design.md](design.md#carga-precarga--componentsloadingtsx).

### 24. Música de fondo
El usuario pidió sonidos de fondo livianos y acogedores para /moon, /mars y la línea de tiempo, generados con ElevenLabs y reproducidos en bucle, bajando el volumen mientras se narra. Se grabaron 3 pistas instrumentales con ElevenLabs Music (`npm run ambient`, prompts en `lib/ambient-tracks.ts`) y se reproducen con `lib/ambient.ts`: crossfade entre lugares, bucle con solapamiento de 4 s y *ducking* al 20 % mientras suena la narración o la guía. Tecla `S` (con su chip en la escena) y botón «Music on/off» en el globo. Se intenta sonar al cargar; si el navegador lo bloquea, arranca con el primer gesto. Ver [ambient.md](ambient.md).

### 25. Tarjeta «Created by»
El usuario pidió un botón pequeño que muestre a los autores en una tarjeta flotante («Created by»), una tarjeta por persona con retrato, nombre, rol y enlace de LinkedIn, siguiendo las tarjetas de entrevista de Primer. Primero solo la suya (Jackson Merma, «AI & Software Engineer»), con un retrato 2D plano dibujado en SVG a partir de su foto (azules en pocos tonos, como la referencia). Datos en `lib/team.ts`, retratos en `Portrait.tsx`, tarjeta en `Credits.tsx` (botón en el globo). **Oculta tras verla** (al usuario no le gustó): el código se conserva sin montar. Si vuelve, falta la tarjeta del compañero. Ver [design.md](design.md#créditos--created-by-componentscreditstsx-portraittsx).

### 26. Tercer vehículo: Perseverance (prueba) sobre el terreno de Gale
El usuario aportó `Mars 2020 Perseverance Rover.glb` y `Curiosity Landing Site.stl` y pidió un vehículo de prueba más, con todos sus recursos (modelo poly, audios, checkpoints) y sin música nueva. Investigación: el STL es de **Marte** (cráter Gale, aterrizaje de Curiosity en 2012; mismo formato y tamaño que el terreno de Opportunity), pero Perseverance está en el cráter Jezero y sigue activo. Decisión del usuario (entre dos opciones): **historia real de Perseverance + final ficticio**, dibujada sobre el terreno de Gale como escenario de prueba (documentado en `bodies.ts`, `missions.ts` y los textos). Hecho: modelo procedural `perseverance` (verde) en `vehicles.ts`; 6 checkpoints (aterrizaje, Ingenuity, Montdenier, delta, Three Forks y el final ficticio «Last Sol») con fotos NASA y datos verificados en images.nasa.gov; ruta trazada con A* sobre el mapa de alturas de Gale (pendiente máxima 13°); 6 narraciones y 13 frases de guía (`next/remind`, `done`, `idle`) grabadas con ElevenLabs; marcador en el globo de Marte (Jezero, 18,4° N 77,5° E). Sin música propia: usa la cama `timeline`. Detalles de la ruta: salida (274, 43), Ingenuity (259, −45), Montdenier (177, −97), delta (64, −217), Three Forks (−84, −206) y final (−268, −136), todos en terreno llano (pendiente media < 4°) elegidos con un mapa de alturas y pendientes del STL; tramos de 89–211 u. Al revisar la línea de tiempo con 6 paradas, los nombres largos ocupaban 3 líneas y casi tocaban el borde de la tarjeta: la fila de etiquetas reserva ahora espacio para 3 líneas (`Timeline.tsx`). Estilo del vehículo: verde `#0F7A5C / #5FC29A / #E6F7EE`. Ver [assets.md](assets.md) y [themes-and-missions.md](themes-and-missions.md).

### 27. Vehículos con más detalle (medidos sobre los GLB)
El usuario pidió volver a analizar los GLB y generar geometrías más completas **sin cambiar el estilo** («el estilo está genial, quiero más detalle»). Los GLB venían comprimidos con Draco; se decodificaron en Node y se midieron con vistas ortográficas con rejilla (un render propio, fuera del repo): el SEV es en realidad el **MMSEV** (cabina orgánica, 12 ruedas en 6 pares), el Perseverance viene con el mástil plegado y el de Opportunity es un modelo muy simple.
- `lib/vehicles.ts` se partió: `lib/vehicles/kit.ts` (primitivas nuevas: tubos entre dos puntos, polígonos extruidos, revolución, `loft` con ventanas pintadas, ruedas con tacos y radios) y un archivo por vehículo. Los tres se rehicieron desde cero con las medidas de su GLB: ver la tabla de [assets.md](assets.md#vehículos).
- **Coste:** todo se funde en 1 malla + 1 por rueda con un único material (el tono va en un atributo de vértice): 7 draw calls por vehículo frente a las ~50 mallas de antes, con 16–28 mil triángulos.
- Cambian las huellas (Opportunity 10,9 de ancho; SEV 13,2 de largo por el morro; Perseverance 12,3 × 14,6) y las ruedas del SEV pasan a ser pares gemelos (una marca de huella por par). `VehicleView` encuadra con el centro real del vehículo (`rig.center`).
- Comprobado en el navegador: las tres tarjetas del globo y las tres escenas en marcha (sombras, ruedas, sin errores de consola).

### 28. Cuatro vehículos nuevos con historias ficticias (Spirit, Ingenuity, InSight, Beagle 2)
El usuario pasó una lista de vehículos (`Downloads/vehiculos.jpeg`) y pidió **modelos 3D y una línea de tiempo ficticia de ≥ 5 checkpoints** para cada uno, **sin generar ningún audio** (se pueden repetir los existentes), sobre los terrenos de Marte que ya hay. El objetivo es ver los 3D, no la historia.
- **Modelos** (`lib/vehicles/`): `spirit.ts` (el mismo MER de Opportunity, `mer()` con la rueda delantera derecha bloqueada y fija en la carrocería), `ingenuity.ts` (helicóptero: patas largas, fuselaje dorado, panel solar y **dos rotores contrarrotantes**), `insight.ts` (cubierta hexagonal, dos abanicos solares de 12 lados, brazo plegado con pinza, domo del sismómetro) y `beagle2.ts` (base oscura con el marco amarillo de calibración, tapa dorada con el brazo y cuatro paneles redondos «en pétalos»; no existe modelo 3D: se dibujó con las fotos de réplicas). Medidas sobre los GLB de NASA (`public/models/<id>/`, ver `SOURCES.md`).
- **Kit:** `Kit.rotor(pos, rate, draw)` crea una pieza que gira sobre y (`rig.rotors`), `finish({ halfLen, halfWid, hover })` permite vehículos sin ruedas y `rig.hover` los hace flotar; `Rover.tsx` los anima (rotores siempre girando, cabeceo mayor con la aceleración, balanceo suave en vez de vibración). Ingenuity vuela a 6,4 u sobre el suelo; sin ruedas no deja huellas ni polvo.
- **Ficción para que se muevan:** los landers reales no se desplazan. Esta demo pone **una rueda bajo cada pata de InSight** (3) y **un chasis de 4 ruedas bajo Beagle 2**; el texto y el marcador del globo lo dicen («demo», «Fictional»).
- **Historias** (`lib/checkpoints-demo.ts`): 5 checkpoints por vehículo, todos `demo: true`, con nombres, fechas y cifras inventados. Rutas calculadas con A* sobre el mapa de pendientes de cada STL (pendiente media < 2,5° salvo los vuelos de Ingenuity, que cruzan terreno abrupto): Spirit y Beagle 2 en `terrain.stl`; Ingenuity e InSight en `gale-terrain.stl`. Marcadores del globo en Gusev, Jezero (desplazado), Elysium e Isidis.
- **Audio, regla fijada por el usuario: no se graba nada.** Cada checkpoint demo reutiliza el mp3 de **otro** checkpoint (`audio`), así que **el subtítulo no coincide con lo que dice la voz**. Los checkpoints demo **no están en `ALL_CHECKPOINTS`**, para que `npm run narration` / `npm run guide` nunca los toquen (sobrescribirían los clips compartidos), y la guía de voz calla sobre ellos (`cpLine` devuelve `null` si `demo`; los `done`/`idle` de vehículo no existen para los nuevos).
- **Fotos** (`public/images/checkpoints/mars-<vehículo>-*.jpg`, 960 × 600): recortes de fotos reales de NASA (pruebas en la Tierra, selfies, ilustración) o de **réplicas de Beagle 2** de Wikimedia Commons (**CC BY / CC BY-SA**: el crédito con autor y licencia sale bajo la foto). El `credit` de cada una dice qué muestra de verdad.
- Comprobado en el navegador: las 4 tarjetas del globo y las 4 escenas de punta a punta (InSight, Spirit y Beagle 2 completan la ruta; Ingenuity vuela y se detiene en cada punto), sin errores de consola.

### 29. Giro de enfoque: de plataforma informativa a juego (solo Opportunity)
Tras conversarlo con su colega, el usuario cambió la dinámica: **ya no es una plataforma informativa** sino un **juego** con dos modos, centrado **solo en Opportunity** «por el momento», que cubre **toda la misión**: desde lo que pasó antes de llegar a Marte (planificación, construcción…) hasta el final de su recorrido.
- **Modo Historia** (informativo y atractivo): **Parte 1**, historieta 2D (imágenes tipo anime/storytelling + voz) hasta el aterrizaje; **Parte 2**, el 3D con narración que ya existe, donde los checkpoints pasan a ser puntos de la historia **con información real** (se cambiará más adelante).
- **Modo Decisiones** (aprender del error): usa los mismos puntos como columna vertebral; algunos son **elecciones** entre varias opciones. Las que **no** siguen la historia real muestran un paso alterno y **siempre convergen en un fallo de la misión**; también en dos partes (tarjetas/imágenes + narración, y en el 3D una animación que muestre el fallo).
- **Qué se hizo en este hito:** solo **definir** el enfoque (el usuario pidió expresamente no implementarlo): nuevo [game-design.md](game-design.md) (modos, partes, modelo de nodos, reglas de decisiones y fallos, impacto en el código, fases, preguntas abiertas), y actualizados `CLAUDE.md`, `PRODUCT.md`, `docs/README.md` y el roadmap. Lo que Claude añadió al pulir la idea está marcado **(propuesto)** en ese documento.
- **En pausa** (código conservado, fuera del flujo del juego): globo y rutas `/[body]`, Perseverance, SEV, los 4 vehículos demo y los créditos.

### 30. Rediseño de todo el estilo: de «Primer» a «Ink & Paper» (referencia: Ponpon Mania)
Para la Parte 1 (historieta) el usuario encontró en [ponpon-mania.com/chapter/2](https://ponpon-mania.com/chapter/2) el estilo de cómic más cercano y original que quería, y pidió **refactorizar todo el estilo de la demo** con esa página como inspiración (esto responde la pregunta abierta 1 de [game-design.md](game-design.md) sobre el estilo de las ilustraciones: ahora es este lenguaje).
- **Qué se midió** (recorriendo la página con el navegador): campo azul lila plano con grano y manchas rosa, páginas de papel `#FEECE3` con recuadros de trazo de tinta grueso, tinta `#171717`, píldora de progreso negra, Libre Franklin 700 en minúscula, hover con contorno en píldora. Detalle en [design.md](design.md).
- **Qué se hizo:** `themes.ts` reescrito (tokens nuevos `onInk`, `stroke`, `grain`, `paperLight`, `ground`; radios 6/999), `layout.tsx` con Libre Franklin (sin mono), `globals.css` (píldoras, barrido rosa, grano en `body::after`), `ui.ts` (`panel` con trazo, `frame`, etiquetas en minúscula) y los componentes: `Hud`, `Captions`, `CheckpointCard` (giro −0,7°), `Timeline` (círculos), `Minimap` (giro +0,7°, viñeta), `VehicleCard`, `Loading`, `Explore`, `GlobeLabels`, iconos a 2 px. La escena 3D toma cielo/niebla del campo azul, terreno en crema (Marte) y lila (Luna) con curvas de tinta, y `missions.ts` lee todo de `THEME`.
- **Verificado:** `tsc` y `lint` limpios; vistas `/mars` (globo) y `/mars/opportunity` (escena) revisadas en el navegador. **No** se probó la Luna ni los vehículos en pausa, ni se midió el coste del grano en GPU.
- **No se tocó:** los vehículos procedurales (siguen en color), los créditos (ocultos) y las ilustraciones de la Parte 1 (aún por hacer).

### 31. El globo como menú previo al juego: vehículos 3D, tarjeta flotante y botón de mundo
Primer paso «poco a poco hacia el juego»: la vista del globo pasa a ser un **menú de videojuego** (será la pantalla previa a la historieta/juego).
- **Vehículos en el globo**: los cuadraditos son ahora **vehículos 3D de muy bajo detalle y pequeños** (`lib/vehicles/mini.ts`), de pie en su lat/lon y **un poco enterrados**, con contraste (tinta + rosa + papel sobre el azul) y clicables (esfera de impacto generosa, crecen al pasar el cursor, el giro se pausa bajo el cursor).
- **Fuera**: la tarjeta gigante «Left behind», el selector Luna/Marte en panel y la **lista de vehículos**. **Dentro**: un **botón flotante redondo** (icono del otro mundo) que cambia Marte ⇄ Luna, y una pista inferior de una línea.
- **Tarjeta flotante**: al hacer clic en un vehículo, su tarjeta (misma información) aparece **flotando junto a él** y lo sigue mientras se gira el globo.
- Etiquetas de nombre solo al pasar el cursor (seis a la vez se solapaban en el cúmulo de Jezero).
- Verificado: `tsc` y `lint` limpios; revisado en el navegador el globo de Marte, los vehículos y la tarjeta flotante (abierta por el hash `#opportunity`). **Sin probar**: la Luna, el clic real con el globo girando (en el navegador de pruebas gira más rápido que las acciones; el giro se pausa al pasar el cursor) y pantallas estrechas.

### 32. Ajustes del menú del globo: globo quieto, cierre de la tarjeta, mundo en texto y animaciones de juego
El usuario revisó el hito 31 y pidió:
- **El globo no se mueve al hacer clic** (ni se centra ni se desplaza ni hace zoom: la tarjeta sale donde sale) y **el puntero no puede girarlo mientras la tarjeta está abierta** (se detiene en seco, sin inercia). El giro hacia un vehículo solo ocurre al **volver del viaje** (`faceId`, nunca por un clic).
- **Cierre**: la tarjeta pierde el «back» y gana una **X**; también se cierra con **Esc** o con un **clic fuera de ella** (se ignora el clic que la abrió; hacer clic en otro vehículo solo cambia de tarjeta).
- **El cambio de mundo es solo texto** («Mars  Moon»; el actual lleva un subrayado rosa tipo rotulador que se desliza) en vez del icono redondo (se quitaron los iconos `moon`/`mars`).
- **Animaciones de juego, dinámicas y juguetonas**: nueva curva `THEME.pop` (rebota y se asienta) y `components/Pop.tsx` (entrada/salida con escala, giro y rebote: el selector, la música, la pista inferior —que salta fuera al abrir una tarjeta y vuelve al cerrarla— y la tarjeta, que sale desde el vehículo y se va con un pop); `lib/motion.ts` (muelle `springStep`) para el 3D: el globo y cada vehículo **aparecen con un rebote escalonado**, cada vehículo da **un saltito cada pocos segundos**, **se agranda y se menea al pasar el cursor** y **rebota contento** al seleccionarlo; los botones `.ui-btn` suben y se inclinan al hover y se aplastan al pulsar; la X gira 90°; la flecha de «travel to the past» se mueve cada pocos segundos (Web Animations API: los `@keyframes` nuevos no se recogen en dev). `prefers-reduced-motion` desactiva los saltitos y meneos.
- **Dos trampas encontradas:** (1) el CSS nuevo no llegó al bundle del servidor de desarrollo hasta **recargar la página** (ver gotchas); (2) un `Canvas` de R3F dentro de un elemento con `transform: scale` se mide mal (`getBoundingClientRect` incluye la escala) y el vehículo de la tarjeta salía diminuto → `resize={{ offsetSize: true }}` en `VehicleView`.
- Verificado: `tsc` y `lint` limpios; en el navegador: tarjeta flotante abierta, cierre con clic fuera, cambio Luna → Marte. **Sin probar**: Esc, la X y el clic real sobre un vehículo con el globo girando.

### 33. Vehículos del globo como una sola masa fundida con el suelo («simbionte»)
El usuario pidió que los vehículos del globo sean **un solo componente**, unificados y **pegados al globo** (referencia: el simbionte de Venom al adherirse), sin importar que pierdan algo de forma mientras se reconozcan un poco.
- **`lib/vehicles/blob.ts`** (`blobFrom`): toma el modelo de bajo detalle de `mini.ts`, lo aplana a un **mapa de alturas** visto desde arriba, **cierra los huecos** entre piezas (dilatación), añade una **falda** que se extiende por el suelo y **6 zarcillos** que reptan, **desenfoca** (`MELT`) y reescala el pico (el mástil no se hunde) y lo convierte en **una malla suave** de 56×56 con el mismo material de 3 tonos. Conserva la huella y las partes altas (mástil, rotores, abanicos) pero no hay piezas sueltas.
- **El parche se curva con la esfera** (`sphereR`): sin eso su base plana asomaba como un rombo negro en las esquinas. La base queda bajo el suelo invisible de profundidad, así que solo se ve la masa que emerge.
- **Animación de gelatina** en vez de saltitos (un blob no salta): respira, se ondula cada pocos segundos, se estira y se menea al pasar el cursor y late al estar seleccionado (squash & stretch con volumen constante).
- `mini.ts` se conserva como la **forma de partida** del blob. Verificado en el navegador (Opportunity y SEV): una masa de tinta con vetas rosa, pegada al suelo. **Sin probar**: el resto de vehículos de Marte ampliados ni el ajuste fino de `MELT` (más alto = más derretido, menos reconocible).

### 34. Vehículos del globo más reconocibles y el doble de grandes
El usuario aprobó el efecto de fundirse con el suelo pero la forma era **irreconocible**, y pidió mejorarla y **duplicar el tamaño**.
- **Causa:** el mapa de alturas derretía todo el vehículo (solo quedaba una mancha) y, además, desde el centro del globo la cámara mira cada superficie casi **desde arriba** (la normal apunta a la cámara a ~29°), así que un vehículo «de pie» solo enseña su techo.
- **Ahora** (`lib/vehicles/blob.ts`): el vehículo **conserva su forma real** y el fundido solo se lo traga **hasta ~26 % de su altura** (`CLIMB`): ruedas medio hundidas, panel, mástil y rotores quedan nítidos; el fundido (falda + zarcillos cortos + el mapa de alturas desenfocado) sigue pegándolo al suelo. Vehículo y fundido van en **una sola malla y un material**.
- **Se inclina hacia atrás** (`LEAN` 0,5 rad, la cola se hunde y el morro sube) y **gira para mirar al espectador**: cada frame apunta el morro hacia arriba de la pantalla (el lado de la cámara) con 0,6 rad de tres cuartos, así se ven frente, techo y un costado desde cualquier posición del globo.
- **Formas exageradas** (`lib/vehicles/mini.ts`): ruedas grandes con **cubo claro**, mástil grueso con cabeza de dos ojos, paneles anchos, rotores y abanicos en tono claro: lo que sobresale del fundido es lo que se reconoce.
- **Doble de tamaño:** `S` pasa de 0,017 a 0,034 (~48 px; ~65 px al seleccionarlo). Anillo, esfera de impacto, etiqueta y gelatina se reajustaron. Para que no se pisen, **Ingenuity se movió** de (21,5°N, 71,5°E) a (24°N, 65°E) (es un marcador demo «desplazado»: ya no estaba en su sitio real).
- Verificado en el navegador con Opportunity (globo quieto por el hash): se lee como un rover pequeño sobre una masa negra. **Sin revisar a escala real**: el resto de vehículos ni el cúmulo de Jezero; ajustes finos en `blob.ts` (`LEAN`, `CLIMB`, `MELT`).

### 35. Arreglo: trozos negros alrededor de InSight al pasar el cursor
El usuario vio picos negros sueltos alrededor de InSight (en el globo) al pasar el cursor y quitarlo, y sospechó que era porque otro modelo «vuela». **No era eso:** eran las **esquinas del parche plano de fundido** (el cuadrado de `blob.ts`) asomando por encima del suelo. El parche se curva para la esfera **a su tamaño de reposo**, pero el marcador crece al hover/selección (y el muelle sobrepasa ~30 %), así que sus bordes quedaban por encima de la superficie; InSight es el modelo más ancho (15 u con los abanicos), por eso solo se veía ahí, y en el borde del globo se recortaban contra el fondo azul.
- **Arreglo** (`lib/vehicles/blob.ts`, `RIM`): el **borde exterior del parche se hunde** 8 unidades por debajo del suelo (a partir del 80 % del radio), de modo que ninguna esquina asoma aunque el marcador crezca; los zarcillos (hasta ~85 %) no se ven afectados.
- Verificado en el navegador con InSight justo en el borde derecho del globo, con el cursor encima y al quitarlo: sin trozos negros. No pude reproducir el «antes» exacto, así que la causa se dedujo del cálculo del desajuste de curvatura (ver `blobFrom`).

### 36. La historia real de Opportunity: cómic + 3D + cómic, con las ilustraciones de IA
El equipo aportó la investigación (`agents/opportunity-research`: 20 dossiers de eventos elegidos entre 81, con hechos citados y fuentes), los datos (`story/data`: 81 eventos, historia de 20 y juego de 30 nodos) y **20 ilustraciones de IA** (`~/Downloads/images/v2`). El usuario pidió: revisarlo todo, repartir los eventos en **antes del 3D** (tarjetas de cómic en orden cronológico, estilo ponpon-mania.com/chapter/3) y **durante el 3D** (checkpoints del 3D que ya existía, con la información de ejemplo sustituida por los eventos reales), que las ilustraciones sean la imagen principal, que todo viva en `/mars/opportunity` (empezando por el cómic), y narraciones nuevas **cortas** (como las actuales), con los datos en `public/models/opportunity`.
- **Reparto:** 5 eventos **intro** (idea 1987, hematita 2000, «¿y si son dos?» 2000, lanzamiento 2003, aterrizaje 2004) → cómic; 13 **mars** → las paradas del 3D; 2 **outro** (fin de misión 2019 y récord de Perseverance 2026) → cómic. Tabla y criterio en [story.md](story.md).
- **Datos:** `scripts/build-opportunity-story.mjs` (desde el hito 40: `scripts/build-story.mjs` + `scripts/data/opportunity-story.mjs`, `npm run story -- opportunity`) genera `public/models/opportunity/story.json` (copy en inglés, 3 datos y fuente por evento, ruta 3D) y procesa las imágenes (1040 px); `scripts/plan-opportunity-route.mjs` (hito 40: `plan-story-route.mjs`) calcula las 13 paradas sobre el terreno (suelo llano, A* por pendientes); `lib/opportunity.ts` (hito 40: `lib/story.ts`) lo importa y la misión `opportunity` usa esos checkpoints (radio 15).
- **UI nueva:** `Journey.tsx` (las tres fases en una ruta; carga el 3D detrás de las últimas páginas y lo mantiene en espera con `game.hold`), `Comic.tsx` (páginas de papel con la ilustración, sello de fecha y recuadro de texto; avance con teclado, clic, deslizar y rueda; fondo de manchas que se mueven con cada página; narración y subtítulos por página; caída de las páginas al aterrizar). La tarjeta de checkpoint pasó a vertical para las ilustraciones 4:5 y la línea de tiempo no pone nombres con más de 8 paradas.
- **Narraciones:** 20 textos de 34–49 palabras (224–300 caracteres). **Grabados a petición del usuario** con Bill / `eleven_v4` (`npm run story-audio`: 2 123 créditos). Suenan en todo el flujo (cómic y 3D) con subtítulos; en el cómic se afinó el contenedor de subtítulos (ancho propio) y el tamaño de las páginas para que no se tapen.
- **Verificado:** `tsc` y `lint` limpios; en el navegador, recorrido completo: cómic (5 páginas) → caída → 3D con el primer checkpoint y su ilustración → conducción a otra parada → última parada → «continue the story» → epílogo y tarjeta final. **Sin probar**: pantallas pequeñas, el botón «play again» y el rendimiento del 3D cargando detrás del cómic. Con el audio grabado se comprobó en el navegador la voz y los subtítulos en una página del cómic y en la primera parada del 3D (el epílogo usa el mismo componente).

### 37. Ajustes de la historia: cuelgue de la página 3, subtítulos, tarjeta 3D y navegación
El usuario probó el hito 36 y pidió:
1. **Botón colgado en el escenario 3** (y sin transcripción). Medido con `PerformanceObserver('longtask')`: al llegar a la página 3 se montaba la escena 3D por detrás y **bloqueaba el hilo principal 6,4 s** (construir el terreno + compilar shaders). **Arreglo:** de la página 3 solo se descarga el STL (`fetch` a la caché); la escena se monta al **aterrizar** (`Comic.onLeave`), tapada por la caída de las páginas y el azul (transiciones de compositor). Tras el arreglo no hay tareas largas en las páginas 2→5.
2. **Subtítulos que sobrepasaban la tarjeta:** el contenedor del cómic es más ancho (`Captions wide`: hasta 780 px) y quedan en **una línea**; las páginas son algo más pequeñas (`--pw` 50vh) para no taparse.
3. **Tarjeta del 3D** más ancha y con metadatos: ilustración junto al título, resumen, datos y **«sources» con hasta 3 enlaces** (`story.json` → `sources`: tipo, sitio y URL, uno por sitio); alineada abajo como la línea de tiempo y el minimapa (ya no se sube por el indicador «N» de Next).
4. **En el 3D, «← story» en vez de «← Globe»** (vuelve a la última página del cómic) y **sin selector de vehículo** (`Scene`: `onBack`, `backLabel`, `lockVehicle`).
5. **Volver al 3D desde el epílogo:** `←` (o «anterior») en su primera página (`Comic.onBackPast`).
- Verificado en el navegador: páginas 2→5 sin bloqueos, aterrizaje, «← story» (vuelve a la página 5), última parada, epílogo y «←» de vuelta al 3D, subtítulos en una línea. **Sin probar**: pantallas pequeñas y los enlaces (se abren con clic).

### 38. Narración sin esperas: audios en memoria, pantalla de preparación y «skip the 3D»
El usuario vio que la narración de una tarjeta **tardaba segundos en empezar** (la primera vez, o al seguir tras dejar un rato la misma tarjeta, o al entrar al 3D: el narrador quedaba «cargando»), y que al ir y volver a una tarjeta ya no pasaba. **Causa:** cada clip era un `new Audio(url)` con `preload="auto"` **sin adjuntar al DOM**: el navegador solo bufferiza un trozo, lo suspende y, pasado un rato (o con 20 elementos), descarta el búfer; al reproducir se volvía a pedir el mp3 al servidor (lento en desarrollo). **Arreglo:** `lib/narration.ts` descarga cada mp3 **una sola vez a un Blob** (`loadNarration`, URL de objeto) y reproduce desde memoria; `playNarration` espera ese Blob (instantáneo si ya está). `Journey` añade una **pantalla de preparación** (`useStoryAssets`) que, antes del primer cómic, carga los 20 audios y decodifica las 20 ilustraciones, con barra de progreso. Además, **botón «skip the 3D»** arriba a la derecha durante el 3D (salta al cómic final; en la última parada pasa a ser «continue the story»).
- Verificado en el navegador: pantalla de preparación (65 % visto), cómic con narración y subtítulos, aterrizaje con la narración de la primera parada ya sonando, «skip the 3D» → epílogo narrando. **No se pudo reproducir** la espera de «mucho rato en una tarjeta» (hace falta dejarla minutos); el arreglo ataca la causa descrita.

### 39. Ilustraciones de Ingenuity generadas con Replicate (Nano Banana 2.1)
Con la información de contexto ya en `misiones/` (el equipo reorganizó los dossiers por misión), el usuario pidió **generar las imágenes de 20 sucesos de Ingenuity** automatizando lo que hacía a mano con Opportunity (dossier → prompt de cómic → Nano Banana en Replicate). Hecho: `scripts/data/ingenuity-image-prompts.mjs` (20 prompts escritos a partir de cada dossier, en el estilo de Opportunity), `scripts/generate-story-images.mjs` (`npm run story-images -- <misión>`: llama a la API de Replicate con `REPLICATE_API_KEY` de `.env.local`, guarda el original fuera del repo y la versión web de 1040 px en `public/models/ingenuity/story/images/`, desde el hito 40 `public/models/ingenuity/images/`, + `manifest.json`). Se probó con una imagen y luego se generaron las 19 restantes (3 en paralelo, ~25–35 s cada una, 2K 4:5 → 1856×2304). **No se tocó la app** (como se pidió). Detalle y receta en [story.md](story.md#ilustraciones-de-otras-misiones-ingenuity-hito-39).

### 40. Scripts genéricos, rutas estándar y la historia de Ingenuity
El usuario pidió: generalizar los scripts (otras misiones con el mismo estilo), **estandarizar dónde viven las imágenes** (`public/models/<misión>/images`, también para Ingenuity, purgando lo que ya no se usa) e **implementar la historia de Ingenuity** como la de Opportunity (cómic, 3D, epílogo, fuentes, narración) y grabar sus audios.
- **Scripts:** `build-opportunity-story.mjs` → `build-story.mjs <misión>` (el copy y las anclas de cada misión van en `scripts/data/<misión>-story.mjs`); `plan-opportunity-route.mjs` → `plan-story-route.mjs <misión>` (`npm run story-route`); `generate-story-audio.mjs <misión>`; `generate-story-images.mjs` escribe en `images/`. El `story.json` de Opportunity se regeneró **idéntico** (solo ganó `name` y `closing`). Los dossiers de Opportunity ahora están en `misiones/opportunity/dossiers`.
- **App:** `lib/opportunity.ts` → `lib/story.ts` (`storyOf(misión)`); `Journey`, `Comic` y `SceneLoader` ya no tienen nada de Opportunity escrito (nombre y tarjeta final salen del `story.json`).
- **Purga:** fotos PIA y `images.json` de `public/models/ingenuity/images`, `INGENUITY_CHECKPOINTS` y `public/images/checkpoints/mars-ingenuity-*.jpg`.
- Verificado en el navegador: cómic (sin errores de consola), 3D con tarjeta, fuentes y minimapa de 13 paradas, y epílogo con la tarjeta final. `tsc` y `lint` limpios. **Sin probar:** conducir las 13 paradas con el helicóptero ni escuchar los 20 clips.

### 41. Surveyor 3: primero el 3D
El usuario pidió **adelantar el modelo 3D** de Surveyor 3 (la información de la misión llegará después): buscar imágenes, dibujarlo, ponerlo en el globo y poder verlo en la escena 3D, **sin checkpoints, narración ni nada más** (valía información falsa).
- **Referencias** (vistas en el navegador, sin descargar nada): foto del Apollo 12 junto a la sonda (AS12-48-7133, NASA/JSC), el modelo de ingeniería del National Air and Space Museum (vistas frontal y desde abajo, en la página de Wikipedia de Surveyor 3) y la descripción de Wikipedia/NASA (marco tetraédrico de tubos de aluminio, mástil con panel solar y antena plana de alta ganancia, cámara de TV con espejo, brazo muestreador, ~3 m de alto, 4,3 m entre patas). No hay GLB: las proporciones se tomaron de las fotos (2,2 unidades por metro).
- **Modelo:** `src/lib/vehicles/surveyor3.ts` (Kit; trípode de tres patas con amortiguador y estabilizador, marco triangular, dos compartimentos térmicos, mástil con arriostrado, cámara + espejo, antena plana, panel solar inclinado con celdas, dos antenas omni con cono, tres motores vernier y brazo pantógrafo con la cuchara). **Ficción como InSight:** una rueda bajo cada pata para que pueda conducir (una delante, dos detrás). Versión mini para el globo en `mini.ts`. Paleta oliva.
- **Misión y globo:** `surveyor-3` en `missions.ts` (terreno de la Luna, el de SEV) y en `bodies.ts` (Oceanus Procellarum, 3,016° S 23,418° O; hechos reales: aterrizó el 20 abr 1967, visitado por el Apollo 12 el 19 nov 1969, 6 315 imágenes). Ruta `/moon/surveyor-3`.
- **Placeholders:** `SURVEYOR3_CHECKPOINTS` (`checkpoints-demo.ts`, `demo: true`): 2 paradas con texto inventado y fotos/clips tomados de la historia de SEV, solo para que la escena tenga ruta. **No se grabó audio.** Cuando llegue la información real: sustituirlas (receta en [themes-and-missions.md](themes-and-missions.md)), quitar «(demo)» del nombre y de `bodies.ts`.
- Verificado en el navegador: la escena 3D (modelo, selector de vehículo, tarjeta, minimapa) y que el marcador aparece en el globo. **Sin probar:** la tarjeta del globo (gira solo y no se pudo pinchar con fiabilidad), conducir las dos paradas y ver el modelo de frente/de atrás. `tsc` y `lint` limpios.

### 42. La historia de Surveyor 3 (cómic, 3D en la Luna, epílogo, audio)
Con las 20 ilustraciones ya hechas, el usuario pidió **implementar todo el storytelling** como en Opportunity e Ingenuity: tarjetas, checkpoints en el 3D, audios. Hecho: `scripts/data/surveyor3-story.mjs` (20 eventos: 6 antes de la Luna, 11 en el 3D, 3 de legado), `public/models/surveyor3/story.json` (con fuentes de los dossiers), 11 paradas planificadas sobre el terreno lunar (`npm run story-route -- surveyor3`, con los nuevos ajustes opcionales del planificador) y 20 clips de narración. `lib/story.ts` registra la historia como `surveyor-3`; `missions.ts` usa sus checkpoints (se quitaron los de relleno) y `bodies.ts` pasó a hechos reales (sin «demo»). `Journey`/`Comic` ganaron etiquetas genéricas (`skipLabel`, el lugar sale del `story.json`).
- Verificado en el navegador: cómic de 6 páginas («skip to moon»), 3D con la primera parada, tarjeta con 3 fuentes, subtítulos de la narración y minimapa de 11 paradas, «skip the 3D» y la tarjeta final. `tsc` y `lint` limpios. **Sin probar:** conducir las 11 paradas (hay un tramo de solo 21 u entre dos radios de 14) ni escuchar los 20 clips.

### 43. Limpieza de `public`
El usuario pidió dejar en `public` **solo lo que se usa**. `public` pasó de **139 MB a 47 MB**. Se borró (todo sigue en git): 5 SVG de plantilla de Next; `images/` (30 fotos de checkpoints antiguos y 2 fotos de vehículos); `narration/` (17 clips de los checkpoints antiguos); en `guide/` 32 clips (26 por checkpoint, `next-*`/`remind-*`, y 6 de Perseverance y SEV; se podó también su `manifest.json`); y de `models/` todos los GLB y el zip de referencia, las fotos PIA de Spirit, InSight y Beagle 2 y las carpetas de SEV, Perseverance, Spirit, InSight y Beagle 2. `SOURCES.md` pasó a `docs/model-sources.md`.
- **Se queda:** los 3 terrenos STL (los usan las 3 historias), `models/<misión>/{story.json,images,audio}` de Opportunity, Ingenuity y Surveyor 3, los 3 temas de `ambient/`, 30 clips de la guía genérica y de Opportunity, y `public/story/` (visores HTML del equipo).
- **Trampa conocida:** el código de los checkpoints antiguos sigue ahí, así que `npm run narration` y `npm run guide` volverían a grabar lo borrado (avisado en `narration.md`, `guide.md`, `assets.md` y `CLAUDE.md`).

### 44. Fuera el código muerto de los checkpoints antiguos
Tras limpiar `public` (hito 43) el usuario pidió quitar también el código que apuntaba a lo borrado. Eliminado: `lib/checkpoints-demo.ts`; de `lib/checkpoints.ts`, los checkpoints de Opportunity, SEV y Perseverance y `ALL_CHECKPOINTS` (queda solo el tipo `Checkpoint`, sin `demo` ni `noGuide`); `scripts/generate-narration.mjs` y `npm run narration`; de `guide-lines.ts`/`guide.ts`/`generate-guide.mjs`, las frases `next-*`/`remind-*` y las de Perseverance y SEV. Las misiones sin historia siguen en `missions.ts` (el globo dibuja su vehículo) con `checkpoints: []`. La guía conserva 30 frases (`npm run guide -- --dry-run`: 30 al día, 0 por grabar) y el catálogo de `docs/guide.md` se regeneró. El comportamiento en las historias no cambia: el recordatorio nunca sonaba en ellas y la frase de «parado» sigue diciéndose la mitad de las veces. `tsc` y `lint` limpios.

### 45. Spirit: ilustraciones, historia, audio y tarjeta del globo
Tras traer a `dev` los 20 dossiers de Spirit (rama `feature/story-research-agent`, merge `49e08b0`) el usuario pidió lo mismo que con las otras misiones. **Imágenes:** `scripts/data/spirit-image-prompts.mjs` (prompts escritos leyendo el contexto y las «ideas visuales» de cada dossier; mismo `STYLE`/`ENDING` que Ingenuity; el rover MER descrito igual en todas) y `npm run story-images -- spirit` (Nano Banana 2.1 en Replicate, 4:5, 2K); revisadas en una hoja de contactos. **Historia:** `scripts/data/spirit-story.mjs` (6 de Tierra, 12 de Marte, 2 de legado; cifras en disputa evitadas, ver [story.md](story.md#historia-de-spirit-hito-45)), `npm run story-route` y `npm run story` → `public/models/spirit/story.json`; **terreno:** Meridiani (el montículo de Gale es demasiado empinado). **Audio:** 20 clips de Bill (2 394 créditos). **Registro:** `lib/story.ts`, `missions.ts` (checkpoints de la historia, sin «demo») y `bodies.ts` (datos reales en la tarjeta del globo). Verificado en el navegador: cómic de 6 páginas, 3D con 12 paradas, narración con subtítulo y tarjeta del globo con «travel to the past». Commits `dbaf79b` (imágenes) y `4f7d4fc` (historia).
- **Incidencia:** «no se escuchan los audios» no era un fallo: la preferencia `poc-narration` del navegador estaba en `"off"` (tecla `N`). Los mp3 eran correctos.

### 46. Paleta por mundo (Marte y Luna)
El usuario veía Marte y la Luna igual de «moradas y rosadas» y pidió ampliar la paleta con una para cada mundo. `themes.ts` pasó a `BASE` + `WORLDS` (`themeFor`, `worldOfPath`): **Marte** terracota `#E2603A` + mantequilla `#FFC247`, **Luna** azul acero `#4B7DB8` + menta `#6BE3C3`; el suelo 3D es arena cálida / plata fría. Los componentes de UI dejaron de importar `THEME` y usan `useTheme()` (`lib/use-theme.ts`); `WorldVars.tsx` y un script del `<head>` publican las variables CSS por ruta (sin parpadeo); `missions.ts` toma el cielo de `themeFor`. Dentro del `Canvas` de R3F el tema sale de la misión. Commit `68c98de`. Detalle: [design.md](design.md#paleta-por-mundo-hito-46).

### 47. Ajustes de UI: globo libre, se endereza al soltar, zoom propio, botón de música y cómic
A petición del usuario: (1) el **globo gira libre en X e Y** (trackball con cuaternión, inercia en ambos ejes; la rotación automática sigue siendo sobre su propio eje); (2) el **zoom** (rueda, `Ctrl`+rueda/pellizco, `Ctrl` +/−/0) lo hace la cámara, así que solo escala el globo y los vehículos, no los botones; solo en `/mars` y `/moon`; la pista de abajo dice «scroll to zoom»; (3) el **botón de música** es un disco con icono (altavoz / tachado); (4) **«skip the 3D»** pasó a botón de acento (`.is-accent`); (5) la **píldora del cómic** dice «05. Six minutes of fall» (antes «05.six minutes of fall» en minúscula). Commit `1de117a`.

### 48. Tarjeta del 3D con la ilustración a todo el ancho
Primero se agrandó la imagen al 55 % junto al título (insuficiente); el usuario pidió la ilustración a **todo el ancho** con los controles debajo. Ahora: imagen 4:5 a todo el ancho con altura máxima `max(220px, 100vh − 415px)` (recorta algo en pantallas bajas, se ve entera en altas), título, lugar, progreso + `listen`, resumen, datos en 3 columnas, fuentes en una línea y crédito. Para dar sitio se estrechó la barra central de `Scene.tsx` (`clamp(440px, 100vw − 900px, 560px)`) y la tarjeta ocupa el hueco hasta ella (hasta 520 px). Commits `54c28e3` (y `1de117a` el primer intento). Verificado en 1536×775 con Ingenuity y Opportunity.

### 49. Límite del control manual del globo
El usuario pidió que, al manipular el globo, nunca se vea una cara sin vehículos (el giro automático sí puede mostrarla). **Geometría:** el punto de la esfera en el centro de la pantalla es `c = q⁻¹·(0,0,1)` en el marco del globo; se exige que el ángulo entre `c` y algún vehículo (vectores unitarios de `latLonDir`) sea ≤ `MAX_OFF` = 45° (el permitido es la unión de casquetes esféricos alrededor de los vehículos). Si un arrastre se sale, se proyecta al borde del casquete más cercano con la rotación mínima (`q ← q·Rot⁻¹`, `Rot` lleva `c` al punto objetivo) y la inercia se amortigua; el límite sigue activo durante la inercia posterior y se suelta cuando el globo vuelve a su giro automático. Si se agarra una cara sin vehículos, el globo hace un **snap** animado (~0,3 s, `slerp` rápido) hasta dejar el vehículo más cercano a `SNAP_OFF` = 25° y entonces acepta el arrastre. Validado con una simulación en Node (300 orientaciones × 200 arrastres aleatorios, Luna y Marte: nunca > límite, 100 % de snaps) y en el navegador (Luna: arrastres extremos y snap desde una cara vacía). Primer valor 55°: dejaba un vehículo pegado al borde; se bajó a 45°.

### 50. El globo se endereza al soltar
El usuario pidió dar «más orden» a la rotación: al soltar el puntero, el globo debe volver rápido a 0 en X e Y (sin inclinación ni roll) **sin tocar el giro sobre su propio eje (Z)**. Implementación: `pointerup` activa `st.norm`; cada frame `upright()` calcula la orientación derecha (`Rx(TILT)·Ry(a)`) con la misma longitud en el centro de la pantalla que la orientación actual y hace `slerp` (tasa 9/s ≈ 0,3 s) hacia ella; si esa longitud no tiene vehículo a la vista (`MAX_OFF`), usa la más cercana que sí. La inercia lateral (giro) continúa; la vertical se anula; agarrar el globo cancela el enderezado y seleccionar un vehículo lo detiene. Verificado en el navegador (Marte: arrastre diagonal → meridianos verticales, polo arriba).

### 51. Dossiers e ilustraciones de InSight y Beagle 2
Tras el merge de `feature/story-research-agent` (`e93d10c`: 20 dossiers de InSight y 20 de Beagle 2 y la línea de tiempo base de Beagle 2) el usuario pidió las imágenes. Se leyeron los `dossier.md` (contexto + «ideas visuales»), se escribieron `scripts/data/insight-image-prompts.mjs` y `beagle2-image-prompts.mjs` (mismo estilo de cómic; el módulo de aterrizaje descrito igual en todos los prompts; las infografías sugeridas se convirtieron en escenas dibujadas, las personas son figuras anónimas) y se generaron 2 × 20 imágenes con `npm run story-images` (Nano Banana 2.1, 4:5, 2K) en `public/models/insight/images` y `public/models/beagle2/images` (≈ 3,6 y 4,0 MB). Revisión con hojas de contactos: coherentes con las otras historias. **Purga:** no había nada más de estos vehículos en `public/` (la limpieza del hito 43 ya lo había quitado); sus modelos procedurales siguen en uso en el globo y los originales de 1856×2304 viven fuera del repo (`~/Downloads/images/`). Aún **no hay historia, ruta ni audio** de estas dos misiones: siguen «coming soon».

### 52. Historias de InSight y Beagle 2, con vehículos inmóviles
El usuario pidió implementar todo (historia, tarjetas, 3D, audios) para InSight y Beagle 2 avisando de que **ninguno se movió** y proponiendo que en el 3D el **Espacio cambie de narración** en vez de mover el vehículo. Hecho: `scripts/data/insight-story.mjs` (4 de Tierra + 14 momentos + 2 de legado) y `beagle2-story.mjs` (6 + 12 + 2), con `STATIONARY`/`BASE`; `build-story.mjs` escribe `stationary` y `plan-story-route.mjs` N paradas iguales; 40 clips de Bill (4 997 créditos); registro en `lib/story.ts`, `missions.ts` (InSight sobre el llano de Meridiani, Beagle 2 sobre el suelo de Gale) y `bodies.ts` (datos reales). **Modo «vehículo quieto»** (ver [architecture.md](architecture.md#vehículos-inmóviles-hito-52)): ruta virtual con un cursor de tiempo, Espacio = siguiente momento (`stepForward`), clic en la línea de tiempo = saltar, cámara que orbita un paso por momento, sin guía, balizas ni ruta en el minimapa; los modelos pierden las ruedas ficticias (InSight sobre tres patas, Beagle 2 tumbado). Verificado en el navegador: cómic de 4 y 6 páginas, 3D con 14 y 12 momentos, narración, Espacio (momento 3/14), salto al último momento con «continue the story» y la tarjeta del globo (ya no «coming soon»). Narraciones recortadas de 47–62 a 47–57 palabras. **Sin probar:** el cómic final y la tarjeta de cierre de estas dos misiones, ni escuchar los 40 clips.

## Decisiones técnicas importantes

| Decisión | Motivo |
| --- | --- |
| Estado compartido en un objeto mutable (`game`) | Escena y DOM leen el mismo estado sin re-renderizar React 60 veces/s. |
| Mapa de alturas rasterizado en lugar de *raycast* | Mucho más rápido y permite el minimapa y la física con la misma fuente. |
| Dibujar el minimapa en `<canvas>` 2D con *bake* + capa dinámica | El fondo (relieve/curvas) se calcula una vez; cada frame solo se pintan recorrido y marcador. |
| Tokens de tema en datos (`themes.ts`) | Añadir un estilo = añadir un objeto, sin tocar componentes. |
| `react-hooks/immutability` desactivada | Falsos positivos con la mutación imperativa propia de `useFrame`. |
| Vehículos procedurales de 3 tonos | Estilo plano de las referencias del usuario; ruedas separadas (giran) y sin GLB ni detección de ruedas. |
| Vehículo = 1 malla + 1 por rueda, tono por vértice | El detalle no cuesta draw calls: cientos de piezas se hornean en una sola geometría con un único material. |
| Vehículos demo con audio prestado y fuera de `ALL_CHECKPOINTS` | (histórico, hitos 28–44; los checkpoints demo ya no existen) Regla del usuario: no grabar audio nuevo. |
| Tema por mundo: `BASE` + `WORLDS`, `useTheme()` desde la ruta | Marte y la Luna necesitan colores distintos sin duplicar el tema; el mundo sale de la URL, que ya sincroniza el `pushState` del globo. Dentro de R3F (sin contexto) se usa la misión. |
| Zoom del globo en la cámara, no en CSS/escala | Solo escalan el globo y los vehículos; el DOM (botones, etiquetas, tarjetas) conserva su tamaño y sigue las posiciones proyectadas. |
| Ilustración de la tarjeta 3D con `maxHeight` según `100vh` | La imagen 4:5 a todo el ancho no cabe en pantallas bajas: se recorta un poco en vez de sacar la tarjeta de la pantalla. |

## Estado actual

**Rama `dev`, hito 52 (15 nov 2026)** — el punto de partida para retomar el proyecto:

- **Producto:** un juego de historias con globo como menú previo. `/moon` y `/mars` son el globo (giro libre en X e Y con límite —siempre hay un vehículo en la cara visible—, zoom propio, un vehículo hundido en el suelo por sitio abandonado); «travel to the past» abre `/<mundo>/<vehículo>`. **Seis vehículos tienen historia completa** —Opportunity, Spirit, Ingenuity, InSight y Beagle 2 (Marte) y Surveyor 3 (Luna)—: cómic de 4–6 páginas → recorrido 3D de 11–14 paradas (en **InSight y Beagle 2, que no se movieron, «momentos»: Espacio pasa al siguiente y el módulo no se mueve**) (una por evento real) → cómic final de 2–3 páginas + tarjeta de cierre, con 20 ilustraciones de IA, 20 narraciones de Bill (120 en total) con subtítulos y hasta 3 fuentes por parada. Perseverance y SEV salen en el globo como «coming soon» (su 3D no se abre; no tienen dossiers). El modo Decisiones está definido ([game-design.md](game-design.md)) y **sin implementar**; los créditos están ocultos.
- **Diseño:** tema único «Ink & Paper» (cómic + flat) con **paleta por mundo** (Marte terracota + mantequilla, Luna azul acero + menta), vehículos de 3 tonos que conservan su color. Ver [design.md](design.md).
- **Datos y scripts:** todo lo de una historia vive en `public/models/<misión>/` (`story.json`, `images/`, `audio/`), generado con `npm run story-images | story-route | story | story-audio -- <misión>` desde `scripts/data/<misión>-*.mjs`; los dossiers de investigación, en `misiones/<misión>/dossiers` (los entrega el equipo; no se modifican). Receta en [story.md](story.md). La app no necesita claves ni red para jugar; las claves (`ELEVENLABS_API_KEY`, `REPLICATE_API_KEY`) solo las usan los scripts desde `.env.local` (nunca se leen ni se imprimen).
- **Verificación:** `npx tsc --noEmit` y `npm run lint` limpios; cada cambio de UI se comprobó en el navegador (método en [gotchas.md](gotchas.md)). **Sin probar:** el build servido (`npm run build && npm start`), conducir todas las paradas de Spirit/Surveyor 3 a mano y la tarjeta 3D en pantallas bajas o verticales.
- **Deudas conocidas:** escala real de los vehículos, terrenos de maqueta (Spirit sobre Meridiani, Ingenuity sobre Gale), narraciones sin revisar de oído, `visited` no persistente. Lista priorizada: [roadmap.md](roadmap.md) («Siguiente»).
- **Convenciones de trabajo del usuario:** responde en español; código e identificadores en inglés; interfaz y audios en inglés; commits convencionales **sin atribución de IA** y solo cuando los pide; no commitees ni hagas push sin que lo pida; `agents/` y `story/` son del equipo. Ver [`../CLAUDE.md`](../CLAUDE.md).
