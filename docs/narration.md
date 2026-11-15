> **Histórico (hito 44):** el script `generate-narration.mjs` y `npm run narration` se **eliminaron** junto con los checkpoints antiguos y sus clips. Las narraciones de las historias se graban por misión con `npm run story-audio -- <misión>` (ver [story.md](story.md)). Lo de abajo describe el flujo anterior; la voz (Bill, `eleven_v4`), el método de subtítulos (`lib/transcript.ts`, solo se pide el audio) y la lógica común (`scripts/lib/tts.mjs`) siguen vigentes.

# Narración de checkpoints (ElevenLabs, pregrabada)

Al llegar a un checkpoint suena su **narración en inglés**. Los audios se **graban una sola vez** con ElevenLabs
(Text-to-Speech) y se guardan en el repo como archivos estáticos: **la app no llama a ElevenLabs en ejecución**.

## Cómo está montado

```
src/lib/checkpoints.ts      cada checkpoint tiene `narration` (guion hablado) y `audio` (ruta del mp3) = metadatos
scripts/generate-narration.mjs   npm run narration  → llama a ElevenLabs solo para lo nuevo/cambiado (lógica común en scripts/lib/tts.mjs,
                                 compartida con la guía de voz: ver guide.md)
public/narration/<id>.mp3        las grabaciones (se commitean)
public/narration/manifest.json   metadatos de cada clip: voz, modelo, formato, hash del guion, tamaño, fecha

Runtime:  Checkpoints.tsx ── entra en el radio ──► playNarration(cp) ──► <audio src="/narration/<id>.mp3">
          CheckpointCard (botón Listen/Stop) · Scene (tecla N) · lib/narration.ts (estado + audio)
```

- **Guion hablado vs texto de la tarjeta**: `text` es el resumen escrito que se ve en la tarjeta; `narration` es el guion que se
  lee en voz alta (más narrativo, con los números escritos con letras para que la pronunciación sea natural).
- **`manifest.json`** guarda por clip: `voiceId`, `voiceName`, `model`, `format`, `hash` (sha256 de guion + voz + modelo +
  formato), `chars`, `bytes`, `generatedAt`. Con el hash el script sabe qué clips están al día.

## Grabar / regrabar

Requiere tu API key en **`.env.local`** (`ELEVENLABS_API_KEY=…`, plantilla en `.env.example`; ignorado por git). Solo se usa
aquí, nunca en la app.

```bash
npm run narration                      # genera lo que falta o ha cambiado (gasta créditos solo en eso)
npm run narration -- --dry-run         # muestra el plan y el nº de caracteres, sin llamar a la API
npm run narration -- --only eagle,cone # solo esos checkpoints
npm run narration -- --force           # regraba todo
npm run narration -- --voice <id> --name "<etiqueta>" --model <id>   # otra voz/modelo en esta ejecución
```

Flujo típico: editas `narration` en `checkpoints.ts` → `npm run narration` (regraba solo ese clip) → commit de
`public/narration/`. Si cambias de voz o modelo (por defecto o por flags), todos los clips quedan «changed» y se regraban.

**Voz y modelo actuales**: voz **Bill** (`pqHfZKP75CvOlQylNhV4`), prestablecida, madura y pausada (a igual texto dura ~35 %
más que Brian o George: ritmo de documental), modelo **`eleven_v4`** (el más expresivo según la doc), `mp3_44100_128`. Se
cambian en `scripts/generate-narration.mjs` o con `ELEVENLABS_VOICE_ID` / `ELEVENLABS_VOICE_NAME` / `ELEVENLABS_MODEL_ID`.

Alternativas probadas con esta clave (misma frase de prueba, `eleven_multilingual_v2`): **Brian** `nPczCjzI2devNBz1zQrb`
(grave y cálida), **Daniel** `onwK4e9ZLuTAKqWW03F9` (locutor británico), **George** `JBFqnCBsd6RMkjVDRZzb` (narrador cálido).
Los modelos `eleven_v3`, `eleven_v4` y `eleven_multilingual_v2` funcionan con la clave.

> La clave actual está **restringida**: sirve para Text-to-Speech pero no tiene `voices_read` ni `models_read`, así que no se
> pueden listar voces/modelos por API. Para explorar más voces, añade el permiso `voices_read` a la clave
> (`GET https://api.elevenlabs.io/v1/voices`) o elige en la web de ElevenLabs y copia el *voice ID*.

## Transcripción en pantalla (y receta para audios nuevos)

Todo lo que dice una voz se ve como subtítulo (`components/Captions.tsx`, sobre el dock inferior): la **narración** (etiqueta lima «Narrator») frase a frase mientras suena, y la guía (etiqueta naranja «Guide»). Nunca se solapan.

