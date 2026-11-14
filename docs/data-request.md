# Petición de datos por vehículo (para quien investiga / hace el scraping)

Este documento es **autocontenido**: se puede pasar tal cual a una persona o a una IA que no ve el repo. Dice **qué información hay que
extraer, de dónde y en qué formato** para montar la demo de cada vehículo. Quien lo lea **solo entrega información**; los modelos 3D,
el terreno, la narración en audio y la música los ponemos nosotros.

## 1. Contexto: qué es la demo y para qué sirven los datos

Una web con un globo de Marte (y de la Luna) donde cada vehículo «abandonado» tiene un marcador. Al abrirlo, el vehículo recorre una
**ruta corta con 4–6 paradas** (checkpoints) y en cada una se abre una **tarjeta** (foto + texto + 3 datos) y suena una **narración de
~30 s**. Una línea de tiempo y un minimapa muestran el avance. La historia debe ser **real y verificable**: cada cifra, fecha y foto
se publica con su fuente.

| Dato que se pide | Dónde se usa |
| --- | --- |
| Ficha del vehículo (§3) | Tarjeta del globo, marcador en el globo, color y proporciones del modelo |
| Paradas (§4) | Cada checkpoint: título, línea de lugar/fecha, texto de la tarjeta, 3 datos, guion de la narración |
| Posiciones y distancias (§4.3) | Colocar las paradas sobre nuestro terreno y trazar la ruta (ver §2, no se pide el terreno) |
| Fecha, hora y sol (§4.2) | Línea de plazo de cada parada, subtítulos y narración («Sol one hundred thirty-one…») |
| Imágenes (§5) | Una foto 16:10 por parada, con su crédito bajo la foto |
| Fuentes (§6) | Se muestran/guardan para poder verificar; separan lo oficial de lo secundario |

## 2. Qué NO hay que pedir ni buscar

- **Terreno / modelos de elevación (DEM, STL):** usaremos los terrenos que ya tenemos (Marte y Luna) y ajustaremos la ruta a ellos. Solo
  necesitamos **posiciones y distancias reales** (§4.3) para reescalarlas.
- **Modelos 3D (GLB, CAD):** los genera el usuario.
- **Textos largos ya redactados:** basta con **hechos**; la narración y los textos los reescribimos nosotros. Sí se agradece que los
  hechos vengan **en inglés** (la interfaz y los audios son en inglés).

## 3. Ficha del vehículo (una por vehículo)

| Campo | Qué poner | Notas |
| --- | --- | --- |
| `id` | slug en minúsculas: `opportunity`, `spirit`, `ingenuity`, `insight`, `beagle-2`… | Será la URL `/<cuerpo>/<id>` |
| `name` | nombre oficial corto | |
| `full_name` | nombre completo / designación (p. ej. «Mars Exploration Rover B (MER-B)») | |
| `agency` | agencia(s) y centro(s) responsables | |
| `type` | `rover` · `helicopter` · `lander` | Importa: el demo está hecho para vehículos que **avanzan**; ver §7 |
| `body` | `mars` o `moon` | |
| `site_name` | zona principal (p. ej. «Meridiani Planum») | |
| `landing` | lat/lon + fecha y hora UTC del aterrizaje | lat en grados, norte positivo; lon en grados **este positivo**; indicar si es planetocéntrica o planetográfica |
| `end` | fecha y hora UTC del final, **cómo terminó** (1 frase) y última señal | Es lo que cuenta el marcador «abandonado» |
| `final_position` | lat/lon de la **última posición conocida** | Es donde se pone el marcador del globo |
| `mission_length` | duración **planificada** y **real**, en soles y en días terrestres | |
| `key_numbers` | 4 cifras destacadas con etiqueta (p. ej. «Distance · 45.16 km») | Salen en la tarjeta del globo |
| `tag` | etiqueta corta de estado, ≤ 40 caracteres (p. ej. «Lost in a dust storm · 2018») | |
| `physical` | longitud × anchura × altura (m), masa (kg), nº de ruedas/rotores, fuente de energía | Para las proporciones y la escala |
| `appearance` | **colores y acabados reales** (p. ej. «gold Kapton foil», «white»), rasgos que lo hacen reconocible | Para teñir el modelo; no hace falta foto aquí |
| `fun_facts` | 3–5 curiosidades verificables, 1 frase cada una | Material para la guía de voz |

## 4. Paradas (checkpoints): entre 4 y 6 por vehículo

