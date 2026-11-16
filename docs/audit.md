# Audit of the information (milestone 54)

A vehicle-by-vehicle review of **all** the information a user of the platform sees: the text of the cards and the comics, narration and audio, illustrations, timeline and 3D route, the vehicle's 3D model and its position on the globe. Criterion: **what is shown is real and verified; what cannot be resolved stays with a default value and is documented here as a TODO** (the `TODO(audit)` comments in the code point to this file).

## Method and tools

| What was checked | How | Result |
| --- | --- | --- |
| **Numbers and months** of every stop (date, summary, facts) against its dossier | `npm run story-audit` (`scripts/audit-story.mjs`): every number and the month of the date must appear in `dossier.json` (context, verified facts, quotes). It prints only what does not fit | 120 stops; **only 14 warnings, all explained** (below) |
| **Narration ↔ audio** | `npm run story-audio -- <mission> --dry-run` (the `manifest.json` stores a hash of each clip's text) | **6 of 6 missions up to date** (120 clips, 0 to re-record) |
| **Illustration ↔ event** | contact sheets with id, date and title under each image (120 images), viewed one by one | All correspond to their event; no content errors |
| **Chronology** | reading each mission's `story.json` (order, dates, parts) | Correct order in the 6 stories |
| **External data** (web search, Nov 2026) | positions and figures the dossiers did not give | see "Sources consulted" |
| **3D** | the 6 stories opened in the browser (comic → 3D → closing card), and every change below | Correct after the changes |

Figures written as words ("two", "dos") are not checked by the script; they were read by hand (the narrations of Spirit, InSight and Beagle 2 against their dossiers' context; those of Opportunity, Ingenuity and Surveyor 3 were verified by the team when writing them).

### The 14 warnings of the script (and what was decided)

| Stop | Warning | Decision |
| --- | --- | --- |
| `opp001` "4", `opp008` "2", `ing038` "2", `ing137` "6", `spi006` "2", `spi040` "1", `spi057` "3", `bgl002` "3" | the dossier writes it in words ("cuatro", "dos"…) | correct; no change |
| `opp033` "30" | the dossier says the dune was "a third of a metre high" (≈ 33 cm) | correct (approximation "~30 cm"); no change |
| `sur035` "6,300" | the dossier gives 6,315 and 6,326 | **deliberate rounding** ("more than 6,300"); no change |
| `sur054` "155" | the dossier gives 155 / 163 / 180 m (and other sources 160–200 m) | **fixed: "~160 m"** (the figure almost all sources give: 535 ft ≈ 163 m); also on the globe card |
| `sur066` "40" | "forty years" (1969 → 2009) | correct (a calculation) |
| `spi076` "1,300" (×2) | the "more than 1,300 commands" are in dossier `spi069`, not `spi076` | correct (same mission, verified in `spi069`); recorded here |
| `bgl009` "1997", "2003" | the dates of the range "1997–2003" | correct (the development range) |

## Result per vehicle

| Vehicle | Story | 3D | Model | Globe (lat, lon) |
| --- | --- | --- | --- | --- |
| **Opportunity** | 20 events, verified | really drives (45.16 km) over a scale model | 6 wheels, rocker-bogie ✓ | −2.3°, −5.5° (Perseverance Valley; ±0.3°, see TODO-5) |
| **Spirit** | 20 events, verified | really drives; **backwards from Jul 2004** and **front-right wheel not turning from sol 779** (fixed, milestone 54) | 6 wheels; the "dead" wheel is no longer fixed from the start ✓ | −14.57°, 175.47° (Gusev; Troy ≈ −14.6°, 175.5°) |
| **Ingenuity** | 20 events, verified | really flies (72 flights, 17 km); **takes off when moving and lands (rotors stopped) at every stop** (fixed, milestone 54) | wheelless helicopter ✓ | **18.44°, 77.45°** (Jezero; before 24°, 65°: **fixed**) |
| **Surveyor 3** | 20 events, verified | **stationary** (fixed, milestone 54): 11 moments, Space goes to the next | **no wheels**: a tripod with three feet (before fictional wheels) ✓ | −3.014°, −23.419° (NSSDC) |
| **InSight** | 20 events, verified | stationary, 14 moments | no wheels, three legs ✓ | 4.5°, 135.6° (Elysium Planitia) |
| **Beagle 2** | 20 events, verified | stationary, 12 moments | no wheels, lying down ✓ | 11.5°, 90.4° (Isidis Planitia; HiRISE) |
| **Perseverance** | no story ("coming soon") | closed | with wheels ✓ | 25°, 69° (**default**, see TODO-1) |
| **SEV** | no story ("coming soon") | closed | with wheels (fictional) | 8°, 20° (**default**, see TODO-2) |

### Real positions and distances on the globe

All positions use **real latitude and longitude** (there are no more "invented distances" between real vehicles). Angular distance between the vehicles of each body (Mars radius 3,389.5 km; Moon 1,737.4 km):

| Mars | Distance | | Mars | Distance |
| --- | --- | --- | --- | --- |
| Opportunity – Spirit | 163.1° (9,649 km) | | Ingenuity – Beagle 2 | 14.3° (846 km) |
| Opportunity – Ingenuity | 84.1° (4,972 km) | | Ingenuity – InSight | 58.4° (3,455 km) |
| Opportunity – Beagle 2 | 96.2° (5,693 km) | | Beagle 2 – InSight | 45.3° (2,677 km) |
| Opportunity – InSight | 141.1° (8,348 km) | | Spirit – InSight | 43.9° (2,596 km) |
| Spirit – Ingenuity | 102.0° (6,033 km) | | Spirit – Beagle 2 | 88.2° (5,218 km) |
| Ingenuity – Perseverance | 10.2° (605 km): **default**; real < 1° | | **Moon:** Surveyor 3 – SEV | 44.7° (1,355 km): **default** |

Opportunity and Spirit are almost **antipodal** (163°): the two are never seen at once, as in reality. The globe's manual control always keeps some vehicle on the visible face.

## Changes made in the audit

1. **Globe (`bodies.ts`)**: Ingenuity moves to its real position (Jezero) and its card, which was still the **fictional demo** of the first prototype ("41 flights (fiction)", "invented story"), is rewritten with real data (72 flights, 17 km, last flight 18 Jan 2024, Valinor Hills). Opportunity: the landing date on the card becomes **24 Jan 2004 (Pacific time)**, as in its story (25 in UTC, stated in the text), like Spirit uses its local date. Surveyor 3: NSSDC coordinates, "~160 m" to the Apollo 12 module and it no longer "rolls on three wheels". SEV and Perseverance: labelled fictional and the default value marked `TODO(audit)`.
2. **Surveyor 3 stationary**: the real module did not move after its two bounces. `STATIONARY` + `BASE` in `surveyor3-story.mjs`, route and `story.json` regenerated (11 moments at one point of the lunar terrain with ~5° slope), a wheelless model (round feet). The 11 audio clips do not change (the narration text is the same).
3. **Spirit**: `RoverConfig.reverseAfter = "spi028"` (backwards from Jul 2004: the model turns 180° and the wheels turn the other way) and `deadWheelAfter = "spi040"` (the front-right wheel stops turning from sol 779; before it was locked from the start). The wheel is a `wheel(..., "dead")` of the kit.
4. **Ingenuity**: a vehicle with `hover` **only flies while moving** (it rises when it starts to move and lands when it stops; the rotors spin only in the air).
5. **New tool**: `npm run story-audit` (checks numbers and months against the dossiers).

## TODO (documented default values)

- **TODO-1 · Perseverance on the globe.** Its real position is Jezero, the same point as Ingenuity's (< 1° apart). It is left at (25°, 69°), ~9° northwest, so both markers can be clicked (and the card says so). Real fix: group them into one marker with a selector, or cluster zoom. *(`bodies.ts`, `TODO(audit)`).*
- **TODO-2 · SEV.** It is a **fictional** vehicle (a NASA prototype that was never on Apollo 14). It is left at (8° N, 20° E), near Mare Tranquillitatis, so as not to cover Surveyor 3. Apollo 14 landed at Fra Mauro (3.6° S, 17.5° W), 6° from Surveyor 3 (the markers would overlap). Pending decision: keep it, give it a real story or remove it. *(`bodies.ts`, `TODO(audit)`).*
- **TODO-3 · Scale-model terrains.** Opportunity, Spirit and InSight use `terrain.stl` (Meridiani); Ingenuity and Beagle 2, `gale-terrain.stl`; Surveyor 3, `moon-terrain.stl`. The stops **are not real places** and the distances between stops are not the real ones (e.g. Opportunity drove 45.16 km; in the 3D it covers ~1,000 units). Real fix: an elevation model of Gusev, Jezero, Elysium, Isidis and Oceanus Procellarum (HiRISE / LROC) with the stops at their coordinates.
- **TODO-4 · Ingenuity before the first flight.** Until 19 Apr 2021 (the first four stops) the helicopter did not fly; in the 3D, the leg between them is done "flying". Also each leg means "going from one landmark to another", not a specific flight (72 real flights). Fix: shorten those legs or present them as jumps.
- **TODO-5 · Opportunity's exact position.** The search did not give the exact coordinates of its last position (only "~25 km in a straight line from the landing site", in Perseverance Valley, west rim of Endeavour crater). (−2.3°, −5.5°) is used; the foreseeable error is < 0.3° (< 1 pixel on the globe). Pending: take the position from the final route map (PIA23178).
- **TODO-6 · Surveyor 3 and the slope.** The real module rested tilted ~12° on the wall of its crater; the point of the lunar terrain used has ~5° mean slope. No better terrain data.
- **TODO-7 · Stationary modules do not change with the moment.** On InSight the seismometer and the mole are already on the deck at every moment; on Surveyor 3 the arm does not dig; on Beagle 2 the panels do not open "halfway" as seen in 2015. Fix: model variants per moment (pieces that appear/disappear) and dust piling on the panels.
- **TODO-8 · Listen to** the 120 narrations and touch up the texts that leak into some illustrations (the calendar of `bgl032`, the "post" of `ins072`; Opportunity's carry English text on purpose: "EL CAPITAN", "TWO ROVERS").
- **TODO-9 · Vehicles without a story.** Perseverance and SEV stay "coming soon" and fictional (see TODO-1 and 2); there are no dossiers.
- **TODO-10 · Spirit and the places of its route.** The stops follow the real order (plain → Columbia Hills → Husband Hill → Home Plate → Troy) but over a scale-model terrain (TODO-3).

## Sources consulted in this audit (Nov 2026)

- Perseverance's record over Opportunity: **11 Oct 2026, 45.22 km vs 45.16 km** (sol 2,006), confirmed in several sources (JPL, ScienceDaily, EarthSky). Confirms `opp081`.
- Ingenuity: the last flight (no. 72, 18 Jan 2024) ended at **"Valinor Hills"**, in Jezero crater ([JPL PIA26237](https://www.jpl.nasa.gov/images/pia26237-ingenuity-at-valinor-hills/)).
- Spirit: final position **Troy ≈ 14.6° S, 175.5° E**, no communication since 22 Mar 2010 (sol 2,208) and end of the attempts on 25 May 2011 (USGS and others).
- Surveyor 3: **3.0138° S, 23.4193° W** (NSSDC, via NASA's Apollo 12 summary); distance of Apollo 12 **~160–200 m** (535 ft ≈ 163 m in NASA/ALSJ).
- Opportunity: **~25 km in a straight line** from the landing site to Perseverance Valley and **45.16 km** driven ([JPL PIA23178](https://www.jpl.nasa.gov/images/pia23178-opportunitys-final-traverse-map/)).
