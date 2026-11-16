---
name: mars-story-event-selection
description: Phase 2.1 — ask how many events (N) the story should have, wait for the answer, and choose the N events of the base timeline with the most narrative potential. Use it when `estado` says GATE, or when the user asks to choose/change the events of a mission's story.
---

# Phase 2.1 — The N gate and selection

Requirement: `timelines_v0/linea_de_tiempo_<id>.json` exists (if not, Phase 1).

## 1. Gate: ask for N (MANDATORY, then stop)

Run `PY pipeline.py estado <id>` and show the user, in a few lines: number of events in the base, split by phase, **suggested N** and the estimate table (cost ≈ 0.52 USD/event, ≈ 3.9 min/event in series, ≈ 1.4 min with 3 in parallel; measured on Opportunity with Bedrock).

Ask **one single question**: "How many events do you want in the story?". **Stop.** Do not choose, research or write until they answer. If the answer is vague ("about 20"), confirm the exact number.

## 2. Objective pre-filter (free, no model)

`PY pipeline.py prefiltro <id> --n <N>` → `misiones/<id>/seleccion/prefiltro.json` with, per event: strong sources, backing, disputed, precise date, `puntaje_objetivo`; and **suggested quotas per phase** (proportional, ≥1 per phase that has events).
The score only measures how solid the sources are; it is **not** narrative potential. Use it to break ties, not to decide.

## 3. Choose the N (narrative judgement, yours)

Read the events of the base (titles, detail, key data). Criteria, in order:

1. **Story potential** (criterion 1): a protagonist, tension or twist, something that can be seen, animated or illustrated; a 17-year-old would remember it.
2. **Complete arc:** the story needs a beginning (origin/design), a middle (cruise, landing, crisis) and an end (end of mission, legacy). Respect the pre-filter quotas unless you write down a reason.
3. **Sources:** they matter but do not decide (the research agent will find more). A disputed event may enter if the controversy is part of the story; note it.
4. **Variety:** do not repeat the same kind of event (e.g. ten science findings in a row).

Group them into **acts** (3–5, with a short title) and write a one-line `reason` per event.

## 4. Save

Create a working JSON at `misiones/<id>/seleccion/borrador.json`:

```json
{"ids": ["spi003", "..."],
 "actos": [{"n": 1, "titulo": "Born"}, {"n": 2, "titulo": "Arriving"}],
 "asignacion": {"spi003": 1},
 "razones": {"spi003": "Why it is in"}}
```

and apply it: `PY pipeline.py seleccion <id> --archivo misiones/<id>/seleccion/borrador.json` (checks that the ids exist and are not repeated; writes `seleccion.json` with coverage per phase).

Show the user the final list (id, date, title, act, reason) and the coverage per phase. **Wait for their approval** before researching: they may remove/add; repeat step 4.

## Afterwards

`estado` will show PHASE 2.2. Continue with `mars-event-research`. If the user changes N later, it is a new selection: do not delete dossiers already made (the ones that match are reused).
