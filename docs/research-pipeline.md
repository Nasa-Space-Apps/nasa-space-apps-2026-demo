# Research pipeline: from a mission to a verified story

The web demo (see [story.md](story.md)) only shows facts that come out of this pipeline. It turns a space mission into a **verified story of N events** for secondary-school students (17 years old). It lives next to the app, but it is a separate workflow: Python tools, Claude skills and data under `misiones/`. It is the work of the research team; the app only consumes its dossiers.

> **Status (Nov 2026):** six missions went through it — Opportunity (30 dossiers), Spirit, Ingenuity, InSight, Beagle 2 and Surveyor 3 (20 each) — and all six are implemented in the demo.

## The two phases

```
PHASE 1  base timeline            timelines_v0/linea_de_tiempo_<id>.json     (toolkit: timelines_v0/kit_herramientas/)
PHASE 2  story of N events
   2.1   choose N and the events                          skill mars-story-event-selection
   2.2   research each event (agent, 3 in parallel)       skill mars-event-research
   2.3   reconcile the dossiers                           skill mars-dossier-reconciliation
   2.4   write the story                                  skill mars-story-writing
```

The orchestrating skill is `mars-mission-story-pipeline` (`.claude/skills/`); the skills are loaded by Claude Code on their own. To start or resume a mission:

```
cd agents/opportunity-research
.venv\Scripts\python pipeline.py estado <id>      # prints the phase, the numbers and the NEXT STEP
```

(Create the virtual environment first: see [`agents/opportunity-research/README.md`](../agents/opportunity-research/README.md). Despite its name, that folder is the research agent for every mission.)

### Phase 1 — base timeline

A JSON file per mission with 60–140 dated events, each with sources, built with the kit in `timelines_v0/kit_herramientas/` (guide: `GUIDE.md`; schemas; `construir_mision.py` and `validar_mision.py`). If the file already exists it is not redone: it is validated (`pipeline.py validar-base <id>`, must report **0 problems**). The base is a **map, not the truth**: if a dossier contradicts it, the dossier wins.

### Phase 2 — the story

1. **Gate: ask for N.** Before choosing anything the user is asked how many events they want, and the work stops until they answer (`estado` prints the estimates). Never assume N.
2. **Select.** `pipeline.py prefiltro` ranks events by objective source strength and suggests quotas per phase; the choice itself is narrative judgement (story potential first, complete arc, variety) grouped into 3–5 acts.
3. **Research.** `agente.py` / `procesar_lote.py` run the research agent per event, at most 3 in parallel, with a spending cap. Each event produces a **dossier** in `misiones/<id>/dossiers/<event>/`: extended context, verified facts (claim + URL + literal quote checked by code), unverified facts, new sources, contradictions, gaps and visual ideas.
4. **Reconcile.** `pipeline.py conciliar` reports fragile events (more than 1/3 unverified, fewer than 5 verified facts, or no official/scientific source). The user decides what to keep, redo or replace.
5. **Write.** `pipeline.py historia` builds the traceable skeleton from the dossiers; the editorial parts (hook, emotion, scene) are written in Spanish, and every fact must be in the same event's verified facts.

Then the **web demo** takes over: copy in `scripts/data/<mission>-story.mjs`, illustrations, narration and the 3D route — see [story.md](story.md).

## Folder layout

```
misiones/<id>/   ficha.json · base_trabajo/ · seleccion/ · dossiers/<event>/ · lotes/ · informes/ · historia/
timelines_v0/    linea_de_tiempo_<id>.json (one base per mission) · kit_herramientas/ (guide, schemas, scripts)
agents/opportunity-research/   agente.py, pipeline.py, procesar_lote.py, costos.py, prompts/, tests/
story/           the Opportunity decision-game prototype and the story viewers (see story/README.md)
```

Nothing of one mission is ever written into another mission's folder. "Inherited" missions (Opportunity) declare in `ficha.json > rutas` where their outputs already live. `lotes/` (batch logs) is not versioned. Missions with a base today: opportunity, spirit, insight, ingenuity, beagle2, surveyor3.

## Rules that are never broken

1. **Nothing is invented.** What is told comes from verified data; what could not be confirmed is not asserted.
2. **A fact is "verified" only if its literal quote appears in the text the agent read** — checked by code, not by the model.
3. **Official and scientific sources first;** press is support and is labelled; community sources are only hints.
4. **Disputed facts are told as disputes**, never silently resolved. Contested figures are left out of the demo or rounded (see [audit.md](audit.md)).
5. **Ask N before processing**, and tell the user the estimated cost and time before spending quota.
6. **A researched event is not repeated** without `--forzar`, which keeps the previous version.
7. **No images in the research** (only scene ideas); illustrations are generated later for the demo.
8. **New versions go in new files:** earlier ones are not overwritten.
9. **Tone for 17-year-olds:** clear and friendly, without simplifying until it is false.
10. **No commits unless the user asks;** conventional commit messages, no AI attribution. Never read or print `.env`; never put AWS accounts or profiles in documents.

## Cost and time (measured on Opportunity)

Bedrock, Sonnet 4.6 researching + Opus 4.6 reviewing, list-price reference:

| Measure | Value |
|---|---|
| Cost per event | 0.3 to 0.7 USD (average ≈ 0.52) |
| Time per event, in series | ≈ 3.9 min (13 events in 50.5 min) |
| Time per event, 3 in parallel | ≈ 1.4 min (10 events in 14 min) |

Extrapolated (not measured): N = 20 ≈ 10 USD, ≈ 78 min in series / ≈ 28 min in parallel; N = 30 ≈ 16 USD, ≈ 117 / ≈ 42 min. Total Bedrock spend over the 30 Opportunity dossiers was ≈ 13.7 USD (Sonnet 7.4, Opus 6.1, Haiku 0.2). Phase 1 was never measured; if the base exists its cost is zero.

## What the pipeline taught us

- **Research before writing.** The first decision game was written from the original timeline data and had to be redone once the dossiers questioned it (e.g. the 16 Jul 2000 Goldin meeting and his quote could not be confirmed; only the official 10 Aug 2000 announcement stands).
- **A model that writes invents; a model that reviews corrects.** Sonnet's drafts invented quotes, names and figures in every review that was inspected; the Opus review removed them. Hence the review pass and the rule that the reviewer can only *select* among existing items.
- **"Verified" must mean something checkable.** Checking each quote against the text that was read turned a promise into a guarantee.
- **Save expensive work early.** One paid run was lost because a refactor removed the line that created the output folder; drafts are now written to `cache/` as soon as the research ends.
- **Parallelism needs care:** with 3 in parallel the corpus cache must be merged and replaced atomically.
- **Measure, do not estimate by feel:** early cost estimates were low (0.7 vs 1.13 USD on one event) because image searches and re-reads were not foreseen; the agent no longer searches images.
- **Tools that did not work:** Wikipedia/Wikimedia (403 without a real contact in the User-Agent), PDFs (read as empty text) and Cloudflare-protected pages. The dossier records them in its gaps.
- **Windows:** write Python scripts with the file tools, not with heredocs with escaped `\n`; always use the agent's `.venv`.

## Tests

```
cd agents/opportunity-research && .venv\Scripts\python -m unittest discover -s tests     # the agent (free)
python -m unittest discover -s story/tests                                                # the decision-game data (free)
```
