---
name: mars-story-event-selection
description: Fase 2.1 — preguntar cuántos eventos (N) quiere la historia, esperar la respuesta, y elegir los N eventos de la línea de tiempo base con más potencial narrativo. Úsala cuando `estado` diga COMPUERTA, o el usuario pida elegir/cambiar los eventos de la historia de una misión.
---

# Fase 2.1 — Compuerta de N y selección

Requisito: existe `timelines_v0/linea_de_tiempo_<id>.json` (si no, Fase 1).

## 1. Compuerta: preguntar N (OBLIGATORIO, y parar)

Ejecuta `PY pipeline.py estado <id>` y muestra al usuario, en pocas líneas: nº de eventos de la base, reparto por fase, **N sugerido** y la tabla de estimaciones (costo ≈ 0,52 USD/evento, ≈ 3,9 min/evento en serie, ≈ 1,4 min con 3 en paralelo; son medidas de Opportunity con Bedrock).

Haz **una sola pregunta**: «¿Cuántos eventos quieres en la historia?». **Detente.** No elijas, no investigues, no escribas hasta que responda. Si responde algo ambiguo («unos 20»), confirma el número exacto.

## 2. Prefiltro objetivo (gratis, sin modelo)

`PY pipeline.py prefiltro <id> --n <N>` → `misiones/<id>/seleccion/prefiltro.json` con, por evento: fuentes fuertes, respaldo, discutido, fecha precisa, `puntaje_objetivo`; y **cuotas sugeridas por fase** (proporcionales, ≥1 por fase con eventos).
El puntaje solo mide solidez de fuentes; **no** es el potencial narrativo. Úsalo para desempatar, no para decidir.

## 3. Elegir los N (juicio narrativo, tuyo)

Lee los eventos de la base (títulos, detalle, datos_clave). Criterios, en orden:

1. **Potencial de historia** (criterio 1): hay protagonista, tensión o giro, algo que se pueda ver, animar o ilustrar; un estudiante de 17 años lo recordaría.
2. **Arco completo:** que la historia tenga principio (origen/diseño), nudo (viaje, aterrizaje, crisis) y desenlace (fin, legado). Respeta las cuotas del prefiltro salvo razón escrita.
3. **Fuentes:** importan pero no deciden (el agente investigador buscará más). Un evento discutido puede entrar si la controversia es parte de la historia; anótalo.
4. **Variedad:** no repetir el mismo tipo de evento (p. ej. diez hallazgos de ciencia seguidos).

Agrúpalos en **actos** (3–5, con título corto) y escribe una `razón` de una línea por evento.

## 4. Guardar

Crea un JSON de trabajo en `misiones/<id>/seleccion/borrador.json`:

```json
{"ids": ["spi003", "..."],
 "actos": [{"n": 1, "titulo": "Nacer"}, {"n": 2, "titulo": "Llegar"}],
 "asignacion": {"spi003": 1},
 "razones": {"spi003": "Por qué entra"}}
```

y aplícalo: `PY pipeline.py seleccion <id> --archivo misiones/<id>/seleccion/borrador.json` (valida que los ids existan y no se repitan; escribe `seleccion.json` con cobertura por fase).

Muestra al usuario la lista final (id, fecha, título, acto, razón) y la cobertura por fase. **Espera su visto bueno** antes de investigar: puede quitar/añadir; repite el paso 4.

## Después

`estado` mostrará FASE 2.2. Sigue con `mars-event-research`. Si el usuario cambia N más tarde, es una selección nueva: no borres dossiers ya hechos (se reutilizan los que coincidan).