Una parada es un **lugar + momento** que cuenta la historia. Orden **cronológico**, de lo primero a lo último. La primera es el
aterrizaje (o el inicio de la historia) y la última, el final del vehículo. Elegir las que tengan **mejor foto y mejor historia**.

### 4.1 Campos de cada parada

| Campo | Qué poner |
| --- | --- |
| `id` | slug único (`eagle-crater`) |
| `name` | nombre del lugar o evento (≤ 3 palabras si es posible) |
| `why_it_matters` | 2–3 frases en inglés: qué pasó aquí y por qué importa (hechos, sin adornos) |
| `key_facts` | **exactamente 3** pares `etiqueta · valor` cortos (p. ej. «Diameter · ~22 m», «Stay · Sol 1–57») |
| `story_beats` | 3–5 puntos con detalles humanos o sorprendentes que ayuden a narrar (qué sintió el equipo, qué falló, qué se descubrió) |

### 4.2 Fecha, hora y sol (por parada)

| Campo | Qué poner |
| --- | --- |
| `date_start` / `date_end` | fecha ISO (`AAAA-MM-DD`); rango si estuvo varios días |
| `time_utc` | hora UTC **si el evento tuvo hora** (aterrizaje, último contacto, primer vuelo…), formato `HH:MM` |
| `time_local` | hora solar local en el lugar (LMST) si la fuente la da |
| `sol_start` / `sol_end` | número de sol de la misión (sol 1 = aterrizaje) |
| `date_precision` | `day` · `month` · `year` · `range` |
| `date_note` | si las fuentes discrepan (p. ej. 949/951/953), **ponerlas todas**; no elegir una en silencio |

> Para comprobar sol ↔ fecha: 1 sol = 24 h 39 min 35 s. Si la fecha y el sol de una misma fuente no cuadran, anotarlo.

### 4.3 Posición (por parada)

Necesitamos la posición **y** cómo se relaciona con la parada anterior, porque reescalaremos la ruta a nuestro terreno:

| Campo | Qué poner |
| --- | --- |
| `lat`, `lon` | grados, 4 decimales si se puede; mismo convenio que en la ficha |
| `position_source` | de dónde sale (mapa de la ruta de JPL, imagen HiRISE, PDS…) y su precisión aproximada |
| `offset_from_previous_m` | desplazamiento **Este / Norte en metros** respecto a la parada anterior (calculable a partir de lat/lon) |
| `distance_driven_m` | **odometría** recorrida desde la parada anterior (puede ser mayor que el desplazamiento en línea recta) |
| `route_waypoints` | *(opcional)* 3–8 puntos intermedios (lat/lon) del recorrido entre paradas, si hay un mapa de la ruta |

## 5. Imágenes y vídeos

### 5.1 Imágenes (obligatorio: 1 por parada + 1 de reserva)

- **Formato:** JPG/PNG **original o la mayor resolución disponible**, mínimo **1280 px de ancho**. Lo recortamos nosotros a 16:10, así que
  se prefieren imágenes con **el motivo en el centro** y con margen alrededor.
- **Contenido:** debe **mostrar realmente lo que dice la parada** (el cráter, la roca, el momento). Comprobar que el pie de foto original
  coincide (no usar una foto de otro sol, otro lugar u otro vehículo).
