---
name: mars-dossier-reconciliation
description: Fase 2.3 — conciliar los dossiers investigados con la línea de tiempo base: detectar contradicciones, huecos y eventos frágiles, y decidir con el usuario qué conservar, corregir o reemplazar antes de escribir la historia. Úsala cuando `estado` diga FASE 2.3 o antes de `mars-story-writing`.
---

# Fase 2.3 — Conciliación

Requisito: todos los dossiers de la selección existen (`estado` → 0 pendientes).

## 1. Generar el informe

`PY pipeline.py conciliar <id>` → `misiones/<id>/informes/conciliacion.md` y `.json`: por evento, datos verificados vs sin verificar, contradicciones, huecos, fuentes fuertes y marca de **frágil**.
Es frágil si: más de 1/3 de sus datos no se verificó, o tiene menos de 5 verificados, o ninguna fuente oficial/científica.

## 2. Leer y decidir (tu trabajo)

Para cada evento marcado (y cada uno con contradicciones), compara con la base (`nota`, `discutido`):

| Situación | Decisión por defecto |
|---|---|
| Dossier confirma la base y suma detalle | **conservar** |
| Dossier corrige un dato de la base (fecha, cifra) | conservar el dossier; anotar la discrepancia en el informe, **no** editar la base sin permiso |
| Dos fuentes oficiales discrepan | **conservar con aviso**: la historia dirá «según X… según Y…» |
| Evento frágil con tema fuerte para la historia | proponer una segunda pasada (`agente.py --forzar`) o buscar fuente a mano |
| Evento frágil y reemplazable | proponer **reemplazar** por otro evento de la misma fase (volver a 2.1 solo para ese) |

Marca la decisión en la tabla del `.md` (☐ → ☑) y resume al usuario: frágiles, contradicciones relevantes, propuesta. **Espera su respuesta** si hay algo que reemplazar o rehacer (gasta cupo).

## 3. Reglas

- Un dato `no_verificado` **no pasa a la historia como hecho**. Puede ir como «se cuenta que…» solo si el usuario lo acepta.
- No resuelvas contradicciones eligiendo la fuente que más te gusta: ganan oficial/científica; si empatan, se muestra la discrepancia.
- No edites los dossiers a mano. Corregir = reinvestigar.
- La base de `timelines_v0/` no se modifica aquí; las discrepancias quedan en el informe para decidir después.

## Después

Con las decisiones tomadas, sigue con `mars-story-writing`. `estado` pasa a FASE 2.4 cuando existe `informes/conciliacion.json`.
