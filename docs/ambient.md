# Música de fondo (ambient)

Una cama musical instrumental, suave y acogedora, por lugar: **`moon`** (globo `/moon`), **`mars`** (globo `/mars`) y **`timeline`** (la escena del vehículo con su línea de tiempo). Se **graba una vez** con ElevenLabs y luego se reproduce en bucle; la app no llama a ninguna API en ejecución.

## Cómo se genera

- Pistas y prompts: `src/lib/ambient-tracks.ts` (sin imports, también la carga Node). Cada pista tiene `prompt`, `seconds` (duración pedida) y `volume` (nivel de la cama, 0–1).
- `npm run ambient` → `scripts/generate-ambient.mjs`: llama a **ElevenLabs Music** (`POST /v1/music`, `music_v1`, `force_instrumental`, `mp3_44100_96`) y guarda `public/ambient/<id>.mp3` + `manifest.json`. Solo graba lo nuevo o cambiado (hash de prompt + duración + modelo + formato).
- Flags: `--dry-run` (plan, sin llamadas) · `--force` · `--only moon,mars` · `--sfx` (usa **Sound Effects v2** con `loop: true`, máx. 30 s, en vez de Music: texturas sin música).
- La API key va solo en `.env.local` (`ELEVENLABS_API_KEY`), como en la narración.
- Para cambiar el carácter de una pista: edita su `prompt` y ejecuta `npm run ambient` (solo se regraba esa). Todos los prompts terminan en «instrumental, sin voces ni percusión, dinámica estable, loop»: consérvalo, o el bucle se notará.

Grabadas (60 s / 60 s / 75 s, ≈ 0,7 MB cada una): ver `public/ambient/manifest.json`.

## Cómo suena (`lib/ambient.ts`, `components/Ambient.tsx`)

- **Lugar:** `<Ambient track="…"/>` se monta donde se muestra el lugar (`Explore` según el mundo; `Scene` = `timeline`) y pide su cama al desmontarse/montarse. Cambiar de lugar hace **crossfade** (entra en ≈ 2 s, sale en ≈ 1 s). Un contador (`claim`) evita que la liberación diferida de un efecto desmontado (React strict mode, rutas que se mantienen vivas) apague la pista nueva.
- **Bucle sin cortes:** cada pista usa dos `<audio>`; 4 s antes del final arranca el segundo desde 0 con un fundido de potencia constante, así que no hay hueco ni clic aunque la pista sea corta.
- **Baja el volumen mientras alguien habla** (lo que pidió el usuario): si hay un clip de narración sonando (`getNarration().status === "playing"`) o una frase de la guía (`getGuide().caption`), la cama baja al **20 %** (baja en ≈ 0,35 s) y vuelve **despacio** (≈ 1,6 s) tras 0,7 s de margen, para que las pausas entre frases no hagan «bombear» la música. Constantes `DUCK`, `HOLD`, `DUCK_DOWN`, `DUCK_UP` en `lib/ambient.ts`.
- **Arranque sin interacción:** intenta sonar en cuanto abre la página. Pero la política de autoplay de los navegadores bloquea el audio hasta que hay un gesto del usuario (clic, toque, tecla), salvo que el sitio tenga permitido el sonido; **no se puede saltar desde el código**. Si lo bloquea (`NotAllowedError`), queda a la espera y arranca con el primer clic/tecla (en el globo, arrastrar o pulsar cuenta). Verificado: sin gesto → pausado; tras el primer clic → suena. Para que suene **sin** tocar nada (p. ej. el portátil de la demo): en Chrome, candado de la barra de direcciones → *Configuración del sitio* → **Sonido: Permitir** para `localhost`/el dominio, o abrir Chrome con `--autoplay-policy=no-user-gesture-required`. La alternativa universal sería una pantalla de entrada con un botón «Start» (un clic = gesto).
- **Silencio:** tecla **S** (chip `S Music on/off` en la escena) o el botón «Music on/off» arriba a la derecha **solo en el globo** (`AmbientButton`, iconos `sound` / `sound-off`). En la escena no hay botón: ahí basta la tecla `S` y su chip. La preferencia se guarda en `localStorage` (`poc-ambient`).
- Con la cama en silencio las pistas se pausan (no se decodifica nada) y el temporizador se detiene.

## Verificado en el navegador

Cambio de mundo con crossfade, bucle (segundo deck entra 4 s antes del final y el primero termina pausado), la cama de `timeline` baja de 0,40 a 0,08 mientras suena la narración `landing` y sube de nuevo al terminar.

## Pendiente / ideas

- La calidad musical se juzga a oído: si una pista no convence, cambia el prompt (o usa `--sfx` para una textura pura) y regraba solo esa.
- Una cama distinta por vehículo (hoy `timeline` es la misma para Opportunity, Perseverance y SEV).
