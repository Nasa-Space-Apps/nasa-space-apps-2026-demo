# Activos 3D (`public/models`)

Todos los modelos los proporcionó el usuario (originales en su carpeta `Downloads`). Los nombres en `public/models` son
cortos; abajo se indica el original.

| Archivo | Original | Tamaño | Uso |
| --- | --- | --- | --- |
| `terrain.stl` | `Opportunity Landing Site.stl` | 2.7 MB | Terreno de Marte |
| `opportunity/opportunity.glb` | `Mars Exploration Rover - Opportunity (MER-B).glb` | 36 KB | **No se carga**: referencia de proporciones del modelo procedural (3 845 triángulos, brazo extendido) |
| `moon-terrain.stl` | `Apollo 14 - Landing Site.stl` | 6.6 MB | Terreno de la Luna |
| `sev/sev.glb` | `Space Exploration Vehicle.glb` | 22 MB | **No se carga**: referencia (es el MMSEV: 413 mil triángulos en una sola malla texturizada) |
| `gale-terrain.stl` | `Curiosity Landing Site.stl` | 2.7 MB | Terreno de Marte (**cráter Gale**, donde aterrizó Curiosity en 2012) para el vehículo de prueba Perseverance |
| `perseverance/perseverance.glb` | `Mars 2020 Perseverance Rover.glb` | 4.8 MB | **No se carga**: referencia de proporciones (200 mil triángulos, 88 nodos con nombre, en metros, con el mástil plegado) |

Los GLB de referencia viven **una carpeta por vehículo** (`public/models/<id>/`), y los de los vehículos de la siguiente tanda (Spirit, Ingenuity, InSight, Beagle 2) con sus fotos de referencia están descritos en [`public/models/SOURCES.md`](../public/models/SOURCES.md) (qué se descargó, de dónde, licencias y qué falta).

## Globos de la vista de entrada

Sin assets: los globos son una rejilla de líneas generada por código (`Globe.tsx`, en proyección ortográfica). Se probaron texturas realistas (Solar System Scope, CC BY 4.0) y se descartaron por estilo.

## Fotos de los vehículos (`public/images/vehicles`)

**Sin uso.** Fueron la imagen de la tarjeta del globo (NASA, dominio público: `opportunity.jpg` = PIA17759, autorretrato de ene 2014; `sev.jpg` = jsc2008e138809, Lunar Electric Rover, antecesor del SEV)
hasta que la tarjeta pasó a dibujar el vehículo procedural. Se conservan como referencia visual de proporciones; se pueden borrar.

## La historia de Opportunity (`public/models/opportunity`, hito 36)

`story.json` (los 20 beats: copy, hechos, fuente, ruta 3D), `images/oppNNN.jpg` (20 ilustraciones de IA a 1040 px, 4:5, ≈ 4 MB; originales de 1856×2304 en la carpeta de arte del equipo) y `audio/oppNNN.mp3` + `manifest.json` (narraciones con Bill, ≈ 6,6 MB, ya grabadas). Se generan con `npm run story` y `npm run story-audio`; el detalle está en [story.md](story.md). Además de esto, la carpeta sigue teniendo `opportunity.glb` (referencia de proporciones del vehículo).

## Narraciones (`public/narration`)

Un mp3 por checkpoint (16 clips: 5 + 5 + 6; ~300 KB, 20 s, `mp3_44100_128`, voz Bill, modelo `eleven_v4`) + `manifest.json` con los metadatos de cada
grabación. Los genera `scripts/generate-narration.mjs`; no se editan a mano. Ver [narration.md](narration.md).

## Guía de voz (`public/guide`)

62 mp3 cortos (~25 KB, 2–5 s, `mp3_44100_64`, voz Daniel, modelo `eleven_flash_v2_5`; 1,2 MB en total) + `manifest.json`. Los genera
`scripts/generate-guide.mjs` a partir de `src/lib/guide-lines.ts`; no se editan a mano. Ver [guide.md](guide.md).

## Imágenes de los checkpoints (`public/images/checkpoints`)

Fotos de dominio público de NASA, recortadas a **16:10** y optimizadas (JPEG, ≤ 960 px de ancho, 20–100 KB) con `sharp`.
Fuente: [images.nasa.gov](https://images.nasa.gov) (`images-assets.nasa.gov/image/<id>/<id>~medium.jpg`; algunos ids solo tienen
`~small` o `~orig`; los `as14-*` van en minúsculas y las del Apollo salen de 1280×1280). El crédito de cada una se guarda en `src/lib/checkpoints.ts` (`credit`) y se muestra bajo la foto.

