---
name: mars-story-writing
description: Fase 2.4 — escribir la historia de la misión (N eventos en actos) a partir de los dossiers verificados: crea historia_<id>.json con el esqueleto trazable, redacta gancho/emoción/escena de cada evento, valida y genera el visor HTML. Úsala cuando `estado` diga FASE 2.4 o para revisar/rehacer los textos.
---

# Fase 2.4 — Escribir la historia

Requisitos: selección con actos, todos los dossiers, conciliación hecha (skill `mars-dossier-reconciliation`).

## 1. Esqueleto automático (sin inventar nada)

`PY pipeline.py historia <id> --crear` → `misiones/<id>/historia/historia_<id>.json`. Copia **de los dossiers**: título, `hechos.detalle` (contexto ampliado), `datos_clave`, `datos_verificados` (con cita y URL), contradicciones, huecos, ideas visuales, fuentes y `solidez_fuentes` (fuerte/débil). Deja en `null` lo editorial: `narrativa.gancho`, `narrativa.emocion`, `narrativa.elementos`. Si ya existe se niega; `--forzar` solo con permiso (pierde la redacción).

## 2. Redactar lo editorial (tu trabajo)

Para cada evento escribe, en español, para **estudiantes de 5.º de secundaria (17 años)** (o el público de la ficha):

- `gancho`: 1–2 frases que abran el evento con una imagen o pregunta, no con una fecha.
- `escena_visual`: qué se vería (puede partir de `ideas_visuales`); concreto, dibujable o animable.
- `emocion`: la emoción dominante en una palabra o frase corta (asombro, tensión, alivio…).
- `elementos`: lista corta de personajes/objetos/lugares que aparecen.

Reglas de redacción:
- **Todo hecho (fecha, cifra, nombre, causa) debe estar en `datos_verificados` del mismo evento.** Si necesitas un dato que no está, no lo escribas: deja el hueco o pide reinvestigar.
- Los gancho/emoción son redacción, no hechos: nada de cifras nuevas en ellos.
- Controversias: di las dos versiones («según… / según…»), sin elegir bando.
- Sin superlativos sin respaldo («el mayor», «el primero») salvo que una cita verificada lo diga.
- Tono claro y cercano, sin jerga sin explicar; una idea por frase.
- Transiciones entre actos: el `titulo` de cada acto debe contar el arco (no «Parte 2»).

Escribe los textos en `misiones/<id>/historia/textos.json`:

```json
{"spi003": {"gancho": "…", "escena_visual": "…", "emocion": "…", "elementos": ["…"]}}
```

Aplícalos: `PY pipeline.py historia <id> --textos misiones/<id>/historia/textos.json` (rechaza ids desconocidos).

## 3. Validar y publicar

- `PY pipeline.py historia <id> --validar` → debe dar **0 problemas** (todo evento con gancho, emoción, escena, datos verificados y fuentes). Código de salida 1 si no.
- `PY pipeline.py historia <id> --html` → visor interno `historia_<id>.html` (usa `story/templates/historia.template.html`). El HTML es solo para revisar; **el entregable es el JSON**.
- Comprueba a ojo 2–3 eventos abriendo el HTML y cotejando un dato con su cita.

## 4. Cierre

Resume al usuario: nº de eventos y actos, eventos con fuente débil o discutidos (los lista `resumen` del JSON), costo total (`PY costos.py --mision <id>`), rutas de los archivos. No hagas commit. Si pide el juego de decisiones, es otro trabajo (`story/build_juego2.py`, fuera de este flujo).
