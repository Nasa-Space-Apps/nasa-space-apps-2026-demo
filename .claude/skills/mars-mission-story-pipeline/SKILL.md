---
name: mars-mission-story-pipeline
description: Orquestador del flujo completo «misión espacial → historia verificada de N eventos para estudiantes». Úsala al empezar o retomar CUALQUIER misión (Spirit, InSight, Ingenuity, otra), cuando pidan «hacer la historia de la misión X», «continuar la misión X» o «¿en qué va la misión X?». Decide en qué fase está la misión y delega en las skills mars-*.
---

# Orquestador: misión → historia de N eventos

Dos fases. Cada misión tiene su carpeta `misiones/<id>/`; **nada de una misión se escribe fuera de ella** (ni en la de otra).

```
FASE 1  línea de tiempo base      timelines_v0/linea_de_tiempo_<id>.json     skill mars-mission-base-research
FASE 2  historia de N eventos
   2.1  elegir N y los eventos                                               skill mars-story-event-selection
   2.2  investigar cada evento (agente, 3 en paralelo)                       skill mars-event-research
   2.3  conciliar los dossiers                                               skill mars-dossier-reconciliation
   2.4  escribir la historia                                                 skill mars-story-writing
```

Alcance actual: **solo la historia**. El juego de decisiones (story/build_juego2.py) queda fuera salvo que el usuario lo pida.

## Procedimiento

Todos los comandos se lanzan desde `agents/opportunity-research/` con su entorno virtual (`.venv\Scripts\python` en Windows, `.venv/bin/python` en macOS/Linux). Abrevio `PY`.

1. **Identificar la misión.** Pide (o deduce del mensaje) el `id` en minúsculas (`spirit`, `insight`…). Si no existe `misiones/<id>/ficha.json`, créala:
   `PY pipeline.py nueva <id> --nombre "…" --tipo rover --cuerpo Marte --prefijo spi --sol-cero AAAA-MM-DD --sol-offset 0|1` (o `--sin-sol`).
   Para Marte, el sol cero se **busca en fuentes**, no se asume.
2. **Ver el estado:** `PY pipeline.py estado <id>`. Imprime la fase, los números y **SIGUIENTE PASO**. Ese paso manda: ve a la skill que nombra.
3. **Después de cada skill**, vuelve a `estado` y sigue con lo que diga. No saltes fases.
4. Al terminar, resume al usuario: qué se produjo, dónde (rutas), costo medido (`PY costos.py --mision <id>`), qué quedó frágil o pendiente.

## Reglas que no se negocian

- **Compuerta de N.** Antes de 2.1 hay que **preguntar cuántos eventos quiere** el usuario y **detenerse a esperar la respuesta**. Nunca asumir N, nunca avanzar con un valor «por defecto». La pregunta lleva estimaciones (`estado` las imprime).
- **Solo lo verificado.** La historia usa hechos de los dossiers (`datos_reales` con cita literal comprobada). Lo no verificado no entra como hecho; si se menciona, se marca.
- **Gasto con permiso.** Investigar eventos gasta cupo/dinero. Antes de lanzar un lote, di cuántos eventos, el costo y el tiempo estimados, y espera el visto bueno. Usa `--tope-usd`.
- **No sobrescribir.** Ni dossiers (el agente se niega sin `--forzar`), ni README, ni la historia (`--forzar` explícito). Los archivos de otra misión no se tocan.
- **No hacer commit** salvo que el usuario lo pida. Mensajes de commit convencionales, sin atribución de IA.
- **Secretos.** Nunca leer ni imprimir `.env`; no poner cuentas ni perfiles de AWS en documentos del repo.
- **Idioma.** Hablarle al usuario en su idioma; los datos de la historia salen en español (público: 5.º de secundaria, 17 años), salvo que la ficha diga otra cosa.

## Diseño de carpetas (resumen)

`misiones/<id>/{ficha.json, base_trabajo/, seleccion/, dossiers/<evento>/, lotes/, informes/, historia/}`. Detalle en `misiones/README.md`.
Misiones «heredadas» (Opportunity) declaran en `ficha.json > rutas` dónde están sus salidas; `pipeline.py` y el agente lo respetan solos.

## Si algo no cuadra

- `estado` dice «NO EXISTE» la base → Fase 1 (no inventes eventos).
- Un comando devuelve código 3 → falta un requisito previo; el mensaje dice cuál.
- Código 2 → ya existe lo que intentas crear (protección contra sobrescritura); decide con el usuario si se rehace.
