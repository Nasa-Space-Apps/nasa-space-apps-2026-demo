# La historia de Opportunity (modo Historia, hito 36)

Primera pieza **implementada** del juego definido en [game-design.md](game-design.md): el **modo Historia** de Opportunity, con **20 eventos reales** en orden cronológico y con las ilustraciones generadas con IA como imagen principal. Vive entero en **`/mars/opportunity`** (`components/Journey.tsx`).

## Flujo

```
/mars/opportunity
  ① INTRO   5 páginas de cómic (Comic.tsx): la idea → la decisión → el lanzamiento → el aterrizaje     (antes de que el rover esté en Marte)
  ② MARS    el 3D de siempre, con 13 paradas = 13 eventos (checkpoints)                               (el rover ya está en Marte)
  ③ OUTRO   2 páginas de cómic + tarjeta final «thank you, Opportunity» (play again / back to the globe)   (después de la última señal)
```

- Al entrar se ve primero una **pantalla de preparación** («preparing the story», con porcentaje): descarga **los 20 audios a memoria** y descarga y decodifica **las 20 ilustraciones** (mínimo 0,8 s, máximo 25 s). Cuando todo está listo aparece **el cómic**, así ninguna página espera a la red.
- Se ve **solo el cómic** (fondo azul del tema, páginas de papel que asoman por los lados como en ponpon-mania.com/chapter/3). Avanzar: `Espacio` / `→` / clic / deslizar / rueda; retroceder: `←`. Cada página **narra sola** (con subtítulo) al llegar. Botones: `← globe` y `skip to mars`.
- **A partir de la 3.ª página** solo se **descarga** el terreno (un `fetch` que llena la caché del navegador). La escena 3D se **monta al pulsar «land on mars»**, mientras las páginas caen y el azul se disuelve, y **espera** (`game.hold`) hasta que termina la animación: no se conduce, no se abre ningún checkpoint, no suena narración ni guía; entonces se ve la escena con el primer checkpoint abierto. (Montarla en la 3.ª página bloqueaba el hilo principal **6,4 s** —construir el terreno y compilar shaders— y congelaba los botones y los subtítulos: ver [gotchas.md](gotchas.md).)
- En el 3D funciona **igual que antes** (`Espacio` mantenido, línea de tiempo, minimapa, tarjeta, `N`/`G`/`S`), pero con los eventos reales. **Arriba a la izquierda solo hay «← story»** (vuelve a la última página del cómic, la del aterrizaje; la escena queda esperando donde estaba) y **no hay selector de vehículo** (ni tecla `M`). Arriba a la derecha hay **«skip the 3D»** (botón `.is-accent`, del color de acento del mundo; salta directo al cómic final); al llegar a la última parada se convierte en **«continue the story»**. El cómic final: desde su **primera página, `←` o el botón «anterior» vuelven al 3D** (en la última parada).
- **Tarjeta del 3D** (hito 48; abajo a la izquierda, `CheckpointCard.tsx`): la **ilustración ocupa todo el ancho** de la tarjeta (4:5, tan alta como deje la pantalla: `maxHeight: max(220px, 100vh − 415px)`; en pantallas bajas se recorta un poco arriba y abajo, en altas se ve entera) y debajo van el título, «start 1/13 · fecha · lugar», los puntos de progreso con **«listen»** en la misma fila, el resumen, los 3 datos en columnas y **«sources»: hasta 3 enlaces en una línea** (NASA/JPL, científicos, prensa; uno por sitio, salen de los dossiers; el tipo está en el tooltip) que se abren en otra pestaña. **Ancho:** `clamp(340px, (100vw − dock) / 2 − 40px, 520px)`, donde `dock = clamp(440px, 100vw − 900px, 560px)` es el ancho de la barra inferior central (subtítulo + chips + línea de tiempo, `Scene.tsx`); si cambias uno, cambia el otro.
- Volver al globo y entrar otra vez **reinicia** la experiencia (Next conserva las rutas; `Journey` devuelve `null` cuando no es la ruta actual).

