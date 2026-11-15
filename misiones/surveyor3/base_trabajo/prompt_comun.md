Eres un investigador de historia espacial. Tarea: encontrar eventos de la misión SURVEYOR 3 (NASA/JPL, Luna) para el rol indicado abajo y escribirlos como JSON.

CONTEXTO
Se construye una base de datos para una plataforma educativa 3D (público: estudiantes de 17 años). Cada evento debe poder comprobarse en una fuente. Alcance de la misión: desde el origen del programa Surveyor hasta la visita de Apollo 12 (nov 1969) y el análisis de las piezas recuperadas. Surveyor 3: lanzado el 17 abr 1967, alunizó el 20 abr 1967 en Oceanus Procellarum, último contacto 4 may 1967 (estos datos vienen de https://science.nasa.gov/mission/surveyor-3/; compruébalos tú).
Fuente oficial base obligatoria de consulta: https://science.nasa.gov/mission/surveyor-3/ y https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A (verifica el id). Luego: NTRS (ntrs.nasa.gov, p. ej. "Surveyor III Mission Report"), JPL, Apollo Lunar Surface Journal (history.nasa.gov/alsj), informes de Apollo 12.

REGLAS (obligatorias)
1. Cada evento lleva >=1 fuente con URL real que tú abriste o viste en el buscador. No inventes URL.
2. No completes datos de memoria (fechas, cifras, nombres). Si no hay fuente, no escribas el evento; anótalo en tu respuesta como hueco.
3. Redacta en español, con tus palabras; cita solo una frase de menos de 15 palabras por fuente.
4. verificacion de cada fuente: "página abierta completa" solo si leíste el texto íntegro (p. ej. descargaste y leíste todo); "página abierta (resumen automático de la herramienta)" si abriste la URL con una herramienta que resume; "solo extracto de búsqueda" si solo viste el fragmento. Sé honesto.
5. tipo de fuente: "oficial NASA/JPL", "científica", "prensa", "comunitaria", "libro/medio" o "video/audio".
6. Si dos fuentes discrepan: discutido=true y explica en nota.
7. Prefiere fuentes oficiales (jpl.nasa.gov, science.nasa.gov, nasa.gov, history.nasa.gov, ntrs.nasa.gov, nssdc) y artículos científicos. Wikipedia solo como pista (tipo "comunitaria").
8. Búsquedas con consultas cortas (1-6 palabras), una por tema; abre los documentos originales. Si una web no abre con tus herramientas, prueba Python (urllib con User-Agent de navegador, PYTHONUTF8=1) desde Bash; no uses espejos dudosos.
9. En la Luna: sol = null siempre. Usa sol_texto para tiempo de misión (GET) si la fuente lo da.
10. Meta: 8 a 12 eventos nuevos, concretos y con cifras (fechas exactas, masas, distancias, nombres), más variedad de categorías (problema/solucion/ciencia/hito, no solo operacion).

FORMATO DE SALIDA
Escribe un archivo JSON con una LISTA de objetos (sin id ni orden) con estos campos:
{ "fecha_inicio":"AAAA[-MM[-DD]]", "fecha_fin":null, "precision_fecha":"día|mes|año|rango|aproximada|década",
  "sol":null, "sol_texto":null, "titulo":"...", "detalle":"2-5 oraciones", "datos_clave":["..."],
  "etapa":"capítulo de la misión", "fase":"<enum>", "categoria":"<enum>", "discutido":false, "nota":null,
  "fuentes":[{"titulo":"...","editor":"...","url":"https://...","tipo":"...","verificacion":"..."}] }
Enums: fase = origen | planificacion_y_desarrollo | lanzamiento_y_viaje | aterrizaje | operaciones | fin_de_mision | legado.
categoria = origen | planificacion | desarrollo | pruebas | lanzamiento | viaje | aterrizaje | despliegue | operacion | ciencia | problema | solucion | hito | fin_de_mision | legado.
Un problema se empareja con su solucion (otro evento) cuando la hubo.

RESPUESTA FINAL
Responde solo con: número de eventos, número de URL abiertas y cuántas no se pudieron abrir, discrepancias encontradas y huecos (máx. 150 palabras). No pegues el JSON en la respuesta.
Cierra tu respuesta final con un bloque "## Key Learnings" de 1 a 5 ítems numerados, cada uno una oración factual autónoma de al menos 20 caracteres y 4 palabras (omite el bloque si no hay aprendizajes reutilizables).

## Allowed edit surfaces
Solo escribe el archivo de salida indicado en tu rol. No edites ningún otro archivo ni la carpeta de otra misión.
