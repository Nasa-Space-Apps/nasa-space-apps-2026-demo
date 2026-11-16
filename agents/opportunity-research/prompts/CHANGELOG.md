# Prompt changelog

Rule: every behaviour change in a prompt bumps `version` in its header and is noted here with the reason and the observed result.
The version used is stored in `salida/<id>/metricas.json` (key `prompts`), so runs can be compared across versions.

## investigador.md

- **v4** — Speed and cost. Measured on 40 events (Ingenuity and Surveyor 3): 7.2 pages read per event and only 3.7 URLs ended up backing facts (~45 % of the reads unused); time grows with the reads (correlation 0.67). Changes: budget cut from ~15 to ~8 calls and 3 pages (5 if the event is `discutido`, so sources can be compared); asks for independent reads in the same turn; `leer_pagina` takes `palabras` and on long pages returns only the start and the relevant passages (code in `herramientas.recortar`; quotes are still verified against the full text of the corpus). Previous reference: v3 ≈ 0.27 USD and 126 s per event for the research. Rule 9: if the event carries `fuentes_semilla_de_la_mision` (the `fuentes_semilla` list in `ficha.json`, e.g. the general MER page for Spirit), they are read first for broad-context events. A frozen copy of v3 lives in `investigador_v3.md`; choose it with `PROMPT_INVESTIGADOR=investigador_v3`.
- **v3** — Mission-neutral: the mission name and the audience enter as the variables `{mision}` and `{publico}` (taken from `ficha.json` or from the `mision` block of the base timeline). No other rule change: it can be compared with v2.
- **v2** — Images removed: no more image rules or tools (`buscar_imagenes_nasa` and `archivos_nasa` were deleted) and `ideas_visuales` only describes scenes. Reason: on `opp015` the agent spent 11 image searches without finding the launch photo and raised the cost; images will be solved another way.
- **v1** — Initial version, extracted unchanged from `agente.py`. Rules: quote literally, official sources first, images only from NASA tools, note contradictions and gaps, at most ~15 calls.
  - Reference runs: `opp001` (0.52–0.64 USD ref., 10–12 facts), `opp005` (0.49 USD, 13 facts), `opp018` (0.69 USD, 25 facts).

## revisor.md

- **No prompt change (code): medium effort.** `revision.ESFUERZO_REVISOR` = `medium` by default (`REVISOR_EFFORT=default` removes it). Reason: ~7,400 of the reviewer's ~9,500 output tokens were thinking and the review itself is short; the reviewer was 51 % of the cost and 47 % of the time per event (0.28 USD and 113 s on average). Test on the draft of `spi001` (one sample per level): default 116 s/0.28 USD (10→9 facts, 3 new contradictions); `low` 27 s/0.09 (10→10, let a weakly-quoted fact through, 1 contradiction); `medium` 52 s/0.14 (10→8, 1 contradiction); `high` 108 s/0.23 (10→9, 3 contradictions). Pending: confirm that `medium` does not lose contradictions on more events. First attempt failed: `max_thinking_tokens=2000` (obsolete) had no effect on Opus 4.6; on 3 events the thinking went from 10,508/7,781/8,807 to 9,766/5,098/8,167 tokens.
- **v4** — Mission-neutral (`{mision}`, `{publico}`), no other rule change.
- **v3** — The mention of images in `ideas_visuales` is removed (the dossier no longer has them).
- **v2** — The reviewer no longer rewrites the whole dossier: it returns only decisions (indices of facts to keep, new story text, added contradictions and gaps). v1 asked to regenerate all the facts with their quotes and a real test took more than 5 minutes with Opus 4.6; v2 generates far fewer tokens and cannot alter quotes or URLs.
- **v1 (replaced)** — Editorial reviewer for Bedrock (Opus). No tools: it can only keep or drop facts of the draft, rewrite the story and add contradictions and gaps (including discrepancies with the original event). The code (`revision.fusionar`) prevents new facts, URLs, quotes or images.

## usuario.md

- **v1** — First message with the event as JSON (`{evento_json}`).

## Pending ideas (not applied yet)

- Ask for official sources first and press only afterwards.
- Limit page reads and turns to lower the cost.
- Add an instruction about PDFs once the tool exists.
