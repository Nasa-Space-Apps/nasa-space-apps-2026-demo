---
name: mars-mission-base-research
description: Fase 1 — construir la línea de tiempo base de una misión (timelines_v0/linea_de_tiempo_<id>.json) con el kit de herramientas, solo si todavía no existe. Úsala cuando `pipeline.py estado <id>` diga que la base NO EXISTE, o para ampliarla/validarla. Cubre alcance, mapa de fuentes, fan-out de agentes por fases, fusión y validación.
---

# Fase 1 — Línea de tiempo base

**Primero comprueba si ya existe:** `timelines_v0/linea_de_tiempo_<id>.json`. Si existe, no la rehagas: valida (`PY pipeline.py validar-base <id>`) y pasa a la Fase 2. Hoy hay bases de: opportunity, spirit, insight, ingenuity.

Referencia completa (léela antes de empezar, es la fuente de verdad): `timelines_v0/kit_herramientas/GUIA_INVESTIGACION_MISIONES.md`.
Esquema: `kit_herramientas/esquema_linea_de_tiempo_v2.json` (schema 2.0, `additionalProperties:false`).

## Salidas (todas por misión)

- Final: `timelines_v0/linea_de_tiempo_<id>.json` (un archivo por misión).
- Trabajo intermedio (eventos crudos de cada agente, listas de huecos, informes de validación): `misiones/<id>/base_trabajo/`. **Nunca** en la carpeta de otra misión ni suelto en la raíz.

## Procedimiento

1. **Ficha de alcance** (guía §4): nombre completo, tipo, cuerpo, agencia, fechas clave, **sol cero** (se busca en fuente oficial, con offset 0 o 1), misiones relacionadas. Crea la ficha con `PY pipeline.py nueva <id> …` si falta.
2. **Mapa de fuentes** (guía §5): oficiales NASA/JPL y científicas primero; prensa y comunitaria como apoyo. Cada fuente lleva `tipo` y `verificacion` honesta (`página abierta completa` / `resumen automático` / `solo extracto de búsqueda`).
3. **Ronda 1 — fan-out por fases** (guía §8.1): un agente por grupo de fases, todos con la misma plantilla de evento crudo (`fecha_inicio, titulo, detalle, etapa, fase, categoria, fuentes[]`). Guarda cada salida en `base_trabajo/ronda1_<fase>.json`.
4. **Fusionar:** `PY ../../timelines_v0/kit_herramientas/construir_mision.py fusionar BASE.json EXTRA1.json … -o SALIDA.json --prefijo <prefijo>` (dedup 0.6, renumera ids, reconstruye `indice_fuentes`).
5. **Ronda 2 — huecos** (guía §8.2): pasa a los agentes la lista de lo que ya existe y pide solo lo que falta (cobertura §7.3: origen, desarrollo, pruebas, lanzamiento, viaje, aterrizaje, operaciones, problemas, fin, legado). Fusiona otra vez.
6. **Revisión manual tras fusionar** (guía §8.4): fechas, duplicados semánticos, eventos discutidos (`discutido:true` + `nota`).
7. **Validar (obligatorio):** `PY pipeline.py validar-base <id>` → debe dar **0 problemas**. Usa los mismos datos de sol que la ficha (`--sol-cero/--sol-offset` o `--sin-sol`).
8. Mueve el resultado final a `timelines_v0/linea_de_tiempo_<id>.json` y ejecuta `PY pipeline.py estado <id>`.

## Criterios de calidad

- Cada evento: fecha, fase, categoría, `respaldo`, al menos una fuente con URL; sin afirmaciones sin respaldo.
- Cobertura de las 7 fases; si una fase queda vacía, dilo (no la rellenes con relleno).
- Cifras y fechas en conflicto entre fuentes → evento `discutido:true` con `nota` que explica ambas versiones.
- Hardware: es otra salida (guía §9) y no es parte del alcance «historia».

## Fin de la fase

Informa: n.º de eventos, reparto por fase, % con respaldo oficial/científico, % de fuentes por nivel de verificación (lo da `estado`), problemas abiertos. Después, **no sigas a la Fase 2 sin pasar por la compuerta de N** (skill `mars-mission-story-pipeline`).
