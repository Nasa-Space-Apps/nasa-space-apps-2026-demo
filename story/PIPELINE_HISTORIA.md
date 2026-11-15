# Cómo crear una historia con N eventos de una misión en Marte (dos fases)

> **Borrador para revisión.** Describe el flujo completo para pasar de «una misión» a «una historia de N eventos verificados» para estudiantes de
> 5.º de secundaria. Es la base para convertirlo luego en una *skill* repetible en otras misiones. Alcance: **solo la historia**; el juego de
> decisiones queda fuera (está en [`README_JUEGO.md`](README_JUEGO.md)).
>
> Lo **validado** se hizo de verdad. Lo que es **propuesta** lo marco así, para que lo apruebes o lo cambies.
> Esta versión reemplaza a la de 5 pasos: ahora el flujo tiene **dos fases** y entiende el kit de herramientas de `timelines_v0/`.

## Índice

1. [Lo que entendí](#1-lo-que-entendí)
2. [El flujo en dos fases](#2-el-flujo-en-dos-fases)
3. [Fase 1 · La investigación base (el JSON base de una misión)](#3-fase-1--la-investigación-base-el-json-base-de-una-misión)
4. [La compuerta: la pregunta del número N](#4-la-compuerta-la-pregunta-del-número-n)
5. [Fase 2 · De N eventos a la historia](#5-fase-2--de-n-eventos-a-la-historia)
6. [Parámetros de una corrida](#6-parámetros-de-una-corrida)
7. [Cuánto tarda y cuánto cuesta](#7-cuánto-tarda-y-cuánto-cuesta)
8. [Qué ya existe y qué falta construir](#8-qué-ya-existe-y-qué-falta-construir)
9. [Reglas que no se rompen](#9-reglas-que-no-se-rompen)
10. [De aquí a las skills](#10-de-aquí-a-las-skills)
11. [Lo que necesito que revises](#11-lo-que-necesito-que-revises)

---

## 1. Lo que entendí

Para **procesar una misión** hay **dos fases**:

1. **Fase 1 · Investigación base.** Primero se mira si ya existe la investigación base de esa misión en `timelines_v0/`. **Si existe, se usa.**
   **Si no existe, se produce** con el `kit_herramientas/` que hay dentro de esa carpeta. El resultado es el JSON base: un mapa rápido de todo lo que se
   sabe de la misión.
2. **Fase 2 · La historia.** Todo lo que ya hicimos con Opportunity: elegir N eventos con potencial para jóvenes de 17 años, investigarlos mejor con
   nuestro agente (fuentes oficiales, fuentes relevantes y validadas, sin imágenes) y contar la historia.

Dos detalles de funcionamiento:

- **Entre las dos fases el flujo debe preguntar cuánto vale N** y esperar la respuesta antes de empezar a procesar.
- **El agente ya procesa en paralelo** (de 3 en 3, con tope de gasto): eso ya está hecho y validado, y es parte de la Fase 2.

Si algo de esto no es exactamente lo que pensabas, es lo primero que hay que corregir.

---

## 2. El flujo en dos fases

```
 misión ─▶ ¿existe  timelines_v0/linea_de_tiempo_<id>.json ?
                │
     ┌──── sí ──┴── no ───────────────────────────────────────────────┐
     │                                                                │
     │                                     FASE 1 · construir con el kit_herramientas/
     │                                      ficha de alcance → mapa de fuentes → esqueleto
     │                                      → 5 agentes por fases + ronda de huecos
     │                                      → fusionar y deduplicar → validar (0 problemas)
     │                                                                │
     └──────────── JSON base: timelines_v0/linea_de_tiempo_<id>.json ◀┘
                                       │
                                       ▼
                      ┌───────────────────────────────────────────────┐
                      │  PREGUNTA: ¿cuántos eventos (N) quieres?      │  ◀── el flujo se detiene y espera
                      │  (con costo y tiempo estimados para ese N)    │
                      └───────────────────────────────────────────────┘
                                       │
                                       ▼
        FASE 2 · elegir N ──▶ investigar los N (en paralelo, agente) ──▶ conciliar ──▶ escribir la historia
```

| Fase | Qué responde | Entrada | Salida | Estado |
|---|---|---|---|---|
| **1** | ¿Qué se sabe de la misión? | el nombre de la misión | `timelines_v0/linea_de_tiempo_<id>.json` (esquema 2.0, validado) | **existe para 4 misiones**; el kit está **probado**; construir una misión nueva **no lo hemos hecho nosotros** |
| compuerta | ¿Cuántos eventos? | el JSON base | el valor de N | propuesta |
| **2** | ¿Qué es verdad y cómo se cuenta? | el JSON base + N | N dossiers verificados + la historia | **validada con Opportunity** (30 eventos investigados, en paralelo) |

---

## 3. Fase 1 · La investigación base (el JSON base de una misión)

### 3.1 Primero: ¿ya existe?

La comprobación es sencilla: buscar `timelines_v0/linea_de_tiempo_<id>.json`, donde `<id>` es el nombre de la misión en minúsculas y sin espacios
(el mismo que lleva `mision.id` dentro del archivo). Hoy existen cuatro:

| Misión | Tipo | Eventos | Fuentes únicas | Con respaldo oficial o científico | Marcados «discutido» |
|---|---|---|---|---|---|
| `opportunity` (MER-B) | rover | 81 | 166 | 66 | 14 |
| `spirit` (MER-A) | rover | 80 | 188 | 66 | 13 |
| `ingenuity` | helicóptero | 141 | 157 | 121 | 35 |
| `insight` | aterrizador | 92 | 127 | 75 | 47 |

`timelines_v0/linea_de_tiempo_opportunity.json` es **idéntico** al que usamos en `story/data/` (mismo hash).
Si el archivo existe, **no se vuelve a investigar**: se usa. Esa decisión conviene que la tome un script (propuesta: `resolver_base.py`).

### 3.2 Qué es el kit (`timelines_v0/kit_herramientas/`)

Cinco archivos, 120 KB, que explican y automatizan cómo se hizo la investigación base de las cuatro misiones, para que **otro agente la repita con cualquier otra misión**
y obtenga JSON **comparables entre misiones**:

| Archivo | Qué es |
|---|---|
| `GUIA_INVESTIGACION_MISIONES.md` | La guía completa (1.699 líneas): reglas, flujo, esquemas, prompts de los agentes, lecciones y lista de verificación. |
| `esquema_linea_de_tiempo_v2.json` | JSON Schema (draft-07) de la línea de tiempo, versión 2.0. |
| `esquema_hardware_v2.json` | JSON Schema del inventario de hardware (no se usa para la historia). |
| `construir_mision.py` | Fusiona eventos «crudos» con un documento base, quita duplicados, ordena, renumera ids y reconstruye los índices. |
| `validar_mision.py` | Valida el JSON contra el esquema y con más de una docena de comprobaciones extra (orden, ids, fechas, fuentes, sols). |

**Lo que probé del kit** (en una carpeta temporal, sin tocar los originales):

| Prueba | Resultado |
|---|---|
| `validar_mision.py` sobre las 4 líneas de tiempo, con el sol cero de cada misión | **0 problemas en las cuatro** (274, 324, 532 y 256 citas) |
| `construir_mision.py reindexar` sobre Opportunity | Idempotente: mismos 81 eventos y mismos ids |
| `construir_mision.py fusionar` con 2 eventos crudos (1 duplicado, 1 nuevo) | Descartó el duplicado **sumando su fuente** al evento existente, añadió el nuevo (82 eventos, 168 URL) y renumeró los ids |

### 3.3 Cómo se construye el JSON base (los pasos del kit)

| # | Paso | Qué se hace | Quién |
|---|---|---|---|
| 0 | **Ficha de alcance** | `id`, nombre, agencia, tipo, cuerpo, lugar, **prefijo de eventos** (3-6 letras), `sol_cero` y `sol_offset` (solo Marte; se busca en fuentes, no se asume), estado actual, misiones relacionadas | agente principal |
| 1 | **Mapa de fuentes** | 5-10 búsquedas para saber dónde mirar: páginas de misión, kits de prensa, NTRS, PDS, artículos | agente principal |
| 2 | **Esqueleto** | JSON con todas las claves de primer nivel y `eventos: []` | agente principal |
| 3 | **Ronda 1: 5 agentes en paralelo, por fases** | A: origen + planificación + desarrollo · B: pruebas + lanzamiento + viaje · C: aterrizaje y primeros días · D: operaciones (por años) · E: fin de misión + legado. Cada uno escribe una lista de eventos «crudos» | 5 subagentes |
| 3b | **Ronda 2: huecos** | 2-4 agentes reciben la lista de lo que ya existe y traen **solo lo que falta** (meses sin eventos, fallas y soluciones, pruebas, ciencia, legado). Añadió de 18 a 24 eventos por misión | 2-4 subagentes |
| 4 | **Fusionar y deduplicar** | `construir_mision.py fusionar` (umbral de similitud 0,6): valida enums, fechas y URL, descarta duplicados **sumando sus fuentes**, ordena, renumera ids y reconstruye `indice_fuentes` y `resumen` | script |
| 5 | **Validar** | `validar_mision.py` con el sol cero; debe terminar con `problemas: 0` | script |
| 6 | **Revisión manual** | Leer títulos en orden (saltos de años, duplicados con otra redacción), distribución de categorías (si >70 % es «operación», reclasificar), eventos discutidos y `fechas_clave` | persona o agente |
| 7 | **Auditoría independiente** | Un agente que no vio el trabajo revisa 15 eventos al azar abriendo las URL | otro agente |
| 8 | **Entrega** | Archivos y un mensaje corto con las advertencias | agente principal |

Volumen de referencia del kit: 60 a 140 eventos para una misión larga (Opportunity 81, Spirit 80, Ingenuity 141, InSight 92); 30 a 50 para una misión corta.

### 3.4 Las reglas del kit que importan

1. **Toda afirmación lleva fuente con URL.** Sin fuente, el dato va a `pendientes_de_verificar`, no al cuerpo del archivo.
2. **Nunca se completa de memoria.** La memoria sirve para saber qué buscar, no como fuente.
3. **Honestidad sobre cuánto se verificó.** Tres niveles: «página abierta completa», «página abierta (resumen automático de la herramienta)» y «solo extracto de búsqueda».
4. **Si dos fuentes discrepan no se elige en silencio:** `discutido: true`, una `nota` y una entrada en `discrepancias`.
5. **Prioridad de fuentes:** oficiales (NASA/JPL/PDS/NTRS) → científicas → prensa especializada → comunitarias (solo como pista).
6. **Derechos de autor:** redacción propia en español; citas textuales de menos de 15 palabras.
7. **Se valida con scripts, no a ojo** (fechas y sols con aritmética, el esquema y el índice de URL).
8. **Una sola línea de tiempo por misión, en un solo JSON,** con las fuentes dentro de cada evento.
9. **Los nombres de campos y los enums no cambian**: la plataforma depende de ellos para comparar misiones.

### 3.5 Qué contiene el JSON base

Cada **evento** trae: `id` (prefijo + número: `opp001`, `spi001`, `ing001`, `ins001`), `orden`, fechas con su precisión, `sol`, `titulo`, `detalle`, `datos_clave`,
`etapa`, **`fase`** (origen · planificación y desarrollo · lanzamiento y viaje · aterrizaje · operaciones · fin de misión · legado), **`categoria`** (15 valores:
origen, planificación, desarrollo, pruebas, lanzamiento, viaje, aterrizaje, despliegue, operación, ciencia, problema, solución, hito, fin de misión, legado),
`respaldo`, `discutido` y `nota`, `fuentes` (con tipo y nivel de verificación), `compartido_con` y `datos_extra`.
Además, a nivel de misión: ficha técnica, equipo, récords, discrepancias, pendientes de verificar, recursos para la plataforma e índice de fuentes.

### 3.6 Qué tan fiable es el JSON base (medido)

El JSON base es un **mapa amplio, no una verdad confirmada**. Nivel de verificación de las fuentes de cada línea de tiempo:

| Misión | Solo extracto de búsqueda | Página abierta (resumen automático) | Página abierta completa |
|---|---|---|---|
| Opportunity | 76 % | 16 % | 6 % |
| Spirit | 85 % | 14 % | 0 % |
| Ingenuity | 44 % | 9 % | 46 % |
| InSight | 14 % | 85 % | 0 % |

El kit lo dice así: «ninguna página se leyó íntegra; se trabajó con resúmenes». Y al investigar 30 eventos de Opportunity, los dossiers cuestionaron
varios datos del v0 (hay una tabla de 15 casos en [`MAPA_DEL_PROCESO.md`](MAPA_DEL_PROCESO.md), §6.1). **Por eso existe la Fase 2:** el v0 sirve para *elegir*
y la Fase 2 para *afirmar*.

### 3.7 Cómo se haría en nuestro entorno *(propuesta, sin validar)*

El kit se escribió para una sesión de Claude con búsqueda web, lectura de páginas y subagentes, con rutas como `/home/claude/`. En nuestro entorno hay dos formas de
ejecutar los mismos pasos:

| Opción | Cómo | Ventajas | Riesgos |
|---|---|---|---|
| **A. En una sesión de Claude Code** | Seguir la guía a mano: ficha de alcance, mapa de fuentes, lanzar subagentes con los prompts del Apéndice D de la guía, y usar `construir_mision.py` y `validar_mision.py`. | Es lo que describe el kit; no hay que construir nada. | Depende de una sesión interactiva; el costo y el tiempo no están medidos. |
| **B. Un ejecutor automático** | Un script que haga lo mismo con nuestras herramientas (búsqueda, lectura de páginas, NTRS) y el SDK, con los prompts del kit, y que llame a los dos scripts del kit. | Se puede lanzar con un comando, en paralelo y con tope de gasto, como `procesar_lote.py`. Además nuestras herramientas leen el **texto completo** de las páginas, no un resumen, así que el v0 saldría mejor verificado. | Hay que construirlo y probarlo. |

Ambas producen el mismo resultado: `timelines_v0/linea_de_tiempo_<id>.json` validado con **0 problemas**.

**Misiones de Marte candidatas según el kit** (a verificar): Mars Pathfinder y Sojourner, Viking 1 y 2, Phoenix, Mars Polar Lander y Deep Space 2, y las activas
Curiosity y Perseverance (con fecha de corte). Spirit, Ingenuity e InSight ya tienen v0.

---

## 4. La compuerta: la pregunta del número N

Entre la Fase 1 y la Fase 2 el flujo **se detiene y pregunta**. No arranca ningún procesamiento hasta recibir el valor de N.

**Qué debería mostrar para que se pueda decidir** *(propuesta)*:

- Resumen del JSON base: eventos por fase y por categoría, cuántos tienen respaldo oficial, cuántos son «discutidos».
- Una **sugerencia de N**: en Opportunity elegimos 20 de 81 (≈ 25 %); una regla razonable es ≈ 25 % de los eventos, entre 20 y 30.
- **Costo y tiempo estimados** para cada opción (ver §7).
- Qué público se asume (5.º de secundaria) y qué proveedor de modelos se usará, para confirmarlos.

**Ejemplo del mensaje:**

> «`spirit` tiene 80 eventos en 7 fases (66 con respaldo oficial o científico, 13 discutidos). ¿Cuántos eventos quieres en la historia?
> Sugerido: **20** (≈ 10 USD y ≈ 28 min con 3 en paralelo) o **30** (≈ 16 USD y ≈ 42 min). Público: 5.º de secundaria.»

Y se espera la respuesta. N es un **parámetro de la corrida**, no una constante.

---

## 5. Fase 2 · De N eventos a la historia

Es todo lo que ya hicimos con Opportunity, ordenado como debe correr. Cuatro pasos.

### 5.1 Elegir N eventos con potencial narrativo

**Objetivo.** Quedarse con N eventos que cuenten la misión de principio a fin y que un joven de 17 años entienda y recuerde.

**Lo que hicimos en Opportunity** *(validado, criterio cualitativo)*: 20 de 81. Revisando después qué se eligió frente a lo disponible:

| Qué miramos | Resultado en los 20 elegidos |
|---|---|
| **Cobertura de fases** | Las 7 fases están: origen 2 de 6, planificación 1 de 7, lanzamiento y viaje 1 de 4, **aterrizaje 1 de 1**, operaciones 11 de 51, fin de misión 3 de 10, legado 1 de 2. |
| **Proporción** | 11 de 20 vienen de «operaciones» (55 %): es donde ocurre la mayor parte de la misión. |
| **Variedad de tipos** | Orígenes, hitos, ciencia (4), problemas (2), operación (3) y cierre (3). |
| **Fuentes** | 19 de 20 con respaldo oficial o científico; mediana de 2 fuentes oficiales o científicas por evento (frente a 1 en el total). |
| **Temas discutidos** | Solo 5 de los 14 eventos marcados «discutido». |
| **Arco en el tiempo** | 12 años distintos entre 1987 y 2026, de la idea al legado. |
| **Actos** | 5: la idea · el viaje · el agua · los años extra · la tormenta y el adiós. |

**Cómo hacerlo repetible** *(propuesta, sin validar)*:

1. **Prefiltro objetivo (un script):** por evento, fase, categoría, respaldo, si es «discutido», número de fuentes oficiales o científicas y si trae fecha precisa.
2. **Calificación narrativa (modelo o persona), de 0 a 3 por criterio:**

   | Criterio | Pregunta |
   |---|---|
   | Tensión o riesgo | ¿Había algo en juego, con posibilidad de fallar? |
   | Descubrimiento o sorpresa | ¿Se aprendió algo nuevo o inesperado? |
   | Factor humano | ¿Hay personas, decisiones, perseverancia o emoción? |
   | Claridad para 17 años | ¿Se entiende sin conocimientos técnicos previos? |
   | Potencial visual | ¿Se puede ilustrar o animar con una escena clara? |
   | Lugar en el arco | ¿Conecta con lo anterior y lo siguiente? |

3. **Equilibrar** por fases y actos, sin forzar proporciones.
4. **Reservar margen:** unos eventos de más (por ejemplo N + 20 %), porque algunos se caerán al conciliar.
5. **Revisión humana** de la lista final.

**Salida:** `historia_<misión>.json` con los N ids, su acto y la razón.

### 5.2 Investigar los N eventos con el agente (en paralelo)

**Objetivo.** Convertir cada evento del JSON base en un **dossier verificado**. Es el paso más probado (30 eventos).

| Pieza | Qué hace |
|---|---|
| Herramientas gratis | Búsqueda web (DuckDuckGo), lectura de páginas (incluidas las que usan JavaScript) e informes técnicos de NASA (NTRS). |
| **Fuentes oficiales primero** | El prompt exige priorizar NASA/JPL y fuentes científicas; la prensa solo como apoyo. |
| **Citas verificadas por código** | Cada dato lleva URL y una frase literal; el programa comprueba que esa frase aparece en el texto leído. Si no, el dato pasa a «no verificado». |
| **Fuentes clasificadas** | Oficial NASA/JPL, científica, prensa o comunitaria. |
| **Contradicciones y huecos** | Si dos fuentes difieren se anota; lo que no se confirma va a `huecos`. |
| **Sin imágenes** | Solo propone `ideas_visuales`. |
| **Revisión** *(con Bedrock)* | Segunda pasada con un modelo más potente (Opus) que quita lo mal respaldado y añade discrepancias frente al v0. |
| **Paralelo y seguridad** | `procesar_lote.py --paralelo 3`: 3 eventos a la vez, **tope de gasto**, corte tras 3 fallos seguidos, no repite eventos ya hechos y se puede retomar. |

```
python procesar_lote.py --archivo <timelines_v0/linea_de_tiempo_misión.json> --ids opp001,opp005,… --paralelo 3 --tope-usd 12
```

**Salida por evento:** `dossier.json` (datos con cita y URL, no verificados, fuentes nuevas, contradicciones, huecos, ideas visuales, relato), `dossier.md` y `metricas.json`.
**Resultado con Opportunity:** 30 dossiers, 386 datos verificados y 67 sin verificar; 10 eventos en 14 minutos con 3 en paralelo, sin fallos.

**Para otra misión:** los prompts `investigador.md` y `revisor.md` dicen «el rover Opportunity». El código no depende de la misión (`agente.py` acepta cualquier JSON con
`eventos`), así que basta con hacer los prompts neutros. **No lo hemos probado todavía con Spirit, Ingenuity ni InSight.**

### 5.3 Conciliar: validar lo encontrado

**Objetivo.** Decidir, evento por evento, qué se confirma del v0, qué se corrige y qué se descarta.

| Señal del dossier | Qué hacer |
|---|---|
| `contradicciones` | Decidir qué valor usar, o contar la discrepancia. Si choca con el v0, corregir el evento. |
| `huecos` | Si lo que el v0 afirma no se confirmó, **no entra** al relato. |
| `datos_no_verificados` | No usar. Si son más de un tercio, el dossier es frágil: repetir con `--forzar` o cambiar el evento. |
| Sin fuente oficial ni científica | Candidato a reemplazo. |

Ejemplos reales: `opp001` (1987 es el inicio de cuatro propuestas, no la aprobación), `opp008` (la reunión del 16 de julio y la frase de Goldin no se confirmaron),
`opp015` (el corcho «se despegó», la «válvula» no se confirmó), `opp033` (la rueda operó con restricciones, no «deshabilitada»), `opp070` (14 de 20 datos sin verificar).

**Salida:** una lista de correcciones por evento y los **hechos validados**.
> **Falta una herramienta** (propuesta): un script que recorra los N dossiers y arme la tabla de contradicciones, huecos y datos sin verificar por evento.

### 5.4 Escribir la historia

**Qué lleva cada evento:** `gancho`, relato (que sale de `contexto_ampliado` y `datos_reales` del dossier), `escena_visual` y `emocion` (sin imágenes reales), `elementos`,
hechos con sus fuentes, y `solidez_fuentes` y `discutido`. Los N eventos se agrupan en **actos** (en Opportunity, 5).

**Reglas.** Solo lo verificado; lo discutido se cuenta como discusión; sin diálogos ni emociones atribuidas a personas reales; tono claro y cercano.

**Lo que hicimos y su límite.** La historia de Opportunity (`historia_opportunity.json`) se escribió **antes** de investigar, con los datos del v0, y todavía lleva afirmaciones
que luego se cuestionaron. El flujo correcto es **investigar y conciliar primero, redactar después**: hay que regenerarla desde los dossiers.

**Salida:** `historia_<misión>.json` y un visor por actos.

---

## 6. Parámetros de una corrida

| Parámetro | Ejemplo | Fase |
|---|---|---|
| Misión (`id`) | `spirit` | 1 |
| Ficha de alcance (solo si hay que construir el v0) | prefijo `spi`, sol cero 2004-01-04, offset 1 | 1 |
| **N** (número de eventos) | 20 o 30 | compuerta |
| Margen de reserva | 20 % | 2 |
| Público e idioma | 5.º de secundaria, español | 2 |
| Proveedor de modelos | plan · API · Bedrock | 2 |
| Tope de gasto y paralelismo | 12 USD · 3 | 2 |
| Número de actos | 5 | 2 |

---

## 7. Cuánto tarda y cuánto cuesta

**Fase 2** (medido con Opportunity, Bedrock con Sonnet 4.6 + revisión con Opus 4.6; costo de referencia a precio de lista):

| Dato medido | Valor |
|---|---|
| Costo por evento | 0,3 a 0,7 USD (promedio ≈ 0,52) |
| Tiempo por evento, en serie | ≈ 3,9 minutos (13 eventos en 50,5 min) |
| Tiempo por evento, 3 en paralelo | ≈ 1,4 minutos (10 eventos en 14 min) |

Estimación *(extrapolada, no medida)* para la Fase 2:

| N | Costo aproximado | En serie | 3 en paralelo |
|---|---|---|---|
| 20 | ≈ 10 USD | ≈ 78 min | ≈ 28 min |
| 30 | ≈ 16 USD | ≈ 117 min | ≈ 42 min |

**Fase 1:** **no está medida.** El kit solo da un orden de magnitud de trabajo («una línea de tiempo de 60-140 eventos con 5 agentes y una ronda de huecos»), sin costo ni tiempo.
Habría que medirlo la primera vez que se construya una misión nueva. Si el v0 ya existe, el costo de la Fase 1 es cero.

---

## 8. Qué ya existe y qué falta construir

| Fase / paso | Ya existe | Falta |
|---|---|---|
| **1 · ¿Existe el v0?** | 4 JSON base en `timelines_v0/` | Script `resolver_base.py` que lo compruebe y decida *(propuesta)* |
| **1 · Construir el v0** | Kit completo: guía, 2 esquemas y 2 scripts **probados** | Un ejecutor propio (opción B de §3.7) y medirlo |
| Compuerta | — | La pregunta de N con costo y tiempo estimados |
| **2.1 · Elegir N** | Selección manual para Opportunity (`story/build_historia.py`) | Prefiltro y rúbrica en un script; builder parametrizado por misión y por N |
| **2.2 · Investigar** | Agente, lotes, **paralelismo**, costos y 44 pruebas | Prompts neutros a la misión; probar con otra misión |
| **2.3 · Conciliar** | El análisis hecho a mano | Script `conciliar` y regla de «dossier frágil» |
| **2.4 · Escribir** | `historia_opportunity.json` y su visor | Constructor que lea los dossiers y no la línea de tiempo |
| Transversal | Pruebas gratis y documentación | Versionar `timelines_v0/` y el kit en git |

---

## 9. Reglas que no se rompen

1. **No se inventa nada.** Lo que se cuenta sale de datos verificados; si no se pudo confirmar, no se afirma.
2. **Un dato es «verificado» solo si su cita literal aparece en el texto leído** (lo comprueba el código, no el modelo).
3. **Fuentes oficiales y científicas primero;** la prensa es apoyo y se marca como tal; las comunitarias solo como pista.
4. **El JSON base es un mapa, no la verdad.** Si un dossier lo contradice, manda el dossier.
5. **Si el JSON base existe, no se vuelve a investigar;** si no existe, se construye con el kit y se valida con **0 problemas** antes de seguir.
6. **Se pregunta N antes de procesar,** y no se procesa nada hasta tener la respuesta.
7. **Sin imágenes** en la investigación; solo ideas de escenas.
8. **Un evento ya investigado no se repite** sin pedirlo (`--forzar`, que conserva la versión anterior).
9. **Se cuenta lo discutido como discusión,** no se elige en silencio.
10. **Cada versión nueva va en archivos nuevos:** no se pisa lo anterior.
11. **Tono para 17 años,** claro y cercano, sin simplificar hasta falsear.

---

## 10. De aquí a las skills

Una skill **orquestadora** que haga las dos fases y la pregunta de N, más una skill por bloque:

| Skill | Cubre | Estado de lo que hay detrás |
|---|---|---|
| `mars-story-pipeline` (orquestadora) | Las dos fases, la compuerta de N y los parámetros | este documento |
| `mars-mission-base-research` | **Fase 1**: comprobar `timelines_v0/` y, si falta, construir y validar el JSON base con el kit | kit **probado**; ejecutor propio por construir |
| `mars-story-event-selection` | Fase 2.1 | manual; rúbrica por construir |
| `mars-event-research` | Fase 2.2 | **validada** (agente, lotes, paralelo, costos) |
| `mars-dossier-reconciliation` | Fase 2.3 | manual; script por construir |
| `mars-story-writing` | Fase 2.4 | hecha antes de investigar; por rehacer desde los dossiers |

El detalle de las skills del proyecto completo (incluido el juego) está en [`MAPA_DEL_PROCESO.md`](MAPA_DEL_PROCESO.md), §11.

---

## 11. Lo que necesito que revises

Marca cada punto con **Aprobado**, **Corregir** (con una nota) o **Descartar**.

- [ ] **1.** ¿El §1 («Lo que entendí») refleja bien las dos fases y la compuerta de N?
- [ ] **2.** ¿La comprobación de «¿existe el v0?» por nombre de archivo (`timelines_v0/linea_de_tiempo_<id>.json`) te parece bien?
- [ ] **3.** Para construir un v0 nuevo, ¿qué opción prefieres: **A** (seguir el kit en una sesión de Claude Code) o **B** (un ejecutor automático con nuestras herramientas)? Mi recomendación es empezar por A y construir B después de medir el costo real.
- [ ] **4.** ¿La compuerta de N muestra lo que necesitas para decidir (resumen del v0, N sugerido ≈ 25 %, costo y tiempo)? ¿Qué más quieres ver?
- [ ] **5.** ¿La **rúbrica de selección** (6 criterios de 0 a 3, equilibrio por fases, margen de reserva del 20 %) es lo que quieres?
- [ ] **6.** ¿Probamos el flujo con **otra misión** (Spirit ya tiene v0) antes de convertirlo en skill?
- [ ] **7.** ¿Quieres probar la **Fase 1** construyendo una misión que no tenga v0 (por ejemplo Mars Pathfinder), para medir su costo y tiempo?
- [ ] **8.** ¿La división en **6 skills** (orquestadora + Fase 1 + 4 de la Fase 2) te parece bien?
- [ ] **9.** ¿Se versionan `timelines_v0/` y el kit en el repo?
