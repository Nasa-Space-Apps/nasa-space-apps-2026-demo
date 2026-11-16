# Performance: what it costs and how to roll back

Measured on the owner's laptop (Ryzen AI 7 350 with an **integrated Radeon 860M**, 23.3 GB of RAM, Brave, a screen with 2.5 scaling). An iGPU **shares the system RAM**, so whatever weighs on the GPU also weighs on memory.

## The performance profile (`src/lib/perf.ts`)

A single switch with two profiles. **To go back to the previous behaviour change `PERF_PROFILE` to `"full"`** (or start with `NEXT_PUBLIC_PERF=full npm run dev`). Never put `dpr`/`antialias` loose on a `Canvas`: use `PERF`.

| | `light` (default) | `full` (before) |
| --- | --- | --- |
| Pixel density of the canvases (`dpr`) | 1 – **1.5** | 1 – 2 |
| Antialiasing of the 3D scene | **no** | yes |
| Antialiasing of the globe | yes (thin lines look bad without MSAA) | yes |
| Redraw of the scene with the vehicle stopped | **30 fps** (`FrameGovernor`) | 60 fps |
| Redraw with the vehicle moving | 60 fps | 60 fps |
| A view that is not the current route | **releases its WebGL canvas** (`Scene`/`Explore`/`Home` return `null`) | stays mounted and hidden |

The visual trade-off: without antialiasing the diagonal edges of the vehicles look slightly stepped when magnified (at normal size it is barely noticeable). If it bothers, set `sceneAntialias: true` in `light` (it costs ~5–7 GPU points).

## What it cost (before the changes)

Use of the GPU's 3D engine by the browser's GPU process (a static text page: 0.1 %):

| Configuration | GPU |
| --- | --- |
| Scene, `dpr` 2, MSAA, shadows, contour lines (before) | **26 %** (28–31 % in other measures) |
| … `dpr` 1.5 | 21 % |
| … `dpr` 1 | 14 % |
| … no antialiasing | 19 % |
| … no shadows | 25 % (they do not weigh) |
| … no terrain contour lines | 28 % (they do not weigh) |
| … `dpr` 1 + no AA + no shadows + no contours | 11 % |
| Globe (before) | 17–21 % |

**Memory:** the JavaScript is negligible (21 MB on the globe, 57–69 MB in the scene). What weighed was the **shared GPU memory**: Next **keeps visited routes mounted and hidden**, each with its 3072×1550 `Canvas` (4.8 Mpx): after visiting two scenes there were **8 canvases** and the GPU memory had grown from 1.84 GB to 2.94 GB (≈ +350–400 MB per visited scene, never returned).

## Result with the `light` profile

| | Before | Now |
| --- | --- | --- |
| Scene with the vehicle stopped | 26 % GPU | **~10 %** |
| Globe | 17–21 % | **~13 %** |
| Scene moving | 60 fps | 60 fps |
| Canvases after visiting 2 scenes and returning to the globe | 8 | **3** |
| Shared GPU memory after that route | 2.94 GB | **2.38 GB** (the GPU process: 2.6 → 1.6 GB) |

## How it is done

- **`lib/perf.ts`**: profiles and the switch. The canvases read `PERF.dpr`, `PERF.sceneAntialias` / `globeAntialias` (`Scene`, `Globe`, `VehicleView`).
- **Releasing hidden views**: `Scene`, `Explore` and `Home` compare `usePathname()` with their route and, if it is not the current one, render nothing (the canvas is unmounted, WebGL contexts and textures are freed). On returning they are rebuilt (with their fade-in). The important state lives in the URL (hash) and in `game`, so nothing is lost.
- **`components/FrameGovernor.tsx`**: puts the scene's canvas in `frameloop="demand"` and asks for frames at `idleFps` while the vehicle is stopped (speed ~0, no automatic trip). While moving it asks for the next frame **from inside `useFrame`**: that is the trick that keeps 60 fps (invalidating only from outside the render gives one frame in two, 30 fps also while moving: a bug that was found and fixed by measuring).
- The globe is **not** limited to 30 fps: its transitions (zoom, the turn towards the vehicle) must be smooth.

## How to measure again (Windows)

1. Open the demo (`npm run dev`) in the browser and leave the view still for a few seconds.
2. **GPU per process** (PowerShell): `Get-Counter '\GPU Engine(*)\Utilization Percentage' -SampleInterval 1 -MaxSamples 5`, grouping the `engtype_3D` instances by `pid_…`; the process with the most use is the browser's GPU process. **GPU memory:** `Get-Counter '\GPU Process Memory(*)\Shared Usage'` (and `Dedicated Usage`).
3. **In the page** (console or an automation tool): `performance.memory.usedJSHeapSize` (JS heap), `document.querySelectorAll('canvas')` (how many and what size), and counting `requestAnimationFrame` per function (which loops run and at what rate).
4. **Frames really rendered:** wrap `WebGL2RenderingContext.prototype.drawElements` and count calls per second (≈ 64 per frame in the scene: 1,920/s = 30 fps, 3,840/s = 60 fps). Beware: counting `requestAnimationFrame` of `loop` is misleading (R3F calls it twice per frame in demand mode).
5. Always compare against a static page (baseline ≈ 0 %) and repeat the measure: there is noise from other tabs and apps.

## Other levers, if more is needed

- Lower `dpr` to 1.25 or 1 in `light` (from 1.5 to 1: −7 GPU points).
- Throttle the globe to 30 fps while there is no interaction (it sacrifices some smoothness in the automatic spin).
- `powerPreference: "low-power"` in `gl` so the browser uses the iGPU/battery saving on machines with a dedicated GPU.
- The development server (`next dev` + Turbopack) takes ~590 MB of RAM; a production build (`npm run build && npm start`) uses less and is faster (not measured so as not to overwrite the running dev server's `.next`).
- The grain layer (`body::after`) is a full-screen layer over the canvases and its cost was **not measured**; `grain: 0` in `themes.ts` removes it.
