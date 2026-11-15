> **Hito 44:** se eliminaron las frases por checkpoint (`next-*`, `remind-*`) y las de Perseverance y SEV (en el código, en `public/guide` y aquí). Quedan **30 frases**: las genéricas y las de Opportunity. Las historias no tienen frases por checkpoint: la guía solo habla de distancia, progreso, parada y fin. El texto de abajo puede mencionar todavía lo anterior.

# Guía de voz («mission control»)

Frases cortas y pregrabadas (en inglés) que acompañan al jugador mientras el vehículo avanza por su ruta o está parado: cuánto
falta para el siguiente checkpoint, cuál es el siguiente objetivo, cuántos quedan y un empujón cuando se detiene un rato.
Complementan a la **narración** de cada checkpoint ([narration.md](narration.md)), que es la historia; la guía es la ayuda
práctica. Desde que la conducción es solo con `Espacio` sobre una ruta fija (ver [architecture.md](architecture.md)) se
eliminaron las frases de dirección, rumbo, borde, pendiente, turbo y ánimo, que ya no tienen sentido.

- **Código:** frases en `src/lib/guide-lines.ts` · motor en `src/lib/guide.ts` · `Guide.tsx` (lo ejecuta cada frame) ·
  `GuideCaption.tsx` (subtítulo).
- **Audio:** `public/guide/<id>.mp3` + `manifest.json`, generado **una vez** con `npm run guide` (la app no llama a ninguna API).
- **Voz:** **Daniel** (locutor, tono «control de misión»), modelo `eleven_flash_v2_5` (rápido y la mitad de precio por carácter;
  de sobra para frases cortas), `mp3_44100_64`. El narrador de las historias sigue siendo Bill. Distinguir las dos voces ayuda
  a separar «historia» de «instrucciones».
- **Uso:** tecla **`G`** activa/desactiva la guía (chip «G Guide on/off», se recuerda en `localStorage`: `poc-guide`). Cada
  frase se muestra también como **subtítulo** sobre los chips mientras suena.

## Principio: poca, contextual y que no se pisa

Una guía útil habla poco. El motor aplica estas reglas (todas en `guide.ts`):

1. **Una sola voz a la vez.** Nunca suena mientras la narración de un checkpoint está cargando/reproduciéndose ni mientras el
   vehículo está dentro de un checkpoint (la narración manda; al entrar se corta la guía y se vacía su cola).
2. **Silencio de 6 s** tras cualquier frase, más un **enfriamiento por categoría** (tabla de abajo).
3. **Variantes sin repetición inmediata:** de cada categoría se elige al azar entre las que no sonaron en las últimas 3.
4. **Nada antes del primer gesto del usuario** (tecla o clic): los navegadores bloquean el audio sin gesto.
5. **Callada durante un viaje automático** (clic en la línea de tiempo): solo habla cuando el jugador conduce con `Espacio`.
6. Se evalúa ~5 veces por segundo y solo a partir de datos de `game` (posición sobre la ruta `s`, velocidad, checkpoints).

## Qué se dice en cada momento de la experiencia

El **objetivo** es siempre el primer checkpoint sin visitar, en el orden de la lista (`game.checkpoints`). El primero de cada
expedición (la salida) nunca es objetivo, así que no tiene frases `next/remind`. Las distancias se miden **a lo largo de la ruta**.

| Fase | Categorías | Condición | Enfriamiento |
| --- | --- | --- | --- |
| **Hacia el objetivo: avance** | `dist-far` (25 %), `dist-half` (50 %), `dist-close` (75 %), `dist-near` (< 3 radios) | una vez por objetivo y banda, avanzando; 25/50/75 % solo si el trayecto mide > 8 radios | una vez |
| **Llegada** (dentro del checkpoint) | — (suena la narración) | la guía calla | — |
| **Dentro, tras la narración** | `ready` (o `done` en el último checkpoint) | parado 10 s y ≥ 6 s desde que entró | una vez por visita |
| **Salida del checkpoint** | `prog-1` / `prog-many` + `next-<cp>`; `done` si no queda ninguno | 2,5 s tras salir, encoladas. Al salir de la salida solo se dice `next-<cp>` | — |
| **Parado entre checkpoints** | `idle` o `remind-<cp>` (50/50) | 12 s sin moverse ni pulsar `Espacio` | 30 s |

Las frases **específicas del vehículo** (`vehicle: "opportunity"` y `"perseverance"` = Marte, `"sev"` = Luna) entran en la misma categoría que las
genéricas y solo se eligen en su expedición: final y parado tienen sabor propio. Los `next-` y `remind-` son por checkpoint, así
que cada expedición dice sus propios nombres. La tabla de resumen del catálogo muestra cuántas frases tiene cada categoría.

## Mantenimiento

```bash
npm run guide                 # graba lo que falta o ha cambiado (gasta créditos solo en eso)
npm run guide -- --dry-run    # plan y nº de caracteres, sin llamar a la API
npm run guide -- --docs       # reescribe el catálogo de abajo a partir del código (sin API)
npm run guide -- --only idle-1,ready-2
npm run guide -- --force      # regraba todo
npm run guide -- --voice <id> --name "<etiqueta>" --model <id>   # otra voz/modelo en esa ejecución
```

Variables opcionales (`.env.local`): `ELEVENLABS_GUIDE_VOICE_ID`, `ELEVENLABS_GUIDE_VOICE_NAME`, `ELEVENLABS_GUIDE_MODEL_ID`.
Requiere `ELEVENLABS_API_KEY` solo para grabar.

