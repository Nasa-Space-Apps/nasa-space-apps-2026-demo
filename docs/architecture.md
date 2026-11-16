# Architecture

Map of the code: routes and views, files, data flow, render loop, vehicle physics, terrain, particles and minimap. Stack: Next.js 16 (App Router, `cacheComponents`), React 19, three.js + React Three Fiber, Tailwind 4, TypeScript.

## Routes and views

| Route | View | What it loads |
| --- | --- | --- |
| `/` | **Home** (`app/page.tsx` → `HomeLoader` → `Home`; see [design.md](design.md#home)) | three/R3F (the cover vehicle) + the six illustrations; data from `lib/home.ts` |
| `/moon`, `/mars` | **Globe** (`app/[body]/page.tsx` → `ExploreLoader` → `Explore`) | three/R3F + the globe; the illustrated vehicle of the card (procedural, no downloads) |
| `/mars/opportunity`, `/mars/spirit`, `/mars/ingenuity`, `/mars/insight`, `/mars/beagle-2`, `/moon/surveyor-3` | **The story** (`app/[body]/[vehicle]/page.tsx` → `SceneLoader` → `Journey`: comic → `Scene` 3D → comic) | only that mission's terrain STL (the vehicle is procedural: there are no GLBs), its `story.json` (checkpoints, images, audio) and the narration/guide |
| `/<world>/<id>` of a vehicle without a story (`sev`, `perseverance`) | redirects to the globe (`storyOf(id)` is `undefined`: "coming soon") | nothing |

- The `[vehicle]` segment is the mission `id` (`missions.ts`). Both pages use `generateStaticParams` from `lib/bodies.ts`; an invalid value calls `notFound()`. **`cacheComponents` mode:** reading `params` outside `<Suspense>` raises the "instant shell" error, so each page is a component without `await` that wraps in `<Suspense>` another one that does `await params`.
- `ExploreLoader` / `SceneLoader` / `HomeLoader` (client components, `next/dynamic` with `ssr: false`) split the chunks: the globe does not download the scene and vice versa. `ssr: false` is only allowed inside a Client Component, and three/R3F need `window`.
- **Switching world does not remount**: the selector does `history.pushState` to `/mars` or `/moon` (Next syncs `usePathname` with the History API) and the `Canvas` stays alive. The open vehicle card is kept in the **hash** (`/mars#opportunity`, `replaceState`), so "← globe" from the story comes back with the card open (read after mounting, because Next updates the URL after the first render). `Esc` closes the card.
- Next keeps the visited routes mounted (hidden): `Scene`, `Explore`, `Home` and `Journey` return `null` when their route is not the current one (see [performance.md](performance.md)).

## Globe view (`Explore`)

The **menu before the story**: a globe (the Moon by default) full screen with **a small 3D vehicle standing at each abandoned site**, a **world switch in text** (top left on wide screens: "Mars  Moon", the current one highlighted with the world's accent), the music button and the "Credits" button top right, and a one-line hint at the bottom. **There is no side panel or vehicle list**: clicking a vehicle opens its card (`VehicleCard`, with "Travel to the past") **floating beside it**; **the globe does not move or turn with the pointer while a card is open**, and the card closes with its **X**, with **Esc** or with a **click outside**. Everything enters and leaves with game-like animations (`Pop`, `THEME.pop`, the springs of `lib/motion.ts`).

- **`lib/bodies.ts`**: bodies (`blurb`, `facts`) and their `AbandonedVehicle`s (`missionId`, `lat/lon`, `tag`, `status`, `facts`). `latLonDir()` gives the direction of a lat/lon on the sphere. Adding a vehicle = adding its mission and an entry here (the `/<world>/<id>` route appears by itself).
- **`Globe.tsx`**: its own R3F (shares no state with `game`). **Orthographic camera** (no perspective: the sphere is a perfect circle and the grid never leans) with a fixed elevation `TILT` (~29°, isometric look); `frame()` computes the zoom and centres the globe (a click never moves it or zooms); `Limb` draws the outline. **No textures:** a wireframe grid every 15° (a `ShaderMaterial` that **discards** the far side: only the front is seen), colours from `theme.globe`.
  - **Turntable:** only two axes, the spin about its own axis (`st.spin`) and the pitch (`st.pitch` = the latitude at the centre of the screen), **no roll** (orientation = `Rx(pitch)·Ry(spin)`; `TILT` is the initial lean). It **spins by itself** (`IDLE` rad/s); dragging gives it inertia that relaxes to that automatic spin.
  - **Limit while steering by hand:** the centre of the visible face stays within `MAX_OFF` (45°) of some vehicle (`constrain`). If the user grabs a face with no vehicles, it first turns quickly (`snap`, ~0.3 s) until the nearest vehicle is `SNAP_OFF` (25°) away. **On release** the pitch returns quickly to `TILT` (`st.norm`, `uprightSpin()`), keeping the longitude (if there is no vehicle in view at that longitude, it takes the nearest one that has). The automatic spin has no limit (it can show empty ground).
  - **Zoom** (`view` in `Globe.tsx`: wheel, Ctrl+wheel / pinch, Ctrl +/−/0): it changes `camera.zoom`, so it scales only the globe and the vehicles and the DOM keeps its size; limits `ZOOM_MIN` 0.75 and `ZOOM_MAX` 2.6. The closer it gets, the narrower the window on the globe, so the rotation limit tightens (`maxOff()` = `min(MAX_OFF, windowFraction · asin(half screen / globe radius in px))`, `windowFraction` 0.55); zooming also counts as steering (if no vehicle is in the window the globe turns quickly to one); above `ZOOM_IDLE` (1.2) it does not spin by itself; with a vehicle selected the zoom stops before that vehicle would leave the screen (`view.cap`).
  - `faceAngle(lon)` gives the spin that puts a longitude facing the camera; used when switching world or choosing a vehicle (`settle`).
  - **`Orbiters`**: ~640 black squares (3 sizes) in shells around the globe, **inside the group that spins**; the vertex shader discards them if they are behind the plane of the globe's centre.
  - **`Marker`** = the vehicle **sunk into a mass that glues it to the ground** (a "symbiote" effect): `lib/vehicles/mini.ts` draws an exaggerated low-detail version (5–10 primitives with the `Kit`) and `lib/vehicles/blob.ts` (`blobFrom`) **tilts it back** and joins it, in **one mesh**, to a soft melt (a blurred height map capped at ~26 % of the height + skirt + tendrils) that swallows its lower part; the vehicle **turns every frame to face the viewer** (three-quarter view). Material of 3 tones in ink + accent + paper (`theme.globe.vehicle`, to contrast with the field whatever the mission colour). ~48 px, it **emerges from the ground** (an invisible ground sphere with `colorWrite={false}`, `renderOrder={-1}` only writes depth), on a pulsing square ring, with a scale compensated so it does not grow with the zoom. It moves like jelly (breathes, ripples, stretches on hover) and grows on hover/selection; **the automatic spin pauses while a vehicle is under the cursor** (`hot`) so a moving target can be clicked. Its DOM label (name + tag) shows **only on hover**.
  - On selection, `placeFloating` (`GlobeLabels.tsx`) places the floating card beside its on-screen position every frame, imperatively (to the right, or to the left near the edge; on narrow screens docked at the bottom) and hides it while the vehicle is on the far side.
- **`VehicleCard.tsx`**: a card with the vehicle **illustrated in 3 tones** (`VehicleView.tsx`: a small orthographic `<Canvas>`, plain paper background, still), its story, 4 facts and "Travel to the past" (or "Coming soon" without a story).
- **`GlobeLabels.tsx`**: DOM labels (name with ticks + status tag) that `Globe` moves every frame by projecting the 3D position (`labelEls`). **Do not use drei's `Html`:** in dev with StrictMode it raises "Attempted to synchronously unmount a root" and loses labels.
- **`Credits.tsx`**: the "Credits" button and its "created by" card (one panel per person of `lib/team.ts`) and `CreatedBy`, the authors' line of every story's closing card.
- `components/Loading.tsx` (the single loading screen) and `components/FadeImg.tsx` (a picture that fades in); see [design.md](design.md#loading). `components/Icon.tsx` (the only icon set) and `lib/transcript.ts` (the narration's phrases and timing, see [narration.md](narration.md)).

## The story experience (`Journey`, `Comic`)

`/mars/opportunity` does not mount `Scene` directly: `SceneLoader` picks `Journey` for every mission with a story (`storyOf(mission)`). `Journey` has three phases over one field (the world's colour):

- **intro**: `Comic` with the `intro` beats (4–6 pages). **From the 3rd page** it only downloads the terrain (`fetch`); `Scene` (`next/dynamic`) is mounted in `onLeave`, when the player presses "land on mars", and `game.hold = true` keeps it waiting until `onDone`.
- **mars**: when the comic ends (`onDone`/`onSkip`) the hold is lifted and the comic unmounts: the vehicle is already at the first stop, which opens with its card and narration. At the last stop (`game.active` = last id) a "continue the story" button appears. `Scene` receives `onBack`/`backLabel`/`lockVehicle`: "← story" returns to the intro (on its last page, `startAt`; the scene stays mounted and waiting) and there is no vehicle selector.
- **outro**: `Comic` with the `outro` beats (with `onBackPast`: `←` on its first page returns to the 3D) + a final page (`end`) with "play again" (remounts `JourneyView` with another `key`), "back to the globe" and `CreatedBy`. It sets `game.hold = true` again.
- Before the first comic page a **preparation screen** ("preparing the story", with a percentage; `useStoryAssets`) downloads all the audio clips into memory and decodes all the illustrations (minimum 0.8 s, maximum 25 s), so no page waits for the network.

**`game.hold`** (`lib/game.ts`): while `true`, `Rover` ignores Space, `Checkpoints` does not detect proximity (no cards or narration) and `Guide` does not speak. `Journey` and its cleanup set it (`false` on unmount).

**`Comic`** (`components/Comic.tsx`): absolute pages centred with `--pw`; the active one in the middle and its neighbours peeking (`translate` + `rotate` + `scale`, transition with `THEME.pop`). Each page is paper with the ink frame of `ui().frame`, the illustration, the date stamp and a title + summary box. `playNarration(beatToCheckpoint(beat))` on arriving at a page (the same store as the 3D: the same subtitles with `Captions`). Pink/blue blobs in the background move with each page (`Blobs`). Next: Space / → / click / swipe / wheel; back: ←.

The **checkpoints of a story** are generated from `storyOf(mission).mars` (`lib/story.ts`, `beatToCheckpoint`): `Checkpoint` has `imageRatio` (the card becomes vertical), `source` and `noGuide` (the guide does not talk about them). `Timeline` shows no names under the markers when there are more than 8 stops. Flow and data details: [story.md](story.md).

## Scene (3D)

```
/<body>/<vehicle> → SceneLoader → Journey → Scene (prop: missionId)
                                          ├─ <Canvas> (R3F)
                                          │    └─ <Experience key={mission.id} mission>
                                          │         ├─ terrain (mesh) + infinite ground plane
                                          │         ├─ Sun · fog · hemisphereLight
                                          │         ├─ Tracks · Rover (follows the route) · Dust
                                          │         ├─ Checkpoints (beacons + proximity)
                                          │         ├─ Guide (voice-guide director, no render)
                                          │         └─ CameraRig
                                          ├─ TopBar («← story» / «← Globe»)          ← DOM
                                          ├─ Minimap                                  ← DOM + 2D <canvas>
                                          ├─ CheckpointCard (bottom left)            ← DOM
                                          ├─ dock bottom centre                       ← DOM
                                          │    ├─ Captions (subtitle, floats above)
                                          │    ├─ Hints (chips: Space / N / G / S)
                                          │    └─ Timeline
                                          └─ loading cover (LoadingContent)
```

**Keyboard:** two places. `bindKeyboard()` (`lib/game.ts`, mounted by `Rover`) reads **only Space** into `input.go` (there is no free driving); the `useEffect` of `Scene.tsx` handles `M` (next vehicle: navigates to its route; off in a story), `N` (narration) and `G` (voice guide); `S` (music) lives in `<Ambient/>`. They ignore Ctrl/Meta/Alt and repeats.

**Data files:** `lib/missions.ts` (vehicle + terrain + environment), `lib/themes.ts` (the theme), `lib/story.ts` (the stories: each beat becomes a checkpoint, the list order is the route order; `via` are the intermediate points of each leg) and `lib/checkpoints.ts` (only the `Checkpoint` type). **Maintenance only:** `scripts/build-story.mjs`, `plan-story-route.mjs`, `generate-story-images.mjs`, `generate-story-audio.mjs` and `generate-guide.mjs` (they write the mp3s of `public/models/<mission>/audio` and `public/guide`; they share `scripts/lib/tts.mjs`).

### Stationary vehicles

InSight, Beagle 2 and Surveyor 3 never moved, so their 3D scene is not driven. All the route machinery (timeline, card, narration, minimap) is reused with a **virtual** route:

- `Mission.stationary` (from `Story.stationary`) → `Experience` publishes `game.stationary = true` and builds `buildStationaryRoute(checkpoints, heading)` (`lib/route.ts`): the vehicle is at the spot of the first checkpoint (they are all the same, `BASE`) and the stops are 100 virtual units apart; `game.s` is a **time cursor**, not a distance.
- **`Rover.tsx`**: in stationary mode the cursor glides at `STILL_RATE` (360 u/s) towards `stops[game.travel]`; `game.speed` is always 0 (no vibration, dust or tracks); the vehicle stays put and follows the terrain.
- **`lib/game.ts`**: `stepForward()` sets `game.travel` to the next stop (ignores `game.hold`, a trip in progress and the last stop); in `bindKeyboard`, with `game.stationary`, **Space** calls `stepForward` (once per press, no repeats) instead of setting `input.go`.
- **`Checkpoints.tsx`**: proximity is useless here (all the checkpoints are at the same point): the active moment is the stop where the cursor rests (`game.active`); while the cursor glides there is no card or narration, and the moments it passes count as visited. No beacons (`hidden`).
- **`Scene.tsx`**: `CameraRig` orbits the vehicle (`cur.ang`, ~0.5 rad per moment + drift) and moves 15 % closer; `<Guide/>` is not mounted; `Hints` receives `still` ("Next moment", no `G` chip).
- **`Timeline.tsx`** and **`Minimap.tsx`**: texts "Going to…" / "The last moment"; the minimap draws no route or numbered squares (only the vehicle dot).
- **Models** (`lib/vehicles/insight.ts`, `beagle2.ts`, `surveyor3.ts`): no wheels (`rig.wheels` empty; `halfLen/halfWid` are passed to `finish`), so `Dust` and `Tracks` emit nothing.
- **Data**: `STATIONARY`/`BASE` in `scripts/data/<mission>-story.mjs`; `plan-story-route.mjs` plans no trips (it writes N equal stops).

### Vehicle dynamics (audit, milestone 54)

`Rover.tsx` adjusts its behaviour to the real vehicle (config in `RoverConfig` of `missions.ts`; reasons in [audit.md](audit.md)):

- **Helicopter** (`rig.hover > 0`, Ingenuity): it only flies while moving. `st.lift` rises to 1 when `|game.speed| > 1` and drops to 0 when stopped: it takes off, flies and lands at every stop; the rotors spin only in the air (`rate · lift`).
- **Reverse driving** (`reverseAfter`, Spirit from `spi028`): on visiting that checkpoint the model (`align`) turns 180° and the wheels turn the other way; `game.heading` stays the forward direction (camera, minimap).
- **Dead wheel** (`deadWheelAfter`, Spirit from `spi040`): the kit's wheels can carry a tag (`wheel(x, z, r, draw, "dead")`, `rig.spinners[i].tag`); from that checkpoint that wheel stops turning.

## Home

`/` is the cover: **one composition** (cards with the illustrations + Opportunity in 3D, see [design.md](design.md#home)). `Home.tsx` stacks layers over a 1700 × 1000 stage scaled by `--s`: the cards (DOM), **one transparent 3D canvas** with Opportunity (`HomeScene.tsx`: an isometric camera whose zoom follows the stage scale; the vehicle is placed by converting its stage coordinates — anchored at its nearest wheels — to the screen and sliding the point along the view direction to the ground; static, `frameloop="demand"`), the badge and the button, and the sparkles (`Sparkles.tsx`). A single `requestAnimationFrame` loop moves the parallax, the cards and the badge. `lib/home.ts` holds the data (`CARDS` and `PIECES` come from `MISSIONS`, `BODIES` and `storyOf`; each card's illustration is a beat of its story), the pointer for the parallax (`pointer`), the sparkle emitter (`fx`) and `stageScale`. **`worldOfPath("/")` returns `"home"`** (a third "world" with the palette of the reference: `WORLDS.home` + `HOME` in `themes.ts`); the script of `layout.tsx` does the same. There are **two compositions** (`WIDE`, `TALL` in `lib/home.ts`); `layoutFor(w, h)` picks one and `stageScale(w, h)` gives the scale. From the globe, the logo (`Logo.tsx`) goes back to `/`.

## Responsive

`lib/viewport.ts` (`useViewport`, `useSyncExternalStore` over `resize`/`orientationchange`) gives the size class: `compact` (< 1100 px wide or < 600 tall), `phone` (< 640), `short` (< 520 tall), `portrait`, `touch`. Used by: `Scene` (mounts the **desktop HUD** — `Minimap`, `CheckpointCard`, `Hints`, `Timeline` — or the **compact** one: `Captions small` + `CheckpointCard compact` + `Timeline compact` + `TouchControls`, stacked at the bottom; on a sideways phone the controls go apart on the right), `Explore` (world selector at the bottom, logo/icons, the card as a CSS sheet instead of `placeFloating`, `globeShift` to move the globe aside), `Comic` (page width, bar, pill), `Journey` ("skip 3D" button, closing card), `Credits` (icon only, card hanging from the top) and `Home` (`layoutFor`). `Globe.tsx`: two-finger pinch (`touch.pinching`, capture-phase listeners on `window`), drag by `clientX/Y` and `globeShift`. `CameraRig` (`Scene.tsx`): pulls the camera back and lowers the look-at point on tall screens, and `setViewOffset` on a sideways phone. Details and decisions: [design.md](design.md#responsive).

## World theme

`lib/themes.ts` defines `BASE` (everything shared) and `WORLDS` (field, tint, accent, beacon of **Mars**, the **Moon** and the **home**); `themeFor(world)` returns the full `Theme` and `worldOfPath(route)` the world of a URL (`/mars…` = Mars, `/` = home, the rest = Moon). UI components use `useTheme()` (`lib/use-theme.ts`, reads `usePathname`, so it follows the selector's `pushState`); the CSS variables (`--canvas`, `--accent`…) are published by `components/WorldVars.tsx` and a script in the `<head>` (`app/layout.tsx`). Inside R3F's `<Canvas>` there is no React context: `Experience` uses `themeFor(bodyOfMission(mission.id).id)` and the globe receives the theme by props. `missions.ts` takes the sky and fog from `themeFor(<world>).canvas`. Detail: [design.md](design.md#palette-per-world).

## Shared state: `src/lib/game.ts`

A **mutable** `game` object (not React state) that everything reads/writes every frame:

| Field | Meaning |
| --- | --- |
| `terrain` | `TerrainData` of the active mission (or `null` while loading / switching). |
| `route`, `s` | The mission's `Route` (`lib/route.ts`) and the distance travelled on it (a time cursor for stationary vehicles). `route.stops[i]` = `s` of checkpoint `i`. |
| `travel` | Index of the checkpoint the autopilot travels to (a timeline click) or `null`. Set by `travelTo(i)`. |
| `x, y, z, heading` | The vehicle's position (from `route.at(s)`) and heading. Forward direction = `(sin h, 0, cos h)`. |
| `speed`, `boost`, `topSpeed` | Signed speed along the route (negative = reverse on a backwards trip), "automatic trip in progress" (more dust and camera shake) and top speed (bars/FOV). |
| `quaternion`, `wheels[]` | Body orientation and world position of each wheel (for dust and tracks). |
| `checkpoints[]`, `checkpointRadius` | The active mission's checkpoints and their activation radius. |
| `visited`, `active` | `Set` of reached ids and the id of the checkpoint the vehicle is in now (or `null`). |
| `mission`, `stationary`, `hold` | Active mission id; stationary mode; "waiting behind the comic". |

`input.go` (Space pressed) is filled from `bindKeyboard()` (listeners on `window`). `Experience` builds the route (`buildRoute`) and resets `game` in a `useEffect` on mount (every time the mission changes).

## Route: `src/lib/route.ts`

`buildRoute(checkpoints)` returns the vehicle's trajectory: **one centripetal Catmull-Rom curve per leg** (checkpoint → next checkpoint, through the next one's `via` points), sampled every 0.5 units into a table. Legs are independent curves: the vehicle always stops at each checkpoint, so the heading can change abruptly there. `route.at(s)` gives position and heading (at a checkpoint, the heading of the **next** leg); `route.stops` the `s` of the checkpoints; `route.points` is a coarse polyline (~4 u) for the minimap. The `via` points were computed with an A\* over the height map penalising slope (see [themes-and-missions.md](themes-and-missions.md)).

## Terrain: `src/lib/terrain.ts`

`buildTerrain(stlGeometry, style)` returns `{ mesh, data }`: it clones the geometry, drops the normals and merges vertices; `rotateX(-90°)` (the STLs are Z-up, from Blender) and centres on X/Z; **flattens the borders** with `smoothstep` over `style.fade` units towards the lowest point; vertex colours by original height (`lo → hi`) mixed towards `style.edge` at the border; and `buildHeightField` rasterises every triangle into a grid of `RES = 0.5` (keeping the maximum), fills holes from neighbours and exposes a bilinear `heightAt(x, z)`. The terrain uses a 3-step `MeshToonMaterial` with ink contour lines drawn by its own shader (`withContours`).

## Rover: `src/components/Rover.tsx`

**`buildVehicle(model, palette)`** (`lib/vehicles.ts`, once per mission) builds the vehicle from primitives (no GLB) with the wheels as independent pivots (`spinners`) and returns `wheels` (contact points), `halfLen`/`halfWid` (footprint to tilt the body), the size and the centre of its box (`center`, to frame it in the card). It moves along **+z** with the wheels on y=0. The material is a **3-tone** `ShaderMaterial` (dark/mid/light by the angle to a fixed light): see [design.md](design.md#vehicles).

**How it is built** (`lib/vehicles/`): `kit.ts` has the `Kit` class with the primitives (`box`, `cyl`, `tube` between two points, `ball`, `ring`, `prism`/`slab`/`panel` = extruded polygons in each plane, `lathe`, `loft` = skin over rings with painted windows, `wheel` + `tyre`, `at()` for rotated sub-assemblies) and every vehicle is a function in its file (`opportunity.ts` — with `mer()`, reused by `spirit.ts` —, `sev.ts`, `perseverance.ts`, `ingenuity.ts`, `insight.ts`, `beagle2.ts`, `surveyor3.ts`). `Kit.rotor()` adds parts that spin about y (`rig.rotors`) and `finish({ hover })` makes the vehicle float (Ingenuity). Every primitive is **baked** (position + rotation) into a list and `finish()` merges them: **one mesh for the body and one per wheel**, with **one material**. The tone of each triangle travels in a vertex attribute (`tone`: −1 = by light, 0/1/2 = fixed dark/mid/light), so a model of ~16–28 k triangles and hundreds of pieces costs 7 draw calls. The material is double-sided and flips the normal on back faces (`gl_FrontFacing`) so open surfaces (antennas, `loft`) shade correctly.

**`useFrame`** (every frame, `dt` capped at 0.05 s):

1. **Advance along the route** (no free steering): with Space held the vehicle accelerates (26 u/s²) up to `maxSpeed` towards the **next** checkpoint and brakes with a ramp `v = √(2·28·distance)` to **stop exactly on it**; it does not go on until Space is released and pressed again (`st.locked`). The goal (`st.goal`) is fixed when the leg starts (recomputing it while braking would jump to the next checkpoint). If released halfway, it brakes (40 u/s²) and stays between two checkpoints. With `game.travel` (a timeline click) it drives itself at `boostSpeed`, **forward or backward**, and stops at the destination. The heading follows the smoothed tangent of the route (`damp`). `s` → `route.at(s)` → `game.x/z`.
2. **Follow the terrain**: heights at the 4 corners of the footprint → mean height, pitch and roll (smoothed with `damp`).
3. **Body animation**: lean by acceleration/turn and a vibration that grows with speed (Euler order `YXZ`).
4. World position of each wheel → `game.wheels`; and the trail for the minimap (every ≥5 units).

## Effects

- **`Dust.tsx`** — a pool of 1,600 particles in a `THREE.Points` with its own `ShaderMaterial` (size and alpha per particle, on-screen size compensated by distance). Each wheel emits according to speed (more on an automatic trip). The physical parameters (`drag`, `lift`, `life`, `size`, `alpha`, `color`) come from `mission.dust`.
- **`Tracks.tsx`** — an `InstancedMesh` (max. 2,600 marks) in a ring; drops one mark per wheel every 1.3 units travelled, oriented with the body quaternion. Colour/opacity from `mission.tracks`.
- **`CameraRig`** (in `Scene.tsx`) — a fixed offset (22, 16, 24) from the vehicle, smoothed, looking slightly ahead according to speed; FOV 35 → 44 with speed; slight shake during an automatic trip.
- **`Sun`** — a directional light with shadows (map 2048, frustum ±45) that **follows the vehicle** (offset in `mission.env.sun`).

## Checkpoints (storytelling)

Data in `src/lib/checkpoints.ts` (the type) and `lib/story.ts` (the lists, generated from `story.json`); `missions.ts` references them and defines `checkpointRadius`. `Experience` publishes them in `game` when the mission (re)starts and clears `visited`/`active`. A mission's list is **the route**, in order; the first one is where the vehicle starts (already active on load).

- **`Checkpoints.tsx`** (inside the `<Canvas>`): for each checkpoint it draws a **beacon** — a thin pole (height 1.6× the radius), a rotating, floating octahedral gem and a **ring glued to the terrain** (a 72-segment ribbon using `heightAt`) marking the area; flat `MeshBasicMaterial` (no lighting), colour `theme.beacon`; once reached it goes to `theme.beacon.done`. In its `useFrame` it does the **detection**: entering the radius → `game.active = id` and `game.visited.add(id)`; leaving beyond 1.15× the radius. It does nothing until `game.terrain` is published. **During an automatic trip** the intermediate checkpoints are only marked visited (no card or narration); the destination is activated.
- **`CheckpointCard.tsx`** (DOM, bottom left): a `requestAnimationFrame` loop compares `game.active` / `game.visited` with the last seen and only calls `setState` when they change (no per-frame renders). The **story card** (the one with `imageRatio`): the illustration at **full width** with a height limited by the screen (`maxHeight: max(220px, 100vh − 415px)`, `object-cover`), then the title, "start n/N · date · place", progress dots + `listen`, the summary, 3 facts in columns, up to 3 sources in one line and the credit. Its width is `clamp(340px, (100vw − dock)/2 − 40px, 520px)` with `dock = clamp(440px, 100vw − 900px, 560px)`, the width of the central bar of `Scene.tsx` (captions + chips + timeline): if you change one, change the other. On compact screens it is a **peek** (thumbnail, title, listen) that unfolds on a tap.
- **Timeline** (`Timeline.tsx`, DOM, bottom centre): a bar with one marker (circle) per checkpoint, **evenly spaced**; the fill and the vehicle dot advance proportionally inside each leg. It shows "Next: …" / "Traveling to …" / "End of the route" and "n/N visited". **Only the markers are clickable** (`travelTo(i)`, disabled at the checkpoint where you are): you cannot stop at an arbitrary point. It polls `game` with rAF and only calls `setState` when the list, the visited, the current stop or the text changes.
- **Minimap**: numbered diamonds (fill `pin`/`done`, outline `ring`); the active one also draws a dashed circle with the activation radius.
- **Narration** ([narration.md](narration.md)): the detection of `Checkpoints.tsx` also calls `playNarration(cp)` on entering and `stopNarration` on leaving (and on unmount), and preloads the mission's clips on mount. `lib/narration.ts` is an external store with one `<audio>` per checkpoint; the card (the Listen/Stop button) and the chips (`N Narration on/off`) subscribe to it with `useSyncExternalStore`. The audio is **pre-recorded** mp3 in `public/models/<mission>/audio/`: there are no ElevenLabs calls at run time.

## Voice guide

Details and catalogue in [guide.md](guide.md). Technical summary:

- **`lib/guide-lines.ts`** — data (no imports; Node loads it too): 30 phrases with `kind` and `vehicle?` (generic ones and Opportunity's).
- **`lib/guide.ts`** — an external store (`enabled`, `caption`; `subscribeGuide/getGuide`) + the **director** `updateGuide()`: every ~0.2 s it reads `game` (route `s`, speed, checkpoints, `visited/active`, `travel`) and decides whether to speak: target = first unvisited checkpoint; distance bands 25/50/75 % measured **along the route**; a "progress + next target" sequence on leaving a checkpoint; `ready`/`done` inside the checkpoint after the narration; `idle` if stopped. Silent during an automatic trip. One `<audio>` at a time, 6 s of silence, per-category cooldowns, a queue for sequences.
- **`components/Guide.tsx`** (inside the `<Canvas>`) mounts/unmounts the director and calls it in `useFrame`. It coexists with the narration: `Checkpoints.tsx` calls `stopGuide()` on entering a checkpoint and the director does not speak while `getNarration().status` is `loading/playing`.
- **`components/Captions.tsx`** shows the subtitle of **the narration and the guide**.

## Minimap: `src/components/Minimap.tsx`

- **Bake** (when the terrain loads or the theme changes): a height grid of the canvas size, softened with a box blur, then **marching squares** over a coarse grid: 16 levels, one in `every` is "major"; clipped by `ter.fade` to hide the flattened border.
- **Every frame**: the cached background + the **route** (whole faint and dashed, the part already driven solid; `trail` tokens) + checkpoints + arrow + dot. The texts (position, heading, speed, bar) are updated by DOM reference every 80 ms, without going through React.
- It bakes again if `game.terrain` changes (mission switch) or the theme changes. Axes: X to the right and Z down; heading arrow = `atan2(cos h, sin h)`.

## UI: `Hud.tsx`

`TopBar` (an ink bar with the way back and, unless `items` is left out, the vehicle selector; it calls `blur()` after a click so Space does not activate it), `Hints` (chips: `Space Hold to drive`, `N Narration on/off`, `G Guide on/off`, `S Music on/off`) and `TouchControls` (the big "hold to drive" / "next moment" button and the narration/guide/music toggles). The globe has `AmbientButton` top right.

## Configurable data

- **`missions.ts`** — vehicle + terrain + environment + dust + tracks + checkpoints and their radius. See [themes-and-missions.md](themes-and-missions.md).
- **`themes.ts`** — the "Ink & Paper" theme (`BASE` + the palette per world in `WORLDS`): colour (field and accent per world, paper, ink), typography, radii, stroke, grain, motion curve and durations, minimap, beacons, terrain (`ground`) and globe.
- **`story.ts`** + `public/models/<mission>/story.json` — the stories.
- **`guide-lines.ts`** — voice-guide phrases (and their vehicle/category).

## Fonts (`app/layout.tsx`)

**Libre Franklin** (variable, via `next/font/google`) is the app's only family; it is exposed as the CSS variable `--font-sans` (`THEME.font`; `THEME.mono` points at the same family).