## De dónde sale todo

```
agents/opportunity-research/salida/oppNNN/dossier.json   investigación (hechos, citas, fuentes, contradicciones)  ┐
story/data/linea_de_tiempo_opportunity.json              los 81 eventos                                          │ trabajo del equipo
story/data/historia_opportunity.json                     la selección de 20 en 5 actos                           │
~/Downloads/images/v2/NNN.jpeg                           20 ilustraciones IA (1856×2304, 4:5)                    ┘
          │
          ▼  scripts/plan-story-route.mjs <misión>   → scripts/data/<misión>-route.json   (posiciones y trayectos llanos de las 13 paradas)
          ▼  scripts/build-story.mjs <misión>  (npm run story -- <misión>)   ← copy y anclas en scripts/data/<misión>-story.mjs
public/models/opportunity/story.json      los 20 beats: copy en inglés, hechos, fuente, imagen, audio, parada 3D
public/models/opportunity/images/oppNNN.jpg   ilustraciones a 1040 px (≈ 4 MB en total)
public/models/opportunity/audio/oppNNN.mp3    narraciones (npm run story-audio -- <misión>)  +  audio/manifest.json
          │
          ▼  src/lib/story.ts  (importa los story.json: tipos y `storyOf(misión)` → intro/mars/outro, closing, checkpoints)
          ▼  src/lib/missions.ts     (las misiones `opportunity` e `ingenuity` usan esos checkpoints)
```

**Todo lo que consume la app está en `public/models/<misión>/`** (`story.json`, `images/<id>.jpg`, `audio/<id>.mp3`: **la misma estructura para todas las misiones**; lo de abajo describe Opportunity y vale igual para Ingenuity, hito 40). La guía de voz **general** (las 62 frases de `public/guide/`) se queda donde estaba; las frases **por checkpoint** (`next/remind-<id>`) no existen para los eventos nuevos, así que la guía calla sobre ellos (`noGuide: true`) y sigue diciendo las frases genéricas (progreso, parado, `Space`…).

Para cambiar algo: edita el copy en `scripts/data/<misión>-story.mjs` → `npm run story -- <misión>` (regenera `story.json`; si el módulo define `sourceImage`, también reprocesa las imágenes) → si cambiaste una `narration`, `npm run story-audio -- <misión>` (solo regraba ese clip).

**Añadir otra misión** (receta, hito 40): 1) dossiers en `misiones/<id>/dossiers`; 2) imágenes: `scripts/data/<id>-image-prompts.mjs` + `npm run story-images -- <id>` (→ `public/models/<id>/images`); 3) `scripts/data/<id>-story.mjs` con `NAME`, `TITLE`, `DOSSIERS`, `TERRAIN`, `ANCHORS` (línea que siguen las paradas), `CLOSING`, `BEATS` y `PARTS` (copia el formato de `opportunity-story.mjs`); 4) `npm run story-route -- <id>` y `npm run story -- <id>`; 5) `npm run story-audio -- <id>`; 6) importar su `story.json` en `src/lib/story.ts` (`STORIES`) y usar `storyOf(<id>)!.checkpoints` en `missions.ts`. `SceneLoader` monta `Journey` solo si `storyOf` devuelve algo.

## El reparto antes / después del 3D

