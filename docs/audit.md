# Auditoría de la información (hito 54)

Revisión vehículo por vehículo de **toda** la información que ve quien usa la plataforma: texto de las tarjetas y de los cómics, narración y audio, ilustraciones, línea de tiempo y ruta 3D, modelo 3D del vehículo y su posición en el globo. Criterio: **lo que se muestra es real y está verificado; lo que no se puede resolver queda con un valor por defecto y se documenta aquí como TODO** (los `TODO(audit)` del código remiten a este archivo).

## Método y herramientas

| Qué se comprobó | Cómo | Resultado |
| --- | --- | --- |
| **Números y meses** de cada parada (fecha, resumen, datos) frente a su dossier | `npm run story-audit` (`scripts/audit-story.mjs`): cada número y el mes de la fecha deben aparecer en `dossier.json` (contexto, datos verificados, citas). Imprime solo lo que no encaja | 120 paradas; **solo 14 avisos, todos explicados** (ver abajo) |
| **Narración ↔ audio** | `npm run story-audio -- <misión> --dry-run` (el `manifest.json` guarda un hash del texto de cada clip) | **6 de 6 misiones al día** (120 clips, 0 por regrabar) |
| **Ilustración ↔ evento** | hojas de contactos con id, fecha y título bajo cada imagen (120 imágenes), vistas una a una | Todas corresponden a su evento; sin errores de contenido |
| **Cronología** | lectura de `story.json` por misión (orden, fechas, partes) | Orden correcto en las 6 historias |
| **Datos externos** (búsqueda web, nov 2026) | posiciones y cifras que los dossiers no daban | ver «Fuentes consultadas» |
| **3D** | las 6 historias abiertas en el navegador (cómic → 3D → tarjeta final), y cada cambio de abajo | Correcto tras los cambios |

Las **cifras en letra** («two», «dos») no las comprueba el script: se leyeron a mano (narraciones de Spirit, InSight y Beagle 2 contra el contexto de sus dossiers; las de Opportunity, Ingenuity y Surveyor 3 las verificó el equipo al escribirlas).

### Los 14 avisos del script (y qué se decidió)

| Parada | Aviso | Decisión |
| --- | --- | --- |
| `opp001` «4», `opp008` «2», `ing038` «2», `ing137` «6», `spi006` «2», `spi040` «1», `spi057` «3», `bgl002` «3» | el dossier lo escribe en letra («cuatro», «dos»…) | correcto; sin cambios |
| `opp033` «30» | el dossier dice que la duna medía «un tercio de metro de alto» (≈ 33 cm) | correcto (aproximación «~30 cm»); sin cambios |
| `sur035` «6,300» | el dossier da 6 315 y 6 326 | **redondeo deliberado** («más de 6 300»); sin cambios |
| `sur054` «155» | el dossier da 155 / 163 / 180 m (y otras fuentes 160–200 m) | **corregido: «~160 m»** (la cifra que dan casi todas las fuentes: 535 ft ≈ 163 m); también en la tarjeta del globo |
| `sur066` «40» | «cuarenta años» (1969 → 2009) | correcto (cálculo) |
| `spi076` «1,300» (×2) | las «más de 1 300 órdenes» están en el dossier `spi069`, no en el `spi076` | correcto (misma misión, dato verificado en `spi069`); se deja constancia |
| `bgl009` «1997», «2003» | las fechas del rango «1997–2003» | correcto (rango del desarrollo) |

## Resultado por vehículo

| Vehículo | Historia | 3D | Modelo | Globo (lat, lon) |
| --- | --- | --- | --- | --- |
| **Opportunity** | 20 eventos, verificados | conduce de verdad (45,16 km reales) sobre una maqueta | 6 ruedas, rocker-bogie ✓ | −2,3°, −5,5° (Perseverance Valley; ±0,3°, ver TODO-5) |
| **Spirit** | 20 eventos, verificados | conduce de verdad; **desde jul 2004 marcha atrás** y **desde el sol 779 la rueda delantera derecha no gira** (corregido, hito 54) | 6 ruedas; la rueda «muerta» ya no es fija desde el principio ✓ | −14,57°, 175,47° (Gusev; Troy ≈ −14,6°, 175,5°) |
| **Ingenuity** | 20 eventos, verificados | vuela de verdad (72 vuelos, 17 km); **despega al moverse y aterriza (con los rotores parados) en cada parada** (corregido, hito 54) | helicóptero sin ruedas ✓ | **18,44°, 77,45°** (Jezero; antes 24°, 65°: **corregido**) |
| **Surveyor 3** | 20 eventos, verificados | **inmóvil** (corregido, hito 54): 11 momentos, Espacio pasa al siguiente | **sin ruedas**: trípode con tres apoyos (antes ruedas ficticias) ✓ | −3,014°, −23,419° (NSSDC) |
| **InSight** | 20 eventos, verificados | inmóvil, 14 momentos | sin ruedas, tres patas ✓ | 4,5°, 135,6° (Elysium Planitia) |
| **Beagle 2** | 20 eventos, verificados | inmóvil, 12 momentos | sin ruedas, tumbado ✓ | 11,5°, 90,4° (Isidis Planitia; HiRISE) |
| **Perseverance** | sin historia («coming soon») | cerrado | con ruedas ✓ | 25°, 69° (**por defecto**, ver TODO-1) |
| **SEV** | sin historia («coming soon») | cerrado | con ruedas (ficticio) | 8°, 20° (**por defecto**, ver TODO-2) |

