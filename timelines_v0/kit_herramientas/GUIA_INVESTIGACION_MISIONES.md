# Guía para investigar misiones espaciales de la NASA y convertirlas en JSON estructurado

**Versión 1.0 · 2026-11-14 · Idioma de los entregables: español con tildes**

Esta guía describe, paso a paso, cómo se hizo la investigación de **Opportunity, Spirit, Ingenuity e InSight** (línea de tiempo) y la **radiografía de hardware de Opportunity**, para que otro agente de IA pueda repetir el trabajo con cualquier otra misión, en Marte, en la Luna o en el espacio profundo, y obtener archivos JSON **comparables entre misiones**.

Contexto del proyecto: reto «Abandoned but not Forgotten» de NASA Space Apps 2026 (contar la historia del hardware que la NASA dejó en la Luna, Marte y el espacio profundo, para estudiantes y público general). El equipo construye una plataforma 3D interactiva que cuenta la historia de cada misión; estos JSON son la base de datos de esa plataforma.

---

## 0. Qué se entrega por cada misión

| # | Archivo | Qué contiene | Esquema |
|---|---|---|---|
| 1 | `linea_de_tiempo_<mision>.json` | Historia completa: origen, planificación, desarrollo, pruebas, lanzamiento, viaje, aterrizaje, operaciones, problemas y soluciones, fin de misión y legado. Cada evento con fecha, categoría y fuentes (URL). | `esquema_linea_de_tiempo_v2.json` (Apéndice A) |
| 2 | `hardware_<mision>.json` | «Radiografía»: cada componente (estructura, energía, instrumentos, cámaras, EDL, lanzador…) con especificaciones, quién lo construyó, **qué ayudó a descubrir**, historial de fallas y soluciones, y fuentes. | `esquema_hardware_v2.json` (Apéndice B) |
| 3 | (opcional) entrada en `catalogo_de_misiones.json` | Índice de misiones con fechas clave y conteos. | — |

Los archivos solo se suben a Drive si el usuario lo pide. Lo que siempre se entrega: los JSON validados y un mensaje corto en español con las advertencias (sección 11).

---

## 1. Reglas de oro (léelas antes de empezar)

1. **Toda afirmación lleva fuente con URL.** Un evento o una especificación sin fuente no se escribe. Si no hay fuente, el dato va a `pendientes_de_verificar` (línea de tiempo) o `huecos_y_pendientes` (hardware), nunca al cuerpo del archivo.
2. **Nunca completes de memoria.** Ni fechas, ni masas, ni nombres, ni sols. Tu memoria sirve para saber *qué buscar*, no como fuente.
3. **Sé honesto con el nivel de verificación.** Las herramientas de lectura web (WebFetch) devuelven un **resumen generado por un modelo**, no la página completa. Por eso casi nunca corresponde `"página abierta completa"`. Usa:
   - `"página abierta completa"`: solo si leíste el texto íntegro (por ejemplo, descargaste un PDF y lo leíste entero).
   - `"página abierta (resumen automático de la herramienta)"`: abriste la URL con WebFetch.
   - `"solo extracto de búsqueda"`: solo viste el fragmento del buscador.
4. **Si dos fuentes discrepan, no elijas en silencio.** Marca `discutido: true`, explica en `nota`, y agrega la entrada en `discrepancias` con ambos valores y una recomendación.
5. **Prioridad de fuentes:** (1) oficiales NASA/JPL/PDS/NTRS/centros; (2) artículos científicos y actas; (3) prensa especializada; (4) comunitarias (Wikipedia, foros, wikis) solo como pista o para datos que no existen en otro lado, con `tipo: "comunitaria"`.
6. **Derechos de autor.** Redacta con tus palabras, en español. Cita textualmente solo frases cortas (menos de 15 palabras) y una sola por fuente. Nunca copies párrafos, letras de canciones ni poemas.
7. **Valida con scripts, no a ojo.** Fechas y sols se comprueban con aritmética (sección 7), el JSON con el esquema, y las URL con el índice.
8. **Una sola línea de tiempo por misión, en un solo JSON, con las fuentes dentro de cada evento.** (El usuario rechazó antes estructuras gigantes con muchas secciones sueltas.)
9. **Mantén los nombres de campos y los enums exactamente como en los esquemas.** La plataforma depende de ellos para comparar misiones.
10. **Los mensajes al usuario son cortos**: qué salió, qué advertencias hay, un siguiente paso posible.

---

## 2. Visión general del flujo

```
 0. Alcance y ficha ──► 1. Mapa de fuentes ──► 2. Esqueleto del JSON
                                                     │
        ┌────────────────────────────────────────────┴──────────────────────────────┐
        ▼                                                                           ▼
 3. LÍNEA DE TIEMPO                                                         5. HARDWARE
    5 agentes en paralelo (por fases)                                          4 agentes en paralelo
    → ronda de huecos (con lista de eventos existentes)                        (instrumentos / cuerpo y subsistemas /
    4. fusionar + deduplicar + reindexar                                        EDL-lanzador-ensayos / fallas y estado final)
        │                                                                           │
        └──────────────► 6. Validar (esquema + scripts + revisión manual) ◄─────────┘
                                        │
                           7. Auditoría independiente (otro agente) 
                                        │
                           8. Entregar (SendUserFile / Drive) + mensaje breve
```

Tiempo y costo orientativos (lo que tomó aquí): una línea de tiempo de 60–140 eventos con 5 agentes + 1 ronda de huecos; un hardware de ~55 componentes con 4 agentes. Los agentes corren en segundo plano y escriben archivos; el agente principal solo los fusiona y valida.

---

## 3. Herramientas, entorno y límites conocidos

- **Búsqueda web** (`WebSearch`): consultas cortas (1–6 palabras), una por tema; si el resultado es pobre, reformula o usa modo `extended`.
- **Lectura web** (`WebFetch`): devuelve **resumen**, no texto íntegro. Úsalo siempre sobre la URL real del artículo o PDF, y pasa un *prompt* concreto (por ejemplo: «lista las masas, dimensiones y proveedores que menciona»). Si WebFetch dice que cubre solo una parte de la página, avanza con `offset` o anótalo como limitación.
- **Sitios que en la sesión original NO se pudieron abrir:** `mars.nasa.gov/mer`, páginas `display.action` de NSSDC y Wikipedia (bloqueada por herramienta). Prueba primero; si falla, **no lo rodees con curl ni espejos**: busca otra fuente (PDS, NTRS, JPL, artículos) y anótalo en los huecos.
- **Shell:** Python 3 con `jsonschema`. El tráfico de red del shell está restringido a una lista de dominios (pip/npm/GitHub); no sirve para bajar páginas.
- **Subagentes** (`Agent`): se lanzan en segundo plano; cada uno recibe un prompt autosuficiente, escribe su JSON en disco y devuelve un resumen corto. No heredan tu contexto: **todo lo que necesiten debe ir en el prompt** (Apéndice D).
- **Entrega:** `SendUserFile` para enviar archivos; Drive solo si el usuario lo pide.

---

## 4. Paso 0 — Elegir la misión y fijar el alcance

### 4.1 Ficha de alcance (llénala antes de buscar nada)

```yaml
id: pathfinder                 # minúsculas, sin espacios; es el nombre del archivo
nombre: Mars Pathfinder y Sojourner
nombre_completo: ...
agencia: NASA/JPL
tipo: rover | lander | orbitador | impactador | sonda_espacio_profundo | modulo_tripulado | helicoptero
cuerpo: Marte | Luna | otro
lugar: sitio de aterrizaje o destino
prefijo_eventos: pth           # 3–6 caracteres [a-z][a-z0-9]; eventos = pth001, pth002…
prefijo_hardware: pth          # componentes = pth_hw_<nombre>
sol_cero: fecha UTC del sol 0/1 (solo Marte)   # se busca en fuentes, NO se asume
sol_offset: 0 o 1              # 1 si el sol 1 es el día de aterrizaje (MER); 0 si el sol 0 lo es
estado_actual: activa | terminada | perdida | impactada | en_orbita_inactiva
misiones_relacionadas: [..]
```

**Cómo fijar `sol_cero` sin inventarlo:** busca en el manual de operaciones o en el PDS (campo de «sol/mission day») y contrasta con **dos eventos fechados** (aterrizaje y otro hito con sol y fecha publicados). Resultado esperado: la diferencia de días / 1,0275 + offset coincide con el sol publicado (tolerancia ±3). En este proyecto: Opportunity sol 1 = 2004-01-25; Spirit sol 1 = 2004-01-04; Ingenuity sol 0 = 2021-02-18; InSight sol 0 = 2018-11-26. Un sol = 24 h 39 min 35 s = 1,0275 días.

### 4.2 Misiones candidatas (prioridad sugerida)

Los nombres son una lista de trabajo, **no una fuente**: el agente debe verificar con fuentes qué hardware quedó y dónde.

| Cuerpo | Misión / familia | Qué quedó (a verificar) | Notas para el agente |
|---|---|---|---|
| Marte | **Mars Pathfinder + Sojourner** | Módulo de aterrizaje y rover inactivos | Primer rover de Marte; buen siguiente caso |
| Marte | **Viking 1 y Viking 2 (landers)** | Landers inactivos en Chryse y Utopia | Sistema de soles distinto; mucha literatura técnica en NTRS |
| Marte | **Phoenix** | Lander inactivo en el polo norte | Misión corta con muchos «primeros» |
| Marte | Mars Polar Lander / Deep Space 2 | Perdidos al llegar | Historia de falla e investigación |
| Marte | Curiosity, Perseverance | Activos; piezas de EDL (escudo, cubierta trasera, etapa de descenso) ya en el suelo | Misión activa: marca `estado_actual` y fecha de corte |
| Luna | **Apollo 11, 12, 14, 15, 16, 17** | Etapas de descenso del LM, instrumentos ALSEP, retrorreflectores, vehículos lunares (15–17), objetos dejados | Sin sol: usa tiempo de misión (GET); hardware tripulado |
| Luna | **Surveyor 1, 3, 5, 6, 7** | Sondas de aterrizaje suave; Surveyor 3 fue visitado por Apollo 12 | Muy buena historia «dejado y visitado» |
| Luna | **Ranger 4, 6–9**, **Lunar Orbiter 1–5** | Impactos controlados o estrellados | Sin superficie «operativa»; enfoque en el impacto y la ciencia previa |
| Luna | LCROSS, LADEE, GRAIL (Ebb/Flow), Lunar Prospector | Impactos finales | Fin de misión planificado como evento científico |
| Luna | Misiones CLPS / comerciales con carga NASA (si se pide) | Landers o restos | Marca `agencia` como comercial con carga NASA |
| Espacio profundo | **Pioneer 10/11**, **Voyager 1/2**, New Horizons | En trayectoria de escape | Sin superficie; «ubicación actual» como dato |
| Espacio profundo | **Dawn**, **NEAR Shoemaker**, **Kepler**, Deep Impact, Stardust, Genesis, OSIRIS-REx | Orbitando un cuerpo, posados o en órbita solar | Cada caso tiene su propio fin de misión |

