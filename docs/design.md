# Design: the "Ink & Paper" theme (comic) + flat design

**The whole demo uses one theme, "Ink & Paper", and the flat style.** It was fixed by the project owner and overrides any other aesthetic preference. Reference: [ponpon-mania.com/chapter/2](https://ponpon-mania.com/chapter/2) (an interactive comic), measured with computed styles and screenshots. The values live **only** in `src/lib/themes.ts` (`BASE` + `WORLDS`); this document explains the why and the rules.

## The idea

A quiet, hand-made-comic interface: a flat field of colour with a fine grain (**terracotta on Mars, steel blue on the Moon**, periwinkle on the home page), **sheets of cream paper** with a **thick black ink stroke**, one accent per world, pill-shaped buttons and a single heavy lowercase typeface. In the original, the comic pages (cream, slightly tilted) hang over a background of flat blobs; here the background is the world's field (the sky of the 3D, the globe, the loading screen) and the cards are the pages. The interface stays neutral (ink and paper); the real colour comes from the world's field, the accent and the **vehicles** (3 tones).

## What was measured on the reference

| Datum | Value |
| --- | --- |
| Background (WebGL canvas) | flat periwinkle `≈ #7E7EFF` and pink `≈ #F892C0` in organic blobs that change per scene; fine **grain** over the blue |
| Paper of the pages | `#FEECE3`, almost-square corners, ~0.5° tilt |
| Ink | `#171717`; very thick, irregular stroke on the comic frames |
| Loading screen | `#FFF6F0`, a mascot in an ink circle, a thin bar |
| Progress pill | ink `#191819`, radius 60, white 700 text |
| Typography | **Libre Franklin** (variable 100–900); navigation 15 px, **700, lowercase**; hand-drawn logotype |
| Navigation hover | a **1 px pill outline** around the text |
| Interaction | horizontal scroll with the wheel, "grab" cursor, sliding page |

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | per world: Mars `#E2603A`, Moon `#4B7DB8`, home `#7E7EFF` | **The field**: page background, globe, scene sky and fog, loading screen, the colour views melt into |
| `surface` / `onInk` | `#FEECE3` | The **paper**: panels and cards; and the colour of text/icons on ink |
| `paperLight` | `#FFF6F0` | Light paper: the flat background behind a vehicle on its card |
| `ink` / `inkSoft` | `#171717` / `#3A3A3A` | Text, strokes, primary button, top bar, globe limb and stars, terrain contour lines |
| `muted` | `#675651` | Secondary text |
| `line` | `#E8CFC2` | Bar tracks and dividers on paper |
| `accent` / `hover` | per world: Mars `#FFC247`, Moon `#6BE3C3`, home `#F892C0` | **The only accent**: current position, beacon gem, text selection, the fill that sweeps across a button on hover, the `.is-accent` button |
| `accentSoft` | per world: Mars `#B33A16`, Moon `#1F5C8E` | Links on hover |
| `radius` / `radiusSm` | 6 / 999 px | Paper and panels / buttons, chips and pills (fully round) |
| `stroke` | 3 px | Ink stroke of panels, photos and illustrations (the "comic panel") |
| `grain` | 0.08 | Opacity of the grain over the whole screen (0 = off) |
| `ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | The curve of **all** transitions |
| `pop` | `cubic-bezier(0.34, 1.7, 0.5, 1)` | The playful curve: overshoots, then settles |
| `dur` | 250 / 600 / 1000 ms | `fast` (hover), `base` (states), `slow` (entrances and moves) |
| `ground` | `mars` sand `#EEBE95 → #FFF1DF` (edge `#F7D8BC`), `moon` silver `#CDD3DA → #F5F6F8` (edge `#E2E6EA`), `lines` ink | The terrain of each world in 3 paper tones with ink contour lines |

Vehicle palettes (3 tones, in `missions.ts`; `bg` is `paperLight`): Opportunity coral `#E65A4F / #F9A66C / #FFE4E0`, Spirit violet, Ingenuity amber, Surveyor 3 olive, InSight teal, Beagle 2 berry, SEV blue, Perseverance green. Each vehicle keeps its own colour and does **not** follow the world's palette (possible improvement: align them).

## Palette per world

Ink and paper (the comic itself) are the same everywhere; what changes with the world is **the field, the accent and what hangs from them**. It is defined in `WORLDS` of `src/lib/themes.ts` and `themeFor(world)` returns the full theme:

| | field (`canvas`) | light tint (`canvasAlt`: globe grid, comic blobs) | accent | soft accent (links) | active beacon | 3D ground |
| --- | --- | --- | --- | --- | --- | --- |
| **Mars** | `#E2603A` terracotta | `#F49A6D` | `#FFC247` butter | `#B33A16` | `#F08A00` | warm sand `#EEBE95 / #FFF1DF` |
| **Moon** | `#4B7DB8` steel blue | `#86AFDA` | `#6BE3C3` mint | `#1F5C8E` | `#16B38F` | cool silver `#CDD3DA / #F5F6F8` |
| **Home** | `#7E7EFF` periwinkle | `#A9A9FF` | `#F892C0` pink | `#4747E0` | `#F892C0` | — |

- **How it is applied:** `useTheme()` (`lib/use-theme.ts`) gives the theme of the route's world and follows the globe selector's `pushState`; components use it instead of importing `THEME`. Inside R3F's `<Canvas>` the React context does not arrive: `Experience` takes the world from the mission (`bodyOfMission`). The CSS variables are published by `components/WorldVars.tsx` and a script in the `<head>` of `app/layout.tsx` sets them before the first paint (no flash). Each mission's sky and fog (`missions.ts`) are its world's field.
- To tweak a colour change it in `WORLDS` (or `BASE.ground`); never write loose colours. If you add a CSS token, add it to `cssVars()`.

## Typography

- **One family: Libre Franklin** (the reference's own; `next/font/google` in `layout.tsx`). There is no mono: `THEME.mono` points to the same family and is used for labels, buttons and numbers.
- **Titles** (`display`/`title`, `ui.ts`): weight **800**, tracking −0.04 em, line height ~1. **Text**: 14 px, weight 500. **Labels, buttons, chips and links**: weight **700, lowercase** (`text-transform: lowercase`), 12–14 px, tracking +0.01 em. Proper nouns in titles keep their capitalisation; in labels they come out lowercase, like the reference.
- Scale: `display` 32, `title` 22, text 14, labels 12 (`lib/ui.ts`). **No kickers**: the title speaks alone; metadata goes below, in lowercase.

## Hover

In the reference the navigation hover is a **pill outline**. In the demo: `.ui-btn` (primary = ink pill; `.is-ghost` = 2 px outline) and rows/cells (`.ui-row`, `.ui-nav`) **fill with the accent in a sweep** left to right (`background-size` 0 → 100 %) in 600 ms and the text turns ink; `.ui-marker` (timeline) fills with the accent and grows; `.ui-link` turns blue (`accentSoft`); arrows slide 4 px (the back arrow, backwards). The selected option (`.is-active`) stays ink. Disabled buttons do not react.

## Icons (`components/Icon.tsx`)

A single drawn set: a 16×16 grid, a **2 px stroke**, round caps and joins, no fill, inheriting `currentColor`. Icons: `arrow-right`, `arrow-left`, `chevron-down`, `play`, `stop`, `pause`, `close`, `user`, `sound`, `sound-off`, `voice`, `guide`, `home`. **Never loose glyphs** (→ ▶ ■).

## Components

- **Panel** (`ui().panel`): paper with a **3 px ink stroke** and 6 px corners. No shadow. `ui().frame` is the same stroke for photos and illustrations inside a panel (the "comic panel").
- **Tilted pages**: the checkpoint card (−0.7°) and the minimap (+0.7°) carry a minimal `rotate` (independent of `transform`) so they look like sheets on a table, not UI boxes. The other panels do not tilt (they stack).
- **Primary button** (`.ui-btn`): ink pill, paper text in bold lowercase, a sliding arrow; secondary `.is-ghost` (2 px outline); `.is-accent` for "skip the 3D" (the world's accent with a 2.5 px ink outline, the hover sweep is ink).
- **Top bar** (`TopBar`): an ink pill with "← story"/"← globe" and the vehicle selector; the dropdown is paper with a stroke.
- **Key chips** (`Hints`): ink pills; the key in an accent circle (off: the pill at 60 % and a paper key).
- **Subtitles** (`Captions`): an ink bubble; label "narrator" (paper) or "guide" (accent).
- **Timeline**: a 5 px rounded track, an ink fill and 16 px **circles** with an ink stroke per checkpoint (ink = reached, vehicle colour = the vehicle is stopped there); only between two checkpoints does a dot in the vehicle's colour travel the track.
- **Minimap**: inside a panel with its ink-stroked frame; soft contour lines on paper, ink route (dashed for the pending part), square numbered checkpoints.
- **3D card**: the illustration at the card's full width (4:5, as tall as the screen allows) and below it title, place, progress + `listen`, summary, facts and sources; see [story.md](story.md).
- **Corner buttons (credits and music; globe and home)**: same height (44 px), same 2 px ink outline (`.ui-btn-bar`, `.ui-fab-md`; none filled), 18 px icons, centre-aligned. The music icon (`sound` / `sound-off`) says the state: it is not dimmed, so the two weigh the same.
- **Comic page pill**: "05. Six minutes of fall" (number, dot, space and the title as it comes from `story.json`, not lowercased).
- **Globe (the game menu)**: the world's field, a grid in the world's light tint, ink limb and stars; it **turns on two axes (own axis and pitch, no roll)** with limits (see [architecture.md](architecture.md#globe-view-explore)) and zooms within limits (0.75–2.6). **No panels**: the world is changed with **text** (`.ui-world`: "Mars  Moon" in 800; the current one has an accent underline that slides with a bounce, the other tilts and grows on hover); a hint pill of ink at the bottom; and the **vehicles sunk into a mass that glues them to the ground** (the symbiote effect: ink + accent + paper, one mesh, a recognisable shape that turns to face you, breathes and stretches like jelly; a pulsing square paper ring; an ink label only on hover). The **vehicle card floats** beside it (paper with stroke, +0.6°), closes with an **X** (`.ui-fab-sm`, spins 90° on hover), with Esc or a click outside, and the globe stays still and locked while it is open.
- **Loading** (`Loading.tsx`): see below.

## 3D scene

- **Sky and fog** = the world's `canvas`: the horizon melts into the field, like the pages over the background of the reference.
- **Terrain**: the same height map, `MeshToonMaterial` with 3 tone steps (`RAMP` 120/190/255) in **sand** (Mars) and **silver** (Moon) with **ink contour lines** drawn by its shader (`withContours`, `lines` = ink).
- **Dust** cream/lilac (`#F4DDD0` / `#E9E2F8`), soft ink **tracks**. **Beacons**: ink pole and ring (grey once reached) and an accent gem.
- Light and shadows are kept; what is drawn on top (UI, globe, beacons) is flat. `Canvas flat` (no tone mapping).

## The grain

`body::after` in `globals.css`: a fixed, static layer with a noise tile (SVG `feTurbulence`) at the opacity `THEME.grain`. It is **texture, not a gradient or a glow**: the reference has it over its blue. It is a full-screen layer over the WebGL canvases; its cost was not measured on the owner's laptop (see [performance.md](performance.md)); if it weighs, `grain: 0` in `themes.ts` removes it.

## Vehicles

They follow the **3 tones of a single colour** aesthetic with no outlines or gradients (see `lib/vehicles/kit.ts`, proportions measured on reference GLBs, recipe in [themes-and-missions.md](themes-and-missions.md)). They read well on cream paper and against the field. In the globe's card they are **still, in isometric view**, inside a stroked frame on `paperLight`. **Open art decision:** the reference draws its characters in black ink and cream, no colours; vehicles keep their colours. Going further would mean redrawing them in ink (black + cream).

## Motion (smooth, and playful where it is a game)

- **Two curves** and three durations: `THEME.ease` (smooth, for everything functional) and **`THEME.pop`** (bounces and settles) for the **game** elements of the menu and the buttons. No loose `ease`/`linear` or invented durations.
- **Game pops**: `components/Pop.tsx` enters/leaves with scale + tilt + bounce (world selector, music, bottom hint, the vehicle card that comes out of its vehicle); `.ui-btn` rises and tilts on hover and squashes when pressed; `.ui-fab-sm` (the X) spins 90°. In 3D (`lib/motion.ts`, springs from `useFrame`): the globe and each vehicle appear with a staggered bounce, each vehicle hops every few seconds, grows and wiggles on hover and bounces when selected. Loops use the Web Animations API (the arrow of "travel to the past"). `prefers-reduced-motion` removes the hops and wiggles.
- **Entrances**: fade + 14 px rise (`Reveal`), staggered; the checkpoint card and the minimap rise 18 px and fade in 600–1000 ms.
- **State changes**: colour, opacity and size by transition; in 3D they are interpolated (`lerp` with `1 − e^(−k·dt)`).
- **View transitions**: when travelling, the globe melts into the field and the scene comes in from that same field (and back): no cuts.
- **`prefers-reduced-motion`**: `globals.css` reduces all transitions to ~0.
- New `@keyframes` are not picked up by the dev server: use transitions (`ease()` from `lib/ui.ts`, `Reveal`).

## Comic of the story (`components/Comic.tsx`)

The pages follow the language of ponpon-mania.com/chapter/3: **cream paper over the field**, with **flat blobs** behind (here they float and move with each page) and an **ink pill** at the bottom (title + progress in accent + round `.ui-fab-sm` buttons). Each page: an ink frame (`stroke`) with the **AI illustration** at full page (4:5), a **date stamp** tilted −3° (enters with a bounce), the `n/N` counter and a **title + summary box** tilted +0.5° that rises with a bounce. Neighbouring pages are smaller and paler (0.8 / opacity 0.6) and tilted; the active one straightens. The illustration zooms slowly on arrival. Everything with `THEME.pop`. The illustrations are labelled **"AI-generated illustration"** (they are not photos).

## Credits — "created by"

A "Credits" button (`.ui-btn.is-ghost`, icon `user`) top right of the globe and the home, next to the music one. Its card is a **comic page** (paper + ink stroke, +0.6°) that springs in below the button: the title "created by" with the X, and one panel per person: the **portrait in an ink frame** (4:5, tilted ±0.9°), the name (26 px, 800), the role and a primary "LinkedIn →" button. It closes with the X, `Esc` or a click outside. **`CreatedBy`** repeats the people small (a round portrait with an ink ring, name and role, linked) at the foot of every story's closing card. The portraits are flat illustrated ones supplied by the owner (one tone of colour per person), at 720 px in `public/team/`. Data in `lib/team.ts`.

## Home

The cover is **one composition**, like the cover of a game (reference: the home of ponpon-mania.com: characters, a centred logo, a circular spinning badge). **There are no views that pass one after another or a background image**: the stories' illustrations are **cards** spread over the table and **Opportunity in 3D, big and still**, stands in front of them. Almost no text (the logo, the badge and a "start" button). It is the **only screen with the palette of the reference** (the `home` world in `WORLDS`, extras in `HOME`, both in `themes.ts`): a **periwinkle** field `#7E7EFF`, ink and paper. The flat rules still hold (no shadows or gradients; only the grain). *Tried and dropped at the owner's request: a sun/blob with cloud bands, Mars and the Moon in the background, a pink cloud, and the other 3D vehicles.*

- **Stage and two compositions** (`lib/home.ts`): everything is placed on a "stage" of fixed units scaled to fit (`stageScale`). `WIDE` (landscape: stage 1700 × 1000, vehicle in the centre, two cards on each side) and `TALL` (a phone held upright: 1000 × 1700, four cards in two rows above the vehicle); `layoutFor(w, h)` chooses. The cards are DOM; the vehicle, a single 3D canvas placed with the same coordinates.
- **Four cards** (`CARDS`: one AI illustration per story — Beagle 2 and Spirit on the left, Ingenuity and Surveyor 3 on the right —, chosen by its beat): a paper frame with an ink stroke, **two on each side** of the vehicle, **tilted playfully and of different sizes** (225–270), **floating** (up and down, wobble) and entering **dealt from below**, with a bounce, staggered. On hover **they lift, straighten and grow** and their name shows. **They are decoration: they open nothing** (`div`s with no hand cursor).
- **One 3D vehicle** (`PIECES`, `HomeScene.tsx`): **Opportunity** (green: `HOME.vehicles`, so it reads against the periwinkle), big (scale 2.9 on the wide composition, 2.7 on the tall one: `Layout.piece`) and **with no animation or interaction**: it does not sway, follow the pointer or parallax; it is drawn once (`frameloop="demand"`) and again on resize. It is positioned by its **nearest wheels** in stage coordinates. The canvas does not capture the pointer. To add more vehicles: another entry in `PIECES`, its spot in each `Layout` and, if needed, its colour in `HOME.vehicles`.
- **Spinning badge** (the reference's: an ink ring with `textPath`, a butter centre with an arrow, it spins by itself and speeds up on hover; top left) and the **"start"** button (a little above the bottom edge): both open the globe (`/mars`). They live on the stage but **do not shrink below a minimum** (`keepSize`). The **logo** (`Logo.tsx`) returns home from the globe.
- **Sparkles** (`Sparkles.tsx`): flat little stars that twinkle, a trail behind the pointer and **confetti on click**. **Parallax** of all layers with the pointer (`data-depth`).
- **Entrance**: a loading screen ("Waking up the rovers") that lifts when the six illustrations are decoded and the canvas exists; then everything enters with a staggered `Pop`. On leaving, it melts into the field colour.
- `prefers-reduced-motion`: no parallax, drift, floating, spinning or trail sparkles. A single `requestAnimationFrame` loop moves all the DOM (no re-renders).
- **Pending:** the logo is not hand-drawn; the cost of the two canvases (2D sparkles + 3D) on the owner's laptop was not measured.

## Responsive

The whole solution looks and plays well on **phone, tablet and desktop**. Two levels of decision:

- **Size classes** (`lib/viewport.ts`, `useViewport()`): **`compact`** (width < 1100 px or height < 600: the desktop HUD does not fit → tablets, phones and small windows), **`phone`** (< 640 px wide), **`short`** (< 520 px tall: a **sideways** phone), `portrait`, `touch` (coarse or compact pointer). Only used for decisions CSS cannot take (which HUD to mount, which buttons to show). Purely visual adjustments go in CSS (`clamp`, `dvh`, `env(safe-area-inset-*)`).
- **What is hidden or changed:**

  | View | Desktop | Phone |
  | --- | --- | --- |
  | **Home** | wide composition (vehicle centred, 2 cards on each side) | its own **vertical** composition (`TALL`): 4 cards in two rows above Opportunity; the badge, "start" and the logo **grow** when the stage shrinks (`keepSize`) to stay tappable; Credits icon only |
  | **Globe** | selector top left, logo centred, card floating beside the vehicle | logo top left, credits/music as **icons**, **world selector at the bottom** (within thumb reach), hint "drag to spin · pinch to zoom · tap a vehicle"; the card is a **bottom sheet** (sideways: a panel on the right) and **the globe moves** (`globeShift`) so its vehicle stays visible |
  | **Comic** | 44 vw pages with the neighbours peeking | a 78 vw page (4:5 fitted to the height), a compact top bar ("skip"), smaller one-line subtitles, the bottom pill carries only the number and the bar; **sideways**: a small page **without the text box** (the subtitles carry it); the closing card scrolls inside its page |
  | **3D scene** | card on the left, minimap on the right, keys at the bottom | **no minimap** (the timeline says where you are) and **no key chips**: everything stacks at the bottom (subtitles → card → timeline → controls). The checkpoint card is a **peek** (thumbnail, title, listen) that unfolds on a tap; the timeline markers have an enlarged touch zone (`.ui-hit`). **Sideways**: the stack goes to the left, the controls bottom right, and the camera shifts the picture so the vehicle sits in the free corner |

- **Touch controls** (`TouchControls` in `Hud.tsx`): a big **"hold to drive"** button (hold = Space; a stationary vehicle has **"next moment"**, a tap) and three round toggles (narration, guide, music = N, G, S). With `setPointerCapture` a finger can slide off the button without releasing the drive.
- **Touch globe**: dragging with one finger turns it (movement is computed from `clientX/Y`, because a finger gives no `movementX`); **pinching** with two fingers zooms (the drag is ignored meanwhile, `touch.pinching`).
- **Scene camera on tall screens**: it pulls back (up to ×1.6 at 390 × 844) and aims a bit below the vehicle so it sits above the stacked HUD.
- **View meta tag** (`layout.tsx`): `viewport-fit=cover` (the HUD respects the notch and the bottom bar with `env(safe-area-inset-*)`) and page zoom off (the game handles its gestures). `overscroll-behavior: none`.
- **Testing a size** without resizing the window (the resize tool does not work on a maximised window): open `/any-404-route`, replace the `body` with an `<iframe src="/route" style="width:390px;height:760px">` and drive it with `iframe.contentDocument`. Sizes used: 390 × 844 (phone), 844 × 390 (sideways), 768 × 1024 (tablet). Beware: reloading many iframes with WebGL exhausts the GPU and the tab dies; open a new tab if that happens.
- **Pending:** not tested on a physical phone (the touch gestures were tested by code and with synthetic events, not with a real finger); the sideways scene is functional but tight on space.

## Loading

One loading screen (`components/Loading.tsx`): the world's field, a huge 800 title bottom left, a bold lowercase stage line and a 6 px bar (ink on paper) glued to the bottom edge. Every stage of a trip (route fallback, chunk download, terrain download and build) draws the same thing in the same place, so going from one to the next never shows a different screen. Nothing appears abruptly: exits fade **before** navigating, and canvases/photos enter with a fade (`FadeImg`, `onCreated`). The scene's cover waits for `game.terrain` to be published (the terrain built and the shaders compiled with `<Preload all/>`).

## Rules (checklist)

1. **Solid colours.** No gradients, no shadows (`box-shadow` for depth, `drop-shadow`, `text-shadow`), no glows or decorative blurs. Accepted exceptions: the 2 px outline of `.ui-btn.is-ghost` (a stroke, not a shadow) and the static **grain**.
2. **Ink stroke** (`stroke`) on panels, photos and illustrations; almost-square corners on paper, **pills** on buttons and chips.
3. **Depth by colour and surface**, not by light: paper over the field.
4. **One accent per world** (butter on Mars, mint on the Moon), used sparingly; the field is not an accent.
5. **Typography and icons**: Libre Franklin (800 titles, 700 lowercase on labels); no kickers; icons only from `Icon.tsx`.
6. **Images**: the checkpoints' illustrations (4:5, with credit) inside an ink frame, no filters; vehicles are drawn; the comic's panels are illustrated.
7. **Motion**: the theme's curve and durations; nothing abrupt; respect `prefers-reduced-motion`.
8. **Tokens, not loose values**: if a colour or a measure is missing, add it to `themes.ts`.

## How to apply it in code

- Tokens: `src/lib/themes.ts` (`BASE` + `WORLDS`; `themeFor`, `useTheme`). They are published as CSS variables on `<html>` (`cssVars`, `WorldVars`) and the canvas/WebGL reads them directly.
- Text and container styles: `src/lib/ui.ts` (`ui(theme)` → `label`, `display`, `title`, `text`, `panel`, `value`, `frame`); `ease(theme, props, ms?, delay?)` for `transition`.
- Interactive states: the classes `.ui-btn`, `.ui-link`, `.ui-row`, `.ui-nav`, `.ui-marker`, `.ui-fab`, `.ui-world` in `src/app/globals.css`. Icons: `<Icon name="arrow-right" />`. Soft entrances: `components/Reveal.tsx`.
- Before accepting a screen: is there a shadow, gradient or glow? Any jump without a transition? Any colour or curve outside `themes.ts`?

## Open

- The reference's typeface is Libre Franklin (free), so it matches; the original's **hand-drawn logotype and titles** have no equivalent (Libre Franklin 800 is used).
- Check the contrast of ink text on the periwinkle field on a projector (loading, globe labels) and the legibility of the grain.
- Check the contrast of Mars' accent (butter) on the sand ground (the active beacon uses a deeper tone, `beacon`) and of mint on silver on the Moon.
- Align (or not) each vehicle's colour with its world's palette.
- An independent finish review (design skill) was **not run**; verification was visual in the browser.
