# Voice guide ("mission control")

Short, pre-recorded phrases (in English) that accompany the player while the vehicle advances along its route or stands still: how far the next checkpoint is, which target is next, how many are left, and a nudge when it stops for a while. They complement the **narration** of each checkpoint ([narration.md](narration.md)), which is the story; the guide is the practical help. Since driving is only `Space` over a fixed route (see [architecture.md](architecture.md)), the phrases for direction, heading, border, slope, turbo and encouragement were removed. The stories have **no per-checkpoint phrases** (those were removed in milestone 44): the guide only talks about distance, progress, stopping and the end. It is **not mounted for stationary vehicles** (InSight, Beagle 2, Surveyor 3).

- **Code:** phrases in `src/lib/guide-lines.ts` · engine in `src/lib/guide.ts` · `Guide.tsx` (runs it every frame) · `Captions.tsx` (the subtitle).
- **Audio:** `public/guide/<id>.mp3` + `manifest.json`, generated **once** with `npm run guide` (the app calls no API).
- **Voice:** **Daniel** (a broadcaster, "mission control" tone), model `eleven_flash_v2_5` (fast and half the price per character; more than enough for short phrases), `mp3_44100_64`. The stories' narrator is still Bill: telling the two voices apart helps separate "story" from "instructions".
- **Use:** the **`G`** key turns the guide on/off (the "G Guide on/off" chip, remembered in `localStorage`: `poc-guide`). Each phrase is also shown as a **subtitle** above the chips while it plays.

## Principle: little, contextual and never overlapping

A useful guide speaks little. The engine applies these rules (all in `guide.ts`):

1. **One voice at a time.** It never plays while a checkpoint's narration is loading/playing nor while the vehicle is inside a checkpoint (the narration rules; on entering, the guide is cut and its queue emptied).
2. **6 s of silence** after any phrase, plus a **per-category cooldown** (table below).
3. **Variants without immediate repetition:** from each category one is picked at random among those that did not play in the last 3.
4. **Nothing before the user's first gesture** (key or click): browsers block audio without a gesture.
5. **Silent during an automatic trip** (a timeline click): it only speaks when the player drives with `Space`.
6. It is evaluated ~5 times per second and only from `game` data (position along the route `s`, speed, checkpoints).

## What is said at each moment

The **target** is always the first unvisited checkpoint, in list order (`game.checkpoints`). The first checkpoint of a story (the start) is never a target. Distances are measured **along the route**.

| Phase | Categories | Condition | Cooldown |
| --- | --- | --- | --- |
| **Towards the target: progress** | `dist-far` (25 %), `dist-half` (50 %), `dist-close` (75 %), `dist-near` (< 3 radii) | once per target and band, while advancing; 25/50/75 % only if the leg is longer than 8 radii | once |
| **Arrival** (inside the checkpoint) | — (the narration plays) | the guide is silent | — |
| **Inside, after the narration** | `ready` (or `done` at the last checkpoint) | stopped 10 s and ≥ 6 s since it entered | once per visit |
| **Leaving the checkpoint** | `prog-1` / `prog-many`; `done` if none is left | 2.5 s after leaving, queued | — |
| **Stopped between checkpoints** | `idle` | 12 s without moving or pressing `Space` | 30 s |

**Vehicle-specific** phrases (`vehicle: "opportunity"`) join the same category as the generic ones and are only picked for that vehicle: the end and the idle have their own flavour. The summary table of the catalogue shows how many phrases each category has.

## Maintenance

```bash
npm run guide                 # records what is missing or changed (spends credits only on that)
npm run guide -- --dry-run    # plan and character count, without calling the API
npm run guide -- --docs       # rewrites the catalogue below from the code (no API)
npm run guide -- --only idle-1,ready-2
npm run guide -- --force      # re-records everything
npm run guide -- --voice <id> --name "<label>" --model <id>   # another voice/model in that run
```

Optional variables (`.env.local`): `ELEVENLABS_GUIDE_VOICE_ID`, `ELEVENLABS_GUIDE_VOICE_NAME`, `ELEVENLABS_GUIDE_MODEL_ID`. `ELEVENLABS_API_KEY` is needed only to record.

**Adding or changing a phrase:** edit `STATIC_LINES` in `src/lib/guide-lines.ts` (use an existing `kind`; `vehicle` optional) → `npm run guide` → `npm run guide -- --docs` → commit `public/guide/` and `docs/guide.md`. A new `kind` also needs logic in `guide.ts` and its title in `scripts/generate-guide.mjs`. If you remove phrases, delete their mp3s and their entries in `manifest.json`: the script does not prune.