Prefijos de evento sugeridos (3 letras funcionan; si hay choque o varias misiones de la misma familia, usa 3–6 caracteres): `pth` Pathfinder, `vk1`/`vk2` Viking, `phx` Phoenix, `a11`…`a17` Apollo, `sv1`…`sv7` Surveyor, `dwn` Dawn, `nea` NEAR, `kep` Kepler, `pio` Pioneer, `voy` Voyager.

### 4.3 Qué NO es de la NASA o necesita aclaración
Si la misión es de otra agencia (ESA, JAXA, CNSA, ISRO) o comercial, ponlo en `agencia` y explícalo; el reto es sobre hardware de la NASA, pero las piezas compartidas (instrumentos europeos en rovers de la NASA, por ejemplo) sí se documentan.

---

## 5. Paso 1 — Mapa de fuentes

Antes de lanzar agentes, arma un inventario de dónde buscar. Haz esto tú mismo (5–10 búsquedas) y pásalo a los agentes como punto de partida.

### 5.1 Fuentes oficiales y científicas por tipo de dato

| Dato | Dónde buscar |
|---|---|
| Historia general y noticias | `science.nasa.gov/mission/<misión>`, `jpl.nasa.gov/news`, `nasa.gov/missions`, comunicados de prensa de lanzamiento y aterrizaje |
| Kits de prensa (especificaciones, cronología de lanzamiento y aterrizaje) | Kit de prensa de lanzamiento y de llegada de la misión (JPL/NASA), a menudo en PDF |
| Informes técnicos, diseño, pruebas | **NASA NTRS** (`ntrs.nasa.gov`): artículos de ingeniería, informes de pruebas, actas AIAA/IEEE; búsqueda por nombre de subsistema (parachute, airbag, RAD, heat shield…) |
| Datos y especificaciones de instrumentos | **PDS** (Planetary Data System): nodos Geosciences (`pds-geosciences.wustl.edu`), Imaging, Atmospheres; documentos «instrument host» e «instrument» |
| Artículos científicos | Science, Nature, JGR Planets, Space Science Reviews, ADS (`ui.adsabs.harvard.edu`), repositorios institucionales (Smithsonian, USGS, universidades) |
| Planeación de operaciones y diarios de misión | Portales del equipo (por ejemplo, el portal MER), blogs de ingenieros, `planetary.org`, boletines de JPL |
| Imágenes de hardware en la superficie | HiRISE (`uahirise.org`) para Marte; LROC (`lroc.sese.asu.edu`) para la Luna; galerías raw de cada misión |
| Apollo | *Apollo Lunar Surface Journal*, *Apollo Flight Journal* (`history.nasa.gov/alsj`, `history.nasa.gov/afj`), informes de misión, catálogos de muestras y ALSEP |
| Historia institucional | `history.nasa.gov`, libros NASA SP en PDF, entrevistas de historia oral |
| Modelos 3D, videos y educación | `science.nasa.gov/3d-resources`, `nasa3d.arc.nasa.gov`, Eyes on the Solar System, NASA SVS (`svs.gsfc.nasa.gov`), canales de video de NASA/JPL, materiales educativos |
| Catálogo maestro | NSSDCA (`nssdc.gsfc.nasa.gov`) — puede no abrirse con WebFetch; usa buscador y PDS como alternativa |

### 5.2 Patrones de búsqueda que funcionaron
- `"<misión> press kit"`, `"<misión> mission timeline"`, `"<misión> launch press kit pdf"`.
- `"<misión> <subsistema> design"` (por ejemplo, «Opportunity airbag design AIAA»).
- `"<instrumento> Opportunity instrument paper"` y el primer autor conocido.
- `"<misión> anomaly"`, `"<misión> failure investigation"`, `"<misión> lessons learned"`.
- `"<misión> final status"`, `"<misión> last contact"`, `"<misión> end of mission"`.
- Para objetos dejados: `"<misión> descent stage LROC"`, `"<lander> HiRISE image"`.
- Una búsqueda por ítem: no mezcles cinco subsistemas en una consulta.

### 5.3 Lo que debes registrar de cada fuente
`titulo`, `editor` (organización o sitio), `url` completa, `tipo` (uno de seis valores del esquema), `verificacion` (uno de tres). Si la URL tiene espacios, reemplázalos por `%20`.

---

## 6. Paso 2 — Esqueleto del archivo de línea de tiempo

Crea primero un JSON con todas las claves de primer nivel y `eventos: []`. Así los agentes y los scripts trabajan sobre una estructura fija.

Claves de primer nivel obligatorias: `esquema_version` ("2.0"), `mision`, `titulo`, `idioma` ("es"), `generado`, `version`, `alcance`, `como_leer`, `aviso_verificacion`, `ficha_tecnica`, `equipo`, `totales_de_la_mision`, `records`, `discrepancias`, `pendientes_de_verificar`, `recursos_para_la_plataforma`, `eventos`, `fuentes_no_citadas_en_eventos`, `indice_fuentes`.

### 6.1 Bloque `mision`
```json
{
  "id": "opportunity", "nombre": "Opportunity", "nombre_completo": "Mars Exploration Rover B (MER-B)",
  "agencia": "NASA/JPL", "tipo": "rover", "cuerpo": "Marte", "lugar": "Meridiani Planum",
  "estado_actual": "Misión terminada el 13 de febrero de 2019; el rover permanece inmóvil en Perseverance Valley.",
  "sol_cero": "sol 1 = 25 de enero de 2004 UTC",
  "fechas_clave": {"lanzamiento": {"fecha": "2003-07-07", "eventos": []}, "aterrizaje": {"fecha": "2004-01-25", "eventos": []},
                   "ultimo_contacto": {"fecha": "2018-06-10", "eventos": []}, "fin_oficial": {"fecha": "2019-02-13", "eventos": []}},
  "misiones_relacionadas": ["spirit"],
  "resumen": {"eventos": 0, "fuentes_unicas": 0, "eventos_por_fase": {}}
}
```
`fechas_clave.*.eventos` y `resumen` los rellena el script `construir_mision.py reindexar` (Apéndice C). Las cuatro fechas clave aplican a todas las misiones; si una no existe (un impactador no tiene «último contacto» distinto del impacto), repite la fecha o usa `null` en `fecha` y explícalo en `alcance`.

### 6.2 Otros bloques que debe tener el archivo
- `ficha_tecnica` y `totales_de_la_mision`: diccionarios `clave → {valor, nota?, fuentes[]}` (masa, dimensiones, vida útil planeada, distancia recorrida, soles operativos, número de imágenes, etc.).
- `equipo`: lista de `{nombre, rol, fuentes}` (investigador principal, gerente de proyecto, ingenieros clave, instituciones).
- `records`: hitos y récords con valor y fuente.
- `discrepancias`: `{tema, valores[], recomendacion, fuentes}`.
- `pendientes_de_verificar`: lista de textos con lo que no se pudo confirmar.
- `recursos_para_la_plataforma`: listas `{nombre, url}` de `modelos_3d`, `imagenes_y_panoramicas`, `vistas_desde_orbita`, `videos`, `documentales`, `datos`, `educacion`, `historias`, `portales`, más una `nota`. Estos enlaces alimentan la plataforma 3D (modelos oficiales, panorámicas, imágenes orbitales del hardware).
- `fuentes_no_citadas_en_eventos`: fuentes útiles que no respaldan un evento concreto (se conservan para otros usos).

---

## 7. Paso 3 — Línea de tiempo: especificación de eventos

### 7.1 Campos de cada evento (todos obligatorios; `additionalProperties: false`)

| Campo | Tipo | Regla |
|---|---|---|
| `id` | texto | `<prefijo><NNN>` (ej. `opp018`). Lo asigna el script, no lo inventes a mano |
| `orden` | entero ≥ 1 | Posición cronológica; lo asigna el script |
| `fecha_inicio` | texto | ISO parcial: `2004`, `2004-01`, `2004-01-25` |
| `fecha_fin` | texto o `null` | Igual formato; solo para rangos |
| `precision_fecha` | enum | `año`, `mes`, `día`, `rango`, `aproximada`, `década` |
| `sol` | entero o `null` | Solo Marte y solo si una fuente lo da o se puede calcular con seguridad |
| `sol_texto` | texto o `null` | Texto libre: «sol 1», «sol 1.329 (aprox.)». En la Luna: tiempo de misión (GET/MET), por ejemplo «GET 102:45:39» |
| `titulo` | texto | 3+ caracteres, concreto («Se atasca la rueda delantera derecha»), sin adjetivos vacíos |
| `detalle` | texto | 10+ caracteres; 2–5 oraciones: qué pasó, por qué importa, cifras relevantes. Sin copiar fuentes |
| `datos_clave` | lista de textos | 1–5 cifras o hechos duros («700 Wh → 128 Wh (18 jul 2007)») |
| `etapa` | texto | Capítulo propio de la misión («Crisis y supervivencia», «Eagle Crater»). Libre |
| `fase` | enum | **Estándar para comparar**: `origen`, `planificacion_y_desarrollo`, `lanzamiento_y_viaje`, `aterrizaje`, `operaciones`, `fin_de_mision`, `legado` |
| `categoria` | enum | **Estándar**: `origen`, `planificacion`, `desarrollo`, `pruebas`, `lanzamiento`, `viaje`, `aterrizaje`, `despliegue`, `operacion`, `ciencia`, `problema`, `solucion`, `hito`, `fin_de_mision`, `legado` |
| `respaldo` | enum | `oficial_o_cientifico` (≥1 fuente oficial o científica), `secundario`, `sin_fuente` (no debe usarse) |
| `discutido` | booleano | `true` si hay discrepancia entre fuentes; exige `nota` |
| `nota` | texto o `null` | Explica la discrepancia o la limitación |
| `fuentes` | lista (≥1) | Objetos fuente (sección 5.3) |
| `compartido_con` | lista de textos | Otras misiones que comparten el evento (ej. el lanzamiento doble de los MER) |
| `datos_extra` | objeto, lista o `null` | Cualquier dato estructurado adicional (coordenadas, lista de instrumentos, etc.) |

