# The stories (Story mode)

The **implemented part** of the game defined in [game-design.md](game-design.md): the **Story mode** of six vehicles, each with **20 real events** in chronological order and AI illustrations as the main image. Each one lives on its own route (`/mars/opportunity`, `/mars/spirit`, `/mars/ingenuity`, `/mars/insight`, `/mars/beagle-2`, `/moon/surveyor-3`; `components/Journey.tsx`). The facts come from the research dossiers ([research-pipeline.md](research-pipeline.md)).

## Flow

```
/<world>/<vehicle>
  1. INTRO   4–6 comic pages (Comic.tsx): the idea → the decision → the launch → the landing      (before the vehicle is on the world)
  2. 3D      the 3D scene with 11–14 stops = 11–14 events (checkpoints)                         (the vehicle is already there)
  3. OUTRO   2–3 comic pages + a closing card «thank you, <vehicle>» (play again / back to the globe)   (after the last signal)
```

- On entering, a **preparation screen** ("preparing the story", with a percentage) downloads **all the audio clips into memory** and downloads and decodes **all the illustrations** (minimum 0.8 s, maximum 25 s). When everything is ready the **comic** appears, so no page waits for the network.
- Only the comic is seen (the world's field, paper pages that peek from the sides like ponpon-mania.com/chapter/3). Next: `Space` / `→` / click / swipe / wheel; back: `←`. Each page **narrates itself** (with a subtitle) on arriving. Buttons: `← globe` and `skip to mars` (`skip to moon` on the Moon).
- **From the 3rd page** only the **terrain is downloaded** (a `fetch` that fills the browser cache). The 3D scene is **mounted when "land on mars" is pressed**, while the pages fall and the field dissolves, and it **waits** (`game.hold`) until the animation ends: it cannot be driven, no checkpoint opens, no narration or guide plays; then the scene shows with the first checkpoint open. (Mounting it on page 3 blocked the main thread **6.4 s** — building the terrain and compiling shaders — and froze buttons and subtitles: see [gotchas.md](gotchas.md).)
- In 3D it works as always (`Space` held, timeline, minimap, card, `N`/`G`/`S`), with real events. **Top left only "← story"** (returns to the last comic page, the landing; the scene stays waiting) and **no vehicle selector** (nor `M`). Top right **"skip the 3D"** (an `.is-accent` button; jumps straight to the final comic); at the last stop it becomes **"continue the story"**. In the final comic, from its **first page `←` or the "previous" button return to the 3D** (at the last stop).
- **3D card** (bottom left, `CheckpointCard.tsx`): the **illustration fills the card's width** (4:5, as tall as the screen allows: `maxHeight: max(220px, 100vh − 415px)`; on low screens it is trimmed a little at top and bottom) and below it: the title, "start 1/13 · date · place", progress dots with **"listen"** on the same row, the summary, the 3 facts in columns and **"sources": up to 3 links in one line** (NASA/JPL, scientists, press; one per site, taken from the dossiers; the kind is in the tooltip) that open in another tab. **Width:** `clamp(340px, (100vw − dock) / 2 − 40px, 520px)` where `dock = clamp(440px, 100vw − 900px, 560px)` is the width of the central bottom bar (subtitle + chips + timeline, `Scene.tsx`); if you change one, change the other.
- Going back to the globe and entering again **restarts** the experience (Next keeps routes; `Journey` returns `null` when it is not the current route).

## Where everything comes from

```
misiones/<id>/dossiers/<event>/dossier.json   the research (facts, quotes, sources, contradictions)      ┐ research team
timelines_v0/linea_de_tiempo_<id>.json        the base timeline                                            │
AI illustrations (1856×2304, 4:5)             outside the repo (~/Downloads/images/<mission>/)             ┘
          │
          ▼  scripts/plan-story-route.mjs <mission>   → scripts/data/<mission>-route.json   (positions and flat legs of the 3D stops)
          ▼  scripts/build-story.mjs <mission>  (npm run story -- <mission>)   ← copy and anchors in scripts/data/<mission>-story.mjs
public/models/<mission>/story.json         the 20 beats: English copy, facts, sources, image, audio, 3D stop
public/models/<mission>/images/<id>.jpg    illustrations at 1040 px (≈ 4 MB per mission)
public/models/<mission>/audio/<id>.mp3     narrations (npm run story-audio -- <mission>)  +  audio/manifest.json
          │
          ▼  src/lib/story.ts  (imports the story.json files: types and `storyOf(mission)` → intro/mars/outro, closing, checkpoints)
          ▼  src/lib/missions.ts     (each mission uses `storyOf(<id>)!.checkpoints`)
```

**Everything the app consumes is in `public/models/<mission>/`** (`story.json`, `images/<id>.jpg`, `audio/<id>.mp3`: the same structure for every mission; folder names: `opportunity`, `spirit`, `ingenuity`, `surveyor3`, `insight`, `beagle2`). The mission **id** with a hyphen (`surveyor-3`, `beagle-2`) is the route and `STORIES` key; the folder and the scripts' argument have none (`npm run story -- beagle2`).

To change something: edit the copy in `scripts/data/<mission>-story.mjs` → `npm run story -- <mission>` (regenerates `story.json`; if the module defines `sourceImage` it also reprocesses the images) → if you changed a `narration`, `npm run story-audio -- <mission>` (re-records only that clip, by hash). The scripts that need keys read them from `.env.local` and never print them (`ELEVENLABS_API_KEY`, `REPLICATE_API_KEY`).

**Adding another mission (recipe):**
1. dossiers in `misiones/<id>/dossiers` ([research-pipeline.md](research-pipeline.md));
2. images: `scripts/data/<id>-image-prompts.mjs` + `npm run story-images -- <id>` (→ `public/models/<id>/images`);
3. `scripts/data/<id>-story.mjs` with `NAME`, `TITLE`, `DOSSIERS`, `TERRAIN`, `ANCHORS` (the line the stops follow), `CLOSING`, `BEATS` and `PARTS` (copy the format of `opportunity-story.mjs`; add `STATIONARY = true` and `BASE = [x, z]` for a vehicle that never moved);
4. `npm run story-route -- <id>` and `npm run story -- <id>`;
5. `npm run story-audio -- <id>`;
6. import its `story.json` in `src/lib/story.ts` (`STORIES`), use `storyOf(<id>)!.checkpoints` in `missions.ts` and add its `AbandonedVehicle` to `bodies.ts` (see [themes-and-missions.md](themes-and-missions.md)). `SceneLoader` mounts `Journey` only if `storyOf` returns something.

Audit before accepting a new story or a data change: `npm run story-audit -- <mission>` (numbers and months against the dossier), `npm run story-audio -- <mission> --dry-run` (audio up to date) and a contact sheet of the illustrations (see [audit.md](audit.md)).

## The split before / after the 3D (Opportunity, as the reference)

| # | Event | Part | Date | Title (on screen) | Illustration |
| --- | --- | --- | --- | --- | --- |
| 1 | `opp001` | **intro** | 1987 | A robot geologist | Squyres drawing a rover |
| 2 | `opp005` | **intro** | 2000 | A gray clue from orbit | a screen with the hematite patch |
| 3 | `opp008` | **intro** | Aug 2000 | What if there are two? | a meeting room, "two rovers" |
| 4 | `opp015` | **intro** | Jul 7, 2003 | Liftoff at night | a Delta II lifting off |
| 5 | `opp018` | **intro** | Jan 24, 2004 | Six minutes of fall | control room, 9:05 pm |
| 6 | `opp021` | mars 1 | Mar 2, 2004 | Rocks soaked in water | press conference, "El Capitan" |
| 7 | `opp025` | mars 2 | Apr 2004 | Blueberries | hematite spherules |
| 8 | `opp028` | mars 3 | Nov 2004 | Burns Cliff | a wall of layers |
| 9 | `opp030` | mars 4 | Jan 6, 2005 | A rock from the sky | meteorite + heat shield |
| 10 | `opp033` | mars 5 | Apr 26, 2005 | Stuck in the sand | rover sunk in Purgatory Dune |
| 11 | `opp045` | mars 6 | May 25, 2011 | Goodbye, Spirit | a lone rover at dusk |
| 12 | `opp047` | mars 7 | Nov 2011 | The Homestake vein | a gypsum vein |
| 13 | `opp052` | mars 8 | May 15, 2013 | Beating the moon buggy | rover + ghost lunar buggy |
| 14 | `opp054` | mars 9 | Jan 8, 2014 | The jelly doughnut | a white rock with a red centre |
| 15 | `opp059` | mars 10 | Dec 2014 | A rover that forgets | photos falling apart (memory) |
| 16 | `opp062` | mars 11 | Mar 24, 2015 | A marathon on Mars | a finish line |
| 17 | `opp070` | mars 12 | May 30, 2018 | The storm approaches | MRO over the storm |
| 18 | `opp072` | mars 13 | Jun 10, 2018 | The last signal | the rover in the dust |
| 19 | `opp077` | **outro** | Feb 12–13, 2019 | Farewell, Opportunity | a silent control room |
| 20 | `opp081` | **outro** | Oct 11, 2026 | The torch passes on | Perseverance and Opportunity |

**Criterion:** "before the 3D" = what happens **before the vehicle is on the world** (idea, decision, launch and the fall; the landing closes the comic and the 3D starts with the vehicle already down). "In the 3D" = everything that happens with the vehicle **on the terrain**, including the two events with no place of their own (`opp045` Spirit, `opp059` memory): they are shown where the vehicle is at that point of the story. "After" = what happens when the vehicle no longer answers (the end declaration and Perseverance's record), in comic again.

The 3D positions are **not a real map** (the terrain is a scale model): `plan-story-route.mjs` spreads the stops along the terrain's route, each on flat ground (< 6° slope), with A\* legs over the slope map (max. 19°). With 13 stops the timeline shows no names under the markers (the line above says "Next: …") and the activation radius drops to 15.

## The narrations

- **Short and direct**: 34–57 words per clip; numbers spelled out so the voice reads them well; one idea per sentence. Voice **Bill**, `eleven_v4`, `mp3_44100_128`.
- **Each beat has three texts**: `summary` (≈ 25 words: the page footer and the card text), `narration` (the voice) and 3 `facts`. The subtitles come from `lib/transcript.ts` (only the audio is recorded; see [narration.md](narration.md)).
- **Status: all 120 clips are recorded** (20 per story). They play on their own across the whole flow: on arriving at each comic page and on entering each 3D stop, with the same phrase-by-phrase subtitle (`Captions`); `N` turns them on/off and the card's *Listen/Stop* button repeats them.

## The illustrations

- 20 AI images per story in **one style** (dirty graphic novel: thick ink, burnt orange/rust/brown/cream palette, a single warm light, risograph grain) at 4:5, generated with Google's Nano Banana 2.1 on Replicate. They are always labelled **"AI-generated illustration"**: they illustrate real facts, **they are not photos**. The sources of the facts (NASA/JPL, Planetary Society…) show as "facts: <editor>" under the illustration.
- In the comic they fill the page inside an ink frame; in the 3D the card is **vertical** (4:5, `imageRatio`).
- Some images carry text inside (clocks, "EL CAPITAN", "TWO ROVERS"): it is in English, like the rest; the calendar of `bgl032` shows weekday abbreviations and the "post" of `ins072` has illegible lines.
- Generation: `npm run story-images -- <mission>` (flags: `--dry-run`, `--only id,id`, `--force`, `--resolution 1K|2K|4K`, `--aspect`, `--concurrency`; it only generates what is missing and retries if Replicate rate-limits). Originals of 1856×2304 live outside the repo; the web version is 1040 px. Each story's vehicle is described the same way in every prompt so it is recognisable (`scripts/data/<mission>-image-prompts.mjs`, the shared `STYLE`/`ENDING` blocks). To redo one: edit its `scene`/`composition` and `npm run story-images -- <mission> --only <id> --force`. Known to check: the folder stamp of `spi001` shows the word "REJECTED".

## Disputed data between sources (and what was done)

| Event | Discrepancy | Decision |
| --- | --- | --- |
| `opp001` | "geological boots" and the approval year could not be confirmed; 1987 = start of 4 proposals | only what is verified is stated: 4 proposals 1987–1997, 3 rejected |
| `opp005` | hematite patch 300×500 km (ASU) vs 350×750 km (NTRS) | no size given: "a huge patch" |
| `opp008` | the date of the meeting (16 Jul 2000) and Goldin's quote were not confirmed | the official announcement of **10 Aug 2000** is told and the quote is not used |
| `opp015` | "cracked cork" (the tank insulation) and minutes to separation | "cracked insulation" is said and the separation datum is not given |
| `opp018` | 24 Jan (PST) vs 25 Jan (UTC) | **24 January, 9:05 pm PST** (Pasadena time) |
| `opp047` | "Matijevic Hill" is not in the sources read; Squyres' quote is not literal | only "Cape York"; no quote |
| `opp052` | LRV 35.744 km (official) vs 35.9 km (NSSDCA); "three days" | 35.744 km; no "three days" |
| `opp054` | sol 3540 vs 3541 | the date (8 Jan 2014) is given, not the sol |
| `opp077` | commands: > 1,000 (NASA) vs 835 (Planetary Society) | no number given; "217,000+" images yes |
| `opp081` | date 11 Oct 2026 (sol 2006): the most recent fact | as the dossier gives it (NASA source) |

The other stories avoid contested figures the same way (listed in [audit.md](audit.md) and in the header of each `scripts/data/<mission>-story.mjs`): e.g. Spirit leaves out the Goldin meeting date, the exact summit day (Sep 2005), the day of the 2009 entrapment (Apr 2009), the 60° tilt in Troy and the rover mass; Surveyor 3 rounds the TV pictures ("more than 6,300"), gives the Apollo 12 distance as "~160 m" and leaves out the arm reach; InSight leaves out how deep the mole got, the exact end day and the core radius without its year; Beagle 2 leaves out the lander mass and the cost.

## The six stories

| Story | Terrain | Comic (earth) | 3D stops | Comic (legacy) | Notes |
| --- | --- | --- | --- | --- | --- |
| **Opportunity** · Mars | `terrain.stl` | 5 | 13 | 2 | drives; the reference story |
| **Spirit** · Mars | `terrain.stl` (Meridiani, Opportunity's twin, as a stand-in for Gusev: Gale's mound was too steep, 30–40°) | 6 | 12 | 2 | drives; **backwards from Jul 2004** (`spi028`) and with the **front-right wheel locked from sol 779** (`spi040`); max route slope 15° |
| **Ingenuity** · Mars | `gale-terrain.stl` (as a stand-in for Jezero) | 5 | 13 | 2 | **flies** between stops and lands at each one |
| **Surveyor 3** · Moon | `moon-terrain.stl` (256 × 256 u, smaller, so the planner accepts per-mission settings: `BOUNDS`, `FADE`, `MIN_APART`, `SNAP_REACH`) | 6 | 11 | 3 | **stationary** (it stayed tilted in its crater after two bounces) |
| **InSight** · Mars | `terrain.stl` (flat, 1° slope, stand-in for Elysium Planitia) | 4 | 14 | 2 | **stationary** |
| **Beagle 2** · Mars | `gale-terrain.stl` (crater floor, 0° slope, stand-in for Isidis Planitia) | 6 | 12 | 2 | **stationary**; British/ESA, told because NASA's HiRISE found it in 2015 |

Totals: 120 illustrations and 120 narration clips (≈ 7 MB of audio per story; Opportunity 5,308 characters ≈ 2,123 credits; each other story ≈ 2,250–2,550 credits). The terrains are scale models: **the stops are not real places**.

### Stationary vehicles

`STATIONARY = true` and `BASE = [x, z]` in the mission's data module (`npm run story-route` writes N **equal** stops; `npm run story` sets `stationary: true` in the `story.json`; `lib/story.ts` exposes it as `Story.stationary` and `missions.ts` as `Mission.stationary`). In the 3D:

- **The vehicle does not move or have wheels** (`insight.ts`: three legs with round feet; `beagle2.ts`: lying on the ground; `surveyor3.ts`: a tripod with three feet). **Space** (one press, no repeat) goes to the next moment; a click on a timeline marker jumps to that moment. The chip says "Next moment", there is no guide chip (`G`) nor voice guide, no beacons or route on the minimap (only the vehicle's dot) and the timeline says "Going to…" / "The last moment".
- **The camera** makes a slow turn around the vehicle: one step (~0.5 rad) per moment, plus a soft drift. At the last moment "continue the story" appears, as in the others.
- How it works inside: [architecture.md](architecture.md#stationary-vehicles).
- **Possible improvement:** a scene that changes with the moment (InSight's seismometer and mole on the ground only after deployment, dust piling on the panels, the three elements found of Beagle 2). Today the vehicle is the same at every moment.

## Pending

- **Listen to the 120 narrations** (voice Bill; if one does not convince, edit its text in `scripts/data/<mission>-story.mjs` and run `npm run story -- <mission>` + `npm run story-audio -- <mission>`).
- Illustrations: the generator/tool credits are not shown yet and there is no high-resolution version; if a `webp` is wanted, adjust `build-story.mjs`.
- The voice guide is generic only (the per-checkpoint phrases were removed).
- The 3D uses scale-model terrains (Meridiani, Gale and the Moon): the stops are not real places.

## How it connects with the Decisions mode

`story/data/juego2_opportunity.json` (the verified decision game v2, 30 nodes and 6 decisions, see [`story/README.md`](../story/README.md)) is built on the same events. When the mode is built, each decision is **inserted before the real beat that matches it** (its correct option leads to that beat and the wrong ones to a branch with `hipotetico: true` that ends in a failure): the structure of `story.json` (ordered `beats` with `part`) is the backbone of [game-design.md](game-design.md#4-the-backbone-a-single-line-of-nodes). **It is not implemented.**
