# Activos 3D (`public/models`)

Todos los modelos los proporcionó el usuario (originales en su carpeta `Downloads`). Los nombres en `public/models` son
cortos; abajo se indica el original.

| Archivo | Original | Tamaño | Uso |
| --- | --- | --- | --- |
| `terrain.stl` | `Opportunity Landing Site.stl` | 2.7 MB | Terreno de Marte |
| `moon-terrain.stl` | `Apollo 14 - Landing Site.stl` | 6.6 MB | Terreno de la Luna |
| `gale-terrain.stl` | `Curiosity Landing Site.stl` | 2.7 MB | Terreno de Marte (**cráter Gale**, donde aterrizó Curiosity en 2012) para el vehículo de prueba Perseverance |

Los GLB y las fotos de referencia de los vehículos (una carpeta por vehículo en `public/models/<id>/`) **ya no están**: Se eliminaron en el hito 43 (limpieza de `public`); siguen en el historial de git (`git log --diff-filter=D -- public/...`). Qué se descargó, de dónde y con qué licencia sigue descrito en [`model-sources.md`](model-sources.md).

## Globos de la vista de entrada

Sin assets: los globos son una rejilla de líneas generada por código (`Globe.tsx`, en proyección ortográfica). Se probaron texturas realistas (Solar System Scope, CC BY 4.0) y se descartaron por estilo.

## La historia de Opportunity (`public/models/opportunity`, hito 36)

`story.json` (los 20 beats: copy, hechos, fuente, ruta 3D), `images/oppNNN.jpg` (20 ilustraciones de IA a 1040 px, 4:5, ≈ 4 MB; originales de 1856×2304 en la carpeta de arte del equipo) y `audio/oppNNN.mp3` + `manifest.json` (narraciones con Bill, ≈ 6,6 MB, ya grabadas). Se generan con `npm run story -- opportunity` y `npm run story-audio -- opportunity`; el detalle está en [story.md](story.md).

## Historia de Surveyor 3 (`public/models/surveyor3/`, hito 42)