### 7.2 Cómo clasificar `fase` y `categoria`
- Un `problema` se empareja con una `solucion` (otro evento) cuando la hubo; nómbralos para poder encadenarlos («Se atasca la rueda» → «Conducen hacia atrás durante años»).
- `ciencia` es un descubrimiento o resultado científico; `operacion` es actividad rutinaria o un hito de conducción/vuelo; `hito` es un récord o primera vez; `despliegue` es el despliegue en superficie (abrir paneles, bajar rampas, elevar mástil).
- Eventos de antes de la aprobación (concepto, propuesta, competencia de diseño) → `fase: origen`; diseño, construcción, ensamblaje, pruebas en tierra → `planificacion_y_desarrollo`; todo hasta tocar suelo (incluye viaje y correcciones) → `lanzamiento_y_viaje`; entrada, descenso y aterrizaje → `aterrizaje`; después → `operaciones`; ultimo contacto y declaración oficial → `fin_de_mision`; homenajes, nombres, herencia técnica, imágenes orbitales posteriores → `legado`.
- **No dejes todos los eventos de operaciones en `operacion`**: usa `ciencia`, `problema`, `solucion` y `hito` donde corresponda. Una distribución sana tiene variedad de categorías.

### 7.3 Qué debe cubrir una línea de tiempo completa (lista de verificación)

**Origen**: concepto original, quién propuso, antecedentes técnicos (herencia de misiones previas), competencia o selección, aprobación y presupuesto, equipo clave.
**Planificación y desarrollo**: requisitos científicos, selección de sitio de aterrizaje (candidatos, votación, imágenes orbitales usadas), diseño de subsistemas, selección de instrumentos, contratistas, revisiones de diseño, retrasos y cambios, pruebas (vibración, térmico-vacío, paracaídas, airbags, aterrizaje), ensamblaje y entrega al sitio de lanzamiento.
**Lanzamiento y viaje**: cohete y su historia, fecha y ventana, retrasos, trayectoria, correcciones de rumbo, eventos de crucero, anomalías, preparativos finales.
**Aterrizaje**: línea de tiempo minuto a minuto de entrada, descenso y aterrizaje (EDL), señal de llegada, primeras imágenes, rebotes y estado tras tocar suelo, desplegado.
**Operaciones**: capítulo por capítulo (cada cráter, región o campaña), primeros resultados científicos, récords, **todos los problemas** y cómo se resolvieron (software, hardware, energía, clima), extensiones de misión y sus razones, cambios de operación (modos de baja energía, nuevas estrategias de conducción o vuelo), colaboración con orbitadores, participación del público.
**Fin de misión**: causa del fin (polvo, energía, frío, combustible, impacto planeado), intentos de recuperación, último contacto, anuncio oficial, estado final del hardware, última imagen o último dato.
**Legado**: cifras finales, imágenes orbitales del hardware en la superficie (lugar exacto), homenajes (nombres de rocas, asteroides, películas, documentales), lo que heredaron las misiones siguientes, datos abiertos.

Guía de volumen: 60–140 eventos para una misión larga (Opportunity 81, Spirit 80, Ingenuity 141, InSight 92). Una misión corta o de impacto puede quedar en 30–50. Más importante que el número es cubrir **todos los meses con hechos conocidos** y **todas las fallas**.

### 7.4 Reglas de redacción
- Español, tiempo pasado, oraciones concretas. Unidades legibles («1,5 kg», «−85 °C», «2.269 soles»); coma decimal.
- Fechas en UTC cuando la fuente lo indique; si una fuente da fecha local o de Tierra y otra de Marte, anótalo.
- Cada cifra del `detalle` debe poder encontrarse en alguna de las `fuentes` del evento.
- No uses «probablemente» sin motivo: si es una inferencia, dilo («según el equipo, la causa más probable fue…»).
- Evita hablar de «la plataforma» o «el usuario» dentro del JSON.

### 7.5 Cálculo de sol y comprobación
Para Marte: `sol_calculado = (fecha − fecha_sol_cero) / 1,0275 + offset`. Si el evento trae `sol` y la diferencia es mayor que 3 y el evento no está `discutido`, el validador lo reporta. Cuando una sola fuente dé un sol que no cuadra con la fecha (pasó con Opportunity, sol 760 en Erebus y sol 2709 en Endeavour), **no lo corrijas tú**: marca `discutido: true`, deja ambos valores y explica en `nota`.

En la Luna y el espacio profundo, `sol` siempre es `null`. Usa `sol_texto` para el tiempo transcurrido de misión cuando la fuente lo dé, y valida las fechas con las cronologías oficiales (por ejemplo, entre los eventos de un alunizaje).

---

## 8. Paso 3b — Fan-out de agentes para la línea de tiempo

**No investigues todo tú solo**: el contexto se llena y la calidad baja. Lanza agentes en paralelo y fusiona.

### 8.1 Ronda 1 — cinco agentes por fases
Todos escriben una lista JSON de eventos *crudos* (sin `id` ni `orden`) en `/home/claude/ev_<mision>_<rol>.json`:

| Agente | Cubre | Pregunta guía |
|---|---|---|
| A | origen + planificación + desarrollo | ¿Quién, cuándo y por qué se decidió construirla y cómo se diseñó? |
| B | pruebas + lanzamiento + viaje | ¿Qué se probó, cómo salió el lanzamiento y qué pasó en el crucero? |
| C | entrada, descenso, aterrizaje y primeros días | ¿Qué ocurrió minuto a minuto y qué se vio primero? |
| D | operaciones (dividido por años si es larga) | ¿Qué hizo, qué descubrió, qué falló y cómo se resolvió? |
| E | fin de misión + legado + estado actual | ¿Cómo terminó, dónde está el hardware y qué dejó? |

El prompt de cada agente está en el Apéndice D.1; incluye el esquema de evento, las reglas de oro, las fuentes sugeridas y el contrato de salida.

### 8.2 Ronda 2 — huecos (con la lista de lo que ya existe)
Tras fusionar la ronda 1, genera `existing_<mision>.txt` con una línea por evento (`fecha | titulo`) y lanza 2–4 agentes de «huecos»: cada uno recibe esa lista y debe **traer solo eventos que no estén**, priorizando: (a) meses sin eventos, (b) fallas y soluciones, (c) pruebas y decisiones de ingeniería, (d) hitos científicos, (e) legado. Esto agregó entre 18 y 24 eventos por misión y subió la calidad de forma notable.

### 8.3 Fusión y deduplicación
```
python3 construir_mision.py fusionar linea_de_tiempo_<m>.json ev_*.json -o linea_de_tiempo_<m>.json --prefijo <prefijo>
```
El script valida cada evento crudo (enums, fechas, URL), descarta duplicados (misma época y título o detalle muy parecidos) **pero suma sus fuentes al evento existente**, ordena, renumera ids, reconstruye `indice_fuentes` y `resumen`. Revisa a mano la lista `DUP` y `MAL` que imprime: ajusta `--umbral` (0,6 por defecto) si deja pasar duplicados o descarta eventos distintos.

### 8.4 Revisión manual obligatoria tras fusionar
1. Lee los títulos en orden: ¿hay saltos de años sin eventos? ¿hay duplicados semánticos con otra redacción?
2. Revisa la distribución de `categoria`: si más del 70 % es `operacion`, reclasifica.
3. Revisa los eventos `discutido`: cada uno con `nota` clara y entrada en `discrepancias`.
4. Verifica que `fechas_clave` apunta a los eventos correctos (lanzamiento, aterrizaje, último contacto, fin oficial).

---

## 9. Paso 4 — Radiografía de hardware

### 9.1 Idea
Una lista **plana** de componentes con jerarquía (`sistema_padre` / `subcomponentes`), de modo que la plataforma 3D pueda dibujar el vehículo y mostrar, al tocar cada pieza, qué es, quién la hizo, cuánto pesa, qué ayudó a descubrir y cómo falló o se degradó.

### 9.2 Campos de cada componente
| Campo | Regla |
|---|---|
| `id` | `<prefijo>_hw_<nombre_corto>` (ej. `opp_hw_pancam`) |
| `nombre` | Nombre completo en español con la sigla («Mini-TES (espectrómetro de emisión térmica miniaturizado)») |
| `categoria` | Enum (ver abajo) |
| `sistema_padre` | Id del componente que lo contiene, o `null` |
| `descripcion` | Qué es y para qué sirve, en 2–4 oraciones comprensibles para un estudiante |
| `ubicacion` | Dónde va montado |
| `proveedor` | `{organizacion, responsable}` (constructor y responsable científico/ingeniero) |
| `cantidad` | Número de unidades |
| `especificaciones` | Lista `{parametro, valor, fuentes[≥1]}`; valor siempre como texto con unidades |
| `que_permitio_descubrir` | Lista `{titulo, detalle, fecha_aprox, fuentes[≥1]}`: conecta ingeniería con ciencia |
| `historial_operativo` | Lista `{fecha, tipo (falla/degradacion/solucion/calibracion/hito), evento, sol, fuentes[≥1]}` |
| `datos_clave` | Frases cortas sin fuente propia individual (la fuente del componente las cubre) |
| `discutido` / `nota` | Como en eventos |
| `fuentes` | Fuentes generales del componente |
| `subcomponentes` | Lista de ids hijos (la calcula el script) |
| `eventos_relacionados` | Ids de la línea de tiempo (ver 9.6) |

**Categorías** (enum del esquema): `estructura`, `movilidad`, `energia`, `computo_y_datos`, `comunicaciones`, `termico`, `brazo_robotico`, `instrumento_ciencia`, `camara_ingenieria`, `calibracion`, `navegacion_y_sensores`, `lanzador`, `crucero`, `entrada_descenso_aterrizaje`, `prueba_en_tierra`, y para otros tipos de misión: `propulsion`, `actitud_y_control`, `vehiculo_tripulado`, `etapa_de_descenso`, `etapa_de_ascenso`, `vehiculo_lunar`, `objeto_dejado_atras`. Si necesitas una categoría nueva, agrégala al enum del esquema **y** documenta el cambio.

### 9.3 Lista de verificación por tipo de nave
- **Rover:** estructura (chasis/WEB, mástil), movilidad (ruedas, suspensión, motores, dirección), energía (paneles/RTG, baterías, electrónica), cómputo (CPU, memoria flash/RAM, software de vuelo), comunicaciones (antenas, radios, relés), térmico (calentadores, RHU, aislamiento), brazo, instrumentos (uno por componente, con proveedor y ciencia), cámaras de ingeniería, objetivos de calibración, sensores de navegación; EDL (escudo, paracaídas, cubierta trasera, cohetes de frenado, airbags o grúa celeste, radar); lanzador y etapa de crucero; ensayos en tierra y modelos de ingeniería.
- **Lander estático:** igual sin movilidad; más patas, sistema de descenso, cámara de superficie, brazo de muestreo, estaciones meteorológicas, sismómetros.
- **Helicóptero (Ingenuity):** rotores, baterías, cámaras, sensores de navegación, electrónica de calentamiento, enlace con el rover, y el sistema de despliegue en el rover.
- **Orbitador / impactador / sonda de espacio profundo:** estructura, propulsión, actitud y control, energía (paneles/RTG), cómputo, comunicaciones, instrumentos, y para impactadores el sistema de guiado final; datos de trayectoria final o actual.
- **Módulo lunar tripulado (Apollo):** etapa de descenso, etapa de ascenso, motores, trenes de aterrizaje, instrumentos ALSEP, retrorreflectores, vehículo lunar, objetos dejados (banderas, placas, herramientas), sistema de soporte vital (si el alcance lo pide).
- **Hardware dejado:** para cada pieza que quedó en un cuerpo, un componente (o un bloque `objetos_dejados`, 9.8).

