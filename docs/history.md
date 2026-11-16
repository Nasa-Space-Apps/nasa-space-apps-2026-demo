# Project history

What was built, in order, with the decisions and the why. It is a condensed record: the full detail of every change is in git history. Read "Current state" first to recover the context.

## Current state

**Branch `master` (= `dev`), Nov 2026 — the starting point to resume the project:**

- **Product:** a game of stories with a globe as the menu before it. `/` is the cover; `/moon` and `/mars` are the globe (a turntable on two axes — its own and the pitch, no roll — with a limit so a vehicle is always on the visible face, its own zoom, and one vehicle sunk into the ground at each abandoned site); "travel to the past" opens `/<world>/<vehicle>`. **Six vehicles have a complete story** — Opportunity, Spirit, Ingenuity, InSight and Beagle 2 (Mars) and Surveyor 3 (Moon): a 4–6-page comic → a 3D route of 11–14 stops (one per real event; in **InSight, Beagle 2 and Surveyor 3, which never moved, "moments": Space goes to the next and the module does not move**) → a 2–3-page closing comic + a closing card, with 20 AI illustrations, 20 narrations by Bill (120 in total) with subtitles and up to 3 sources per stop. Perseverance and SEV appear on the globe as "coming soon" (their 3D does not open; no dossiers). **The Decisions mode is defined ([game-design.md](game-design.md)) and not implemented.** The credits (Jackson Merma and Paul Luque) are on the globe and the home and on every closing card. It is responsive (phone, tablet, desktop).
- **Design:** one theme, "Ink & Paper" (comic + flat) with a **palette per world** (Mars terracotta + butter, Moon steel blue + mint, the home periwinkle + pink); the vehicles are 3-tone and keep their own colour. See [design.md](design.md).
- **Data and scripts:** everything of a story lives in `public/models/<mission>/` (`story.json`, `images/`, `audio/`), generated with `npm run story-images | story-route | story | story-audio -- <mission>` from `scripts/data/<mission>-*.mjs`; the research dossiers are in `misiones/<mission>/dossiers` (delivered by the team). Recipe in [story.md](story.md). The app needs no keys or network to play; the keys (`ELEVENLABS_API_KEY`, `REPLICATE_API_KEY`) are only used by the scripts, read from `.env.local` (never read or printed).
- **Verification:** `npx tsc --noEmit` and `npm run lint` clean; every UI change was checked in the browser (method in [gotchas.md](gotchas.md)). **Not tested:** the served build (`npm run build && npm start`) in a browser, driving every Spirit/Surveyor 3 stop by hand, and the 3D card on low or vertical screens.
- **Known debts:** real vehicle scale, scale-model terrains (Spirit on Meridiani, Ingenuity on Gale), unreviewed narrations, non-persistent `visited`. Prioritised list: [roadmap.md](roadmap.md) ("Next").
- **The owner's working conventions:** replies in Spanish; code and identifiers in English; interface and audio in English; documentation in English; conventional commits **with no AI attribution**, only when asked; `agents/` and `story/` belong to the team. See [`../CLAUDE.md`](../CLAUDE.md).

## The owner's preferences (accumulated)