| # | Evento | Parte | Fecha | Título (en pantalla) | Ilustración |
| --- | --- | --- | --- | --- | --- |
| 1 | `opp001` | **intro** | 1987 | A robot geologist | Squyres dibujando un rover |
| 2 | `opp005` | **intro** | 2000 | A gray clue from orbit | pantalla con la mancha de hematita |
| 3 | `opp008` | **intro** | ago 2000 | What if there are two? | sala de reuniones, «two rovers» |
| 4 | `opp015` | **intro** | 7 jul 2003 | Liftoff at night | Delta II despegando |
| 5 | `opp018` | **intro** | 24 ene 2004 | Six minutes of fall | sala de control, 9:05 pm |
| 6 | `opp021` | mars 1 | 2 mar 2004 | Rocks soaked in water | rueda de prensa, «El Capitan» |
| 7 | `opp025` | mars 2 | abr 2004 | Blueberries | esférulas de hematita |
| 8 | `opp028` | mars 3 | nov 2004 | Burns Cliff | pared de capas |
| 9 | `opp030` | mars 4 | 6 ene 2005 | A rock from the sky | meteorito + escudo térmico |
| 10 | `opp033` | mars 5 | 26 abr 2005 | Stuck in the sand | rover hundido en Purgatory Dune |
| 11 | `opp045` | mars 6 | 25 may 2011 | Goodbye, Spirit | rover solitario al anochecer |
| 12 | `opp047` | mars 7 | nov 2011 | The Homestake vein | vena de yeso |
| 13 | `opp052` | mars 8 | 15 may 2013 | Beating the moon buggy | rover + vehículo lunar fantasma |
| 14 | `opp054` | mars 9 | 8 ene 2014 | The jelly doughnut | roca blanca con centro rojo |
| 15 | `opp059` | mars 10 | dic 2014 | A rover that forgets | fotos que se deshacen (memoria) |
| 16 | `opp062` | mars 11 | 24 mar 2015 | A marathon on Mars | línea de meta |
| 17 | `opp070` | mars 12 | 30 may 2018 | The storm approaches | MRO sobre la tormenta |
| 18 | `opp072` | mars 13 | 10 jun 2018 | The last signal | rover en el polvo |
| 19 | `opp077` | **outro** | 12–13 feb 2019 | Farewell, Opportunity | sala de control en silencio |
| 20 | `opp081` | **outro** | 11 oct 2026 | The torch passes on | Perseverance y Opportunity |

**Criterio** (propuesto, ajustable en `PART`/orden de `BEATS`): «antes del 3D» = lo que pasa **antes de que el rover esté sobre Marte** (idea, decisión, lanzamiento y la caída; el aterrizaje cierra el cómic y el 3D empieza con el rover ya posado). «En el 3D» = todo lo que ocurre con el rover **sobre el terreno**, incluidos los dos eventos sin lugar propio (`opp045` Spirit, `opp059` memoria): se muestran donde está el rover en ese momento de la historia. «Después» = lo que ocurre cuando el rover ya no responde (la declaración de fin y el récord de Perseverance), otra vez en cómic.

Las posiciones del 3D **no son un mapa real** (el terreno es una maqueta): `plan-story-route.mjs` reparte las 13 paradas a lo largo del recorrido del terreno de Meridiani (aterrizaje → Eagle → Endurance → Victoria → Perseverance Valley), cada una en suelo llano (< 6° de pendiente), con trayectos de A\* sobre el mapa de pendientes (máx. 19°). Con 13 paradas la línea de tiempo no muestra nombres bajo los marcadores (la línea de arriba dice «Next: …») y el radio de activación baja a 15.

## Las narraciones

- **Cortas y directas**: 34–49 palabras, 224–300 caracteres por clip (como las de antes, que el usuario fijó como perfectas); números con letras para que la voz los lea bien; una frase por idea. Voz **Bill**, `eleven_v4`, `mp3_44100_128` (la del resto de narraciones).
- **Cada beat tiene tres textos**: `summary` (≈ 25 palabras: el pie de la página y el texto de la tarjeta), `narration` (la voz) y 3 `facts`. Los subtítulos de la voz salen de `lib/transcript.ts` (solo se graba el audio).
- **Estado: los 20 clips están grabados** (5 308 caracteres, 2 123 créditos, ≈ 6,6 MB en `public/models/opportunity/audio/` + `manifest.json`). Suenan solos en **todo el flujo**: al llegar a cada página del cómic (intro y epílogo) y al entrar en cada parada del 3D, con el mismo subtítulo frase a frase (`Captions`); `N` los activa/desactiva y el botón *Listen/Stop* de la tarjeta 3D los repite. Si cambias un `narration`: `npm run story` + `npm run story-audio` (solo regraba ese clip, por hash).
- Cada dato sale de los dossiers; donde las fuentes discrepan se evitó la cifra dudosa (ver abajo).