### 9.4 Fan-out de agentes para hardware (4 agentes, en paralelo)
| Agente | Cubre | Salida |
|---|---|---|
| 1. Instrumentos | Todos los instrumentos de ciencia y cámaras: especificaciones, constructor, ciencia que hicieron posible | `hw_instrumentos.json` |
| 2. Cuerpo y subsistemas | Estructura, movilidad, energía, cómputo, comunicaciones, térmico, brazo, calibración | `hw_cuerpo.json` |
| 3. EDL, lanzador, crucero y ensayos | Lanzador, etapa de crucero, entrada/descenso/aterrizaje, ensayos en tierra y modelos | `hw_edl.json` |
| 4. Fallas y estado final | Historial de fallas, degradaciones, soluciones, calibraciones, estado final del hardware | `hw_fallas.json` |

Cada agente devuelve una lista de componentes con el formato de 9.2. El agente 4 puede usar ids terminados en `_salud` que luego se **fusionan en el componente padre** (el script lo hace con un diccionario `PADRE_FALLA`; arma el tuyo).

### 9.5 Fusión de hardware
1. Normaliza cada componente: las `especificaciones` o `que_permitio_descubrir` que lleguen como texto plano se mueven a `datos_clave` (los agentes a veces olvidan el formato).
2. Fusiona por id; si dos agentes describen el mismo componente, mezcla listas evitando duplicados (mismo `parametro`, o título/fecha muy parecido) y une las fuentes; si ambos aportan `nota`, concaténalas.
3. Fusiona los `*_salud` del agente 4 en su componente padre.
4. Revisa los padres faltantes (`sistema_padre` que no existe → pon `null` y decide a mano).
5. Calcula `subcomponentes` (inverso de `sistema_padre`).
6. Ordena por categoría y luego por id.

### 9.6 Vínculo con la línea de tiempo (`eventos_relacionados`)
Se enlazó **automáticamente** por palabras clave y coincidencia de mes entre el historial/descubrimiento del componente y los eventos de la línea de tiempo. Es un vínculo débil: solo 16 de 54 componentes quedaron con enlaces, y no fue revisado uno a uno. Mejora recomendada: que un agente revise cada componente y escriba los ids correctos a mano, o que el agente del paso 8.2 los deje en `datos_extra` de los eventos. Documenta siempre en `como_leer` que es un vínculo automático si no se revisó.

### 9.7 Secciones agregadas del documento de hardware
- `descubrimientos_por_componente`: lista plana de todos los `que_permitio_descubrir` con el componente, ordenada por fecha.
- `discrepancias`: una por cada componente `discutido` con `nota`.
- `huecos_y_pendientes`: lista honesta de lo que **no** se encontró (por ejemplo: «sin fuente: masa y potencia del APXS»; «no se abrió mars.nasa.gov/mer»). **No la dejes vacía**: un hardware sin huecos documentados es sospechoso.
- `indice_fuentes`: cada URL una vez, con los ids de componentes que la usan y la mejor verificación obtenida.
- `resumen`: conteos (componentes, por categoría, especificaciones, descubrimientos, eventos operativos, fuentes únicas, discutidos).

### 9.8 Extensión recomendada: objetos dejados en la superficie (reto de Space Apps)
El reto trata de hardware **abandonado**. Para cada misión con hardware en un cuerpo, añade al documento de hardware un bloque opcional (el validador no lo exige):
```json
"objetos_dejados": [{
  "nombre": "Etapa de descenso del módulo lunar de Apollo 11 («Eagle»)",
  "cuerpo": "Luna", "lugar": "Mar de la Tranquilidad",
  "coordenadas": {"lat": null, "lon": null, "sistema": "selenográficas", "fuentes": []},
  "estado": "inactivo | activo | destruido_en_impacto | en_orbita | en_trayectoria | desconocido",
  "ultima_imagen": {"fecha": null, "instrumento": "LROC | HiRISE | otro", "url": null},
  "componente_id": "id del componente relacionado o null",
  "fuentes": []
}]
```
Cada coordenada debe venir de una fuente (LROC, HiRISE, catálogo de aterrizajes); si no hay, `null` y un hueco.

---

## 10. Paso 5 — Validación

### 10.1 Automática (obligatoria)
```
python3 validar_mision.py linea_de_tiempo_<m>.json --sol-cero AAAA-MM-DD --sol-offset 0|1      # Marte
python3 validar_mision.py linea_de_tiempo_<m>.json --sin-sol                                     # Luna / espacio profundo
python3 validar_mision.py hardware_<m>.json --sol-cero ... --linea linea_de_tiempo_<m>.json
```
Comprueba: JSON Schema draft-07, orden cronológico, `orden` 1..N, ids únicos, `fecha_fin ≥ fecha_inicio`, `discutido` con `nota`, `respaldo` oficial con fuente oficial/científica, URL bien formadas, URL de eventos presentes en `indice_fuentes`, `fechas_clave` válidas, sols vs. fechas, padres e hijos de hardware coherentes, eventos relacionados existentes. **Debe terminar con `problemas: 0`.**

### 10.2 Manual (al menos esto)
1. Abre 10 eventos al azar y 10 especificaciones al azar y comprueba contra la fuente (abre la URL de nuevo).
2. Busca cifras con unidades mal convertidas (libras ↔ kg, pies ↔ m, mph ↔ km/h).
3. Comprueba nombres propios (personas, instituciones, accidentes geográficos) con la fuente.
4. Si encuentras una cifra que no está en ninguna fuente, quítala o muévela a `pendientes_de_verificar`.
5. Revisa que ninguna fuente `comunitaria` sea la única de un hecho importante.

### 10.3 Auditoría independiente (recomendada para trabajo de alto riesgo)
Lanza un agente que **no vio el trabajo**: dale el JSON final y la regla de oro 3, y pídele que revise 15 eventos y 15 especificaciones al azar abriendo las URL, y que devuelva una lista de discrepancias. Corrige y vuelve a validar. Así el trabajo no se califica a sí mismo.

---

## 11. Paso 6 — Entrega

1. Guarda los archivos con los nombres: `linea_de_tiempo_<id>.json`, `hardware_<id>.json`.
2. Envíalos con `SendUserFile` (y súbelos a Drive solo si el usuario lo pide; los archivos subidos por el usuario a Drive no son editables, así que crea una carpeta nueva en lugar de sobrescribir).
3. Escribe un mensaje corto en español con: cuántos eventos/componentes y URL; las 3–5 advertencias importantes (discrepancias, páginas que no se abrieron, vínculos automáticos, datos que faltan); y un siguiente paso posible.
4. Actualiza `catalogo_de_misiones.json` y `LEEME_esquema.md` si los mantienes.

Texto tipo para las advertencias:
- «Ninguna página se leyó íntegra; trabajé con resúmenes de las páginas. Contrasta las cifras clave antes de publicarlas.»
- «Las fuentes difieren en X; está marcado como discutido.»
- «No pude abrir <sitio>; esos datos quedaron como huecos.»

---

## 12. Adaptaciones por tipo de misión

### 12.1 Marte
Usa `sol`. Verifica el sol cero con dos eventos fechados. Fuentes clave: PDS, JPL, HiRISE, portales de equipo y orbitadores de relé (UHF). Las misiones activas (Curiosity, Perseverance) requieren `estado_actual` con fecha de corte y deben avisar que la línea de tiempo está abierta al final.

### 12.2 Luna (con o sin tripulación)
- `sol` = `null` siempre. Usa fechas UTC y tiempo de misión en `sol_texto`.
- Distingue **módulo de comando** (regresó a la Tierra), **etapa de descenso** (quedó en la superficie), **etapa de ascenso** (según la misión: impactó, quedó en órbita o se perdió), **instrumentos dejados** (ALSEP, retrorreflectores), **vehículo lunar** (misiones 15–17) y **objetos menores**.
- Fuentes clave: *Apollo Lunar Surface Journal*, informes de misión, catálogos de aterrizajes LROC con coordenadas e imágenes del hardware, NTRS.
- Para sondas no tripuladas (Surveyor, Ranger, Lunar Orbiter): una sola nave por misión, ensayos y resultados científicos previos a Apollo; destaca el vínculo con las misiones tripuladas (por ejemplo, la visita de Apollo 12 a Surveyor 3).
- El fin de misión puede ser un **impacto planeado** (LCROSS, LADEE, GRAIL, Lunar Prospector): la categoría es `fin_de_mision` y el impacto se trata como evento científico.

### 12.3 Espacio profundo y cuerpos menores
- `sol` = `null`; fechas de encuentro y sobrevuelo son hitos; el «lugar» es la trayectoria o el cuerpo visitado.
- Estado actual: distancia al Sol/Tierra o posición relativa con **fecha de corte** y fuente (JPL Eyes on the Solar System, Horizons u otro).
- En hardware, enfoque en propulsión, energía (RTG o paneles), antena de alta ganancia, instrumentos y qué ciencia permitió cada uno.

### 12.4 Misiones relacionadas
Si dos naves comparten lanzamiento, tecnología o evento, usa `compartido_con` en los eventos y `misiones_relacionadas` en `mision`, y copia las fuentes del evento compartido en ambos archivos.

---

## 13. Lecciones aprendidas (errores reales de este proyecto)

1. **Eventos sin fuente:** al unir archivos, un evento de Opportunity («Lanzamiento de Spirit») quedó con `fuentes: []`; copia las fuentes del archivo original o elimina el evento.
2. **Sols inconsistentes:** dos eventos de Opportunity (sol 760 en Erebus, sol 2709 en Endeavour) venían de una sola fuente secundaria y no cuadraban con las fechas; se marcaron `discutido`.
3. **Heurística de categorías:** clasificar con palabras clave se equivocó (por ejemplo, «Sale del cráter» → `solucion`; «Primera liberación de datos» → `problema`). Revisa a mano o usa correcciones por título.
4. **URL con espacios** (por ejemplo, `…/MER instrument host.htm`) rompen el patrón `https?://\S+`; reemplaza espacios por `%20`.
5. **Fuentes no citadas** se perdieron como solo claves tras migrar; conserva siempre el objeto completo.
6. **Vínculo automático** con la línea de tiempo (por palabras clave) enlazó eventos sin relación (por ejemplo, «aterriza» con eventos de otro tema). Se restringió por coincidencia de mes, pero sigue siendo débil.
7. **Agentes de hardware** devolvieron a veces cadenas simples donde el esquema pide objetos con fuente; normaliza (9.5).
8. **Sitios que no abrieron:** mars.nasa.gov/mer, NSSDC y Wikipedia. Planea alternativas desde el inicio.
9. **Cifras que difieren entre fuentes oficiales** (masa del rover 174 vs 180 kg; diámetro de la rueda 26 vs 25 cm; capacidad de batería 8 vs 10 Ah): documentarlas es parte del valor del archivo.
10. **Nombres ambiguos:** «Scarecrow» es un modelo de ingeniería de Curiosity, no de los MER; cuida las homonimias entre misiones.
11. **Estructuras gigantes confunden:** el usuario pidió **una línea de tiempo con datos y fuentes**, no un árbol de secciones desconectadas.
12. **Renumerar ids cambia referencias:** si ya entregaste una versión, avisa en `version` y no cambies ids sin necesidad.