`story.json` (20 beats), `images/surNNN.jpg` (20 ilustraciones de IA, 1040 px, 4:5, ≈ 3,9 MB, con `manifest.json` y los prompts de cada una) y `audio/surNNN.mp3` + `manifest.json` (narraciones con Bill, ≈ 6,5 MB). Se generan con `npm run story-images`, `story-route`, `story` y `story-audio` (`-- surveyor3`); ver [story.md](story.md#historia-de-surveyor-3-hito-42).

## Historia de Ingenuity (`public/models/ingenuity/`, hitos 39–40)

20 ilustraciones de IA (Nano Banana 2.1 en Replicate, 4:5, 1040 px, ≈ 3,7 MB) `ingNNN.jpg` + `manifest.json` con el prompt de cada una; generadas con `npm run story-images -- ingenuity` (ver [story.md](story.md#ilustraciones-de-otras-misiones-ingenuity-hito-39)). Viven en `images/` (la misma ruta que Opportunity; las fotos PIA de referencia que había allí se eliminaron). Junto a `story.json` y `audio/ingNNN.mp3` (20 clips de Bill, ≈ 6,9 MB) forman la historia de Ingenuity: [story.md](story.md#historia-de-ingenuity-hito-40).

## Narraciones, guía de voz e imágenes de los checkpoints antiguos (eliminados, hito 43)

Las historias de Opportunity, Ingenuity y Surveyor 3 llevan **todo en su carpeta** (`public/models/<misión>/`). Lo que quedaba de la plataforma anterior y ya no ve nadie se borró de `public`: `narration/` (17 clips de los checkpoints antiguos), `images/checkpoints/` (30 fotos de NASA) e `images/vehicles/`, y de `guide/` las frases por checkpoint (`next-*`, `remind-*`) y las de Perseverance y SEV. Se eliminaron en el hito 43 (limpieza de `public`); siguen en el historial de git (`git log --diff-filter=D -- public/...`).

Se queda en `public/guide` (30 clips + `manifest.json`, voz Daniel, `eleven_flash_v2_5`) la guía **genérica** (distancia, progreso, parado, listo, fin) y las frases de Opportunity: son las que oyen las historias. Ver [guide.md](guide.md).

> El código que apuntaba a esos clips (los checkpoints antiguos de `checkpoints.ts`, `checkpoints-demo.ts`, `generate-narration.mjs` y las frases por checkpoint de la guía) también se eliminó (hito 44): ya no hay nada que regrabe lo borrado.

## Terrenos (STL binario, exportado desde Blender)

Ambos son **mapas de altura** (un único valor de Z por cada X/Y), en **Z-up**; el código los rota a Y-up y los centra.

| | `terrain.stl` (Marte) | `moon-terrain.stl` (Luna) |
| --- | --- | --- |
| Triángulos | 55 134 | 139 270 |
| Extensión X | −762 … 0 | −127.7 … 127.7 |
| Extensión Y | −484 … 75 | −127.7 … 127.7 |
| Rango Z (altura) | −2.2 … 23.2 | −7 … 31.2 |
| Notas | Es un cuadrante (x ≤ 0): se recentra. Casi plano a escala del rover. | Cuadrado ya centrado. Mucho más accidentado. |

Procesado: ver «Terreno» en [architecture.md](architecture.md). El aplanado de bordes modifica la altura en los últimos
`fade` unidades de cada lado.

**Terreno de Gale** (`gale-terrain.stl`, Blender 2.69, 55 134 triángulos): extensión X −686 … 75, Y −483 … 75, Z −6,6 … 34,2 (más relieve que el de Opportunity, mismo tamaño). Es un **mapa de altura** con un gran cráter central (suelo plano a z ≈ 0 hacia (X 80, Z 100)) rodeado de un borde de 20–30 de altura; las zonas llanas y fáciles de recorrer están en la meseta norte (Z ≈ −200) y la este (X > 150). El código lo recentra igual que los demás.

**Escala:** no son metros. Marte ≈ 470 m/unidad (≈ 263 × 356 km) y la Luna ≈ 118 m/unidad (≈ 30 × 30 km), ambos con el eje
vertical exagerado. Ver «Por resolver: escala real» en [roadmap.md](roadmap.md).

**Rasgos útiles** (coordenadas de mundo, centradas; `X = x_stl − centro`, `Z = −(y_stl − centro)`): en ambos el **centro es un
cráter** (el punto de aterrizaje; en Marte con paredes muy empinadas). Marte: depresión grande hacia (205, −170) y zona baja
al sureste; terreno alto al oeste (X ≈ −300). Luna: meseta alta al este/sureste (X > 20, Z > 0), zona baja al oeste.

## Vehículos

**Ya no hay GLB en uso**: los vehículos son **procedurales** (`src/lib/vehicles/`), en el estilo plano de 3 tonos de [design.md](design.md#vehículos), con las proporciones medidas sobre los GLB de arriba. Medidas en unidades de escena
(no metros; siguen sobredimensionados, ver [roadmap.md](roadmap.md)):

| | Ruedas | Tamaño (ancho × largo × alto) | Triángulos | Escala sobre el GLB | Qué tiene |
| --- | --- | --- | --- | --- | --- |
| `opportunity` | 6 (radio 0,85) en rocker-bogie; ejes en z 2,85 / −1 / −3,2 | 10,9 × 8,9 × 9,0 | 15,9 mil | × 1,25 | caja caliente, cubierta solar en flecha (centro, dos alas y panel trasero) con filas de celdas, mástil con cabeza ancha (2 pancam + 2 navcam), antena de baja ganancia, plato orientable, látigo UHF, reloj de sol, brazo plegado con su torreta, hazcams |
| `sev` | 6 módulos de **ruedas gemelas** (radio 1,0) con poste de dirección | 8,9 × 13,2 × 9,2 | 27,6 mil | × 2,05 | cabina en barril que se estrecha en un morro acristalado (parabrisas de 2 paños, ventanas de esquina y 3 de barbilla), escotilla redonda con cúpula a cada lado, radiador de costillas en el techo, barra de luces, cámaras, antenas, 2 suit-ports traseros, chasis de celosía con baterías |
| `perseverance` | 6 (radio 1,15, radios curvos) en rocker-bogie con dirección en las 4 esquinas | 12,3 × 14,6 × 11,0 | 16,3 mil | × 4,4 (1 m = 4,4 u) | cuerpo con panza y cubierta, barra diferencial, generador nuclear inclinado entre sus dos placas, mástil **desplegado** con el ojo de SuperCam sobre las Mastcam-Z, brazo plegado delante con torreta y taladro, plato hexagonal, lata UHF, antena de baja ganancia, equipo de cubierta |
| `spirit` | 6 (como Opportunity); la delantera derecha **fija** (bloqueada) | 10,9 × 8,9 × 9,0 | 15,9 mil | × 1,25 | el mismo MER de Opportunity con una rueda muerta; violeta |
| `ingenuity` | **ninguna** (flota 6,4 u sobre el suelo); 2 rotores contrarrotantes (`rig.rotors`) | 10,5 × 5,7 × 5,9 | 5,1 mil | × 9 (1 m = 9 u) | fuselaje dorado, 4 patas, panel solar, antena; ámbar |
| `insight` | 3 (radio 1,0), una bajo cada pata (**ficción**: el real no se mueve) | 15,1 × 7,0 × 7,6 | 9,1 mil | × 2,15 | cubierta hexagonal, 2 abanicos solares de 12 lados, brazo con pinza, domo, antenas; turquesa |
| `beagle2` | 4 (radio 0,95) bajo la base (**ficción**) | 12,7 × 4,9 × 13,0 | 10,9 mil | × 7 (de las fotos de réplicas) | base con marco de calibración, tapa dorada con brazo, 4 paneles redondos; frambuesa |

Todos avanzan por **+z**, con las ruedas en y=0 y centradas en x/z (la carrocería no: morros, colas y brazos sobresalen; `rig.center` da el centro real). Cada vehículo son **7 mallas** (1 cuerpo + 6 ruedas) con un solo material. Las ruedas son algo más grandes que en el GLB.
Los GLB originales ya no están en `public/models` (hito 43; recuperables desde git). El SEV no sale de ninguna misión real en Apollo 14.
