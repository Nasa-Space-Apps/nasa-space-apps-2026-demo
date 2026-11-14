# Rendimiento: qué cuesta y cómo volver atrás

Medido en la laptop del usuario (Ryzen AI 7 350 con **Radeon 860M integrada**, 23,3 GB de RAM, Brave, pantalla con escala 2,5). Una iGPU **comparte la RAM del sistema**, así que todo lo que pesa en GPU pesa también en memoria.

## El perfil de rendimiento (`src/lib/perf.ts`)

Un solo interruptor con dos perfiles. **Para volver al comportamiento anterior: cambia `PERF_PROFILE` a `"full"`** (o arranca con `NEXT_PUBLIC_PERF=full npm run dev`).

| | `light` (por defecto) | `full` (antes) |
| --- | --- | --- |
| Densidad de píxeles de los canvas (`dpr`) | 1 – **1,5** | 1 – 2 |
| Antialiasing de la escena 3D | **no** | sí |
| Antialiasing del globo | sí (las líneas finas se ven mal sin MSAA) | sí |
| Redibujado de la escena con el vehículo parado | **30 fps** (`FrameGovernor`) | 60 fps |
| Redibujado con el vehículo en movimiento | 60 fps | 60 fps |
| Vista que no es la ruta actual | **libera su canvas WebGL** (`Scene`/`Explore` devuelven `null`) | queda montada y oculta |

El compromiso visual: sin antialiasing los bordes diagonales de los vehículos se ven ligeramente escalonados al ampliar (a tamaño normal casi no se nota). Si molesta, pon `sceneAntialias: true` en `light` (cuesta ~5–7 puntos de GPU).

## Qué costaba (antes de los cambios)

Uso del motor 3D de la GPU por el proceso de GPU del navegador (una página estática de texto: 0,1 %):

| Configuración | GPU |
| --- | --- |
| Escena, `dpr` 2, MSAA, sombras, curvas de nivel (antes) | **26 %** (28–31 % en otras medidas) |
| … `dpr` 1,5 | 21 % |
| … `dpr` 1 | 14 % |
| … sin antialiasing | 19 % |
| … sin sombras | 25 % (no pesan) |
| … sin curvas de nivel del terreno | 28 % (no pesan) |
| … `dpr` 1 + sin AA + sin sombras + sin curvas | 11 % |
| Globo (antes) | 17–21 % |

**Memoria:** el JavaScript es despreciable (21 MB en el globo, 57–69 MB en la escena). Lo que pesaba era la **memoria compartida de GPU**: Next **conserva las rutas visitadas montadas y ocultas**, cada una con su `Canvas` de 3072×1550 (4,8 Mpx): tras visitar dos escenas había **8 canvases**
y la memoria de GPU había subido de 1,84 GB a 2,94 GB (≈ +350–400 MB por escena visitada, sin devolverse).

## Resultado con el perfil `light`

| | Antes | Ahora |
| --- | --- | --- |
| Escena con el vehículo parado | 26 % GPU | **~10 %** |
| Globo | 17–21 % | **~13 %** |
| Escena en movimiento | 60 fps | 60 fps |
| Canvases tras visitar 2 escenas y volver al globo | 8 | **3** |
| Memoria compartida de GPU tras ese recorrido | 2,94 GB | **2,38 GB** (el proceso de GPU: 2,6 → 1,6 GB) |

## Cómo está hecho

- **`lib/perf.ts`**: perfiles y el interruptor. Los canvas leen `PERF.dpr`, `PERF.sceneAntialias` / `globeAntialias` (`Scene`, `Globe`, `VehicleView`).
- **Liberar vistas ocultas**: `Scene` y `Explore` comparan `usePathname()` con su ruta y, si no es la actual, no renderizan nada (se desmonta el canvas, se liberan contextos WebGL y texturas). Al volver se reconstruyen (con su fundido de entrada). El estado importante vive en la URL (hash) y en `game`, así que no se pierde nada.
- **`components/FrameGovernor.tsx`**: pone el canvas de la escena en `frameloop="demand"` y pide fotogramas a `idleFps` cuando el vehículo está parado (velocidad ~0, sin viaje automático). En movimiento pide el siguiente fotograma **desde dentro de `useFrame`**: ese es el truco que mantiene los 60 fps
  (invalidar solo desde fuera del render da un fotograma de cada dos, 30 fps también en movimiento: bug que se encontró y corrigió midiendo).
- El globo **no** se limita a 30 fps: sus transiciones (zoom, giro hacia el vehículo) deben ser suaves.

## Cómo volver a medir (Windows)

1. Abre la demo (`npm run dev`) en el navegador y deja la vista quieta unos segundos.
2. **GPU por proceso** (PowerShell): `Get-Counter '\GPU Engine(*)\Utilization Percentage' -SampleInterval 1 -MaxSamples 5`, agrupando las instancias `engtype_3D` por `pid_…`; el proceso con más uso es el proceso de GPU del navegador. **Memoria de GPU:** `Get-Counter '\GPU Process Memory(*)\Shared Usage'` (y `Dedicated Usage`).
3. **En la página** (consola o herramienta de automatización): `performance.memory.usedJSHeapSize` (heap JS), `document.querySelectorAll('canvas')` (cuántos hay y de qué tamaño), y contar `requestAnimationFrame` por función (qué bucles corren y a qué ritmo).
4. **Fotogramas realmente renderizados:** envolver `WebGL2RenderingContext.prototype.drawElements` y contar llamadas por segundo (≈ 64 por fotograma en la escena: 1 920/s = 30 fps, 3 840/s = 60 fps). Ojo: contar `requestAnimationFrame` de `loop` engaña (R3F lo llama dos veces por fotograma en modo demanda).
5. Compara siempre contra una página estática (línea base ≈ 0 %) y repite la medida: hay ruido de otras pestañas y apps.

## Otras palancas, si hiciera falta más

- Bajar `dpr` a 1,25 o 1 en `light` (de 1,5 a 1: −7 puntos de GPU).
- Throttling del globo a 30 fps mientras no hay interacción (sacrifica algo de suavidad en el giro automático).
- `powerPreference: "low-power"` en `gl` para que el navegador use la iGPU/ahorro en equipos con GPU dedicada.
- El servidor de desarrollo (`next dev` + Turbopack) ocupa ~590 MB de RAM; una build de producción (`npm run build && npm start`) usa menos y va más rápida (no se midió para no pisar el `.next` del servidor de desarrollo en marcha).