Cost: the phrases are very short (a batch of 7 new phrases cost ~50 credits with `eleven_flash_v2_5`); all the audio weighs ~1.2 MB.

## Gotchas

- The subtitle and the chip update when the audio **starts playing**: if an mp3 is missing, the phrase is skipped silently.
- With the audio blocked by the browser (no gesture), `play()` fails and the phrase is dropped; the next one will try.
- If the scene runs at low fps the vehicle advances slowly (`dt` capped), but the guide's timings are **real clock**: in low-fps tests you will see the phrases more "spaced" relative to the movement.
- The voices could not be listened to when recording: if a phrase sounds odd, change it in `guide-lines.ts` and re-record only that one.
- Order and rhythm are tunable heuristics: constants `QUIET`, `TICK` and the `cool(...)` calls in `guide.ts`.

## Phrase catalogue

Generated by `npm run guide -- --docs` (do not edit by hand between the markers).

<!-- phrases:start -->
Total: **30 phrases** (27 generic, 3 Opportunity only).

#### Summary: phrases available per category

| Category | Generic | Opportunity only | Opportunity pool |
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

#### Distance: 25 % of the way — `dist-far` (3)

| id | Phrase | Vehicle |
| --- | --- | --- |
| `dist-far-1` | You're making progress, but there's still a long way to go. | all |
| `dist-far-2` | Still a lot of terrain to cover. | all |
| `dist-far-3` | Plenty left to explore. | all |

#### Distance: 50 % of the way — `dist-half` (3)

| id | Phrase | Vehicle |
| --- | --- | --- |
| `dist-half-1` | You're about halfway there. | all |
| `dist-half-2` | Halfway to the checkpoint. | all |
| `dist-half-3` | Good progress. Halfway there. | all |

#### Distance: 75 % of the way — `dist-close` (3)

| id | Phrase | Vehicle |
| --- | --- | --- |
| `dist-close-1` | Getting close now. | all |
| `dist-close-2` | The checkpoint is just ahead. | all |
| `dist-close-3` | Not far now. | all |

#### Distance: very close (< 3 radii) — `dist-near` (1)

| id | Phrase | Vehicle |
| --- | --- | --- |
| `dist-near-1` | Almost there. | all |

#### Progress: one left — `prog-1` (2)

| id | Phrase | Vehicle |
| --- | --- | --- |
| `progress-one-left-2` | Almost done. One checkpoint to go. | all |
| `progress-one-left-3` | Final stretch. One more checkpoint. | all |

#### Progress: several left — `prog-many` (1)

| id | Phrase | Vehicle |
| --- | --- | --- |
| `progress-many-1` | Checkpoint complete. More to explore. | all |

#### Expedition complete — `done` (6)

| id | Phrase | Vehicle |
| --- | --- | --- |
| `done-1` | Expedition complete. Outstanding work. | all |
| `done-2` | All checkpoints reached. Well done. | all |
| `done-3` | Mission accomplished. Take a moment to look around. | all |
| `done-4` | You've seen everything here. Press M to try another vehicle. | all |
| `done-opportunity-1` | Opportunity completes its traverse across Meridiani Planum. | Opportunity (Mars) |
| `done-opportunity-2` | Every checkpoint reached. Opportunity's journey is complete. | Opportunity (Mars) |

#### Stopped between checkpoints — `idle` (7)

| id | Phrase | Vehicle |
| --- | --- | --- |
| `idle-1` | Take your time. The next checkpoint is on your map. | all |
| `idle-2` | Need a hint? Look for the diamond on the minimap. | all |
| `idle-3` | Still there? Head for the next checkpoint when you're ready. | all |
| `idle-4` | The minimap shows where to go next. | all |
| `idle-5` | Hold Space to keep following the route. | all |
| `idle-6` | Press and hold Space to drive on. | all |
| `idle-opportunity-1` | Opportunity is idling. Ready to roll when you are. | Opportunity (Mars) |

#### Stopped inside a checkpoint, after the narration — `ready` (4)

| id | Phrase | Vehicle |
| --- | --- | --- |
| `ready-1` | Ready when you are. Head for the next checkpoint. | all |
| `ready-2` | When you've seen enough, move on to the next target. | all |
| `ready-3` | Take a look around, then continue the expedition. | all |
| `ready-4` | Hold Space when you're ready to move on. | all |
<!-- phrases:end -->
