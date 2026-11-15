# Narración (ElevenLabs, pregrabada)

Cada página del cómic y cada parada del 3D tiene su **narración en inglés** (~45 palabras). Los audios se **graban una sola vez** con ElevenLabs
(Text-to-Speech) y se guardan en el repo como archivos estáticos: **la app no llama a ElevenLabs en ejecución**.

## Cómo está montado

```
scripts/data/<misión>-story.mjs        el copy: cada beat tiene `narration` (guion hablado) y `summary` (texto de la tarjeta)
npm run story -- <misión>              → public/models/<misión>/story.json (cada beat con su `audio`)
scripts/generate-story-audio.mjs       npm run story-audio -- <misión>  → llama a ElevenLabs solo para lo nuevo/cambiado (lógica común en scripts/lib/tts.mjs,
                                       compartida con la guía de voz: ver guide.md)
public/models/<misión>/audio/<id>.mp3          las grabaciones (se commitean)
public/models/<misión>/audio/manifest.json     metadatos de cada clip: voz, modelo, formato, hash del guion, tamaño, fecha

Runtime:  Journey/Comic (página del cómic) · Checkpoints.tsx (parada del 3D) ──► narration.ts ──► <audio> desde un Blob en memoria
          CheckpointCard (botón Listen/Stop) · Scene (tecla N)
```

- **Guion hablado vs texto de la tarjeta**: `summary` es el resumen escrito que se ve; `narration` es el guion que se lee en voz alta
  (más narrativo, con los números escritos con letras para que la pronunciación sea natural).
- **`manifest.json`** guarda por clip: `voiceId`, `voiceName`, `model`, `format`, `hash` (sha256 de guion + voz + modelo + formato), `chars`,
  `bytes`, `generatedAt`. Con el hash el script sabe qué clips están al día.
- **Carga:** `Journey` descarga todos los clips de la historia a memoria (Blobs, `lib/narration.ts`) detrás de una pantalla de preparación, así que suenan sin espera.

## Grabar / regrabar

Requiere tu API key en **`.env.local`** (`ELEVENLABS_API_KEY=…`, plantilla en `.env.example`; ignorado por git). Solo se usa aquí, nunca en la app.

```bash
npm run story-audio -- opportunity                 # genera lo que falta o ha cambiado (gasta créditos solo en eso)
npm run story-audio -- ingenuity --dry-run         # muestra el plan y el nº de caracteres, sin llamar a la API
npm run story-audio -- surveyor3 --only sur031     # solo esos beats
npm run story-audio -- surveyor3 --force           # regraba todo
npm run story-audio -- surveyor3 --voice <id> --name "<etiqueta>" --model <id>   # otra voz/modelo en esta ejecución
```

Flujo típico: editas `narration` en `scripts/data/<misión>-story.mjs` → `npm run story -- <misión>` → `npm run story-audio -- <misión>` (regraba solo ese clip) →
commit de `public/models/<misión>/`. Si cambias de voz o modelo, todos los clips quedan «changed» y se regraban.

**Voz y modelo actuales**: voz **Bill** (`pqHfZKP75CvOlQylNhV4`), prestablecida, madura y pausada (ritmo de documental), modelo **`eleven_v4`**
(el más expresivo según la doc), `mp3_44100_128`. Se cambian en `scripts/generate-story-audio.mjs` o con `ELEVENLABS_VOICE_ID` /
`ELEVENLABS_VOICE_NAME` / `ELEVENLABS_MODEL_ID`. Alternativas probadas: **Brian** `nPczCjzI2devNBz1zQrb`, **Daniel** `onwK4e9ZLuTAKqWW03F9`
(la voz de la guía), **George** `JBFqnCBsd6RMkjVDRZzb`.

> La clave actual está **restringida**: sirve para Text-to-Speech pero no tiene `voices_read` ni `models_read`, así que no se pueden listar voces/modelos por API.

## Transcripción en pantalla (y receta para audios nuevos)

Todo lo que dice una voz se ve como subtítulo (`components/Captions.tsx`): la **narración** (etiqueta lima «Narrator») frase a frase mientras suena, y la guía
(etiqueta naranja «Guide»). Nunca se solapan.

**Decisión de diseño: de ElevenLabs solo se pide el audio; los tiempos se calculan en el cliente.** No se piden timestamps (obligaría a regrabar cada clip y
gasta créditos extra): el reparto por código queda dentro de ~0,5 s de la voz. **Esta es la forma de trabajar para cualquier narración nueva:**

1. Escribe el guion en el campo `narration` del beat. Puntuación natural: cada `.`, `!` o `?` es un corte; las comas y conjunciones sirven para partir frases largas.
2. Graba **solo el audio**: `npm run story-audio -- <misión>`.
3. **No hay nada más que hacer**: al sonar el clip, `lib/narration.ts` lee su duración real del `<audio>` y `lib/transcript.ts` reparte las frases.

Cómo se reparte (`lib/transcript.ts`):

- **Frases** (`phrases()`): se cortan por oraciones; las de más de ~105 caracteres se vuelven a partir en la coma, punto y coma, guion o conjunción más cercana al centro.
- **Tiempo de inicio** (`phraseStarts()`): la duración real del clip menos una respiración inicial (≤ 0,25 s) se reparte en proporción a **caracteres + peso de pausa** (+14 tras `. ! ? …`, +6 tras `, ; : —`).
- **Seguimiento** (`lib/narration.ts`): un `requestAnimationFrame` compara `audio.currentTime` con los inicios y cambia `caption` solo cuando cambia la frase.

Para **ajustar** si algún clip se desfasa: cambia los pesos de pausa o `MAX` en `transcript.ts`. Es una prueba visual/auditiva (`tsc` no la cubre).

## Uso en el juego

- **Automático**: suena al llegar a cada página del cómic y al entrar en el radio de una parada del 3D; al salir se corta.
- **Tecla `N`**: activa/desactiva la narración automática (se recuerda en `localStorage`, `poc-narration`). Dentro de una parada, activarla empieza a narrar al instante.
- **Botón «Listen / Stop»** en la tarjeta del 3D (funciona aunque la automática esté desactivada).
- Mensajes junto al botón: `Audio file missing`, `Browser blocked audio: press Listen`, `Could not play audio`.

## Costes

Se cobra por carácter y **solo al grabar**: una historia de 20 beats son ~5 300–5 800 caracteres (~2 100–2 300 créditos con `eleven_v4`). Regrabar un clip cuesta lo que midan
sus ~260–320 caracteres. Jugar no consume nada.

## Trampas

- **Autoplay**: el navegador exige un gesto previo para reproducir audio. Conducir con el teclado cuenta; si se bloquea, aparece «Browser blocked audio» y el botón lo resuelve.
  Los eventos de teclado *sintéticos* (los de las pruebas desde la consola) **no** cuentan: haz primero un clic real.
- Si editas `narration` y no regrabas, el audio **no** coincide con el guion (el manifiesto lo detecta: `--dry-run` lo marca como `changed`).
- Los mp3 pesan ~300–400 KB cada uno (~7 MB por historia) y van en git.
- El *speed* y los `voice_settings` no se tocan (valores por defecto del modelo).

## Histórico

Hasta el hito 43 cada checkpoint tenía su clip en `public/narration` (script `generate-narration.mjs`, `npm run narration`). Todo eso se eliminó (hitos 43–44) al
sustituirlo las historias; sigue en el historial de git.