**Decisión de diseño: de ElevenLabs solo se pide el audio; los tiempos se calculan en el cliente.** No se piden timestamps (ElevenLabs los ofrece con `/with-timestamps`, pero obligaría a regrabar cada clip,
gasta créditos extra y no hace falta): el reparto por código queda dentro de ~0,5 s de la voz y se ve perfectamente sincronizado. **Esta es la forma de trabajar para cualquier narración o texto nuevo:**

1. Escribe el guion en el campo `narration` del checkpoint (`src/lib/checkpoints.ts`). Puntuación natural: cada `.`, `!` o `?` es un corte; las comas y conjunciones sirven para partir frases largas.
2. Graba **solo el audio**: `npm run narration` (o `npm run guide` para la guía). Es el flujo de siempre; no hay flags ni archivos extra.
3. **No hay nada más que hacer**: al sonar el clip, `lib/narration.ts` lee su duración real del `<audio>` y `lib/transcript.ts` reparte las frases. Con un guion nuevo, el subtítulo funciona solo.

Cómo se reparte (`lib/transcript.ts`):

- **Frases** (`phrases()`): se cortan por oraciones; las de más de ~105 caracteres se vuelven a partir en la coma, punto y coma, guion o conjunción (`and/but/so/while/as/which/then`) más cercana al centro, y si no hay, en el espacio más cercano al centro.
- **Tiempo de inicio** (`phraseStarts()`): la duración real del clip menos una respiración inicial (≤ 0,25 s) se reparte en proporción a **caracteres + peso de pausa** (+14 tras `. ! ? …`, +6 tras `, ; : —`).
- **Seguimiento** (`lib/narration.ts`): mientras suena, un `requestAnimationFrame` compara `audio.currentTime` con los inicios (`phraseAt()`) y cambia `caption` solo cuando cambia la frase.

Para **ajustar** si algún clip futuro se desfasa (voz muy pausada, muchas listas…): cambia los pesos de pausa o `MAX` en `transcript.ts`. Para **comprobarlo**: abre la escena, pulsa Listen y mira que cada frase aparezca cuando se empieza a decir
(`npx tsc --noEmit` no lo cubre; es una prueba visual/auditiva). La guía de voz no necesita esto: cada clip es una frase corta y su subtítulo es el texto completo.

## Uso en el juego

- **Automático**: al entrar en el radio de un checkpoint suena; al salir se corta. Se vuelve a narrar cada vez que se entra.
- **Tecla `N`**: activa/desactiva la narración automática (se recuerda en `localStorage`, `poc-narration`; el chip inferior
  muestra «Narration on/off»). Dentro de un checkpoint, activarla empieza a narrar al instante.
- **Botón «Listen / Stop»** (iconos play / stop) en la tarjeta (funciona aunque la automática esté desactivada).
- Los clips de la misión se **precargan** al montarla (`preload="auto"`, ~300 KB cada uno), así que suenan sin espera.
- Mensajes junto al botón: `Audio file missing`, `Browser blocked audio: press Listen`, `Could not play audio`.

## Costes

Se cobra por carácter y **solo al grabar**: los 16 clips son ~4 400 caracteres (los 4 de salida/final costaron 430 créditos con `eleven_v4`; los 6 de Perseverance, 676). Regrabar un clip
cuesta lo que midan sus ~260–300 caracteres. Jugar no consume nada.

## Trampas

- **Autoplay**: el navegador exige un gesto previo para reproducir audio. Conducir con el teclado cuenta; si se bloquea,
  aparece «Browser blocked audio» y el botón lo resuelve. Los eventos de teclado *sintéticos* (los de las pruebas desde la
  consola) **no** cuentan: haz primero un clic real.
- Si editas `narration` y no regrabas, el audio **no** coincide con el guion (el manifiesto lo detecta: `npm run narration --
  --dry-run` lo marca como `changed`).
- Los mp3 pesan ~300 KB cada uno (~1,9 MB en total) y van en git. Si crecen mucho, bajar a `mp3_44100_64` (la mitad) o usar Git LFS.
- El *speed* y los `voice_settings` no se tocan (valores por defecto del modelo). Se pueden añadir al cuerpo de la petición en
  `synthesize()` del script.
- Probado en el navegador con el audio real: al llegar suena `eagle.mp3` (21 s) y el botón pasa a «■ Stop». La calidad
  subjetiva de la voz no la puede juzgar el asistente: si no te gusta, prueba otra con `--voice` y regraba.

## Ideas

Una voz distinta por
expedición; control de volumen en la UI; música/ambiente de fondo; efectos de sonido (ElevenLabs también ofrece generación
de SFX).