- **Fuente preferida (dominio público):** [images.nasa.gov](https://images.nasa.gov) (ID `PIAxxxxx`), NASA/JPL Photojournal, PDS
  Imaging, páginas de la misión. Para vehículos no NASA (p. ej. Beagle 2): ESA, UK Space Agency, Universidad de Leicester, **anotando la licencia**.
- **Por cada imagen, entregar:** archivo con nombre `<vehículo>-<parada>.jpg`, `source_url` (página original), `direct_url`
  (archivo), `id` (PIA/NASA ID), `caption_original` (en inglés), `credit` (línea exacta, p. ej. «NASA/JPL-Caltech/Cornell»), `license`
  (dominio público / CC BY-SA / otra) y `date_taken` + sol de la toma.
- **Opcionales muy valiosas:** una foto del **vehículo mismo** en cada parada, autorretratos («selfies»), vistas **orbitales HiRISE** de
  su recorrido o de su posición final, panorámicas.

### 5.2 Vídeos y audio (opcional, no bloquea nada)

Hoy la demo usa solo imágenes; los vídeos serían una mejora futura. Si los hay, **solo enlaces y metadatos**, sin descargarlos: URL, título,
duración, qué parada ilustra, tiempo de inicio útil (`t=`), crédito y licencia. Interesan en especial: vídeos de aterrizaje/entrada,
animaciones oficiales de la misión, y los **audios reales** (micrófono de Perseverance, sonificación sísmica de InSight, etc.).

## 6. Fuentes y verificación (para cada dato)

- **Orden de preferencia:** NASA/JPL (`science.nasa.gov`, `jpl.nasa.gov`, comunicados de misión), PDS/Photojournal, artículos científicos
  (Science, JGR, Space Science Reviews), agencias (ESA, UKSA). **Wikipedia y prensa solo para orientarse, nunca como única fuente de una cifra.**
- Cada hecho clave lleva `sources`: lista de `{title, publisher, url, type}` con `type` ∈ `official` · `scientific` · `press` · `community`.
- Campo `support` por parada: `official_or_scientific` (al menos una fuente oficial o científica) · `secondary` (solo prensa/otros) ·
  `unsourced`. Campo `disputed` (true/false) y `note` si las fuentes no coinciden.
- **Abrir la fuente completa**, no basarse solo en el extracto de un buscador. Marcar en cada fuente `verified: "full page"` o
  `"search snippet only"`.
- **No inventar.** Si un dato no se encuentra: `null` y una nota. Es mejor un hueco que una cifra dudosa.
- Cifras de «primero/único/récord»: dar la fuente que lo afirma y la fecha (los récords se superan).

## 7. Particularidades por vehículo

La tabla de partida (`vehiculos.jpeg`) lista, por ahora, estos vehículos. **Si la tabla continúa con más filas, aplicar la misma plantilla.**
Las pistas de abajo vienen del resumen de la tabla y de lo que se sabe; **hay que verificarlas, no copiarlas**.

### Opportunity (2004–2018) · Marte, Meridiani Planum
Ya existe una línea de tiempo con 41 eventos. Lo que falta es: elegir 5–6 **paradas de superficie** (aterrizaje en el cráter Eagle,
Endurance, Heat Shield Rock, Purgatory Dune, Victoria, Endeavour, Marathon Valley, Perseverance Valley/final), añadir **posiciones**
(§4.3), **imágenes** (§5) y **traducir al inglés**. Resolver las discrepancias marcadas: sol de llegada a Endeavour (¿2681 o 2709?),
diámetro de Victoria (~730 m o ~800 m), soles de Victoria y de Purgatory Dune.

### Spirit (2004–2010) · Marte, cráter Gusev
Paradas candidatas: aterrizaje, Columbia Hills / Husband Hill, Home Plate, la rueda dañada y la marcha atrás, la trampa de arena
(«Troy») y el último contacto. Datos específicos: el hallazgo de **sílice y suelos de origen hidrotermal** (qué instrumento, qué sol), cuándo se
atascó la rueda, **fecha y sol del último contacto** (2010) y de la declaración de fin (2011), odometría total.

### Ingenuity (2021–2024) · Marte, cráter Jezero
Es un **helicóptero**: no «conduce», vuela. Entregar el **registro de vuelos**: nº de vuelo, fecha, hora UTC, duración, altitud máxima,
distancia, lat/lon de despegue y aterrizaje, y nombre del helipuerto («Wright Brothers Field», etc.). Paradas candidatas: primer
vuelo (19 abr 2021), el vuelo 5 (primer vuelo de ida), una de las tormentas/averías de comunicación, el último vuelo (72) y el
**daño de la hélice**. Imprescindible: **fotos y vídeos tomados por Perseverance** (Mastcam-Z) y fotos aéreas del propio Ingenuity;
indicar para cada imagen quién la tomó.

### InSight (2018–2022) · Marte, Elysium Planitia
Es un **lander fijo**: no se desplaza. Las «paradas» serán los **hitos en el mismo sitio**: aterrizaje, despliegue del sismómetro (SEIS) y
del instrumento de calor (HP3, «el topo»), el primer terremoto, el mayor terremoto registrado, el «selfie» cubierto de polvo y el final por falta
de energía. Entregar la **posición del lander** y las **posiciones de los instrumentos** respecto al lander en metros (para colocarlos
alrededor), nº de terremotos y magnitud máxima (con fechas y sols), y la fecha/sol de fin.

### Beagle 2 (2003) · Marte, Isidis Planitia
**Lander que nunca se movió y nunca comunicó.** Historia: lanzamiento a bordo de Mars Express, separación, intento de aterrizaje en
la Navidad de 2003, 12 años de misterio, hallazgo en imágenes HiRISE (2015) y explicación probable (paneles solares que no se
abrieron del todo). Paradas candidatas: separación, aterrizaje previsto, silencio, hallazgo, qué pasó. Datos específicos:
**fechas y horas UTC exactas** de cada hito, elipse de aterrizaje, posición hallada, las imágenes del hallazgo con sus créditos y la
**licencia** (UKSA/ESA/Leicester/NASA). No hay «selfies» ni recorrido: valen las **imágenes orbitales** y las simulaciones/ilustraciones oficiales.

> Nota para el equipo: los vehículos fijos (InSight, Beagle 2) y el aéreo (Ingenuity) encajan peor con el recorrido por tierra de la demo.
> Esa adaptación la resolvemos nosotros; a quien investiga solo se le pide la información tal como se describe arriba.

## 8. Formato de entrega

Un **archivo JSON por vehículo** (`<id>.json`) más una **carpeta `<id>/images/`** con las imágenes. Esquema (los valores de Spirit son solo un ejemplo ilustrativo de formato: **verificarlos**):

```json
{
  "vehicle": {
    "id": "spirit", "name": "Spirit", "full_name": "Mars Exploration Rover A (MER-A)", "agency": "NASA/JPL",
    "type": "rover", "body": "mars", "site_name": "Gusev Crater",
    "landing": { "lat": -14.57, "lon": 175.47, "datetime_utc": "2004-01-04T04:35", "coord_system": "planetocentric, east positive" },
    "end": { "datetime_utc": "2010-03-22", "how": "…", "last_contact_sol": 2210 },
    "final_position": { "lat": 0, "lon": 0 },
    "mission_length": { "planned_sols": 90, "actual_sols": 0, "actual_days": 0 },
    "key_numbers": [["Distance", "7.73 km"]],
    "tag": "…",
    "physical": { "length_m": 0, "width_m": 0, "height_m": 0, "mass_kg": 0, "wheels": 6, "power": "solar" },
    "appearance": "…",
    "fun_facts": ["…"]
  },
  "stops": [
    {
      "id": "…", "name": "…",
      "why_it_matters": "…",
      "key_facts": [["Label", "value"], ["Label", "value"], ["Label", "value"]],
      "story_beats": ["…"],
      "date_start": "2004-01-04", "date_end": null, "time_utc": "04:35", "time_local": null,
      "sol_start": 1, "sol_end": null, "date_precision": "day", "date_note": null,
      "lat": 0, "lon": 0, "position_source": "…",
      "offset_from_previous_m": { "east": 0, "north": 0 }, "distance_driven_m": 0,
      "route_waypoints": [],
      "image": { "file": "spirit/images/spirit-landing.jpg", "id": "PIA…", "source_url": "…", "direct_url": "…",
                 "caption_original": "…", "credit": "NASA/JPL-Caltech", "license": "public domain", "date_taken": "…", "sol_taken": 0 },
      "image_backup": null,
      "videos": [],
      "support": "official_or_scientific", "disputed": false, "note": null,
      "sources": [ { "title": "…", "publisher": "…", "url": "…", "type": "official", "verified": "full page" } ]
    }
  ],
  "open_questions": ["lo que no se pudo confirmar"]
}
```

## 9. Mínimo imprescindible (si falta tiempo)

Por vehículo, en este orden de prioridad:

1. Ficha del vehículo completa (§3): sobre todo `landing`, `end`, `final_position`, `key_numbers`, `tag`, `appearance`.
2. **4 paradas** con `name`, `why_it_matters`, `key_facts` (3), fecha/sol y **posición** (lat/lon).
3. **1 imagen válida por parada** con su crédito y licencia.
4. Fuentes de cada cifra y `open_questions` con las dudas.

Todo lo demás (offsets, waypoints, vídeos, audio, paradas 5–6, curiosidades) mejora la demo pero no la bloquea.

## 10. Lista de comprobación antes de entregar

- [ ] Cada vehículo tiene su JSON y su carpeta de imágenes.
- [ ] Cada parada tiene fecha, sol y lat/lon (o `null` con nota).
- [ ] Cada imagen muestra lo que dice la parada y lleva crédito y licencia.
- [ ] Las discrepancias entre fuentes están **anotadas**, no resueltas en silencio.
- [ ] Todos los textos de hechos están en **inglés**.
- [ ] Ninguna cifra tiene como única fuente Wikipedia o un artículo de prensa sin contrastar.
