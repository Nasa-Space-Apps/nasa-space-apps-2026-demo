---
name: mars-event-research
description: Fase 2.2 — investigar en profundidad los eventos elegidos con el agente investigador (dossiers verificados), 3 en paralelo, con tope de gasto. Úsala cuando `estado` diga que hay dossiers pendientes, o para investigar/rehacer un evento concreto de una misión.
---

# Fase 2.2 — Investigación de eventos (agente)

Requisitos: `misiones/<id>/seleccion/seleccion.json` y la base. Todo se lanza desde `agents/opportunity-research/` (`PY` = su `.venv`).

## Qué produce el agente (por evento)

`misiones/<id>/dossiers/<evento>/{dossier.json, dossier.md, metricas.json}`:
`contexto_ampliado`, `datos_reales` (afirmación + URL + **cita literal comprobada por código contra el texto leído**), `datos_no_verificados`, `fuentes_nuevas` (tipadas), `contradicciones`, `huecos`, `ideas_visuales`. Un revisor (Opus) puede corregir decisiones, pero no inventar datos.
Los prompts son archivos versionados con `{mision}` y `{publico}` (`prompts/investigador.md`, `prompts/revisor.md`, `prompts/CHANGELOG.md`): neutros, sirven para cualquier misión. Si los mejoras, sube versión y anota en el CHANGELOG.

## Antes de gastar

1. Comprueba el proveedor: `PROVEEDOR_LLM` = `plan` (cupo de Claude), `api` o `bedrock` (cuenta AWS configurada en `.env`). **Nunca leas ni imprimas `.env`.** Pregunta cuál usar si no está claro.
2. Prueba gratis de una pieza si hay dudas: `PY probar_herramientas.py --sin-claude`.
3. Calcula con `estado` y dile al usuario: «X eventos pendientes ≈ Y USD, ≈ Z min con 3 en paralelo; tope Y·1,3». **Espera el visto bueno.**

## Lanzar

Un evento: `PY agente.py --mision <id> --evento <id_evento>` (sale con código 2 si ya existe; `--forzar` lo rehace, solo si el usuario lo pide).

Lote (recomendado), solo los de la selección:

```
PY procesar_lote.py --mision <id> --ids a,b,c,... --paralelo 3 --tope-usd <tope>
```

- **3 en paralelo como máximo** (límites de Bedrock y de búsqueda). Cada evento corre en su proceso; los ya procesados se saltan.
- Para como prudencia tras 3 fallos seguidos o al llegar al tope. Es reanudable: relánzalo y sigue con los que faltan.
- Registro: `misiones/<id>/lotes/lote_<fecha>.log` (no se versiona). Duración típica: 10 eventos ≈ 14 min en paralelo.
- Largo: lánzalo en segundo plano y revisa el log, no esperes bloqueado.

## Durante y después

- Fallos: lee las últimas líneas del log del evento; reintenta con `--ids` solo los fallidos. Un fallo repetido de un evento = anótalo, no insistas más de 2 veces.
- Costos: `PY costos.py --mision <id>` (por evento y por modelo; precio de lista).
- Verifica que cada dossier tenga `datos_reales` con cita y fuente; `PY pipeline.py estado <id>` debe mostrar 0 pendientes.

## No hacer

No escribir dossiers a mano, no editar un dossier para «mejorarlo» (si algo está mal, se vuelve a investigar con `--forzar` y el usuario lo sabe), no mezclar eventos de otra misión en esta carpeta.
