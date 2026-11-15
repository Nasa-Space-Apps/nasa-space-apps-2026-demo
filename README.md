# Rover PoC — historias de Opportunity, Spirit, Ingenuity y Surveyor 3

> **Enfoque:** la demo es un **juego** con modo **Historia** (ya implementado para **Opportunity**, **Spirit**, **Ingenuity** y **Surveyor 3**: cómic 2D → recorrido 3D → cómic final, con 20 eventos reales cada una) y modo **Decisiones** (aún sin implementar). Ver [`docs/game-design.md`](docs/game-design.md) y [`docs/story.md`](docs/story.md). Los vehículos que aún no tienen historia (Perseverance, SEV, InSight, Beagle 2) salen en el globo con «coming soon» y su 3D no se abre.

Prueba de concepto 3D en el navegador: un rover recorre una **ruta definida** sobre un terreno real (modelos STL) en
«expediciones» (Marte y Luna), con polvo, huellas, cámara de seguimiento, minimapa y **storytelling**: paradas sobre el
terreno, una por evento real, que muestran una tarjeta con ilustración, datos y fuentes y **narran su historia con voz**.
No hay conducción libre: el jugador avanza con `Espacio` o salta de checkpoint en checkpoint desde una línea de tiempo. Inspirada visualmente en
[bruno-simon.com](https://bruno-simon.com/).

**Stack:** Next.js 16 (App Router) · React 19 · three.js + `@react-three/fiber` + `@react-three/drei` · Tailwind 4 · TypeScript.

> La interfaz y los audios están en **inglés**; esta documentación, en español.

## Qué incluye la demo

- **Vista del globo (`/moon`, `/mars`):** un globo alámbrico (rejilla fina, solo lo de delante, cuadrados que orbitan con él, vehículos en miniatura hundidos en el suelo)
  que **gira solo** y se puede **girar libremente en X e Y** (arrastrar le da inercia) y **acercar con la rueda** (el zoom solo escala el globo y los vehículos, no los botones), con un selector Luna/Marte a la izquierda, un botón de música (icono) a la derecha y el marcador del vehículo abandonado → su tarjeta con el vehículo ilustrado en 3 tonos →
  **«Travel to the past»** abre `/<mundo>/<vehículo>` (p. ej. `/moon/surveyor-3`), la historia; si el vehículo aún no tiene historia, el botón es **«Coming soon»**. `Esc` cierra la tarjeta; `← Globe` vuelve. Cada ruta carga solo sus recursos.
- **4 historias** con vehículo propio: Opportunity y Spirit (Marte, terreno de Meridiani), Ingenuity (Marte, terreno de Gale) y Surveyor 3 (Luna). Cada una: cómic de apertura, recorrido 3D y cómic final con tarjeta de cierre.
- **Un solo tema, «Ink & Paper»** (cómic; referencia: ponpon-mania.com/chapter/2), con **una paleta por mundo** (hito 46): campo con grano —**terracota `#E2603A` en Marte, azul acero `#4B7DB8` en la Luna**—, papel crema `#FEECE3` con trazo de tinta `#171717` de 3 px, un acento por mundo (**mantequilla `#FFC247` en Marte, menta `#6BE3C3` en la Luna**), botones en píldora, Libre Franklin (800 títulos, 700 minúscula en etiquetas), vehículos de 3 tonos y movimiento suave en todo. Ver [`docs/design.md`](docs/design.md).
- **Minimapa** con relieve (curvas de nivel), la ruta (recorrida y pendiente), rumbo, posición y velocidad.
- **Línea de tiempo** (barra horizontal abajo): un marcador por checkpoint y el progreso del vehículo; solo se puede viajar a los
  checkpoints (clic en el marcador), no a un punto cualquiera de la ruta.
- **11–13 paradas por historia** (una por evento real): baliza 3D (poste + gema + anillo sobre el terreno), rombo numerado en el minimapa y
  **tarjeta informativa** (abajo a la izquierda): la ilustración de IA ocupa **todo el ancho** de la tarjeta y debajo van el título, el progreso, «listen», el resumen, 3 datos y hasta 3 enlaces a las fuentes.
- **Narración con voz** (ElevenLabs, voz Bill): suena sola al llegar a cada página del cómic y a cada parada y se corta al salir. Los audios están
  **pregrabados** en el repo; la app no llama a ninguna API en ejecución.
- **Guía de voz «mission control»** (voz Daniel): 30 frases cortas pregrabadas («Almost there», «Hold Space to drive on»…) que orientan al jugador mientras avanza o está parado, con subtítulo. Poca, contextual y sin pisar a la narración.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de producción
npm run lint
npm run story-audio -- <misión>  # (opcional) graba/regraba la narración de una historia (opportunity, ingenuity, surveyor3, spirit); necesita ELEVENLABS_API_KEY en .env.local
npm run guide      # (opcional) graba/regraba la guía de voz; `-- --docs` actualiza el catálogo de frases en docs/guide.md
```

Para jugar **no hace falta ninguna clave ni variable de entorno**. La API key de ElevenLabs solo se usa en
`npm run story-audio` y `npm run guide` (ver [`docs/narration.md`](docs/narration.md); plantilla en `.env.example`, `.env.local` está en `.gitignore`).

## Controles

| Tecla / acción | Efecto |
| --- | --- |
| Arrastrar el globo | (vista del globo) Girarlo libremente en X e Y; al soltar sigue girando con inercia |
| Rueda / `Ctrl`+rueda / pellizco / `Ctrl` +, −, 0 | (vista del globo) Acercar o alejar **solo el globo y los vehículos** (los botones no cambian de tamaño; se evita el zoom de la página) |
| Clic en el marcador / en el vehículo de la lista | (vista del globo) Abrir la tarjeta del vehículo |
| `Esc` | (vista del globo) Cerrar la tarjeta |
| `Espacio` (mantener) | Avanzar por la ruta hasta el siguiente checkpoint; allí se detiene (suelta y vuelve a pulsar para seguir) |
| Clic en un marcador de la línea de tiempo | Viaje automático hasta ese checkpoint (hacia delante o hacia atrás) |
| `N` | Activar/desactivar la narración automática (chip «Narration on/off»; se recuerda en `localStorage`: si «no suena nada», mira que no esté en off) |
| `S` / botón de altavoz del globo | Música de fondo on/off |
| `G` | Activar/desactivar la guía de voz (chip «Guide on/off») |
| Botón **▶ Listen / ■ Stop** de la tarjeta | Oír/parar la narración del checkpoint actual |

En la escena, arriba a la izquierda está `← story` (vuelve a la última página del cómic) y arriba a la derecha `skip the 3D` (botón del color de acento del mundo). El vehículo lo decide la URL; las preferencias de narración/guía se recuerdan
(`localStorage`: `poc-narration`, `poc-guide`).

## Rutas

| Ruta | Vista |
| --- | --- |
| `/` | redirige a `/moon` |
| `/moon`, `/mars` | globo con el selector de mundo (cambiar de mundo no recarga) |
| `/mars/opportunity`, `/mars/spirit`, `/mars/ingenuity`, `/moon/surveyor-3` | la historia del vehículo (`/<mundo>/<id de la misión>`): cómic → 3D → cómic; los demás vehículos redirigen al globo; `/mars#opportunity` abre el globo con la tarjeta |

Cada ruta descarga solo lo suyo: el globo no carga la escena del rover, y la escena solo el terreno y el modelo de su vehículo.

## Historias

| Historia | Terreno | Paradas del 3D |
| --- | --- | --- |
| **Opportunity · Mars** | `terrain.stl` | 13 (de las rocas empapadas de Eagle Crater a la última señal) |
| **Spirit · Mars** | `terrain.stl` (maqueta de Gusev; el montículo de Gale era demasiado empinado) | 12 (del bucle de reinicios del sol 18 a la última señal en Troy) |
| **Ingenuity · Mars** | `gale-terrain.stl` (cráter Gale, como maqueta de Jezero) | 13 (de la tela del Flyer 1 al vuelo 72) |
| **Surveyor 3 · Moon** | `moon-terrain.stl` | 11 (del radar que falla a la visita del Apollo 12) |

Cada historia son **20 eventos reales** investigados en dossiers (`misiones/<misión>/dossiers`): los 5–6 primeros son cómic (hasta el despegue o el aterrizaje), los siguientes
son las paradas del 3D y los últimos 2–3 son el cómic final. Los datos viven en `public/models/<misión>/story.json` (generado con `npm run story`; el copy está en
`scripts/data/<misión>-story.mjs`). Los terrenos son maquetas: las paradas no corresponden a lugares reales. En el 3D, Ingenuity y Surveyor 3 ruedan sobre ruedas
añadidas (ficción: el real vuela / no se movió); Spirit y Opportunity conducen de verdad (Spirit con su rueda delantera derecha bloqueada). Receta para añadir otra: [`docs/story.md`](docs/story.md).

> ⚠️ Los vehículos **no están a escala real** respecto al terreno (200–2000× más grandes). Decisión consciente para la PoC;
> pendiente de resolver: ver [`docs/roadmap.md`](docs/roadmap.md).

## Documentación

Empieza por **[`docs/README.md`](docs/README.md)** (índice). Resumen de qué leer según lo que quieras hacer:

| Quiero… | Lee |
| --- | --- |
| Retomar el proyecto tras un tiempo | [`CLAUDE.md`](CLAUDE.md) (reglas y estado) → [`docs/history.md`](docs/history.md) («Estado actual») → [`docs/roadmap.md`](docs/roadmap.md) |
| Ver cómo se hace una historia (datos, imágenes, audio, ruta 3D) | [`docs/story.md`](docs/story.md) |
| Cambiar colores de Marte/Luna o tocar la UI | [`docs/design.md`](docs/design.md) («Paleta por mundo») |
| Entender cómo funciona el código | [`docs/architecture.md`](docs/architecture.md) |
| Añadir un vehículo (con su marcador en el globo), un estilo o un checkpoint | [`docs/themes-and-missions.md`](docs/themes-and-missions.md) |
| Grabar o cambiar la voz de la narración | [`docs/narration.md`](docs/narration.md) |
| Ver/cambiar las frases de la guía de voz y cuándo suenan | [`docs/guide.md`](docs/guide.md) |
| Saber qué hay en `public/models`, `images`, `narration` y `guide` | [`docs/assets.md`](docs/assets.md) |
| Evitar tropezar con problemas ya resueltos / probar en el navegador | [`docs/gotchas.md`](docs/gotchas.md) |

> `AGENTS.md` (generado por Next) avisa de que esta versión de Next tiene cambios incompatibles; ante la duda, consulta
> `node_modules/next/dist/docs/`.
