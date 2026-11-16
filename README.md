# Left Behind — the stories of the machines NASA left on Mars and the Moon

An interactive, story-driven web experience for **NASA Space Apps Challenge 2026** ("Abandoned but not Forgotten"). Spin a globe of Mars and the Moon, pick an abandoned vehicle and **travel to the past**: each story runs from the first idea to the last signal as a narrated comic, a 3D drive across the terrain, and a closing comic. Every stop is a real, sourced event. Built for secondary-school students.

> **Focus:** a game of stories with two planned modes — **Story** (implemented for **Opportunity, Spirit, Ingenuity, InSight, Beagle 2 and Surveyor 3**: comic 2D → 3D route → comic, 20 real events each) and **Decisions** (designed, not built). See [`docs/story.md`](docs/story.md) and [`docs/game-design.md`](docs/game-design.md). Vehicles without a story yet (Perseverance, SEV) appear on the globe as "coming soon" and their 3D does not open.

**Stack:** Next.js 16 (App Router) · React 19 · three.js + `@react-three/fiber` + `@react-three/drei` · Tailwind 4 · TypeScript. The interface and audio are in **English**.

## What it includes

- **Home (`/`):** one animated composition (periwinkle palette): **Opportunity in 3D, big and still**, and four floating cards with illustrations of the stories (decoration: they open nothing). A spinning badge and a "start" button open the globe; a click anywhere throws sparkles; layers move a little with the pointer.
- **Globe (`/moon`, `/mars`):** a wireframe globe (a fine grid, only the front, black squares that orbit with it, small vehicles sunk into the ground) that **spins by itself** and can be turned on two axes (its own and the pitch, never rolling; with inertia; while you steer it the visible face always shows some vehicle, and on release the lean returns by itself) and zoomed with the wheel (only the globe and the vehicles scale). A Moon/Mars text switch on the left, a music icon and a Credits button on the right, and a vehicle's marker → its card with the vehicle illustrated in 3 tones → **"Travel to the past"** opens `/<world>/<vehicle>`; without a story the button says **"Coming soon"**. `Esc` closes the card.
- **Six stories:** Opportunity, Spirit and InSight (Mars, Meridiani terrain), Ingenuity and Beagle 2 (Mars, Gale terrain) and Surveyor 3 (Moon). Each has an opening comic, a 3D route and a closing comic with a closing card.
- **One theme, "Ink & Paper"** (comic; reference [ponpon-mania.com/chapter/2](https://ponpon-mania.com/chapter/2)) with a **palette per world**: a field with grain — **terracotta `#E2603A` on Mars, steel blue `#4B7DB8` on the Moon** —, cream paper `#FEECE3` with a 3 px ink stroke `#171717`, one accent per world (**butter `#FFC247` on Mars, mint `#6BE3C3` on the Moon**), pill buttons, Libre Franklin, 3-tone vehicles and smooth motion. See [`docs/design.md`](docs/design.md).
- **Minimap** with relief (contour lines), the route (done and pending), heading, position and speed.
- **Timeline** (a bar at the bottom): a marker per checkpoint and the vehicle's progress; you can only travel to checkpoints (click a marker).
- **11–14 stops per story** (one per real event): a 3D beacon (pole + gem + ring on the terrain), a numbered diamond on the minimap and an **information card** (bottom left): the AI illustration fills the card's width and below it the title, progress, "listen", summary, 3 facts and up to 3 links to the sources.
- **Narration** (ElevenLabs, voice Bill): plays on each comic page and each stop and stops when you leave. The audio is **pre-recorded** in the repo; the app calls no API at run time.
- **"Mission control" voice guide** (voice Daniel): 30 short pre-recorded phrases that orient the player, with a subtitle; sparse, contextual and never over the narration.
- **Background music** (a bed per place) that lowers while someone speaks.
- **On mobile:** every view is adapted to small screens, sideways too: the home has its vertical composition; on the globe you **pinch** to zoom and the card is a bottom sheet; in 3D there is a **"hold to drive"** (or "next moment") button and toggles for narration/guide/music instead of keys, with no minimap. See [`docs/design.md`](docs/design.md#responsive).
- **Credits:** a "Credits" card on the globe and the home and a "created by" line on every closing card (Jackson Merma, AI & Software Engineer; Paul Luque, Full Stack Developer).

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
npx tsc --noEmit   # types
npm run story -- <mission>        # regenerates public/models/<mission>/story.json from scripts/data/<mission>-story.mjs
npm run story-audio -- <mission>  # (optional) records/re-records a story's narration; needs ELEVENLABS_API_KEY in .env.local
npm run story-audit -- <mission>  # checks the numbers and months of a story against its research dossiers
npm run guide      # (optional) records/re-records the voice guide; `-- --docs` updates the phrase catalogue in docs/guide.md
```

To play, **no key or environment variable is needed**. The ElevenLabs and Replicate keys are only used by the generator scripts (see [`docs/narration.md`](docs/narration.md); the template is `.env.example`, `.env.local` is git-ignored).

## Controls

| Key / action | Effect |
| --- | --- |
| Drag the globe | (globe) Turn it on two axes; on release it keeps turning with inertia and the lean returns to the initial one |
| Wheel / `Ctrl`+wheel / pinch / `Ctrl` +, −, 0 | (globe) Zoom **only the globe and the vehicles**; limits 0.75–2.6 |
| Click a marker | (globe) Open the vehicle's card |
| `Esc` | (globe) Close the card |
| `Space` (hold) | Advance along the route to the next checkpoint; it stops there (release and press again to go on) |
| `Space` (press) | **InSight, Beagle 2 and Surveyor 3** (stationary modules): go to the next moment of the story (a new card and narration; the module does not move) |
| Click a timeline marker | Automatic trip to that checkpoint (forward or backward) |
| `N` | Turn the automatic narration on/off (remembered in `localStorage`: if "nothing sounds", check it is not off) |
| `S` / the globe's speaker button | Background music on/off |
| `G` | Voice guide on/off |
| The **Listen / Stop** button of the card | Hear/stop the current checkpoint's narration |

In the scene, top left is `← story` (back to the last comic page) and top right `skip the 3D`. The vehicle is decided by the URL. Narration/guide/music preferences are remembered (`localStorage`: `poc-narration`, `poc-guide`, `poc-ambient`).

## Routes

| Route | View |
| --- | --- |
| `/` | the **home**: one composition with illustration cards and Opportunity in 3D; "start" and the badge open the globe (`/mars`); the globe's logo returns here |
| `/moon`, `/mars` | the globe with the world selector (switching world does not reload) |
| `/mars/opportunity`, `/mars/spirit`, `/mars/ingenuity`, `/mars/insight`, `/mars/beagle-2`, `/moon/surveyor-3` | the vehicle's story (`/<world>/<mission id>`): comic → 3D → comic; the other vehicles redirect to the globe; `/mars#opportunity` opens the globe with the card |

Each route downloads only its own: the globe does not load the scene, and the scene only its terrain and its vehicle's model.

## The stories

| Story | Terrain | 3D stops |
| --- | --- | --- |
| **Opportunity · Mars** | `terrain.stl` | 13 (from the water-soaked rocks of Eagle Crater to the last signal) |
| **Spirit · Mars** | `terrain.stl` (a Gusev stand-in; Gale's mound was too steep) | 12 (from the reboot loop of sol 18 to the last signal in Troy) |
| **InSight · Mars** | `terrain.stl` (flat, an Elysium Planitia stand-in) | 14 **moments** (the module does not move; Space steps to the next) |
| **Beagle 2 · Mars** | `gale-terrain.stl` (the crater floor, an Isidis Planitia stand-in) | 12 **moments** (the module does not move) |
| **Ingenuity · Mars** | `gale-terrain.stl` (a Jezero stand-in) | 13 (from the Flyer 1 fabric to flight 72) |
| **Surveyor 3 · Moon** | `moon-terrain.stl` | 11 **moments** (from the failing radar to Apollo 12's visit; the module does not move) |

Each story is **20 real events** researched in dossiers (`misiones/<mission>/dossiers`): the first 4–6 are comic (until launch or landing), the next ones are the 3D stops and the last 2–3 are the closing comic. The data lives in `public/models/<mission>/story.json` (generated with `npm run story`; the copy is in `scripts/data/<mission>-story.mjs`). The terrains are scale models: the stops are not real places. In 3D, **Opportunity and Spirit drive** (Spirit backwards from Jul 2004 and with the front-right wheel locked from sol 779), **Ingenuity flies** between stops and lands at each, and **InSight, Beagle 2 and Surveyor 3, which never moved, are not driven**. What was verified and what is left: [`docs/audit.md`](docs/audit.md). Recipe to add another: [`docs/story.md`](docs/story.md).

> ⚠️ The vehicles are **not at real scale** relative to the terrain (200–2000× bigger). A conscious proof-of-concept decision; unresolved: see [`docs/roadmap.md`](docs/roadmap.md).

## Repository layout

| Folder | What it is |
| --- | --- |
| `src/`, `public/`, `scripts/`, `docs/` | The web app, its assets (terrains, illustrations, narration, music), the generator scripts and the documentation |
| `misiones/`, `timelines_v0/`, `agents/`, `.claude/skills/` | The research pipeline (dossiers, base timelines, the research agent, the `mars-*` skills): [`docs/research-pipeline.md`](docs/research-pipeline.md) |
| `story/` | The research team's Opportunity decision-game and story-viewer prototypes: [`story/README.md`](story/README.md) |

## Documentation

Start with **[`docs/README.md`](docs/README.md)** (the index). What to read for what you want to do:

| I want to… | Read |
| --- | --- |
| Resume the project after a while | [`CLAUDE.md`](CLAUDE.md) (rules and state) → [`docs/history.md`](docs/history.md) ("Current state") → [`docs/roadmap.md`](docs/roadmap.md) |
| See how a story is made (data, images, audio, 3D route) | [`docs/story.md`](docs/story.md) |
| Understand where the facts come from | [`docs/research-pipeline.md`](docs/research-pipeline.md) |
| Change Mars/Moon colours or touch the UI | [`docs/design.md`](docs/design.md) ("Palette per world") |
| Understand how the code works | [`docs/architecture.md`](docs/architecture.md) |
| Add a vehicle (with its marker on the globe), a style or a checkpoint | [`docs/themes-and-missions.md`](docs/themes-and-missions.md) |
| Record or change the narration voice | [`docs/narration.md`](docs/narration.md) |
| See/change the voice guide's phrases and when they play | [`docs/guide.md`](docs/guide.md) |
| Know what is in `public/models`, `images`, `audio` and `guide` | [`docs/assets.md`](docs/assets.md) |
| Avoid problems already solved / test in the browser | [`docs/gotchas.md`](docs/gotchas.md) |

> `AGENTS.md` (generated by Next) warns that this version of Next has breaking changes; when in doubt, consult `node_modules/next/dist/docs/`.
