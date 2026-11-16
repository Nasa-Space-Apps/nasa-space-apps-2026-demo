---
name: mars-mission-base-research
description: Phase 1 — build the base timeline of a mission (timelines_v0/linea_de_tiempo_<id>.json) with the toolkit, only if it does not exist yet. Use it when `pipeline.py estado <id>` says the base DOES NOT EXIST, or to extend/validate it. Covers scope, source map, fan-out of agents by phase, merging and validation.
---

# Phase 1 — Base timeline

**First check whether it already exists:** `timelines_v0/linea_de_tiempo_<id>.json`. If it does, do not redo it: validate (`PY pipeline.py validar-base <id>`) and go to Phase 2. Bases exist today for: opportunity, spirit, insight, ingenuity, beagle2, surveyor3.

Full reference (read it before starting; it is the source of truth): `timelines_v0/kit_herramientas/GUIDE.md`.
Schema: `kit_herramientas/esquema_linea_de_tiempo_v2.json` (schema 2.0, `additionalProperties: false`).

## Outputs (all per mission)

- Final: `timelines_v0/linea_de_tiempo_<id>.json` (one file per mission).
- Intermediate work (raw events of each agent, gap lists, validation reports): `misiones/<id>/base_trabajo/`. **Never** in another mission's folder or loose in the root.

## Procedure

1. **Scope sheet** (guide §4): full name, type, body, agency, key dates, **sol zero** (looked up in an official source, with offset 0 or 1), related missions. Create the sheet with `PY pipeline.py nueva <id> …` if missing.
2. **Source map** (guide §5): official NASA/JPL and scientific sources first; press and community as support. Each source carries a `tipo` and an honest `verificacion` (`full page opened` / `automatic summary` / `search snippet only`).
3. **Round 1 — fan-out by phases** (guide §8.1): one agent per group of phases, all with the same raw-event template (`fecha_inicio, titulo, detalle, etapa, fase, categoria, fuentes[]`). Save each output as `base_trabajo/ronda1_<phase>.json`.
4. **Merge:** `PY ../../timelines_v0/kit_herramientas/construir_mision.py fusionar BASE.json EXTRA1.json … -o OUTPUT.json --prefijo <prefix>` (dedup 0.6, renumbers ids, rebuilds `indice_fuentes`).
5. **Round 2 — gaps** (guide §8.2): give the agents the list of what already exists and ask only for what is missing (coverage §7.3: origin, development, tests, launch, cruise, landing, operations, problems, end, legacy). Merge again.
6. **Manual review after merging** (guide §8.4): dates, semantic duplicates, disputed events (`discutido: true` + `nota`).
7. **Validate (mandatory):** `PY pipeline.py validar-base <id>` → must report **0 problems**. Use the same sol data as the sheet (`--sol-cero/--sol-offset` or `--sin-sol`).
8. Move the final result to `timelines_v0/linea_de_tiempo_<id>.json` and run `PY pipeline.py estado <id>`.

## Quality criteria

- Every event: date, phase, category, `respaldo`, at least one source with a URL; no unsupported claims.
- Coverage of the 7 phases; if a phase stays empty, say so (do not pad it).
- Figures and dates that conflict between sources → event `discutido: true` with a `nota` explaining both versions.
- Hardware is a different output (guide §9) and is not part of the "story" scope.

## End of the phase

Report: number of events, split by phase, % with official/scientific backing, % of sources by verification level (given by `estado`), open problems. Then **do not go on to Phase 2 without passing the N gate** (skill `mars-mission-story-pipeline`).