---

## 14. Lista de verificación final (marca todo antes de entregar)

- [ ] Ficha de alcance completa; `sol_cero` verificado con dos eventos (Marte) o `sol` nulo (resto).
- [ ] Línea de tiempo cubre las siete fases y todos los meses con hechos conocidos.
- [ ] Hay al menos tantos pares problema→solución como fallas conocidas.
- [ ] Todo evento tiene ≥1 fuente; los de respaldo oficial tienen fuente oficial o científica.
- [ ] Discrepancias marcadas y explicadas; `pendientes_de_verificar` no vacío (o justificado).
- [ ] Hardware: jerarquía coherente; cada instrumento con proveedor y ciencia que permitió; fallas con fecha y fuente; `huecos_y_pendientes` honesto.
- [ ] Validación automática con 0 problemas; revisión manual de muestra; auditoría independiente si el trabajo es de alto riesgo.
- [ ] Derechos de autor: redacción propia, sin copiar párrafos.
- [ ] Mensaje final breve, con advertencias reales.

---

# APÉNDICES

## Apéndice A — Esquema JSON de la línea de tiempo (`esquema_linea_de_tiempo_v2.json`)

```json
{
 "$schema": "http://json-schema.org/draft-07/schema#",
 "$id": "linea_de_tiempo_mision_v2",
 "title": "Línea de tiempo de una misión espacial (esquema 2.0)",
 "type": "object",
 "required": [
  "esquema_version",
  "mision",
  "titulo",
  "idioma",
  "generado",
  "version",
  "alcance",
  "como_leer",
  "aviso_verificacion",
  "ficha_tecnica",
  "equipo",
  "totales_de_la_mision",
  "records",
  "discrepancias",
  "pendientes_de_verificar",
  "recursos_para_la_plataforma",
  "eventos",
  "fuentes_no_citadas_en_eventos",
  "indice_fuentes"
 ],
 "properties": {
  "esquema_version": {
   "const": "2.0"
  },
  "mision": {
   "type": "object",
   "required": [
    "id",
    "nombre",
    "nombre_completo",
    "agencia",
    "tipo",
    "cuerpo",
    "lugar",
    "estado_actual",
    "sol_cero",
    "fechas_clave",
    "misiones_relacionadas",
    "resumen"
   ]
  },
  "idioma": {
   "const": "es"
  },
  "ficha_tecnica": {
   "type": "object",
   "additionalProperties": {
    "type": "object",
    "required": [
     "valor",
     "fuentes"
    ],
    "properties": {
     "valor": {},
     "nota": {
      "type": "string"
     },
     "fuentes": {
      "type": "array",
      "items": {
       "$ref": "#/$defs/fuente"
      }
     }
    }
   }
  },
  "totales_de_la_mision": {
   "type": "object",
   "additionalProperties": {
    "type": "object",
    "required": [
     "valor",
     "fuentes"
    ],
    "properties": {
     "valor": {},
     "nota": {
      "type": "string"
     },
     "fuentes": {
      "type": "array",
      "items": {
       "$ref": "#/$defs/fuente"
      }
     }
    }
   }
  },
  "equipo": {
   "type": "array",
   "items": {
    "type": "object",
    "required": [
     "nombre",
     "rol",
     "fuentes"
    ],
    "properties": {
     "fuentes": {
      "type": "array",
      "items": {
       "$ref": "#/$defs/fuente"
      }
     }
    }
   }
  },
  "records": {
   "type": "array",
   "items": {
    "type": "object",
    "required": [
     "descripcion",
     "fuentes"
    ],
    "properties": {
     "fuentes": {
      "type": "array",
      "items": {
       "$ref": "#/$defs/fuente"
      }
     }
    }
   }
  },
  "discrepancias": {
   "type": "array",
   "items": {
    "type": "object",
    "required": [
     "tema",
     "valores",
     "recomendacion",
     "fuentes"
    ],
    "properties": {
     "valores": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "fuentes": {
      "type": "array",
      "items": {
       "$ref": "#/$defs/fuente"
      }
     }
    }
   }
  },
  "pendientes_de_verificar": {
   "type": "array",
   "items": {
    "type": "string"
   }
  },
  "recursos_para_la_plataforma": {
   "type": "object",
   "properties": {
    "modelos_3d": {
     "type": "array",
     "items": {
      "type": "object",
      "required": [
       "nombre",
       "url"
      ],
      "properties": {
       "nombre": {
        "type": "string"
       },
       "url": {
        "type": "string",
        "pattern": "^https?://\\S+$"
       }
      }
     }
    },
    "imagenes_y_panoramicas": {
     "type": "array",
     "items": {
      "type": "object",
      "required": [
       "nombre",
       "url"
      ],
      "properties": {
       "nombre": {
        "type": "string"
       },
       "url": {
        "type": "string",
        "pattern": "^https?://\\S+$"
       }
      }
     }
    },
    "vistas_desde_orbita": {
     "type": "array",
     "items": {
      "type": "object",
      "required": [
       "nombre",
       "url"
      ],
      "properties": {
       "nombre": {
        "type": "string"
       },
       "url": {
        "type": "string",
        "pattern": "^https?://\\S+$"
       }
      }
     }
    },
    "videos": {
     "type": "array",
     "items": {
      "type": "object",
      "required": [
       "nombre",
       "url"
      ],
      "properties": {
       "nombre": {
        "type": "string"
       },
       "url": {
        "type": "string",
        "pattern": "^https?://\\S+$"
       }
      }
     }
    },
    "documentales": {
     "type": "array",
     "items": {
      "type": "object",
      "required": [
       "nombre",
       "url"
      ],
      "properties": {
       "nombre": {
        "type": "string"
       },
       "url": {
        "type": "string",
        "pattern": "^https?://\\S+$"
       }
      }
     }
    },
    "datos": {
     "type": "array",
     "items": {
      "type": "object",
      "required": [
       "nombre",
       "url"
      ],
      "properties": {
       "nombre": {
        "type": "string"
       },
       "url": {
        "type": "string",
        "pattern": "^https?://\\S+$"
       }
      }
     }
    },
    "educacion": {
     "type": "array",
     "items": {
      "type": "object",
      "required": [
       "nombre",
       "url"
      ],
      "properties": {
       "nombre": {
        "type": "string"
       },
       "url": {
        "type": "string",
        "pattern": "^https?://\\S+$"
       }
      }
     }
    },
    "historias": {
     "type": "array",
     "items": {
      "type": "object",
      "required": [
       "nombre",
       "url"
      ],
      "properties": {
       "nombre": {
        "type": "string"
       },
       "url": {
        "type": "string",
        "pattern": "^https?://\\S+$"
       }
      }
     }
    },
    "portales": {
     "type": "array",
     "items": {
      "type": "object",
      "required": [
       "nombre",
       "url"
      ],
      "properties": {
       "nombre": {
        "type": "string"
       },
       "url": {
        "type": "string",
        "pattern": "^https?://\\S+$"
       }
      }
     }
    }
   }
  },
  "eventos": {
   "type": "array",
   "minItems": 1,
   "items": {
    "type": "object",
    "additionalProperties": false,
    "required": [
     "id",
     "orden",
     "fecha_inicio",
     "fecha_fin",
     "precision_fecha",
     "sol",
     "sol_texto",
     "titulo",
     "detalle",
     "datos_clave",
     "etapa",
     "fase",
     "categoria",
     "respaldo",
     "discutido",
     "nota",
     "fuentes",
     "compartido_con",
     "datos_extra"
    ],
    "properties": {
     "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9]{2,5}\\d{3}$"
     },
     "orden": {
      "type": "integer",
      "minimum": 1
     },
     "fecha_inicio": {
      "type": "string",
      "pattern": "^\\d{4}(-\\d{2}(-\\d{2})?)?$"
     },
     "fecha_fin": {
      "type": [
       "string",
       "null"
      ],
      "pattern": "^\\d{4}(-\\d{2}(-\\d{2})?)?$"
     },
     "precision_fecha": {
      "enum": [
       "año",
       "mes",
       "día",
       "rango",
       "aproximada",
       "década"
      ]
     },
     "sol": {
      "type": [
       "integer",
       "null"
      ]
     },
     "sol_texto": {
      "type": [
       "string",
       "null"
      ]
     },
     "titulo": {
      "type": "string",
      "minLength": 3
     },
     "detalle": {
      "type": "string",
      "minLength": 10
     },
     "datos_clave": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "etapa": {
      "type": "string"
     },
     "fase": {
      "enum": [
       "origen",
       "planificacion_y_desarrollo",
       "lanzamiento_y_viaje",
       "aterrizaje",
       "operaciones",
       "fin_de_mision",
       "legado"
      ]
     },
     "categoria": {
      "enum": [
       "origen",
       "planificacion",
       "desarrollo",
       "pruebas",
       "lanzamiento",
       "viaje",
       "aterrizaje",
       "despliegue",
       "operacion",
       "ciencia",
       "problema",
       "solucion",
       "hito",
       "fin_de_mision",
       "legado"
      ]
     },
     "respaldo": {
      "enum": [
       "oficial_o_cientifico",
       "secundario",
       "sin_fuente"
      ]
     },
     "discutido": {
      "type": "boolean"
     },
     "nota": {
      "type": [
       "string",
       "null"
      ]
     },
     "fuentes": {
      "type": "array",
      "minItems": 1,
      "items": {
       "$ref": "#/$defs/fuente"
      }
     },
     "compartido_con": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "datos_extra": {
      "type": [
       "object",
       "array",
       "null"
      ]
     }
    }
   }
  },
  "fuentes_no_citadas_en_eventos": {
   "type": "array",
   "items": {
    "$ref": "#/$defs/fuente"
   }
  },
  "indice_fuentes": {
   "type": "array",
   "items": {
    "type": "object",
    "required": [
     "url",
     "titulo",
     "tipo",
     "verificacion",
     "eventos"
    ]
   }
  }
 },
 "$defs": {
  "fuente": {
   "type": "object",
   "required": [
    "titulo",
    "url",
    "tipo",
    "verificacion"
   ],
   "additionalProperties": false,
   "properties": {
    "titulo": {
     "type": "string",
     "minLength": 1
    },
    "editor": {
     "type": [
      "string",
      "null"
     ]
    },
    "url": {
     "type": "string",
     "pattern": "^https?://\\S+$"
    },
    "tipo": {
     "enum": [
      "oficial NASA/JPL",
      "científica",
      "prensa",
      "comunitaria",
      "libro/medio",
      "video/audio"
     ]
    },
    "verificacion": {
     "enum": [
      "página abierta completa",
      "página abierta (resumen automático de la herramienta)",
      "solo extracto de búsqueda"
     ]
    },
    "nota": {
     "type": "string"
    }
   }
  }
 }
}
```

