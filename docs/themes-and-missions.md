# Theme and vehicles

## The theme — `src/lib/themes.ts`

The demo has **a single theme, "Ink & Paper"** (comic; reference: ponpon-mania.com/chapter/2). There is no style selector (the earlier themes were removed; they are in git history). Rules and values: [design.md](design.md).

**Palette per world:** `BASE` (not exported) holds everything shared (ink, paper, radii, motion, minimap, the ground of both worlds…) and `WORLDS` the colour that changes with the world (`canvas`, `canvasAlt`, `accent`, `accentSoft`, `beacon`): **Mars** terracotta + butter, **Moon** steel blue + mint, **home** periwinkle + pink. `themeFor("mars" | "moon" | "home")` returns the full `Theme` (cached); `worldOfPath(route)` gives the world of a URL; `useTheme()` (`lib/use-theme.ts`) reads it from the route in UI components. `THEME` (the Moon's theme) stays only as a default value. **To add a world:** an entry in `WORLDS`, its `ground` in `BASE` and its case in `worldOfPath`.

The theme (type `Theme`) is the **single source of truth** of the tokens: `WorldVars.tsx` (and a script in the `<head>` of `app/layout.tsx`, for the first paint) publishes them as CSS variables (`cssVars(themeFor(world))` → `--canvas`, `--surface`, `--ink`, `--accent`, `--radius`, `--ease`, `--dur-*`…) for the `.ui-*` classes of `globals.css`, and the canvas/WebGL code (minimap, globe, beacons) reads the object directly. **To change a colour or a radius, edit only `themes.ts`.**

Fields of `Theme`:

- **Fonts:** `font` (text) and `mono` (labels, buttons, numbers); loaded with `next/font/google` in `layout.tsx` (`--font-sans`).
- **Colour:** `canvas` (background), `surface` (cards), `ink`/`inkSoft` (text and primary button / its hover), `muted`, `line`, `accent` (the single colour; changes with the world) and `accentInk`.
- **Shape and motion:** `radius` (panels), `radiusSm` (buttons, chips), `stroke`, `grain`, `ease` (the curve of **all** transitions), `pop` and `dur { fast, base, slow }` in ms.
- **Minimap:** `map { bg, minor, major, minorW, majorW, every }` (contour lines), `trail`, `marker { dot, ring, arrow }`, `checkpoint { pin, done, ring }` (numbered squares).
- **3D beacons:** `beacon { pending, active, done }`.
- **Globe:** `globe { bg, line, star, ink, tag, tagText, pin, vehicle }` (`bg`/`line`/`vehicle.mid` come from the world).
- **World:** `ground { mars, moon, lines }` (the 3D ground of each world; it does not depend on the current world).

Shared DOM styles: `lib/ui.ts` (`ui(theme)` → `label`, `display`, `title`, `text`, `panel`, `value`; `ease(theme, props, ms?, delay?)` for `transition`) and `components/Reveal.tsx`. The pieces with states are the classes `.ui-btn` (`.is-ghost`, `.is-accent`, `.is-active`), `.ui-fab` (a round disc; `-md` = the music button, `-sm` = the X), `.ui-link` (`.is-back`), `.ui-row`, `.ui-nav`, `.ui-world`, `.ui-marker`, `.ui-drive` and `.ui-toggle` of `globals.css`. For a new font: load it with `next/font/google` in `layout.tsx`, expose it as a CSS variable and use it in `font`/`mono`.

## Vehicles + terrain (missions) — `src/lib/missions.ts`

A mission is a `Mission` object of the `MISSIONS` array. Its route is `/<world>/<id>` (the vehicle must also be added to the world where it was abandoned in `lib/bodies.ts`).

```ts
{
  id: "surveyor-3",                 // stable key (localStorage, route)
  name: "Surveyor 3 · Moon",        // selector label
  title: "Surveyor 3 · Oceanus Procellarum",   // minimap title
  terrainUrl: "/models/moon-terrain.stl",
  terrain: { fade: 30, lo: "…", hi: "…", edge: "…", lines: "…", step: 1.9 },  // border width flattened, ground tones, contour step
  rover: {
    model: "surveyor3",             // procedural model of lib/vehicles/ ("opportunity" | "sev" | "perseverance" | "spirit" | "ingenuity" | "insight" | "beagle2" | "surveyor3")
    palette: { dark: "#5C7A1F", mid: "#B3CC6A", light: "#F1F7DC", bg: THEME.paperLight },   // 3 tones of one colour + the plain background of its card
    maxSpeed: 14, boostSpeed: 26,   // maxSpeed = Space held; boostSpeed = automatic trip (timeline)
    heading: -Math.PI * 0.75,       // (unused: the heading comes from the route)
    reverseAfter?, deadWheelAfter?  // Spirit only (see architecture.md)
  },
  env: { sky, fogNear, fogFar, hemi: [sky, ground, intensity], sun: { color, intensity, offset } },  // sky = themeFor(<world>).canvas
  dust:   { color, drag, lift, up, life, size, alpha },
  tracks: { color, opacity },
  checkpoints: storyOf("surveyor-3")!.checkpoints,   // from the mission's story.json (src/lib/story.ts); `[]` = "coming soon"
  checkpointRadius: 14,             // activation radius (and beacon size); ~1.5× the vehicle's width
  stationary?: boolean,             // the vehicle never moves (InSight, Beagle 2, Surveyor 3)
}
```

### Recipe

1. Copy the terrain (STL) to `public/models/` and document it in [assets.md](assets.md). STLs from Blender are **Z-up** and are rotated by themselves.
2. **Create the vehicle** in `src/lib/vehicles/<id>.ts`: a function that draws with the `Kit` (`lib/vehicles/kit.ts`: `box`, `cyl`, `tube`, `ball`, `ring`, `prism`/`slab`/`panel`, `lathe`, `loft`, `wheel` + `tyre`, `at`), moves along **+z**, with the wheels on y=0 and centred on x/z; add it to `buildVehicle` and the `VehicleModel` type (`lib/vehicles.ts`), and a low-detail version for the globe in `mini.ts`. Style and rules: [design.md](design.md#vehicles). **Measure before drawing**: take from the reference GLB the position and radius of the wheels, the body's box and where each piece goes (GLBs come Draco-compressed: decode them with `@gltf-transform/core` + `draco3dgltf` in Node), pick a scale factor so the footprint is similar to the others (≈ 9–12 wide) and leave the wheels slightly bigger than the real ones. Small details carry a fixed tone (`DARK`/`MID`/`LIGHT`) so they read. A vehicle that never moved has **no wheels** (see [architecture.md](architecture.md#stationary-vehicles)).
3. Add the object to `MISSIONS` with its `model` and `palette`. The wheels, the footprint (`halfLen/halfWid`) and the size come from the model.
4. Define its story (and with it the checkpoints and the **route**): see [story.md](story.md). Without a story, `checkpoints: []` and the globe's card says "coming soon". In `missions.ts` the sky/fog (`env.sky`) is `themeFor(<world>).canvas`, not a loose colour.
5. **Add it to the globe** (`src/lib/bodies.ts`): in the `Body` where it was abandoned (`mars`/`moon`; create a new one if needed) add an `AbandonedVehicle` with `missionId` (= the mission `id`; it becomes the route segment `/<world>/<id>`), `name`, `place`, `lat`/`lon` (real coordinates), `tag` (a short marker phrase), `status` and up to 4 `facts`. The card draws the vehicle with the mission's `model`/`palette` (`VehicleView`). The marker, label, card and routes appear by themselves (`generateStaticParams` comes from `BODIES`).
6. **Audio**: `npm run story-audio -- <mission>` (see [story.md](story.md)). The voice guide is generic (nothing to touch). The music (`ambient-tracks.ts`) is optional: without its own track the `timeline` one plays.
7. Test: load the map, advance with `Space`, check the orientation (is the front the front?), the fog and the dust; and on `/<world>` that the marker and the card (the vehicle turning over a plain background) work.

### Checkpoints (storytelling) — `src/lib/checkpoints.ts`

The checkpoints are not written by hand: `lib/story.ts` generates them from the beats of each mission's `story.json`. What follows is the **format of the `Checkpoint` type** and the behaviour in the scene.

A mission's checkpoint list is **also its route**, in order: the **first is the start** and the **last the end**; between them, the stops of the story. Each one opens an informative card (bottom left) and plays a narration on entering its radius. All the text is **in English**.

```ts
{
  id: "sur031",                     // stable key (used in game.visited)
  name: "The radar loses its way",  // card title
  place: "Apr 20, 1967 · Oceanus Procellarum",   // small line under the title
  x: 70, z: 50,                     // WORLD coordinates (terrain centred at 0,0; see below)
  via: [[30, -28], [66, 8]],        // optional: intermediate points of the leg PREVIOUS → THIS (to avoid steep slopes)
  image: "/models/surveyor3/images/sur031.jpg",  // 4:5 illustration of the story
  imageRatio: "4 / 5",
  credit: "AI-generated illustration",
  text: "…",                        // written summary of the card (~25–35 words)
  narration: "…",                   // spoken script (~45 words, numbers in words); see docs/narration.md
  audio: "/models/surveyor3/audio/sur031.mp3",  // mp3 pre-recorded with `npm run story-audio -- surveyor3`
  facts: [["Touchdowns", "3"], ["First bounce", "~10 m"], ["Second bounce", "~3 m"]],   // 3 label/value pairs
  sources: [{ type, host, url }],   // up to 3 links
}
```

**How the route is planned** (done by `npm run story-route -- <mission>`, not by hand):

1. The stop is chosen with `x, z` inside the terrain and outside the flattened strip (`fade`) with margin (about `fade` + 10 units to the border) and **on flat ground** (the start and the end especially: the vehicle stays there). To see the relief and check heights/slopes use a script that reads the STL (`scripts/lib/terrain-node.mjs`); low zones are usually craters and high ones rims.
2. **The first checkpoint is the start**: the vehicle appears there; its card opens on load.
3. **The route goes through `via` points**: between two checkpoints the path is a smooth curve through them. A straight line usually crosses craters (on Mars it reached 56° slope); the planner runs an **A\* over the height map** (2 u grid, cost = length·(1 + K·slope²·4), never near the border), simplified with Douglas-Peucker (ε 10–16 u) and checked with the curve itself (max slope per leg ≤ ~20°, turn ≤ ~35°/10 u). A leg must not arrive at a checkpoint on one side and leave by the same one (the heading would invert on starting).
4. Reasonable separation: 20–130 units between checkpoints. The timeline markers are evenly spaced; the legs do not need to be the same length.

Behaviour: a checkpoint activates on entering `checkpointRadius` and deactivates beyond `1.15×` the radius (hysteresis, avoids flicker). Once reached it stays in `game.visited` until the vehicle changes (not persisted). If two radii overlap, the first in the list wins. The vehicle **stops at the centre of each checkpoint** (Space) and, on an automatic trip, the intermediate ones only count as visited.

### Things that depend on the terrain scale

- `fade`: small or very steep terrains need the route to stay further from the border (on the Moon the flattened border drops ~25 units in 30 → ~40° slope).
- `fogNear/fogFar`: they must hide the edge of the ground plane; on a terrain of 255 units 50–210 is used.
- Speeds: a small terrain asks for a slower vehicle (`maxSpeed` when driving, `boostSpeed` on the automatic trip).
- Physical scale: the current `scale` values are **not** real (the vehicles are 200–2000× bigger than they should be on the terrain). See "Unresolved: real scale" in [roadmap.md](roadmap.md).
