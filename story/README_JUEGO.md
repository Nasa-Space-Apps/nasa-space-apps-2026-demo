# Opportunity: juego de decisiones · Guía de traspaso

> Para quien reciba este material, sea una persona o un agente: qué es, qué hay, cómo se hizo, cómo reproducirlo y cómo seguir.
> Estado: noviembre de 2026 · rama `feature/story-research-agent` (gitflow: se integra en `dev`).
> Todo está en español, igual que la documentación del repo. La interfaz del juego final debería ir en inglés (ver «Cómo continuar»).

## Índice

1. [El proyecto en una página](#1-el-proyecto-en-una-página)
2. [Mapa del material](#2-mapa-del-material)
3. [Cómo se hizo (paso a paso)](#3-cómo-se-hizo-paso-a-paso)
4. [El juego v2 en detalle](#4-el-juego-v2-en-detalle)
5. [Los dossiers verificados](#5-los-dossiers-verificados)
6. [Cómo reproducirlo](#6-cómo-reproducirlo)
7. [Costos](#7-costos)
8. [Cómo continuar](#8-cómo-continuar)
9. [Limitaciones y riesgos](#9-limitaciones-y-riesgos)
10. [Glosario](#10-glosario)
11. [Si quieres hacer X, mira Y](#11-si-quieres-hacer-x-mira-y)

---

## 1. El proyecto en una página

**Contexto.** El reto de NASA Space Apps 2026 pide contar la historia del hardware que la NASA dejó en el Sistema Solar (rovers,
módulos, instrumentos) a estudiantes de escuela, con narrativa y precisión. Elegimos el rover **Opportunity** (MER-B, Marte, 2004-2018)
y un público de **5.º de secundaria** (17 años, último año).

**Qué construimos.**

- Una **historia** de 20 eventos en 5 actos (`story/data/historia_opportunity.json`).
- Un **juego de decisiones** de 30 nodos (v2): 12 de historia, 6 de decisión y 12 ficticios. En cada decisión, la opción correcta sigue
  la historia real; la equivocada abre 2 nodos ficticios, narrados como si hubieran ocurrido, y termina en un final alternativo que
  explica lo que pasó de verdad (`story/data/juego2_opportunity.json`).
- Un **agente investigador** (Claude) que amplía cada evento con búsqueda web gratuita y produce un **dossier** con datos, cada uno con
  URL y cita literal comprobada por código (`agents/opportunity-research/`).
- Herramientas internas para verlo todo: un **mapa en forma de grafo** y un prototipo jugable.

**La regla de oro:** *no se inventa nada.* Todo lo real sale de los dossiers verificados. Los nodos ficticios son lo único inventado, y
llevan la marca de «línea alternativa», sin fuentes, citas ni cifras.

**Lo importante para quien continúe:** `story/data/juego2_opportunity.json` es la **fuente única**. Otro agente lo usa para generar el
juego final, las cartillas y las ilustraciones. Su guía propia está en [`data/README_juego2.md`](data/README_juego2.md).

**Cifras.** 81 eventos en la línea de tiempo → 20 en la historia → **30 dossiers** (los 20 + 10 más que pide el juego) → 30 nodos
(18 reales + 12 ficticios). Los dossiers suman **386 datos verificados** y 67 sin verificar. Hay **63 pruebas automáticas** (44 del agente
y 19 del juego), todas gratis y sin red.

---

## 2. Mapa del material

Estado: **vigente** = úsalo; **histórico** = se conserva como referencia, no lo uses; **herramienta** = apoyo interno.

### `story/` (historia y juego)

| Archivo | Qué es | Estado |
|---|---|---|
| `data/linea_de_tiempo_opportunity.json` | Los 81 eventos de la misión con fuentes (esquema 2.0). Es la fuente de todo. | vigente |
| `data/historia_opportunity.json` (`.js`) | La historia: 20 eventos en 5 actos, con gancho, escena visual y solidez de fuentes. | vigente (con correcciones pendientes, ver §8) |
| `data/juego2_opportunity.json` (`.js`) | **El juego v2: 30 nodos, 35 conexiones.** Fuente única para otros agentes. | **vigente** |
| `data/README_juego2.md` | Guía corta del JSON del juego v2 para otros agentes. | vigente |
| `data/juego_opportunity.json` (`.js`) | Primer juego de 30 nodos, escrito **antes** de tener los dossiers. Contiene afirmaciones que luego se descartaron. | histórico |
| `build_historia.py` | Genera la historia (JSON y HTML) a partir de la línea de tiempo. | vigente |
| `build_juego2.py` | **Genera el juego v2** (JSON, `.js`, prototipo y mapa) a partir de los dossiers. Contiene el texto de los 30 nodos. | **vigente** |
| `build_juego.py` | Genera el primer juego de 30 nodos. | histórico |
| `templates/*.template.html` | Plantillas de las páginas. Se pueden abrir solas: cargan `../data/*.js`. | herramienta |
| `tests/test_juego2.py` | 19 pruebas del juego v2. | vigente |

### `public/story/` (páginas ya generadas; se sirven con `npm run dev`)

| Archivo | Qué es |
|---|---|
| `juego2_mapa.html` | **Mapa del grafo** del juego v2 y detalle de cada nodo. Herramienta interna. |
| `juego2.html` | Prototipo jugable del juego v2. **No es el juego final.** |
| `historia.html` | Visor de la historia de 20 eventos por acto, con el gancho, la escena visual, los hechos originales y las fuentes de cada uno. |
| `juego.html` | Prototipo del primer juego de 30 nodos (histórico). |

### `agents/opportunity-research/` (el agente investigador)

| Archivo o carpeta | Qué es |
|---|---|
| `agente.py` | Entrada: investiga un evento y escribe su dossier. |
| `herramientas.py` | Herramientas del agente: búsqueda web, leer páginas, informes técnicos de NASA (NTRS). Todas gratis. |
| `proveedores.py` | Elige el modelo: plan de Claude, API de Anthropic o Amazon Bedrock. |
| `revision.py` | Segunda pasada con un modelo más potente (Opus) que depura el borrador. Solo con Bedrock. |
| `procesar_lote.py` | Procesa muchos eventos, en serie o en paralelo, con límites de seguridad. |
| `costos.py` | Costo por evento, por modelo y total. |
| `prompts/` | Los prompts como archivos versionados, con `CHANGELOG.md`. |
| `salida/<id>/` | **Los 30 dossiers**: `dossier.json`, `dossier.md`, `metricas.json`. |
| `tests/` | 44 pruebas del agente. |
| `README.md` | Instalación y uso del agente. |

### Fuera del repo

`D:\nasa_hackathon\historia_decisiones_opportunity.json` y `historia_decisiones.html`: la **primera versión del juego, de 20 nodos**
(8 de historia, 4 decisiones, 4 escenas, 4 fallos). Es histórica y no está en el repo; sus ids no son compatibles con la v2.

---

## 3. Cómo se hizo (paso a paso)

```
linea_de_tiempo_opportunity.json (81 eventos)
        │  selección editorial (criterio: potencial narrativo; fuentes, secundario)
        ▼
historia_opportunity.json (20 eventos, 5 actos)
        │                              ┌── agente investigador (Claude, búsqueda gratis) ──┐
        ├──────────────────────────────▶ 1 dossier por evento: datos + cita literal + URL │
        │   + 10 eventos más que pide el juego └─ citas comprobadas por código · revisión con Opus
        ▼                                                         │
30 dossiers verificados  ◀────────────────────────────────────────┘
        │  build_juego2.py (texto de los nodos + referencias a datos verificados)
        ▼
juego2_opportunity.json (30 nodos, 35 conexiones, respaldo resuelto)
        ├──▶ juego2_mapa.html (para entenderlo)   ├──▶ juego2.html (prototipo)   └──▶ otro agente: juego final, cartillas, ilustraciones
```

**Paso 1 · La línea de tiempo.** 81 eventos de Opportunity (1987-2026) con fuentes, fases y marcas de «discutido». Se revisó con un visor
(`visor.html`, fuera del repo) con casillas «entra / no entra / dudoso» y notas por evento.

**Paso 2 · La historia (20 eventos).** Se eligieron para contar la misión de principio a fin, con potencial para imágenes y animaciones.
Criterio principal: potencial narrativo. Criterio secundario: fuentes confiables. Se agruparon en 5 actos: la idea, el viaje, el agua,
los años extra y la tormenta con el adiós. Los 20 ids están en `historia_opportunity.json`.

**Paso 3 · El agente investigador.** Recibe un evento y devuelve un dossier. Decisiones de diseño:

- **Herramientas gratis:** búsqueda web (DuckDuckGo), lectura de páginas (`httpx` + `trafilatura`, y Crawl4AI para páginas con
  JavaScript), informes técnicos de NASA (NTRS). Wikipedia/Wikimedia no se integró porque devuelve 403 sin un contacto en el User-Agent.
- **Cada dato lleva URL y una cita literal**, y el programa comprueba que la cita aparezca de verdad en el texto que el agente leyó. Si
  no aparece, el dato pasa a «no verificado» y no entra al relato.
- **Revisión con Opus (solo Bedrock):** una segunda pasada, sin herramientas ni internet, que puede quitar datos mal respaldados,
  reescribir el relato y añadir contradicciones y huecos frente al evento original. No puede inventar datos, URLs ni citas: el código
  solo le permite elegir entre lo que ya existe.
- **Se quitó la búsqueda de imágenes** (v2 del prompt): gastaba muchas llamadas sin resultado y encarecía cada corrida.
- **Proveedores:** plan de Claude (consume cupo), API de Anthropic, o Amazon Bedrock (se factura en AWS). Si Bedrock falla antes de
  empezar, el agente reintenta con el plan.
- En las revisiones que se inspeccionaron (`opp015`, `opp021`, `opp025`) **el borrador de Sonnet 4.6 había inventado detalles** (una cita
  de una persona, nombres, cifras) y la revisión de Opus los eliminó. Por eso la revisión no es opcional.

**Paso 4 · Lo que aprendimos de los dossiers.** El agente cuestionó el texto original de varios eventos. Esto **no se ha corregido aún** en
`linea_de_tiempo` ni en `historia` (ver §8):

| Evento | Qué dice el dossier |
|---|---|
| `opp001` | 1987 es el inicio de **cuatro propuestas** (1987-1997), no el año de la aprobación. «Botas geológicas» y «húmedo y cálido o frío y seco» no se confirmaron. |
| `opp005` | Tamaño de la mancha de hematita: 300 × 500 km (descubridores) o 350 × 750 km (NTRS). Aterrizaje 24 o 25 de enero según la zona horaria. |
| `opp008` | La reunión del 16 de julio de 2000 y la frase de Goldin **no se confirmaron**. Lo verificado: anuncio del 27 de julio y oficial del 10 de agosto. |
| `opp015` | El corcho «se despegó» más que «se agrietó». La «válvula defectuosa» no se confirmó. «El Delta II Heavy debutaba» lo contradice NASA. |
| `opp025` | Las «blueberries» se anunciaron desde el cráter Eagle; la imagen icónica de Fram es del sol 84 (19 de abril de 2004). |
| `opp033` | La dirección de la rueda delantera derecha se atascó en el sol 433 y operó con restricciones (no «deshabilitada»). «Giros en K» y «purgatoides» no aparecen en ninguna fuente. |
| `opp047` | «La evidencia más poderosa» era una paráfrasis; la cita real de Squyres es «definitiva». «Matijevic Hill» y «Turkey Haven» no se confirmaron. |
| `opp070` | La fecha de detección varía (30 de mayo o 1 de junio). Es el dossier con más datos sin verificar. |
| `opp077` | «Más de 1.000 comandos» (Callas) frente a 835 (Planetary Society). |

**Paso 5 · El juego, en tres versiones.**

1. *V1 de 20 nodos* (fuera del repo): 4 decisiones, hecha con los datos originales de la línea de tiempo.
2. *V1 de 30 nodos* (`juego_opportunity.json`): se amplió a 30 y se mejoró, pero **antes** de tener los dossiers.
3. **V2 de 30 nodos** (`juego2_opportunity.json`): se rehízo usando **solo lo verificado**, con las reglas del equipo:
   - Nodos de historia y nodos de decisión; empieza con 2 de historia y nunca hay dos decisiones seguidas.
   - Cada decisión da el contexto necesario para decidir: situación, lo que sabía el equipo en ese momento, lo que está en juego.
   - Dos alternativas por decisión (idealmente; con más, cada opción equivocada costaría 2 nodos y no cabría en 30).
   - Por cada opción equivocada, **2 nodos ficticios** narrados como si hubieran ocurrido, sin fuentes, y un final alternativo que muestra
     lo que pasó en realidad antes de volver a decidir.

**Paso 6 · Visores, JSON enriquecido y pruebas.** Se creó el mapa del grafo, se enriqueció el JSON para otros agentes (aristas, roles,
respaldo resuelto) y se escribieron las pruebas.

---

## 4. El juego v2 en detalle

### Reglas de diseño

1. Los 18 nodos reales **solo afirman lo que está en `respaldo_detalle`** (datos verificados con su cita y URL).
2. Los 12 ficticios **no tienen fuentes, citas, comillas «», porcentajes ni cifras** (solo años). Lo comprueban las pruebas.
3. Cada rama equivocada son **exactamente 2 nodos**: la consecuencia (`escena_alternativa`) y el final alternativo (`fallo`), que lleva
   `leccion` («lo que pasó en realidad») y vuelve a la decisión (`volver_a`).
4. Cada decisión tiene **2 opciones y una sola correcta**; cada opción trae `detalle` con su ventaja y su costo, redactado para que
   ninguna sea obviamente absurda.
5. Los nodos ficticios se muestran con una etiqueta discreta de **«Línea alternativa»**. Es una recomendación del equipo (el reto pide
   exactitud y un estudiante podría tomarlos por historia verdadera). En el prototipo se quita con `MOSTRAR_ETIQUETA=false`.

### Los 30 nodos

| Id | Rol | Título | Eventos base |
|---|---|---|---|
| `n01` | historia real | Cuatro propuestas | `opp001` |
| `n02` | historia real | Dos fracasos en un año | `opp004`, `opp009` |
| `n03` | decision | ¿Uno o dos rovers? | `opp004`, `opp008`, `opp009` |
| `n03a` | ficticio consecuencia | Todo depende de una nave | — |
| `n03b` | ficticio final alternativo | Sin segunda oportunidad | — |
| `n04` | historia real | Un destino con pistas | `opp005`, `opp010` |
| `n05` | decision | Elegir el lugar de aterrizaje | `opp010`, `opp012` |
| `n05a` | ficticio consecuencia | Un paisaje de postal | — |
| `n05b` | ficticio final alternativo | Los airbags no resisten | — |
| `n06` | historia real | Spirit abre el camino | `opp012`, `opp015` |
| `n07` | decision | Una batería en el último momento | `opp015` |
| `n07a` | ficticio consecuencia | Cuenta regresiva | — |
| `n07b` | ficticio final alternativo | Una falla en el ascenso | — |
| `n08` | historia real | Seis minutos de caída | `opp018` |
| `n09` | historia real | Rocas empapadas en agua | `opp021` |
| `n10` | historia real | Una roca caída del cielo | `opp030` |
| `n11` | decision | Atrapado en la arena | `opp012`, `opp033` |
| `n11a` | ficticio consecuencia | A toda potencia | — |
| `n11b` | ficticio final alternativo | Enterrado en la duna | — |
| `n12` | historia real | El brazo atascado | `opp039` |
| `n13` | decision | Rumbo a un cráter lejano | `opp040`, `opp041` |
| `n13a` | ficticio consecuencia | Un lugar ya conocido | — |
| `n13b` | ficticio final alternativo | Una misión sin su mayor hallazgo | — |
| `n14` | historia real | La vena de yeso | `opp047` |
| `n15` | historia real | La tormenta | `opp070`, `opp075` |
| `n16` | historia real | La última panorámica | `opp071`, `opp072` |
| `n17` | decision | El silencio después de la tormenta | `opp075`, `opp076` |
| `n17a` | ficticio consecuencia | Se cierra la campaña activa | — |
| `n17b` | ficticio final alternativo | Una pregunta sin respuesta | — |
| `n18` | historia real | Farewell, Opportunity | `opp077` |

### Las 6 decisiones

| Id | Título | Fecha | Opción real (correcta) | Opción equivocada (abre 2 ficticios) |
|---|---|---|---|---|
| `n03` | ¿Uno o dos rovers? | Julio de 2000 | Construir dos rovers iguales, para dos lugares distintos. | Construir un solo rover. |
| `n05` | Elegir el lugar de aterrizaje | 11 de abril de 2003 | Una llanura casi sin rocas, con una señal de hematita que ningún otro lugar de Marte igualaba. | Una región de cañones y laderas, con paisajes espectaculares. |
| `n07` | Una batería en el último momento | 6 de julio de 2003 | Retrasar el lanzamiento un día y corregir la falla. | Despegar hoy, para no acumular más retrasos. |
| `n11` | Atrapado en la arena | 26 de abril de 2005 | Reproducir la duna en la Tierra, probar maniobras y solo entonces mover el rover. | Seguir conduciendo con fuerza hasta salir de la arena. |
| `n13` | Rumbo a un cráter lejano | 28 de agosto de 2008 | Emprender el viaje a Endeavour. | Quedarse explorando los alrededores de Victoria. |
| `n17` | El silencio después de la tormenta | 29 de octubre de 2018 | Seguir intentando el contacto por tiempo indefinido y reevaluar en enero. | Dar por terminada la campaña de comandos activos. |

### Cómo se lee el grafo

El camino real son los 18 nodos con `orden_camino_real` 1 a 18. En el mapa, cada capítulo es una franja: arriba la historia real y debajo
las ramas ficticias. Las 35 conexiones (`aristas`) son de 4 tipos: `continuar` (17), `opcion_correcta` (6), `opcion_equivocada` (6) y
`volver_a_decidir` (6).

### Trazabilidad

Cada nodo real tiene `respaldo` con referencias como `opp009#3`: el **dato 3** de `datos_reales` del dossier del evento `opp009`.
`respaldo_detalle` trae esas mismas referencias ya resueltas: afirmación verificada, cita literal y URL. Las pruebas comprueban que cada
referencia exista, y que no reaparezca ninguna afirmación descartada («botas geológicas», la frase de Goldin, «válvula», «giros en K»,
«purgatoides», «debutaba», etc.).

---

## 5. Los dossiers verificados

Un dossier (`agents/opportunity-research/salida/<id>/dossier.json`) tiene: `contexto_ampliado` (relato en español), `datos_reales`
(afirmación + URL + cita literal + confianza), `datos_no_verificados` (cita no encontrada en el texto; **no usarlos**), `fuentes_nuevas`
(clasificadas: oficial NASA/JPL, científica, prensa, comunitaria), `contradicciones`, `huecos` e `ideas_visuales`. `metricas.json` guarda
tokens, tiempo, costo de referencia y versiones de prompt. Además hay `dossier.md`, la versión legible.

Los **30 dossiers**: 386 datos verificados y 67 sin verificar. «Oficial» = fuentes oficiales NASA/JPL sobre el total de fuentes nuevas.

| Evento | Título | Verificados | Sin verificar | Contradicciones | Oficial | Corrida | Usado en |
|---|---|---|---|---|---|---|---|
| `opp001` | Steve Squyres concibe un rover científico para Marte | 10 | 0 | 0 | 1/3 | plan | historia, juego v2 |
| `opp004` | Se pierden el Mars Climate Orbiter y el Mars Polar Lander | 6 | 10 | 2 | 1/4 | Bedrock | juego v2 |
| `opp005` | El TES de Mars Global Surveyor detecta hematita gris en Me | 13 | 0 | 2 | 3/5 | plan | historia, juego v2 |
| `opp008` | Reunión en la que Goldin pregunta '¿y si son dos rovers?' | 10 | 0 | 2 | 1/4 | plan | historia, juego v2 |
| `opp009` | La NASA anuncia dos rovers para 2003 | 15 | 2 | 5 | 2/5 | Bedrock | juego v2 |
| `opp010` | THEMIS (Mars Odyssey) muestra que Meridiani es llano y seg | 10 | 5 | 1 | 2/4 | Bedrock | juego v2 |
| `opp012` | La NASA elige Meridiani Planum y el cráter Gusev como dest | 15 | 0 | 1 | 2/5 | Bedrock | juego v2 |
| `opp015` | Lanzamiento de Opportunity (23:18 EDT; 03:18 GMT del 8 jul | 13 | 4 | 4 | 4/6 | Bedrock | historia, juego v2 |
| `opp018` | Opportunity aterriza en el cráter Eagle (21:05 PST; 25 ene | 25 | 0 | 2 | 3/5 | plan (sin métricas) | historia, juego v2 |
| `opp021` | La NASA anuncia que las rocas de Meridiani estuvieron empa | 17 | 0 | 0 | 3/6 | Bedrock | historia, juego v2 |
| `opp025` | Hallazgo de las «blueberries» (esférulas de hematita) cerc | 14 | 0 | 4 | 3/4 | Bedrock | historia |
| `opp028` | «Burns Cliff»: panorama de la pared interior de Endurance  | 10 | 6 | 2 | 4/5 | Bedrock | historia |
| `opp030` | 'Heat Shield Rock', primer meteorito hallado en otro plane | 9 | 7 | 1 | 1/4 | Bedrock | historia, juego v2 |
| `opp033` | Atrapado en Purgatory Dune (soles 446-484) | 15 | 0 | 3 | 2/5 | Bedrock | historia, juego v2 |
| `opp039` | El brazo vuelve a bloquearse y se decide no recogerlo más | 11 | 0 | 2 | 1/4 | Bedrock | juego v2 |
| `opp040` | Sale del cráter Victoria | 8 | 7 | 5 | 4/5 | Bedrock | juego v2 |
| `opp041` | La NASA anuncia el viaje hacia el cráter Endeavour | 18 | 0 | 5 | 1/6 | Bedrock | juego v2 |
| `opp045` | La NASA da por terminada la misión de Spirit | 12 | 2 | 6 | 2/4 | Bedrock | historia |
| `opp047` | Hallazgo de la vena de yeso 'Homestake' | 13 | 0 | 2 | 3/5 | Bedrock | historia, juego v2 |
| `opp052` | Opportunity supera el récord de distancia del rover lunar  | 14 | 1 | 6 | 3/5 | Bedrock | historia |
| `opp054` | La «rosquilla de mermelada»: Pinnacle Island | 12 | 1 | 3 | 2/3 | Bedrock | historia |
| `opp059` | Problemas de memoria flash ('amnesia') | 13 | 3 | 2 | 3/6 | Bedrock | historia |
| `opp062` | Completa una distancia de maratón; explora Marathon Valley | 12 | 0 | 3 | 4/5 | Bedrock | historia |
| `opp070` | El MRO detecta la tormenta de polvo que se acerca | 6 | 14 | 4 | 2/4 | Bedrock | historia, juego v2 |
| `opp071` | Último rasgo analizado: el afloramiento tabular (3 de juni | 14 | 1 | 2 | 5/5 | Bedrock | juego v2 |
| `opp072` | Última comunicación (sol 5111) | 15 | 1 | 3 | 3/6 | Bedrock | historia, juego v2 |
| `opp075` | Empiezan los comandos diarios: la escucha activa de 45 día | 13 | 0 | 1 | 2/6 | Bedrock | juego v2 |
| `opp076` | La NASA prolonga los intentos de contacto | 14 | 1 | 1 | 0/5 | Bedrock | juego v2 |
| `opp077` | Últimos comandos y declaración de misión completa (12-13 f | 13 | 1 | 3 | 1/4 | Bedrock | historia, juego v2 |
| `opp081` | Perseverance supera el récord de distancia de Opportunity | 16 | 1 | 4 | 2/4 | Bedrock | historia |

**Cómo leerlos con criterio.** Un dossier con muchos «sin verificar» (`opp070`, `opp004`, `opp040`, `opp030`) es más frágil. Las
`contradicciones` suelen señalar errores en el evento original. Los `huecos` dicen qué no se pudo confirmar. Algunos datos se apoyan en
prensa y no en NASA (Cornell Daily Sun, Spaceflight Now, Astronomy.com): el modo creador del prototipo y `respaldo_detalle` muestran la URL.

---

## 6. Cómo reproducirlo

### Requisitos

Python 3.12 · Node 22 (solo para la app del repo) · para el agente: Claude Code con sesión iniciada, o una API key de Anthropic, o
credenciales de AWS con acceso a modelos de Anthropic en Bedrock.

### Regenerar el juego v2 (sin gastar nada)

```
python story/build_juego2.py                       # regenera JSON, .js, prototipo y mapa desde los dossiers
python -m unittest discover -s story/tests         # 19 pruebas
```

El texto de los 30 nodos vive en `story/build_juego2.py`. Si cambias un nodo, el build comprueba que cada referencia `opp###` exista en
su dossier, y las pruebas fallan si rompes una regla.

### Abrir los visores

| Cómo | Dirección |
|---|---|
| App del repo (`npm run dev`) | `/story/juego2_mapa.html` y `/story/juego2.html` |
| Live Server (raíz = la carpeta que contiene `nasa-space-apps-2026-demo`) | `http://127.0.0.1:5500/nasa-space-apps-2026-demo/public/story/juego2_mapa.html` |
| Doble clic | abrir `public/story/juego2_mapa.html` directamente: funciona sin servidor |

**Error frecuente:** `.../story/templates/juego2.html` da **404**. En `story/templates/` solo hay plantillas, con nombre
`juego2.template.html` y `juego2_mapa.template.html`. Las páginas listas están en `public/story/`.

### Usar el agente investigador

```
cd agents/opportunity-research
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m playwright install chromium
.venv\Scripts\python probar_herramientas.py --sin-claude     # comprueba las herramientas
.venv\Scripts\python agente.py ..\..\story\data\historia_opportunity.json --evento opp018
.venv\Scripts\python procesar_lote.py --ids opp028,opp030 --paralelo 3   # varios a la vez (se recomienda 3)
.venv\Scripts\python costos.py                               # costo por evento, por modelo y total
.venv\Scripts\python -m unittest discover -s tests           # 44 pruebas
```

- **Proveedor:** `.env` (copia `.env.example`; git lo ignora). `PROVEEDOR_LLM=plan|api|bedrock`. Con Bedrock se usan Sonnet 4.6 (investiga),
  Opus 4.6 (revisa) y Haiku 4.5 (tareas internas). Los modelos 5.5 existen en la cuenta probada pero pidieron un método de pago válido.
- Un evento ya procesado **no se vuelve a ejecutar** salvo con `--forzar` (que guarda la versión anterior).
- Para eventos de la línea de tiempo que no están en la historia: `--archivo ..\..\story\data\linea_de_tiempo_opportunity.json`.
- Detalle completo: [`agents/opportunity-research/README.md`](../agents/opportunity-research/README.md).

---

## 7. Costos

Costo de referencia = precio de lista calculado por el SDK; con Bedrock es lo que AWS debería facturar, con el plan es solo referencia.

| Modelo | USD por millón de tokens (entrada / salida) | Gasto acumulado |
|---|---|---|
| Sonnet 4.6 (investiga) | 3 / 15 | 7,41 USD en 26 eventos |
| Opus 4.6 (revisa) | 5 / 25 | 6,06 USD en 25 eventos |
| Haiku 4.5 (tareas internas) | 1 / 5 | 0,17 USD |
| **Total Bedrock** | | **13,65 USD** |
| Plan de Claude (3 eventos) | solo referencia | 1,65 USD |

- Un evento cuesta **de 0,3 a 0,7 USD** (promedio ≈ 0,52) con investigación y revisión; la revisión de Opus es casi la mitad.
- Los precios se dedujeron de los costos que reporta el SDK; no se confirmaron en la página de precios de AWS.
- Es un **mínimo**: no incluye el evento `opp018` (se procesó antes de existir las métricas), un intento fallido de `opp025` ni las
  pruebas sueltas. El gasto real se ve en Cost Explorer, con hasta 24 horas de retraso.

---

## 8. Cómo continuar

Pendientes, en un orden razonable:

1. **Commit y PR** de todo lo pendiente a `dev` (rama `feature/story-research-agent`).
2. **Corregir la historia y la línea de tiempo** con los hallazgos de §3 (los 9 eventos de la tabla).
3. **Leer los 12 nodos ficticios**: son redacción narrativa del equipo, la única parte inventada. Conviene una revisión humana.
4. **Cartillas.** Cada nodo real ya trae `dato_desbloqueado` y `respaldo_detalle` para armarlas.
5. **Ilustraciones y animaciones.** Cada nodo trae `narrativa.escena_visual` y `narrativa.emocion`. El agente ya no busca imágenes, así
   que las fotos de NASA hay que buscarlas aparte (la biblioteca de imágenes de NASA es gratuita y no pide clave; revisar crédito y
   licencia: normalmente «NASA/JPL-Caltech», pero algunas son de terceros).
6. **Integrar el juego en la app Next.js del repo.** Respetar su `CLAUDE.md`: diseño «Primer», todo el texto del juego **en inglés**,
   textos del storytelling en `src/lib/checkpoints.ts`. El JSON está en español: hay que traducirlo.
7. **Decidir la etiqueta «Línea alternativa»**: se recomienda dejarla.
8. **Si se amplía el juego**, procesar más eventos de la línea de tiempo (quedan 51 sin dossier).
9. **Modelos 5.5 de Bedrock:** repetir la prueba cuando la cuenta tenga un método de pago válido.
10. **Mejoras del agente:** no releer páginas largas tantas veces, leer PDFs (hoy devuelven vacío) y limitar el razonamiento de Opus.

---

## 9. Limitaciones y riesgos

- **Nada se verifica contra la web de nuevo.** «Verificado» significa que la cita aparece en el texto que el agente leyó, no que la fuente
  sea infalible. Hay datos que se apoyan en prensa y hay fuentes que discrepan entre sí (están en `contradicciones`).
- **El agente no lee PDFs** ni páginas bloqueadas (por ejemplo ScienceDirect), y Wikipedia/Wikimedia da 403. Cada dossier lo anota en `huecos`.
- **La salida varía entre corridas** (un mismo evento puede dar 10 o 12 datos y costar ±25 %).
- **`opp070`, `opp004` y `opp040`** tienen muchos datos sin verificar: revisar antes de reforzar un nodo con ellos.
- **Los 12 nodos ficticios** son texto inventado, aunque verosímil y sin cifras ni citas. Siempre se muestran como línea alternativa.
- **Los costos son un mínimo** (ver §7).
- **`juego_opportunity.json` y `juego.html`** contienen afirmaciones que luego se descartaron: no los uses como base.
- **Seguridad:** `.env` y las claves no se versionan ni se imprimen. Para Bedrock conviene un usuario con permisos mínimos
  (`bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream`, `bedrock:ListInferenceProfiles`).

---

## 10. Glosario

| Término | Significado |
|---|---|
| **MER** | Mars Exploration Rover: la misión de los rovers gemelos Spirit (MER-A) y Opportunity (MER-B). |
| **Sol** | Día marciano (24 h 39 min). Opportunity estaba planeado para 90 soles y duró unos 5.100. |
| **JPL** | Laboratorio de Propulsión a Chorro de la NASA, que construyó y operó los rovers. |
| **EDL** | Entrada, descenso y aterrizaje. |
| **Hematita, jarosita, yeso** | Minerales que se forman con agua: las pistas que Opportunity buscaba. |
| **Tau** | Opacidad del aire por el polvo; 10,8 fue la de la tormenta de 2018. |
| **NTRS** | Servidor de informes técnicos de la NASA. |
| **Dossier** | Resultado de investigar un evento: datos verificados con cita y URL, contradicciones y huecos. |
| **Dato verificado** | Dato cuya cita literal aparece en el texto que leyó el agente. |
| **Nodo ficticio** | Nodo inventado de una rama equivocada: sin fuentes, citas ni cifras. |
| **Final alternativo** | Nodo ficticio de nivel 2: el desenlace de una rama equivocada y «lo que pasó en realidad». |
| **Cartilla** | Ficha con un dato curioso verificado por nodo (`dato_desbloqueado`). |

---

## 11. Si quieres hacer X, mira Y

| Quiero… | Mira… |
|---|---|
| Entender el juego de un vistazo | `public/story/juego2_mapa.html` |
| Usar el JSON desde otro agente | `story/data/README_juego2.md` y `story/data/juego2_opportunity.json` |
| Cambiar el texto de un nodo | `story/build_juego2.py` y luego `python story/build_juego2.py` |
| Saber de dónde sale un dato | `respaldo_detalle` del nodo, o `agents/opportunity-research/salida/<evento>/dossier.json` |
| Investigar un evento nuevo | `agents/opportunity-research/README.md` |
| Cambiar cómo investiga el agente | `agents/opportunity-research/prompts/` (con `CHANGELOG.md`) |
| Saber cuánto se gastó | `python costos.py` en `agents/opportunity-research/` |
| Comprobar que nada se rompió | `python -m unittest discover -s story/tests` y `-s tests` en la carpeta del agente |
