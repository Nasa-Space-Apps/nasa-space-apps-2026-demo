# Guide: researching space missions and turning them into structured JSON

**Version 1.0 · 2026-11-14 · The deliverables are written in Spanish (with accents)** — they are the research data of a Spanish-speaking team; this guide is in English.

This guide describes, step by step, how the research of **Opportunity, Spirit, Ingenuity, InSight, Beagle 2 and Surveyor 3** (timelines) and the **hardware breakdown of Opportunity** was done, so that another AI agent can repeat the work for any other mission — on Mars, on the Moon or in deep space — and get JSON files that are **comparable between missions**.

Project context: NASA Space Apps 2026 challenge "Abandoned but not Forgotten" (tell the story of the hardware NASA left on the Moon, Mars and in deep space, for students and the general public). The team builds an interactive platform that tells the story of each mission; these JSON files are the platform's database. The schemas themselves live next to this guide: `esquema_linea_de_tiempo_v2.json` (timeline) and `esquema_hardware_v2.json` (hardware), and the scripts are `construir_mision.py` and `validar_mision.py`. The mission pipeline built on top of this base is in [`docs/research-pipeline.md`](../../docs/research-pipeline.md).

---

## 0. What is delivered per mission

| # | File | What it contains | Schema |
|---|---|---|---|
| 1 | `linea_de_tiempo_<mission>.json` | The whole story: origin, planning, development, tests, launch, cruise, landing, operations, problems and fixes, end of mission and legacy. Every event with a date, a category and sources (URL). | `esquema_linea_de_tiempo_v2.json` |
| 2 | `hardware_<mission>.json` | A "breakdown": each component (structure, power, instruments, cameras, EDL, launcher…) with specifications, who built it, **what it helped discover**, history of failures and fixes, and sources. | `esquema_hardware_v2.json` |
| 3 | (optional) entry in `catalogo_de_misiones.json` | Index of missions with key dates and counts. | — |

What is always delivered: the validated JSON files and a short message with the warnings (section 11).

---

## 1. Golden rules (read them before starting)

1. **Every claim carries a source with a URL.** An event or a specification without a source is not written. If there is no source, the datum goes to `pendientes_de_verificar` (timeline) or `huecos_y_pendientes` (hardware), never into the body of the file.
2. **Never fill in from memory.** Not dates, not masses, not names, not sols. Your memory tells you *what to look for*, it is not a source.
3. **Be honest about the verification level.** Web-reading tools (WebFetch) return a **model-generated summary**, not the whole page, so `"página abierta completa"` almost never applies. Use:
   - `"página abierta completa"`: only if you read the whole text (e.g. you downloaded a PDF and read it all).
   - `"página abierta (resumen automático de la herramienta)"`: you opened the URL with WebFetch.
   - `"solo extracto de búsqueda"`: you only saw the search snippet.
4. **If two sources disagree, do not choose silently.** Set `discutido: true`, explain in `nota`, and add an entry to `discrepancias` with both values and a recommendation.
5. **Source priority:** (1) official NASA/JPL/PDS/NTRS/centres; (2) scientific papers and proceedings; (3) specialised press; (4) community sources (Wikipedia, forums, wikis) only as a hint or for data that exists nowhere else, with `tipo: "comunitaria"`.
6. **Copyright.** Write in your own words, in Spanish. Quote literally only short phrases (fewer than 15 words) and one per source. Never copy paragraphs, lyrics or poems.
7. **Validate with scripts, not by eye.** Dates and sols are checked with arithmetic (section 7), the JSON with the schema, and the URLs with the index.
8. **One timeline per mission, in a single JSON, with the sources inside each event.** (The user rejected earlier giant structures with many loose sections.)
9. **Keep the field names and enums exactly as in the schemas.** The platform depends on them to compare missions.
10. **Messages to the user are short**: what came out, what warnings there are, one possible next step.

---

## 2. Flow overview

```
 0. Scope and sheet ──► 1. Source map ──► 2. JSON skeleton
                                                |
        +---------------------------------------+---------------------------------+
        v                                                                         v
 3. TIMELINE                                                              5. HARDWARE
    5 agents in parallel (by phases)                                         4 agents in parallel
    -> gaps round (with the list of existing events)                         (instruments / body and subsystems /
    4. merge + deduplicate + reindex                                          EDL-launcher-tests / failures and final state)
        |                                                                         |
        +--------------> 6. Validate (schema + scripts + manual review) <---------+
                                        |
                           7. Independent audit (another agent)
                                        |
                           8. Deliver + short message
```

Orientation of time and cost (what it took here): a timeline of 60–140 events with 5 agents + 1 gaps round; a hardware file of ~55 components with 4 agents. The agents run in the background and write files; the main agent only merges and validates.

---

## 3. Tools, environment and known limits

- **Web search** (`WebSearch`): short queries (1–6 words), one per topic; if the result is poor, rephrase or use the `extended` mode.
- **Web reading** (`WebFetch`): returns a **summary**, not the full text. Always use it on the real URL of the article or PDF and pass a concrete prompt (e.g. "list the masses, dimensions and suppliers it mentions"). If WebFetch says it covers only part of the page, move on with `offset` or note it as a limitation.
- **Sites that could NOT be opened in the original session:** `mars.nasa.gov/mer`, NSSDC `display.action` pages and Wikipedia (blocked by the tool). Try first; if it fails, **do not work around it with curl or mirrors**: look for another source (PDS, NTRS, JPL, papers) and note it in the gaps.
- **Shell:** Python 3 with `jsonschema`. Shell network traffic was restricted to a list of domains (pip/npm/GitHub); it is no use for downloading pages.
- **Sub-agents:** launched in the background; each gets a self-sufficient prompt, writes its JSON to disk and returns a short summary. They do not inherit your context: **everything they need must be in the prompt** (appendix D).

