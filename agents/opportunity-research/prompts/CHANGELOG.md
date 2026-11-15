# Historial de prompts

Regla: cada cambio de comportamiento en un prompt sube `version` en su cabecera y se anota aquí con la razón y el resultado observado.
La versión usada queda en `salida/<id>/metricas.json` (clave `prompts`), así se pueden comparar corridas entre versiones.

## investigador.md

- **v2** — Se quitan las imágenes: ya no hay reglas ni herramientas de imágenes (`buscar_imagenes_nasa` y `archivos_nasa` se eliminaron) y `ideas_visuales` solo describe escenas. Motivo: en `opp015` el agente gastó 11 búsquedas de imágenes sin hallar la foto del despegue y subió el costo; las imágenes se resolverán por otra vía.
- **v1** — Versión inicial, extraída sin cambios de `agente.py`. Reglas: citar literal, fuentes oficiales primero, imágenes solo de herramientas NASA, anotar contradicciones y huecos, máximo ~15 llamadas.
  - Corridas de referencia: `opp001` (0,52–0,64 USD ref., 10–12 datos), `opp005` (0,49 USD, 13 datos), `opp018` (0,69 USD, 25 datos).

## revisor.md

- **v3** — Se quita la mención de imágenes en `ideas_visuales` (el dossier ya no las tiene).
- **v2** — El revisor ya no reescribe el dossier completo: devuelve solo decisiones (índices de datos a conservar, relato nuevo, contradicciones y huecos añadidos). La v1 pedía regenerar todos los datos con sus citas y una prueba real tardó más de 5 minutos con Opus 4.6; la v2 genera muchos menos tokens y no puede alterar citas ni URLs.
- **v1 (reemplazada)** — Revisor editorial para Bedrock (Opus). Sin herramientas: solo puede conservar o quitar datos del borrador, reescribir el relato y sumar contradicciones y huecos (incluidas las discrepancias con el evento original). El código (`revision.fusionar`) impide datos, URLs, citas o imágenes nuevos.

## usuario.md

- **v1** — Mensaje inicial con el evento en JSON (`{evento_json}`).

## Ideas pendientes (aún no aplicadas)

- Pedir primero fuentes oficiales y solo después prensa.
- Limitar lecturas de página y turnos para bajar costo.
- Añadir una instrucción sobre PDFs cuando exista la herramienta.