### Posiciones y distancias reales en el globo

Todas las posiciones usan **latitud y longitud reales** (ya no hay «distancias inventadas» entre vehículos reales). Distancia angular entre los vehículos de cada cuerpo, calculada con las coordenadas de arriba (radio de Marte 3 389,5 km; de la Luna 1 737,4 km):

| Marte | Distancia | | Marte | Distancia |
| --- | --- | --- | --- | --- |
| Opportunity – Spirit | 163,1° (9 649 km) | | Ingenuity – Beagle 2 | 14,3° (846 km) |
| Opportunity – Ingenuity | 84,1° (4 972 km) | | Ingenuity – InSight | 58,4° (3 455 km) |
| Opportunity – Beagle 2 | 96,2° (5 693 km) | | Beagle 2 – InSight | 45,3° (2 677 km) |
| Opportunity – InSight | 141,1° (8 348 km) | | Spirit – InSight | 43,9° (2 596 km) |
| Spirit – Ingenuity | 102,0° (6 033 km) | | Spirit – Beagle 2 | 88,2° (5 218 km) |
| Ingenuity – Perseverance | 10,2° (605 km): **por defecto**; real < 1° | | **Luna:** Surveyor 3 – SEV | 44,7° (1 355 km): **por defecto** |

Opportunity y Spirit quedan casi **antipodales** (163°): nunca se ven los dos a la vez, como en la realidad. El control manual del globo mantiene siempre algún vehículo en la cara visible.

## Cambios hechos en la auditoría

1. **Globo (`bodies.ts`)**: Ingenuity pasa a su posición real (Jezero) y su tarjeta, que seguía siendo la **demo ficticia** del primer prototipo («41 vuelos (ficción)», «historia inventada»), se reescribe con datos reales (72 vuelos, 17 km, último vuelo 18 ene 2024, Valinor Hills). Opportunity: la fecha de aterrizaje de la tarjeta pasa a **24 ene 2004 (hora del Pacífico)**, como su historia (25 en UTC, indicado en el texto), igual que Spirit usa su fecha local. Surveyor 3: coordenadas NSSDC, «~160 m» al módulo del Apollo 12 y ya no dice que «rueda sobre tres ruedas». SEV y Perseverance: etiquetados como ficticios y con el valor por defecto marcado `TODO(audit)`.
2. **Surveyor 3 inmóvil**: el módulo real no se movió tras sus dos rebotes. `STATIONARY` + `BASE` en `surveyor3-story.mjs`, ruta y `story.json` regenerados (11 momentos en un punto del terreno lunar con ~5° de pendiente), modelo sin ruedas (apoyos redondos). Los 11 audios no cambian (el texto de la narración es el mismo).
3. **Spirit**: `RoverConfig.reverseAfter = "spi028"` (marcha atrás desde jul 2004: el modelo se gira 180° y las ruedas giran al revés) y `deadWheelAfter = "spi040"` (la rueda delantera derecha deja de girar desde el sol 779; antes estaba bloqueada desde el principio). La rueda es una `wheel(..., "dead")` del kit.
4. **Ingenuity**: un vehículo con `hover` **solo vuela mientras se mueve** (se eleva al empezar a avanzar y se posa al detenerse; los rotores giran solo en el aire).
5. **Herramienta nueva**: `npm run story-audit` (comprobación de números y meses contra los dossiers).

## TODO (valores por defecto documentados)