**Añadir o cambiar una frase:** edita `STATIC_LINES` en `src/lib/guide-lines.ts` (usa `kind` existente; `vehicle` opcional) →
`npm run guide` → `npm run guide -- --docs` → commit de `public/guide/` y `docs/guide.md`. Un `kind` nuevo además necesita
lógica en `guide.ts` y su título en `scripts/generate-guide.mjs`. Si cambias un checkpoint de nombre o añades uno, los
`next/remind` se regeneran solos con `npm run guide` (la salida de cada expedición no genera frases). Si quitas frases, borra
sus mp3 y sus entradas del `manifest.json`: el script no poda.

Coste: las frases son muy cortas (una tanda de 7 frases nuevas costó ~50 créditos con `eleven_flash_v2_5`); el audio completo pesa ~1,2 MB.

## Trampas

- El subtítulo y el chip se actualizan cuando el audio **empieza a sonar**: si falta un mp3, la frase se salta en silencio.
- Con el audio bloqueado por el navegador (sin gesto), `play()` falla y la frase se descarta; la siguiente lo intentará.
- Si la escena va a pocos fps el rover avanza despacio (`dt` limitado), pero los tiempos de la guía son de **reloj real**: en
  pruebas con poco fps verás las frases más «espaciadas» respecto al movimiento.
- Las voces no se han podido escuchar al grabar: si alguna frase suena rara, cámbiala en `guide-lines.ts` y regraba solo esa.
- Orden y ritmo son heurísticas ajustables: constantes `QUIET`, `TICK` y los `cool(...)` de `guide.ts`.

## Catálogo de frases

Generado por `npm run guide -- --docs` (no editar a mano entre los marcadores).

<!-- phrases:start -->
Total: **30 frases** (27 genéricas, 3 solo Opportunity).

#### Resumen: frases disponibles por categoría

| Categoría | Genéricas | Solo Opportunity | Pool Opportunity |
| --- | --: | --: | --: |
| `dist-far` | 3 | 0 | 3 |
| `dist-half` | 3 | 0 | 3 |
| `dist-close` | 3 | 0 | 3 |
| `dist-near` | 1 | 0 | 1 |
| `prog-1` | 2 | 0 | 2 |
| `prog-many` | 1 | 0 | 1 |
| `done` | 4 | 2 | 6 |
| `idle` | 6 | 1 | 7 |
| `ready` | 4 | 0 | 4 |

#### Distancia: 25 % del camino — `dist-far` (3)

| id | Frase | Vehículo |
| --- | --- | --- |
| `dist-far-1` | You're making progress, but there's still a long way to go. | todos |
| `dist-far-2` | Still a lot of terrain to cover. | todos |
| `dist-far-3` | Plenty left to explore. | todos |

#### Distancia: 50 % del camino — `dist-half` (3)

| id | Frase | Vehículo |
| --- | --- | --- |
| `dist-half-1` | You're about halfway there. | todos |
| `dist-half-2` | Halfway to the checkpoint. | todos |
| `dist-half-3` | Good progress. Halfway there. | todos |

#### Distancia: 75 % del camino — `dist-close` (3)

| id | Frase | Vehículo |
| --- | --- | --- |
| `dist-close-1` | Getting close now. | todos |
| `dist-close-2` | The checkpoint is just ahead. | todos |
| `dist-close-3` | Not far now. | todos |

#### Distancia: muy cerca (< 3 radios) — `dist-near` (1)

| id | Frase | Vehículo |
| --- | --- | --- |
| `dist-near-1` | Almost there. | todos |

#### Progreso: queda uno — `prog-1` (2)

| id | Frase | Vehículo |
| --- | --- | --- |
| `progress-one-left-2` | Almost done. One checkpoint to go. | todos |
| `progress-one-left-3` | Final stretch. One more checkpoint. | todos |

#### Progreso: quedan varios — `prog-many` (1)

| id | Frase | Vehículo |
| --- | --- | --- |
| `progress-many-1` | Checkpoint complete. More to explore. | todos |

#### Expedición completada — `done` (6)

| id | Frase | Vehículo |
| --- | --- | --- |
| `done-1` | Expedition complete. Outstanding work. | todos |
| `done-2` | All checkpoints reached. Well done. | todos |
| `done-3` | Mission accomplished. Take a moment to look around. | todos |
| `done-4` | You've seen everything here. Press M to try another vehicle. | todos |
| `done-opportunity-1` | Opportunity completes its traverse across Meridiani Planum. | Opportunity (Marte) |
| `done-opportunity-2` | Every checkpoint reached. Opportunity's journey is complete. | Opportunity (Marte) |

#### Parado entre checkpoints — `idle` (7)

| id | Frase | Vehículo |
| --- | --- | --- |
| `idle-1` | Take your time. The next checkpoint is on your map. | todos |
| `idle-2` | Need a hint? Look for the diamond on the minimap. | todos |
| `idle-3` | Still there? Head for the next checkpoint when you're ready. | todos |
| `idle-4` | The minimap shows where to go next. | todos |
| `idle-5` | Hold Space to keep following the route. | todos |
| `idle-6` | Press and hold Space to drive on. | todos |
| `idle-opportunity-1` | Opportunity is idling. Ready to roll when you are. | Opportunity (Marte) |

#### Parado dentro de un checkpoint, tras la narración — `ready` (4)

| id | Frase | Vehículo |
| --- | --- | --- |
| `ready-1` | Ready when you are. Head for the next checkpoint. | todos |
| `ready-2` | When you've seen enough, move on to the next target. | todos |
| `ready-3` | Take a look around, then continue the expedition. | todos |
| `ready-4` | Hold Space when you're ready to move on. | todos |
<!-- phrases:end -->
