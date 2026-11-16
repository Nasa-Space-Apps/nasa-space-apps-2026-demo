---
name: mars-mission-story-pipeline
description: Orchestrator of the full flow "space mission → verified story of N events for students". Use it when starting or resuming ANY mission (Spirit, InSight, Ingenuity, another one), when asked to "make the story of mission X", "continue mission X" or "where is mission X at?". It decides which phase the mission is in and delegates to the mars-* skills.
---

# Orchestrator: mission → story of N events

Two phases. Each mission has its own folder `misiones/<id>/`; **nothing of one mission is written outside it** (nor into another mission's folder).

```
PHASE 1  base timeline            timelines_v0/linea_de_tiempo_<id>.json     skill mars-mission-base-research
PHASE 2  story of N events
   2.1   choose N and the events                                             skill mars-story-event-selection
   2.2   research every event (agent, 3 in parallel)                         skill mars-event-research
   2.3   reconcile the dossiers                                              skill mars-dossier-reconciliation
   2.4   write the story                                                     skill mars-story-writing
```

Current scope: **the story only**. The decision game (`story/build_juego2.py`) stays out unless the user asks for it.

## Procedure

Every command is run from `agents/opportunity-research/` with its virtual environment (`.venv\Scripts\python` on Windows, `.venv/bin/python` on macOS/Linux). Abbreviated `PY` below.

1. **Identify the mission.** Ask for (or infer from the message) the lowercase `id` (`spirit`, `insight`…). If `misiones/<id>/ficha.json` does not exist, create it:
   `PY pipeline.py nueva <id> --nombre "…" --tipo rover --cuerpo Marte --prefijo spi --sol-cero YYYY-MM-DD --sol-offset 0|1` (or `--sin-sol`).
   For Mars, the sol-zero date is **looked up in sources**, never assumed.
2. **Check the state:** `PY pipeline.py estado <id>`. It prints the phase, the numbers and **NEXT STEP**. That step rules: go to the skill it names.
3. **After each skill**, run `estado` again and follow what it says. Never skip phases.
4. When done, summarise for the user: what was produced, where (paths), measured cost (`PY costos.py --mision <id>`), what is still fragile or pending.

## Rules that are not negotiable

- **The N gate.** Before 2.1 you must **ask how many events** the user wants and **stop and wait for the answer**. Never assume N, never go on with a "default". The question carries estimates (`estado` prints them).
- **Only what is verified.** The story uses facts from the dossiers (`datos_reales` with a literal quote checked by code). Anything unverified does not enter as a fact; if mentioned, it is flagged.
- **Spending needs permission.** Researching events spends quota or money. Before launching a batch, say how many events, the estimated cost and time, and wait for the go-ahead. Use `--tope-usd`.
- **Never overwrite.** Not dossiers (the agent refuses without `--forzar`), not READMEs, not the story (explicit `--forzar` only). Files of another mission are left alone.
- **No commits** unless the user asks. Conventional commit messages, no AI attribution.
- **Secrets.** Never read or print `.env`; never put AWS accounts or profiles in repo documents.
- **Language.** Talk to the user in their language; the story data is written in Spanish (audience: 17-year-old secondary-school students) unless the mission sheet says otherwise.

## Folder layout (summary)

`misiones/<id>/{ficha.json, base_trabajo/, seleccion/, dossiers/<event>/, lotes/, informes/, historia/}`. Details in `misiones/README.md`.
"Inherited" missions (Opportunity) declare in `ficha.json > rutas` where their outputs live; `pipeline.py` and the agent respect that on their own.

## If something does not add up

- `estado` says the base "DOES NOT EXIST" → Phase 1 (do not invent events).
- A command returns code 3 → a prerequisite is missing; the message says which.
- Code 2 → what you are trying to create already exists (overwrite protection); decide with the user whether to redo it.