- **TODO-1 · Perseverance en el globo.** Su posición real es Jezero, el mismo punto que Ingenuity (< 1° de diferencia). Se deja en (25°, 69°), ~9° al noroeste, para que ambos marcadores se puedan pulsar (y la tarjeta lo avisa). Solución real: agrupar en un solo marcador con selector, o zoom a clústeres. *(`bodies.ts`, `TODO(audit)`).*
- **TODO-2 · SEV.** Es un vehículo **ficticio** (un prototipo de la NASA que nunca estuvo en el Apollo 14). Se deja en (8° N, 20° E), cerca de Mare Tranquillitatis, para no tapar a Surveyor 3. El Apollo 14 aterrizó en Fra Mauro (3,6° S, 17,5° O), a 6° de Surveyor 3 (los marcadores se solaparían). Decisión pendiente: mantenerlo, darle una historia real o quitarlo. *(`bodies.ts`, `TODO(audit)`).*
- **TODO-3 · Terrenos de maqueta.** Opportunity, Spirit e InSight usan `terrain.stl` (Meridiani); Ingenuity y Beagle 2, `gale-terrain.stl`; Surveyor 3, `moon-terrain.stl`. Las paradas **no son lugares reales** y las distancias entre paradas no son las reales (p. ej. Opportunity condujo 45,16 km; en el 3D recorre ~1 000 unidades). Solución real: un modelo de elevación de Gusev, Jezero, Elysium, Isidis y Oceanus Procellarum (HiRISE / LROC) con las paradas en sus coordenadas.
- **TODO-4 · Ingenuity antes del primer vuelo.** Hasta el 19 abr 2021 (cuatro primeras paradas) el helicóptero no voló; en el 3D, el trayecto entre ellas lo hace «volando». Además cada tramo equivale a «ir de un hito a otro», no a un vuelo concreto (72 vuelos reales). Solución: acortar esos tramos o presentarlos como saltos.
- **TODO-5 · Posición exacta de Opportunity.** La búsqueda no dio las coordenadas exactas de su última posición (solo «~25 km en línea recta del aterrizaje», en Perseverance Valley, borde oeste del cráter Endeavour). Se usa (−2,3°, −5,5°); el error previsible es < 0,3° (< 1 píxel en el globo). Pendiente: tomar la posición del mapa de la ruta final (PIA23178).
- **TODO-6 · Surveyor 3 y la pendiente.** El módulo real descansó inclinado unos 12° en la pared de su cráter; el punto del terreno lunar usado tiene ~5° de pendiente media. Sin dato mejor del terreno.
- **TODO-7 · Los módulos inmóviles no cambian con el momento.** En InSight el sismómetro y el topo ya están sobre la cubierta en todos los momentos; en Surveyor 3 el brazo no excava; en Beagle 2 los paneles no se abren «a medias» como se vio en 2015. Solución: variantes del modelo por momento (piezas que aparecen/desaparecen) y polvo acumulándose en los paneles.
- **TODO-8 · Revisión de oído** de las 120 narraciones y retoque de los textos que se cuelan en algunas ilustraciones (calendario de `bgl032`, «post» de `ins072`; las de Opportunity llevan texto en inglés a propósito: «EL CAPITAN», «TWO ROVERS»).
- **TODO-9 · Vehículos sin historia.** Perseverance y SEV siguen «coming soon» y ficticios (ver TODO-1 y 2); no hay dossiers.
- **TODO-10 · Spirit y los lugares de su ruta.** Las paradas siguen el orden real (llanura → Columbia Hills → Husband Hill → Home Plate → Troy) pero sobre un terreno de maqueta (TODO-3).

## Fuentes consultadas en esta auditoría (nov 2026)

- Récord de Perseverance sobre Opportunity: **11 oct 2026, 45,22 km frente a 45,16 km** (sol 2 006), confirmado en varias fuentes (JPL, ScienceDaily, EarthSky). Confirma `opp081`.
- Ingenuity: el último vuelo (nº 72, 18 ene 2024) terminó en **«Valinor Hills»**, en el cráter Jezero ([JPL PIA26237](https://www.jpl.nasa.gov/images/pia26237-ingenuity-at-valinor-hills/)).
- Spirit: posición final **Troy ≈ 14,6° S, 175,5° E**, sin comunicación desde el 22 mar 2010 (sol 2 208) y fin de los intentos el 25 may 2011 (USGS y otras).
- Surveyor 3: **3,0138° S, 23,4193° O** (NSSDC, vía el resumen del Apollo 12 de la NASA); distancia del Apollo 12 **~160–200 m** (535 ft ≈ 163 m en NASA/ALSJ).
- Opportunity: **~25 km en línea recta** del lugar de aterrizaje a Perseverance Valley y **45,16 km** conducidos ([JPL PIA23178](https://www.jpl.nasa.gov/images/pia23178-opportunitys-final-traverse-map/)).