---

## 4. Step 0 — Choose the mission and fix the scope

### 4.1 Scope sheet (fill it in before searching anything)

```yaml
id: pathfinder                 # lowercase, no spaces; it is the file name
nombre: Mars Pathfinder and Sojourner
nombre_completo: ...
agencia: NASA/JPL
tipo: rover | lander | orbitador | impactador | sonda_espacio_profundo | modulo_tripulado | helicoptero
cuerpo: Marte | Luna | otro
lugar: landing site or destination
prefijo_eventos: pth           # 3–6 characters [a-z][a-z0-9]; events = pth001, pth002…
prefijo_hardware: pth          # components = pth_hw_<name>
sol_cero: UTC date of sol 0/1 (Mars only)   # looked up in sources, NOT assumed
sol_offset: 0 or 1             # 1 if sol 1 is the landing day (MER); 0 if sol 0 is
estado_actual: activa | terminada | perdida | impactada | en_orbita_inactiva
misiones_relacionadas: [..]
```

**How to fix `sol_cero` without inventing it:** look in the operations manual or in the PDS (the "sol/mission day" field) and cross-check with **two dated events** (landing and another milestone with a published sol and date). Expected result: the difference in days / 1.0275 + offset matches the published sol (tolerance ±3). In this project: Opportunity sol 1 = 2004-01-25; Spirit sol 1 = 2004-01-04; Ingenuity sol 0 = 2021-02-18; InSight sol 0 = 2018-11-26. One sol = 24 h 39 min 35 s = 1.0275 days.

### 4.2 Candidate missions (suggested priority)

The names are a working list, **not a source**: the agent must verify with sources what hardware remained and where.

| Body | Mission / family | What remained (to verify) | Notes for the agent |
|---|---|---|---|
| Mars | **Mars Pathfinder + Sojourner** | Inactive lander and rover | First rover on Mars; good next case |
| Mars | **Viking 1 and 2 (landers)** | Inactive landers at Chryse and Utopia | Different sol system; lots of technical literature in NTRS |
| Mars | **Phoenix** | Inactive lander at the north pole | Short mission with many "firsts" |
| Mars | Mars Polar Lander / Deep Space 2 | Lost on arrival | A failure-and-investigation story |
| Mars | Curiosity, Perseverance | Active; EDL parts (shield, back shell, descent stage) already on the ground | Active mission: set `estado_actual` and a cut-off date |
| Moon | **Apollo 11, 12, 14, 15, 16, 17** | LM descent stages, ALSEP instruments, retroreflectors, lunar rovers (15–17), objects left behind | No sol: use mission time (GET); crewed hardware |
| Moon | **Surveyor 1, 3, 5, 6, 7** | Soft-landing probes; Surveyor 3 was visited by Apollo 12 | A very good "left and visited" story |
| Moon | **Ranger 4, 6–9**, **Lunar Orbiter 1–5** | Controlled impacts or crashes | No "operational" surface; focus on the impact and the earlier science |
| Moon | LCROSS, LADEE, GRAIL (Ebb/Flow), Lunar Prospector | Final impacts | Planned end of mission as a science event |
| Moon | CLPS / commercial missions with NASA payloads (if asked) | Landers or wreckage | Mark `agencia` as commercial with a NASA payload |
| Deep space | **Pioneer 10/11**, **Voyager 1/2**, New Horizons | On escape trajectories | No surface; "current location" as a datum |
| Deep space | **Dawn**, **NEAR Shoemaker**, **Kepler**, Deep Impact, Stardust, Genesis, OSIRIS-REx | Orbiting a body, landed or in solar orbit | Each case has its own end of mission |

Suggested event prefixes (3 letters work; if there is a clash or several missions of one family, use 3–6 characters): `pth` Pathfinder, `vk1`/`vk2` Viking, `phx` Phoenix, `a11`…`a17` Apollo, `sv1`…`sv7` Surveyor, `dwn` Dawn, `nea` NEAR, `kep` Kepler, `pio` Pioneer, `voy` Voyager.

### 4.3 What is not NASA's or needs clarification