## Las ilustraciones

- 20 imágenes de IA con **un mismo estilo** (cómic sepia/naranja) a 4:5. Se rotulan siempre como **«AI-generated illustration»** (en la tarjeta 3D bajo la foto y como parte de la nota del `story.json`): ilustran hechos reales, **no son fotos**. Las fuentes de los hechos (NASA/JPL, Planetary Society…) se muestran como «facts: <editor>» bajo la ilustración.
- En el cómic ocupan la página entera dentro de un recuadro de tinta; en el 3D, la tarjeta pasó a **vertical** (4:5, `imageRatio`) y sus datos van en filas.
- Las imágenes llevan texto dentro (relojes, «EL CAPITAN», «TWO ROVERS»): está en inglés, como el resto.

## Datos discutidos entre fuentes (y qué se hizo)

| Evento | Discrepancia | Decisión |
| --- | --- | --- |
| `opp001` | «botas geológicas» y el año de aprobación no se confirmaron; 1987 = inicio de 4 propuestas | solo se afirma lo verificado: 4 propuestas 1987–1997, 3 rechazadas |
| `opp005` | mancha de hematita 300×500 km (ASU) vs 350×750 km (NTRS) | no se da tamaño: «a huge patch» |
| `opp008` | la fecha de la reunión (16 jul 2000) y la frase de Goldin no se confirmaron | se cuenta el anuncio oficial del **10 ago 2000** y no se cita la frase |
| `opp015` | «corcho agrietado» (el aislante del tanque) y minutos hasta la separación | se dice «cracked insulation» y no se da el dato de la separación |
| `opp018` | 24 ene (PST) vs 25 ene (UTC) | **24 de enero, 9:05 pm PST** (hora de Pasadena) |
| `opp047` | «Matijevic Hill» no aparece en las fuentes leídas; la cita de Squyres no es literal | solo «Cape York»; sin cita |
| `opp052` | LRV 35,744 km (oficial) vs 35,9 km (NSSDCA); «tres días» | 35,744 km; sin «tres días» |
| `opp054` | sol 3540 vs 3541 | se da la fecha (8 ene 2014), no el sol |
| `opp077` | comandos: > 1 000 (NASA) vs 835 (Planetary Society) | no se da el número; sí «217,000+» imágenes |
| `opp081` | fecha 11 oct 2026 (sol 2006): es el hecho más reciente, fuera de nuestro conocimiento previo | tal como lo da el dossier (fuente NASA) |

## Cómo se conecta con el modo Decisiones

