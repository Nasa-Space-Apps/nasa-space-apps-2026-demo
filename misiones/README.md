# misiones/

One folder per mission. The outputs of one mission are never mixed with those of another. (The research content inside — dossiers, selections — is in Spanish on purpose.)

```
misiones/<id>/
  ficha.json         scope of the mission (name, type, body, prefix, sol zero, audience)
  base_trabajo/      intermediate work of Phase 1
  seleccion/         prefiltro.json and seleccion.json (the N events)
  dossiers/<event>/  dossier.json, dossier.md, metricas.json (research agent)
  lotes/             logs of batch runs (not versioned)
  informes/          conciliacion.md / conciliacion.json
  historia/          historia_<id>.json and its HTML viewer
```

The base timeline (Phase 1) lives apart: `timelines_v0/linea_de_tiempo_<id>.json`.

Opportunity is "inherited": its `ficha.json` declares `rutas` with the folders where its outputs already were.

State (Nov 2026): `opportunity` (30 dossiers), `ingenuity`, `surveyor3`, `spirit`, `insight` and `beagle2` (20 each) all have their story in the web demo ([`docs/story.md`](../docs/story.md); InSight, Beagle 2 and Surveyor 3 are stationary vehicles).

Tools: `agents/opportunity-research/pipeline.py`. Skills: `.claude/skills/mars-*`. The whole flow: [`docs/research-pipeline.md`](../docs/research-pipeline.md).