If the mission belongs to another agency (ESA, JAXA, CNSA, ISRO) or is commercial, say so in `agencia` and explain it; the challenge is about NASA hardware, but shared pieces (e.g. European instruments on NASA rovers) are documented. (Beagle 2 is in the repo for that reason: it is British/ESA, and NASA's HiRISE found it.)

---

## 5. Step 1 — Source map

Before launching agents, build an inventory of where to look. Do it yourself (5–10 searches) and pass it to the agents as a starting point.

### 5.1 Official and scientific sources by kind of data

| Datum | Where to look |
|---|---|
| General history and news | `science.nasa.gov/mission/<mission>`, `jpl.nasa.gov/news`, `nasa.gov/missions`, launch and landing press releases |
| Press kits (specifications, launch and landing chronology) | The mission's launch and arrival press kits (JPL/NASA), often PDFs |
| Technical reports, design, tests | **NASA NTRS** (`ntrs.nasa.gov`): engineering papers, test reports, AIAA/IEEE proceedings; search by subsystem name (parachute, airbag, RAD, heat shield…) |
| Instrument data and specifications | **PDS** (Planetary Data System): Geosciences (`pds-geosciences.wustl.edu`), Imaging and Atmospheres nodes; "instrument host" and "instrument" documents |
| Scientific papers | Science, Nature, JGR Planets, Space Science Reviews, ADS (`ui.adsabs.harvard.edu`), institutional repositories (Smithsonian, USGS, universities) |
| Operations planning and mission diaries | Team portals (e.g. the MER portal), engineers' blogs, `planetary.org`, JPL bulletins |
| Images of hardware on the surface | HiRISE (`uahirise.org`) for Mars; LROC (`lroc.sese.asu.edu`) for the Moon; each mission's raw galleries |
| Apollo | *Apollo Lunar Surface Journal*, *Apollo Flight Journal* (`history.nasa.gov/alsj`, `history.nasa.gov/afj`), mission reports, sample and ALSEP catalogues |
| Institutional history | `history.nasa.gov`, NASA SP books as PDFs, oral-history interviews |
| 3D models, video and education | `science.nasa.gov/3d-resources`, `nasa3d.arc.nasa.gov`, Eyes on the Solar System, NASA SVS (`svs.gsfc.nasa.gov`), NASA/JPL video channels, educational materials |
| Master catalogue | NSSDCA (`nssdc.gsfc.nasa.gov`) — may not open with WebFetch; use search and the PDS as an alternative |

### 5.2 Search patterns that worked

- `"<mission> press kit"`, `"<mission> mission timeline"`, `"<mission> launch press kit pdf"`.
- `"<mission> <subsystem> design"` (e.g. "Opportunity airbag design AIAA").
- `"<instrument> Opportunity instrument paper"` and the first known author.
- `"<mission> anomaly"`, `"<mission> failure investigation"`, `"<mission> lessons learned"`.
- `"<mission> final status"`, `"<mission> last contact"`, `"<mission> end of mission"`.
- For objects left behind: `"<mission> descent stage LROC"`, `"<lander> HiRISE image"`.
- One search per item: do not mix five subsystems in one query.

### 5.3 What to record for each source

`titulo`, `editor` (organisation or site), full `url`, `tipo` (one of six schema values), `verificacion` (one of three). If the URL has spaces, replace them with `%20`.

---

## 6. Step 2 — Skeleton of the timeline file

First create a JSON with all the top-level keys and `eventos: []`, so agents and scripts work on a fixed structure.

Mandatory top-level keys: `esquema_version` ("2.0"), `mision`, `titulo`, `idioma` ("es"), `generado`, `version`, `alcance`, `como_leer`, `aviso_verificacion`, `ficha_tecnica`, `equipo`, `totales_de_la_mision`, `records`, `discrepancias`, `pendientes_de_verificar`, `recursos_para_la_plataforma`, `eventos`, `fuentes_no_citadas_en_eventos`, `indice_fuentes`.

### 6.1 The `mision` block

```json
{
  "id": "opportunity", "nombre": "Opportunity", "nombre_completo": "Mars Exploration Rover B (MER-B)",
  "agencia": "NASA/JPL", "tipo": "rover", "cuerpo": "Marte", "lugar": "Meridiani Planum",
  "estado_actual": "Mission ended on 13 February 2019; the rover stays still in Perseverance Valley.",
  "sol_cero": "sol 1 = 25 January 2004 UTC",
  "fechas_clave": {"lanzamiento": {"fecha": "2003-07-07", "eventos": []}, "aterrizaje": {"fecha": "2004-01-25", "eventos": []},
                   "ultimo_contacto": {"fecha": "2018-06-10", "eventos": []}, "fin_oficial": {"fecha": "2019-02-13", "eventos": []}},
  "misiones_relacionadas": ["spirit"],
  "resumen": {"eventos": 0, "fuentes_unicas": 0, "eventos_por_fase": {}}
}
```

`fechas_clave.*.eventos` and `resumen` are filled in by `construir_mision.py reindexar`. The four key dates apply to every mission; if one does not exist (an impactor has no "last contact" distinct from impact), repeat the date or use `null` in `fecha` and explain it in `alcance`.

### 6.2 Other blocks the file must have

- `ficha_tecnica` and `totales_de_la_mision`: dictionaries `key → {valor, nota?, fuentes[]}` (mass, dimensions, planned life, distance driven, operating sols, number of images…).
- `equipo`: list of `{nombre, rol, fuentes}` (principal investigator, project manager, key engineers, institutions).
- `records`: milestones and records with value and source.
- `discrepancias`: `{tema, valores[], recomendacion, fuentes}`.
- `pendientes_de_verificar`: list of texts with what could not be confirmed.
- `recursos_para_la_plataforma`: lists of `{nombre, url}` for `modelos_3d`, `imagenes_y_panoramicas`, `vistas_desde_orbita`, `videos`, `documentales`, `datos`, `educacion`, `historias`, `portales`, plus a `nota`.
- `fuentes_no_citadas_en_eventos`: useful sources that do not back a specific event (kept for other uses).

---

## 7. Step 3 — Timeline: event specification

### 7.1 Fields of each event (all mandatory; `additionalProperties: false`)

| Field | Type | Rule |
|---|---|---|
| `id` | text | `<prefix><NNN>` (e.g. `opp018`). Assigned by the script; never invent it by hand |
| `orden` | integer ≥ 1 | Chronological position; assigned by the script |
| `fecha_inicio` | text | Partial ISO: `2004`, `2004-01`, `2004-01-25` |
| `fecha_fin` | text or `null` | Same format; only for ranges |
| `precision_fecha` | enum | `año`, `mes`, `día`, `rango`, `aproximada`, `década` |
| `sol` | integer or `null` | Mars only, and only if a source gives it or it can be calculated safely |
| `sol_texto` | text or `null` | Free text: "sol 1", "sol 1,329 (approx.)". On the Moon: mission time (GET/MET), e.g. "GET 102:45:39" |
| `titulo` | text | 3+ characters, concrete ("The front-right wheel jams"), no empty adjectives |
| `detalle` | text | 10+ characters; 2–5 sentences: what happened, why it matters, relevant figures. Do not copy sources |
| `datos_clave` | list of text | 1–5 figures or hard facts ("700 Wh → 128 Wh (18 Jul 2007)") |
| `etapa` | text | The mission's own chapter ("Crisis and survival", "Eagle Crater"). Free |
| `fase` | enum | **Standard, for comparing**: `origen`, `planificacion_y_desarrollo`, `lanzamiento_y_viaje`, `aterrizaje`, `operaciones`, `fin_de_mision`, `legado` |
| `categoria` | enum | **Standard**: `origen`, `planificacion`, `desarrollo`, `pruebas`, `lanzamiento`, `viaje`, `aterrizaje`, `despliegue`, `operacion`, `ciencia`, `problema`, `solucion`, `hito`, `fin_de_mision`, `legado` |
| `respaldo` | enum | `oficial_o_cientifico` (≥1 official or scientific source), `secundario`, `sin_fuente` (must not be used) |
| `discutido` | boolean | `true` if sources disagree; requires a `nota` |
| `nota` | text or `null` | Explains the discrepancy or the limitation |
| `fuentes` | list (≥1) | Source objects (section 5.3) |
| `compartido_con` | list of text | Other missions that share the event (e.g. the MER twin launch) |
| `datos_extra` | object, list or `null` | Any extra structured datum (coordinates, instrument list…) |

### 7.2 How to classify `fase` and `categoria`

- A `problema` is paired with a `solucion` (another event) when there was one; name them so they can be chained ("The wheel jams" → "They drive backwards for years").
- `ciencia` is a discovery or scientific result; `operacion` is routine activity or a driving/flying milestone; `hito` is a record or a first; `despliegue` is surface deployment (opening panels, lowering ramps, raising a mast).
- Events before approval (concept, proposal, design competition) → `fase: origen`; design, construction, assembly, ground tests → `planificacion_y_desarrollo`; everything until touching the ground (cruise and corrections included) → `lanzamiento_y_viaje`; entry, descent and landing → `aterrizaje`; afterwards → `operaciones`; last contact and official declaration → `fin_de_mision`; tributes, names, technical heritage, later orbital images → `legado`.
- **Do not leave all the operations events as `operacion`**: use `ciencia`, `problema`, `solucion` and `hito` where they apply. A healthy distribution has variety of categories.

### 7.3 What a complete timeline must cover (checklist)

**Origin**: original concept, who proposed it, technical background (heritage from earlier missions), competition or selection, approval and budget, key team.
**Planning and development**: science requirements, landing-site selection (candidates, vote, orbital images used), subsystem design, instrument selection, contractors, design reviews, delays and changes, tests (vibration, thermal-vacuum, parachute, airbags, landing), assembly and delivery to the launch site.
**Launch and cruise**: the rocket and its history, date and window, delays, trajectory, course corrections, cruise events, anomalies, final preparations.
**Landing**: minute-by-minute entry, descent and landing (EDL), arrival signal, first images, bounces and state after touchdown, deployment.
**Operations**: chapter by chapter (each crater, region or campaign), first science results, records, **all the problems** and how they were solved (software, hardware, power, weather), mission extensions and their reasons, operating changes (low-power modes, new driving or flying strategies), collaboration with orbiters, public participation.
**End of mission**: cause of the end (dust, power, cold, fuel, planned impact), recovery attempts, last contact, official announcement, final state of the hardware, last image or datum.
**Legacy**: final figures, orbital images of the hardware on the surface (exact place), tributes (rock names, asteroids, films, documentaries), what later missions inherited, open data.

Volume guide: 60–140 events for a long mission (Opportunity 81, Spirit 80, Ingenuity 141, InSight 92). A short or impact mission may stay at 30–50. More important than the number is covering **every month with known facts** and **every failure**.

### 7.4 Writing rules

- Spanish, past tense, concrete sentences. Readable units ("1,5 kg", "−85 °C", "2.269 soles"); decimal comma.
- Dates in UTC when the source says so; if one source gives local or Earth date and another a Mars one, note it.
- Every figure in `detalle` must be findable in one of the event's `fuentes`.
- Do not use "probably" without a reason: if it is an inference, say so ("according to the team, the most likely cause was…").
- Avoid talking about "the platform" or "the user" inside the JSON.

### 7.5 Sol calculation and check

For Mars: `calculated_sol = (date − sol_zero_date) / 1.0275 + offset`. If the event carries a `sol`, the difference is greater than 3 and the event is not `discutido`, the validator reports it. When a single source gives a sol that does not fit the date (it happened with Opportunity, sol 760 at Erebus and sol 2709 at Endeavour), **do not fix it yourself**: set `discutido: true`, keep both values and explain in `nota`.

On the Moon and in deep space, `sol` is always `null`. Use `sol_texto` for the elapsed mission time when the source gives it, and validate dates with the official chronologies (e.g. between the events of a landing).

---

## 8. Step 3b — Fan-out of agents for the timeline

**Do not research everything yourself**: the context fills up and quality drops. Launch agents in parallel and merge.

### 8.1 Round 1 — five agents by phases

All write a JSON list of *raw* events (no `id` or `orden`) to `ev_<mission>_<role>.json`:

| Agent | Covers | Guiding question |
|---|---|---|
| A | origin + planning + development | Who decided to build it, when and why, and how was it designed? |
| B | tests + launch + cruise | What was tested, how did the launch go and what happened in cruise? |
| C | entry, descent, landing and the first days | What happened minute by minute and what was seen first? |
| D | operations (split by years if long) | What did it do, what did it discover, what failed and how was it solved? |
| E | end of mission + legacy + current state | How did it end, where is the hardware and what did it leave? |

The prompt of each agent is in appendix D.1; it includes the event schema, the golden rules, the suggested sources and the output contract.

### 8.2 Round 2 — gaps (with the list of what already exists)

After merging round 1, generate `existing_<mission>.txt` with one line per event (`date | title`) and launch 2–4 "gaps" agents: each receives that list and must **bring only events that are not there**, prioritising: (a) months without events, (b) failures and fixes, (c) tests and engineering decisions, (d) science milestones, (e) legacy. This added between 18 and 24 events per mission and noticeably raised the quality.

### 8.3 Merge and deduplication

```
python3 construir_mision.py fusionar linea_de_tiempo_<m>.json ev_*.json -o linea_de_tiempo_<m>.json --prefijo <prefix>
```

The script validates each raw event (enums, dates, URLs), drops duplicates (same epoch and a very similar title or detail) **but adds their sources to the existing event**, sorts, renumbers ids and rebuilds `indice_fuentes` and `resumen`. Review by hand the `DUP` and `MAL` lists it prints: adjust `--umbral` (0.6 by default) if it lets duplicates through or drops distinct events.

### 8.4 Mandatory manual review after merging

1. Read the titles in order: are there year gaps without events? are there semantic duplicates in different wording?
2. Check the distribution of `categoria`: if more than 70 % is `operacion`, reclassify.
3. Check the `discutido` events: each with a clear `nota` and an entry in `discrepancias`.
4. Verify that `fechas_clave` points to the right events (launch, landing, last contact, official end).

---

## 9. Step 4 — Hardware breakdown

### 9.1 Idea

A **flat** list of components with a hierarchy (`sistema_padre` / `subcomponentes`), so a 3D platform can draw the vehicle and show, when each part is touched, what it is, who made it, how much it weighs, what it helped discover and how it failed or degraded.

### 9.2 Fields of each component

| Field | Rule |
|---|---|
| `id` | `<prefix>_hw_<short_name>` (e.g. `opp_hw_pancam`) |
| `nombre` | Full name in Spanish with the acronym ("Mini-TES (espectrómetro de emisión térmica miniaturizado)") |
| `categoria` | Enum (see below) |
| `sistema_padre` | Id of the containing component, or `null` |
| `descripcion` | What it is and what it is for, in 2–4 sentences a student can follow |
| `ubicacion` | Where it is mounted |
| `proveedor` | `{organizacion, responsable}` (builder and scientific/engineering lead) |
| `cantidad` | Number of units |
| `especificaciones` | List of `{parametro, valor, fuentes[≥1]}`; the value is always text with units |
| `que_permitio_descubrir` | List of `{titulo, detalle, fecha_aprox, fuentes[≥1]}`: connects engineering with science |
| `historial_operativo` | List of `{fecha, tipo (falla/degradacion/solucion/calibracion/hito), evento, sol, fuentes[≥1]}` |
| `datos_clave` | Short phrases with no individual source (the component's source covers them) |
| `discutido` / `nota` | As in events |
| `fuentes` | General sources of the component |
| `subcomponentes` | List of child ids (computed by the script) |
| `eventos_relacionados` | Timeline ids (see 9.6) |

**Categories** (schema enum): `estructura`, `movilidad`, `energia`, `computo_y_datos`, `comunicaciones`, `termico`, `brazo_robotico`, `instrumento_ciencia`, `camara_ingenieria`, `calibracion`, `navegacion_y_sensores`, `lanzador`, `crucero`, `entrada_descenso_aterrizaje`, `prueba_en_tierra`, and for other kinds of mission: `propulsion`, `actitud_y_control`, `vehiculo_tripulado`, `etapa_de_descenso`, `etapa_de_ascenso`, `vehiculo_lunar`, `objeto_dejado_atras`. If you need a new category, add it to the schema enum **and** document the change.

### 9.3 Checklist by kind of spacecraft

- **Rover:** structure (chassis/WEB, mast), mobility (wheels, suspension, motors, steering), power (panels/RTG, batteries, electronics), computing (CPU, flash/RAM, flight software), communications (antennas, radios, relays), thermal (heaters, RHUs, insulation), arm, instruments (one per component, with supplier and science), engineering cameras, calibration targets, navigation sensors; EDL (shield, parachute, back shell, retro rockets, airbags or sky crane, radar); launcher and cruise stage; ground tests and engineering models.
- **Static lander:** the same without mobility; plus legs, descent system, surface camera, sampling arm, weather stations, seismometers.
- **Helicopter (Ingenuity):** rotors, batteries, cameras, navigation sensors, heating electronics, link with the rover, and the deployment system on the rover.
- **Orbiter / impactor / deep-space probe:** structure, propulsion, attitude and control, power (panels/RTG), computing, communications, instruments, and for impactors the terminal-guidance system; final or current trajectory data.
- **Crewed lunar module (Apollo):** descent stage, ascent stage, engines, landing gear, ALSEP instruments, retroreflectors, lunar rover, objects left behind (flags, plaques, tools), life-support system (if the scope asks for it).
- **Hardware left behind:** for every piece that stayed on a body, a component (or an `objetos_dejados` block, 9.8).

### 9.4 Fan-out of agents for hardware (4 agents, in parallel)

| Agent | Covers | Output |
|---|---|---|
| 1. Instruments | All science instruments and cameras: specifications, builder, science they made possible | `hw_instrumentos.json` |
| 2. Body and subsystems | Structure, mobility, power, computing, communications, thermal, arm, calibration | `hw_cuerpo.json` |
| 3. EDL, launcher, cruise and tests | Launcher, cruise stage, entry/descent/landing, ground tests and models | `hw_edl.json` |
| 4. Failures and final state | History of failures, degradations, fixes, calibrations, final state of the hardware | `hw_fallas.json` |

Each agent returns a list of components in the format of 9.2. Agent 4 may use ids ending in `_salud` that are later **merged into the parent component** (the script does it with a `PADRE_FALLA` dictionary; build your own).

### 9.5 Hardware merge

1. Normalise each component: `especificaciones` or `que_permitio_descubrir` arriving as plain text move to `datos_clave` (agents sometimes forget the format).
2. Merge by id; if two agents describe the same component, mix the lists avoiding duplicates (same `parametro`, or a very similar title/date) and join the sources; if both give a `nota`, concatenate them.
3. Merge the `*_salud` entries of agent 4 into their parent component.
4. Review missing parents (a `sistema_padre` that does not exist → set `null` and decide by hand).
5. Compute `subcomponentes` (the inverse of `sistema_padre`).
6. Sort by category and then by id.

### 9.6 Link with the timeline (`eventos_relacionados`)

It was linked **automatically** by keywords and month match between the component's history/discovery and the timeline events. It is a weak link: only 16 of 54 components ended up with links, and it was not reviewed one by one. Recommended improvement: an agent reviews each component and writes the right ids by hand, or the step-8.2 agent leaves them in the events' `datos_extra`. Always document in `como_leer` that it is an automatic link if it was not reviewed.

### 9.7 Aggregated sections of the hardware document

- `descubrimientos_por_componente`: a flat list of all the `que_permitio_descubrir` with the component, sorted by date.
- `discrepancias`: one per `discutido` component with a `nota`.
- `huecos_y_pendientes`: an honest list of what was **not** found (e.g. "no source: mass and power of the APXS"; "mars.nasa.gov/mer did not open"). **Do not leave it empty**: hardware without documented gaps is suspicious.
- `indice_fuentes`: each URL once, with the ids of the components that use it and the best verification obtained.
- `resumen`: counts (components, by category, specifications, discoveries, operating events, unique sources, disputed).

### 9.8 Recommended extension: objects left on the surface (the Space Apps challenge)

The challenge is about **abandoned** hardware. For every mission with hardware on a body, add an optional block to the hardware document (the validator does not require it):

```json
"objetos_dejados": [{
  "nombre": "Descent stage of the Apollo 11 lunar module (\"Eagle\")",
  "cuerpo": "Luna", "lugar": "Sea of Tranquility",
  "coordenadas": {"lat": null, "lon": null, "sistema": "selenographic", "fuentes": []},
  "estado": "inactivo | activo | destruido_en_impacto | en_orbita | en_trayectoria | desconocido",
  "ultima_imagen": {"fecha": null, "instrumento": "LROC | HiRISE | otro", "url": null},
  "componente_id": "id of the related component or null",
  "fuentes": []
}]
```

Every coordinate must come from a source (LROC, HiRISE, landing-site catalogue); if there is none, `null` and a gap.

---

## 10. Step 5 — Validation

### 10.1 Automatic (mandatory)

```
python3 validar_mision.py linea_de_tiempo_<m>.json --sol-cero YYYY-MM-DD --sol-offset 0|1      # Mars
python3 validar_mision.py linea_de_tiempo_<m>.json --sin-sol                                     # Moon / deep space
python3 validar_mision.py hardware_<m>.json --sol-cero ... --linea linea_de_tiempo_<m>.json
```

It checks: JSON Schema draft-07, chronological order, `orden` 1..N, unique ids, `fecha_fin ≥ fecha_inicio`, `discutido` with `nota`, official `respaldo` with an official/scientific source, well-formed URLs, event URLs present in `indice_fuentes`, valid `fechas_clave`, sols against dates, consistent hardware parents and children, existing related events. **It must end with `problemas: 0`.**

### 10.2 Manual (at least this)

1. Open 10 random events and 10 random specifications and check them against the source (open the URL again).
2. Look for badly converted units (lb ↔ kg, ft ↔ m, mph ↔ km/h).
3. Check proper names (people, institutions, geographic features) against the source.
4. If you find a figure that is in no source, remove it or move it to `pendientes_de_verificar`.
5. Check that no `comunitaria` source is the only one for an important fact.

### 10.3 Independent audit (recommended for high-risk work)

Launch an agent that **has not seen the work**: give it the final JSON and golden rule 3, and ask it to check 15 random events and 15 random specifications by opening the URLs, and to return a list of discrepancies. Fix and validate again, so the work does not grade itself.

---

## 11. Step 6 — Delivery

1. Save the files with the names `linea_de_tiempo_<id>.json`, `hardware_<id>.json`.
2. Send them to the user; upload to a shared drive only if they ask (files the user uploaded to a drive are not editable, so create a new folder instead of overwriting).
3. Write a short message with: how many events/components and URLs; the 3–5 important warnings (discrepancies, pages that did not open, automatic links, missing data); and a possible next step.
4. Update `catalogo_de_misiones.json` if you keep it.

Template text for the warnings:
- "No page was read in full; I worked with summaries of the pages. Cross-check the key figures before publishing them."
- "The sources differ on X; it is marked as disputed."
- "I could not open <site>; that data stayed as gaps."

---

## 12. Adaptations by kind of mission

### 12.1 Mars

Use `sol`. Verify sol zero with two dated events. Key sources: PDS, JPL, HiRISE, team portals and relay orbiters (UHF). Active missions (Curiosity, Perseverance) need `estado_actual` with a cut-off date and must warn that the timeline is open at the end.

### 12.2 Moon (crewed or not)

- `sol` = `null` always. Use UTC dates and mission time in `sol_texto`.
- Distinguish the **command module** (came back to Earth), the **descent stage** (stayed on the surface), the **ascent stage** (depending on the mission: crashed, stayed in orbit or was lost), **instruments left** (ALSEP, retroreflectors), the **lunar rover** (missions 15–17) and **minor objects**.
- Key sources: *Apollo Lunar Surface Journal*, mission reports, LROC landing-site catalogues with coordinates and hardware images, NTRS.
- For uncrewed probes (Surveyor, Ranger, Lunar Orbiter): one spacecraft per mission, tests and science results before Apollo; highlight the link with the crewed missions (e.g. Apollo 12's visit to Surveyor 3).
- The end of the mission may be a **planned impact** (LCROSS, LADEE, GRAIL, Lunar Prospector): the category is `fin_de_mision` and the impact is treated as a science event.

### 12.3 Deep space and minor bodies

- `sol` = `null`; encounter and flyby dates are milestones; the "place" is the trajectory or the body visited.
- Current state: distance to the Sun/Earth or relative position with a **cut-off date** and a source (JPL Eyes on the Solar System, Horizons or other).
- In hardware, focus on propulsion, power (RTG or panels), high-gain antenna, instruments and what science each made possible.

### 12.4 Related missions

If two spacecraft share a launch, technology or event, use `compartido_con` in the events and `misiones_relacionadas` in `mision`, and copy the shared event's sources into both files.

---

## 13. Lessons learned (real mistakes of this project)

1. **Events without a source:** when joining files, an Opportunity event ("Spirit's launch") ended up with `fuentes: []`; copy the sources from the original file or delete the event.
2. **Inconsistent sols:** two Opportunity events (sol 760 at Erebus, sol 2709 at Endeavour) came from a single secondary source and did not fit the dates; they were marked `discutido`.
3. **Category heuristics:** classifying by keywords got it wrong (e.g. "Leaves the crater" → `solucion`; "First data release" → `problema`). Review by hand or use per-title corrections.
4. **URLs with spaces** (e.g. `…/MER instrument host.htm`) break the `https?://\S+` pattern; replace spaces with `%20`.
5. **Uncited sources** were lost as bare keys after a migration; always keep the whole object.
6. **Automatic link** with the timeline (by keywords) linked unrelated events (e.g. "lands" with events on another topic). It was restricted by month match, but it is still weak.
7. **Hardware agents** sometimes returned plain strings where the schema asks for objects with a source; normalise (9.5).
8. **Sites that did not open:** mars.nasa.gov/mer, NSSDC and Wikipedia. Plan alternatives from the start.
9. **Figures that differ between official sources** (rover mass 174 vs 180 kg; wheel diameter 26 vs 25 cm; battery capacity 8 vs 10 Ah): documenting them is part of the file's value.
10. **Ambiguous names:** "Scarecrow" is a Curiosity engineering model, not a MER one; watch homonyms between missions.
11. **Giant structures confuse:** the user asked for **a timeline with data and sources**, not a tree of disconnected sections.
12. **Renumbering ids changes references:** if you already delivered a version, say so in `version` and do not change ids needlessly.

---

## 14. Final checklist (tick everything before delivering)

- [ ] Scope sheet complete; `sol_cero` verified with two events (Mars) or `sol` null (everything else).
- [ ] The timeline covers the seven phases and every month with known facts.
- [ ] There are at least as many problem→solution pairs as known failures.
- [ ] Every event has ≥1 source; the ones with official backing have an official or scientific source.
- [ ] Discrepancies marked and explained; `pendientes_de_verificar` not empty (or justified).
- [ ] Hardware: coherent hierarchy; every instrument with supplier and the science it enabled; failures with date and source; honest `huecos_y_pendientes`.
- [ ] Automatic validation with 0 problems; manual review of a sample; independent audit if the work is high-risk.
- [ ] Copyright: own wording, no copied paragraphs.
- [ ] Short final message with real warnings.

---

# APPENDICES

The JSON schemas (former appendices A and B) are the files `esquema_linea_de_tiempo_v2.json` and `esquema_hardware_v2.json` in this folder, and the scripts (former appendix C) are `validar_mision.py` and `construir_mision.py` (`--help` prints their commands). What follows are the agent prompts and the minimal examples.

## Appendix D — Prompt templates for agents

Replace the texts between `<>`. Every prompt is self-sufficient: the agents do not see this conversation.

### D.1 Timeline agent (by phases)

```
You are a space-history researcher. Task: find events of the mission <NAME> (<AGENCY>, <BODY>) for the phase <PHASES COVERED> and write them as JSON.

CONTEXT
A database is being built for a 3D educational platform (audience: students and enthusiasts). Every event must be checkable against a source.

WHAT TO LOOK FOR
<CHECKLIST OF SECTION 7.3 FOR THE AGENT'S PHASES>
If there is a period of dates or topics already covered (list below), do NOT repeat them.

RULES (mandatory)
1. Every event carries ≥1 source with a real URL that you opened (WebFetch) or saw in the search engine. Do not invent URLs.
2. Do not fill in data from memory. If there is no source, do not write the event.
3. Write in Spanish, in your own words; if you quote, at most one phrase of fewer than 15 words per source.
4. verificacion of each source: "página abierta (resumen automático de la herramienta)" if you opened it with WebFetch; "solo extracto de búsqueda" if you only saw the snippet. Never write "página abierta completa" unless you read the whole text.
5. source tipo: "oficial NASA/JPL", "científica", "prensa", "comunitaria", "libro/medio" or "video/audio".
6. If two sources disagree: discutido=true and explain in nota.
7. Prefer official sources (jpl.nasa.gov, science.nasa.gov, nasa.gov, ntrs.nasa.gov, PDS) and scientific papers. Wikipedia only as a hint.
8. Search with short queries (1–6 words), one per topic, and open the original documents (press-kit PDFs, NTRS, papers).
9. Goal: <N> new, concrete events with figures (exact dates, masses, distances, names).

OUTPUT FORMAT
Write to <PATH>/ev_<mission>_<role>.json a JSON list of objects with these fields (no id or orden):
{ "fecha_inicio":"YYYY[-MM[-DD]]", "fecha_fin":null, "precision_fecha":"día|mes|año|rango|aproximada|década",
  "sol":null, "sol_texto":null, "titulo":"...", "detalle":"2–5 sentences", "datos_clave":["..."],
  "etapa":"mission chapter", "fase":"<enum>", "categoria":"<enum>", "discutido":false, "nota":null,
  "fuentes":[{"titulo":"...","editor":"...","url":"https://...","tipo":"...","verificacion":"..."}] }
Enums: fase = origen | planificacion_y_desarrollo | lanzamiento_y_viaje | aterrizaje | operaciones | fin_de_mision | legado.
categoria = origen | planificacion | desarrollo | pruebas | lanzamiento | viaje | aterrizaje | despliegue | operacion | ciencia | problema | solucion | hito | fin_de_mision | legado.

FINAL ANSWER
Reply only with: number of events, number of URLs opened and how many could not be opened, discrepancies found and gaps (max. 150 words). Do not paste the JSON in the answer.

EXISTING EVENTS (do not repeat):
<CONTENT OF existing_<mission>.txt, or "none" in round 1>
```

### D.2 "Gaps" agent (round 2)

Same as D.1, but replace "WHAT TO LOOK FOR" with: "Review the list of existing events and bring ONLY events that are missing. Prioritise: (a) months or years without events; (b) failures, anomalies and how they were solved; (c) tests and engineering decisions; (d) concrete science results; (e) legacy and orbital images of the hardware. Return between 15 and 25 events."

### D.3 Hardware agent (four roles)

```
You are an engineer-historian. Task: build the hardware "breakdown" of <NAME> for the group <GROUP: instruments | body and subsystems | EDL, launcher, cruise and tests | failures and final state>.

GOAL
For every component: what it is, where it goes, who built it and who was responsible, measurable specifications (mass, power, dimensions, ranges, resolution, life), what discoveries it enabled (with an approximate date), and its history of failures, degradations, fixes and calibrations (with date, and sol if the source gives it).

LIST OF COMPONENTS TO COVER
<LIST OF SECTION 9.3 FOR THE GROUP; add the mission-specific components>

RULES
(the same 1–8 of D.1) +
9. Every specification = {parametro, valor (text with units), fuentes[≥1]}. No figures without a source.
10. If two sources give different figures, include both as separate specifications or one with discutido=true and explain in nota. Do not average or choose.
11. Look for the original instrument paper (e.g. by the principal investigator) and the engineering reports in NTRS and PDS.
12. Note in "huecos" what you cannot find: do not invent it.

OUTPUT FORMAT (JSON list in <PATH>/hw_<group>.json)
{ "id":"<prefix>_hw_<name>", "nombre":"...", "categoria":"<enum of 9.2>", "sistema_padre":null|"<id>", "descripcion":"...", "ubicacion":"...",
  "proveedor":{"organizacion":"...","responsable":"..."}, "cantidad":1,
  "especificaciones":[{"parametro":"...","valor":"...","fuentes":[...]}],
  "que_permitio_descubrir":[{"titulo":"...","detalle":"...","fecha_aprox":"YYYY-MM","fuentes":[...]}],
  "historial_operativo":[{"fecha":"YYYY-MM-DD","tipo":"falla|degradacion|solucion|calibracion|hito","evento":"...","sol":null,"fuentes":[...]}],
  "datos_clave":["..."], "discutido":false, "nota":null, "fuentes":[...] }

FINAL ANSWER (max. 150 words): components delivered, URLs opened / not opened, discrepancies, gaps. Do not paste the JSON.
```

### D.4 Auditor agent

```
You are an independent auditor. You receive <FILE.json>. Take 15 events (or 15 specifications) at random and, for each one, open at least one of its URLs and check: (1) the date, (2) the figures, (3) the names, (4) that the source says what the JSON claims. Return a table: id, what was checked, result (confirmed | partial | not confirmed | URL does not open), and the proposed correction. Do not modify the file. Be strict: if you cannot confirm a figure, say it is not confirmed.
```

## Appendix E — Minimal example of a valid event

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

## Appendix F — Minimal example of a hardware component

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
  "que_permitio_descubrir": [{"titulo": "Hematita ligada a las esférulas", "detalle": "Confirmó desde el suelo la hematita detectada desde órbita.", "fecha_aprox": "2004-03", "fuentes": ["…at least one source…"]}],
  "historial_operativo": [{"fecha": "2007-10-20", "tipo": "degradacion", "evento": "Última toma útil; el polvo sobre el espejo de apuntado bloquea el instrumento.", "sol": 1328, "fuentes": ["…"]}],
  "datos_clave": [], "discutido": false, "nota": null, "fuentes": ["…"], "subcomponentes": [], "eventos_relacionados": []
}
```
