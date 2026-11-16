---
name: mars-event-research
description: Phase 2.2 — research the chosen events in depth with the research agent (verified dossiers), 3 in parallel, with a spending cap. Use it when `estado` says there are pending dossiers, or to research/redo one specific event of a mission.
---

# Phase 2.2 — Event research (agent)

Requirements: `misiones/<id>/seleccion/seleccion.json` and the base. Everything is launched from `agents/opportunity-research/` (`PY` = its `.venv`).

## What the agent produces (per event)

`misiones/<id>/dossiers/<event>/{dossier.json, dossier.md, metricas.json}`:
`contexto_ampliado`, `datos_reales` (claim + URL + **literal quote checked by code against the text that was read**), `datos_no_verificados`, `fuentes_nuevas` (typed), `contradicciones`, `huecos`, `ideas_visuales`. A reviewer (Opus) may correct decisions but cannot invent data.
The prompts are versioned files with `{mision}` and `{publico}` placeholders (`prompts/investigador.md`, `prompts/revisor.md`, `prompts/CHANGELOG.md`): mission-neutral, usable for any mission. If you improve them, bump the version and note it in the CHANGELOG.

## Before spending

1. Check the provider: `PROVEEDOR_LLM` = `plan` (Claude quota), `api` or `bedrock` (AWS account configured in `.env`). **Never read or print `.env`.** Ask which one to use if it is unclear.
2. Free test of one piece if in doubt: `PY probar_herramientas.py --sin-claude`.
3. Work it out with `estado` and tell the user: "X pending events ≈ Y USD, ≈ Z min with 3 in parallel; cap Y·1.3". **Wait for the go-ahead.**

## Launch

One event: `PY agente.py --mision <id> --evento <event_id>` (exits with code 2 if it already exists; `--forzar` redoes it, only if the user asks).

Batch (recommended), only the ones in the selection:

```
PY procesar_lote.py --mision <id> --ids a,b,c,... --paralelo 3 --tope-usd <cap>
```

- **At most 3 in parallel** (Bedrock and search limits). Each event runs in its own process; the ones already done are skipped.
- It stops as a precaution after 3 failures in a row or on reaching the cap. It is resumable: relaunch it and it carries on with the missing ones.
- Log: `misiones/<id>/lotes/lote_<date>.log` (not versioned). Typical duration: 10 events ≈ 14 min in parallel.
- It is long: launch it in the background and read the log, do not wait blocked.

## During and after

- Failures: read the last lines of the event's log; retry only the failed ones with `--ids`. An event that keeps failing = note it, do not insist more than twice.
- Costs: `PY costos.py --mision <id>` (per event and per model; list price).
- Check that every dossier has `datos_reales` with quote and source; `PY pipeline.py estado <id>` must show 0 pending.

## Do not

Do not write dossiers by hand, do not edit a dossier to "improve" it (if something is wrong, research it again with `--forzar` and the user knows), do not mix events of another mission into this folder.