`story/data/juego_opportunity.json` ya define 30 nodos con **6 decisiones** sobre la misma historia (`n03` ¿uno o dos rovers? = `opp008`; `n05` lugar de aterrizaje; `n07` cohete con grieta = `opp015`; `n11` atrapado en la arena = `opp033`; `n13` rumbo a un cráter lejano; `n16` el silencio tras la tormenta = `opp072`). Cuando se construya el modo Decisiones, cada decisión se **inserta antes del beat real correspondiente** (su `correcta` lleva a ese beat y las otras a una rama `hipotetico: true` que acaba en un fallo): la estructura de `story.json` (`beats` ordenados con `part`) es la columna vertebral de [game-design.md](game-design.md#4-la-columna-vertebral-una-sola-línea-de-nodos). **No está implementado.**

## Ilustraciones de otras misiones: Ingenuity (hito 39)

La misma receta que se usó a mano con Opportunity (pasar el dossier a una IA que escribe un prompt de cómic y generar la imagen con Nano Banana) está **automatizada** para cualquier misión de `misiones/<id>/dossiers/`:

```
misiones/ingenuity/dossiers/ingNNN/dossier.md  ──(prompt escrito a partir del contexto y las «ideas visuales»)──▶  scripts/data/ingenuity-image-prompts.mjs
npm run story-images -- ingenuity                    # Replicate · google/nano-banana-2.1 · 4:5 · 2K  (necesita REPLICATE_API_KEY en .env.local)
   ├─ ~/Downloads/images/ingenuity/ingNNN.jpg                    originales de 1856×2304 (fuera del repo, como los de Opportunity)
   └─ public/models/ingenuity/images/ingNNN.jpg + manifest.json   1040 px para la web (≈ 3,7 MB) y el prompt/predicción de cada imagen
```

- **Los 20 prompts** (uno por dossier: ing001, 010, 018, 019, 021, 023, 026, 027, 029, 032, 034, 038, 043, 069, 072, 083, 107, 127, 130, 137) usan el **mismo bloque de estilo** que Opportunity (novela gráfica sucia, tinta gruesa, paleta naranja quemado/óxido/marrón/crema, una sola luz cálida, grano de risografía) + una escena + una composición + «sin texto». Se escribieron leyendo cada dossier; los vehículos se describen igual en todas para que se reconozcan (Ingenuity: cuerpo cúbico envuelto en lámina dorada, dos rotores finos apilados, cuatro patas largas; Perseverance: seis ruedas, chasis crema, mástil con cabeza de cámara). Las personas son figuras estilizadas anónimas (sin parecido con personas reales).
- Banderas del script: `--dry-run` (imprime los prompts sin llamar a nada), `--only id,id`, `--force`, `--resolution 1K|2K|4K`, `--aspect`, `--concurrency`. Solo genera lo que falta; reintenta si Replicate limita el ritmo. **La clave solo se lee de `.env.local` y nunca se imprime.**
- Para regenerar una imagen: edita su `scene`/`composition` en el archivo de prompts y `npm run story-images -- ingenuity --only ing043 --force`. Para otra misión: crea `scripts/data/<id>-image-prompts.mjs` con el mismo formato (`STYLE`, `ENDING`, `PROMPTS`).
- Hecho: las 20 imágenes de Ingenuity (≈ 25–35 s cada una, 3 en paralelo; revisadas en una hoja de contacto: sin texto ni artefactos y con un estilo coherente con el de Opportunity). Desde el hito 40 se usan en la app (ver abajo).

## Historia de Ingenuity (hito 40)

Mismo flujo que Opportunity —cómic de 5 páginas → 3D con 13 paradas → cómic de 2 páginas + tarjeta final «thank you, Ingenuity»— con **su** información, en `/mars/ingenuity`:

- **Datos:** `scripts/data/ingenuity-story.mjs` (20 eventos: 5 de la Tierra —el mesicóptero de los 90, el prototipo de 2016, el nombre, el lanzamiento, el aterrizaje—, 13 en Jezero —de la tela del Flyer 1 al vuelo 72— y 2 de legado: el fin de la misión y Mars Chopper). Hechos y fuentes salen de `misiones/ingenuity/dossiers`; las cifras en disputa (distancias de los vuelos 6 y 26, fecha exacta del vuelo 34, mph de Mars Chopper) se evitaron. Narraciones de 42–51 palabras.
- **3D:** terreno de Gale (`gale-terrain.stl`, el único otro modelo de elevación) con la línea de la antigua ruta demo como `ANCHORS`; vehículo procedural de Ingenuity (sin restricción de pendiente). Radio de activación 15.
- **Audio:** 20 clips grabados con Bill / `eleven_v4` (5 774 caracteres, 2 311 créditos), a petición del usuario.
- **Retirado:** los checkpoints ficticios `INGENUITY_CHECKPOINTS` de `checkpoints-demo.ts` y sus 4 fotos `public/images/checkpoints/mars-ingenuity-*.jpg`; las 4 fotos PIA de `public/models/ingenuity/images` se sustituyeron por las ilustraciones (ahora todas las misiones guardan las imágenes de su historia en `public/models/<misión>/images`).

## Historia de Surveyor 3 (hito 42)

El mismo flujo, en la **Luna** (`/moon/surveyor-3`; el id de la misión lleva guion, la carpeta es `public/models/surveyor3/`): cómic de **6** páginas → 3D con **11** paradas → cómic de **3** páginas + tarjeta «thank you, Surveyor 3».

- **Datos:** `scripts/data/surveyor3-story.mjs`. Tierra (6): el plan de 1960, los Ranger de 1962, el rediseño de peso, Surveyor 1, el despegue y Canopus. Luna (11): del fallo del radar y los dos rebotes a la primera excavación, el eclipse, la noche final, la decisión del Apollo 12 y la visita de Conrad y Bean. Legado (3): la bacteria de la cámara, el análisis de 1972 y la foto del LRO. Cifras en disputa evitadas o redondeadas (imágenes de TV 6 315/6 326 → «más de 6 300», pruebas de carga 4/7, alcance del brazo 1,5/1,63 m, distancia al módulo del Apollo 12 155/163/180 m). Narraciones de 41–53 palabras.
- **3D:** terreno de la Luna (`moon-terrain.stl`, 256 × 256 u, el mismo de SEV). Es más pequeño que los de Marte, así que el planificador acepta ajustes por misión en el módulo de datos (`BOUNDS`, `FADE`, `MIN_APART`, `SNAP_REACH`); paradas de 21–66 u, pendiente máxima del recorrido 25°. Radio de activación 14.
- **Interfaz:** `Journey`/`Comic` ya no dicen «mars» a mano: el botón sale del título de la parte 2 del `story.json` («skip to moon», «land on moon»).
- **Audio:** 20 clips con Bill / `eleven_v4` (5 618 caracteres, 2 247 créditos), a petición del usuario.
- Se retiraron las 2 paradas de relleno (`SURVEYOR3_CHECKPOINTS`) del hito 41.

> **Hito 54 (auditoría):** Surveyor 3 también es un **vehículo inmóvil** (se quedó inclinado en su cráter tras los dos rebotes): sus 11 paradas del 3D son ahora **momentos** en un solo punto (`STATIONARY`/`BASE` en `surveyor3-story.mjs`), y su modelo pierde las ruedas ficticias (trípode con tres apoyos). Lo de arriba sobre «paradas de 21–66 u» ya no aplica. La distancia al módulo del Apollo 12 pasa a «~160 m». Detalle y resto de cambios en [audit.md](audit.md).

## Historia de Spirit (hito 45)

El mismo flujo en `/mars/spirit`: cómic de **6** páginas → 3D con **12** paradas → cómic de **2** páginas + tarjeta «thank you, Spirit».

- **Datos:** `scripts/data/spirit-story.mjs` (20 eventos de `misiones/spirit/dossiers`, entregados por el pipeline del equipo). Tierra (6): Squyres y sus cuatro propuestas, la pérdida del Climate Orbiter y el Polar Lander, el anuncio de los dos rovers, el nombre de Sofi Collis, el lanzamiento y el aterrizaje con 28 rebotes. Marte (12): del bucle de reinicios del sol 18 y el primer cepillado de roca a la marcha atrás, el remolino que limpió los paneles, Husband Hill, Comanche, la rueda rota (sol 779), la sílice de Home Plate, la trampa de Troy, «Free Spirit», la declaración de plataforma estacionaria y la última señal. Legado (2): el fin de los intentos de contacto y el reanálisis de 2026. Narraciones de 47–53 palabras. Cifras en disputa evitadas: la reunión de Goldin (solo se cuenta el anuncio del 10 ago 2000), el día exacto de la cumbre (29 sep vs «590 días» → «Sep 2005»), el día del atasco (23 abr vs 1 may 2009 → «Apr 2009»), la inclinación de 60° en Troy y la masa del rover (150 vs 185 kg).
- **Ilustraciones:** `scripts/data/spirit-image-prompts.mjs` (mismo `STYLE`/`ENDING` que Ingenuity; el rover se describe igual en todas) y `npm run story-images -- spirit`. El sello de la carpeta en `spi001` muestra la palabra «REJECTED» (el modelo la escribió).
- **3D:** terreno de Meridiani (`terrain.stl`, el de Opportunity, su gemelo): el montículo central de Gale era demasiado empinado (30–40°). Las paradas parten del llano del este, suben por la larga loma del oeste (Husband Hill, parada 5), bajan por el sur y terminan en el llano que hace de Home Plate/Troy (cuatro últimas paradas). Pendiente máxima del recorrido 15°; radio de activación 15. Vehículo procedural de Spirit (violeta).
- **Audio:** 20 clips con Bill / `eleven_v4` (5 979 caracteres, 2 394 créditos).
- **Globo:** la tarjeta de Spirit ya no dice «coming soon»: datos reales (aterrizó 3 ene 2004, 7,73 km, última señal 22 mar 2010).
- **Imagen a revisar:** el sello de la carpeta en `spi001` muestra la palabra «REJECTED» (el modelo la escribió); se arregla con `npm run story-images -- spirit --only spi001 --force`.
- **Si «no suena la narración»:** casi seguro es la preferencia `poc-narration = "off"` del navegador (tecla `N`); ver [gotchas.md](gotchas.md).

## Historias de InSight y Beagle 2 (hito 52): vehículos inmóviles

Las dos misiones tienen ya su historia completa (cómic → 3D → cómic, narración, fuentes) con `/mars/insight` y `/mars/beagle-2`. Como **ni InSight ni Beagle 2 se movieron**, el 3D no es una ruta que se conduce: ver «Vehículos inmóviles» abajo.

| | InSight | Beagle 2 |
| --- | --- | --- |
| Reparto | 4 de Tierra (concurso de 2012, fuga del sismómetro, lanzamiento, aterrizaje) · **14 momentos** en Marte (viento, selfie, sismómetro, topo, primer sismo, fin del topo, limpieza con arena, interior de Marte, impacto de Nochebuena, última selfie, mayor sismo, solo SEIS, último mensaje) · 2 de legado (fin de la misión, foto de HiRISE) | 6 de Tierra (propuesta de Pillinger, 1 de 3 propuestas, el nombre, el laboratorio de 60 kg, lanzamiento, separación) · **12 momentos** (silencio de Navidad, lo que esperaban oír, cráter en la elipse, el «hail», declarado perdido, búsqueda con MGS, informe, 26 fotos de HiRISE, foto de 2013, muerte de Pillinger, Croon, hallazgo) · 2 de legado (el anuncio de 2015, «dio en el larguero») |
| Terreno 3D | `terrain.stl` (llano en (0, 75), pendiente 1°) | `gale-terrain.stl` (suelo del cráter en (90, 80), pendiente 0°) |
| Audio | 20 clips de Bill, 6 113 caracteres, 2 444 créditos | 20 clips de Bill, 6 384 caracteres, 2 553 créditos |
| Datos | `scripts/data/insight-story.mjs` | `scripts/data/beagle2-story.mjs` (id de la misión `beagle-2`, carpeta `beagle2`) |

Cifras en disputa evitadas: hasta dónde llegó el topo (30 o 40 cm: «nunca bajó mucho»), el día exacto del fin de InSight (20 o 21 dic), el radio del núcleo (se da el de 2021 con su año), cuántos paneles se abrieron (solo «al menos uno quedó cerrado»), la masa de Beagle 2 (33 kg en superficie / 69 kg empaquetado, cada uno con su contexto) y el coste (£45 M en 1997 / $40 M frente a los $1 000 M de Viking). Beagle 2 es de la ESA y el Reino Unido, no de la NASA: se cuenta porque HiRISE (NASA) lo localizó en 2015.

### Vehículos inmóviles

`STATIONARY = true` y `BASE = [x, z]` en el módulo de datos de la misión (`npm run story-route` escribe N paradas **iguales**; `npm run story` pone `stationary: true` en el `story.json`; `lib/story.ts` lo expone como `Story.stationary` y `missions.ts` como `Mission.stationary`). En el 3D:

- **El módulo no se mueve ni tiene ruedas** (`lib/vehicles/insight.ts`: tres patas con apoyos redondos; `beagle2.ts`: tumbado en el suelo). **Espacio** (una pulsación, sin repetición) pasa al siguiente momento; un clic en un marcador de la línea de tiempo salta a ese momento. El chip dice «Next moment», no hay chip de guía (`G`) ni guía de voz, no hay balizas ni ruta en el minimapa (solo el punto del módulo) y la línea de tiempo dice «Going to…» / «The last moment».
- **La cámara** da una vuelta lenta alrededor del módulo: un paso (~0,5 rad) por cada momento, más una deriva suave.
- Al llegar al último momento aparece «continue the story», igual que en las demás historias.
- Cómo funciona por dentro: [architecture.md](architecture.md#vehículos-inmóviles-hito-52).
- **Mejora posible:** que la escena cambie con el momento (el sismómetro y el topo en el suelo solo después de desplegarse, polvo acumulándose en los paneles, los tres elementos hallados de Beagle 2). Hoy el módulo es el mismo en todos los momentos.

## Ilustraciones de InSight y Beagle 2 (hito 51)

Las 40 ilustraciones (20 por misión, uno por dossier de `misiones/insight` y `misiones/beagle2`) ya están generadas con la receta de siempre: `scripts/data/insight-image-prompts.mjs` y `scripts/data/beagle2-image-prompts.mjs` (mismo `STYLE`/`ENDING` que Ingenuity, importados; cada archivo define el vehículo una sola vez, `LANDER`, y los prompts lo reutilizan para que se reconozca) → `npm run story-images -- insight` y `-- beagle2` → `public/models/<misión>/images`. **La carpeta de Beagle 2 es `beagle2`** (como en `misiones/`), mientras que su id en `missions.ts` es `beagle-2` (igual que `surveyor3` ↔ `surveyor-3`). Revisadas en hojas de contactos: estilo coherente con el resto, sin texto legible salvo algún garabato (el calendario de `bgl032` muestra abreviaturas de los días de la semana; el «post» de `ins072`, líneas ilegibles). Beagle 2 no es de la NASA (ESA/Reino Unido): el vínculo con el reto es que HiRISE (MRO) lo localizó en 2015.

Ya están conectadas a la historia (hito 52, arriba).

## Pendiente

- **Revisar las 80 narraciones de oído** (Opportunity, Ingenuity, Surveyor 3 y Spirit) (voz Bill; si alguna no convence, edita su texto en `scripts/data/<misión>-story.mjs` y vuelve a `npm run story -- <misión>` + `npm run story-audio -- <misión>`).
- Ilustraciones: aún no se muestran los **créditos del generador/herramienta** ni hay versión en alta resolución; si se quiere un `webp`, ajustar `build-story.mjs`.
- La guía de voz es solo genérica (las frases por checkpoint se eliminaron en el hito 44).
- El 3D usa terrenos de maqueta (Meridiani, Gale y la Luna): las paradas no corresponden a lugares reales.
- Los clips y fotos antiguos de los checkpoints de Opportunity, SEV y Perseverance ya no existen (hitos 43–44).
