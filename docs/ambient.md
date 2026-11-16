# Background music (ambient)

A soft, cosy instrumental bed per place: **`moon`** (the `/moon` globe), **`mars`** (the `/mars` globe and the home) and **`timeline`** (the vehicle scene and the story, with its timeline). It is **recorded once** with ElevenLabs and then played in a loop; the app calls no API at run time.

## How it is generated

- Tracks and prompts: `src/lib/ambient-tracks.ts` (no imports; Node loads it too). Each track has a `prompt`, `seconds` (requested length) and `volume` (the bed's level, 0–1).
- `npm run ambient` → `scripts/generate-ambient.mjs`: calls **ElevenLabs Music** (`POST /v1/music`, `music_v1`, `force_instrumental`, `mp3_44100_96`) and writes `public/ambient/<id>.mp3` + `manifest.json`. It only records what is new or changed (hash of prompt + duration + model + format).
- Flags: `--dry-run` (plan, no calls) · `--force` · `--only moon,mars` · `--sfx` (uses **Sound Effects v2** with `loop: true`, max. 30 s, instead of Music: textures without music).
- The API key goes only in `.env.local` (`ELEVENLABS_API_KEY`), as with the narration.
- To change a track's character: edit its `prompt` and run `npm run ambient` (only that one is re-recorded). All the prompts end in "instrumental, no voices or percussion, steady dynamics, loop": keep it, or the loop will be noticeable.

Recorded (60 s / 60 s / 75 s, ≈ 0.7 MB each): see `public/ambient/manifest.json`.

## How it plays (`lib/ambient.ts`, `components/Ambient.tsx`)

- **Place:** `<Ambient track="…"/>` is mounted where the place is shown (`Explore` by world, `Home` = `mars`, `Scene` and `Journey` = `timeline`) and asks for its bed on mounting/unmounting. Changing place does a **crossfade** (in ≈ 2 s, out ≈ 1 s). A counter (`claim`) prevents the deferred release of an unmounted effect (React strict mode, routes kept alive) from switching off the new track.
- **Seamless loop:** each track uses two `<audio>` elements; 4 s before the end the second starts from 0 with a constant-power fade, so there is no gap or click even if the track is short.
- **It lowers while someone speaks:** if a narration clip is playing (`getNarration().status === "playing"`) or a guide phrase (`getGuide().caption`), the bed drops to **20 %** (down in ≈ 0.35 s) and comes back **slowly** (≈ 1.6 s) after a 0.7 s margin, so the pauses between phrases do not "pump" the music. Constants `DUCK`, `HOLD`, `DUCK_DOWN`, `DUCK_UP` in `lib/ambient.ts`.
- **Start without interaction:** it tries to play as soon as the page opens. But browsers' autoplay policy blocks audio until a user gesture (click, tap, key), unless the site is allowed sound; **it cannot be bypassed from code**. If blocked (`NotAllowedError`), it waits and starts with the first click/key (on the globe, dragging or pressing counts). To make it play **without** touching anything (e.g. the demo laptop): in Chrome, the padlock in the address bar → *Site settings* → **Sound: Allow** for `localhost`/the domain, or open Chrome with `--autoplay-policy=no-user-gesture-required`. The universal alternative would be an entry screen with a "Start" button (one click = a gesture).
- **Mute:** the **S** key (the `S Music on/off` chip in the scene) or the music button top right of the globe and the home (`AmbientButton`, icons `sound` / `sound-off`). In the scene there is no button: the `S` key and its chip suffice. The preference is stored in `localStorage` (`poc-ambient`).
- With the bed muted the tracks are paused (nothing is decoded) and the timer stops.

## Verified in the browser

A world change with crossfade, the loop (the second deck enters 4 s before the end and the first ends paused), and the `timeline` bed dropping from 0.40 to 0.08 while a narration plays and rising again when it ends.

## Pending / ideas

- Musical quality is judged by ear: if a track does not convince, change the prompt (or use `--sfx` for a pure texture) and re-record only that one.
- A different bed per vehicle (today `timeline` is the same for every story).