- A full-screen 3D scene in the look of [bruno-simon.com](https://bruno-simon.com/) (a raised 3/4 camera, stylised terrain, a small vehicle). Since milestone 14, **no free driving**: a fixed route, `Space` and a timeline.
- **UI:** flat design, simple, without glows, gradients or "produced"/"AI" elements. Bold palettes with defined borders. Not realistic: for the globe, textures were tried and dropped in favour of a wireframe "star chart".
- Prefers **routes per view** so each loads only what it needs; prefers **generating costly content once** (audio) and keeping it as an asset instead of depending on an API at run time.
- The vehicles are **new procedural drawings** in 3 tones, not a style layer over GLBs.
- Starts the dev server himself (asked not to leave any running) and decides when a commit is made.

## Milestones

**Foundation (1–13).** A Next.js project (App Router, TypeScript, Tailwind) with three/R3F: a full-screen scene with terrain from NASA STL models, a rover following the terrain, dust, tracks and a follow camera; a **height map** rasterised once from the STL (`heightAt`) instead of per-frame raycasts; a minimap with contour lines (marching squares); a theme system in `themes.ts`; a "mission" concept (`missions.ts`: terrain + vehicle + environment); storytelling checkpoints with cards and beacons; **ElevenLabs narration** — first at run time, then **pre-recorded** (the owner prefers generating it once: voice Bill, `eleven_v4`) — and the **"mission control" voice guide** (voice Daniel, anti-saturation rules).

**14. A fixed route.** Free driving was removed: each vehicle follows a route through its checkpoints (A\*-planned `via` points over the slope map), `Space` held advances to the next stop, and a **timeline** lets you travel (forward or backward) only between checkpoints.

**15–17. The globe.** The entry became a wireframe globe (Mars, Moon) with a marker per abandoned vehicle → a card → "Travel to the past" (the scene of before). Realistic textures were dropped for a light line-grid; the globe became an **orthographic** camera; **routes per vehicle** (`/moon/sev`, `/mars/opportunity`) with per-route resource loading. Flat design was fixed as a rule.

**18–21. New vehicles and theme.** Procedural 3-tone vehicles replaced the GLBs; the whole demo moved to the "Primer" look and then, at milestone 30, to "Ink & Paper". Smooth motion everywhere; a bug where returning to the globe left a blank page (a fade state kept alive by Next) was fixed.

**22–24. Performance, loading and music.** The `light` perf profile (`dpr` ≤ 1.5, no antialiasing in the scene, 30 fps when stopped, **views released when not current**: scene GPU 26 % → ~10 %); a single loading screen with real progress and fades on every transition; three background beds (ElevenLabs Music) that duck under the voice.

**25–28. Credits, more vehicles, detail.** A "created by" card; Perseverance (a test vehicle) on Gale terrain; vehicles redrawn with detail measured on the GLBs (7 draw calls each, via a merged-mesh `Kit`); four demo vehicles (Spirit, Ingenuity, InSight, Beagle 2) with fictional stories and borrowed audio (later all replaced by real stories).

**29. The shift to a game.** The owner and their teammate turned the project from an informative platform into a **game with two modes** (Story, Decisions) centred on Opportunity and covering the whole mission. Only the definition was written ([game-design.md](game-design.md)).

**30. "Ink & Paper".** The whole look changed to the comic reference ([ponpon-mania.com/chapter/2](https://ponpon-mania.com/chapter/2)): a flat field with grain, cream paper with a thick ink stroke, pills, Libre Franklin. This also answered how the Part 1 illustrations should look.

**31–35. The globe as a game menu.** Tiny 3D vehicles at each site, then **melted into the ground** ("symbiote": one mesh, a height-map melt, tilted back, turning to face the viewer, jelly motion); a floating card beside the selected vehicle; the world switch as text; game-like pops (`THEME.pop`); and a fix for black shards that showed around InSight on hover (the patch corners rose above the surface when the marker grew).

**36–38. The Opportunity story.** The team delivered 20 dossiers and illustrations; the story became **comic → 3D → comic** with real events, a vertical 3D card with the illustration, short narrations, a preparation screen that preloads audio into memory (a `new Audio()` not in the DOM lost its buffer and re-requested the mp3: seconds of "loading" with no subtitles), "skip the 3D" and a fix for a 6.4 s main-thread block when mounting the scene behind the comic.

**39–45. More stories.** Generic per-mission scripts and standard folders (`public/models/<mission>/`); Ingenuity (illustrations generated with Nano Banana 2.1 on Replicate), Surveyor 3 (first only the 3D model, then the whole story on the Moon) and Spirit (on Meridiani, since Gale's mound was too steep); the dead code of the old checkpoints and demo vehicles was removed; `public` went from 139 MB to 47 MB.

**46–53. Palette per world, UI and stationary vehicles.** Mars and the Moon got their own palette (`WORLDS`, `themeFor`, `useTheme`); the globe became a **free turntable** with a vehicle limit, its own zoom (with limits) and straightening on release; the 3D card shows the illustration at full width; the **InSight and Beagle 2** stories were added as **stationary vehicles** (Space steps through moments; a virtual route and a time cursor); the "created by" card came back visible with both authors.

**54. Audit of the information.** A vehicle-by-vehicle review (numbers and months against the dossiers, audio against hashes, illustrations against events, globe coordinates against NASA sources); fixes (Ingenuity's real position, Surveyor 3 stationary and wheelless, Spirit reverse driving and the dead wheel from sol 779, Ingenuity taking off and landing) and ten documented TODOs: [audit.md](audit.md).

**55. Home.** A single composition (illustration cards + Opportunity in 3D, its own periwinkle palette, a spinning badge, sparkles on click) after several iterations in which the owner rejected carousels, background images, slogans and extra vehicles; a bug where the home came out blank when returning from the globe was fixed (same rule: reset transient state on mount).

**56. Responsive.** Every view works on phone, sideways phone and tablet (`useViewport`, a compact HUD, touch controls, pinch on the globe, a bottom sheet for the card).

**After 56 (Nov 2026).** The **tab icon** (a rover's camera mast: `favicon.ico`, `icon.svg`, `apple-icon.png`); a **30-second pitch video** built with Remotion reusing the app's own components, theme, data, vehicles and terrain (kept locally in `video/`, git-ignored); and a **repository clean-up** that removed the obsolete decision-game v1 and local tool state, consolidated the research documentation and translated all the documentation to English.

## Important technical decisions

| Decision | Reason |
| --- | --- |
| Shared state in a mutable object (`game`) | The scene and the DOM read the same state without re-rendering React 60 times a second. |
| A rasterised height map instead of raycasting | Much faster, and it lets the minimap and the physics share one source. |
| The minimap on a 2D `<canvas>` with a bake + a dynamic layer | The background (contours) is computed once; each frame only the route and the marker are painted. |
| Theme tokens as data (`themes.ts`) | A new look or world = a new object, with no component changes. |
| `react-hooks/immutability` disabled | False positives with the imperative mutation of `useFrame`. |
| Procedural 3-tone vehicles | The flat style of the references; independent wheels (they spin); no GLBs or wheel detection. |
| A vehicle = 1 mesh + 1 per wheel, tone per vertex | Detail costs no draw calls: hundreds of pieces are baked into one geometry with one material. |
| A theme per world: `BASE` + `WORLDS`, `useTheme()` from the route | Mars and the Moon need different colours without duplicating the theme; the world comes from the URL, which the globe's `pushState` already syncs. Inside R3F (no context) the mission is used. |
| Globe zoom in the camera, not in CSS/scale | Only the globe and the vehicles scale; the DOM keeps its size and follows the projected positions. |
| The 3D card's illustration with `maxHeight` by `100vh` | A 4:5 image at full width does not fit on low screens: it is trimmed a little instead of pushing the card off screen. |
| Pre-recorded audio with timings computed on the client | No API at run time; subtitles with no timestamps to request or re-record. |
| A research pipeline with code-verified quotes | "Verified" must be checkable: every fact carries a URL and a literal quote found in the text that was read. |
| Stationary vehicles as a virtual route with a time cursor | The timeline, card, narration and minimap are reused unchanged for vehicles that never moved. |
