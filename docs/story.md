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
- En el 3D funciona **igual que antes** (`Espacio` mantenido, línea de tiempo, minimapa, tarjeta, `N`/`G`/`S`), pero con los eventos reales. **Arriba a la izquierda solo hay «← story»** (vuelve a la última página del cómic, la del aterrizaje; la escena queda esperando donde estaba) y **no hay selector de vehículo** (ni tecla `M`). Arriba a la derecha hay **«skip the 3D»** (salta directo al cómic final); al llegar a la última parada se convierte en **«continue the story»**. El cómic final: desde su **primera página, `←` o el botón «anterior» vuelven al 3D** (en la última parada).
- **Tarjeta del 3D** (ancha, `clamp(320px, 26vw, 400px)`, a la altura de la línea de tiempo y el minimapa): la ilustración junto al título, la fecha y el lugar, los puntos de progreso y «listen»; debajo, el resumen, los 3 datos en filas y **«sources»: hasta 3 enlaces** (NASA/JPL, científicos, prensa; uno por sitio, salen de los dossiers) que se abren en otra pestaña.
- Volver al globo y entrar otra vez **reinicia** la experiencia (Next conserva las rutas; `Journey` devuelve `null` cuando no es la ruta actual).

## De dónde sale todo

```
agents/opportunity-research/salida/oppNNN/dossier.json   investigación (hechos, citas, fuentes, contradicciones)  ┐
story/data/linea_de_tiempo_opportunity.json              los 81 eventos                                          │ trabajo del equipo
story/data/historia_opportunity.json                     la selección de 20 en 5 actos                           │
~/Downloads/images/v2/NNN.jpeg                           20 ilustraciones IA (1856×2304, 4:5)                    ┘
          │
          ▼  scripts/plan-opportunity-route.mjs   → scripts/data/opportunity-route.json   (posiciones y trayectos llanos de las 13 paradas)
          ▼  scripts/build-opportunity-story.mjs  (npm run story)
public/models/opportunity/story.json      los 20 beats: copy en inglés, hechos, fuente, imagen, audio, parada 3D
public/models/opportunity/images/oppNNN.jpg   ilustraciones a 1040 px (≈ 4 MB en total)
public/models/opportunity/audio/oppNNN.mp3    narraciones (npm run story-audio)  +  audio/manifest.json
          │
          ▼  src/lib/opportunity.ts  (importa story.json: tipos, INTRO/MARS/OUTRO_BEATS, OPPORTUNITY_STORY_CHECKPOINTS)
          ▼  src/lib/missions.ts     (la misión `opportunity` usa esos checkpoints)
```

**Todo lo que consume la app está en `public/models/opportunity/`** (como se pidió). La guía de voz **general** (las 62 frases de `public/guide/`) se queda donde estaba; las frases **por checkpoint** (`next/remind-<id>`) no existen para los eventos nuevos, así que la guía calla sobre ellos (`noGuide: true`) y sigue diciendo las frases genéricas (progreso, parado, `Space`…).

Para cambiar algo: edita el copy en `scripts/build-opportunity-story.mjs` → `npm run story` (regenera `story.json` y las imágenes) → si cambiaste una `narration`, `npm run story-audio` (solo regraba ese clip).

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

Las posiciones del 3D **no son un mapa real** (el terreno es una maqueta): `plan-opportunity-route.mjs` reparte las 13 paradas a lo largo del recorrido del terreno de Meridiani (aterrizaje → Eagle → Endurance → Victoria → Perseverance Valley), cada una en suelo llano (< 6° de pendiente), con trayectos de A\* sobre el mapa de pendientes (máx. 19°). Con 13 paradas la línea de tiempo no muestra nombres bajo los marcadores (la línea de arriba dice «Next: …») y el radio de activación baja a 15.

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
   └─ public/models/ingenuity/story/images/ingNNN.jpg + manifest.json   1040 px para la web (≈ 3,7 MB) y el prompt/predicción de cada imagen
```

- **Los 20 prompts** (uno por dossier: ing001, 010, 018, 019, 021, 023, 026, 027, 029, 032, 034, 038, 043, 069, 072, 083, 107, 127, 130, 137) usan el **mismo bloque de estilo** que Opportunity (novela gráfica sucia, tinta gruesa, paleta naranja quemado/óxido/marrón/crema, una sola luz cálida, grano de risografía) + una escena + una composición + «sin texto». Se escribieron leyendo cada dossier; los vehículos se describen igual en todas para que se reconozcan (Ingenuity: cuerpo cúbico envuelto en lámina dorada, dos rotores finos apilados, cuatro patas largas; Perseverance: seis ruedas, chasis crema, mástil con cabeza de cámara). Las personas son figuras estilizadas anónimas (sin parecido con personas reales).
- Banderas del script: `--dry-run` (imprime los prompts sin llamar a nada), `--only id,id`, `--force`, `--resolution 1K|2K|4K`, `--aspect`, `--concurrency`. Solo genera lo que falta; reintenta si Replicate limita el ritmo. **La clave solo se lee de `.env.local` y nunca se imprime.**
- Para regenerar una imagen: edita su `scene`/`composition` en el archivo de prompts y `npm run story-images -- ingenuity --only ing043 --force`. Para otra misión: crea `scripts/data/<id>-image-prompts.mjs` con el mismo formato (`STYLE`, `ENDING`, `PROMPTS`).
- Hecho: las 20 imágenes de Ingenuity (≈ 25–35 s cada una, 3 en paralelo; revisadas en una hoja de contacto: sin texto ni artefactos y con un estilo coherente con el de Opportunity). **Aún no se usan en la app** (el hito 39 solo genera las imágenes; la historia de Ingenuity —textos, narración y vistas— está por hacer).

## Pendiente

- **Revisar las 20 narraciones de oído** (voz Bill; si alguna no convence, edita su texto y vuelve a `npm run story-audio`).
- Ilustraciones: aún no se muestran los **créditos del generador/herramienta** ni hay versión en alta resolución; si se quiere un `webp`, ajustar `build-opportunity-story.mjs`.
- Los clips y frases de la guía por checkpoint de los eventos nuevos (`next/remind-<id>`) no existen; la guía es solo genérica.
- El 3D todavía usa el vehículo y el terreno de siempre (maqueta): las paradas no corresponden a lugares reales de Meridiani.
- Los clips antiguos de Opportunity (`public/narration/landing|eagle|endurance|victoria|perseverance.mp3`) y sus fotos de NASA siguen en el repo pero **ya no se usan** en la experiencia.
