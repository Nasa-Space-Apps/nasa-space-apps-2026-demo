# misiones/

Una carpeta por misión. Las salidas de una misión nunca se mezclan con las de otra.

```
misiones/<id>/
  ficha.json        alcance de la misión (nombre, tipo, cuerpo, prefijo, sol cero, público)
  base_trabajo/     trabajo intermedio de la Fase 1
  seleccion/        prefiltro.json y seleccion.json (los N eventos)
  dossiers/<evento>/ dossier.json, dossier.md, metricas.json (agente investigador)
  lotes/            registros de corridas en lote (no se versionan)
  informes/         conciliacion.md / conciliacion.json
  historia/         historia_<id>.json y su visor HTML
```

La línea de tiempo base (Fase 1) vive aparte: `timelines_v0/linea_de_tiempo_<id>.json`.

Opportunity es «heredada»: su `ficha.json` declara `rutas` con las carpetas donde ya estaban sus salidas.

Herramientas: `agents/opportunity-research/pipeline.py` (ver su cabecera). Skills: `.claude/skills/mars-*`.
