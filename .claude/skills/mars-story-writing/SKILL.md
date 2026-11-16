---
name: mars-story-writing
description: Phase 2.4 — write the story of the mission (N events in acts) from the verified dossiers: creates historia_<id>.json with the traceable skeleton, writes the hook/emotion/scene of each event, validates it and builds the HTML viewer. Use it when `estado` says PHASE 2.4 or to review/redo the texts.
---

# Phase 2.4 — Write the story

Requirements: selection with acts, all the dossiers, reconciliation done (skill `mars-dossier-reconciliation`).

## 1. Automatic skeleton (nothing invented)

`PY pipeline.py historia <id> --crear` → `misiones/<id>/historia/historia_<id>.json`. It copies **from the dossiers**: title, `hechos.detalle` (extended context), `datos_clave`, `datos_verificados` (with quote and URL), contradictions, gaps, visual ideas, sources and `solidez_fuentes` (strong/weak). It leaves the editorial fields as `null`: `narrativa.gancho`, `narrativa.emocion`, `narrativa.elementos`. If the file already exists it refuses; `--forzar` only with permission (the written text would be lost).

## 2. Write the editorial parts (your job)

For every event write, in Spanish, for **secondary-school students (17 years old)** (or the audience in the mission sheet):

- `gancho`: 1–2 sentences that open the event with an image or a question, not with a date.
- `escena_visual`: what would be seen (may start from `ideas_visuales`); concrete, drawable or animatable.
- `emocion`: the dominant emotion in one word or a short phrase (wonder, tension, relief…).
- `elementos`: a short list of characters/objects/places that appear.

Writing rules:
- **Every fact (date, figure, name, cause) must be in the same event's `datos_verificados`.** If you need a datum that is not there, do not write it: leave the gap or ask for new research.
- Hook/emotion are writing, not facts: no new figures in them.
- Controversies: give both versions ("according to… / according to…"), without picking a side.
- No unsupported superlatives ("the biggest", "the first") unless a verified quote says so.
- Clear, friendly tone, no unexplained jargon; one idea per sentence.
- Transitions between acts: the `titulo` of each act must tell the arc (not "Part 2").

Write the texts in `misiones/<id>/historia/textos.json`:

```json
{"spi003": {"gancho": "…", "escena_visual": "…", "emocion": "…", "elementos": ["…"]}}
```

Apply them: `PY pipeline.py historia <id> --textos misiones/<id>/historia/textos.json` (rejects unknown ids).

## 3. Validate and publish

- `PY pipeline.py historia <id> --validar` → must report **0 problems** (every event with hook, emotion, scene, verified data and sources). Exit code 1 otherwise.
- `PY pipeline.py historia <id> --html` → internal viewer `historia_<id>.html` (uses `story/templates/historia.template.html`). The HTML is only for review; **the deliverable is the JSON**.
- Check 2–3 events by eye by opening the HTML and comparing a datum with its quote.

## 4. Wrap-up

Summarise for the user: number of events and acts, events with a weak source or disputed (listed by the JSON's `resumen`), total cost (`PY costos.py --mision <id>`), file paths. Do not commit. If they ask for the decision game, that is another job (`story/build_juego2.py`, outside this flow).

> To turn a finished story into the web demo (comic + 3D + audio), see `docs/story.md`.