| Archivo | ID NASA | Contenido |
| --- | --- | --- |
| `mars-landing.jpg` | PIA05251 | Zona de aterrizaje de MER-B en Meridiani Planum con la elipse objetivo (MOC; recorte del original de 853 px) |
| `mars-perseverance.jpg` | PIA23246 | HiRISE: huellas de Opportunity en Perseverance Valley (2000×1200 → 960) |
| `moon-landing.jpg` | PIA12897 | LRO: zona de aterrizaje de Apollo 14 (Fra Mauro) con los cráteres Triplet |
| `moon-lastlight.jpg` | AS14-66-9293 | Sombra de un astronauta sobre el horizonte lunar |
| `mars-eagle.jpg` | PIA21494 | Cráter Eagle y restos del aterrizaje, vista orbital (HiRISE) |
| `mars-endurance.jpg` | PIA15091 | Capas de «Burns Cliff» en el cráter Endurance (con anotaciones) |
| `mars-victoria.jpg` | PIA09924 | Hazcam trasera tras entrar en el cráter Victoria |
| `moon-antares.jpg` | AS14-66-9306 | Módulo lunar Antares de Apollo 14 |
| `moon-cone.jpg` | AS14-64-9099 | Campo de bloques en el flanco del cráter Cone |
| `moon-sampling.jpg` | AS14-68-9405 | Astronauta con el carro MET junto a un cráter |
| `mars-jezero-landing.jpg` | PIA24350 | Elipse de aterrizaje de Perseverance en el cráter Jezero y su delta (ESA/DLR/FU-Berlin) |
| `mars-wright-brothers.jpg` | PIA24590 | Ingenuity en vuelo estacionario, visto por la Mastcam-Z (19 abr 2021) |
| `mars-montdenier.jpg` | PIA24832 | El testigo de roca «Montdenier» dentro del taladro (Mastcam-Z, 4 sep 2021) |
| `mars-delta.jpg` | PIA24814 | HiRISE: el delta de Jezero con el escarpe y la colina Kodiak (anotada; 866 × 541) |
| `mars-three-forks.jpg` | PIA25681 | Autorretrato de Perseverance con tubos del depósito Three Forks (WATSON, sol 684) |
| `mars-sunset.jpg` | PIA24935 | Primera puesta de sol de Mastcam-Z (sol 257); panorámica pequeña recortada y ampliada a 640 × 400, de ahí que se vea suave |
| `mars-spirit-wheel.jpg` | PIA06685 | Prueba de Spirit con cinco ruedas (JPL, 640 × 400: baja resolución) |
| `mars-spirit-ridge.jpg` | PIA16442 | Panorama polar de Spirit con su propia cubierta (McMurdo) |
| `mars-spirit-basin.jpg` | PIA11804 | Spirit junto a Home Plate, sol 1809 (blanco y negro) |
| `mars-spirit-sand.jpg` | PIA12352 | Ensayo en caja de arena para sacar a Spirit (JPL) |
| `mars-ingenuity-airfield.jpg` | PIA23882 | Ingenuity en estudio |
| `mars-ingenuity-hover.jpg` | PIA24547 | Primer plano de Ingenuity en Marte (Mastcam-Z) |
| `mars-ingenuity-eye.jpg` | PIA23969 | Cámara inferior de Ingenuity, probada en la Tierra |
| `mars-ingenuity-last.jpg` | PIA24466 | **Ilustración** de Ingenuity en vuelo junto al rover |
| `mars-insight-lander.jpg` | PIA19664 | InSight en configuración de superficie, en sala blanca |
| `mars-insight-arm.jpg` | PIA22952 | Prueba del brazo de InSight en la Tierra |
| `mars-insight-panels.jpg` | PIA22201 | Prueba del panel solar de InSight |
| `mars-insight-selfie.jpg` | PIA22876 | Primer selfie de InSight |
| `mars-insight-dusty.jpg` | PIA23203 | Selfie de InSight con polvo |
| `mars-beagle-museum.jpg` | Commons | Réplica de Beagle 2 · gocarts · **CC BY 2.0** |
| `mars-beagle-leicester.jpg` | Commons | Réplica en el Space Centre de Leicester · Gavin Stewart · **CC BY 2.0** (800 × 500) |
| `mars-beagle-spaceport.jpg` | Commons | Maqueta en Spaceport · Mike Peel · **CC BY-SA 4.0** |
| `mars-beagle-replica.jpg` | Commons | Réplica · user:geni · **CC BY-SA 4.0** |
| `mars-beagle-petals.jpg` | Commons | Réplica a escala 1:1 con los pétalos abiertos · Neil Owen · **CC BY-SA 2.0** |

Estas 18 son de los vehículos **demo ficticios** (`lib/checkpoints-demo.ts`); salen de `public/models/<id>/images`. Los créditos de las de Beagle 2 se muestran bajo la foto (la licencia lo exige).

Para cambiar una: descarga el original, recórtalo a 16:10 con `sharp` (ancho completo, ventana de alto `ancho/1.6` desde el
`top` que encuadre el motivo) y guárdalo con el mismo nombre. Receta completa de checkpoints en
[themes-and-missions.md](themes-and-missions.md#checkpoints-storytelling--srclibcheckpointsts).
Ojo: la API de Wikimedia Commons limita las peticiones (error «too many requests»); la de NASA no.

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
Los GLB originales siguen en `public/models` (el SEV no sale de ninguna misión real en Apollo 14).
