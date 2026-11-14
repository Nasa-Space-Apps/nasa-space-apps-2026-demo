# Historial de prompts

Regla: cada cambio de comportamiento en un prompt sube `version` en su cabecera y se anota aquí con la razón y el resultado observado.
La versión usada queda en `salida/<id>/metricas.json` (clave `prompts`), así se pueden comparar corridas entre versiones.

## investigador.md

- **v1** — Versión inicial, extraída sin cambios de `agente.py`. Reglas: citar literal, fuentes oficiales primero, imágenes solo de herramientas NASA, anotar contradicciones y huecos, máximo ~15 llamadas.
  - Corridas de referencia: `opp001` (0,52–0,64 USD ref., 10–12 datos), `opp005` (0,49 USD, 13 datos), `opp018` (0,69 USD, 25 datos).

## usuario.md

- **v1** — Mensaje inicial con el evento en JSON (`{evento_json}`).

## Ideas pendientes (aún no aplicadas)

- Pedir primero fuentes oficiales y solo después prensa.
- Limitar lecturas de página y turnos para bajar costo.
- Añadir una instrucción sobre PDFs cuando exista la herramienta.
