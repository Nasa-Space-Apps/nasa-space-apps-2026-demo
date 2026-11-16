# Roadmap / pending

> **Current priority:** the Story mode is done for six vehicles; the next big piece is the **Decisions mode** ([game-design.md](game-design.md)). The full list of data TODOs with their default values is in [audit.md](audit.md#todo-documented-default-values).

## Next (what to do when resuming)

State (Nov 2026): 6 complete stories (Opportunity, Spirit, Ingenuity, Surveyor 3, InSight, Beagle 2) with comic, 3D, narration and sources; a palette per world; a free globe; a 3D card with the illustration at full width; a home page; responsive layouts. Candidates, in the order they fit what was asked so far:

1. **Listen to the 120 narrations** and review the 120 illustrations (the folder stamp of `spi001` says "REJECTED"); re-record only what does not please (`--only`).
2. **More stories:** Perseverance and SEV stay "coming soon" (no dossiers). Recipe: [story.md](story.md).
3. **3D scenes that change with the moment** in the stationary vehicles (InSight's seismometer and mole only after deployment, dust on the panels, what was found of Beagle 2 in 2015): today the model is the same at every moment (see [story.md](story.md#stationary-vehicles)).
4. **Decisions mode** (defined in [game-design.md](game-design.md), not implemented; the 30 nodes of Opportunity are in `story/data/juego2_opportunity.json`).
5. **A real terrain of Gusev, Jezero, Elysium and Isidis** (Spirit uses Meridiani; Ingenuity and Beagle 2 use Gale; InSight uses Meridiani): the stops are not real places.
6. **Align each vehicle's colour with its world's palette** (today: Spirit violet, Ingenuity amber, Opportunity coral, Surveyor 3 olive).
7. Check the 3D card on small screens (≤ 720 px tall) and vertical ones, and test the touch gestures (pinch, hold-to-drive) on a **physical phone**.
8. Old debts: real scale of the vehicles (below), non-persistent `visited` progress, the served production build (`npm run build && npm start`) never tested in a browser.

Ideas and technical debts, in no strict order. ⭐ = what best fits what the owner asked for.

## ⚠️ Unresolved: real scale of the vehicles

**Today the vehicles are heavily oversized relative to the terrain** (a conscious proof-of-concept decision; left as it is "for now"):

| | Terrain | ≈ m per unit | Real vehicle size | In the scene | Oversize |
| --- | --- | --- | --- | --- | --- |
| Opportunity · Mars | ~263 × 356 km → 559 × 762 u | ~470 m | 2.3 × 1.6 × 1.5 m | ~10 × 15 u ≈ 4.7 × 7 km | ~2000× |
| Surveyor 3 / SEV · Moon | ~30 × 30 km → 255 × 255 u | ~118 m | 4.5 × 4 × 3 m (SEV) | ~8 × 12 × 8 u ≈ 0.9 × 1.4 km | ~200× |

Sources: NASA 3D Resources sheets (Opportunity Landing Site / Apollo 14 – Landing Site; the vertical axis is also exaggerated, ×35 on the Moon) and technical sheets of the MER and the SEV. The `scale` values in `missions.ts` only equalise the apparent size between vehicles. The STLs are relief scale models and cannot be used 1:1 (Opportunity would measure ~0.005 u). Options:

1. **Stay stylised** and at least fix the proportion *between* vehicles.
2. **Real terrain at rover scale**: replace the STLs with a high-resolution DTM cut to a few hundred metres (HiRISE for Mars; LROC NAC at 0.5 m/px for the Moon). Then 1 u = 1 m, the vehicle would be real and the speeds (now arbitrary: 18–42 u/s) would make physical sense. The checkpoints would need to be repositioned.

## Done (latest version of the demo)

- ✅ **Six stories** (Opportunity, Spirit, Ingenuity, Surveyor 3, InSight, Beagle 2) with the same flow (comic → 3D → comic, narration, sources); generic per-mission scripts; stationary vehicles (InSight, Beagle 2, Surveyor 3); vehicles without a story with "coming soon".
- ✅ **A palette per world** (Mars terracotta + butter, Moon steel blue + mint) and UI polish: a globe turning on two axes with its own zoom, a music icon button, an accent "skip the 3D", the "05. Title" label in the comic, a 3D card with the illustration at full width.
- ✅ **Audit** of all the information (milestone 54): see [audit.md](audit.md).
- ✅ **Credits** (milestone 53): the "created by" card and the line on each closing card.
- ✅ **Home** (`/`): one composition (cards with illustrations + Opportunity in 3D), its own palette, parallax, sparkles and a badge that opens the globe; the globe's logo goes back to it. Pending: a hand-drawn logo and measuring the cost of the two canvases on the owner's laptop.
- ✅ **Responsive**: phone, sideways phone and tablet in home, globe, comic and scene (compact HUD, touch controls, pinch on the globe). Pending: a physical phone; the sideways scene is tight on space.
- ✅ **Tab icon** (the rover's camera mast): `src/app/favicon.ico`, `icon.svg`, `apple-icon.png`.
- ✅ **Pitch video** (30 s): built with Remotion from the app's own UI (kept locally in `video/`, git-ignored).
- ✅ Base features: a ruled route (no free driving: `Space` held and a timeline), minimap with contours, dust, tracks, follow camera, pre-recorded narration with subtitles, a voice guide, background music, routes per vehicle with per-route resource loading (`cacheComponents` + `generateStaticParams`), the performance profile ([performance.md](performance.md)).

## Smaller globe and route items

- The marker sits slightly right of the globe's centre when focused (perspective: the globe is shifted right of the camera); it could be compensated in `faceAngle`.
- The orbiting squares hide with the globe's centre plane (not by real occlusion): one near the edge can vanish before being covered.
- Invalid routes (`/nope`, `/moon/opportunity`) return **200** with the 404 page (a limitation of streaming with `cacheComponents`).
- Keyboard on the globe: only `Esc`; arrows/`Tab` for the world selector and accessibility of the markers could be added.

## Product

- **Route / timeline**: test "`Space` toggles play/pause" against "hold"; cruise speed and the speed of the automatic trip; show the estimated time/distance on the bar; arrow-key shortcuts for the previous/next checkpoint; a key to return to the start.
- ⭐ **Storytelling**: persistent progress in `localStorage` (today `visited` is lost on reload), a more complete end-of-story screen, own or higher-resolution images.
- **Narration**: a different voice per world, a volume control, SFX. **Voice guide**: tune thresholds/cooldowns with real play (`QUIET`, `cool(...)` in `guide.ts`), a verbosity level in the UI, a volume independent of the narration.
- **Checkpoint interaction**: a key to pin/close the card, a gallery, "learn more" links.
- **Internationalisation**: the interface and audio are fixed in English; another language needs extracting the texts and re-recording the audio.
- **Sound**: engine and dust effects. **Sky**: stars/Earth on the Moon, a gradient on Mars (the camera hardly sees the sky now).
- Ideas from NASA's "Eyes" apps (Eyes on Curiosity: Rover Replay, Highlights, an orbital camera, a panel of 7 rover cameras; science.nasa.gov/eyes: a `curiosity-static.glb` — **check the licence before use**): an accumulated route with **date/sol per checkpoint** and distance driven; alternative cameras (overhead following the route, close to the vehicle); markers on the terrain with a photo/description; on the globe, the **whole trajectory** and more abandoned vehicles (Sojourner, Lunokhod, the Apollo LRV…).

## Visual / technical

- **Tracks with fade-out** (they disappear only when the 2,600-mark ring is recycled).
- **Stable shadows**: snap the light's frustum to the texel to avoid flicker while moving.
- **Environment map** (`Environment` with `Lightformer`) to recover metallic materials without them coming out black (not needed with the procedural vehicles).
- **Draco offline**: host the decoder in `public/draco/` (not used since the GLBs were removed).
- **Weight of `public`**: clean (~80 MB); each story's mp3s are ~7 MB (`mp3_44100_64` would halve them).
- **Modest hardware**: the scene can drop to ~1 fps if another tab has WebGL open; consider a lower `dpr`, cheaper shadows or a "light" mode (the `light` perf profile already does part of this).
- **Vehicles**: remake them at real scale when "real scale" is solved, and animate parts if wanted (a mast that turns, suspension that articulates, steering wheels).
- **Terrain in the same style** (3-tone height bands, no gradients).
- **Tests**: none for the app. Easy candidates: `buildHeightField`/`heightAt`, `findSpawn`, marching squares. (The research agent and the decision-game data have their own free tests.)

## Quality

- Test the served production build (`npm run build && npm start`) in the browser; `npm run build` already compiles without errors.
- Review the accessibility of the selectors (ARIA roles, keyboard focus — today `blur()` is called after a click so as not to interfere with `Space`).
- Test in a browser with no cache and no internet (nothing external is needed to play except Google Fonts at build time).
