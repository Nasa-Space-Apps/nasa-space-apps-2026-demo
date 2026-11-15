# Rover PoC — Opportunity (Mars) y SEV (Moon)

> **Nuevo enfoque (en definición, aún sin implementar):** la demo pasa de plataforma informativa a un **juego sobre Opportunity** con modo **Historia** y modo **Decisiones**, en dos partes (historieta 2D hasta el aterrizaje y 3D en Marte). Ver [`docs/game-design.md`](docs/game-design.md). Lo que describe el resto de este README es la **versión construida hasta ahora** (que será la base de la Parte 2).

Prueba de concepto 3D en el navegador: un rover recorre una **ruta definida** sobre un terreno real (modelos STL/GLB) en dos
«expediciones» (Marte y Luna), con polvo, huellas, cámara de seguimiento, minimapa y **storytelling**: checkpoints sobre el
terreno (desde la salida hasta donde el vehículo se apagó) que muestran una tarjeta con foto y texto y **narran su historia con voz**.
No hay conducción libre: el jugador avanza con `Espacio` o salta de checkpoint en checkpoint desde una línea de tiempo. Inspirada visualmente en
[bruno-simon.com](https://bruno-simon.com/).

**Stack:** Next.js 16 (App Router) · React 19 · three.js + `@react-three/fiber` + `@react-three/drei` · Tailwind 4 · TypeScript.

> La interfaz y los audios están en **inglés**; esta documentación, en español.

## Qué incluye la demo

- **Vista del globo (`/moon`, `/mars`):** un globo alámbrico claro (rejilla gris fina, solo lo de delante, cuadrados que orbitan con él, marcador naranja y etiqueta oscura)
  que **gira solo** y solo en horizontal (arrastrar le da inercia), con un selector Luna/Marte a la izquierda y el marcador del vehículo abandonado → su tarjeta con el vehículo ilustrado en 3 tonos →
  **«Travel to the past»** abre `/<mundo>/<vehículo>` (p. ej. `/moon/sev`), la escena del recorrido. `Esc` cierra la tarjeta; `← Globe` vuelve. Cada ruta carga solo sus recursos.
- **3 expediciones** con vehículo y terreno propios: Opportunity y Perseverance (prueba) en Marte, y SEV en la Luna (Apollo 14). Selector **Vehicle**.
- **Un solo tema, «Ink & Paper»** (cómic; referencia: ponpon-mania.com/chapter/2): campo azul `#7E7EFF` con grano, papel crema `#FEECE3` con trazo de tinta `#171717` de 3 px, un acento rosa `#F892C0`, botones en píldora, Libre Franklin (800 títulos, 700 minúscula en etiquetas), vehículos de 3 tonos y movimiento suave en todo. Ver [`docs/design.md`](docs/design.md).
- **Minimapa** con relieve (curvas de nivel), la ruta (recorrida y pendiente), rumbo, posición y velocidad.
- **Línea de tiempo** (barra horizontal abajo): un marcador por checkpoint y el progreso del vehículo; solo se puede viajar a los
  checkpoints (clic en el marcador), no a un punto cualquiera de la ruta.
- **5 o 6 checkpoints por expedición** (salida + paradas + final): baliza 3D (poste + gema + anillo sobre el terreno), rombo numerado en el minimapa y
  **tarjeta informativa** (abajo a la izquierda) con foto de la NASA, texto y datos.
- **Narración con voz** (ElevenLabs, voz Bill): suena sola al llegar a cada checkpoint y se corta al salir. Los audios están
  **pregrabados** en el repo; la app no llama a ninguna API en ejecución.
- **Guía de voz «mission control»** (voz Daniel): ~60 frases cortas pregrabadas («Almost there», «Next target: …», «Hold
  Space to drive on»…) que orientan al jugador mientras avanza o está parado, con subtítulo. Poca, contextual y sin pisar a la narración.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de producción
npm run lint
npm run story-audio -- <misión>  # (opcional) graba/regraba la narración de una historia (opportunity, ingenuity, surveyor3); necesita ELEVENLABS_API_KEY en .env.local
npm run guide      # (opcional) graba/regraba la guía de voz; `-- --docs` actualiza el catálogo de frases en docs/guide.md
```

Para jugar **no hace falta ninguna clave ni variable de entorno**. La API key de ElevenLabs solo se usa en
`npm run story-audio` y `npm run guide` (ver [`docs/narration.md`](docs/narration.md); plantilla en `.env.example`, `.env.local` está en `.gitignore`).

## Controles

| Tecla / acción | Efecto |
| --- | --- |
| Arrastrar el globo | (vista del globo) Girarlo en horizontal; al soltar sigue girando |
| Clic en el marcador / en el vehículo de la lista | (vista del globo) Abrir la tarjeta del vehículo |
| `Esc` | (vista del globo) Cerrar la tarjeta |
| `Espacio` (mantener) | Avanzar por la ruta hasta el siguiente checkpoint; allí se detiene (suelta y vuelve a pulsar para seguir) |
| Clic en un marcador de la línea de tiempo | Viaje automático hasta ese checkpoint (hacia delante o hacia atrás) |
| `M` | (en la escena) Cambiar de vehículo: navega a la ruta del otro (Opportunity ⇄ SEV) |
| `N` | Activar/desactivar la narración automática (chip «Narration on/off») |
| `G` | Activar/desactivar la guía de voz (chip «Guide on/off») |
| Botón **▶ Listen / ■ Stop** de la tarjeta | Oír/parar la narración del checkpoint actual |

En la escena, arriba a la izquierda está la barra con `← Globe` y el selector **Vehicle**. El vehículo lo decide la URL; las preferencias de narración/guía se recuerdan
(`localStorage`: `poc-narration`, `poc-guide`).

## Rutas

| Ruta | Vista |
| --- | --- |
| `/` | redirige a `/moon` |
| `/moon`, `/mars` | globo con el selector de mundo (cambiar de mundo no recarga) |
| `/moon/sev`, `/mars/opportunity`, `/mars/perseverance` | escena del recorrido del vehículo (`/<mundo>/<id de la misión>`); `/mars#opportunity` abre el globo con la tarjeta |

Cada ruta descarga solo lo suyo: el globo no carga la escena del rover, y la escena solo el terreno y el modelo de su vehículo.

## Expediciones y checkpoints

| Expedición | Terreno | Ruta (salida → … → final) |
| --- | --- | --- |
| **Opportunity · Mars** | `terrain.stl`, cielo naranja | Landing Site → Eagle Crater → Endurance Crater → Victoria Crater → Perseverance Valley |
| **SEV · Moon (Apollo 14)** | `moon-terrain.stl`, cielo negro | Fra Mauro Landing Zone → Antares Lunar Module → Cone Crater → Sampling Station → Last Light |
| **Perseverance · Mars** (prueba) | `gale-terrain.stl` (cráter Gale), cielo naranja | Octavia E. Butler Landing → Wright Brothers Field → Montdenier Core → Jezero Delta → Three Forks Sample Depot → Last Sol |

El texto de los checkpoints es ficticio pero verosímil (inspirado en las misiones reales; el final de Opportunity sí es real:
la tormenta de polvo de 2018). El SEV no tiene relación histórica con Apollo 14: es solo una prueba de otro vehículo en otro
terreno, y su «apagado» final (Last Light) es inventado. **Perseverance** cuenta su misión real (Jezero: aterrizaje, Ingenuity, primer testigo de roca, delta, depósito de muestras)
pero sobre el terreno del cráter **Gale** (el único modelo de elevación disponible, el del aterrizaje de Curiosity): los lugares son de Jezero y el suelo no. Además sigue activo en la realidad, así que su
final («Last Sol») es ficticio y está rotulado como tal. Datos y ruta en `src/lib/checkpoints.ts`.

> ⚠️ Los vehículos **no están a escala real** respecto al terreno (200–2000× más grandes). Decisión consciente para la PoC;
> pendiente de resolver: ver [`docs/roadmap.md`](docs/roadmap.md).

## Documentación

Empieza por **[`docs/README.md`](docs/README.md)** (índice). Resumen de qué leer según lo que quieras hacer:

| Quiero… | Lee |
| --- | --- |
| Retomar el proyecto tras un tiempo | [`docs/history.md`](docs/history.md) → [`docs/roadmap.md`](docs/roadmap.md) |
| Entender cómo funciona el código | [`docs/architecture.md`](docs/architecture.md) |
| Añadir un vehículo (con su marcador en el globo), un estilo o un checkpoint | [`docs/themes-and-missions.md`](docs/themes-and-missions.md) |
| Grabar o cambiar la voz de la narración | [`docs/narration.md`](docs/narration.md) |
| Ver/cambiar las frases de la guía de voz y cuándo suenan | [`docs/guide.md`](docs/guide.md) |
| Saber qué hay en `public/models`, `images`, `narration` y `guide` | [`docs/assets.md`](docs/assets.md) |
| Evitar tropezar con problemas ya resueltos / probar en el navegador | [`docs/gotchas.md`](docs/gotchas.md) |

> `AGENTS.md` (generado por Next) avisa de que esta versión de Next tiene cambios incompatibles; ante la duda, consulta
> `node_modules/next/dist/docs/`.