## Apéndice B — Esquema JSON del hardware (`esquema_hardware_v2.json`)

```json
{
 "$schema": "http://json-schema.org/draft-07/schema#",
 "$id": "hardware_mision_v2",
 "title": "Hardware de una misión (esquema 2.0)",
 "type": "object",
 "required": [
  "esquema_version",
  "mision",
  "titulo",
  "componentes",
  "descubrimientos_por_componente",
  "discrepancias",
  "huecos_y_pendientes",
  "indice_fuentes",
  "resumen"
 ],
 "properties": {
  "esquema_version": {
   "const": "2.0"
  },
  "mision": {
   "type": "object",
   "required": [
    "id",
    "nombre"
   ]
  },
  "componentes": {
   "type": "array",
   "minItems": 1,
   "items": {
    "type": "object",
    "required": [
     "id",
     "nombre",
     "categoria",
     "sistema_padre",
     "descripcion",
     "especificaciones",
     "que_permitio_descubrir",
     "historial_operativo",
     "datos_clave",
     "discutido",
     "fuentes",
     "subcomponentes",
     "eventos_relacionados"
    ],
    "properties": {
     "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9]{1,9}_hw_[a-z0-9_]+$"
     },
     "nombre": {
      "type": "string"
     },
     "categoria": {
      "enum": [
       "estructura",
       "movilidad",
       "energia",
       "computo_y_datos",
       "comunicaciones",
       "termico",
       "brazo_robotico",
       "instrumento_ciencia",
       "camara_ingenieria",
       "calibracion",
       "navegacion_y_sensores",
       "lanzador",
       "crucero",
       "entrada_descenso_aterrizaje",
       "prueba_en_tierra",
       "propulsion",
       "actitud_y_control",
       "vehiculo_tripulado",
       "etapa_de_descenso",
       "etapa_de_ascenso",
       "vehiculo_lunar",
       "objeto_dejado_atras"
      ]
     },
     "sistema_padre": {
      "type": [
       "string",
       "null"
      ]
     },
     "descripcion": {
      "type": "string"
     },
     "ubicacion": {
      "type": [
       "string",
       "null"
      ]
     },
     "proveedor": {
      "type": [
       "object",
       "null"
      ]
     },
     "cantidad": {
      "type": [
       "integer",
       "string",
       "null"
      ]
     },
     "especificaciones": {
      "type": "array",
      "items": {
       "type": "object",
       "required": [
        "parametro",
        "valor",
        "fuentes"
       ],
       "properties": {
        "parametro": {
         "type": "string"
        },
        "valor": {
         "type": "string"
        },
        "fuentes": {
         "type": "array",
         "minItems": 1,
         "items": {
          "$ref": "#/$defs/fuente"
         }
        }
       }
      }
     },
     "que_permitio_descubrir": {
      "type": "array",
      "items": {
       "type": "object",
       "required": [
        "titulo",
        "detalle",
        "fuentes"
       ],
       "properties": {
        "titulo": {
         "type": "string"
        },
        "detalle": {
         "type": "string"
        },
        "fecha_aprox": {
         "type": [
          "string",
          "null"
         ]
        },
        "fuentes": {
         "type": "array",
         "minItems": 1,
         "items": {
          "$ref": "#/$defs/fuente"
         }
        }
       }
      }
     },
     "historial_operativo": {
      "type": "array",
      "items": {
       "type": "object",
       "required": [
        "fecha",
        "tipo",
        "evento",
        "fuentes"
       ],
       "properties": {
        "fecha": {
         "type": [
          "string",
          "null"
         ]
        },
        "tipo": {
         "enum": [
          "falla",
          "degradacion",
          "solucion",
          "calibracion",
          "hito"
         ]
        },
        "evento": {
         "type": "string"
        },
        "sol": {
         "type": [
          "integer",
          "null"
         ]
        },
        "fuentes": {
         "type": "array",
         "minItems": 1,
         "items": {
          "$ref": "#/$defs/fuente"
         }
        }
       }
      }
     },
     "datos_clave": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "discutido": {
      "type": "boolean"
     },
     "nota": {
      "type": [
       "string",
       "null"
      ]
     },
     "fuentes": {
      "type": "array",
      "items": {
       "$ref": "#/$defs/fuente"
      }
     },
     "subcomponentes": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "eventos_relacionados": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    }
   }
  },
  "descubrimientos_por_componente": {
   "type": "array"
  },
  "discrepancias": {
   "type": "array"
  },
  "huecos_y_pendientes": {
   "type": "array",
   "items": {
    "type": "string"
   }
  },
  "indice_fuentes": {
   "type": "array",
   "items": {
    "type": "object",
    "required": [
     "url",
     "titulo",
     "tipo",
     "verificacion",
     "componentes"
    ]
   }
  },
  "resumen": {
   "type": "object"
  }
 },
 "$defs": {
  "fuente": {
   "type": "object",
   "required": [
    "titulo",
    "url",
    "tipo",
    "verificacion"
   ],
   "additionalProperties": false,
   "properties": {
    "titulo": {
     "type": "string",
     "minLength": 1
    },
    "editor": {
     "type": [
      "string",
      "null"
     ]
    },
    "url": {
     "type": "string",
     "pattern": "^https?://\\S+$"
    },
    "tipo": {
     "enum": [
      "oficial NASA/JPL",
      "científica",
      "prensa",
      "comunitaria",
      "libro/medio",
      "video/audio"
     ]
    },
    "verificacion": {
     "enum": [
      "página abierta completa",
      "página abierta (resumen automático de la herramienta)",
      "solo extracto de búsqueda"
     ]
    },
    "nota": {
     "type": "string"
    }
   }
  }
 }
}
```

## Apéndice C — Scripts

Guárdalos en la misma carpeta que los esquemas. Requieren Python 3 y `pip install jsonschema --break-system-packages`.

### C.1 `validar_mision.py`

```python
#!/usr/bin/env python3
"""Validador de archivos de misión (línea de tiempo o hardware).
Uso:
  python3 validar_mision.py linea_de_tiempo_X.json --sol-cero 2004-01-25 --sol-offset 1
  python3 validar_mision.py linea_de_tiempo_X.json --sin-sol            # Luna / espacio profundo
  python3 validar_mision.py hardware_X.json --sol-cero 2004-01-25 --sol-offset 1 [--linea linea_de_tiempo_X.json]
--sol-offset: 1 si el sol 1 es el día de aterrizaje (MER); 0 si el sol 0 es el aterrizaje (InSight, Ingenuity).
Imprime problemas y devuelve código 1 si hay alguno."""
import json, re, sys, argparse, pathlib
from datetime import date
import jsonschema
ap = argparse.ArgumentParser()
ap.add_argument("archivo"); ap.add_argument("--sol-cero"); ap.add_argument("--sol-offset", type=int, default=0)
ap.add_argument("--sin-sol", action="store_true"); ap.add_argument("--linea"); ap.add_argument("--esquema-dir", default=str(pathlib.Path(__file__).parent))
a = ap.parse_args()
d = json.load(open(a.archivo, encoding="utf-8")); P = []
es_hw = d.get("tipo_de_documento") == "hardware" or "componentes" in d
sch = json.load(open(pathlib.Path(a.esquema_dir) / ("esquema_hardware_v2.json" if es_hw else "esquema_linea_de_tiempo_v2.json"), encoding="utf-8"))
for e in jsonschema.Draft7Validator(sch).iter_errors(d):
    P.append("ESQUEMA " + "/".join(map(str, e.absolute_path)) + ": " + e.message[:160])
URL = re.compile(r"^https?://[^\s/]+\.[^\s/]+\S*$")
def sol_calc(f):
    y, m, dd = map(int, f.split("-")); return (date(y, m, dd) - date.fromisoformat(a.sol_cero)).days / 1.0275 + a.sol_offset
def fuentes_de(o, acc):
    if isinstance(o, dict):
        if "url" in o and "tipo" in o and "verificacion" in o: acc.append(o)
        for v in o.values(): fuentes_de(v, acc)
    elif isinstance(o, list):
        for v in o: fuentes_de(v, acc)
if not es_hw:
    ev = d["eventos"]; ids = [e["id"] for e in ev]
    if len(ids) != len(set(ids)): P.append("ids repetidos")
    if [e["fecha_inicio"] for e in ev] != sorted(e["fecha_inicio"] for e in ev): P.append("eventos fuera de orden cronológico")
    if [e["orden"] for e in ev] != list(range(1, len(ev) + 1)): P.append("'orden' no es 1..N")
    for e in ev:
        if e["fecha_fin"] and e["fecha_fin"] < e["fecha_inicio"]: P.append(f"{e['id']} fecha_fin < fecha_inicio")
        if e["discutido"] and not e["nota"]: P.append(f"{e['id']} discutido sin nota")
        if e["respaldo"] == "oficial_o_cientifico" and not any(f["tipo"] in ("oficial NASA/JPL", "científica") for f in e["fuentes"]): P.append(f"{e['id']} respaldo oficial sin fuente oficial/científica")
        if a.sin_sol and e["sol"] is not None: P.append(f"{e['id']} tiene sol en misión sin sol")
        if not a.sin_sol and a.sol_cero and e["sol"] is not None and not e["discutido"] and re.fullmatch(r"\d{4}-\d\d-\d\d", e["fecha_inicio"]):
            c = sol_calc(e["fecha_inicio"])
            if abs(c - e["sol"]) > 3: P.append(f"{e['id']} {e['fecha_inicio']} sol {e['sol']} vs calculado {c:.1f}: {e['titulo'][:50]}")
    reg = {x["url"]: x for x in d["indice_fuentes"]}
    usadas = set()
    for e in ev:
        for f in e["fuentes"]:
            usadas.add(f["url"])
            if f["url"] not in reg: P.append(f"{e['id']} URL no está en indice_fuentes: {f['url']}")
            elif e["id"] not in reg[f["url"]]["eventos"]: P.append(f"indice_fuentes no enlaza {e['id']} con {f['url']}")
    nc = {f["url"] for f in d.get("fuentes_no_citadas_en_eventos", [])}
    for u in reg:
        if u not in usadas and u not in nc and reg[u]["eventos"]: P.append(f"indice_fuentes enlaza eventos pero ninguno la cita: {u}")
    for k, v in d["mision"]["fechas_clave"].items():
        for i in (v.get("eventos") or []):
            if i not in ids: P.append(f"fechas_clave.{k} apunta a evento inexistente {i}")
else:
    C = {c["id"]: c for c in d["componentes"]}
    if len(C) != len(d["componentes"]): P.append("ids de componentes repetidos")
    ev_ids = set()
    if a.linea: ev_ids = {e["id"] for e in json.load(open(a.linea, encoding="utf-8"))["eventos"]}
    for c in C.values():
        if c["sistema_padre"] and c["sistema_padre"] not in C: P.append(f"{c['id']} padre inexistente {c['sistema_padre']}")
        for s in c["subcomponentes"]:
            if s not in C or C[s]["sistema_padre"] != c["id"]: P.append(f"{c['id']} subcomponente incoherente {s}")
        for i in c["eventos_relacionados"]:
            if a.linea and i not in ev_ids: P.append(f"{c['id']} evento relacionado inexistente {i}")
        if c["discutido"] and not c["nota"]: P.append(f"{c['id']} discutido sin nota")
        if not (c["especificaciones"] or c["historial_operativo"] or c["que_permitio_descubrir"] or c["datos_clave"]): P.append(f"{c['id']} sin contenido")
        if not a.sin_sol and a.sol_cero:
            for h in c["historial_operativo"]:
                if h.get("sol") is not None and h.get("fecha") and re.fullmatch(r"\d{4}-\d\d-\d\d", h["fecha"]) and abs(sol_calc(h["fecha"]) - h["sol"]) > 3:
                    P.append(f"{c['id']} historial {h['fecha']} sol {h['sol']} vs calculado {sol_calc(h['fecha']):.1f}")
    reg = {x["url"] for x in d["indice_fuentes"]}
    for c in C.values():
        acc = []; fuentes_de(c, acc)
        for f in acc:
            if f["url"] not in reg: P.append(f"{c['id']} URL no está en indice_fuentes: {f['url']}")
acc = []; fuentes_de({k: v for k, v in d.items() if k != "indice_fuentes"}, acc)
visto = {}
for f in acc:
    if not URL.match(f["url"]): P.append("URL inválida: " + f["url"])
    visto.setdefault(f["url"], set()).add(f["verificacion"])
    if f["verificacion"] == "página abierta completa" and "resumen" in (f.get("nota") or "").lower(): P.append("verificación 'completa' dudosa: " + f["url"])
print(f"{'HARDWARE' if es_hw else 'LÍNEA DE TIEMPO'}: {len(acc)} citas, {len(visto)} URL distintas")
for p in P: print(" -", p)
print("problemas:", len(P)); sys.exit(1 if P else 0)
```

