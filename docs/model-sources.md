# Recursos de referencia por vehículo

> **Histórico (hito 43):** los GLB y las fotos descritos aquí se **eliminaron de `public/models`** al limpiar los recursos sin uso; este archivo queda como registro de dónde salieron y con qué licencia. Se recuperan del historial de git.

Material para **construir los vehículos procedurales** (`src/lib/vehicles/<id>.ts`). **Nada de esto se carga en la app**: los GLB y las
fotos son referencia de proporciones y de detalle. Una carpeta por vehículo; las fotos en `images/` con su `images.json`
(título, fecha, crédito, página de origen y URL de descarga de cada una).

Lista de vehículos: `C:\Users\Usuario\Downloads\vehiculos.jpeg` (Opportunity, Spirit, Ingenuity, InSight, Beagle 2).

| Vehículo | Modelo 3D | Fotos de referencia | Estado |
| --- | --- | --- | --- |
| `opportunity/` | `opportunity.glb` (aportado por el usuario) | — | Cubierto (ya hay vehículo procedural) |
| `spirit/` | `MER static (24883).glb` (NASA, 12 MB, descargado) + `…Spirit and Opportunity.zip` (aportado por el usuario: solo contiene el `.blend`, 12 MB) | 8 en `images/` | **Cubierto**: el modelo oficial de NASA es el **MER genérico** (Spirit y Opportunity son idénticos; solo cambia la elección de colores/marcas) |
| `ingenuity/` | `Ingenuity Mars Helicopter.glb` (aportado por el usuario, 2 MB, Draco) | — (las 20 ilustraciones de IA de su historia están en `images/`) | **Cubierto** |
| `insight/` | `InSight Cruise Lander (arm deployed).glb` (NASA, 3.9 MB, Draco) y `InSight deployed (24880).glb` (NASA, 22 MB, sin comprimir) | 9 en `images/` | **Cubierto** (el modelo es la configuración de aterrizaje: con brazo y paneles desplegados; sin el sismómetro y el topo sobre el suelo, que se pueden añadir a mano con las fotos) |
| `beagle-2/` | **No hay** | 5 orbitales NASA/HiRISE + 6 de réplicas y maquetas reales (Wikimedia Commons) | **Sin 3D**: no existe un modelo descargable (ver abajo). Hay buenas fotos de la réplica a escala 1:1 para modelarlo |
| `sev/`, `perseverance/` | `sev.glb`, `perseverance.glb` (aportados por el usuario) | — | Cubiertos (ya hay vehículo procedural) |

## Dónde se descargó cada cosa

- **Modelos NASA (dominio público):** [NASA 3D Resources](https://science.nasa.gov/3d-resources/) —
  [InSight Cruise Lander](https://science.nasa.gov/3d-resources/insight-cruise-lander), [InSight Lander, 3D model](https://science.nasa.gov/resource/insight-lander-3d-model/),
  [Mars Exploration Rover](https://science.nasa.gov/3d-resources/mars-exploration-rover-spirit-and-opportunity/). Crédito: NASA/JPL-Caltech.
- **Fotos NASA (dominio público):** [images.nasa.gov](https://images.nasa.gov) (IDs `PIAxxxxx`), descargadas con la API pública. Crédito: NASA/JPL-Caltech,
  o NASA/JPL-Caltech/University of Arizona/University of Leicester en las de Beagle 2.
- **Fotos de réplicas de Beagle 2:** [Wikimedia Commons](https://commons.wikimedia.org). **No son de dominio público**: CC BY / CC BY-SA, con autor y
  licencia en `beagle-2/images/images.json`. Valen como referencia interna; si alguna se llegara a mostrar en la demo hay que citar autor y licencia.
  Son miniaturas de 3840 px (no los originales de hasta 5184 px).

## Lo que no se encontró (Beagle 2)

No hay modelo 3D descargable de ESA, UK Space Agency ni NASA. Sí existen: réplicas a escala 1:1 (Science Museum de Londres, Spaceport
de Liverpool, Space Centre de Leicester) y un modelo muy preciso que construyó la Universidad De Montfort para analizar el fallo, sin
enlace público conocido. Opciones: modelarlo a mano a partir de las fotos de `images/` (es sencillo: una tapa dorada circular (la «concha»), la base central con el cuadro de calibración amarillo, un
brazo articulado y **cuatro paneles solares circulares** que se abren como pétalos; revisar el número exacto en las fotos), o
pedir el modelo a la Universidad De Montfort / al equipo de Beagle 2.

## Pendiente de revisar por el usuario

- Qué fotos de `images/` valen como referencia y cuáles sobran.
- Si hace falta alguna foto más del vehículo (vistas laterales, detalle de ruedas/mástil, etc.).
- Las páginas de venta de modelos (CGTrader, Sketchfab, 3D Warehouse) **no se usaron**: requieren cuenta o licencia propia.
