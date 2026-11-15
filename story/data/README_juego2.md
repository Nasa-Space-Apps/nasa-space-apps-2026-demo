# `juego2_opportunity.json` — guía para otros agentes

Este JSON es la **fuente única** del juego «Opportunity: tú decides» (30 nodos) y de sus cartillas. Se genera con
`python story/build_juego2.py` a partir de los dossiers verificados de `agents/opportunity-research/salida/`. No lo edites a mano.

## Reglas de contenido (obligatorias)

1. **Los 18 nodos reales solo pueden afirmar lo que está en `respaldo_detalle`.** No añadas datos, fechas, cifras ni citas nuevas.
2. **Los 12 nodos ficticios** (`ficticio: true`) se narran como si hubieran ocurrido, pero **sin fuentes, citas ni cifras**. En la interfaz deben mostrarse como «línea alternativa».
3. Al terminar una rama ficticia (nivel 2) se muestra siempre `leccion` («lo que pasó en realidad») y se **vuelve a la decisión**.
4. Cada **decisión** debe mostrar `contexto.lo_que_sabes` y `contexto.en_juego` antes de las opciones.

## Estructura

| Clave de nivel superior | Contenido |
|---|---|
| `nodos[]` | Los 30 nodos (ver abajo). |
| `aristas[]` | Las 35 conexiones del grafo: `continuar`, `opcion_correcta`, `opcion_equivocada`, `volver_a_decidir`. |
| `capitulos[]` | Los 5 capítulos. |
| `inicio` | Id del primer nodo (`n01`). |
| `diccionario` | Qué significa cada campo. |
| `uso_para_agentes` | Las reglas de arriba. |

### Tipos de nodo (`tipo` / `rol`)

| `tipo` | `rol` | Cantidad | Qué es |
|---|---|---|---|
| `historia` | `historia_real` | 12 | Relato real verificado. |
| `decision` | `decision` | 6 | Situación, contexto, pregunta y 2 opciones (una real, una equivocada). |
| `escena_alternativa` | `ficticio_consecuencia` | 6 | Nivel 1 de la rama equivocada: la consecuencia, narrada como real. |
| `fallo` | `ficticio_final_alternativo` | 6 | Nivel 2: el desenlace; incluye `leccion` y vuelve a la decisión (`volver_a`). |

El camino real son los 18 nodos con `orden_camino_real` 1 a 18. Cada opción equivocada abre exactamente 2 nodos ficticios.

### Campos principales de un nodo

- `id`, `tipo`, `rol`, `camino` (`real` | `alternativo`), `ficticio`, `capitulo`, `titulo`, `fecha`.
- `narrativa.texto` (texto para mostrar), `narrativa.escena_visual` (para ilustrar o animar), `narrativa.emocion`.
- Decisión: `contexto`, `pregunta`, `opciones[]` (`id`, `texto`, `detalle`, `correcta`, `siguiente`), `resultado_real`.
- Ficticio nivel 2: `leccion`. Ficticios: `rama_de` y `opcion_origen` (la decisión y la opción que los originan), `nivel`.
- Cartilla: `dato_desbloqueado` (`titulo`, `texto`) en los nodos reales.
- Trazabilidad: `respaldo` (referencias `opp009#3` = dato 3 de `datos_reales` del dossier de `opp009`) y `respaldo_detalle[]` con la
  afirmación verificada, la cita literal, la URL y dónde se usa (`rol`: `narrativa`, `resultado_real` o `en_realidad`).

## Visores y pruebas

- `public/story/juego2_mapa.html`: mapa del grafo y panel de detalle (herramienta interna para el equipo).
- `public/story/juego2.html`: prototipo jugable (no es el juego final).
- `python -m unittest discover -s story/tests`: 19 pruebas (estructura, trazabilidad, ausencia de afirmaciones no confirmadas).
