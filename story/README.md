# Historia y juego de decisiones de Opportunity

Dos productos narrativos sobre la misión de Opportunity (MER-B), pensados para estudiantes de 5.º de secundaria. Son páginas HTML
independientes (con el JSON incrustado) que se sirven desde `public/story/` y no dependen del resto de la app.

| Producto | JSON (fuente) | HTML | URL en `npm run dev` |
|---|---|---|---|
| Historia: 20 eventos en 5 actos | `data/historia_opportunity.json` | `public/story/historia.html` | `/story/historia.html` |
| Juego «Tú decides»: 30 nodos, 6 decisiones | `data/juego_opportunity.json` | `public/story/juego.html` | `/story/juego.html` |

## Datos y regeneración

- `data/linea_de_tiempo_opportunity.json` es la fuente: los 81 eventos con fuentes. Los dos productos eligen eventos de ahí por su id (`opp001`…).
- `build_historia.py` y `build_juego.py` contienen la selección y la redacción editorial, regeneran el JSON y escriben el HTML a partir de `templates/`.

```
python story/build_historia.py
python story/build_juego.py
```

- Cada build también escribe `data/<nombre>_opportunity.js` (`window.DATOS = …`). Las plantillas de `templates/` lo cargan con una etiqueta `<script src="../data/…">`, por eso **se pueden abrir con doble clic (`file://`)** o por http y muestran los datos sin generar nada. El HTML final de `public/story/` lleva los datos incrustados y no necesita ese archivo.

## Reglas de contenido

- Los hechos y las fuentes salen de la línea de tiempo. Los campos de narración (`gancho`, `escena_visual`, textos del juego) son redacción editorial.
- En el juego, los nodos con `hipotetico: true` son escenarios imaginados que no ocurrieron y se muestran etiquetados como tales. La opción correcta de cada decisión coincide con la realidad.
- `opp001` (concepción del rover): el agente de investigación no confirmó la frase «botas geológicas sobre el terreno» ni «húmedo y cálido o frío y seco», y 1987 es el inicio de cuatro propuestas, no el año de la aprobación. Pendiente de corregir el texto de `opp001` y del nodo `n01`.

## Agente de investigación

`agents/opportunity-research/` amplía un evento con datos reales, imágenes de NASA y fuentes nuevas. Ver su README.
