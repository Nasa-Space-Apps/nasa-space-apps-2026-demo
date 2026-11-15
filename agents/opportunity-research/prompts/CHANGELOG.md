# Historial de prompts

Regla: cada cambio de comportamiento en un prompt sube `version` en su cabecera y se anota aquí con la razón y el resultado observado.
La versión usada queda en `salida/<id>/metricas.json` (clave `prompts`), así se pueden comparar corridas entre versiones.

## investigador.md

- **v4** — Velocidad y costo. Medido en 40 eventos (Ingenuity y Surveyor 3): 7,2 páginas leídas por evento y solo 3,7 URLs terminaban respaldando datos (~45% de lecturas sin uso); el tiempo sube con las lecturas (correlación 0,67). Cambios: presupuesto de ~15 a ~8 llamadas y 3 páginas (5 si el evento es `discutido`, para poder comparar fuentes); pide lecturas independientes en el mismo turno; `leer_pagina` recibe `palabras` y en páginas largas devuelve solo el inicio y los pasajes relevantes (código en `herramientas.recortar`, las citas se siguen verificando contra el texto completo del corpus). Referencia previa: v3 ≈ 0,27 USD y 126 s por evento en la investigación. Regla 9: si el evento trae `fuentes_semilla_de_la_mision` (lista `fuentes_semilla` en `ficha.json`, p. ej. la página general de los MER en Spirit) se leen primero en eventos de contexto amplio. Copia congelada de la v3 en `investigador_v3.md`; se elige con `PROMPT_INVESTIGADOR=investigador_v3`.
- **v3** — Neutral a la misión: el nombre de la misión y el público entran como variables `{mision}` y `{publico}` (salen de `ficha.json` o del bloque `mision` de la línea de tiempo base). Sin otro cambio de reglas: se puede comparar con la v2.
- **v2** — Se quitan las imágenes: ya no hay reglas ni herramientas de imágenes (`buscar_imagenes_nasa` y `archivos_nasa` se eliminaron) y `ideas_visuales` solo describe escenas. Motivo: en `opp015` el agente gastó 11 búsquedas de imágenes sin hallar la foto del despegue y subió el costo; las imágenes se resolverán por otra vía.
- **v1** — Versión inicial, extraída sin cambios de `agente.py`. Reglas: citar literal, fuentes oficiales primero, imágenes solo de herramientas NASA, anotar contradicciones y huecos, máximo ~15 llamadas.
  - Corridas de referencia: `opp001` (0,52–0,64 USD ref., 10–12 datos), `opp005` (0,49 USD, 13 datos), `opp018` (0,69 USD, 25 datos).

## revisor.md

- **Sin cambio de prompt (código): esfuerzo medio.** `revision.ESFUERZO_REVISOR` = `medium` por defecto (`REVISOR_EFFORT=default` lo quita). Motivo: ~7.400 de los ~9.500 tokens de salida del revisor eran pensamiento y la revisión en sí es corta; el revisor era el 51% del costo y el 47% del tiempo por evento (0,28 USD y 113 s en promedio). Prueba sobre el borrador de `spi001` (una muestra por nivel): default 116 s/0,28 USD (10→9 datos, 3 contradicciones nuevas); `low` 27 s/0,09 (10→10, dejó pasar un dato con cita débil, 1 contradicción); `medium` 52 s/0,14 (10→8, 1 contradicción); `high` 108 s/0,23 (10→9, 3 contradicciones). Pendiente: confirmar que `medium` no pierde contradicciones en más eventos. Primer intento fallido: `max_thinking_tokens=2000` (obsoleto) no tuvo efecto en Opus 4.6; en 3 eventos el pensamiento pasó de 10.508/7.781/8.807 a 9.766/5.098/8.167 tokens.
- **v4** — Neutral a la misión (`{mision}`, `{publico}`), sin otro cambio de reglas.
- **v3** — Se quita la mención de imágenes en `ideas_visuales` (el dossier ya no las tiene).
- **v2** — El revisor ya no reescribe el dossier completo: devuelve solo decisiones (índices de datos a conservar, relato nuevo, contradicciones y huecos añadidos). La v1 pedía regenerar todos los datos con sus citas y una prueba real tardó más de 5 minutos con Opus 4.6; la v2 genera muchos menos tokens y no puede alterar citas ni URLs.
- **v1 (reemplazada)** — Revisor editorial para Bedrock (Opus). Sin herramientas: solo puede conservar o quitar datos del borrador, reescribir el relato y sumar contradicciones y huecos (incluidas las discrepancias con el evento original). El código (`revision.fusionar`) impide datos, URLs, citas o imágenes nuevos.

## usuario.md

- **v1** — Mensaje inicial con el evento en JSON (`{evento_json}`).

## Ideas pendientes (aún no aplicadas)

- Pedir primero fuentes oficiales y solo después prensa.
- Limitar lecturas de página y turnos para bajar costo.
- Añadir una instrucción sobre PDFs cuando exista la herramienta.
