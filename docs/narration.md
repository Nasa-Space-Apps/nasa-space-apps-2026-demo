# Narration (ElevenLabs, pre-recorded)

Every comic page and every 3D stop has its **English narration** (~45 words). The audio is **recorded once** with ElevenLabs (Text-to-Speech) and kept in the repo as static files: **the app does not call ElevenLabs at run time**.

## How it is set up

```
scripts/data/<mission>-story.mjs       the copy: each beat has `narration` (the spoken script) and `summary` (the card text)
npm run story -- <mission>             → public/models/<mission>/story.json (each beat with its `audio`)
scripts/generate-story-audio.mjs       npm run story-audio -- <mission>  → calls ElevenLabs only for what is new/changed (common logic in scripts/lib/tts.mjs,
                                       shared with the voice guide: see guide.md)
public/models/<mission>/audio/<id>.mp3          the recordings (committed)
public/models/<mission>/audio/manifest.json     metadata of each clip: voice, model, format, script hash, size, date

Runtime:  Journey/Comic (comic page) · Checkpoints.tsx (3D stop) ──► narration.ts ──► <audio> from an in-memory Blob
          CheckpointCard (Listen/Stop button) · Scene (N key)
```

- **Spoken script vs card text**: `summary` is the written summary that is seen; `narration` is the script read aloud (more narrative, with numbers spelled out so the pronunciation is natural).
- **`manifest.json`** stores per clip: `voiceId`, `voiceName`, `model`, `format`, `hash` (sha256 of script + voice + model + format), `chars`, `bytes`, `generatedAt`. With the hash the script knows which clips are up to date.
- **Loading:** `Journey` downloads all of a story's clips into memory (Blobs, `lib/narration.ts`) behind a preparation screen, so they play without delay.

## Record / re-record

It needs your API key in **`.env.local`** (`ELEVENLABS_API_KEY=…`, template in `.env.example`; git-ignored). It is only used here, never in the app.

```bash
npm run story-audio -- opportunity                 # generates what is missing or changed (spends credits only on that)
npm run story-audio -- ingenuity --dry-run         # shows the plan and the character count, without calling the API
npm run story-audio -- surveyor3 --only sur031     # only those beats
npm run story-audio -- surveyor3 --force           # re-records everything
npm run story-audio -- spirit --voice <id> --name "<label>" --model <id>   # another voice/model in this run
```

Typical flow: edit `narration` in `scripts/data/<mission>-story.mjs` → `npm run story -- <mission>` → `npm run story-audio -- <mission>` (re-records only that clip) → commit `public/models/<mission>/`. If you change voice or model, every clip becomes "changed" and is re-recorded.

**Current voice and model**: voice **Bill** (`pqHfZKP75CvOlQylNhV4`), a premade, mature, paced voice (documentary rhythm), model **`eleven_v4`** (the most expressive according to the docs), `mp3_44100_128`. Change them in `scripts/generate-story-audio.mjs` or with `ELEVENLABS_VOICE_ID` / `ELEVENLABS_VOICE_NAME` / `ELEVENLABS_MODEL_ID`. Alternatives tried: **Brian** `nPczCjzI2devNBz1zQrb`, **Daniel** `onwK4e9ZLuTAKqWW03F9` (the guide's voice), **George** `JBFqnCBsd6RMkjVDRZzb`.

> The current key is **restricted**: it works for Text-to-Speech but has no `voices_read` or `models_read`, so voices/models cannot be listed through the API. ElevenLabs has announced that its *default* voices expire on 31 Dec 2026; check that Bill is still available before re-recording.

## On-screen transcript (and the recipe for new audio)

Everything a voice says is seen as a subtitle (`components/Captions.tsx`): the **narration** (label "Narrator") phrase by phrase while it plays, and the guide (label "Guide"). They never overlap.

**Design decision: only the audio is requested from ElevenLabs; the timings are computed on the client.** Timestamps are not requested (they would force re-recording every clip and cost extra credits): the code split stays within ~0.5 s of the voice. **This is the way to work for any new narration:**

1. Write the script in the beat's `narration` field. Natural punctuation: each `.`, `!` or `?` is a cut; commas and conjunctions split long sentences.
2. Record **only the audio**: `npm run story-audio -- <mission>`.
3. **Nothing else to do**: when the clip plays, `lib/narration.ts` reads its real duration from the `<audio>` and `lib/transcript.ts` spreads the phrases.

How it is spread (`lib/transcript.ts`):

- **Phrases** (`phrases()`): cut by sentences; those longer than ~105 characters are split again at the comma, semicolon, dash or conjunction closest to the middle.
- **Start time** (`phraseStarts()`): the clip's real duration minus an initial breath (≤ 0.25 s) is shared in proportion to **characters + a pause weight** (+14 after `. ! ? …`, +6 after `, ; : —`).
- **Tracking** (`lib/narration.ts`): a `requestAnimationFrame` compares `audio.currentTime` with the starts and changes `caption` only when the phrase changes.

To **adjust** a clip that drifts: change the pause weights or `MAX` in `transcript.ts`. It is a visual/auditory test (`tsc` does not cover it).

## Use in the game

- **Automatic**: it plays on arriving at each comic page and on entering the radius of a 3D stop; it is cut on leaving.
- **`N` key**: turns the automatic narration on/off (remembered in `localStorage`, `poc-narration`). Inside a stop, turning it on starts narrating at once. **If nothing is heard** (the files and the audio being correct), look first at this preference: `localStorage.getItem('poc-narration')` must not be `"off"`; press `N` until you see "narration on" and reload.
- **"Listen / Stop" button** on the 3D card (works even with the automatic narration off).
- Messages next to the button: `Audio file missing`, `Browser blocked audio: press Listen`, `Could not play audio`.

## Costs

Billed per character and **only when recording**: a 20-beat story is ~5,300–6,400 characters (~2,100–2,550 credits with `eleven_v4`). Re-recording one clip costs what its ~260–320 characters measure. Playing consumes nothing.

## Gotchas

- **Autoplay**: the browser requires a prior gesture to play audio. Driving with the keyboard counts; if it is blocked, "Browser blocked audio" appears and the button solves it. *Synthetic* keyboard events (the console tests) do **not** count: click first.
- If you edit `narration` and do not re-record, the audio does **not** match the script (the manifest detects it: `--dry-run` marks it `changed`).
- The mp3s weigh ~300–400 KB each (~7 MB per story) and go in git.
- `speed` and `voice_settings` are not touched (the model's defaults).
