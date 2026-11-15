# Mapa del proceso: de la línea de tiempo al juego de decisiones

> **Borrador para revisión.** Recopila todo lo que hicimos y encontramos para la historia de Opportunity, con el fin de convertirlo
> después en varias *skills* reutilizables para otras misiones en Marte. Al final (§12) hay una lista de cosas que necesito que apruebes
> o corrijas. Nada de aquí se vuelve skill hasta que lo revises.
>
> Periodo cubierto: 13 y 14 de noviembre de 2026. Rama: `feature/story-research-agent`.
> Complementa a [`README_JUEGO.md`](README_JUEGO.md) (guía de traspaso del juego): este documento cuenta **qué pasó y qué aprendimos**;
> aquel explica **qué hay y cómo usarlo**.

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Mapa general de fases](#2-mapa-general-de-fases)
3. [Cronología detallada](#3-cronología-detallada)
4. [Decisiones que tomaste (las reglas del proyecto)](#4-decisiones-que-tomaste-las-reglas-del-proyecto)
5. [Decisiones técnicas y por qué](#5-decisiones-técnicas-y-por-qué)
6. [Lo que encontramos](#6-lo-que-encontramos)
7. [Errores y problemas, y cómo se resolvieron](#7-errores-y-problemas-y-cómo-se-resolvieron)
8. [Métricas y costos](#8-métricas-y-costos)
9. [Inventario de artefactos](#9-inventario-de-artefactos)
10. [Qué es reutilizable y qué es específico de Opportunity](#10-qué-es-reutilizable-y-qué-es-específico-de-opportunity)
11. [Propuesta de skills](#11-propuesta-de-skills)
12. [Lo que necesito que revises y apruebes](#12-lo-que-necesito-que-revises-y-apruebes)
13. [Pendientes del proyecto](#13-pendientes-del-proyecto)

---

## 1. Resumen ejecutivo

**Objetivo.** Responder al reto de NASA Space Apps 2026 (contar la historia del hardware que la NASA dejó en el Sistema Solar a
estudiantes de escuela, con narrativa y precisión) con el rover **Opportunity**, para **5.º de secundaria**.

**Qué se logró.**

| Producto | Resultado |
|---|---|
| Material de partida | Línea de tiempo de 81 eventos y un inventario de hardware de 54 componentes, ambos con fuentes. |
| Historia | 20 eventos en 5 actos, elegidos por su potencial narrativo. |
| Agente investigador | Un agente de Claude que amplía un evento con búsqueda web gratuita y devuelve un *dossier* con datos que llevan URL y una cita literal comprobada por código. |
| Investigación | 30 dossiers: **386 datos verificados**, 67 sin verificar. |
| Juego de decisiones v2 | 30 nodos: 12 de historia, 6 de decisión y 12 ficticios (2 por cada opción equivocada), todo lo real respaldado por datos verificados. |
| Herramientas internas | Visores (línea de tiempo, hardware, historia, mapa del juego) y un lanzador de lotes con límites de seguridad. |
| Calidad | 63 pruebas automáticas gratis (44 del agente, 19 del juego). |

**Los cinco hallazgos que más pesan** (detalle en §6):

1. **El agente cuestionó nuestros propios datos.** Los dossiers encontraron frases, fechas y cifras de la línea de tiempo que ninguna fuente
   confirma (por ejemplo, la reunión del 16 de julio de 2000 y la frase de Goldin). Investigar *después* de redactar evitó publicar errores.
2. **Un modelo que redacta inventa; otro que revisa corrige.** El borrador de Sonnet 4.6 inventó citas, nombres y cifras en todas las
   revisiones que inspeccionamos, y Opus 4.6 las eliminó. Por eso la revisión es parte del método.
3. **«Verificado» tiene que significar algo comprobable por código.** Comprobar que cada cita aparece en el texto leído convirtió una
   promesa en una garantía.
4. **El diseño del juego se resuelve con aritmética.** Con un tope de 30 nodos y 2 nodos ficticios por opción equivocada, el número de
   decisiones y de opciones queda determinado (18 reales + 12 ficticios).
5. **Todo cuesta menos de lo que parece, pero hay que medirlo.** Unos 0,5 USD por evento; el mayor gasto evitable fue buscar imágenes.

---

## 2. Mapa general de fases

```
F0  Material de partida ──▶ línea de tiempo (81 eventos) + hardware (54 componentes) + esquemas
        │
F1  Visores de revisión ──▶ visor de la línea de tiempo (filtrar con teclado) · visor de hardware · hardware «validado»
        │
F2  La historia ──────────▶ 20 eventos en 5 actos  (criterio: potencial narrativo; fuentes, secundario)
        │
F3  Juego v1 ─────────────▶ 20 nodos  ─▶  30 nodos   (escritos con los datos originales, sin verificar)
        │
F4  Agente investigador ──▶ herramientas gratis · citas comprobadas · plan / API / Bedrock · revisión con Opus · lotes
        │
F5  30 dossiers ──────────▶ 20 de la historia + 10 que pide el juego  ─▶  hallazgos que corrigen los datos
        │
F6  Juego v2 ─────────────▶ solo lo verificado · decisiones claras · ramas ficticias de 2 nodos
        │
F7  Entrega ──────────────▶ JSON para otro agente · mapa del grafo · READMEs · pruebas · repo (gitflow)
```

El orden importa: la lección principal es que **F4-F5 (investigar) debió ir antes de F3 (redactar el juego)**. Escribir el juego v1 con los
datos originales obligó a rehacerlo.

---

## 3. Cronología detallada

### F0 · Material de partida (13-14 nov, antes de esta sesión)

- `linea_de_tiempo_opportunity.json`: 81 eventos de 1987 a 2026, esquema 2.0, 166 fuentes únicas. Cada evento tiene fase, categoría, nivel de
  respaldo, marca de «discutido», fuentes con tipo y nivel de verificación. Fases: origen 6, planificación y desarrollo 7, lanzamiento y viaje 4,
  aterrizaje 1, operaciones 51, fin de misión 10, legado 2.
- `hardware_opportunity.json`: 54 componentes (jerarquía por `sistema_padre`), 211 especificaciones, 67 descubrimientos, 195 eventos operativos,
  148 fuentes, 26 componentes con datos discutidos.
- Esquemas JSON de ambos (`esquema_linea_de_tiempo_v2.json`, `esquema_hardware_v2.json`) y `LEEME_esquema.md`.

### F1 · Visores de revisión (14 nov, mañana)

1. **Visor de la línea de tiempo** (`visor.html`, primero genérico, luego a medida). Pestañas: línea de tiempo, ficha y equipo, discrepancias y
   pendientes, fuentes, JSON crudo. Filtros por fase, categoría, respaldo y «discutido».
2. **Enlaces de fuentes por evento**, visibles sin abrir nada, para navegar rápido.
3. **Filtrado con teclado**: marcar cada evento *Entra / Dudoso / No entra* con una nota, en `localStorage`, con exportación a JSON.
   Atajos: `j/k` mover, `1/2/3` marcar, `n` nota, `s/S` abrir fuentes, `u` siguiente sin revisar, `a` avance automático.
4. **Visor de hardware** (`hardware.html`): árbol de componentes por jerarquía, buscador, filtros, especificaciones con fuentes, historial operativo.
5. **Hardware «validado»** (`hardware_opportunity_validado.json` y `.html`): se conservó solo lo respaldado por al menos una fuente oficial NASA/JPL o
   científica (51 componentes, 181 especificaciones, 49 descubrimientos, 71 eventos operativos; se descartaron 3 componentes). Script
   `build_hardware_validado.py`. Las 911 fuentes decían lo mismo en «verificación», así que el criterio útil fue el **tipo** de fuente.

### F2 · La historia (14 nov)

- El reto (pegado en la conversación): contar la historia del hardware dejado por la NASA en la Luna, Marte y el espacio profundo, para estudiantes,
  con narrativa fuerte y exactitud.
- **Regla tuya:** máximo 20 eventos. Criterio principal: potencial para contar la historia y generar imágenes y animaciones. Criterio secundario:
  fuentes confiables (otro agente buscaría más).
- Se eligieron 20 eventos en **5 actos**: la idea (3), el viaje (2), el agua en Meridiani (4), los años extra: récords, averías y hallazgos (7), y la
  tormenta y el adiós (4). Cada evento recibió `gancho`, `escena_visual`, `emocion`, `elementos`, `por_que_se_eligio`, `solidez_fuentes` y
  `busqueda_sugerida`. `build_historia.py` genera el JSON y `historia.html`.
- Alertas ya anotadas entonces: `opp008` con fuente débil, `opp045` con poco detalle, `opp072` (la frase «mi batería está baja» no es del rover).

### F3 · Juego v1 (14 nov)

- **V1 de 20 nodos** (`historia_decisiones_*`): 8 de historia, 4 decisiones, 4 escenas alternativas, 4 fallos. Reglas tuyas: empezar con 2 nodos de
  historia y luego una decisión; el camino feliz es la decisión real; la equivocada genera 1 o 2 escenas más y un fallo; público de 5.º de secundaria.
- **V1 de 30 nodos** (`juego_opportunity.json`, «como un videojuego de decisiones, estilo Detroit»): 17 reales y 13 ficticios, 6 decisiones, pantalla de
  título, capítulos, texto que se escribe solo, modo presión con temporizador, diagrama de ramas con nodos ocultos, archivo de datos desbloqueados,
  resumen de decisiones y progreso guardado. Se dejó la versión de 20 nodos intacta.
- Problema que aparecería después: ambas se escribieron **con los datos originales**, sin verificar.

### F4 · El agente investigador (14 nov)

1. **Planteamiento.** Un agente que recibe un evento y hace una búsqueda profunda: relato, datos reales, fuentes (y, en ese momento, imágenes).
2. **Investigación del stack.** Se compararon Playwright MCP, Crawl4AI, Firecrawl, Browser Use y Stagehand; búsqueda: Tavily, Exa, Brave y DuckDuckGo
   (`ddgs`); fuentes oficiales: NASA Image and Video Library, NTRS, PDS. Restricciones tuyas: **herramientas gratis**, usar el **plan de Claude** actual
   con la posibilidad de una API key, y probar cada herramienta para saber si funciona.
3. **Pruebas de herramientas** (`probar_herramientas.py`): de las primeras 9, 6 funcionaron. Falló Wikipedia/Wikimedia (403 con cualquier User-Agent
   genérico) y Crawl4AI hasta instalar Chromium de Playwright. El plan de Claude funcionó a través del SDK sin clave.
4. **Primeras corridas** (plan de Claude): `opp018` (25 datos), `opp001` (cuestionó el evento original), `opp005` y `opp008` (confirmó que la reunión y la
   frase de Goldin no se podían respaldar).
5. **Mejoras al método:** regla de no repetir un evento ya procesado (`--forzar` guarda la versión anterior), prompts separados en archivos versionados
   con `CHANGELOG.md`, métricas por corrida, `costos.py`.
6. **Se quitó la búsqueda de imágenes** (prompt v2) porque en `opp015` gastó 11 búsquedas sin hallar la foto del despegue.
7. **Proveedores:** plan, API de Anthropic y **Amazon Bedrock**. Con Bedrock: Sonnet 4.6 investiga, Opus 4.6 revisa, Haiku 4.5 hace tareas internas.
   Los modelos 5.5 de la cuenta dieron `INVALID_PAYMENT_INSTRUMENT`; los 4.x funcionaron. El plan queda como respaldo automático si Bedrock falla
   antes de empezar.
8. **Revisión con Opus:** la primera versión pedía reescribir el dossier completo y tardó más de 5 minutos; la v2 devuelve solo decisiones (qué datos
   conservar por número, relato nuevo, contradicciones y huecos) y tarda unos 2 minutos.
9. **Lotes:** `procesar_lote.py` con tope de gasto, corte tras 3 fallos seguidos y paralelismo (3 a la vez), con el corpus de caché mezclado de forma
   atómica.
10. **Medición de costos** por evento, por modelo y total, y revisión del acceso a Cost Explorer en AWS (solo lectura).

### F5 · 30 dossiers (14 nov, tarde-noche)

| Lote | Eventos | Cómo | Tiempo | Costo de referencia |
|---|---|---|---|---|
| Primeros, con el plan | `opp018`, `opp001`, `opp005`, `opp008` | uno a uno | minutos cada uno | ≈ 0,5-0,7 USD cada uno |
| Pruebas en Bedrock | `opp021`, `opp015`, `opp025` | uno a uno | 2-4 min | 0,41 · 1,13 · 0,47 USD |
| Lote 1 | 13 restantes de la historia | en serie | 50,5 min | 6,58 USD |
| Lote 2 | 10 que pide el juego | **3 en paralelo** | 14,0 min | 5,06 USD |

Ningún evento del lote falló y ninguno cayó al plan de respaldo.

### F6 · Juego v2 (14-15 nov)

1. Con los 30 dossiers, se leyó lo verificado de cada evento y se descartó todo lo no confirmado.
2. **Reglas tuyas para la v2:** usar solo lo verificado; nodos de historia y de decisión; las decisiones deben dar el contexto necesario; 2 alternativas
   (3 solo si la pregunta lo permite); por cada opción equivocada, **2 nodos ficticios narrados como reales**, sin fuentes.
3. **Aritmética del presupuesto:** 30 nodos = 18 reales + 12 ficticios (6 decisiones × 1 opción equivocada × 2 niveles). Con 3 opciones en una decisión
   no cabría.
4. Se escribió una **muestra** de una decisión (¿uno o dos rovers?) y la aprobaste («me gusta el plan»), después se escribieron los 30 nodos.
5. **Pruebas** (19) que fijan la estructura, la trazabilidad a los dossiers y la ausencia de afirmaciones descartadas.
6. **Visor del mapa** (grafo, árbol, tabla, validación) y **JSON enriquecido** para otro agente (aristas, roles, respaldo resuelto, diccionario).
7. Aclaración tuya: el HTML **no es el juego final**, es una herramienta interna; **lo importante es el JSON**.

### F7 · Entrega (14-15 nov)

- Traslado al repo `nasa-space-apps-2026-demo`: `story/`, `public/story/`, `agents/opportunity-research/`.
- Rama `feature/story-research-agent` (gitflow; `dev` y `master` estaban en el mismo commit). Los commits los hiciste tú.
- READMEs: del agente, de la historia, del JSON del juego v2 y la guía de traspaso `README_JUEGO.md`. El README original solo referencia al nuevo.
- Correcciones de usabilidad: las plantillas HTML no funcionaban solas (marcador `__DATA__`) y un enlace del mapa daba 404 desde `story/templates/`.

---

## 4. Decisiones que tomaste (las reglas del proyecto)

Estas son las reglas del cliente. Cualquier skill debe respetarlas o pedir permiso para cambiarlas.

| # | Regla | Dónde se aplicó |
|---|---|---|
| 1 | La historia tiene **como máximo 20 eventos**. | Selección de la historia. |
| 2 | **Prioridad 1: potencial narrativo** y de generar imágenes/animaciones. **Prioridad 2: fuentes confiables** (no determinante). | Criterio de selección. |
| 3 | Público: **5.º de secundaria** (17 años). | Tono de todos los textos. |
| 4 | Dos productos: **historia** y **juego de decisiones** (primero 20 nodos, luego 30). | F2-F3. |
| 5 | El juego empieza con **2 nodos de historia**, luego una decisión. | Estructura de nodos. |
| 6 | La opción correcta **es la historia real**; la equivocada abre ramas ficticias que terminan en un fallo. | Diseño del juego. |
| 7 | **No machacar lo anterior**: cada versión nueva va en archivos nuevos. | v1 de 20, v1 de 30 y v2 conviven. |
| 8 | Herramientas **gratis** siempre que sea posible. | Stack del agente. |
| 9 | Usar el **plan de Claude** por defecto, con la posibilidad de una API key; luego **Bedrock** con el plan como respaldo. | `proveedores.py`. |
| 10 | Con Bedrock, **Opus + Sonnet**; con el plan, como estaba. | Revisión con Opus. |
| 11 | **Quitar las imágenes** del agente. | Prompt v2. |
| 12 | Un evento ya procesado **no se repite** sin una bandera explícita. | `--forzar`. |
| 13 | **Separar los prompts** para mejorar poco a poco. | `prompts/`. |
| 14 | **Medir el costo** por evento y por modelo. | `costos.py`. |
| 15 | Procesar **todos** los eventos, **en paralelo** si es seguro. | `procesar_lote.py`. |
| 16 | La v2 usa **solo lo verificado, sin inventar**; las decisiones dan el contexto necesario; **2 alternativas** idealmente; ramas de **2 nodos** narrados **realistas**. | `build_juego2.py` y sus pruebas. |
| 17 | El HTML es **interno**; el **JSON es lo importante** (lo usará otro agente). | Mapa + JSON enriquecido. |
| 18 | **No pisar el README original**: un README nuevo y solo una referencia. | `README_JUEGO.md`. |

---

## 5. Decisiones técnicas y por qué

| Decisión | Por qué |
|---|---|
| Un dato es «verificado» solo si su **cita literal aparece en el texto que el agente leyó** (comprobado por código). | La promesa «cada dato tiene fuente» no se puede auditar; esta sí. |
| El agente corre **aislado** (`setting_sources=[]`, `tools=[]`): sin archivos ni terminal, solo 3 herramientas propias. | Reduce el riesgo y evita que cargue instrucciones del usuario. |
| La revisión de Opus **devuelve decisiones, no el dossier**, y el código solo deja elegir entre lo que existe. | Una versión anterior que reescribía todo tardó >5 min y podía alterar citas. Así es más rápido, barato y seguro. |
| Los nodos ficticios **no llevan comillas, porcentajes ni cifras** (solo años). | Todo lo inventado queda libre de datos que parezcan verdad. Una prueba lo exige. |
| Cada nodo real lleva **referencias** `opp009#3` a datos verificados, y el JSON las trae resueltas. | Trazabilidad auditable y un agente posterior no necesita abrir los dossiers. |
| El presupuesto de nodos se **calcula** (18 + 12) en lugar de ajustarse a ojo. | Una decisión con 3 opciones cuesta 2 nodos más. |
| Prompts como **archivos versionados** con cabecera `version` y `CHANGELOG.md`; la versión usada queda en `metricas.json`. | Comparar corridas entre versiones. |
| Procesamiento **en paralelo de 3** con tope de gasto y corte por fallos. | Bedrock y DuckDuckGo pueden limitar la velocidad; con 3 no hubo problemas. |
| Caché del corpus **mezclada y reemplazada de forma atómica**. | En paralelo, varios procesos escribían el mismo archivo y se pisaban. |
| Guardar el **borrador en `cache/`** apenas termina la investigación. | Un fallo posterior no debe perder trabajo ya pagado. |
| Etiqueta discreta de **«Línea alternativa»** en los nodos ficticios. | El reto exige exactitud; un estudiante podría tomarlos por historia verdadera. (Recomendación pendiente de tu aprobación.) |

---

## 6. Lo que encontramos

### 6.1 Sobre los datos de Opportunity

Los dossiers cuestionaron el texto original de la línea de tiempo. **Ninguna de estas correcciones se aplicó todavía** a `linea_de_tiempo` ni a
`historia_opportunity.json`.

| Evento | Hallazgo |
|---|---|
| `opp001` | 1987 es el inicio de **cuatro propuestas** (1987-1997); no es el año de la aprobación. «Botas geológicas» y «húmedo y cálido o frío y seco» no se confirmaron. |
| `opp004` | La causa del Mars Polar Lander se describe distinto según la fuente (sensor de aterrizaje frente a error de software). Dossier frágil: 10 datos sin verificar. |
| `opp005` | La mancha de hematita mide 300 × 500 km (descubridores) o 350 × 750 km (NTRS). El aterrizaje es el 24 o el 25 de enero según la zona horaria. |
| `opp008` | La reunión del 16 de julio de 2000 y la frase de Goldin **no se confirmaron**. Verificado: anuncio del 27 de julio y oficial del 10 de agosto. |
| `opp009` | El peso de cada rover difiere (113 kg o 150 kg). El costo total del programa varía (744, 800 u 820 millones). |
| `opp012` | Los finalistas «Isidis» y «Elysium» del evento original no figuran entre los datos verificados. Verificado: 155 sitios estudiados y asignación de rover a sitio tentativa. |
| `opp015` | El corcho «se despegó» más que «se agrietó». La «válvula defectuosa» no se confirmó. «El Delta II Heavy debutaba» lo contradice NASA. |
| `opp021` | Opus corrigió en el relato una cita de Squyres que no coincidía con la fuente («empapadas» frente a «fluyó»). |
| `opp025` | Las «blueberries» se anunciaron desde el cráter Eagle; la imagen de Fram es del sol 84. El borrador incluía una cita de Squyres sin respaldo. |
| `opp033` | La dirección de la rueda delantera derecha se atascó en el sol 433 y operó con restricciones (no «deshabilitada»). «Giros en K» y «purgatoides» no aparecen en ninguna fuente. La salida usó una **caja de arena**, no un «rover gemelo». |
| `opp040`/`opp041` | La distancia del viaje a Endeavour es de unos 19 o 21 km según la fuente. |
| `opp047` | «La evidencia más poderosa» era una paráfrasis; la cita real de Squyres es «definitiva». «Matijevic Hill» y «Turkey Haven» no se confirmaron. |
| `opp070` | Es el dossier con **más datos sin verificar** (14 de 20). La fecha de detección varía entre el 30 de mayo y el 1 de junio. |
| `opp072` | «My battery is low…» es una interpretación poética de un periodista, no un mensaje del rover. «Violeta» se había traducido como «azul». |
| `opp077` | «Más de 1.000 comandos» (Callas) frente a 835 (Planetary Society). |

### 6.2 Sobre los modelos

- **Sonnet 4.6 inventa al redactar.** En las revisiones que inspeccionamos (`opp015`, `opp021`, `opp025`) el borrador incluía una cita de una persona,
  nombres de piezas, un espesor, un porcentaje meteorológico y un combustible que ninguna fuente respaldaba. Opus 4.6 los eliminó.
- **Opus 4.6 como revisor** añadió contradicciones frente al evento original y huecos honestos, pero **su razonamiento interno es la mayor parte de lo que
  genera** (7.573 de 9.872 tokens en una prueba).
- **En Bedrock se usan perfiles de inferencia** (`us.anthropic.claude-sonnet-4-6`), no los ID simples. Los 4.x respondieron; los 5.5 pidieron un método de pago
  válido (suscripción de Marketplace).
- **El SDK de agentes funciona con el plan de Claude sin clave** y también con Bedrock mediante variables de entorno.
- El «costo» que reporta el SDK es a **precio de lista**; con el plan es solo referencia.

### 6.3 Sobre las herramientas

| Herramienta | Resultado |
|---|---|
| NASA Image and Video Library | Gratis, sin clave, funciona. Pero la foto concreta de un evento puede no existir (el lanzamiento de `opp015`). |
| NASA NTRS (informes técnicos) | Gratis, funciona. |
| `ddgs` (DuckDuckGo) | Funciona sin clave; sin problemas con 3 procesos en paralelo. |
| `httpx` + `trafilatura` | Funciona para casi todo. |
| Crawl4AI + Playwright | Funciona para páginas con JavaScript tras instalar Chromium. |
| Wikipedia/Wikimedia | **No funciona**: 403 con User-Agent genérico (exigen contacto real). No se integró. |
| PDFs | **No se leen** (devuelven vacío). Muchas fuentes oficiales lo son. |
| Páginas con Cloudflare | Bloqueadas (por ejemplo ScienceDirect). El dossier lo anota en `huecos`. |

### 6.4 Sobre el diseño del juego

- Una decisión es buena si se puede **decidir con lo que sabía el equipo en ese momento**; por eso cada decisión separa «lo que sabe el equipo» de «lo que
  pasó» (el resultado real).
- Las opciones deben **no delatar la respuesta**: cada una lleva su ventaja y su costo.
- Las decisiones salen de **momentos reales con alternativas verificables**: uno o dos rovers, el sitio de aterrizaje, una batería averiada, la duna, el viaje a
  Endeavour y el silencio tras la tormenta. Un evento sin alternativa real no sirve como decisión.
- El final alternativo **enseña**: muestra lo que pasó de verdad, apoyado en datos verificados, y devuelve al jugador a decidir.

### 6.5 Sobre el proceso

- **Investigar antes de redactar** habría evitado rehacer el juego.
- **Procesar en paralelo (3)** redujo el tiempo de ~50 a ~14 minutos sin errores.
- **Los límites de seguridad** (tope de gasto, corte por fallos, no repetir eventos, guardar borradores) costaron poco y evitaron pérdidas.
- Pruebas gratis desde el principio permitieron cambiar mucho sin romper nada.

---

## 7. Errores y problemas, y cómo se resolvieron

| Problema | Causa | Solución | Lección |
|---|---|---|---|
| **Se perdió un evento pagado** (`opp025`): investigó y revisó, pero no guardó. | Al quitar las imágenes eliminé sin querer la línea que creaba la carpeta de salida. | `guardar()` que crea la carpeta, test de regresión y guardado del borrador en `cache/` antes de revisar. | Un cambio «pequeño» puede romper una escritura. Guardar el trabajo caro lo antes posible. |
| El juego v1 contenía afirmaciones **no verificadas** («rover gemelo», «giros en K»…). | Se escribió antes de investigar. | Se rehízo como v2 con solo lo verificado. | Investigar primero. |
| El borrador de Sonnet **inventaba** detalles. | Modelo de redacción sin comprobación. | Revisión con Opus + verificación de citas por código. | Nunca confiar en un modelo para redactar sin revisión. |
| La revisión de Opus **tardó >5 min** y se canceló. | Pedía regenerar todo el dossier. | Rediseño: devuelve solo decisiones. | Pedir al modelo lo mínimo. |
| Los modelos **5.5 de Bedrock fallaron** (`INVALID_PAYMENT_INSTRUMENT`). | Suscripción de Marketplace sin método de pago válido. | Usar los 4.x (que sí respondieron) y dejarlo documentado. | Probar el acceso real con una llamada mínima antes de migrar. |
| Wikipedia respondía **403**. | Exige contacto real en el User-Agent. | Se dejó desactivada; opcional con `WIKIMEDIA_CONTACT`. | No poner datos personales ajenos en servicios externos. |
| Las **plantillas HTML** no funcionaban solas. | Tenían un marcador `__DATA__` sin datos. | Cargar `../data/*.js` con una etiqueta `<script>` (sirve con `file://`). | Las plantillas deben poder abrirse solas. |
| Un enlace del mapa daba **404** desde `story/templates/`. | Apuntaba a `juego2.html`, que solo existe en `public/story/`. | El enlace detecta su carpeta. | Probar los visores desde cada ubicación. |
| El **caché del corpus** se pisaba en paralelo. | Varios procesos reescribían el mismo archivo. | Mezcla con lo que hay en disco y reemplazo atómico. | Antes de paralelizar, buscar estado compartido. |
| Un `.pyc` apareció **preparado en git** sin pedirlo. | El IDE prepara archivos nuevos. | `.gitignore` en `story/`. | Revisar qué se prepara antes de confirmar. |
| Mis **estimaciones de costo** fueron bajas (0,7 USD frente a 1,13 en `opp015`). | Las búsquedas de imágenes y las relecturas no estaban previstas. | Medir y ajustar; quitar imágenes. | Estimar con datos medidos, no con intuición. |
| `opp018` **no tiene métricas**. | Se procesó antes de que existieran. | Anotado en el reporte de costos. | Instrumentar antes de la primera corrida. |
| Ruido del shell de Windows (`ng completion`) y caracteres `\n` mal interpretados al escribir scripts por consola. | El entorno carga un autocompletado y convierte algunas secuencias. | Filtrar la salida y escribir los archivos con herramientas de edición. | Para scripts largos, escribir archivos en vez de pasar texto por la consola. |

---

## 8. Métricas y costos

**Volumen.**

| Concepto | Valor |
|---|---|
| Eventos en la línea de tiempo | 81 |
| Eventos de la historia | 20 |
| Dossiers | 30 (los 20 + 10 del juego) |
| Datos verificados / sin verificar | 386 / 67 |
| Nodos del juego v2 | 30 (12 historia · 6 decisiones · 6 ficticios nivel 1 · 6 nivel 2) |
| Conexiones del grafo | 35 |
| Referencias a datos verificados en el JSON | 157 (133 datos distintos) |
| Pruebas automáticas | 63 (44 del agente + 19 del juego) |

**Costo de referencia** (precio de lista, calculado por el SDK; los precios se dedujeron del propio reporte y no se confirmaron en la página de AWS):

| Modelo | USD por millón de tokens (entrada / salida) | Gasto acumulado |
|---|---|---|
| Sonnet 4.6 (investiga) | 3 / 15 | 7,41 USD |
| Opus 4.6 (revisa) | 5 / 25 | 6,06 USD |
| Haiku 4.5 (tareas internas) | 1 / 5 | 0,17 USD |
| **Total Bedrock** | | **13,65 USD** |
| Plan de Claude (3 eventos) | solo referencia | 1,65 USD |

- Un evento cuesta de **0,3 a 0,7 USD** con investigación y revisión (promedio ≈ 0,52); la revisión de Opus es casi la mitad.
- Son mínimos: no incluyen `opp018`, un intento fallido de `opp025` ni las pruebas sueltas.
- Tiempo: 2 a 5 minutos por evento; 50 minutos para 13 en serie, 14 minutos para 10 en paralelo (3 a la vez).

---

## 9. Inventario de artefactos

### Dentro del repo (`nasa-space-apps-2026-demo`)

| Carpeta | Contenido | Estado |
|---|---|---|
| `story/data/` | `linea_de_tiempo_opportunity.json`, `historia_opportunity.json`, **`juego2_opportunity.json`**, `README_juego2.md`, y el primer juego (`juego_opportunity.json`, histórico) | vigente salvo el primer juego |
| `story/` | `build_historia.py`, `build_juego2.py`, `build_juego.py` (histórico), `templates/`, `tests/`, `README.md`, `README_JUEGO.md`, este documento | vigente |
| `public/story/` | `juego2_mapa.html`, `juego2.html`, `historia.html`, `juego.html` (histórico) | vigente salvo `juego.html` |
| `agents/opportunity-research/` | `agente.py`, `herramientas.py`, `proveedores.py`, `revision.py`, `procesar_lote.py`, `costos.py`, `esquema.py`, `prompts/`, `tests/`, `salida/` (30 dossiers), `README.md` | vigente |

### Fuera del repo (`D:\nasa_hackathon\`)

| Archivo | Qué es |
|---|---|
| `linea_de_tiempo_opportunity.json`, `esquema_linea_de_tiempo_v2.json`, `LEEME_esquema.md` | Material de partida (la línea de tiempo también está en el repo). |
| `hardware_opportunity.json`, `esquema_hardware_v2.json` | Inventario de hardware y su esquema. |
| `hardware_opportunity_validado.json`, `hardware_validado.html`, `build_hardware_validado.py` | Hardware depurado (solo lo respaldado por fuentes oficiales o científicas). |
| `hardware.html`, `hardware.template.html` | Visor del hardware completo. |
| `visor.html`, `viewer.template.html` | Visor de la línea de tiempo, con filtrado por teclado. |
| `historia_decisiones_opportunity.json`, `.html`, `build_decisiones.py`, `decisiones.template.html` | Primer juego, de 20 nodos (histórico). |

> **Nota.** El hardware (`hardware_*`) se trabajó antes de la historia y no se usó en el juego v2. Puede servir para las cartillas (datos de componentes).

---

## 10. Qué es reutilizable y qué es específico de Opportunity

### Reutilizable tal cual para otra misión en Marte

- El **método**: línea de tiempo con fuentes → selección de ≤20 eventos → dossiers verificados → juego con decisiones → JSON para otro agente.
- El **agente** (herramientas, verificación de citas, revisión, lotes, costos, proveedores). Su código no depende de la misión, salvo los prompts.
- La **estructura del JSON** del juego (nodos, aristas, roles, respaldo resuelto).
- Las **reglas de diseño** del juego (§4, #5-#6, #16) y la **aritmética de nodos**.
- Los **visores** (el mapa lee el JSON; el de la línea de tiempo lee el esquema 2.0).
- El **flujo de pruebas** y de **documentación**.

### Específico de Opportunity (hay que parametrizar)

| Dónde | Qué cambia por misión |
|---|---|
| `prompts/investigador.md` y `revisor.md` | Mencionan «el rover Opportunity». Hay que ponerles el nombre de la misión y el público. |
| `ARCHIVO`, ids `opp###` | El prefijo y el archivo de eventos son de Opportunity. |
| `story/build_historia.py`, `build_juego2.py` | La selección de eventos, el texto de los nodos y los títulos son de Opportunity. |
| `story/tests/test_juego2.py` | Las frases prohibidas (`PROHIBIDO`) y el número de nodos son de este juego. |
| Hallazgos de §6.1 | Son de los datos de Opportunity. |

### Qué necesita cada misión nueva

Nombre y agencia; fechas clave; cuerpo y lugar; una línea de tiempo con fuentes (el agente puede ayudar a construirla); público y número de eventos; el
presupuesto de nodos del juego; y el proveedor de modelos disponible.

---

## 11. Propuesta de skills

Nueve skills candidatas, ordenadas como el flujo. Cada una indica qué ya está **validado** por haberse hecho aquí.

### S1 · `mars-mission-timeline` · Línea de tiempo con fuentes

- **Objetivo:** construir y curar la línea de tiempo de una misión (esquema 2.0) con fuentes clasificadas y marcas de «discutido».
- **Entradas:** nombre de la misión, fechas clave.  **Salidas:** `linea_de_tiempo_<misión>.json` y su visor con filtrado por teclado.
- **Pasos:** reunir eventos y fuentes → clasificarlos por fase y categoría → marcar discrepancias → revisar con el visor (entra/dudoso/no entra).
- **Se reutiliza:** el esquema 2.0, `visor.html` y su filtrado por teclado.
- **Estado:** el esquema y el visor están hechos; la *construcción* de la línea de tiempo la trajiste hecha, así que ese paso no está validado.

### S2 · `mars-hardware-inventory` · Inventario de hardware validado

- **Objetivo:** inventariar el hardware de una misión y quedarse con lo respaldado por fuentes oficiales o científicas.
- **Salidas:** JSON de hardware validado y visor jerárquico.
- **Criterio validado:** ≥1 fuente oficial/científica por especificación, descubrimiento o evento; la columna «verificación» no distingue nada.
- **Estado:** hecho para Opportunity; no se usó en el juego.

### S3 · `story-event-selection` · Elegir los eventos de la historia

- **Objetivo:** elegir ≤20 eventos con arco completo (idea, viaje, hallazgos, problemas, final, legado) y prepararlos para ilustrar.
- **Criterio:** potencial narrativo primero, fuentes después. **Salidas:** JSON de la historia con gancho, escena visual, emoción, solidez de fuentes y visor por actos.
- **Estado:** hecho y validado.

### S4 · `event-research-dossiers` · Agente investigador

- **Objetivo:** convertir un evento en un dossier de datos verificados.
- **Entradas:** un evento (JSON). **Salidas:** `dossier.json` (datos con URL y cita literal, no verificados, fuentes nuevas, contradicciones, huecos, ideas visuales), `dossier.md`, `metricas.json`.
- **Pasos:** investigar con herramientas gratis → verificar cada cita contra el texto leído → guardar borrador → revisar → escribir.
- **Se reutiliza:** todo `agents/opportunity-research/`, salvo los prompts (parametrizar misión y público).
- **Lecciones incluidas:** guardar el borrador antes de revisar; no repetir eventos; tope de gasto; evitar relecturas.
- **Estado:** **validado con 30 eventos**.

### S5 · `dossier-review-reconciliation` · Revisión y conciliación

- **Objetivo:** depurar los dossiers y convertir sus hallazgos en correcciones a los datos de origen.
- **Pasos:** revisión con un modelo más potente que devuelve solo decisiones → leer contradicciones y huecos → decidir qué evento se corrige → aplicar la corrección con tu aprobación.
- **Estado:** la revisión está validada; **la conciliación (corregir los eventos) no se ha hecho**.

### S6 · `decision-game-design` · Diseño del juego de decisiones

- **Objetivo:** diseñar el juego a partir de dossiers verificados.
- **Reglas:** empezar con 2 nodos de historia; nunca 2 decisiones seguidas; decisiones con contexto («lo que sabe el equipo», «lo que está en juego»); 2 opciones equilibradas;
  2 nodos ficticios realistas por opción equivocada, sin fuentes, citas ni cifras; final alternativo con «lo que pasó en realidad».
- **Cálculo:** nodos reales + 2 × opciones equivocadas = total.
- **Estado:** **validado con la v2** (muestra aprobada y 30 nodos).

### S7 · `game-json-build-and-viewers` · Constructor, pruebas y visores

- **Objetivo:** generar el JSON del juego con trazabilidad y los visores.
- **Salidas:** JSON con nodos, aristas, roles y `respaldo_detalle`; mapa del grafo; prototipo; pruebas.
- **Se reutiliza:** la estructura del builder, las pruebas (parametrizando las frases prohibidas) y las plantillas HTML.
- **Estado:** validado.

### S8 · `llm-provider-cost-ops` · Proveedores y costos

- **Objetivo:** usar plan, API o Bedrock, con respaldo, y medir el gasto.
- **Incluye:** comprobar el acceso real a cada modelo con una llamada mínima, perfiles de inferencia de Bedrock, tope de gasto, lotes en paralelo con corte por fallos, reporte de costos
  por evento y modelo, lectura de Cost Explorer (solo lectura).
- **Estado:** validado, salvo los modelos 5.5.

### S9 · `handoff-documentation` · Documentación de traspaso

- **Objetivo:** dejar el trabajo entendible para otra persona u otro agente.
- **Incluye:** README del JSON, guía de traspaso, mapa del proceso, tablas generadas desde los datos (no a mano), y no pisar los README existentes.
- **Estado:** hecho para Opportunity.

### Cómo se conectan

```
S1 ─▶ S3 ─▶ S4 ─▶ S5 ─▶ S6 ─▶ S7 ─▶ S9
 └──▶ S2 (opcional, para cartillas)
        S8 (transversal: proveedores, costos, lotes)
```

**Sugerencia de empaquetado:** una skill **orquestadora** (`mars-mission-story-pipeline`) que describa el flujo completo y llame a las demás.

---

## 12. Lo que necesito que revises y apruebes

Marca cada punto con **Aprobado**, **Corregir** (con una nota) o **Descartar**.

### A. Hechos y reglas

- [ ] **A1.** ¿Las 18 reglas de §4 son exactamente lo que pediste? ¿Falta alguna?
- [ ] **A2.** ¿Los hallazgos de §6.1 son correctos para aplicarlos a la línea de tiempo y a la historia? (Aprobar o marcar cuáles aplicar.)
- [ ] **A3.** ¿Estás de acuerdo con las lecciones de §6.2 sobre Sonnet y Opus? (Se basan en tres eventos inspeccionados, no en una medición sistemática.)

### B. Decisiones de diseño pendientes

- [ ] **B1.** Etiqueta **«Línea alternativa»** en los nodos ficticios: ¿se queda, se quita o se hace configurable?
- [ ] **B2.** ¿2 opciones fijas por decisión, o permitir 3 cuando la pregunta lo pida? (Cada opción equivocada cuesta 2 nodos.)
- [ ] **B3.** ¿Mantener los 30 nodos como tope, o parametrizarlo por misión?

### C. Skills

- [ ] **C1.** ¿La división en **9 skills** (§11) te parece bien? ¿Alguna se une o se parte?
- [ ] **C2.** ¿Quieres la **skill orquestadora** que une todo el flujo?
- [ ] **C3.** ¿Dónde viven las skills? (en el repo, en tu carpeta de skills de Claude, o ambas)
- [ ] **C4.** ¿Los nombres `mars-*` y `story-*` te sirven o prefieres otro prefijo?
- [ ] **C5.** ¿Qué hacemos con S1 y S2, cuya construcción original (la línea de tiempo y el hardware) no se hizo aquí? ¿Las incluimos solo como «cómo usar el resultado»?

### D. Material

- [ ] **D1.** ¿Se conservan las versiones históricas (`juego_opportunity.json`, `historia_decisiones_*`) o se retiran?
- [ ] **D2.** ¿Los archivos de `D:\nasa_hackathon\` fuera del repo (hardware, visor de la línea de tiempo, primer juego) se mueven al repo o se quedan?
- [ ] **D3.** ¿Se quita del repo `juego.html` y el primer juego de 30 nodos (obsoletos)?

---

## 13. Pendientes del proyecto

1. Aplicar las correcciones de §6.1 a la línea de tiempo y a la historia.
2. Revisión humana de los 12 nodos ficticios (es la única parte inventada).
3. Cartillas: cada nodo ya trae `dato_desbloqueado` y `respaldo_detalle`.
4. Ilustraciones y animaciones a partir de `escena_visual` y `emocion` (el agente ya no busca imágenes: buscar las fotos aparte, con su crédito y licencia).
5. Integrar el juego final en la app Next.js del repo, con la interfaz en inglés y el diseño «Primer».
6. Repetir la prueba de los modelos 5.5 de Bedrock cuando la cuenta tenga un método de pago válido.
7. Mejoras del agente: leer PDFs, evitar releer páginas largas, limitar el razonamiento de Opus.
8. Convertir lo aprobado de este documento en las skills de §11.
