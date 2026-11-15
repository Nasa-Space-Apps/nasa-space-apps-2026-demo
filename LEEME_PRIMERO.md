# LEEME_PRIMERO — contexto base (leer una vez al empezar)

Reto: NASA Space Apps 2026, «contar la historia del hardware que la NASA dejó en el sistema solar» para estudiantes. Público de las historias: **5.º de secundaria (17 años)**. Se trabaja siempre desde esta carpeta (`nasa-space-apps-2026-demo/`).

## Qué hay aquí (dos cosas separadas)

1. **Demo web** (Next.js + three.js): `src/`, `public/`, `docs/`. Reglas en `CLAUDE.md`. No tiene relación con el pipeline de abajo.
2. **Pipeline de historias** (lo que se trabaja ahora): convierte una misión en una historia verificada de N eventos.

## Pipeline: dos fases

```
FASE 1  línea de tiempo base   timelines_v0/linea_de_tiempo_<id>.json   (kit: timelines_v0/kit_herramientas/)
FASE 2  historia de N eventos  2.1 elegir N y eventos → 2.2 investigar (agente, 3 en paralelo)
                               → 2.3 conciliar → 2.4 escribir
```

Skills (en `.claude/skills/`, se cargan solas): `mars-mission-story-pipeline` (orquestador, empieza por aquí), `mars-mission-base-research`, `mars-story-event-selection`, `mars-event-research`, `mars-dossier-reconciliation`, `mars-story-writing`.

**Para empezar o retomar una misión:** `cd agents/opportunity-research` y `.venv\Scripts\python pipeline.py estado <id>`. Dice la fase y el siguiente paso.

## Dónde va cada cosa (nunca se mezclan misiones)

```
misiones/<id>/  ficha.json · base_trabajo/ · seleccion/ · dossiers/<evento>/ · lotes/ · informes/ · historia/
timelines_v0/linea_de_tiempo_<id>.json     base de cada misión (Fase 1)
agents/opportunity-research/               código: agente.py, pipeline.py, procesar_lote.py, costos.py, prompts/, tests/
story/                                     juego de decisiones y visores de Opportunity (fuera del alcance actual)
```

Misiones con base hoy: opportunity, spirit, insight, beagle2, ingenuity y surveyor3. **Con dossiers: opportunity (30), ingenuity, surveyor3, spirit, insight y beagle2 (20 cada una)**; las cuatro primeras ya están **implementadas en la demo web** como modo Historia (`docs/story.md`: ilustraciones con Nano Banana, narración con ElevenLabs, ruta 3D). **InSight y Beagle 2** tienen sus 20 ilustraciones (`public/models/<misión>/images`) pero no historia en la demo todavía. El juego de decisiones de Opportunity sigue en `story/` (no implementado en la demo).

## Reglas de trabajo (del usuario)

- Responder en español; código e identificadores en inglés, documentación del repo en español.
- **Solo lo verificado:** los hechos salen de dossiers con cita literal comprobada. Nada inventado.
- **Antes de investigar eventos: preguntar cuántos (N) y esperar la respuesta.** Decir costo y tiempo estimados y esperar visto bueno antes de gastar cupo.
- **El JSON es lo importante**; los HTML son visores internos.
- No sobrescribir READMEs ni versiones anteriores (juego v1/v1-30 se conservan); crear archivos nuevos y solo referenciar.
- **No hacer commit** salvo que lo pida; el usuario hace sus commits. Sin atribución de IA; commits convencionales.
- Nunca leer ni imprimir `.env`; no poner cuentas/perfiles de AWS en documentos.
- Proveedor del agente: `plan` | `api` | `bedrock` (`PROVEEDOR_LLM` en `.env`). Máximo 3 eventos en paralelo.

## Gotchas conocidos

- Windows: en Python escribir código con las herramientas de archivo, no con heredocs con `\n` escapados.
- Usar siempre el `.venv` de `agents/opportunity-research/` (sin él faltan `httpx` y `claude_agent_sdk`).
- Windows a veces bloquea mover carpetas con imágenes: copiar y borrar.
- Tests: `.venv\Scripts\python -m unittest discover -s tests` (agente, 72) y `python -m unittest discover -s tests` dentro de `story/` (19).

## Estado y pendientes

- Hecho: agente verificado, pipeline por misión, 6 skills, carpetas por misión, Opportunity migrada a `misiones/opportunity/`.
- Spirit pasó el pipeline (dossiers entregados por el equipo en `feature/story-research-agent`) y se convirtió en historia de la demo (hito 45). Sigue sin probarse con datos reales `pipeline.py historia --html`.
- Alcance actual: **solo la historia**; el juego de otras misiones queda para después.

Más detalle: `story/MAPA_DEL_PROCESO.md`, `story/PIPELINE_HISTORIA.md`, `misiones/README.md`, `agents/opportunity-research/README.md`.