### C.2 `construir_mision.py`

```python
#!/usr/bin/env python3
"""Herramientas de construcción de una línea de tiempo (esquema 2.0).

Subcomandos:
  fusionar BASE.json EXTRA1.json [EXTRA2.json ...] -o SALIDA.json --prefijo pth [--umbral 0.6]
      Agrega eventos 'crudos' (sin id/orden) a un documento base, quita duplicados,
      ordena, renumera ids, reconstruye indice_fuentes y resumen.
  reindexar DOC.json -o SALIDA.json --prefijo pth
      Solo reordena/renumera y reconstruye índices (úsalo tras editar a mano).
  normalizar-fuente   (como módulo: normalizar_fuente(dict) -> dict)

Un evento crudo necesita al menos: fecha_inicio, titulo, detalle, etapa, fase, categoria, fuentes[].
El resto se completa con valores por defecto (ver DEFECTOS)."""
import json, re, sys, argparse, difflib
from urllib.parse import quote

FASES = ["origen", "planificacion_y_desarrollo", "lanzamiento_y_viaje", "aterrizaje", "operaciones", "fin_de_mision", "legado"]
CATS = ["origen", "planificacion", "desarrollo", "pruebas", "lanzamiento", "viaje", "aterrizaje", "despliegue", "operacion", "ciencia", "problema", "solucion", "hito", "fin_de_mision", "legado"]
PRECS = ["año", "mes", "día", "rango", "aproximada", "década"]
TIPOS = ["oficial NASA/JPL", "científica", "prensa", "comunitaria", "libro/medio", "video/audio"]
VERIF = ["página abierta completa", "página abierta (resumen automático de la herramienta)", "solo extracto de búsqueda"]
PRIO = {v: i for i, v in enumerate(VERIF)}  # menor = mejor verificación
FECHA = re.compile(r"^\d{4}(-\d{2}(-\d{2})?)?$")
URL = re.compile(r"^https?://\S+$")


def normalizar_fuente(f):
    f = dict(f)
    f["url"] = f["url"].strip().replace(" ", "%20")
    f.setdefault("editor", None)
    if f.get("tipo") not in TIPOS:
        raise ValueError(f"tipo de fuente inválido: {f.get('tipo')} ({f['url']})")
    if f.get("verificacion") not in VERIF:
        raise ValueError(f"verificacion inválida: {f.get('verificacion')} ({f['url']})")
    if not URL.match(f["url"]):
        raise ValueError("URL inválida: " + f["url"])
    return {k: v for k, v in f.items() if k in ("titulo", "editor", "url", "tipo", "verificacion", "nota")}


def completar(e):
    """Valida y completa un evento crudo; lanza ValueError si está mal."""
    for k in ("fecha_inicio", "titulo", "detalle", "etapa", "fase", "categoria", "fuentes"):
        if not e.get(k):
            raise ValueError(f"falta '{k}' en: {e.get('titulo', e)}")
    if not FECHA.match(e["fecha_inicio"]): raise ValueError("fecha_inicio inválida: " + e["fecha_inicio"])
    if e.get("fecha_fin") and not FECHA.match(e["fecha_fin"]): raise ValueError("fecha_fin inválida: " + e["fecha_fin"])
    if e["fase"] not in FASES: raise ValueError("fase inválida: " + e["fase"])
    if e["categoria"] not in CATS: raise ValueError("categoria inválida: " + e["categoria"])
    fu = [normalizar_fuente(f) for f in e["fuentes"]]
    precision = e.get("precision_fecha") or {4: "año", 7: "mes", 10: "día"}[len(e["fecha_inicio"])]
    if precision not in PRECS: raise ValueError("precision_fecha inválida: " + precision)
    oficial = any(f["tipo"] in ("oficial NASA/JPL", "científica") for f in fu)
    return dict(
        fecha_inicio=e["fecha_inicio"], fecha_fin=e.get("fecha_fin"), precision_fecha=precision,
        sol=e.get("sol"), sol_texto=e.get("sol_texto"), titulo=e["titulo"].strip(), detalle=e["detalle"].strip(),
        datos_clave=[str(x) for x in e.get("datos_clave", [])], etapa=e["etapa"], fase=e["fase"], categoria=e["categoria"],
        respaldo=e.get("respaldo") or ("oficial_o_cientifico" if oficial else "secundario"),
        discutido=bool(e.get("discutido")), nota=e.get("nota"), fuentes=fu,
        compartido_con=list(e.get("compartido_con", [])), datos_extra=e.get("datos_extra"))


def sim(a, b): return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio()


def duplicado(n, existentes, umbral):
    for x in existentes:
        misma_epoca = n["fecha_inicio"][:7] == x["fecha_inicio"][:7] or n["fecha_inicio"][:4] == x["fecha_inicio"][:4] and (len(n["fecha_inicio"]) == 4 or len(x["fecha_inicio"]) == 4)
        if misma_epoca and (sim(n["titulo"], x["titulo"]) > umbral or sim(n["detalle"][:200], x["detalle"][:200]) > 0.75):
            return x
    return None


def reindexar(doc, prefijo):
    ev = sorted(doc["eventos"], key=lambda e: (e["fecha_inicio"], e.get("orden") or 0))  # sort estable
    for i, e in enumerate(ev, 1):
        e["id"] = f"{prefijo}{i:03d}"; e["orden"] = i
    doc["eventos"] = ev
    # índice de fuentes: cada URL una vez, con los ids que la citan
    ix = {}
    for e in ev:
        for f in e["fuentes"]:
            x = ix.setdefault(f["url"], dict(url=f["url"], titulo=f["titulo"], editor=f.get("editor"), tipo=f["tipo"], verificacion=f["verificacion"], eventos=[]))
            if PRIO[f["verificacion"]] < PRIO[x["verificacion"]]: x["verificacion"] = f["verificacion"]
            if e["id"] not in x["eventos"]: x["eventos"].append(e["id"])
    for f in doc.get("fuentes_no_citadas_en_eventos", []):
        ix.setdefault(f["url"], dict(url=f["url"], titulo=f["titulo"], editor=f.get("editor"), tipo=f["tipo"], verificacion=f["verificacion"], eventos=[]))
    doc["indice_fuentes"] = sorted(ix.values(), key=lambda x: (-len(x["eventos"]), x["url"]))
    por_fase = {k: 0 for k in FASES}
    for e in ev: por_fase[e["fase"]] += 1
    m = doc["mision"]
    m["resumen"] = dict(eventos=len(ev), fuentes_unicas=len(ix), eventos_por_fase=por_fase)
    # fechas_clave: enlaza por fecha exacta (±1 día) con los eventos
    from datetime import date, timedelta
    for k, v in m.get("fechas_clave", {}).items():
        fecha = v["fecha"] if isinstance(v, dict) else v
        ids = []
        if fecha and re.fullmatch(r"\d{4}-\d\d-\d\d", fecha):
            y, mo, d = map(int, fecha.split("-")); c = date(y, mo, d)
            cerca = {(c + timedelta(days=i)).isoformat() for i in (-1, 0, 1)}
            ids = [e["id"] for e in ev if e["fecha_inicio"] in cerca]
        m["fechas_clave"][k] = dict(fecha=fecha, eventos=ids)
    return doc


def main():
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest="cmd", required=True)
    f = sp.add_parser("fusionar"); f.add_argument("base"); f.add_argument("extras", nargs="+"); f.add_argument("-o", required=True); f.add_argument("--prefijo", required=True); f.add_argument("--umbral", type=float, default=0.6)
    r = sp.add_parser("reindexar"); r.add_argument("doc"); r.add_argument("-o", required=True); r.add_argument("--prefijo", required=True)
    a = ap.parse_args()
    doc = json.load(open(a.doc if a.cmd == "reindexar" else a.base, encoding="utf-8"))
    if a.cmd == "fusionar":
        nuevos = 0; dup = []; mal = []
        for ruta in a.extras:
            for e in json.load(open(ruta, encoding="utf-8")):
                try: n = completar(e)
                except ValueError as ex: mal.append(str(ex)); continue
                d = duplicado(n, doc["eventos"], a.umbral)
                if d:
                    # no se pierde información: las fuentes nuevas se suman al evento existente
                    urls = {x["url"] for x in d["fuentes"]}
                    d["fuentes"] += [x for x in n["fuentes"] if x["url"] not in urls]
                    dup.append(f"{n['titulo'][:60]}  ≈  {d['titulo'][:60]}"); continue
                n["orden"] = 10**6; doc["eventos"].append(n); nuevos += 1
        print(f"nuevos: {nuevos} | duplicados (fuentes fusionadas): {len(dup)} | inválidos: {len(mal)}")
        for x in dup: print("  DUP", x)
        for x in mal: print("  MAL", x)
    reindexar(doc, a.prefijo)
    json.dump(doc, open(a.o, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("eventos:", len(doc["eventos"]), "| URLs:", len(doc["indice_fuentes"]), "->", a.o)


if __name__ == "__main__":
    main()
```

