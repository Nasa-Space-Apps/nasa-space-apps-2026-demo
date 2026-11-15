Eres un investigador de historia espacial. Tarea: encontrar eventos de la misión BEAGLE 2 (módulo de aterrizaje en Marte de ESA/Reino Unido, transportado por la Mars Express de la ESA) para el rol indicado abajo y escribirlos como JSON.

CONTEXTO
Se construye una base de datos para una plataforma educativa 3D (público: estudiantes de 17 años). Cada evento debe poder comprobarse en una fuente. Alcance: desde el origen del proyecto hasta su localización en la superficie con HiRISE (Mars Reconnaissance Orbiter, NASA) en 2015 y lo que se aprendió después.
No es una misión de la NASA: el vínculo con el reto es el hallazgo de 2015 con HiRISE. Prioriza fuentes oficiales de ESA (esa.int, sci.esa.int, blogs.esa.int), NASA (nasa.gov, science.nasa.gov, jpl.nasa.gov), HiRISE (uahirise.org), la UK Space Agency, la Open University y la Universidad de Leicester, el informe de la comisión de investigación ESA/Reino Unido (2004) y artículos científicos (p. ej. Planetary and Space Science, Journal of the Royal Society).
Páginas oficiales que ya abren y debes consultar primero: https://sci.esa.int/web/mars-express/-/55264-beagle-2-on-mars , https://science.nasa.gov/resource/beagle-2-lander-on-mars-with-panels-deployed/ , https://www.uahirise.org/ESP_039308_1915 , https://blogs.esa.int/mex/2015/01/16/beagle-retrospective/
Tensiones ya detectadas que debes contrastar (no las des por resueltas): (a) cuándo apareció por primera vez en imágenes de HiRISE (una nota de la Universidad de Arizona habla de imágenes de 2013 y 2014; el anuncio fue en enero de 2015); (b) si el informe completo de la comisión de investigación se publicó o solo un resumen; (c) el número exacto de paneles solares desplegados que se ven en las imágenes.

REGLAS (obligatorias)
1. Cada evento lleva >=1 fuente con URL real que tú abriste o viste en el buscador. No inventes URL.
2. No completes datos de memoria (fechas, cifras, nombres). Si no hay fuente, no escribas el evento; anótalo como hueco en tu respuesta.
3. Redacta en español, con tus palabras; cita solo una frase de menos de 15 palabras por fuente.
4. El campo "verificacion" de cada fuente SOLO puede ser exactamente uno de estos tres textos, sin añadir nada más: "página abierta completa" (solo si leíste el texto íntegro); "página abierta (resumen automático de la herramienta)" (abriste la URL o leíste solo partes de un PDF); "solo extracto de búsqueda" (solo viste el fragmento del buscador). Cualquier otro texto hace que el evento se rechace.
5. El campo "tipo" de cada fuente SOLO puede ser exactamente: "oficial NASA/JPL", "científica", "prensa", "comunitaria", "libro/medio" o "video/audio". Las páginas oficiales de ESA u otras agencias usan "oficial NASA/JPL" solo si son de NASA/JPL; las de ESA van como "científica".
6. Si dos fuentes discrepan: discutido=true y explica en nota.
7. Wikipedia solo como pista (tipo "comunitaria").
8. Búsquedas con consultas cortas (1-6 palabras), una por tema; abre los documentos originales. Si una web no abre con tus herramientas, prueba Python (urllib con User-Agent de navegador, PYTHONUTF8=1) desde Bash; los PDF escaneados se pueden convertir con pdftotext si está instalado. No uses espejos dudosos.
9. En Marte sin operaciones: sol = null siempre. Usa sol_texto solo si una fuente lo da.
10. Meta: 8 a 12 eventos nuevos, concretos y con cifras (fechas exactas, masas, distancias, nombres), con variedad de categorías (problema/solucion/ciencia/hito, no solo una).

FORMATO DE SALIDA
Escribe un archivo JSON con una LISTA de objetos (sin id ni orden) con estos campos:
{ "fecha_inicio":"AAAA[-MM[-DD]]", "fecha_fin":null, "precision_fecha":"día|mes|año|rango|aproximada|década",
  "sol":null, "sol_texto":null, "titulo":"...", "detalle":"2-5 oraciones", "datos_clave":["..."],
  "etapa":"capítulo de la misión", "fase":"<enum>", "categoria":"<enum>", "discutido":false, "nota":null,
  "fuentes":[{"titulo":"...","editor":"...","url":"https://...","tipo":"...","verificacion":"..."}] }
Enums: fase = origen | planificacion_y_desarrollo | lanzamiento_y_viaje | aterrizaje | operaciones | fin_de_mision | legado.
categoria = origen | planificacion | desarrollo | pruebas | lanzamiento | viaje | aterrizaje | despliegue | operacion | ciencia | problema | solucion | hito | fin_de_mision | legado.
Usa la fase correcta: hechos de OTRAS misiones usados como antecedente van en planificacion_y_desarrollo. Un problema se empareja con su solucion (otro evento) cuando la hubo.
Antes de terminar, comprueba que tu archivo se lee con json.load y que los textos de "verificacion" y "tipo" son exactamente los permitidos.

RESPUESTA FINAL
Responde solo con: número de eventos, número de URL abiertas y cuántas no se pudieron abrir, discrepancias encontradas y huecos (máx. 150 palabras). No pegues el JSON en la respuesta.
Cierra tu respuesta final con un bloque "## Key Learnings" de 1 a 5 ítems numerados, cada uno una oración factual autónoma de al menos 20 caracteres y 4 palabras (omite el bloque si no hay aprendizajes reutilizables).

## Allowed edit surfaces
Solo escribe el archivo de salida indicado en tu rol. No edites ningún otro archivo ni la carpeta de otra misión.