## Apéndice D — Plantillas de prompt para agentes

Reemplaza los textos entre `<>`. Cada prompt es autosuficiente: los agentes no ven esta conversación.

### D.1 Agente de línea de tiempo (por fases)

```
Eres un investigador de historia espacial. Tarea: encontrar eventos de la misión <NOMBRE> (<AGENCIA>, <CUERPO>) para la fase <FASES QUE CUBRE> y escribirlos como JSON.

CONTEXTO
Se construye una base de datos para una plataforma educativa 3D (público: estudiantes y aficionados). Cada evento debe poder comprobarse en una fuente.

QUÉ BUSCAR
<LISTA DE VERIFICACIÓN DE LA SECCIÓN 7.3 PARA LAS FASES DEL AGENTE>
Si hay un periodo de fechas o temas ya cubiertos (te paso la lista abajo), NO los repitas.

REGLAS (obligatorias)
1. Cada evento lleva ≥1 fuente con URL real que tú abriste (WebFetch) o viste en el buscador. No inventes URL.
2. No completes datos de memoria. Si no hay fuente, no escribas el evento.
3. Redacta en español, con tus palabras; si citas, máximo una frase de menos de 15 palabras por fuente.
4. verificacion de cada fuente: "página abierta (resumen automático de la herramienta)" si la abriste con WebFetch; "solo extracto de búsqueda" si solo viste el fragmento. Nunca pongas "página abierta completa" a menos que hayas leído el texto íntegro.
5. tipo de fuente: "oficial NASA/JPL", "científica", "prensa", "comunitaria", "libro/medio" o "video/audio".
6. Si dos fuentes discrepan: discutido=true y explica en nota.
7. Prefiere fuentes oficiales (jpl.nasa.gov, science.nasa.gov, nasa.gov, ntrs.nasa.gov, PDS) y artículos científicos. Wikipedia solo como pista.
8. Busca con consultas cortas (1–6 palabras), una por tema, y abre los documentos originales (PDF de kits de prensa, NTRS, artículos).
9. Meta: <N> eventos nuevos, concretos y con cifras (fechas exactas, masas, distancias, nombres).

FORMATO DE SALIDA
Escribe en <RUTA>/ev_<mision>_<rol>.json una lista JSON de objetos con estos campos (sin id ni orden):
{ "fecha_inicio":"AAAA[-MM[-DD]]", "fecha_fin":null, "precision_fecha":"día|mes|año|rango|aproximada|década",
  "sol":null, "sol_texto":null, "titulo":"...", "detalle":"2–5 oraciones", "datos_clave":["..."],
  "etapa":"capítulo de la misión", "fase":"<enum>", "categoria":"<enum>", "discutido":false, "nota":null,
  "fuentes":[{"titulo":"...","editor":"...","url":"https://...","tipo":"...","verificacion":"..."}] }
Enums: fase = origen | planificacion_y_desarrollo | lanzamiento_y_viaje | aterrizaje | operaciones | fin_de_mision | legado.
categoria = origen | planificacion | desarrollo | pruebas | lanzamiento | viaje | aterrizaje | despliegue | operacion | ciencia | problema | solucion | hito | fin_de_mision | legado.

RESPUESTA FINAL
Responde solo con: número de eventos, número de URL abiertas y cuántas no se pudieron abrir, discrepancias encontradas y huecos (máx. 150 palabras). No pegues el JSON en la respuesta.

EVENTOS YA EXISTENTES (no repetir):
<CONTENIDO DE existing_<mision>.txt, o "ninguno" en la ronda 1>
```

### D.2 Agente de «huecos» (ronda 2)
Igual que D.1, pero reemplaza «QUÉ BUSCAR» por: «Revisa la lista de eventos existentes y trae SOLO eventos que falten. Prioriza: (a) meses o años sin eventos; (b) fallas, anomalías y cómo se resolvieron; (c) pruebas y decisiones de ingeniería; (d) resultados científicos concretos; (e) legado e imágenes orbitales del hardware. Devuelve entre 15 y 25 eventos».

### D.3 Agente de hardware (cuatro roles)
```
Eres un ingeniero-historiador. Tarea: levantar la «radiografía» del hardware de <NOMBRE> para el grupo <GRUPO: instrumentos | cuerpo y subsistemas | EDL, lanzador, crucero y ensayos | fallas y estado final>.

OBJETIVO
Para cada componente: qué es, dónde va, quién lo construyó y quién fue el responsable, especificaciones medibles (masa, potencia, dimensiones, rangos, resolución, vida), qué descubrimientos permitió (con fecha aproximada), y su historial de fallas, degradaciones, soluciones y calibraciones (con fecha, y con sol si la fuente lo da).

LISTA DE COMPONENTES A CUBRIR
<LISTA DE LA SECCIÓN 9.3 PARA EL GRUPO; añade los componentes específicos de la misión>

REGLAS
(las mismas 1–8 de D.1) + 
9. Cada especificación = {parametro, valor (texto con unidades), fuentes[≥1]}. No pongas cifras sin fuente.
10. Si dos fuentes dan cifras distintas, incluye ambas como especificaciones separadas o una con discutido=true y explica en nota. No promedies ni elijas.
11. Busca el artículo instrumental original (por ejemplo, del investigador principal) y los informes de ingeniería en NTRS y PDS.
12. Anota en "huecos" lo que no encuentres: no lo inventes.

FORMATO DE SALIDA (lista JSON en <RUTA>/hw_<grupo>.json)
{ "id":"<prefijo>_hw_<nombre>", "nombre":"...", "categoria":"<enum de 9.2>", "sistema_padre":null|"<id>", "descripcion":"...", "ubicacion":"...",
  "proveedor":{"organizacion":"...","responsable":"..."}, "cantidad":1,
  "especificaciones":[{"parametro":"...","valor":"...","fuentes":[...]}],
  "que_permitio_descubrir":[{"titulo":"...","detalle":"...","fecha_aprox":"AAAA-MM","fuentes":[...]}],
  "historial_operativo":[{"fecha":"AAAA-MM-DD","tipo":"falla|degradacion|solucion|calibracion|hito","evento":"...","sol":null,"fuentes":[...]}],
  "datos_clave":["..."], "discutido":false, "nota":null, "fuentes":[...] }

RESPUESTA FINAL (máx. 150 palabras): componentes entregados, URL abiertas / no abiertas, discrepancias, huecos. No pegues el JSON.
```

### D.4 Agente auditor
```
Eres un auditor independiente. Recibes <ARCHIVO.json>. Toma al azar 15 eventos (o 15 especificaciones) y, para cada uno, abre al menos una de sus URL y comprueba: (1) la fecha, (2) las cifras, (3) los nombres, (4) que la fuente dice lo que el JSON afirma. Devuelve una tabla: id, qué se comprobó, resultado (confirmado | parcial | no confirmado | URL no abre), y la corrección propuesta. No modifiques el archivo. Sé estricto: si no puedes confirmar una cifra, di que no está confirmada.
```

## Apéndice E — Ejemplo mínimo de un evento válido

```json
{
  "id": "opp038", "orden": 38,
  "fecha_inicio": "2007-06", "fecha_fin": "2007-09", "precision_fecha": "rango",
  "sol": null, "sol_texto": null,
  "titulo": "Tormenta de polvo global; el 11 sep entra en Victoria",
  "detalle": "Una tormenta de polvo global reduce la energía solar: de unos 700 Wh por sol antes de la tormenta bajó a 128 Wh el 18 de julio de 2007, el mínimo de la misión hasta entonces. Por debajo de 400 Wh el equipo detiene la conducción y el brazo. Opportunity pasó semanas en modo de muy bajo consumo y entró al cráter Victoria el 11 de septiembre de 2007.",
  "datos_clave": ["700 Wh → 128 Wh (18 jul 2007)", "Umbral de 400 Wh: se detienen conducción y brazo", "Entrada a Victoria: 11 sep 2007"],
  "etapa": "Crisis y supervivencia", "fase": "operaciones", "categoria": "problema",
  "respaldo": "oficial_o_cientifico", "discutido": false, "nota": null,
  "fuentes": [{"titulo": "Mars Rovers Survive Dust Storms, Ready for Next Objectives", "editor": "JPL/NASA",
               "url": "https://www.jpl.nasa.gov/news/mars-rovers-survive-dust-storms-ready-for-next-objectives/",
               "tipo": "oficial NASA/JPL", "verificacion": "solo extracto de búsqueda"}],
  "compartido_con": [], "datos_extra": null
}
```

## Apéndice F — Ejemplo mínimo de un componente de hardware

```json
{
  "id": "opp_hw_minites", "nombre": "Mini-TES (espectrómetro de emisión térmica miniaturizado)",
  "categoria": "instrumento_ciencia", "sistema_padre": null,
  "descripcion": "Espectrómetro infrarrojo térmico que mide la radiación emitida por rocas, suelo y atmósfera para identificar minerales a distancia.",
  "ubicacion": "Óptica en el mástil PMA; electrónica en la caja caliente (WEB).",
  "proveedor": {"organizacion": "Universidad Estatal de Arizona", "responsable": "Philip Christensen"},
  "cantidad": 1,
  "especificaciones": [{"parametro": "Rango espectral", "valor": "5,01–29,45 µm",
     "fuentes": [{"titulo": "Mini-TES", "editor": "Christensen Research Group, ASU", "url": "https://christensen.asu.edu/instrument/mini-tes/", "tipo": "científica", "verificacion": "página abierta (resumen automático de la herramienta)"}]}],
  "que_permitio_descubrir": [{"titulo": "Hematita ligada a las esférulas", "detalle": "Confirmó desde el suelo la hematita detectada desde órbita.", "fecha_aprox": "2004-03", "fuentes": ["…al menos una fuente…"]}],
  "historial_operativo": [{"fecha": "2007-10-20", "tipo": "degradacion", "evento": "Última toma útil; el polvo sobre el espejo de apuntado bloquea el instrumento.", "sol": 1328, "fuentes": ["…"]}],
  "datos_clave": [], "discutido": false, "nota": null, "fuentes": ["…"], "subcomponentes": [], "eventos_relacionados": []
}
```
